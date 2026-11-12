// 苏电智伴 培训视频 第 2 支：会话区（录屏版，手册截图补足未录到的部分）
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
// frames per second of each recording (assets/rec2/<src>/NNNN.jpg)
const FPS_OF = { '21': 30, '221': 25, '223b': 25, '223a': 25, '224': 25, '225': 25 };
// manual screenshots (old client) shown as a window over a softened backdrop, in screen pixels
const SHOT = { img12: [1269, 818], img13: [1270, 809], img16: [1270, 817], img17: [1271, 814] };
const SHOT_S = 1.25;
const shotP = (name, x, y) => {
  const [w, h] = SHOT[name];
  return [(1920 - w * SHOT_S) / 2 + x * SHOT_S, (1080 - h * SHOT_S) / 2 + y * SHOT_S];
};
const HD = 1;
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
// play a recording at its recorded speed in the output (o.speed for a faster take); o.fade = crossfade in
const play = (t, src, f0, f1, o = {}) => {
  const rate = REAL * (o.speed || 1);
  REC.push({ t, src, f0, f1, rate, fade: o.fade || 0, pop: o.pop });
  return t + (f1 - f0) / FPS_OF[src] / rate;
};
const still = (t, img, o = {}) => REC.push({ t, img, synth: !!o.synth, fade: o.fade || 0, pop: o.pop });
const fr = (src, i) => `${src}/${String(i).padStart(4, '0')}`;

let T = 0;
function say(text, minDur = 0) {
  const d = Math.max(readTime(text), minDur);
  SUBS.push({ t0: T, t1: T + d, text });
  const s = T;
  T += d;
  return s;
}
const pause = (d) => { T += d; };
// camera keys are clamped when added, so the view never leaves the screen and never needs correcting later
const camFit = (c, z, lo, size, half) => (2 * half / z >= size ? lo + size / 2 : clamp(c, lo + half / z, lo + size - half / z));
const cam = (t, d, cx, cy, z) => CAM.push({ t, d, z,
  cx: camFit(cx, z, SCR.x, 1920 * SCR.s, STAGE.w / 2), cy: camFit(cy, z, SCR.y, 1080 * SCR.s, STAGE.h / 2) });
const cur = (t, d, space, x, y) => CUR.push({ t, d, space, x, y });
const click = (t, space, x, y) => CLICKS.push({ t, space, x, y });

// world helpers for cameras
const [WCX, WCY] = sp(960, 540);                                         // centre of the screen

// --- scenes, in seconds (all computed) ---
// Each line comes first and its part of the recording follows (LEAD), at recorded speed. Recordings carry their
// own pointer; where nothing was recorded (2.2.2, using the password box in chat) the manual's screenshots are
// shown with a synthetic pointer. Waits (the model thinking) are cut with a short crossfade.
const tTitle = 0;
const tStageIn = 6.6;
T = tStageIn + 0.3;
const CARD = 3.4;                     // section card on screen (film seconds; ~2.8 s in the output)
const PRE_CARD = 0.9;                 // the previous picture holds before a card comes up
const LEAD = 0.6;                     // a line leads its action by this much (film seconds)
const TYPE_DT = 0.1;                  // typing speed (film seconds per character)
const TYPES = [];                     // simulated typing: {space, rect, text, px, tClick, t0, tEnd, on}
const MARKS = [];                     // selected marks: {kind, space, x, y, size, t0, t1, on}
cam(0, 0, WCX, WCY, 1);
cur(0, 0, 'scr', 960, 600);
still(0, fr('21', 0));

const section = (tag, title, step) => {
  if (CARDS.length) T += PRE_CARD;
  CARDS.push({ t0: T, t1: T + CARD - 0.2, tag, title });
  STEP.push({ t: T + 0.3, i: step });
  T += CARD;
};
const after = (te) => { if (te + 0.3 > T) T = te + 0.3; };   // a take longer than its line delays the next line
const focus = (t0, t1, space, rect) => FOCUS.push({ t0, t1, space, rect });
const pr = (n, r) => [...shotP(n, r[0], r[1]), ...shotP(n, r[2], r[3])];
const ft = (src, f0, f, t0, rate = REAL) => t0 + (f - f0) / FPS_OF[src] / rate;   // film time of frame f in a take
let s, te, t1, t2;

