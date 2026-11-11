// Engine for the "client window" training videos (videos 2 and 3).
// A film is built from a definition: images, a progress-bar step list and a build(api) function
// that lays out subtitles, cards, clicks, camera moves and screen changes on one timeline.
// Every frame is a pure function of t. Output plays SPEED× faster than the authored timeline.

export const W = 1920, H = 1080;
const FONT = '"Noto Sans SC", "WenQuanYi Zen Hei", sans-serif';
const C = {
  bg: '#E8EDF2', ink: '#1E2933', sub: '#5B6875',
  green: '#00897B', greenLight: '#5EE0C4',
  tipBg: '#FFF6D6', tipLine: '#E9B949',
};
const STAGE = { x: 40, y: 84, w: 1840, h: 820, r: 18 };
const SUBY = 990;
const WCX = STAGE.w / 2, WCY = STAGE.h / 2;
const OUTLINE = ['1、下载、安装登录', '2、会话区', '3、工作区'];

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const backOut = (k) => { const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const prog = (t, t0, d) => clamp((t - t0) / d);
const win = (t, t0, t1, fin = 0.25, fout = 0.25) => Math.min(clamp((t - t0) / fin), clamp((t1 - t) / fout));

function readTime(text) {
  let n = 0;
  for (const ch of text.replace(/[【】]/g, '')) n += /[\x00-\x7F]/.test(ch) ? 0.5 : 1;
  return Math.max(2.5, n / 4 + 1.5);
}
function font(px, w = 400) { return `${w} ${px}px ${FONT}`; }
function rr(g, x, y, w, h, r, fresh = true) {
  if (fresh) g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export function makeFilm(def) {
  const SPEED = def.speed || 1.2;
  const HD = def.hd ? 2 : 1;   // def.hd: use the 2x screenshots in assets/hd; otherwise the originals
  const SIZES = def.sizes;   // name → [w, h]

  // window geometry for an image: fit inside the stage with a margin, centred
  const geoCache = {};
  function geo(name) {
    if (geoCache[name]) return geoCache[name];
    const [w, h] = SIZES[name];
    // 1:1 whenever the window fits (sharpest); otherwise scale down to fit
    const s = Math.min(1, (STAGE.w - 80) / w, (STAGE.h - 4) / h);
    return (geoCache[name] = { s, x: (STAGE.w - w * s) / 2, y: (STAGE.h - h * s) / 2, w, h });
  }
  const toWorld = (img, x, y) => {
    if (img === 'world') return [x, y];
    const q = geo(img); return [q.x + x * q.s, q.y + y * q.s];
  };

  // ---------- timeline ----------
  const SUBS = [], CARDS = [], TIPS = [], BADGES = [], FOCUS = [], CLICKS = [], CAM = [], CUR = [],
    STEP = [], SHOTS = [], HOVERS = [], EXTRAS = [];
  let T = 0;
  const api = {
    get T() { return T; },
    set T(v) { T = v; },
    say(text, minDur = 0) {
      const d = Math.max(readTime(text), minDur);
      SUBS.push({ t0: T, t1: T + d, text });
      const s = T; T += d; return s;
    },
    pause(d) { T += d; },
    card(tag, title, step, d = 3.0) {
      CARDS.push({ t0: T, t1: T + d, tag, title });
      if (step !== undefined) STEP.push({ t: T + 0.4, i: step });
      const s = T; T += d + 0.4; return s;
    },
    tip(t0, t1, text) { TIPS.push({ t0, t1, text }); },
    // show an image from time t: fade = crossfade time, pop = region that scales in (menus, dialogs)
    show(t, img, o = {}) { SHOTS.push({ t, img, fade: o.fade ?? 0.3, pop: o.pop }); },
    cam(t, d, img, x, y, z) { const [wx, wy] = toWorld(img, x, y); CAM.push({ t, d, cx: wx, cy: wy, z }); },
    camHome(t, d, img, z = 1) { const q = geo(img); CAM.push({ t, d, cx: q.x + q.w * q.s / 2, cy: q.y + q.h * q.s / 2, z }); },
    cur(t, d, img, x, y) { CUR.push({ t, d, img, x, y }); },
    click(t, img, x, y) { CLICKS.push({ t, img, x, y }); },
    focus(t0, t1, img, rect) { FOCUS.push({ t0, t1, img, rect }); },
    badge(t0, t1, n, img, x, y) { BADGES.push({ t0, t1, n, img, x, y }); },
    hover(t0, t1, img, rect) { HOVERS.push({ t0, t1, img, rect }); },
    // custom drawing in image coordinates on top of the window: draw(g, t, imgs)
    extra(t0, t1, img, draw) { EXTRAS.push({ t0, t1, img, draw }); },
    // move to a point and click it (returns click time)
    moveClick(t, img, x, y, d = 1.2) { api.cur(t, d, img, x, y); api.click(t + d + 0.25, img, x, y); return t + d + 0.25; },
  };

  // title
  const tStageIn = 6.6;
  T = 7.2;
  CUR.push({ t: 0, d: 0, img: 'world', x: STAGE.w - 260, y: STAGE.h - 120 });
  def.build(api);
  const tEnd = T;
  T += 3.0;
  const DUR_FILM = T + 0.6;
  if (!CAM.length || CAM[0].t > 0) CAM.unshift({ t: 0, d: 0, cx: WCX, cy: WCY, z: 1 });
  SHOTS.sort((a, b) => a.t - b.t);
  CAM.sort((a, b) => a.t - b.t);
  CUR.sort((a, b) => a.t - b.t);

  // ---------- assets ----------
  const IMG = {};
  let cv, ctx;
  async function setup() {
    cv = document.getElementById('c');
    ctx = cv.getContext('2d');
    const names = new Set(SHOTS.map((s) => s.img).concat(def.preload || []));
    await Promise.all([...names].map((n) => new Promise((res, rej) => {
      const i = new Image(); i.onload = () => { IMG[n] = i; res(); }; i.onerror = rej; i.src = HD === 2 ? `assets/hd/${n}.png` : `assets/${n}.png`;
    })));
    const all = SUBS.map((s) => s.text).join('') + CARDS.map((c) => c.tag + c.title).join('') +
      TIPS.map((t) => t.text).join('') + OUTLINE.join('') + def.label + def.steps.join('') +
      '苏电智伴（IM）使用手册第三部分常用功能本节下一节提示' + (def.glyphs || '');
    await Promise.all(['400', '500', '700'].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, all)));
  }

  // ---------- state at t ----------
  function camAt(t) {
    let cx = CAM[0].cx, cy = CAM[0].cy, z = CAM[0].z;
    for (const k of CAM) {
      if (t < k.t) break;
      const p = k.d ? ease(prog(t, k.t, k.d)) : 1;
      cx = lerp(cx, k.cx, p); cy = lerp(cy, k.cy, p); z = Math.exp(lerp(Math.log(z), Math.log(k.z), p));
    }
    return { cx, cy, z };
  }
  const W2S = (cam, x, y) => [STAGE.x + STAGE.w / 2 + (x - cam.cx) * cam.z, STAGE.y + STAGE.h / 2 + (y - cam.cy) * cam.z];
  function cursorAt(t) {
    let [x, y] = toWorld(CUR[0].img, CUR[0].x, CUR[0].y);
    for (const k of CUR) {
      if (t < k.t) break;
      const [tx, ty] = toWorld(k.img, k.x, k.y);
      const p = k.d ? ease(prog(t, k.t, k.d)) : 1;
      const ax = -(ty - y) * 0.12 * Math.sin(Math.PI * p), ay = (tx - x) * 0.12 * Math.sin(Math.PI * p);
      x = lerp(x, tx, p) + ax; y = lerp(y, ty, p) + ay;
    }
    return [x, y];
  }

  // ---------- window ----------
  function drawShot(g, name, alpha, clipOut) {
    const q = geo(name), im = IMG[name];
    g.save();
    g.globalAlpha = alpha;
    g.translate(q.x, q.y); g.scale(q.s, q.s);
    if (clipOut) {
      g.beginPath(); g.rect(-50, -50, q.w + 100, q.h + 100);
      g.rect(clipOut[0], clipOut[1], clipOut[2] - clipOut[0], clipOut[3] - clipOut[1]);
      g.clip('evenodd');
    }
    g.drawImage(im, 0, 0, q.w, q.h);
    g.restore();
  }
  function drawFrame(g, name, alpha) {
    const q = geo(name);
    g.save();
    g.globalAlpha = alpha;
    g.shadowColor = 'rgba(20,35,50,0.28)'; g.shadowBlur = 40; g.shadowOffsetY = 14;
    g.fillStyle = '#FFFFFF';
    rr(g, q.x, q.y, q.w * q.s, q.h * q.s, 8); g.fill();
    g.restore();
  }
  function drawWindow(g, t) {
    let i = -1;
    for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
    if (i < 0) return;
    const cur = SHOTS[i], prev = SHOTS[i - 1];
    const k = cur.fade ? prog(t, cur.t, cur.fade) : 1;
    const sameGeo = prev && geo(prev.img).x === geo(cur.img).x && geo(prev.img).s === geo(cur.img).s;
    if (prev && k < 1) {
      drawFrame(g, prev.img, 1);
      drawShot(g, prev.img, 1);
      if (!sameGeo) drawFrame(g, cur.img, easeOut(k));
    } else drawFrame(g, cur.img, 1);
    if (cur.pop && prev && k < 1) {
      // everything but the pop-up region fades fast; the pop-up scales in from its anchor
      drawShot(g, cur.img, easeOut(clamp(k * 2)), cur.pop);
      const q = geo(cur.img), r = cur.pop;
      const sc = lerp(0.9, 1, backOut(k));
      const ax = (r[0] + r[2]) / 2, ay = r[1];
      g.save();
      g.globalAlpha = easeOut(k);
      g.translate(q.x, q.y); g.scale(q.s, q.s);
      g.translate(ax, ay); g.scale(sc, sc); g.translate(-ax, -ay);
      g.drawImage(IMG[cur.img], r[0] * HD, r[1] * HD, (r[2] - r[0]) * HD, (r[3] - r[1]) * HD, r[0], r[1], r[2] - r[0], r[3] - r[1]);
      g.restore();
    } else {
      drawShot(g, cur.img, prev ? easeOut(k) : 1);
    }
    // hovers and extras drawn on whichever image is current
    for (const h of HOVERS) {
      const a = win(t, h.t0, h.t1, 0.15, 0.15);
      if (a <= 0) continue;
      const q = geo(h.img);
      g.save(); g.translate(q.x, q.y); g.scale(q.s, q.s);
      g.globalAlpha = a * 0.14; g.fillStyle = '#2E7CF6';
      rr(g, h.rect[0], h.rect[1], h.rect[2] - h.rect[0], h.rect[3] - h.rect[1], 6); g.fill();
      g.restore();
    }
    for (const e of EXTRAS) {
      if (t < e.t0 || t >= e.t1) continue;
      const q = geo(e.img);
      g.save(); g.translate(q.x, q.y); g.scale(q.s, q.s);
      e.draw(g, t, IMG, { font, rr, prog, easeOut, clamp, crop: (im, sx, sy, sw, sh, dx, dy) =>
        g.drawImage(im, sx * HD, sy * HD, sw * HD, sh * HD, dx, dy, sw, sh) });
      g.restore();
    }
  }

  // ---------- overlays ----------
  function rectToScreen(cam, img, r) {
    const a = W2S(cam, ...toWorld(img, r[0], r[1])), b = W2S(cam, ...toWorld(img, r[2], r[3]));
    return [a[0], a[1], b[0], b[1]];
  }
  function drawFocus(g, t, cam) {
    for (const f of FOCUS) {
      const a = win(t, f.t0, f.t1, 0.35, 0.35);
      if (a <= 0) continue;
      const [x1, y1, x2, y2] = rectToScreen(cam, f.img, f.rect);
      const pad = 10;
      g.save();
      g.beginPath();
      g.rect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
      rr(g, x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2, 12, false);
      g.fillStyle = `rgba(14,26,38,${0.36 * a})`;
      g.fill('evenodd');
      g.lineWidth = 3; g.strokeStyle = `rgba(0,137,123,${a})`;
      g.shadowColor = 'rgba(0,160,140,0.6)'; g.shadowBlur = 12 * a;
      rr(g, x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2, 12); g.stroke();
      g.restore();
    }
  }
  function drawBadges(g, t, cam) {
    for (const b of BADGES) {
      const a = win(t, b.t0, b.t1, 0.3, 0.3);
      if (a <= 0) continue;
      const [x, y] = W2S(cam, ...toWorld(b.img, b.x, b.y));
      const k = backOut(prog(t, b.t0, 0.35));
      g.save(); g.globalAlpha = a;
      g.translate(x - 12, y - 12); g.scale(k, k);
      g.fillStyle = C.green; g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 8;
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
      const [x, y] = W2S(cam, ...toWorld(c.img, c.x, c.y));
      g.save();
      g.strokeStyle = `rgba(0,137,123,${0.85 * (1 - k)})`; g.lineWidth = 4;
      g.beginPath(); g.arc(x, y, 8 + 34 * easeOut(k), 0, Math.PI * 2); g.stroke();
      g.fillStyle = `rgba(0,137,123,${0.25 * (1 - k)})`;
      g.beginPath(); g.arc(x, y, 8 + 22 * easeOut(k), 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }
  function drawCursor(g, t, cam) {
    if (t < tStageIn + 1.2 || t > tEnd + 0.3) return;
    const [wx, wy] = cursorAt(t);
    const [x, y] = W2S(cam, wx, wy);
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
      const p = easeOut(prog(t, c.t0 + 0.25, 0.7));
      g.save(); g.beginPath(); g.rect(x + 66, y + 90, (tw + 10) * p, 100); g.clip();
      g.fillText(c.title, x + 70, y + 145);
      g.restore();
      g.restore();
    }
  }
  function layoutRich(g, text, px, w, maxW) {
    g.font = font(px, w);
    const tokens = [];
    let hl = false;
    for (const ch of text) {
      if (ch === '【') { hl = true; tokens.push({ ch, hl: true }); continue; }
      if (ch === '】') { tokens.push({ ch, hl: true }); hl = false; continue; }
      tokens.push({ ch, hl });
    }
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
  function drawTopBar(g, t) {
    const a = clamp((t - tStageIn) / 0.6);
    if (a <= 0) return;
    g.save();
    g.globalAlpha = a;
    g.font = font(26, 700); g.textBaseline = 'middle';
    const lw = g.measureText(def.label).width;
    rr(g, STAGE.x, 18, lw + 48, 50, 25); g.fillStyle = C.green; g.fill();
    g.fillStyle = '#FFFFFF'; g.fillText(def.label, STAGE.x + 24, 44);
    let cur = -1;
    for (const s of STEP) if (t >= s.t) cur = s.i;
    const fs = def.steps.length > 4 ? 20 : 22;
    g.font = font(fs, 500);
    const widths = def.steps.map((s) => g.measureText(s).width + 36);
    const gap = def.steps.length > 4 ? 26 : 46;
    let x = STAGE.x + STAGE.w - widths.reduce((p, w) => p + w, 0) - gap * (def.steps.length - 1);
    def.steps.forEach((s, i) => {
      const done = i < cur, on = i === cur;
      if (i > 0) {
        g.strokeStyle = i <= cur ? C.green : '#B8C3CC'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x - gap + 6, 43); g.lineTo(x - 6, 43); g.stroke();
      }
      rr(g, x, 24, widths[i], 38, 19);
      g.fillStyle = on ? C.green : done ? 'rgba(0,137,123,0.14)' : 'rgba(255,255,255,0.7)'; g.fill();
      g.fillStyle = on ? '#FFFFFF' : done ? C.green : '#8794A0';
      g.fillText(s, x + 18, 44);
      x += widths[i] + gap;
    });
    g.restore();
  }
  function drawOutline(g, t, active, x0, y0, appear) {
    OUTLINE.forEach((s, i) => {
      const k = easeOut(prog(t, appear + i * 0.25, 0.5));
      if (k <= 0) return;
      const on = i === active;
      const y = y0 + i * 92;
      g.save(); g.globalAlpha *= k * (on ? 1 : 0.55);
      g.translate((1 - k) * 30, 0);
      rr(g, x0, y, 620, 72, 14);
      g.fillStyle = on ? '#FFFFFF' : 'rgba(255,255,255,0.6)'; g.fill();
      if (on) { g.lineWidth = 3; g.strokeStyle = C.green; g.stroke(); }
      g.fillStyle = on ? C.ink : C.sub; g.font = font(34, on ? 700 : 500); g.textBaseline = 'middle';
      g.fillText(s, x0 + 32, y + 37);
      if (on) {
        rr(g, x0 + 502, y + 18, 92, 36, 18); g.fillStyle = C.green; g.fill();
        g.fillStyle = '#FFFFFF'; g.font = font(22, 700); g.fillText('本节', x0 + 526, y + 37);
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
    g.fillStyle = 'rgba(0,137,123,0.07)'; g.beginPath(); g.arc(1560, 260, 420, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(46,124,246,0.05)'; g.beginPath(); g.arc(1700, 900, 360, 0, Math.PI * 2); g.fill();
    const k1 = easeOut(prog(t, 0.3, 0.8));
    g.globalAlpha = a * k1;
    g.fillStyle = C.green; g.fillRect(200, 300, 10, 150);
    g.fillStyle = C.sub; g.font = font(36, 500); g.textBaseline = 'alphabetic';
    g.fillText('苏电智伴（IM）使用手册', 240, 340);
    g.fillStyle = C.ink; g.font = font(92, 700);
    g.fillText('第三部分 常用功能', 236, 450);
    g.globalAlpha = a;
    drawOutline(g, t, def.chapter, 240, 560, 2.2);
    g.restore();
  }
  function drawNext(g, t) {
    if (def.chapter >= OUTLINE.length - 1) return;
    const a = Math.min(clamp((t - tEnd) / 0.5), clamp((DUR_FILM - t) / 0.5));
    if (a <= 0) return;
    g.save();
    g.globalAlpha = a;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,137,123,0.07)'; g.beginPath(); g.arc(1560, 260, 420, 0, Math.PI * 2); g.fill();
    const k = easeOut(prog(t, tEnd + 0.3, 0.6));
    g.globalAlpha = a * k;
    g.fillStyle = C.sub; g.font = font(40, 500); g.textBaseline = 'alphabetic';
    g.fillText('下一节', 240, 400);
    g.globalAlpha = a;
    drawOutline(g, t, def.chapter + 1, 240, 450, tEnd + 0.4);
    g.restore();
  }

  function renderFilm(t) {
    const g = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    if (t >= tStageIn - 0.2 && t < tEnd + 0.6) {
      const cam = camAt(t);
      const appear = easeOut(clamp((t - tStageIn) / 0.8));
      g.save();
      g.globalAlpha = appear;
      g.translate(0, (1 - appear) * 30);
      drawTopBar(g, t);
      g.save();
      g.shadowColor = 'rgba(20,35,50,0.18)'; g.shadowBlur = 30; g.shadowOffsetY = 8;
      rr(g, STAGE.x, STAGE.y, STAGE.w, STAGE.h, STAGE.r); g.fillStyle = '#D7DFE6'; g.fill();
      g.restore();
      g.save();
      rr(g, STAGE.x, STAGE.y, STAGE.w, STAGE.h, STAGE.r); g.clip();
      g.save();
      g.translate(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2);
      g.scale(cam.z, cam.z);
      g.translate(-cam.cx, -cam.cy);
      drawWindow(g, t);
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
    drawNext(g, t);
  }

  return {
    setup,
    renderAt: (tOut) => renderFilm(tOut * SPEED),
    OUT_DUR: DUR_FILM / SPEED,
    OUT_SUBS: SUBS.map((x) => ({ t0: x.t0 / SPEED, t1: x.t1 / SPEED, text: x.text })),
  };
}
