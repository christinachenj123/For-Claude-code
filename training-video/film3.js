// 苏电智伴 培训视频 第 3 支：工作区（录屏版，手册截图补足未录到的部分）
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
// frames per second of each recording (assets/rec3/<src>/NNNN.jpg)
const FPS_OF = { a: 25, b: 25, c: 25, d: 25 };
// manual screenshots (old client) shown as a window over a softened backdrop, in screen pixels
const SHOT = { img25: [1268, 823], img26: [1280, 815], img31: [1280, 805], img32: [1279, 796], img37: [1274, 818], img37_empty: [1274, 818] };
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
// Each line comes first and its part of the recording follows, at recorded speed. Recordings carry their own
// pointer; the parts nothing was recorded for (导入已有知识库, 重新解析, Wiki预览, 会话问答) use the manual's
// screenshots with a synthetic pointer. Mistakes, waits and the security warning dialogs are cut.
const tTitle = 0;
const tStageIn = 6.6;
T = tStageIn + 0.3;
const CARD = 3.4;                     // section card on screen (film seconds; ~2.8 s in the output)
const PRE_CARD = 0.9;                 // the previous picture holds before a card comes up
const TYPE_DT = 0.16;                 // typing speed (film seconds per character)
const TYPES = [];                     // simulated typing: {space, rect, text, px, tClick, t0, tEnd, on}
const MARKS = [];                     // selected marks: {kind, space, x, y, size, t0, t1, on}
cam(0, 0, WCX, WCY, 1);
cur(0, 0, 'scr', 960, 600);
still(0, fr('b', 105));

const section = (tag, title, step) => {
  if (CARDS.length) T += PRE_CARD;
  CARDS.push({ t0: T, t1: T + CARD - 0.2, tag, title });
  STEP.push({ t: T + 0.3, i: step });
  T += CARD;
};
const after = (te) => { if (te + 0.3 > T) T = te + 0.3; };   // a take longer than its line delays the next line
const focus = (t0, t1, space, rect) => FOCUS.push({ t0, t1, space, rect });
const pr = (n, r) => [...shotP(n, r[0], r[1]), ...shotP(n, r[2], r[3])];
const ft = (src, f0, f, t0, speed = 1) => t0 + (f - f0) / FPS_OF[src] / (REAL * speed);   // film time of frame f
let s, te, t1, t2;

// ================= 3.1.1 创建技能 =================
section('3.1 技能', '3.1.1 创建技能', 0);
s = say('点击【技能】菜单，点击右上角【创建技能】按钮，弹出创建页面。');
focus(s, s + 1.6, 'scr', [24, 466, 214, 498]);                                  // 技能 menu (already selected)
te = play(s + 0.3, 'b', 105, 182);
focus(ft('b', 105, 135, s + 0.3), ft('b', 105, 170, s + 0.3), 'scr', [1765, 118, 1870, 152]);
focus(ft('b', 105, 176, s + 0.3), T + 1.0, 'scr', [1400, 40, 1916, 1036]);       // the drawer
still(te, fr('b', 182)); after(te);

s = say('输入技能名称和技能内容（Markdown格式，需包含name和description），');
t1 = play(s + 0.2, 'b', 182, 460, { speed: 3 });                                // name (typed with an IME)
focus(s + 0.2, t1, 'scr', [1430, 140, 1912, 205]);
t2 = play(t1, 'b', 460, 545);                                                   // content pasted
focus(t1 + 0.2, t2 + 0.4, 'scr', [1430, 262, 1912, 535]);
still(t2, fr('b', 545)); after(t2);

s = say('点击【创建】按钮，成功后可在技能列表中看到新创建的技能。');
t1 = play(s + 0.2, 'b', 545, 578);
focus(s, ft('b', 545, 575, s + 0.2), 'scr', [1840, 996, 1912, 1030]);
te = play(t1, 'b', 746, 820, { fade: 0.35 });                                   // (security warning cut)
focus(ft('b', 746, 790, t1), te + 1.2, 'scr', [665, 440, 1062, 760]);           // the new skill
still(te, fr('b', 820)); after(te + 0.6);

