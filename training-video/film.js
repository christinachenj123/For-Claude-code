// 苏电智伴 培训视频 第 1 支：下载、安装登录
// Every frame is a pure function of t (seconds). No timers, no state between frames.

const W = 1920, H = 1080;
const FONT = '"Noto Sans SC", "WenQuanYi Zen Hei", sans-serif';

// ---------- palette ----------
const C = {
  bg: '#E8EDF2',
  ink: '#1E2933',
  sub: '#5B6875',
  green: '#00897B',      // 国网绿 accent for every highlight
  greenLight: '#5EE0C4', // accent on dark backgrounds
  tipBg: '#FFF6D6',
  tipLine: '#E9B949',
};

// ---------- layout ----------
const STAGE = { x: 40, y: 84, w: 1840, h: 820, r: 18 };   // the "screen" area
const SUBY = 990;                                          // subtitle centre line

// Browser window inside the stage (world = stage pixels)
const BR = { x: 244, y: 45, s: 1.0, chrome: 78, cw: 1352, ch: 651 };   // 1:1 for sharp screenshots
// Login window on the desktop
const LG = { x: 411, y: 150, s: 1.45 };
// Desktop icon
const ICON = { x: 70, y: 40, size: 78 };

// img5 (platform page, menu open) aligned onto img4's pop-up, measured from button positions
const A5 = { x: 154.0, y: 104.7, s: 0.7796 };
const p5to4 = (x, y) => [A5.x + x * A5.s, A5.y + y * A5.s];
const IMG3S = 1352 / 1256; // img3 is scaled to the content width
const HD = 2;               // assets/hd holds 2x screenshots
// drawImage in logical (1x) pixels: (x, y) | (x, y, w, h) | (sx, sy, sw, sh, dx, dy, dw, dh)
function D(g, im, ...a) {
  if (a.length === 2) return g.drawImage(im, a[0], a[1], im.width / HD, im.height / HD);
  if (a.length === 4) return g.drawImage(im, ...a);
  return g.drawImage(im, a[0] * HD, a[1] * HD, a[2] * HD, a[3] * HD, a[4], a[5], a[6], a[7]);
}

// ---------- easing ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const backOut = (k) => { const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const prog = (t, t0, d) => clamp((t - t0) / d);
const win = (t, t0, t1, fin = 0.25, fout = 0.25) =>
  Math.min(clamp((t - t0) / fin), clamp((t1 - t) / fout));

// ---------- reading time ----------
// Training pace: chars / 4 + 1.5 s, never under 2.5 s. Latin letters count as half.
function readTime(text) {
  let n = 0;
  for (const ch of text.replace(/[【】]/g, '')) n += /[\x00-\x7F]/.test(ch) ? 0.5 : 1;
  return Math.max(2.5, n / 4 + 1.5);
}

// =====================================================================
// Timeline
// =====================================================================
const SUBS = [];          // {t0, t1, text}, in film time
const CARDS = [];         // section header cards
const TIPS = [];          // yellow tip cards
const BADGES = [];        // step numbers: {t0, t1, n, at: ()=>[x,y]}
const FOCUS = [];         // spotlight: {t0, t1, rect: [x1,y1,x2,y2], space}
const CLICKS = [];        // {t, space, x, y}
const CAM = [];           // camera keys: {t, d, cx, cy, z}
const CUR = [];           // cursor keys: {t, d, space, x, y}  (moves to x,y over d)
const STEP = [];          // progress bar: {t, i}

let T = 0;
function say(text, minDur = 0) {
  const d = Math.max(readTime(text), minDur);
  SUBS.push({ t0: T, t1: T + d, text });
  const s = T;
  T += d;
  return s;
}
const pause = (d) => { T += d; };
const cam = (t, d, cx, cy, z) => CAM.push({ t, d, cx, cy, z });
const cur = (t, d, space, x, y) => CUR.push({ t, d, space, x, y });
const click = (t, space, x, y) => CLICKS.push({ t, space, x, y });

// world helpers for cameras
const brC = (x, y) => [BR.x + x * BR.s, BR.y + (BR.chrome + y) * BR.s];  // content px → world
const brU = (x, y) => [BR.x + x * BR.s, BR.y + y * BR.s];                // window units → world
const lgP = (x, y) => [LG.x + x * LG.s, LG.y + y * LG.s];
const WCX = 920, WCY = 410;                                              // world centre

// --- scenes, in seconds (all computed) ---
const tTitle = 0;
T = 7.2;
const tStageIn = 6.6;
const PORTAL = 'http://msa.js.sgcc.com.cn:6001/szhmh';   // 数字化门户地址
cam(0, 0, WCX, WCY, 1);
cur(0, 0, 'world', 1500, 700);

// Intro paragraph
let s = say('苏电智伴IM客户端可从数字化门户登录进入后下载，');
cam(s + 0.3, 15.5, WCX, WCY - 30, 1.07);
s = say('也可通过统一智能中枢微门户平台直接下载，两种方式任选其一。');
TIPS.push({ t0: s + 1.6, t1: T + 0.3, text: '两种方式任选其一' });
pause(1.0);

// ---- 方式一 ----
let c0 = T;
CARDS.push({ t0: c0, t1: c0 + 3.0, tag: '方式一', title: '从数字化门户登录进入下载' });
STEP.push({ t: c0 + 0.4, i: 0 });
T += 3.4;

s = say('（1）登录内网门户，进入数字化门户首页，');
cur(s + 0.8, 1.4, 'content', 560, 120);
cam(s + 0.5, 2.5, ...brC(676, 300), 1.08);

{
  s = say('点击【苏电智伴】卡片。', 4.8);
  const card = [612 * IMG3S, 91 * IMG3S, 924 * IMG3S, 435 * IMG3S];
  const [cx, cy] = [(card[0] + card[2]) / 2, (card[1] + card[3]) / 2];
  BADGES.push({ t0: s + 0.3, t1: T, n: 1, space: 'content', x: card[0], y: card[1] });
  FOCUS.push({ t0: s + 0.3, t1: s + 2.5, space: 'content', rect: card });
  cam(s + 0.3, 1.2, ...brC(cx, cy - 20), 1.3);
  cur(s + 0.8, 1.2, 'content', cx - 10, cy - 30);
  click(s + 2.2, 'content', cx - 10, cy - 30);
  var tModal = s + 2.45;
  cam(s + 2.8, 1.2, ...brC(676, 330), 1.02);
}

