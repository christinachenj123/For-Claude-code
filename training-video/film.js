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

// The recorded screen (1920x1080 screen pixels, "scr") inside the stage (world = stage pixels)
const SCR = { s: 0.735 };
SCR.x = (1840 - 1920 * SCR.s) / 2; SCR.y = (820 - 1080 * SCR.s) / 2;
const sp = (x, y) => [SCR.x + x * SCR.s, SCR.y + y * SCR.s];
const FPS_REC = 25;
// Login window on the desktop (screen pixels; img7 is 702x359)
const LG = { x: 486, y: 277, s: 1.35 };
// Desktop icon tile (the real desktop icon, 184 px, drawn at 128 px)
const ICON = { x: 10, y: 6, size: 128 };
const HD = 1;               // original screenshots
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
// Video 1 (trial, user-approved): chars / 5 + 1 s, never under 2 s, in output seconds.
// Latin letters count as half. Film time = output time x 1.2 (see SPEED).
function readTime(text) {
  let n = 0;
  for (const ch of text.replace(/[【】]/g, '')) n += /[\x00-\x7F]/.test(ch) ? 0.5 : 1;
  return 1.2 * Math.max(2, n / 5 + 1);
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
const REC = [];           // what the screen shows: {t, src, f0, f1} (playback) or {t, img, synth, fade, pop} (still)
// rate 1 = 25 recording frames per film second (plays 1.2x in the output); REAL = recorded speed in the output
const REAL = 1 / 1.2;
const play = (t, src, f0, f1, rate = 1) => { REC.push({ t, src, f0, f1, rate }); return t + (f1 - f0) / FPS_REC / rate; };
const still = (t, img, o = {}) => REC.push({ t, img, synth: !!o.synth, fade: o.fade || 0, pop: o.pop });

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
const lgP = (x, y) => sp(LG.x + x * LG.s, LG.y + y * LG.s);
const [WCX, WCY] = sp(960, 540);                                         // centre of the screen

// --- scenes, in seconds (all computed) ---
// Recordings: A = 方式一 (portal → pop-up → download menu), B = 方式二 (platform page → download menu).
// Each subtitle starts with its action (watch while reading); the picture only rests where the screen
// naturally rests (a page just opened, a menu just shown). Where the recording is not continuous (the card
// click was not recorded, B starts on a loaded page) a still with the pointer erased is shown and a
// synthetic pointer acts, ending exactly where the real pointer is in the next recorded frame.
const tTitle = 0;
T = 3.0;                              // the opening lines start while the title is still up
const tStageIn = 6.6;
const CARD = 1.8;                     // section card on screen (film seconds)
const TYPE_DT = 0.06;                 // typing speed (film seconds per character)
cam(0, 0, WCX, WCY, 1);
cur(0, 0, 'scr', 1731, 622);          // the real pointer's position in A's portal frames
still(0, 'A/0030');

// Intro paragraph
let s = say('苏电智伴IM客户端可从数字化门户登录进入后下载，');
cam(s + 0.3, 13, WCX, WCY - 10, 1.05);
s = say('也可通过统一智能中枢微门户平台直接下载，两种方式任选其一。');
TIPS.push({ t0: s + 1.0, t1: T + 0.2, text: '两种方式任选其一' });

// ---- 方式一 ----
let c0 = T;
CARDS.push({ t0: c0, t1: c0 + CARD - 0.2, tag: '方式一', title: '从数字化门户登录进入下载' });
STEP.push({ t: c0 + 0.3, i: 0 });
T += CARD;

s = say('（1）登录内网门户，进入数字化门户首页，');
const tScrollEnd = play(s + 0.2, 'A', 30, 89);              // scroll down to 常用工具
still(tScrollEnd, 'A_hold', { synth: true });

{
  s = say('点击【苏电智伴】卡片。');
  const card = [956, 387, 1244, 744];
  BADGES.push({ t0: s, t1: s + 1.3, n: 1, space: 'scr', x: card[0], y: card[1] });
  FOCUS.push({ t0: s, t1: s + 1.3, space: 'scr', rect: card });
  cam(s, 0.9, ...sp(1100, 560), 1.4);
  cur(s + 0.1, 1.0, 'scr', 1100, 560);
  click(s + 1.15, 'scr', 1100, 560);
  const tPop = s + 1.3;
  still(tPop, 'A_modal', { synth: true, fade: 0.35, pop: [195, 200, 1731, 997] });
  cur(tPop + 0.2, 0.6, 'scr', 861, 598);                    // to the real pointer in frame 178
  still(tPop + 0.85, 'A/0178');
  cam(tPop, 1.0, WCX, WCY, 1.0);
}

s = say('（2）门户内弹出苏电智伴·通用智能体平台页面，');
FOCUS.push({ t0: s + 0.2, t1: T - 0.2, space: 'scr', rect: [195, 200, 1731, 997] });
cam(s + 0.3, T - s - 0.3, ...sp(960, 560), 1.07);           // slow push while the pop-up rests

{
  // one continuous take, at recorded speed: hover 下载客户端 → menu → both sub-menus.
  // The lines follow one another over it; what reading needs beyond the take is a rest on the open menus.
  const t0 = T;
  const te = play(t0 + 0.2, 'A', 178, 313, REAL);
  click(t0 + 0.2 + 23 / FPS_REC / REAL, 'scr', 872, 578);
  still(te, 'A/0313');
  cam(t0, 1.0, ...sp(940, 720), 1.5);                         // one framing: button, menu and sub-menus
  const b = [800, 557, 940, 603], m = [774, 618, 962, 740];
  s = say('点击【下载客户端】按钮。');
  BADGES.push({ t0: s, t1: s + 1.6, n: 2, space: 'scr', x: b[0], y: b[1] });
  FOCUS.push({ t0: s, t1: s + 1.4, space: 'scr', rect: b });
  s = say('（3）在弹出的选项中，根据电脑操作系统');
  BADGES.push({ t0: s, t1: T, n: 3, space: 'scr', x: m[0], y: m[1] });
  FOCUS.push({ t0: s - 1.6, t1: T - 0.2, space: 'scr', rect: [774, 618, 1112, 895] });   // menu + sub-menus
  TIPS.push({ t0: s + 0.5, t1: T + 5.0, text: '根据电脑操作系统选择' });
  s = say('选择【Windows客户端】或【国产信创客户端】进行下载，');
  FOCUS.push({ t0: s - 0.2, t1: T - 0.2, space: 'scr', rect: [774, 618, 1112, 895] });
  cam(Math.max(te, t0 + 1.0), T - Math.max(te, t0 + 1.0), ...sp(940, 760), 1.62);   // slow push on the open menus
}
s = say('下载成功后根据提示一步一步安装。');
cam(s + 0.2, 1.2, WCX, WCY, 1);

// ---- 方式二 ----
c0 = T;
CARDS.push({ t0: c0, t1: c0 + CARD - 0.2, tag: '方式二', title: '通过统一智能中枢微门户平台下载' });
STEP.push({ t: c0 + 0.3, i: 1 });
still(c0 + 0.45, 'B_blank', { synth: true });
cur(c0 + 0.45, 0, 'scr', 1000, 880);
T += CARD;

{
  s = say('地址：http://agent.js.sgcc.com.cn');
  var URL = 'http://agent.js.sgcc.com.cn';
  var tAddrClick = s + 0.75, tType0 = s + 0.95;
  var tType1 = tType0 + URL.length * TYPE_DT, tEnter = tType1 + 0.25;
  cam(s, 0.8, ...sp(560, 66), 1.8);
  cur(s, 0.7, 'scr', 520, 66);
  click(tAddrClick, 'scr', 520, 66);
  FOCUS.push({ t0: s, t1: tEnter + 0.15, space: 'scr', rect: [118, 50, 1660, 81] });
  still(tEnter + 0.05, 'B_page', { synth: true, fade: 0.3 });
  cam(tEnter + 0.2, 1.0, ...sp(900, 420), 1.15);
  cur(tEnter + 0.3, 0.9, 'scr', 867, 395);                  // to the real pointer in frame 199
  still(tEnter + 1.25, 'B/0199');
}
{
  // 方式二 is the same as 方式一 from here on: one line, one continuous take
  s = say('点击【下载客户端】按钮，根据实际情况选择版本下载，下载成功后完成安装。');
  const b = [800, 403, 940, 447];
  FOCUS.push({ t0: s, t1: s + 1.0, space: 'scr', rect: b });
  cam(s, 0.9, ...sp(900, 520), 1.6);
  const te = play(s + 0.3, 'B', 199, 348);
  click(s + 0.3 + 2 / FPS_REC, 'scr', 869, 398);
  FOCUS.push({ t0: s + 1.2, t1: te + 0.6, space: 'scr', rect: [774, 465, 1112, 741] });   // menu + sub-menus
  still(te, 'B/0348');
  cam(te + 0.3, 1.2, WCX, WCY, 1);
}

// ---- 安装登录 ----
c0 = T;
CARDS.push({ t0: c0, t1: c0 + CARD - 0.2, tag: '安装登录', title: '安装成功后，登录客户端' });
STEP.push({ t: c0 + 0.3, i: 2 });
const tDesk = c0 + 0.45;  // the browser minimises during the card
cur(c0 + 1.0, 0, 'scr', 1180, 640);
T += CARD;

{
  s = say('安装成功后，双击【苏电IM】桌面图标，');
  const ic = [ICON.x + 8, ICON.y + 8, ICON.x + 118, ICON.y + 112];   // icon + label
  FOCUS.push({ t0: s, t1: s + 1.6, space: 'scr', rect: ic });
  BADGES.push({ t0: s, t1: s + 1.7, n: 1, space: 'scr', x: ic[2] + 20, y: ic[1] + 30 });   // right of the icon, clear of the top edge
  cam(s, 0.9, ...sp(260, 200), 1.9);
  cur(s + 0.1, 1.0, 'scr', ICON.x + 52, ICON.y + 48);
  click(s + 1.2, 'scr', ICON.x + 52, ICON.y + 48);
  click(s + 1.4, 'scr', ICON.x + 52, ICON.y + 48);
  var tLogin = s + 1.7;
  cam(s + 1.7, 1.0, ...lgP(470, 200), 1.25);
}
{
  s = say('输入统一权限用户名、密码登录。');
  var tAcc = s + 0.6, tAccType = [s + 0.8, s + 1.6], tPw = s + 1.9, tPwType = [s + 2.1, s + 2.9];
  var tLoginClick = s + 3.8;
  cur(s, 0.6, 'login', 470, 151);
  click(tAcc, 'login', 470, 151);
  cur(s + 1.6, 0.3, 'login', 470, 221);
  click(tPw, 'login', 470, 221);
  cur(s + 3.0, 0.6, 'login', 500, 305);
  click(tLoginClick, 'login', 500, 305);
  FOCUS.push({ t0: s + 2.9, t1: T, space: 'login', rect: [343, 287, 667, 325] });
}
pause(0.6);

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
let deskIcon;    // the real desktop icon tile, edges feathered into the wallpaper

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
// recording frames are loaded on demand (a few are kept)
const FRAMES = new Map();
function frameImg(name) {
  if (!FRAMES.has(name)) {
    FRAMES.set(name, loadImg(`assets/rec1/${name}.jpg`).then((i) => i.decode().then(() => i)));
    if (FRAMES.size > 12) FRAMES.delete(FRAMES.keys().next().value);
  }
  return FRAMES.get(name);
}

let cv, ctx;
export async function setup() {
  cv = document.getElementById('c');
  ctx = cv.getContext('2d');
  for (const n of ['img7', 'img7_empty']) IMG[n] = await loadImg(`assets/${n}.png`);
  IMG.taskbar = await loadImg('assets/rec1/taskbar.jpg');
  const ic = await loadImg('assets/desk_icon.png');
  const c = document.createElement('canvas'); c.width = ic.width; c.height = ic.height;
  const g = c.getContext('2d');
  g.drawImage(ic, 0, 0);
  g.globalCompositeOperation = 'destination-in';
  const f = 14, w = c.width, h = c.height;
  const gx = g.createLinearGradient(0, 0, w, 0);
  gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(f / w, '#000'); gx.addColorStop(1 - f / w, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gx; g.fillRect(0, 0, w, h);
  const gy = g.createLinearGradient(0, 0, 0, h);
  gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(f / h, '#000'); gy.addColorStop(1 - f / h, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gy; g.fillRect(0, 0, w, h);
  deskIcon = c;
  await Promise.all(['A/0030', 'A_hold', 'A_modal', 'B_blank', 'B_page'].map(frameImg));

  // fonts: load every glyph the film uses
  const all = SUBS.map((s) => s.text).join('') + CARDS.map((c) => c.tag + c.title).join('') +
    TIPS.map((t) => t.text).join('') + ALLTEXT;
  await Promise.all(['400', '500', '700'].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, all)));
}
const ALLTEXT = '苏电智伴（IM）使用手册第三部分常用功能1、下载、安装登录2、会话区3、工作区本节回顾下一节' +
  '提示方式一方式二数字化门户新标签页统一智能中枢微门户平台苏电IM造的一站式AI智能体研发与http://agent.js.sgcc.com.cn' +
  '从数字化门户登录进入下载通过统一智能中枢微门户平台下载安装成功后，双击【苏电IM】桌面图标，输入统一权限用户名、密码登录' +
  '门户下载微门户下载回收站此电脑浏览器工作文档培训资料项目0123456789msa:/szhmh和';

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
  const fit = (c, half, lo, size) => (2 * half >= size ? lo + size / 2 : clamp(c, lo + half, lo + size - half));
  cx = fit(cx, STAGE.w / 2 / z, SCR.x, 1920 * SCR.s);
  cy = fit(cy, STAGE.h / 2 / z, SCR.y, 1080 * SCR.s);
  return { cx, cy, z };
}
// world → screen
function W2S(cam, x, y) {
  return [STAGE.x + STAGE.w / 2 + (x - cam.cx) * cam.z, STAGE.y + STAGE.h / 2 + (y - cam.cy) * cam.z];
}
// any space → world
function toWorld(space, x, y) {
  if (space === 'scr') return sp(x, y);
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
// The recorded screen
// =====================================================================
// which recording frame (or still) is on screen at t, and the one it is fading from
function recAt(t) {
  let i = 0;
  for (let k = 0; k < REC.length; k++) if (t >= REC[k].t) i = k;
  const nameOf = (r, tt) => r.img ||
    `${r.src}/${String(Math.min(r.f1, r.f0 + Math.floor((tt - r.t) * FPS_REC * (r.rate || 1) + 1e-6))).padStart(4, '0')}`;
  const r = REC[i], prev = REC[i - 1];
  const k = r.fade ? prog(t, r.t, r.fade) : 1;
  return { r, name: nameOf(r, t), prevName: prev && k < 1 ? nameOf(prev, r.t) : null, k };
}

function drawScreenFrame(g, t, R, F) {
  g.save();
  g.translate(SCR.x, SCR.y); g.scale(SCR.s, SCR.s);
  if (R.prevName && F[R.prevName]) g.drawImage(F[R.prevName], 0, 0, 1920, 1080);
  const im = F[R.name];
  if (R.prevName && R.r.pop) {
    // a pop-up: the dimmed page fades in, the pop-up itself scales up from 96 %
    g.globalAlpha = easeOut(clamp(R.k * 2));
    g.drawImage(im, 0, 0, 1920, 1080);
    const p = R.r.pop, cx = (p[0] + p[2]) / 2, cy = (p[1] + p[3]) / 2, sc = lerp(0.96, 1, backOut(R.k));
    g.globalAlpha = easeOut(R.k);
    g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
    g.drawImage(im, p[0], p[1], p[2] - p[0], p[3] - p[1], p[0], p[1], p[2] - p[0], p[3] - p[1]);
  } else {
    g.globalAlpha = R.prevName ? easeOut(R.k) : 1;
    g.drawImage(im, 0, 0, 1920, 1080);
  }
  g.globalAlpha = 1;
  // 方式二 before the page loads: a new tab, typing the address
  if (R.name === 'B_blank') {
    g.fillStyle = '#1F1F1F'; g.font = '400 14px "Noto Sans SC"'; g.textBaseline = 'middle';
    g.fillText('新标签页', 56, 23);
    if (t >= tAddrClick) {
      g.strokeStyle = '#0B57D0'; g.lineWidth = 2; rr(g, 119, 51, 1540, 29, 14); g.stroke();
      const n = t < tType0 ? 0 : Math.min(URL.length, Math.floor((t - tType0) / TYPE_DT) + 1);
      const txt = URL.slice(0, n);
      g.font = '400 17px "Noto Sans SC"'; g.fillText(txt, 150, 66);
      if (Math.floor(t * 2.2) % 2 === 0 || n < URL.length) g.fillRect(151 + g.measureText(txt).width, 57, 1.3, 18);
    }
  }
  g.restore();
}

// =====================================================================
// Desktop and login (screen pixels)
// =====================================================================
function drawDesktop(g, t) {
  g.save();
  g.translate(SCR.x, SCR.y); g.scale(SCR.s, SCR.s);
  const gr = g.createLinearGradient(0, 0, 0, 1040);
  gr.addColorStop(0, '#0C76B0'); gr.addColorStop(1, '#2280AF');
  g.fillStyle = gr; g.fillRect(0, 0, 1920, 1040);
  const sel = t >= tLogin - 0.6 && t < tLogin + 2.5;
  if (sel) {   // Windows selection box
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(ICON.x + 8, ICON.y + 8, 110, 104);
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1; g.strokeRect(ICON.x + 8.5, ICON.y + 8.5, 109, 103);
  }
  g.drawImage(deskIcon, ICON.x, ICON.y, ICON.size, ICON.size);
  DESK_ITEMS.forEach(([label, kind], i) => {
    const col = Math.floor((i + 1) / 7), row = (i + 1) % 7;   // 苏电IM is the first slot
    deskItem(g, ICON.x + col * 120, ICON.y + row * 140, label, kind);
  });
  g.drawImage(IMG.taskbar, 0, 1040, 1920, 40);
  g.restore();
}

// generic desktop icons (drawn, no brand marks); slot = 128 px like the real 苏电IM icon
const DESK_ITEMS = [['此电脑', 'pc'], ['回收站', 'bin'], ['浏览器', 'web'], ['工作文档', 'folder'],
  ['培训资料', 'folder'], ['下载', 'folder'], ['项目资料', 'folder']];
function deskItem(g, x, y, label, kind) {
  const cx = x + 64, top = y + 22;
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 4; g.shadowOffsetY = 2;
  if (kind === 'folder') {
    g.fillStyle = '#D9A21E'; rr(g, cx - 32, top + 6, 64, 46, 4); g.fill();
    g.fillStyle = '#D9A21E'; rr(g, cx - 32, top + 1, 24, 12, 3); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = '#F7C948'; rr(g, cx - 32, top + 14, 64, 40, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(cx - 30, top + 16, 60, 6);
  } else if (kind === 'pc') {
    g.fillStyle = '#2B3A4A'; rr(g, cx - 30, top + 2, 60, 40, 4); g.fill();
    g.shadowColor = 'transparent';
    const gr = g.createLinearGradient(0, top + 6, 0, top + 38);
    gr.addColorStop(0, '#5FC3F5'); gr.addColorStop(1, '#1E7FC8');
    g.fillStyle = gr; g.fillRect(cx - 26, top + 6, 52, 32);
    g.fillStyle = '#C9D2DA'; g.fillRect(cx - 5, top + 42, 10, 8); rr(g, cx - 18, top + 50, 36, 5, 2); g.fill();
  } else if (kind === 'bin') {
    g.fillStyle = 'rgba(235,242,248,0.92)';
    g.beginPath(); g.moveTo(cx - 24, top + 8); g.lineTo(cx + 24, top + 8); g.lineTo(cx + 19, top + 56); g.lineTo(cx - 19, top + 56); g.closePath(); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(120,140,160,0.7)'; g.lineWidth = 2;
    for (const dx of [-10, 0, 10]) { g.beginPath(); g.moveTo(cx + dx, top + 16); g.lineTo(cx + dx * 0.85, top + 50); g.stroke(); }
    g.fillStyle = 'rgba(210,222,232,0.95)'; rr(g, cx - 27, top + 2, 54, 8, 3); g.fill();
  } else {
    g.fillStyle = '#2F86E0'; g.beginPath(); g.arc(cx, top + 28, 27, 0, Math.PI * 2); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(cx, top + 28, 11, 27, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(cx - 27, top + 28); g.lineTo(cx + 27, top + 28); g.stroke();
    g.beginPath(); g.moveTo(cx - 23, top + 15); g.lineTo(cx + 23, top + 15); g.moveTo(cx - 23, top + 41); g.lineTo(cx + 23, top + 41); g.stroke();
  }
  g.restore();
  g.save();
  g.fillStyle = '#FFFFFF'; g.font = font(19, 400); g.textAlign = 'center'; g.textBaseline = 'top';
  g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 3; g.shadowOffsetY = 1;
  g.fillText(label, cx, y + 86);
  g.restore();
}

function drawLogin(g, t) {
  if (t < tLogin) return;
  const k = prog(t, tLogin, 0.4);
  const im = IMG.img7_empty, iw = im.width, ih = im.height;
  g.save();
  g.translate(SCR.x, SCR.y); g.scale(SCR.s, SCR.s);
  const cx = LG.x + iw * LG.s / 2, cy = LG.y + ih * LG.s / 2;
  const sc = lerp(0.92, 1, backOut(k));
  g.globalAlpha = easeOut(k);
  g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
  g.translate(LG.x, LG.y); g.scale(LG.s, LG.s);
  g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, iw, ih); g.restore();
  D(g, im, 0, 0);
  const accFocus = t >= tAcc && t < tPw, pwFocus = t >= tPw && t < tLoginClick;
  for (const [on, y] of [[accFocus, 131], [pwFocus, 201]]) {
    if (!on) continue;
    g.strokeStyle = '#2E7CF6'; g.lineWidth = 1.5; rr(g, 343, y, 324, 38, 7); g.stroke();
  }
  if (t >= tAccType[0]) {
    const p = prog(t, tAccType[0], tAccType[1] - tAccType[0]);
    const w = Math.round(7 * p) / 7 * 82;
    if (w > 0) D(g, IMG.img7, 386, 137, w, 28, 386, 137, w, 28);
    if (accFocus && p < 1) { g.fillStyle = '#1E2933'; g.fillRect(392 + w * 0.85, 141, 1.2, 18); }
  }
  if (t >= tPwType[0]) {
    const p = prog(t, tPwType[0], tPwType[1] - tPwType[0]);
    const w = Math.round(11 * p) / 11 * 92;
    if (w > 0) D(g, IMG.img7, 390, 207, w, 27, 390, 207, w, 27);
  }
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

function drawCursor(g, t, cam, R) {
  const synth = t >= tDesk + 0.2 || (t < tDesk && R && R.r.synth);
  if (!synth) return;
  const [wx, wy] = cursorAt(t);
  const [x, y] = W2S(cam, wx, wy);
  // press: shrink briefly
  let press = 1;
  for (const c of CLICKS) if (t >= c.t - 0.05 && t < c.t + 0.15) press = 0.86;
  const s = 0.82 * SCR.s * cam.z * press;   // the size of the real Windows pointer in the recording
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

const STEPS = ['方式一  数字化门户下载', '方式二  微门户下载', '安装登录'];
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
  const a = Math.min(clamp(t / 0.5), clamp((tStageIn - t) / 0.6));   // gone before the stage fades in
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
export async function renderAt(tOut) {
  const t = tOut * SPEED;
  const R = t < tDesk + 0.7 ? recAt(t) : null;
  const F = {};
  if (R) for (const n of [R.name, R.prevName]) if (n) F[n] = await frameImg(n);
  const g = ctx;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.globalAlpha = 1;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  if (t >= tStageIn && t < tRecap + 0.6) {
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
    g.fillStyle = '#D7DFE6'; g.fillRect(-600, -600, STAGE.w + 1200, STAGE.h + 1200);
    if (t >= tDesk) drawDesktop(g, t);
    if (R) {
      // the browser minimises into its taskbar button when the desktop appears
      const m = ease(prog(t, tDesk, 0.7));
      const [tx, ty] = sp(320, 1060);   // Chrome's taskbar button
      g.save();
      g.globalAlpha = 1 - m * m;
      g.translate(tx, ty); g.scale(1 - 0.92 * m, 1 - 0.92 * m); g.translate(-tx, -ty);
      g.translate(0, 0);
      drawScreenFrame(g, t, R, F);
      g.restore();
    }
    drawLogin(g, t);
    g.restore();
    drawFocus(g, t, cam);
    drawClicks(g, t, cam);
    drawBadges(g, t, cam);
    drawCursor(g, t, cam, R);
    drawTips(g, t);
    drawCards(g, t);
    g.restore();
    g.restore();
    // subtitles removed from video 1 at the client's request (the .srt is still exported)
  }
  drawTitle(g, t);
  drawRecap(g, t);
}