// ================= 3.1.2 从技能池载入 =================
section('3.1 技能', '3.1.2 从技能池载入', 1);
still(T - CARD + 0.45, fr('a', 80));
s = say('点击【从技能池载入】按钮，');
te = play(s + 0.3, 'a', 80, 124);
focus(s, ft('a', 80, 118, s + 0.3), 'scr', [1240, 118, 1372, 152]);
still(te, fr('a', 124)); after(te);

s = say('在弹出的页面中，选择要载入到当前智能体的技能，');
te = play(s + 0.1, 'a', 124, 186);
focus(s, te + 0.3, 'scr', [652, 138, 1264, 545]);
still(te, fr('a', 186)); after(te);

s = say('点击【确认】，技能池技能即下载到当前工作区。');
te = play(s + 0.2, 'a', 186, 250);
focus(s, ft('a', 186, 193, s + 0.2), 'scr', [1172, 482, 1240, 516]);
focus(ft('a', 186, 197, s + 0.2), te + 0.3, 'scr', [860, 44, 1062, 96]);         // 已下载至当前工作区
still(te, fr('a', 250)); after(te);

// ================= 3.1.3 同步到技能池 =================
section('3.1 技能', '3.1.3 同步到技能池', 2);
still(T - CARD + 0.45, fr('a', 300));
s = say('点击【同步到技能池】按钮，选择要同步的技能，');
te = play(s + 0.3, 'a', 300, 515);
focus(s, ft('a', 300, 377, s + 0.3), 'scr', [1384, 118, 1508, 152]);
focus(ft('a', 300, 380, s + 0.3), te + 0.3, 'scr', [652, 138, 1264, 545]);
still(te, fr('a', 515)); after(te);

s = say('点击【确认】，技能即同步到技能池。');
te = play(s + 0.2, 'a', 515, 630, { speed: 1.5 });
focus(s, ft('a', 515, 522, s + 0.2, 1.5), 'scr', [1172, 482, 1240, 516]);
focus(ft('a', 515, 587, s + 0.2, 1.5), te + 0.3, 'scr', [860, 44, 1062, 96]);    // 已上传至技能池
still(te, fr('a', 630)); after(te);

// ================= 3.1.4 上传技能 =================
section('3.1 技能', '3.1.4 上传技能', 3);
still(T - CARD + 0.45, fr('a', 1375));
s = say('点击【本地压缩包上传】，选择技能zip文件，');
te = play(s + 0.3, 'a', 1375, 1500);
focus(s, ft('a', 1375, 1412, s + 0.3), 'scr', [1520, 118, 1666, 152]);
focus(ft('a', 1375, 1416, s + 0.3), te + 0.3, 'scr', [8, 0, 950, 530]);           // file dialog
still(te, fr('a', 1500)); after(te);

s = say('点击【打开】，上传成功后可在技能列表中看到该技能。');
t1 = play(s + 0.2, 'a', 1500, 1525);
focus(s, ft('a', 1500, 1510, s + 0.2), 'scr', [744, 498, 846, 524]);
te = play(t1, 'a', 1582, 1690, { fade: 0.2 });                                 // (security warning cut)
focus(t1, ft('a', 1582, 1600, t1), 'scr', [830, 44, 1100, 96]);                // 技能上传成功
focus(ft('a', 1582, 1625, t1), te + 0.6, 'scr', [665, 425, 1062, 748]);         // the uploaded skill
still(te, fr('a', 1690)); after(te + 0.4);

// ================= 3.1.5 保存本地 =================
section('3.1 技能', '3.1.5 保存本地', 4);
still(T - CARD + 0.45, fr('b', 806));
s = say('自定义类型的技能新增【保存本地】功能，支持技能导出：');
focus(s + 0.2, T - 0.1, 'scr', [665, 440, 1062, 760]);
focus(s + 1.8, T - 0.1, 'scr', [772, 716, 862, 748]);