{
  s = say('（2）门户内弹出苏电智伴·通用智能体平台页面，');
  FOCUS.push({ t0: s + 0.4, t1: T - 0.2, space: 'content', rect: [115, 72, 1222, 645] });
  cur(s + 1.0, 1.2, 'content', 860, 210);
}

{
  s = say('点击【下载客户端】按钮。', 5.0);
  const b = [542, 320, 662, 369];
  BADGES.push({ t0: s + 0.3, t1: T, n: 2, space: 'content', x: b[0], y: b[1] });
  FOCUS.push({ t0: s + 0.3, t1: s + 2.4, space: 'content', rect: b });
  cam(s + 0.3, 1.2, ...brC(602, 344), 1.55);
  cur(s + 0.8, 1.2, 'content', 598, 346);
  click(s + 2.2, 'content', 598, 346);
  var tMenu1 = s + 2.35;
  cam(s + 2.7, 1.2, ...brC(602, 400), 1.85);
}

{
  s = say('（3）在弹出的选项中，根据电脑操作系统');
  const m = [...p5to4(488, 346), ...p5to4(662, 460)];
  BADGES.push({ t0: s + 0.3, t1: T + 9.2, n: 3, space: 'content', x: m[0], y: m[1] });
  FOCUS.push({ t0: s + 0.3, t1: T + 9.0, space: 'content', rect: m });
  TIPS.push({ t0: s + 1.2, t1: T + 9.0, text: '根据电脑操作系统选择' });
}
{
  s = say('选择【Windows客户端】或【国产信创客户端】进行下载，', 8.5);
  const [wx, wy] = p5to4(560, 381), [gx, gy] = p5to4(560, 423);
  cur(s + 0.8, 1.0, 'content', wx, wy);
  var hoverRows1 = [
    { t0: s + 1.7, t1: s + 4.4, rect: [...p5to4(494, 362), ...p5to4(656, 401)] },
    { t0: s + 4.6, t1: s + 8.3, rect: [...p5to4(494, 404), ...p5to4(656, 443)] },
  ];
  cur(s + 4.0, 0.9, 'content', gx, gy);
}
{
  s = say('下载成功后根据提示一步一步安装。');
  cam(s + 0.5, 1.6, WCX, WCY, 1);
  cur(s + 0.6, 1.4, 'content', 900, 560);
}
pause(1.0);

// ---- 方式二 ----
c0 = T;
CARDS.push({ t0: c0, t1: c0 + 3.0, tag: '方式二', title: '通过统一智能中枢微门户平台下载' });
STEP.push({ t: c0 + 0.4, i: 1 });
T += 3.4;

{
  s = say('地址：http://agent.js.sgcc.com.cn', 8.0);
  var tAddrClick = s + 2.0, tType0 = s + 2.4, URL = 'http://agent.js.sgcc.com.cn';
  var tType1 = tType0 + URL.length * 0.075, tEnter = tType1 + 0.45, tLoad = tEnter + 0.25;
  cam(s + 0.4, 1.3, ...brU(560, 58), 1.75);
  cur(s + 0.9, 1.0, 'units', 420, 58);
  click(tAddrClick, 'units', 420, 58);
  FOCUS.push({ t0: s + 0.5, t1: tEnter + 0.2, space: 'units', rect: [150, 44, 1300, 72] });
  cam(tLoad + 0.2, 1.4, ...brC(676, 250), 1.08);
  cur(tLoad + 0.4, 1.0, 'content', 980, 140);
}
{
  s = say('点击【下载客户端】按钮，弹出选项，', 5.6);
  const b = [556, 214, 657, 247];
  BADGES.push({ t0: s + 0.3, t1: T + 10.5, n: 1, space: 'content', x: b[0], y: b[1] });
  FOCUS.push({ t0: s + 0.3, t1: s + 2.4, space: 'content', rect: b });
  cam(s + 0.3, 1.2, ...brC(606, 231), 1.6);
  cur(s + 0.8, 1.2, 'content', 603, 233);
  click(s + 2.2, 'content', 603, 233);
  var tMenu2 = s + 2.35;
  cam(s + 2.7, 1.2, ...brC(606, 290), 1.85);
  FOCUS.push({ t0: s + 2.6, t1: T + 10.3, space: 'content', rect: [544, 270, 672, 383] });
}
{
  s = say('根据实际情况选择版本下载，', 6.0);
  var hoverRows2 = [
    { t0: s + 1.0, t1: s + 2.6, rect: [550, 276, 666, 306] },
    { t0: s + 2.8, t1: s + 4.2, rect: [550, 309, 666, 339] },
    { t0: s + 4.4, t1: s + 5.9, rect: [550, 342, 666, 372] },
  ];
  cur(s + 0.6, 0.8, 'content', 600, 291);
  cur(s + 2.6, 0.6, 'content', 600, 324);
  cur(s + 4.2, 0.6, 'content', 600, 357);
}
{
  s = say('下载成功后根据提示一步一步安装。');
  cam(s + 0.5, 1.6, WCX, WCY, 1);
  cur(s + 0.6, 1.4, 'content', 900, 440);
}
pause(1.0);

// ---- 安装登录 ----
c0 = T;
CARDS.push({ t0: c0, t1: c0 + 3.0, tag: '安装登录', title: '安装成功后，登录客户端' });
STEP.push({ t: c0 + 0.4, i: 2 });
const tDesk = c0 + 0.6;   // browser minimises during the card
T += 3.4;