// ================= 2.1.1 切换智能体 =================
section('2.1 智能体', '2.1.1 切换智能体', 0);
s = say('点击【默认智能体】，弹出智能体列表，');
cam(s, 0.9, ...sp(330, 330), 1.5);
focus(s, s + 1.8, 'scr', [24, 136, 224, 202]);
te = play(s + LEAD, '21', 0, 62);
focus(ft('21', 0, 40, s + LEAD), T - 0.1, 'scr', [18, 180, 254, 490]);
still(te, fr('21', 62)); after(te);

s = say('点击智能体名称，即可切换至该智能体，');
focus(s, s + 3.6, 'scr', [18, 180, 254, 490]);
te = play(s + LEAD, '21', 62, 235);
cam(ft('21', 62, 196, s + LEAD), 0.9, WCX, WCY, 1);
focus(ft('21', 62, 211, s + LEAD), te + 0.6, 'scr', [880, 48, 1036, 98]);       // 智能体切换成功
still(te, fr('21', 235)); after(te);

s = say('技能、定时任务、聊天内容等配置也随之切换。');
te = play(s + 0.2, '21', 235, 340);
still(te, fr('21', 340)); after(te);

// ================= 2.1.2 智能体管理 =================
section('2.1 智能体', '2.1.2 智能体管理', 1);
s = say('点击【智能体管理】，进入智能体管理页面，');
cam(s, 0.9, ...sp(330, 330), 1.5);
te = play(s + LEAD, '21', 350, 462);
focus(ft('21', 350, 386, s + LEAD), ft('21', 350, 412, s + LEAD), 'scr', [150, 192, 252, 222]);
cam(ft('21', 350, 445, s + LEAD), 0.9, WCX, WCY, 1);
still(te, fr('21', 462)); after(te);

s = say('可创建、修改、删除智能体。');
te = play(s, '21', 462, 520);
focus(s, s + 1.7, 'scr', [1768, 118, 1884, 152]);
focus(s + 1.8, T - 0.1, 'scr', [1460, 196, 1902, 480]);
still(te, fr('21', 520)); after(te);

s = say('点击【创建智能体】，填写智能体ID和名称，点击【保存】即可。');
focus(s, s + 1.4, 'scr', [1768, 118, 1884, 152]);
t1 = play(s + 0.2, '21', 955, 1013, { fade: 0.2 });
t2 = play(t1, '21', 1013, 1160, { speed: 2 });
focus(t1, t2 + 0.6, 'scr', [660, 222, 1268, 340]);
te = play(t2, '21', 1530, 1670, { fade: 0.3 });
focus(ft('21', 1530, 1572, t2), ft('21', 1530, 1602, t2), 'scr', [1196, 834, 1268, 878]);
click(ft('21', 1530, 1599, t2), 'scr', 1228, 858);
focus(ft('21', 1530, 1608, t2), te + 0.6, 'scr', [846, 52, 1078, 100]);         // 智能体创建成功
still(te, fr('21', 1670)); after(te);

// ================= 2.2.1 选择模型 =================
section('2.2 聊天', '2.2.1 选择模型', 2);
still(T - CARD + 0.45, fr('221', 30));
s = say('点击【讨论/聊天】菜单，可直接提问，');
focus(s, s + 2.4, 'scr', [24, 228, 224, 262]);
t1 = play(s + 0.3, '221', 30, 135);
still(t1, fr('221', 135)); after(t1);

s = say('系统会根据实际情况和资源分配，自动选择最佳模型回答。');
t1 = play(s + 0.1, '221', 135, 300);                          // the model list, then a suggested question
focus(ft('221', 135, 150, s + 0.1), ft('221', 135, 245, s + 0.1), 'scr', [1070, 136, 1484, 246]);
focus(ft('221', 135, 255, s + 0.1), ft('221', 135, 296, s + 0.1), 'scr', [920, 496, 1166, 532]);
te = play(t1, '221', 1090, 1225, { fade: 0.3, speed: 1.5 });
focus(t1 + 0.4, Math.max(T, te) - 0.1, 'scr', [500, 120, 1340, 800]);   // the answer
still(te, fr('221', 1225)); after(te);

// ================= 2.2.2 个人知识库 (screenshots) =================
section('2.2 聊天', '2.2.2 个人知识库', 3);
still(T - CARD + 0.45, 'shot:img12', { synth: true });
cur(T - CARD + 0.45, 0, 'shot:img12', 760, 680);
s = say('如已创建个人知识库，可在聊天页面进行知识库问答：');
focus(s + 0.2, T - 0.1, 'shot:img12', [325, 553, 1172, 741]);

