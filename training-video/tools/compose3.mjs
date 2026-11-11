// Draw the new skill's title, tag and description onto skill_after_base.png → skill_after.png,
// with the same font the film uses (Noto Sans SC), in headless Chromium.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const b64 = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, p)).toString('base64');
const fontCss = fs.readFileSync(path.join(ROOT, 'node_modules/@fontsource/noto-sans-sc/700.css'), 'utf8')
  + fs.readFileSync(path.join(ROOT, 'node_modules/@fontsource/noto-sans-sc/400.css'), 'utf8');
const css = fontCss.replace(/url\(\.\/files\/([^)]+)\)/g, (m, f) => {
  const p = path.join(ROOT, 'node_modules/@fontsource/noto-sans-sc/files', f);
  return fs.existsSync(p) ? `url(data:font/${f.endsWith('woff2') ? 'woff2' : 'woff'};base64,${fs.readFileSync(p).toString('base64')})` : m;
});
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<style>${css}</style><canvas id=c></canvas>`);
const out = await page.evaluate(async ({ base, src23 }) => {
  const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
  const [im, i23] = await Promise.all([load(base), load(src23)]);
  await document.fonts.load('700 15px "Noto Sans SC"', 'weather_query自定义');
  await document.fonts.load('400 12px "Noto Sans SC"', '查询指定城市的天气信息');
  const c = document.getElementById('c'); c.width = im.width; c.height = im.height;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  g.fillStyle = '#1F2329'; g.font = '700 15.5px "Noto Sans SC"'; g.textBaseline = 'middle';
  g.fillText('weather_query', 792, 342);
  const w = g.measureText('weather_query').width;
  g.drawImage(i23, 388, 556, 52, 22, 792 + w + 6, 331, 52, 22);     // 自定义 tag from img23
  g.fillStyle = '#4E5969'; g.font = '400 12.5px "Noto Sans SC"';
  g.fillText('查询指定城市的天气信息', 802, 492);
  return c.toDataURL('image/png');
}, { base: b64('assets/skill_after_base.png'), src23: b64('assets/img23.png') });
fs.writeFileSync(path.join(ROOT, 'assets/skill_after.png'), Buffer.from(out.split(',')[1], 'base64'));
await browser.close();
console.log('wrote assets/skill_after.png');
