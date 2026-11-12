// Render one frame at the middle of every spotlight (and one just before it ends) for review.
// Usage: node tools/focus_check.mjs <film number>   → out/<n>/focus/*.jpg and out/<n>/focus_sheet*.jpg
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { spawnSync } from 'node:child_process'; import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILM = process.argv[2] || '3';
const OUT = path.join(ROOT, 'out', FILM, 'focus');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => server.listen(0, r));
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?render&film=${FILM}`);
await page.waitForFunction('window.READY === true');
const F = await page.evaluate(async (f) => (await import(`./film${f}.js`)).OUT_FOCUS, FILM);
let i = 0;
for (const f of F) {
  for (const [k, t] of [['a', (f.t0 + f.t1) / 2], ['b', f.t1 - 0.15]]) {
    await page.evaluate((t) => window.renderAt(t), t);
    await page.screenshot({ path: path.join(OUT, `${String(i).padStart(3, '0')}${k}_${t.toFixed(1)}s.jpg`), type: 'jpeg', quality: 80 });
  }
  i++;
}
await b.close(); server.close();
const files = fs.readdirSync(OUT).sort();
for (let p = 0; p * 36 < files.length; p++)
  spawnSync('montage', [...files.slice(p * 36, p * 36 + 36).map((x) => path.join(OUT, x)), '-tile', '6x', '-geometry', '400x225+2+2',
    '-pointsize', '15', '-set', 'label', '%t', path.join(ROOT, 'out', FILM, `focus_sheet${p + 1}.jpg`)]);
console.log(F.length, 'spotlights,', files.length, 'frames');