s = say('选中【个人知识库】后提问，大模型优先依据知识库回答。');
focus(s, s + 1.6, 'shot:img12', [458, 562, 557, 589]);
cur(s + 0.2, 1.0, 'shot:img12', 512, 576);
click(s + 1.4, 'shot:img12', 512, 576);
still(s + 1.55, 'shot:img13', { synth: true, fade: 0.3, pop: pr('img13', [392, 385, 642, 536]) });
cur(s + 2.1, 0.8, 'shot:img13', 422, 483);
click(s + 3.1, 'shot:img13', 422, 483);
MARKS.push({ kind: 'tick', space: 'shot:img13', x: 422, y: 483, size: 16, t0: s + 3.1, t1: 1e9, on: 'shot:img13' });
focus(s + 1.8, T - 0.1, 'shot:img13', [392, 385, 642, 536]);

// ================= 2.2.3 联网检索 =================
section('2.2 聊天', '2.2.3 联网检索', 4);
still(T - CARD + 0.45, fr('223b', 40));
s = say('点击【联网检索】，系统通过内网服务通道访问外网，');
focus(s, s + 2.4, 'scr', [502, 818, 594, 846]);
t1 = play(s + 0.2, '223b', 40, 160);
focus(ft('223b', 40, 124, s + 0.2), t1 + 0.4, 'scr', [744, 340, 1166, 486]);   // 安全提示
t2 = play(t1, '223b', 222, 300, { fade: 0.2 });
still(t2, fr('223b', 300)); after(t2);

s = say('可开展公开信息检索、资料查询。');
focus(s, s + 2.2, 'scr', [495, 810, 1336, 966]);
t1 = play(s + 0.2, '223b', 395, 445, { fade: 0.25 });
t2 = play(t1, '223b', 2435, 2620, { fade: 0.3, speed: 2 });
focus(t1 + 0.3, t2 + 0.4, 'scr', [500, 110, 1340, 800]);
still(t2, fr('223b', 2620)); after(t2);

s = say('每天联网检索额度固定，次数用完时会提示余额不足，');
t1 = play(s + 0.2, '223a', 66, 125, { fade: 0.25 });
focus(ft('223a', 66, 114, s + 0.2), T - 0.1, 'scr', [270, 580, 600, 670]);
TIPS.push({ t0: s + 0.8, t1: T + 0.3, text: '每天联网检索额度固定' });
still(t1, fr('223a', 125)); after(t1);

s = say('可在用户中心点击【申请】，提交调整额度申请。');
te = play(s + 0.2, '223a', 125, 310);
focus(s, ft('223a', 125, 244, s + 0.2), 'scr', [520, 588, 590, 626]);
focus(ft('223a', 125, 250, s + 0.2), te + 0.6, 'scr', [690, 140, 1218, 392]);
click(ft('223a', 125, 305, s + 0.2), 'scr', 1160, 358);
still(te, fr('223a', 310)); after(te);

// ================= 2.2.4 密码箱 =================
section('2.2 聊天', '2.2.4 密码箱', 5);
still(T - CARD + 0.45, fr('224', 45));
s = say('密码箱用于保存各平台的账号密码，模型可直接登录。');
focus(s + 0.4, T - 0.1, 'scr', [836, 818, 902, 846]);

s = say('首次点开【密码箱】，点击【去设置】，');
te = play(s + 0.2, '224', 45, 150);
focus(ft('224', 45, 92, s + 0.2), ft('224', 45, 143, s + 0.2), 'scr', [730, 530, 960, 800]);
still(te, fr('224', 150)); after(te);