s = say('点击【保存本地】，选择保存位置，即可导出到本地。');
te = play(s + 0.2, 'b', 1160, 1420, { speed: 1.4 });
focus(ft('b', 1160, 1180, s + 0.2, 1.4), ft('b', 1160, 1402, s + 0.2, 1.4), 'scr', [8, 0, 950, 530]);
focus(ft('b', 1160, 1408, s + 0.2, 1.4), te + 0.6, 'scr', [730, 40, 1185, 98]);  // 已保存至本地路径
still(te, fr('b', 1420)); after(te);

s = say('不需要的自定义技能，可点击【删除】移除。');
te = play(s + 0.2, 'b', 1550, 1625);
focus(s, ft('b', 1550, 1566, s + 0.2), 'scr', [958, 716, 1024, 748]);
focus(ft('b', 1550, 1568, s + 0.2), ft('b', 1550, 1604, s + 0.2), 'scr', [748, 136, 1168, 290]);
focus(ft('b', 1550, 1608, s + 0.2), te + 0.6, 'scr', [890, 44, 1120, 98]);       // 技能删除成功
still(te, fr('b', 1625)); after(te);

// ================= 3.2.1 创建知识库 =================
section('3.2 个人知识库', '3.2.1 创建知识库', 5);
still(T - CARD + 0.45, fr('c', 190));
s = say('点击【个人知识库】菜单，点击【创建知识库】，');
t1 = play(s + 0.2, 'c', 190, 214);
focus(s, t1, 'scr', [24, 598, 214, 632]);
t2 = play(t1, 'c', 435, 500, { fade: 0.35 });                                 // (removing the old one cut)
focus(ft('c', 435, 470, t1), ft('c', 435, 493, t1), 'scr', [1006, 436, 1134, 476]);
still(t2, fr('c', 500)); after(t2);

s = say('填写知识库名称，选择保存位置，');
t1 = play(s + 0.1, 'c', 500, 640, { speed: 2 });                                // name (typed with an IME)
focus(s, t1, 'scr', [790, 352, 1272, 424]);                                     // name
te = play(t1, 'c', 640, 790, { speed: 1.5 });                                   // folder picker
focus(t1 + 0.4, te + 0.3, 'scr', [790, 436, 1300, 492]);                        // save location
still(te, fr('c', 790)); after(te);

s = say('勾选知识库类型，设置LLM模型，最后点击【创建知识库】。');
te = play(s + 0.2, 'c', 790, 905);
focus(s, ft('c', 790, 838, s + 0.2), 'scr', [604, 652, 1312, 756]);            // types
focus(ft('c', 790, 840, s + 0.2), ft('c', 790, 868, s + 0.2), 'scr', [604, 556, 1312, 866]);   // types + LLM model
focus(ft('c', 790, 868, s + 0.2), te + 0.3, 'scr', [1186, 926, 1316, 972]);     // 创建知识库
still(te, fr('c', 905)); after(te + 0.4);

s = say('若本地已存在个人知识库文件夹，点击【打开知识库】，选择该文件夹导入即可。');
still(s, 'shot:img26', { synth: true, fade: 0.35 });
cur(s, 0, 'shot:img26', 900, 420);
focus(s + 0.3, s + 2.4, 'shot:img26', [1012, 197, 1118, 229]);
cur(s + 0.4, 1.0, 'shot:img26', 1065, 213);
click(s + 1.6, 'shot:img26', 1065, 213);
still(s + 1.75, 'shot:img25', { synth: true, fade: 0.3, pop: pr('img25', [449, 183, 1235, 823]) });
cur(s + 2.4, 0.8, 'shot:img25', 530, 545);
click(s + 3.4, 'shot:img25', 530, 545);
MARKS.push({ kind: 'tick', space: 'shot:img25', x: 494, y: 545, size: 14, t0: s + 3.4, t1: 1e9, on: 'shot:img25' });
focus(s + 3.8, s + 5.4, 'shot:img25', [1036, 785, 1122, 815]);
cur(s + 3.9, 0.9, 'shot:img25', 1078, 800);
click(s + 5.0, 'shot:img25', 1078, 800);
still(s + 5.2, 'shot:img26', { synth: true, fade: 0.3 });
after(s + 6.0);