{
  s = say('安装成功后，双击【苏电IM】桌面图标，', 6.2);
  const ic = [ICON.x - 12, ICON.y - 10, ICON.x + ICON.size + 12, ICON.y + ICON.size + 40];
  FOCUS.push({ t0: s + 0.3, t1: s + 2.8, space: 'world', rect: ic });
  BADGES.push({ t0: s + 0.3, t1: s + 2.9, n: 1, space: 'world', x: ic[0], y: ic[1] });
  cam(s + 0.3, 1.2, 330, 220, 1.6);
  cur(s + 0.6, 1.3, 'world', ICON.x + ICON.size / 2 + 4, ICON.y + ICON.size / 2 + 6);
  click(s + 2.1, 'world', ICON.x + ICON.size / 2 + 4, ICON.y + ICON.size / 2 + 6);
  click(s + 2.3, 'world', ICON.x + ICON.size / 2 + 4, ICON.y + ICON.size / 2 + 6);
  var tLogin = s + 2.7;
  cam(s + 2.7, 1.3, ...lgP(470, 200), 1.25);
}
{
  s = say('输入统一权限用户名、密码登录。', 7.6);
  var tAcc = s + 1.4, tAccType = [s + 1.7, s + 2.9], tPw = s + 3.4, tPwType = [s + 3.7, s + 4.8];
  var tLoginClick = s + 6.0;
  cur(s + 0.5, 0.9, 'login', 470, 151);
  click(tAcc, 'login', 470, 151);
  cur(s + 3.0, 0.4, 'login', 470, 221);
  click(tPw, 'login', 470, 221);
  cur(s + 5.0, 0.8, 'login', 500, 305);
  click(tLoginClick, 'login', 500, 305);
  FOCUS.push({ t0: s + 4.9, t1: T, space: 'login', rect: [343, 287, 667, 325] });
}
pause(0.8);

// ---- 下一节 (no recap) ----
const tRecap = T;
const tNext = T;
T += 3.0;
const DUR_FILM = T + 0.6;
const DUR = DUR_FILM;       // used by the drawing code (film time)

// Whole-film speed: output time = film time / SPEED.
const SPEED = 1.2;
export const OUT_DUR = DUR_FILM / SPEED;
export const OUT_SUBS = SUBS.map((x) => ({ t0: x.t0 / SPEED, t1: x.t1 / SPEED, text: x.text }));

// =====================================================================
// Assets
// =====================================================================
const IMG = {};
const BGC = {};  // fill colours for the area below short pages
let img5masked;  // img5 with feathered edges
let iconImg;     // app icon cropped from the platform logo

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function sample(img, x, y) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(x * HD, y * HD, 1, 1).data;
  return `rgb(${d[0]},${d[1]},${d[2]})`;
}

let cv, ctx;
export async function setup() {
  cv = document.getElementById('c');
  ctx = cv.getContext('2d');
  for (const n of ['img3', 'img4', 'img5', 'img6', 'img6_closed', 'img7', 'img7_empty'])
    IMG[n] = await loadImg(`assets/hd/${n}.png`);
  BGC.img3 = sample(IMG.img3, 600, IMG.img3.height / HD - 3);
  BGC.img6 = sample(IMG.img6, 60, IMG.img6.height / HD - 2);

  // feathered img5
  const c = document.createElement('canvas'); c.width = IMG.img5.width; c.height = IMG.img5.height;
  const g = c.getContext('2d');
  g.drawImage(IMG.img5, 0, 0);
  g.globalCompositeOperation = 'destination-in';
  const f = 26 * HD;
  const gx = g.createLinearGradient(0, 0, c.width, 0);
  gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(f / c.width, '#000');
  gx.addColorStop(1 - f / c.width, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gx; g.fillRect(0, 0, c.width, c.height);
  const gy = g.createLinearGradient(0, 0, 0, c.height);
  gy.addColorStop(0, '#000'); gy.addColorStop(1 - f / c.height, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gy; g.fillRect(0, 0, c.width, c.height);
  img5masked = c;

  // icon: the platform logo from img5's header
  const ic = document.createElement('canvas'); ic.width = 88; ic.height = 80;
  ic.getContext('2d').drawImage(IMG.img5, 106 * HD, 8 * HD, 44 * HD, 40 * HD, 0, 0, 88, 80);
  iconImg = ic;

  // fonts: load every glyph the film uses
  const all = SUBS.map((s) => s.text).join('') + CARDS.map((c) => c.tag + c.title).join('') +
    TIPS.map((t) => t.text).join('') + ALLTEXT;
  await Promise.all(['400', '500', '700'].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, all)));
}
const ALLTEXT = '苏电智伴（IM）使用手册第三部分常用功能1、下载、安装登录2、会话区3、工作区本节回顾下一节' +
  '提示方式一方式二数字化门户新标签页统一智能中枢微门户平台苏电IM造的一站式AI智能体研发与http://agent.js.sgcc.com.cn' +
  '从数字化门户登录进入下载通过统一智能中枢微门户平台下载安装成功后，双击【苏电IM】桌面图标，输入统一权限用户名、密码登录' +
  '门户下载微门户下载回收站此电脑0123456789msa:/szhmh和';

// =====================================================================
// Camera, cursor and spaces
// =====================================================================
function camAt(t) {
  let cx = CAM[0].cx, cy = CAM[0].cy, z = CAM[0].z;
  for (const k of CAM) {
    if (t < k.t) break;
    const p = k.d ? ease(prog(t, k.t, k.d)) : 1;
    cx = lerp(cx, k.cx, p); cy = lerp(cy, k.cy, p); z = Math.exp(lerp(Math.log(z), Math.log(k.z), p));
  }
  return { cx, cy, z };
}
// world → screen
function W2S(cam, x, y) {
  return [STAGE.x + STAGE.w / 2 + (x - cam.cx) * cam.z, STAGE.y + STAGE.h / 2 + (y - cam.cy) * cam.z];
}
// any space → world
function toWorld(space, x, y) {
  if (space === 'content') return brC(x, y);
  if (space === 'units') return brU(x, y);
  if (space === 'login') return lgP(x, y);
  return [x, y];
}
function cursorAt(t) {
  let [x, y] = toWorld(CUR[0].space, CUR[0].x, CUR[0].y);
  for (const k of CUR) {
    if (t < k.t) break;
    const [tx, ty] = toWorld(k.space, k.x, k.y);
    const p = k.d ? ease(prog(t, k.t, k.d)) : 1;
    // a slight arc, like a hand moving a mouse
    const ax = -(ty - y) * 0.12 * Math.sin(Math.PI * p), ay = (tx - x) * 0.12 * Math.sin(Math.PI * p);
    x = lerp(x, tx, p) + ax; y = lerp(y, ty, p) + ay;
  }
  return [x, y];
}