s = say('填写账号、密码并保存；');
te = play(s + 0.1, '224', 150, 292);
{
  const tA = ft('224', 150, 220, s + 0.1), tP = ft('224', 150, 252, s + 0.1), tT = ft('224', 150, 187, s + 0.1);
  TYPES.push({ space: 'scr', rect: [289, 303, 630, 325], text: 'http://mail.js.sgcc.com.cn', px: 15, dt: 0.05, blur: 4,
    tClick: tT, t0: tT + 0.1, tEnd: 1e9, on: ['224'] });
  focus(tT - 0.3, tA - 0.4, 'scr', [278, 270, 640, 336]);
  TYPES.push({ space: 'scr', rect: [289, 506, 628, 527], text: 'zhangsan', px: 15, tClick: tA, t0: tA + 0.2, tEnd: 1e9, on: ['224'] });
  TYPES.push({ space: 'scr', rect: [289, 588, 612, 609], text: '••••••••', px: 15, tClick: tP, t0: tP + 0.2, tEnd: 1e9, on: ['224'] });
  focus(tA - 0.4, te - 1.0, 'scr', [278, 488, 640, 620]);
}
focus(te - 1.0, te + 0.6, 'scr', [278, 756, 392, 798]);
click(te - 0.2, 'scr', 335, 777);
still(te, fr('224', 292)); after(te);

s = say('在聊天页面输入网址，选择已创建的密码，点击【发送】即可。');
still(s, 'shot:img12', { synth: true, fade: 0.35 });
cur(s, 0, 'shot:img12', 760, 680);
cur(s + 0.3, 0.8, 'shot:img12', 605, 576);
click(s + 1.2, 'shot:img12', 605, 576);
still(s + 1.35, 'shot:img16', { synth: true, fade: 0.28, pop: pr('img16', [478, 333, 728, 539]) });
cur(s + 1.6, 0.7, 'shot:img16', 509, 441);
click(s + 2.4, 'shot:img16', 509, 441);
MARKS.push({ kind: 'radio', space: 'shot:img16', x: 508, y: 440, size: 16, t0: s + 2.4, t1: 1e9, on: 'shot:img16' });
still(s + 3.0, 'shot:img12', { synth: true, fade: 0.25 });
cur(s + 3.0, 0.6, 'shot:img12', 640, 614);
click(s + 3.7, 'shot:img12', 640, 614);
TYPES.push({ space: 'shot:img12', rect: [336, 602, 716, 628], text: '查看今日未读邮件', px: 14, tClick: s + 3.75, t0: s + 3.9, tEnd: s + 6.0, on: ['shot:img12'] });
cur(s + 4.8, 0.8, 'shot:img12', 1140, 715);
click(s + 5.75, 'shot:img12', 1140, 715);
still(s + 5.9, 'shot:img17', { synth: true, fade: 0.35 });
focus(s + 6.3, s + 8.2, 'shot:img17', [868, 176, 1141, 229]);
after(s + 7.9);

// ================= 2.2.5 附件 =================
section('2.2 聊天', '2.2.5 附件', 6);
still(T - CARD + 0.45, fr('223b', 40));
s = say('附件支持doc、docx、xls、xlsx、pdf、ofd、txt等格式，');
focus(s + 0.4, T - 0.1, 'scr', [496, 924, 526, 954]);
s = say('可批量上传，单个文件不超过50MB。');
TIPS.push({ t0: s + 0.3, t1: T + 0.3, text: '单个文件不超过50MB' });

s = say('点击【附件】按钮，选择本地文件上传，');
focus(s, s + 0.9, 'scr', [496, 924, 526, 954]);
click(s + 0.5, 'scr', 511, 939);
t1 = play(s + 0.7, '225', 0, 45, { fade: 0.3, pop: [8, 4, 958, 538] });
focus(s + 0.9, ft('225', 0, 31, s + 0.7), 'scr', [8, 4, 958, 538]);
still(t1, fr('225', 45)); after(t1);

s = say('输入文件相关问题并发送，大模型进行总结回答。');
te = play(s + 0.2, '225', 105, 200, { fade: 0.25 });
focus(s + 0.4, ft('225', 105, 182, s + 0.2), 'scr', [490, 800, 1336, 970]);
still(te, fr('225', 200)); after(te);
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

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
// recording frames are loaded on demand (a few are kept); 'shot:imgNN' are manual screenshots
const FRAMES = new Map();
function frameImg(name) {
  if (!FRAMES.has(name)) {
    const url = name.startsWith('shot:') ? `assets/${name.slice(5)}.png` : `assets/rec2/${name}.jpg`;
    FRAMES.set(name, loadImg(url).then((i) => i.decode().then(() => i)));
    if (FRAMES.size > 14) FRAMES.delete(FRAMES.keys().next().value);
  }
  return FRAMES.get(name);
}

