// Render the film: headless Chromium paints every frame, ffmpeg encodes.
//   node render.mjs stills 8,20,40          → out/stills/*.png
//   node render.mjs sheet  [step=1]         → out/sheet.jpg (contact sheet, one frame per step seconds)
//   node render.mjs video  [--workers 3]    → out/video.mp4 + out/subtitles.srt
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'out', (process.argv.find((a) => a.startsWith('--film=')) || '--film=1').split('=')[1]);
const FPS = 30;
const mode = process.argv[2] || 'video';
const arg = process.argv[3];
const workers = Number((process.argv.find((a) => a.startsWith('--workers=')) || '--workers=3').split('=')[1]);
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const FILM = (process.argv.find((a) => a.startsWith('--film=')) || '--film=1').split('=')[1];
const URLBASE = `http://127.0.0.1:${server.address().port}/index.html?render&film=${FILM}`;

const browser = await chromium.launch();
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URLBASE);
  await page.waitForFunction('window.READY === true', null, { timeout: 60000 }).catch(() => {});
  if (errors.length) { console.error('PAGE ERRORS:\n' + errors.join('\n')); process.exit(1); }
  return page;
}
async function frame(page, t, file, type = 'jpeg') {
  await page.evaluate((t) => window.renderAt(t), t);
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 92 } : {}),
    clip: { x: 0, y: 0, width: 1920, height: 1080 } });
}

const page = await openPage();
const DUR = await page.evaluate('window.DUR');
const SUBS = await page.evaluate('window.SUBS');
console.log(`duration ${DUR.toFixed(2)} s, ${SUBS.length} subtitles`);

if (mode === 'stills') {
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  for (const t of (arg || '10').split(',').map(Number))
    await frame(page, t, path.join(OUT, 'stills', `t${t.toFixed(2)}.png`), 'png');
} else if (mode === 'sheet') {
  const step = Number(arg || 2);
  const dir = path.join(OUT, 'sheet');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  let i = 0;
  for (let t = 0; t < DUR; t += step) await frame(page, t, path.join(dir, `${String(i++).padStart(4, '0')}.jpg`));
  const r = spawnSync('montage', [path.join(dir, '*.jpg'), '-tile', '6x', '-geometry', '480x270+3+3',
    '-pointsize', '18', '-set', 'label', '%f', path.join(OUT, 'sheet.jpg')]);
  if (r.status) console.error(String(r.stderr));
} else {
  // Lossless PNG frames are piped to ffmpeg in order (no intermediate JPEG), encoded at high quality.
  fs.rmSync(path.join(OUT, 'frames'), { recursive: true, force: true });
  const N = Math.round(DUR * FPS);
  const pages = [page];
  for (let w = 1; w < workers; w++) pages.push(await openPage());
  const mp4 = path.join(OUT, 'video.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res) => ff.on('close', res));
  const ready = new Map();
  let next = 0, written = 0, done = 0;
  const t0 = Date.now();
  async function flush() {
    while (ready.has(written)) {
      const buf = ready.get(written); ready.delete(written); written++;
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
  }
  let flushing = Promise.resolve();
  await Promise.all(pages.map(async (p) => {
    while (true) {
      const i = next++;
      if (i >= N) break;
      while (ready.size > 90) await new Promise((r) => setTimeout(r, 20));   // keep memory bounded
      await p.evaluate((t) => window.renderAt(t), i / FPS);
      ready.set(i, await p.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } }));
      flushing = flushing.then(flush);
      if (++done % 300 === 0) console.log(`${done}/${N} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
  }));
  await flushing; await flush();
  ff.stdin.end();
  if ((await ffDone) !== 0) { console.error('ffmpeg failed'); process.exit(1); }
  // subtitles
  const ts = (s) => {
    const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60;
    const sec = Math.floor(ms / 1000) % 60, r = ms % 1000;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(r).padStart(3, '0')}`;
  };
  fs.writeFileSync(path.join(OUT, 'subtitles.srt'),
    SUBS.map((s, i) => `${i + 1}\n${ts(s.t0)} --> ${ts(s.t1)}\n${s.text}\n`).join('\n'));
  console.log(`wrote ${mp4} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close();
server.close();