// ================= 3.2.2 打开知识库 =================
section('3.2 个人知识库', '3.2.2 打开知识库', 6);
still(T - CARD + 0.45, fr('d', 60));
s = say('点击【打开知识库】按钮，进入知识库的操作页面。');
te = play(s + 0.2, 'd', 60, 135);
focus(s, ft('d', 60, 116, s + 0.2), 'scr', [452, 392, 494, 428]);
still(te, fr('d', 135)); after(te);

s = say('在【我的文档】标签页，点击【文件】，选择本地文件，即可完成文件上传；');
te = play(s + 0.2, 'd', 135, 335, { speed: 1.3 });
focus(s, ft('d', 135, 198, s + 0.2, 1.3), 'scr', [1712, 358, 1786, 390]);
focus(ft('d', 135, 218, s + 0.2, 1.3), ft('d', 135, 320, s + 0.2, 1.3), 'scr', [8, 0, 980, 540]);
focus(ft('d', 135, 324, s + 0.2, 1.3), te + 0.4, 'scr', [270, 440, 1880, 480]);
still(te, fr('d', 335)); after(te);

s = say('点击【文件夹】，选择本地文件夹，即可批量上传；');
te = play(s + 0.2, 'd', 335, 560, { speed: 1.6 });
focus(s, ft('d', 335, 373, s + 0.2, 1.6), 'scr', [1788, 358, 1880, 390]);
focus(ft('d', 335, 388, s + 0.2, 1.6), ft('d', 335, 532, s + 0.2, 1.6), 'scr', [772, 292, 1152, 736]);
focus(ft('d', 335, 540, s + 0.2, 1.6), te + 0.4, 'scr', [270, 440, 1880, 530]);
still(te, fr('d', 560)); after(te);

s = say('上传的文件默认自动解析，点击【解析队列】标签页可查看解析进度；');
te = play(s + 0.2, 'd', 600, 700);
focus(s, ft('d', 600, 627, s + 0.2), 'scr', [470, 298, 566, 330]);
focus(ft('d', 600, 630, s + 0.2), T - 0.1, 'scr', [270, 380, 1880, 700]);
still(te, fr('d', 700)); after(te);

s = say('点击【全部暂停】，可暂停全部文件的解析；');
te = play(s + 0.2, 'd', 700, 765);
focus(s, T - 0.1, 'scr', [1724, 450, 1812, 486]);
still(te, fr('d', 765)); after(te);

s = say('点击【全部开始】，已暂停的文件重新开始解析。');
te = play(s + 0.2, 'd', 790, 835);
focus(s, T - 0.1, 'scr', [1724, 450, 1812, 486]);
still(te, fr('d', 835)); after(te);

s = say('在【我的文档】中点击【打开】，即可查看该文档的内容；');
t1 = play(s + 0.2, 'd', 975, 1076);
focus(s, ft('d', 975, 982, s + 0.2), 'scr', [262, 298, 350, 330]);
focus(ft('d', 975, 1040, s + 0.2), ft('d', 975, 1068, s + 0.2), 'scr', [1648, 504, 1694, 540]);
te = play(t1, 'd', 1095, 1180, { fade: 0.25 });                                // the document in WPS (splash cut)
still(te, fr('d', 1180)); after(te);

s = say('点击【重新解析】，可对单个文档重新解析。');
still(s, 'shot:img31', { synth: true, fade: 0.35 });
cur(s, 0, 'shot:img31', 900, 600);
focus(s + 0.3, T - 0.1, 'shot:img31', [1055, 455, 1115, 480]);
cur(s + 0.4, 1.0, 'shot:img31', 1085, 467);
click(s + 1.6, 'shot:img31', 1085, 467);

s = say('点击【Wiki预览】标签页，可查看文档解析后的概要，按概览、实体、概念等维度展示。');
focus(s, s + 1.6, 'shot:img31', [365, 294, 452, 328]);
cur(s + 0.1, 1.0, 'shot:img31', 406, 311);
click(s + 1.3, 'shot:img31', 406, 311);
still(s + 1.45, 'shot:img32', { synth: true, fade: 0.35 });
focus(s + 1.9, T - 0.1, 'shot:img32', [253, 338, 1250, 772]);
cur(s + 2.0, 0.9, 'shot:img32', 320, 431);
cur(s + 3.6, 0.8, 'shot:img32', 310, 494);
cur(s + 5.0, 0.8, 'shot:img32', 310, 640);
after(s + 6.4);