// =====================================================================
// Drawing helpers
// =====================================================================
function rr(g, x, y, w, h, r, fresh = true) {
  if (fresh) g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function font(px, w = 400) { return `${w} ${px}px ${FONT}`; }

// Text with 【】 parts highlighted. Returns lines laid out within maxW.
function layoutRich(g, text, px, w, maxW) {
  g.font = font(px, w);
  const tokens = [];
  let hl = false;
  for (const ch of text) {
    if (ch === '【') { hl = true; tokens.push({ ch, hl: true }); continue; }
    if (ch === '】') { tokens.push({ ch, hl: true }); hl = false; continue; }
    tokens.push({ ch, hl });
  }
  // break into lines, preferring breaks after punctuation
  const lines = [[]]; let lw = 0;
  const total = tokens.reduce((a, t) => a + g.measureText(t.ch).width, 0);
  const target = total > maxW ? total / Math.ceil(total / maxW) : maxW;
  for (let i = 0; i < tokens.length; i++) {
    const tw = g.measureText(tokens[i].ch).width;
    const line = lines[lines.length - 1];
    line.push(tokens[i]); lw += tw;
    const punct = '，。、：；'.includes(tokens[i].ch);
    if (lw > target - 40 && (punct || lw > target + 40) && i < tokens.length - 2 && lw <= maxW) {
      lines.push([]); lw = 0;
    }
  }
  return lines.filter((l) => l.length).map((l) => ({ toks: l, w: l.reduce((a, t) => a + g.measureText(t.ch).width, 0) }));
}

// =====================================================================
// Browser window
// =====================================================================
function drawBrowser(g, t) {
  const u = BR.s;
  g.save();
  g.translate(BR.x, BR.y);
  g.scale(u, u);
  const ww = BR.cw, hh = BR.chrome + BR.ch;
  // shadow + frame
  g.save();
  g.shadowColor = 'rgba(20,35,50,0.28)'; g.shadowBlur = 40; g.shadowOffsetY = 14;
  rr(g, 0, 0, ww, hh, 10); g.fillStyle = '#DEE3E9'; g.fill();
  g.restore();
  g.save(); rr(g, 0, 0, ww, hh, 10); g.clip();
  // tab strip
  g.fillStyle = '#DEE3E9'; g.fillRect(0, 0, ww, 38);
  // window dots / controls (generic)
  g.fillStyle = '#9AA4AE';
  g.font = font(15); g.textBaseline = 'middle';
  g.fillText('—', ww - 120, 19); g.fillText('☐', ww - 80, 19); g.fillText('✕', ww - 38, 19);
  // tab
  const tab2 = t >= tLoad;
  const title = tab2 ? '苏电智伴·通用智能体平台' : '数字化门户';
  g.fillStyle = '#FFFFFF';
  rr(g, 12, 6, 240, 40, 8); g.fill();
  g.fillStyle = '#2E7CF6'; g.beginPath(); g.arc(34, 22, 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#33404C'; g.font = font(14); g.fillText(title, 50, 22);
  // toolbar
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 38, ww, 40);
  g.strokeStyle = '#E3E7EB'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 77.5); g.lineTo(ww, 77.5); g.stroke();
  g.fillStyle = '#7B8792'; g.font = font(18);
  g.fillText('←', 22, 58); g.fillText('→', 56, 58); g.fillText('↻', 92, 58);
  // address field
  const focused = t >= tAddrClick && t < tEnter + 0.1;
  rr(g, 150, 44, 1150, 28, 14);
  g.fillStyle = focused ? '#FFFFFF' : '#F1F3F5'; g.fill();
  if (focused) { g.strokeStyle = '#2E7CF6'; g.lineWidth = 2; g.stroke(); }
  g.font = font(15); g.fillStyle = '#33404C';
  let addr = '';
  if (t >= tLoad) addr = URL;
  else if (t >= tType0) addr = URL.slice(0, Math.floor((t - tType0) / 0.075) + 1);
  if (t < tAddrClick) {
    g.fillStyle = '#33404C'; g.fillText(PORTAL, 168, 59);
  } else if (t < tType0) {
    // selected old address
    g.fillStyle = '#B9D3FB'; g.fillRect(165, 49, g.measureText(PORTAL).width + 6, 20);
    g.fillStyle = '#33404C'; g.fillText(PORTAL, 168, 59);
  } else {
    g.fillText(addr, 168, 59);
    if (t < tEnter && Math.floor((t - tType0) * 2.2) % 2 === 0 || (t >= tType0 && t < tType1)) {
      const cw = g.measureText(addr).width;
      g.fillStyle = '#1E2933'; g.fillRect(170 + cw, 49, 1.5, 19);
    }
  }
  // content
  g.save();
  g.translate(0, BR.chrome);
  g.beginPath(); g.rect(0, 0, BR.cw, BR.ch); g.clip();
  drawContent(g, t);
  g.restore();
  g.restore();
  g.restore();
}

function drawPage(g, img, bg) {
  g.fillStyle = bg; g.fillRect(0, 0, BR.cw, BR.ch);
  g.drawImage(img, 0, 0);
}