let cv, ctx;
export async function setup() {
  cv = document.getElementById('c');
  ctx = cv.getContext('2d');
  IMG.shot_bg = await loadImg('assets/rec2/shot_bg.jpg');
  await Promise.all([fr('21', 0), 'shot:img12'].map(frameImg));
  const all = SUBS.map((s) => s.text).join('') + CARDS.map((c) => c.tag + c.title).join('') +
    TIPS.map((t) => t.text).join('') + TYPES.map((t) => t.text).join('') + ALLTEXT;
  await Promise.all(['400', '500', '700'].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, all)));
}
const ALLTEXT = '苏电智伴（IM）使用手册第三部分常用功能1、下载、安装登录2、会话区3、工作区本节下一节提示' +
  '切换智能体管理选择模型个人知识库联网检索密码箱附件0123456789';

// =====================================================================
// Camera, cursor and spaces
// =====================================================================
function camAt(t) {
  let cx = CAM[0].cx, cy = CAM[0].cy, z = CAM[0].z;
  const HW = STAGE.w / 2, HH = STAGE.h / 2;
  for (const k of CAM) {
    if (t < k.t) break;
    const p = k.d ? ease(prog(t, k.t, k.d)) : 1;
    // Interpolate the view's edges, with the zoom geometric: a push or pull moves in a straight line
    // toward its target and both edges stay inside the screen (no sideways swing).
    const z1 = Math.exp(lerp(Math.log(z), Math.log(k.z), p));
    const q = Math.abs(k.z - z) > 1e-4 ? (1 / z - 1 / z1) / (1 / z - 1 / k.z) : p;
    const L = lerp(cx - HW / z, k.cx - HW / k.z, q), Tp = lerp(cy - HH / z, k.cy - HH / k.z, q);
    z = z1; cx = L + HW / z; cy = Tp + HH / z;
  }
  return { cx, cy, z };
}
// world → screen
function W2S(cam, x, y) {
  return [STAGE.x + STAGE.w / 2 + (x - cam.cx) * cam.z, STAGE.y + STAGE.h / 2 + (y - cam.cy) * cam.z];
}
// any space → world
function toWorld(space, x, y) {
  if (space === 'scr') return sp(x, y);
  if (space.startsWith('shot:')) return sp(...shotP(space.slice(5), x, y));
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
    fr(r.src, Math.min(r.f1, r.f0 + Math.floor((tt - r.t) * FPS_OF[r.src] * r.rate + 1e-6)));
  const r = REC[i], prev = REC[i - 1];
  const k = r.fade ? prog(t, r.t, r.fade) : 1;
  return { r, name: nameOf(r, t), prevName: prev && k < 1 ? nameOf(prev, r.t) : null, k };
}

// one picture in screen pixels: a recording frame, or a screenshot window over the softened backdrop
function drawPicture(g, name, im, alpha = 1, clip = null) {
  g.save();
  g.globalAlpha = alpha;
  if (clip) { g.beginPath(); g.rect(clip[0], clip[1], clip[2] - clip[0], clip[3] - clip[1]); g.clip(); }
  if (name.startsWith('shot:')) {
    const key = name.slice(5), [w, h] = SHOT[key], [x, y] = shotP(key, 0, 0);
    g.drawImage(IMG.shot_bg, 0, 0, 1920, 1080);
    g.fillStyle = 'rgba(20,35,50,0.18)'; g.fillRect(0, 0, 1920, 1080);
    g.save(); g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 40; g.shadowOffsetY = 12;
    g.fillStyle = '#FFFFFF'; g.fillRect(x, y, w * SHOT_S, h * SHOT_S); g.restore();
    g.drawImage(im, x, y, w * SHOT_S, h * SHOT_S);
  } else g.drawImage(im, 0, 0, 1920, 1080);
  g.restore();
}