// ================= 3.2.3 会话问答 =================
section('3.2 个人知识库', '3.2.3 会话问答', 7);
still(T - CARD + 0.45, 'shot:img26', { synth: true });
cur(T - CARD + 0.45, 0, 'shot:img26', 900, 600);
s = say('点击【会话问答】或【对话】，输入问题后点击【发送】，');
focus(s, s + 2.0, 'shot:img26', [579, 390, 616, 420]);
cur(s + 0.2, 1.0, 'shot:img26', 598, 406);
click(s + 1.5, 'shot:img26', 598, 406);
still(s + 1.7, 'shot:img37_empty', { synth: true, fade: 0.35 });
cur(s + 2.0, 0.8, 'shot:img37_empty', 700, 706);
click(s + 2.9, 'shot:img37_empty', 700, 706);
{
  const q = '北京出差标准是什么', t0 = s + 3.1, tq = t0 + q.length * TYPE_DT;
  TYPES.push({ space: 'shot:img37_empty', rect: [476, 694, 1000, 717], text: q, px: 14, tClick: s + 2.95, t0, tEnd: tq + 1.6, on: ['shot:img37_empty'] });
  focus(s + 2.8, tq + 0.3, 'shot:img37_empty', [463, 677, 1237, 777]);
  cur(tq + 0.2, 0.9, 'shot:img37_empty', 1177, 753);
  click(tq + 1.3, 'shot:img37_empty', 1177, 753);
  still(tq + 1.5, 'shot:img37', { synth: true, fade: 0.4 });
  after(tq + 1.7);
}
s = say('模型会基于该知识库给出相关回答。');
focus(s + 0.2, T + 0.4, 'shot:img37', [452, 252, 1232, 662]);
cur(s + 0.3, 1.0, 'shot:img37', 900, 520);
pause(1.0);

// ---- 下一节 (no recap) ----
const tRecap = T;
const tNext = 1e9;   // the last video: no "next section" page
T += 0.8;
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
    const url = name.startsWith('shot:') ? `assets/${name.slice(5)}.png` : `assets/rec3/${name}.jpg`;
    FRAMES.set(name, loadImg(url).then((i) => i.decode().then(() => i)));
    if (FRAMES.size > 14) FRAMES.delete(FRAMES.keys().next().value);
  }
  return FRAMES.get(name);
}

let cv, ctx;
export async function setup() {
  cv = document.getElementById('c');
  ctx = cv.getContext('2d');
  IMG.shot_bg = await loadImg('assets/rec3/shot_bg.jpg');
  await Promise.all([fr('b', 105), 'shot:img26'].map(frameImg));
  const all = SUBS.map((s) => s.text).join('') + CARDS.map((c) => c.tag + c.title).join('') +
    TIPS.map((t) => t.text).join('') + TYPES.map((t) => t.text).join('') + ALLTEXT;
  await Promise.all(['400', '500', '700'].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, all)));
}
const ALLTEXT = '苏电智伴（IM）使用手册第三部分常用功能1、下载、安装登录2、会话区3、工作区本节下一节提示' +
  '创建技能从池载入同步到上传保存本地知识库打开会话问答0123456789';

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

const STEPS = ['创建技能', '从技能池载入', '同步到技能池', '上传技能', '保存本地', '创建知识库', '打开知识库', '会话问答'];
function drawTopBar(g, t) {
  const a = clamp((t - tStageIn) / 0.6);
  if (a <= 0) return;
  g.save();
  g.globalAlpha = a;
  // chapter pill
  g.font = font(26, 700); g.textBaseline = 'middle';
  const label = '3、工作区';
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
  drawOutline(g, t, 2, 240, 560, 2.2);
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
  if (false) {   // no recap page
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
