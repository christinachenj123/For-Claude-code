# One-off: build film2.js (video 2, recordings) from film.js (video 1) and a timeline file.
# Kept for reference; film2.js is edited directly afterwards.
import sys
TL = sys.argv[1]
s = open('film.js').read()


def cut(s, a, b, new):
    i = s.index(a); j = s.index(b, i)
    return s[:i] + new + s[j:]


s = s.replace("// 苏电智伴 培训视频 第 1 支：下载、安装登录",
              "// 苏电智伴 培训视频 第 2 支：会话区（录屏版，手册截图补足未录到的部分）")

s = cut(s, "// Login window on the desktop", "// drawImage in logical (1x) pixels", """// frames per second of each recording (assets/rec2/<src>/NNNN.jpg)
const FPS_OF = { '21': 30, '221': 25, '223b': 25, '223a': 25, '224': 25, '225': 25 };
// manual screenshots (old client) shown as a window over a softened backdrop, in screen pixels
const SHOT = { img12: [1269, 818], img13: [1270, 809], img16: [1270, 817], img17: [1271, 814] };
const SHOT_S = 1.25;
const shotP = (name, x, y) => {
  const [w, h] = SHOT[name];
  return [(1920 - w * SHOT_S) / 2 + x * SHOT_S, (1080 - h * SHOT_S) / 2 + y * SHOT_S];
};
const HD = 1;
""")

s = s.replace("""const play = (t, src, f0, f1, rate = 1) => { REC.push({ t, src, f0, f1, rate }); return t + (f1 - f0) / FPS_REC / rate; };
const still = (t, img, o = {}) => REC.push({ t, img, synth: !!o.synth, fade: o.fade || 0, pop: o.pop });""",
"""// play a recording at its recorded speed in the output (o.speed for a faster take); o.fade = crossfade in
const play = (t, src, f0, f1, o = {}) => {
  const rate = REAL * (o.speed || 1);
  REC.push({ t, src, f0, f1, rate, fade: o.fade || 0, pop: o.pop });
  return t + (f1 - f0) / FPS_OF[src] / rate;
};
const still = (t, img, o = {}) => REC.push({ t, img, synth: !!o.synth, fade: o.fade || 0, pop: o.pop });
const fr = (src, i) => `${src}/${String(i).padStart(4, '0')}`;""")
s = s.replace("const lgP = (x, y) => sp(LG.x + x * LG.s, LG.y + y * LG.s);\n", "")

s = cut(s, "// --- scenes, in seconds (all computed) ---", "// ---- 下一节 (no recap) ----", open(TL).read())

s = cut(s, "const IMG = {};", "// =====================================================================\n// Camera, cursor and spaces", """const IMG = {};

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

""")

s = s.replace("""  if (space === 'scr') return sp(x, y);
  if (space === 'login') return lgP(x, y);
  return [x, y];""", """  if (space === 'scr') return sp(x, y);
  if (space.startsWith('shot:')) return sp(...shotP(space.slice(5), x, y));
  return [x, y];""")

s = cut(s, "function recAt(t) {", "// =====================================================================\n// Desktop and login", """function recAt(t) {
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
    const n = t < ty.t0 ? 0 : Math.min(ty.text.length, Math.floor((t - ty.t0) / TYPE_DT) + 1);
    const txt = ty.text.slice(0, n), px = ty.px * k, cy = (y1 + y2) / 2;
    g.fillStyle = '#1E2933'; g.textBaseline = 'middle'; g.font = `400 ${px}px "Noto Sans SC"`;
    g.fillText(txt, x1 + 6 * k, cy + 1);
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

""")
s = cut(s, "// =====================================================================\n// Desktop and login", "// =====================================================================\n// Stage overlays", "")

s = s.replace("""  const synth = t >= tDesk + 0.2 || (t < tDesk && R && R.r.synth);
  if (!synth) return;""", """  if (!(R && R.r.synth)) return;   // recordings carry their own pointer""")
s = s.replace("const STEPS = ['方式一  数字化门户下载', '方式二  微门户下载', '安装登录'];",
              "const STEPS = ['切换智能体', '智能体管理', '选择模型', '个人知识库', '联网检索', '密码箱', '附件'];")
s = s.replace("  const label = '1、下载、安装和登录';", "  const label = '2、会话区';")
s = s.replace("""  g.font = font(22, 500);
  const widths = STEPS.map((s) => g.measureText(s).width + 44);
  const gap = 46;""", """  g.font = font(20, 500);
  const widths = STEPS.map((s) => g.measureText(s).width + 36);
  const gap = 26;""")
s = s.replace("    g.fillText(s, x + 22, 44);\n    x += widths[i] + gap;", "    g.fillText(s, x + 18, 44);\n    x += widths[i] + gap;")
s = s.replace("  drawOutline(g, t, 0, 240, 560, 2.2);", "  drawOutline(g, t, 1, 240, 560, 2.2);")
s = s.replace("    drawOutline(g, t, 1, 240, 450, tNext + 0.4);", "    drawOutline(g, t, 2, 240, 450, tNext + 0.4);")
s = s.replace("  const R = t < tDesk + 0.7 ? recAt(t) : null;", "  const R = recAt(t);")
i = s.index("    g.fillStyle = '#D7DFE6'; g.fillRect(-600, -600, STAGE.w + 1200, STAGE.h + 1200);")
j = s.index("    g.restore();\n    drawFocus(g, t, cam);")
s = s[:i] + """    g.fillStyle = '#D7DFE6'; g.fillRect(-600, -600, STAGE.w + 1200, STAGE.h + 1200);
    drawScreenFrame(g, t, R, F);
""" + s[j:]
open('film2.js', 'w').write(s)
print('ok')