function drawContent(g, t) {
  if (t < tEnter) {
    // 方式一: portal → pop-up → menu
    if (t < tModal + 0.45) {
      g.fillStyle = BGC.img3; g.fillRect(0, 0, BR.cw, BR.ch);
      g.drawImage(IMG.img3, 0, 0, IMG.img3.width / HD * IMG3S, IMG.img3.height / HD * IMG3S);
    }
    if (t >= tModal) {
      const k = prog(t, tModal, 0.45);
      // background of img4 (dimmed portal) fades in, pop-up scales from the card
      g.save(); g.globalAlpha = ease(k);
      D(g, IMG.img4, 0, 0);
      g.restore();
      if (k < 1) {
        // redraw the pop-up region with a scale-in on top
        const sc = lerp(0.9, 1, backOut(k));
        const mx = 668, my = 358;
        g.save(); g.globalAlpha = ease(k);
        g.translate(mx, my); g.scale(sc, sc); g.translate(-mx, -my);
        D(g, IMG.img4, 115, 72, 1107, 579, 115, 72, 1107, 579);
        g.restore();
      }
    }
    if (t >= tMenu1) {
      const k = prog(t, tMenu1, 0.3);
      g.save(); g.globalAlpha = easeOut(k);
      g.translate(A5.x, A5.y); g.scale(A5.s, A5.s);
      g.drawImage(img5masked, 0, 0, img5masked.width / HD, img5masked.height / HD);
      g.restore();
      drawHoverRows(g, t, hoverRows1);
    }
    if (t >= tEnter - 0.001 && t < tEnter) {}
    return;
  }
  // 方式二: blank while loading, then the micro-portal
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, BR.cw, BR.ch);
  if (t >= tLoad) {
    const k = easeOut(prog(t, tLoad, 0.5));
    g.save(); g.globalAlpha = k;
    drawImg6(g, false);
    g.restore();
    // loading bar
    if (t < tLoad + 0.6) {
      g.fillStyle = '#2E7CF6'; g.fillRect(0, 0, BR.cw * easeOut(prog(t, tEnter, 0.8)), 3);
    }
  }
  if (t >= tMenu2) {
    const k = prog(t, tMenu2, 0.28);
    const r = [538, 262, 680, 390];
    g.save();
    g.beginPath(); g.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]); g.clip();
    g.globalAlpha = easeOut(k);
    const sy = lerp(0.85, 1, easeOut(k));
    g.translate(0, r[1]); g.scale(1, sy); g.translate(0, -r[1]);
    D(g, IMG.img6, r[0], r[1], r[2] - r[0], r[3] - r[1], r[0], r[1], r[2] - r[0], r[3] - r[1]);
    g.restore();
    drawHoverRows(g, t, hoverRows2);
  }
}

function drawImg6(g) {
  g.fillStyle = BGC.img6; g.fillRect(0, 0, BR.cw, BR.ch);
  // let the page continue softly below the screenshot
  const h6 = IMG.img6.height / HD, w6 = IMG.img6.width / HD;
  D(g, IMG.img6, 0, h6 - 2, w6, 2, 0, h6, BR.cw, BR.ch);
  D(g, IMG.img6_closed, 0, 0);
  // the line of text the menu covered in the screenshot
  g.save();
  g.font = font(11.2, 400); g.fillStyle = '#3B3F48'; g.textBaseline = 'alphabetic';
  let x = 537.5;
  for (const ch of '造的一站式AI智能体研发与') {
    g.fillText(ch, x, 370.5);
    x += /[A-Z]/.test(ch) ? g.measureText(ch).width + 0.6 : 11.42;
  }
  g.restore();
}

function drawHoverRows(g, t, rows) {
  for (const r of rows) {
    const a = win(t, r.t0, r.t1, 0.15, 0.15);
    if (a <= 0) continue;
    g.save(); g.globalAlpha = a * 0.16; g.fillStyle = '#2E7CF6';
    rr(g, r.rect[0], r.rect[1], r.rect[2] - r.rect[0], r.rect[3] - r.rect[1], 6); g.fill();
    g.restore();
  }
}

// =====================================================================
// Desktop and login
// =====================================================================
function drawDesktop(g, t) {
  // wallpaper
  const gr = g.createLinearGradient(0, 0, STAGE.w, STAGE.h);
  gr.addColorStop(0, '#2C5F8A'); gr.addColorStop(0.55, '#3F86A8'); gr.addColorStop(1, '#7FC0C4');
  g.fillStyle = gr; g.fillRect(-400, -400, STAGE.w + 800, STAGE.h + 800);
  g.save(); g.globalAlpha = 0.12; g.fillStyle = '#FFFFFF';
  g.beginPath(); g.ellipse(1450, 760, 900, 300, -0.2, 0, Math.PI * 2); g.fill();
  g.restore();
  // icons
  drawDeskIcon(g, ICON.x, ICON.y + 130, null, '此电脑', t);
  drawDeskIcon(g, ICON.x, ICON.y + 260, null, '回收站', t);
  const sel = t >= tLogin - 0.6 && t < tLogin + 2;
  drawDeskIcon(g, ICON.x, ICON.y, iconImg, '苏电IM', t, sel);
  // taskbar
  g.fillStyle = 'rgba(16,28,40,0.72)'; g.fillRect(-400, STAGE.h - 46, STAGE.w + 800, 46);
}
function drawDeskIcon(g, x, y, img, label, t, selected = false) {
  const s = ICON.size;
  if (selected) { g.fillStyle = 'rgba(255,255,255,0.22)'; rr(g, x - 10, y - 8, s + 20, s + 40, 6); g.fill(); }
  if (img) {
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
    rr(g, x + 6, y + 4, s - 12, s - 12, 14); g.fillStyle = '#FFFFFF'; g.fill();
    g.restore();
    g.drawImage(img, x + 14, y + 13, s - 28, (s - 28) * 40 / 44);
  } else {
    g.fillStyle = 'rgba(255,255,255,0.85)';
    rr(g, x + 14, y + 10, s - 28, s - 30, 6); g.fill();
    g.fillStyle = 'rgba(40,70,100,0.5)'; g.fillRect(x + 22, y + 18, s - 44, s - 48);
  }
  g.fillStyle = '#FFFFFF'; g.font = font(17, 500); g.textAlign = 'center'; g.textBaseline = 'top';
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 4;
  g.fillText(label, x + s / 2, y + s - 6);
  g.shadowBlur = 0; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

function drawLogin(g, t) {
  if (t < tLogin) return;
  const k = prog(t, tLogin, 0.4);
  const im = IMG.img7_empty, iw = im.width / HD, ih = im.height / HD;
  g.save();
  const cx = LG.x + iw * LG.s / 2, cy = LG.y + ih * LG.s / 2;
  const sc = lerp(0.92, 1, backOut(k));
  g.globalAlpha = easeOut(k);
  g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
  g.translate(LG.x, LG.y); g.scale(LG.s, LG.s);
  g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, iw, ih); g.restore();
  D(g, im, 0, 0);
  // field focus
  const accFocus = t >= tAcc && t < tPw, pwFocus = t >= tPw && t < tLoginClick;
  for (const [on, y] of [[accFocus, 131], [pwFocus, 201]]) {
    if (!on) continue;
    g.strokeStyle = '#2E7CF6'; g.lineWidth = 1.5; rr(g, 343, y, 324, 38, 7); g.stroke();
  }
  // typed account (already blurred in the asset), revealed left to right
  if (t >= tAccType[0]) {
    const p = prog(t, tAccType[0], tAccType[1] - tAccType[0]);
    const w = Math.round(7 * p) / 7 * 82;
    if (w > 0) D(g, IMG.img7, 386, 137, w, 28, 386, 137, w, 28);
    if (accFocus && p < 1) { g.fillStyle = '#1E2933'; g.fillRect(392 + w * 0.85, 141, 1.2, 18); }
  }
  // password dots
  if (t >= tPwType[0]) {
    const p = prog(t, tPwType[0], tPwType[1] - tPwType[0]);
    const w = Math.round(11 * p) / 11 * 92;
    if (w > 0) D(g, IMG.img7, 390, 207, w, 27, 390, 207, w, 27);
  }
  // button press
  if (t >= tLoginClick && t < tLoginClick + 0.25) {
    g.fillStyle = 'rgba(0,0,0,0.12)'; rr(g, 343, 286, 324, 40, 6); g.fill();
  }
  g.restore();
}