function drawScreenFrame(g, t, R, F) {
  g.save();
  g.translate(SCR.x, SCR.y); g.scale(SCR.s, SCR.s);
  if (R.prevName && F[R.prevName]) drawPicture(g, R.prevName, F[R.prevName]);
  const im = F[R.name];
  if (R.prevName && R.r.pop) {
    // a pop-up: the rest fades in quickly, the pop-up itself scales up from 96 %
    drawPicture(g, R.name, im, easeOut(clamp(R.k * 2)));
    const p = R.r.pop, cx = (p[0] + p[2]) / 2, cy = (p[1] + p[3]) / 2, sc = lerp(0.96, 1, backOut(R.k));
    g.save();
    g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
    drawPicture(g, R.name, im, easeOut(R.k), p);
    g.restore();
  } else drawPicture(g, R.name, im, R.prevName ? easeOut(R.k) : 1);
  const src = R.name.split('/')[0];
  for (const ty of TYPES) {      // simulated typing into an input
    if (t < ty.tClick || t >= ty.tEnd || !(ty.on.includes(src) || ty.on.includes(R.name))) continue;
    const shot = ty.space !== 'scr', k = shot ? SHOT_S : 1;
    const [x1, y1] = shot ? shotP(ty.space.slice(5), ty.rect[0], ty.rect[1]) : ty.rect.slice(0, 2);
    const [x2, y2] = shot ? shotP(ty.space.slice(5), ty.rect[2], ty.rect[3]) : ty.rect.slice(2, 4);
    g.fillStyle = '#FFFFFF'; g.fillRect(x1, y1, x2 - x1, y2 - y1);
    const n = t < ty.t0 ? 0 : Math.min(ty.text.length, Math.floor((t - ty.t0) / (ty.dt || TYPE_DT)) + 1);
    const txt = ty.text.slice(0, n), px = ty.px * k, cy = (y1 + y2) / 2;
    g.fillStyle = '#1E2933'; g.textBaseline = 'middle'; g.font = `400 ${px}px "Noto Sans SC"`;
    if (ty.blur) { g.save(); g.filter = `blur(${ty.blur}px)`; }   // typed, but not readable
    g.fillText(txt, x1 + 6 * k, cy + 1);
    if (ty.blur) g.restore();
    if (Math.floor(t * 2.2) % 2 === 0 || n < ty.text.length) g.fillRect(x1 + 7 * k + g.measureText(txt).width, cy - px * 0.6, 1.4, px * 1.2);
  }
  for (const m of MARKS) {        // selected state: green tick box or radio
    if (t < m.t0 || t >= m.t1 || R.name !== m.on) continue;
    const shot = m.space !== 'scr', k = shot ? SHOT_S : 1, r = m.size * k;
    const [x, y] = shot ? shotP(m.space.slice(5), m.x, m.y) : [m.x, m.y];
    g.fillStyle = C.green;
    if (m.kind === 'tick') {
      rr(g, x - r / 2, y - r / 2, r, r, 3 * k); g.fill();
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.2 * k; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(x - r * 0.26, y + r * 0.02); g.lineTo(x - r * 0.07, y + r * 0.2); g.lineTo(x + r * 0.27, y - r * 0.18); g.stroke();
    } else {
      g.beginPath(); g.arc(x, y, r / 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x, y, r / 5, 0, Math.PI * 2); g.fill();
    }
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
  if (!(R && R.r.synth)) return;   // recordings carry their own pointer
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

const STEPS = ['切换智能体', '智能体管理', '选择模型', '个人知识库', '联网检索', '密码箱', '附件'];
function drawTopBar(g, t) {
  const a = clamp((t - tStageIn) / 0.6);
  if (a <= 0) return;
  g.save();
  g.globalAlpha = a;
  // chapter pill
  g.font = font(26, 700); g.textBaseline = 'middle';
  const label = '2、会话区';
  const lw = g.measureText(label).width;
  rr(g, STAGE.x, 18, lw + 48, 50, 25); g.fillStyle = C.green; g.fill();
  g.fillStyle = '#FFFFFF'; g.fillText(label, STAGE.x + 24, 44);
  // progress steps
  let cur = -1;
  for (const s of STEP) if (t >= s.t) cur = s.i;
  g.font = font(20, 500);
  const widths = STEPS.map((s) => g.measureText(s).width + 36);
  const gap = 26;
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
    g.fillText(s, x + 18, 44);
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
  drawOutline(g, t, 1, 240, 560, 2.2);
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
    drawOutline(g, t, 2, 240, 450, tNext + 0.4);
  }
  g.restore();
}

// =====================================================================
// Frame
// =====================================================================
export async function renderAt(tOut) {
  const t = tOut * SPEED;
  const R = recAt(t);
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
    drawScreenFrame(g, t, R, F);
    g.restore();
    drawFocus(g, t, cam);
    drawClicks(g, t, cam);
    // step numbers removed from video 1 at the client's request
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