// =====================================================================
// Stage overlays (in screen space)
// =====================================================================
function rectToScreen(cam, space, r) {
  const a = W2S(cam, ...toWorld(space, r[0], r[1]));
  const b = W2S(cam, ...toWorld(space, r[2], r[3]));
  return [a[0], a[1], b[0], b[1]];
}

function drawFocus(g, t, cam) {
  for (const f of FOCUS) {
    const a = win(t, f.t0, f.t1, 0.35, 0.35);
    if (a <= 0) continue;
    const [x1, y1, x2, y2] = rectToScreen(cam, f.space, f.rect);
    const pad = 10;
    g.save();
    // dim everything else
    g.beginPath();
    g.rect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    rr(g, x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2, 12, false);
    g.fillStyle = `rgba(14,26,38,${0.36 * a})`;
    g.fill('evenodd');
    // green ring
    g.lineWidth = 3; g.strokeStyle = `rgba(0,137,123,${a})`;
    g.shadowColor = 'rgba(0,160,140,0.6)'; g.shadowBlur = 12 * a;
    rr(g, x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2, 12); g.stroke();
    g.restore();
  }
}

const CIRCLED = ['①', '②', '③', '④', '⑤'];
function drawBadges(g, t, cam) {
  for (const b of BADGES) {
    const a = win(t, b.t0, b.t1, 0.3, 0.3);
    if (a <= 0) continue;
    const [x, y] = W2S(cam, ...toWorld(b.space, b.x, b.y));
    const k = backOut(prog(t, b.t0, 0.35));
    g.save();
    g.globalAlpha = a;
    g.translate(x - 12, y - 12); g.scale(k, k);
    g.fillStyle = C.green;
    g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 8;
    g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#FFFFFF'; g.font = font(26, 700); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(b.n), 0, 1);
    g.restore();
  }
}

function drawClicks(g, t, cam) {
  for (const c of CLICKS) {
    const k = prog(t, c.t, 0.5);
    if (t < c.t || k >= 1) continue;
    const [x, y] = W2S(cam, ...toWorld(c.space, c.x, c.y));
    g.save();
    g.strokeStyle = `rgba(0,137,123,${0.85 * (1 - k)})`; g.lineWidth = 4;
    g.beginPath(); g.arc(x, y, 8 + 34 * easeOut(k), 0, Math.PI * 2); g.stroke();
    g.fillStyle = `rgba(0,137,123,${0.25 * (1 - k)})`;
    g.beginPath(); g.arc(x, y, 8 + 22 * easeOut(k), 0, Math.PI * 2); g.fill();
    g.restore();
  }
}

function drawCursor(g, t, cam) {
  if (t < tStageIn + 1.2) return;
  const [wx, wy] = cursorAt(t);
  const [x, y] = W2S(cam, wx, wy);
  // press: shrink briefly
  let press = 1;
  for (const c of CLICKS) if (t >= c.t - 0.05 && t < c.t + 0.15) press = 0.86;
  const s = 1.35 * Math.sqrt(cam.z) * press;
  g.save();
  g.translate(x, y); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  g.beginPath();
  g.moveTo(0, 0); g.lineTo(0, 22); g.lineTo(5.2, 17); g.lineTo(9, 25.5); g.lineTo(12.6, 24); g.lineTo(8.9, 15.6); g.lineTo(15.6, 15.6);
  g.closePath();
  g.fillStyle = '#FFFFFF'; g.fill();
  g.shadowColor = 'transparent';
  g.lineWidth = 1.4; g.strokeStyle = '#111'; g.stroke();
  g.restore();
}

function drawTips(g, t) {
  for (const tp of TIPS) {
    const a = win(t, tp.t0, tp.t1, 0.4, 0.3);
    if (a <= 0) continue;
    const k = easeOut(prog(t, tp.t0, 0.5));
    g.save();
    g.font = font(30, 500);
    const tw = g.measureText(tp.text).width;
    const w = tw + 132, h = 74;
    const x = STAGE.x + STAGE.w - w - 28 + (1 - k) * 60, y = STAGE.y + 28;
    g.globalAlpha = a;
    g.shadowColor = 'rgba(60,40,0,0.22)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
    rr(g, x, y, w, h, 14); g.fillStyle = C.tipBg; g.fill();
    g.shadowColor = 'transparent';
    g.lineWidth = 2; g.strokeStyle = C.tipLine; g.stroke();
    g.fillStyle = C.tipLine; rr(g, x + 18, y + 20, 70, 34, 8); g.fill();
    g.fillStyle = '#5A3B00'; g.font = font(22, 700); g.textBaseline = 'middle';
    g.fillText('提示', x + 31, y + 38);
    g.fillStyle = '#4A3A10'; g.font = font(30, 500);
    g.fillText(tp.text, x + 106, y + 38);
    g.restore();
  }
}

function drawCards(g, t) {
  for (const c of CARDS) {
    const a = win(t, c.t0, c.t1, 0.4, 0.4);
    if (a <= 0) continue;
    const k = easeOut(prog(t, c.t0, 0.6));
    g.save();
    g.fillStyle = `rgba(14,26,38,${0.5 * a})`;
    rr(g, STAGE.x, STAGE.y, STAGE.w, STAGE.h, STAGE.r); g.fill();
    g.font = font(56, 700);
    const tw = g.measureText(c.title).width;
    const w = Math.max(tw + 140, 640), h = 210;
    const x = W / 2 - w / 2, y = STAGE.y + STAGE.h / 2 - h / 2 + (1 - k) * 30;
    g.globalAlpha = a;
    g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 40; g.shadowOffsetY = 12;
    rr(g, x, y, w, h, 20); g.fillStyle = '#FFFFFF'; g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = C.green; rr(g, x, y, 14, h, 7); g.fill();
    g.font = font(30, 700); g.textBaseline = 'middle';
    const tagW = g.measureText(c.tag).width + 40;
    rr(g, x + 70, y + 36, tagW, 48, 24); g.fillStyle = 'rgba(0,137,123,0.12)'; g.fill();
    g.fillStyle = C.green; g.fillText(c.tag, x + 90, y + 61);
    g.fillStyle = C.ink; g.font = font(56, 700);
    // reveal the title left to right
    const p = easeOut(prog(t, c.t0 + 0.25, 0.7));
    g.save(); g.beginPath(); g.rect(x + 66, y + 90, (tw + 10) * p, 100); g.clip();
    g.fillText(c.title, x + 70, y + 145);
    g.restore();
    g.restore();
  }
}

function drawSubtitle(g, t) {
  for (const s of SUBS) {
    const a = win(t, s.t0, s.t1, 0.22, 0.22);
    if (a <= 0) continue;
    const lines = layoutRich(g, s.text, 44, 500, 1560);
    const lh = 62;
    const boxW = Math.max(...lines.map((l) => l.w)) + 80, boxH = lines.length * lh + 34;
    const x = W / 2 - boxW / 2, y = SUBY - boxH / 2;
    g.save();
    g.globalAlpha = a;
    rr(g, x, y, boxW, boxH, 16); g.fillStyle = 'rgba(22,32,42,0.9)'; g.fill();
    g.font = font(44, 500); g.textBaseline = 'middle';
    lines.forEach((l, i) => {
      let cx = W / 2 - l.w / 2;
      const cy = y + 17 + lh * i + lh / 2;
      for (const tk of l.toks) {
        g.fillStyle = tk.hl ? C.greenLight : '#FFFFFF';
        g.fillText(tk.ch, cx, cy);
        cx += g.measureText(tk.ch).width;
      }
    });
    g.restore();
  }
}

const STEPS = ['方式一  门户下载', '方式二  微门户下载', '安装登录'];
function drawTopBar(g, t) {
  const a = clamp((t - tStageIn) / 0.6);
  if (a <= 0) return;
  g.save();
  g.globalAlpha = a;
  // chapter pill
  g.font = font(26, 700); g.textBaseline = 'middle';
  const label = '1、下载、安装和登录';
  const lw = g.measureText(label).width;
  rr(g, STAGE.x, 18, lw + 48, 50, 25); g.fillStyle = C.green; g.fill();
  g.fillStyle = '#FFFFFF'; g.fillText(label, STAGE.x + 24, 44);
  // progress steps
  let cur = -1;
  for (const s of STEP) if (t >= s.t) cur = s.i;
  g.font = font(22, 500);
  const widths = STEPS.map((s) => g.measureText(s).width + 44);
  const gap = 46;
  let x = STAGE.x + STAGE.w - widths.reduce((p, w) => p + w, 0) - gap * (STEPS.length - 1);
  STEPS.forEach((s, i) => {
    const done = i < cur, on = i === cur;
    if (i > 0) {
      g.strokeStyle = i <= cur ? C.green : '#B8C3CC'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x - gap + 8, 43); g.lineTo(x - 8, 43); g.stroke();
    }
    rr(g, x, 24, widths[i], 38, 19);
    g.fillStyle = on ? C.green : done ? 'rgba(0,137,123,0.14)' : 'rgba(255,255,255,0.7)'; g.fill();
    g.fillStyle = on ? '#FFFFFF' : done ? C.green : '#8794A0';
    g.fillText(s, x + 22, 44);
    x += widths[i] + gap;
  });
  g.restore();
}

// =====================================================================
// Title and recap screens
// =====================================================================
const OUTLINE = ['1、下载、安装登录', '2、会话区', '3、工作区'];
function drawOutline(g, t, active, x0, y0, appear) {
  OUTLINE.forEach((s, i) => {
    const k = easeOut(prog(t, appear + i * 0.25, 0.5));
    if (k <= 0) return;
    const on = i === active;
    const y = y0 + i * 92;
    g.save(); g.globalAlpha = k * (on ? 1 : 0.55);
    g.translate((1 - k) * 30, 0);
    rr(g, x0, y, 620, 72, 14);
    g.fillStyle = on ? '#FFFFFF' : 'rgba(255,255,255,0.6)'; g.fill();
    if (on) { g.lineWidth = 3; g.strokeStyle = C.green; g.stroke(); }
    g.fillStyle = on ? C.ink : C.sub; g.font = font(34, on ? 700 : 500); g.textBaseline = 'middle';
    g.fillText(s, x0 + 32, y + 37);
    if (on) {
      rr(g, x0 + 620 - 118, y + 18, 92, 36, 18); g.fillStyle = C.green; g.fill();
      g.fillStyle = '#FFFFFF'; g.font = font(22, 700); g.fillText('本节', x0 + 620 - 94, y + 37);
    }
    g.restore();
  });
}

function drawTitle(g, t) {
  const a = Math.min(clamp(t / 0.5), clamp((tStageIn + 0.4 - t) / 0.6));
  if (a <= 0) return;
  g.save();
  g.globalAlpha = a;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  // soft brand shape
  g.fillStyle = 'rgba(0,137,123,0.07)';
  g.beginPath(); g.arc(1560, 260, 420, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(46,124,246,0.05)';
  g.beginPath(); g.arc(1700, 900, 360, 0, Math.PI * 2); g.fill();
  const k1 = easeOut(prog(t, 0.3, 0.8));
  g.globalAlpha = a * k1;
  g.fillStyle = C.green; g.fillRect(200, 300, 10, 150);
  g.fillStyle = C.sub; g.font = font(36, 500); g.textBaseline = 'alphabetic';
  g.fillText('苏电智伴（IM）使用手册', 240, 340);
  g.fillStyle = C.ink; g.font = font(92, 700);
  g.fillText('第三部分 常用功能', 236, 450);
  g.globalAlpha = a;
  drawOutline(g, t, 0, 240, 560, 2.2);
  g.restore();
}

function drawRecap(g, t) {
  const a = Math.min(clamp((t - tRecap) / 0.5), clamp((DUR - t) / 0.5));
  if (a <= 0) return;
  g.save();
  g.globalAlpha = a;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,137,123,0.07)';
  g.beginPath(); g.arc(1560, 260, 420, 0, Math.PI * 2); g.fill();
  const showNext = t >= tNext;
  if (tNext > tRecap && (!showNext || t < tNext + 0.4)) {
    const b = showNext ? 1 - clamp((t - tNext) / 0.4) : 1;
    g.globalAlpha = a * b;
    g.fillStyle = C.green; g.fillRect(200, 190, 10, 80);
    g.fillStyle = C.ink; g.font = font(64, 700); g.textBaseline = 'middle';
    g.fillText('本节回顾', 236, 232);
    const items = [
      ['方式一', '从数字化门户登录进入下载'],
      ['方式二', '通过统一智能中枢微门户平台下载'],
      ['安装登录', '双击【苏电IM】桌面图标，输入统一权限用户名、密码登录'],
    ];
    items.forEach(([tag, txt], i) => {
      const k = easeOut(prog(t, tRecap + 0.6 + i * 0.7, 0.5));
      if (k <= 0) return;
      const y = 360 + i * 150;
      g.save(); g.globalAlpha = a * b * k; g.translate((1 - k) * 40, 0);
      rr(g, 236, y, 1450, 116, 16); g.fillStyle = '#FFFFFF'; g.fill();
      g.fillStyle = C.green; g.beginPath(); g.arc(300, y + 58, 26, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFFFFF'; g.font = font(30, 700); g.textAlign = 'center';
      g.fillText(String(i + 1), 300, y + 59);
      g.textAlign = 'left';
      g.fillStyle = C.green; g.font = font(34, 700); g.fillText(tag, 352, y + 58);
      const tagW = g.measureText(tag).width;
      g.font = font(34, 500);
      let x = 352 + tagW + 36, hl = false;
      for (const ch of txt) {
        if (ch === '【') hl = true;
        g.fillStyle = hl ? C.green : C.ink;
        g.fillText(ch, x, y + 58); x += g.measureText(ch).width;
        if (ch === '】') hl = false;
      }
      g.restore();
    });
  }
  if (showNext) {
    const k = easeOut(prog(t, tNext + 0.3, 0.6));
    g.globalAlpha = a * k;
    g.fillStyle = C.sub; g.font = font(40, 500); g.textBaseline = 'alphabetic';
    g.fillText('下一节', 240, 400);
    drawOutline(g, t, 1, 240, 450, tNext + 0.4);
  }
  g.restore();
}

// =====================================================================
// Frame
// =====================================================================
export function renderAt(tOut) {
  const t = tOut * SPEED;
  const g = ctx;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.globalAlpha = 1;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  if (t >= tStageIn - 0.2 && t < tRecap + 0.6) {
    const cam = camAt(t);
    const appear = easeOut(clamp((t - tStageIn) / 0.8));
    g.save();
    g.globalAlpha = appear;
    g.translate(0, (1 - appear) * 30);
    drawTopBar(g, t);
    // stage
    g.save();
    g.shadowColor = 'rgba(20,35,50,0.18)'; g.shadowBlur = 30; g.shadowOffsetY = 8;
    rr(g, STAGE.x, STAGE.y, STAGE.w, STAGE.h, STAGE.r); g.fillStyle = '#CFD8E0'; g.fill();
    g.restore();
    g.save();
    rr(g, STAGE.x, STAGE.y, STAGE.w, STAGE.h, STAGE.r); g.clip();
    g.save();
    g.translate(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2);
    g.scale(cam.z, cam.z);
    g.translate(-cam.cx, -cam.cy);
    // world
    if (t >= tDesk) drawDesktop(g, t);
    else { g.fillStyle = '#D7DFE6'; g.fillRect(-600, -600, STAGE.w + 1200, STAGE.h + 1200); }
    if (t < tDesk + 0.7) {
      // browser (minimises into the taskbar when the desktop appears)
      const m = ease(prog(t, tDesk, 0.7));
      g.save();
      g.globalAlpha = 1 - m;
      const cx = WCX, cy = STAGE.h;
      g.translate(cx, cy * m * 0.6 + 0); g.scale(1 - 0.6 * m, 1 - 0.6 * m); g.translate(-cx, 0);
      drawBrowser(g, t);
      g.restore();
    }
    drawLogin(g, t);
    g.restore();
    drawFocus(g, t, cam);
    drawClicks(g, t, cam);
    drawBadges(g, t, cam);
    drawCursor(g, t, cam);
    drawTips(g, t);
    drawCards(g, t);
    g.restore();
    g.restore();
    drawSubtitle(g, t);
  }
  drawTitle(g, t);
  drawRecap(g, t);
}
