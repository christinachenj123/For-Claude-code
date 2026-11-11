// 苏电智伴 培训视频 第 3 支：工作区（手册 第三部分 3）
import { makeFilm } from './client.js';

const SIZES = {
  img19: [1276, 818], img20: [1279, 816], img21: [1276, 815], img22: [1272, 811], img23: [1278, 814],
  img24: [1277, 817], img25: [1268, 823], img26: [1280, 815], img27: [1278, 809], img28: [1280, 805],
  img29: [1280, 805], img30: [1280, 805], img31: [1280, 805], img32: [1279, 796], img33: [1280, 805],
  img34: [1280, 805], img35: [1280, 805], img36: [1280, 799], img37: [1274, 818], img37_empty: [1274, 818],
  skill_clean: [1279, 816], skill_after: [1279, 816],
};
const GREEN = '#00897B';
const DRAWER = [757, 38, 1276, 818];

// a selected item: green outline and a light green fill (+ a tick in the corner)
function selected(g, u, r, radius = 4, tick = true) {
  g.fillStyle = 'rgba(0,137,123,0.10)';
  u.rr(g, r[0], r[1], r[2] - r[0], r[3] - r[1], radius); g.fill();
  g.strokeStyle = GREEN; g.lineWidth = 2;
  u.rr(g, r[0] + 1, r[1] + 1, r[2] - r[0] - 2, r[3] - r[1] - 2, radius); g.stroke();
  if (!tick) return;
  const x = r[2] - 9, y = r[1] + 9;
  g.fillStyle = GREEN; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 1.8; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - 3.2, y + 0.2); g.lineTo(x - 0.8, y + 2.6); g.lineTo(x + 3.4, y - 2.2); g.stroke();
}
// a primary button that becomes enabled once something is selected
function enabledButton(g, u, r, label) {
  g.fillStyle = '#3A8EE6';
  u.rr(g, r[0], r[1], r[2] - r[0], r[3] - r[1], 5); g.fill();
  g.fillStyle = '#FFFFFF'; g.font = u.font(14, 500); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2 + 1);
  g.textAlign = 'left';
}
// simulated typing: blank the placeholder, then type (multi-line with \n) with a caret
function typing(a, img, text, tClick, tEnd, blank, x, y, o = {}) {
  const px = o.px || 14, dt = o.dt || 0.1, lh = o.lh || px * 1.5, t0 = tClick + 0.3;
  a.extra(tClick + 0.05, tEnd, img, (g, t, I, u) => {
    g.fillStyle = o.bg || '#FFFFFF'; g.fillRect(blank[0], blank[1], blank[2] - blank[0], blank[3] - blank[1]);
    const n = t < t0 ? 0 : Math.min(text.length, Math.floor((t - t0) / dt) + 1);
    const lines = text.slice(0, n).split('\n');
    g.font = o.mono ? `${px}px "Noto Sans SC", monospace` : u.font(px, 400);
    g.fillStyle = o.color || '#1E2933'; g.textBaseline = 'middle';
    lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
    const last = lines[lines.length - 1];
    if (Math.floor(t * 2.2) % 2 === 0 || n < text.length)
      g.fillRect(x + 1 + g.measureText(last).width, y + (lines.length - 1) * lh - px * 0.6, 1.2, px * 1.2);
  });
  return t0 + text.length * dt;
}

const SKILL_MD = '---\nname: weather_query\ndescription: 查询指定城市的天气信息\n---\n\n根据用户提供的城市名称，查询并返回当天的天气情况。';

const film = makeFilm({
  chapter: 2,
  label: '3、工作区',
  steps: ['创建技能', '从技能池载入', '同步到技能池', '上传技能', '保存本地', '创建知识库', '打开知识库', '会话问答'],
  sizes: SIZES,
  glyphs: 'weather_query查询指定城市的天气信息根据用户提供的城市名称，并返回当天情况规章制度知识库测试文档.doc北京出差标准是什么确认---:',
  preload: ['img36'],
  build(a) {
    let s, c, c2, e;
    a.show(0, 'img26', { fade: 0 });

    // ================= 3.1 技能 =================
    // ---- 3.1.1 创建技能 ----
    a.card('3.1 技能', '3.1.1 创建技能', 0);
    s = a.say('点击【技能】菜单，点击右上角【创建技能】按钮，弹出创建页面。', 10.0);
    a.cam(s + 0.1, 1.0, 'img26', 330, 420, 1.8);
    a.focus(s + 0.3, s + 2.2, 'img26', [22, 358, 214, 395]);
    a.badge(s + 0.3, s + 2.3, 1, 'img26', 22, 358);
    c = a.moveClick(s + 0.6, 'img26', 72, 376, 1.0);
    a.show(c + 0.15, 'skill_clean', { fade: 0.3 });
    a.cam(c + 0.6, 0.9, 'skill_clean', 330, 125, 1.8);          // up to the toolbar row first,
    a.cam(c + 1.6, 1.2, 'skill_clean', 1060, 125, 2.6);         // then along it to the right
    a.focus(c + 2.6, c + 3.8, 'skill_clean', [1120, 113, 1228, 147]);
    a.badge(c + 2.6, c + 3.8, 2, 'skill_clean', 1120, 113);
    c2 = a.moveClick(c + 2.0, 'skill_clean', 1173, 130, 1.4);
    a.show(c2 + 0.15, 'img19', { fade: 0.35, slide: DRAWER });
    a.cam(c2 + 0.5, 1.2, 'img19', 1010, 330, 1.5);

    s = a.say('输入技能名称和技能内容（Markdown格式，需包含name和description）。', 14.0);
    a.focus(s + 0.3, s + 2.6, 'img19', [782, 120, 1240, 182]);
    c = a.moveClick(s + 0.5, 'img19', 900, 165, 0.9);
    const tName = typing(a, 'img19', 'weather_query', c, a.T + 2.0, [786, 153, 1234, 178], 795, 165, { dt: 0.09 });
    c2 = a.moveClick(tName + 0.5, 'img19', 1010, 400, 0.9);
    a.focus(c2 - 0.6, a.T - 0.2, 'img19', [782, 205, 1240, 530]);
    typing(a, 'img19', SKILL_MD, c2, a.T + 2.0, [786, 264, 1222, 526], 796, 282, { px: 13, lh: 20.5, dt: 0.045, mono: true, color: '#333A44' });

    s = a.say('点击【创建】按钮，成功后可以在技能列表中看到新创建的技能。', 9.5);
    a.cam(s + 0.2, 1.0, 'img19', 1080, 640, 1.6);
    a.focus(s + 0.3, s + 2.1, 'img19', [1207, 778, 1262, 810]);
    a.badge(s + 0.3, s + 2.2, 3, 'img19', 1207, 778);
    c = a.moveClick(s + 0.6, 'img19', 1234, 794, 1.0);
    a.show(c + 0.15, 'skill_after', { fade: 0.35, unslide: DRAWER });
    a.cam(c + 0.5, 1.4, 'skill_after', 830, 380, 1.25);
    a.focus(c + 1.2, a.T - 0.1, 'skill_after', [752, 231, 1231, 560]);
    a.cur(c + 0.7, 1.0, 'skill_after', 1080, 440);
    a.pause(1.0);

    // ---- 3.1.2 从技能池载入 ----
    c = a.card('3.1 技能', '3.1.2 从技能池载入', 1);
    a.cam(c + 1.0, 0.8, 'skill_after', 640, 408, 1.0);
    s = a.say('也可从技能池载入技能：点击【从技能池载入】按钮。', 7.0);
    a.cam(s + 0.1, 1.1, 'skill_after', 760, 200, 1.6);
    a.focus(s + 0.3, s + 2.4, 'skill_after', [600, 114, 728, 146]);
    a.badge(s + 0.3, s + 2.5, 1, 'skill_after', 600, 114);
    c = a.moveClick(s + 0.6, 'skill_after', 664, 130, 1.1);
    a.show(c + 0.15, 'img20', { fade: 0.3, pop: [339, 138, 938, 528] });
    a.cam(c + 0.4, 1.1, 'img20', 639, 340, 1.45);

    s = a.say('在弹出的页面中，选择想载入到当前智能体中的技能。', 7.0);
    a.focus(s + 0.2, s + 1.9, 'img20', [365, 256, 913, 450]);
    c = a.moveClick(s + 1.0, 'img20', 570, 428, 1.0);
    e = a.T + 1.9;
    a.extra(c, e, 'img20', (g, t, I, u) => { selected(g, u, [504, 407, 635, 449]); enabledButton(g, u, [835, 477, 914, 507], '确 认'); });

    s = a.say('点击 【确认】按钮，将技能池技能加载到本地；', 7.0);
    a.focus(s + 0.2, s + 2.2, 'img20', [835, 477, 914, 507]);
    a.badge(s + 0.2, s + 2.3, 2, 'img20', 835, 477);
    c = a.moveClick(s + 0.5, 'img20', 875, 492, 1.0);
    a.show(c + 0.15, 'skill_after', { fade: 0.3 });
    a.cam(c + 0.4, 1.2, 'skill_after', 640, 408, 1.0);
    a.pause(1.0);

    // ---- 3.1.3 同步到技能池 ----
    a.card('3.1 技能', '3.1.3 同步到技能池', 2);
    s = a.say('点击【同步到技能池】按钮。', 6.0);
    a.cam(s + 0.1, 1.1, 'skill_after', 860, 200, 1.6);
    a.focus(s + 0.3, s + 2.4, 'skill_after', [736, 114, 866, 146]);
    a.badge(s + 0.3, s + 2.5, 1, 'skill_after', 736, 114);
    c = a.moveClick(s + 0.6, 'skill_after', 800, 130, 1.1);
    a.show(c + 0.15, 'img21', { fade: 0.3, pop: [338, 138, 937, 528] });
    a.cam(c + 0.4, 1.1, 'img21', 638, 340, 1.45);

    s = a.say('选择想要同步到技能池中的技能。', 6.0);
    a.focus(s + 0.2, s + 1.9, 'img21', [364, 256, 912, 450]);
    c = a.moveClick(s + 0.9, 'img21', 845, 378, 1.0);
    e = a.T + 1.9;
    a.extra(c, e, 'img21', (g, t, I, u) => { selected(g, u, [780, 357, 911, 399]); enabledButton(g, u, [834, 477, 913, 507], '确 认'); });

    s = a.say('点击 【确认】按钮，技能同步到技能池里。', 7.0);
    a.focus(s + 0.2, s + 2.2, 'img21', [834, 477, 913, 507]);
    a.badge(s + 0.2, s + 2.3, 2, 'img21', 834, 477);
    c = a.moveClick(s + 0.5, 'img21', 874, 492, 1.0);
    a.show(c + 0.15, 'skill_after', { fade: 0.3 });
    a.cam(c + 0.4, 1.2, 'skill_after', 640, 408, 1.0);
    a.pause(1.0);

    // ---- 3.1.4 上传技能 ----
    a.card('3.1 技能', '3.1.4 上传技能', 3);
    s = a.say('点击 【本地压缩包上传】。', 6.0);
    a.cam(s + 0.1, 1.1, 'skill_after', 950, 200, 1.6);
    a.focus(s + 0.3, a.T - 0.1, 'skill_after', [880, 114, 1023, 146]);
    a.badge(s + 0.3, a.T, 1, 'skill_after', 880, 114);
    a.moveClick(s + 0.6, 'skill_after', 952, 130, 1.1);
    s = a.say('选择需要上传的技能zip文件。');
    s = a.say('点击 【打开】按钮，成功后可以在技能列表中看到上传的技能。', 9.0);
    a.show(s + 0.3, 'img22', { fade: 0.45 });
    a.cam(s + 0.3, 1.4, 'img22', 636, 405, 1.0);
    a.cur(s + 0.6, 1.0, 'img22', 980, 520);
    a.cam(s + 2.0, 1.3, 'img22', 560, 600, 1.35);
    a.focus(s + 2.2, a.T - 0.1, 'img22', [252, 455, 731, 782]);
    a.cur(s + 2.4, 1.0, 'img22', 520, 600);
    a.pause(1.0);

    // ---- 3.1.5 保存本地 ----
    c = a.card('3.1 技能', '3.1.5 保存本地', 4);
    a.show(c + 1.2, 'img23', { fade: 0.3 });
    s = a.say('自定义类型的技能新增【保存本地】功能，支持技能导出。', 8.0);
    a.cam(s + 0.1, 1.1, 'img23', 480, 640, 1.6);
    a.focus(s + 0.3, s + 2.6, 'img23', [295, 553, 440, 579]);
    a.focus(s + 2.8, a.T - 0.1, 'img23', [386, 736, 494, 769]);
    a.badge(s + 2.8, a.T, 1, 'img23', 386, 736);
    a.moveClick(s + 3.0, 'img23', 440, 752, 1.1);
    a.pause(1.0);

    // ================= 3.2 个人知识库 =================
    // ---- 3.2.1 创建知识库 ----
    c = a.card('3.2 个人知识库', '3.2.1 创建知识库', 5);
    a.cam(c + 1.0, 0.8, 'img23', 639, 407, 1.0);
    s = a.say('点击【个人知识库】菜单，点击【创建知识库】，', 8.0);
    a.cam(s + 0.1, 1.0, 'img23', 330, 520, 1.6);
    a.focus(s + 0.3, s + 2.2, 'img23', [20, 588, 215, 626]);
    a.badge(s + 0.3, s + 2.3, 1, 'img23', 20, 588);
    c = a.moveClick(s + 0.6, 'img23', 89, 606, 1.0);
    a.show(c + 0.15, 'img26', { fade: 0.3 });
    a.cam(c + 0.4, 1.2, 'img26', 900, 260, 1.5);
    a.focus(c + 1.0, c + 3.1, 'img26', [1126, 197, 1240, 229]);
    a.badge(c + 1.0, c + 3.2, 2, 'img26', 1126, 197);
    c2 = a.moveClick(c + 1.2, 'img26', 1183, 213, 1.1);
    a.show(c2 + 0.15, 'img24', { fade: 0.35, pop: [270, 87, 1008, 767] });
    a.cam(c2 + 0.4, 1.1, 'img24', 639, 420, 1.15);

    s = a.say('填写知识库名称、父目录和描述、知识库类型、设置LLM模型，最后点击【创建知识库】。', 15.0);
    a.focus(s + 0.3, s + 3.6, 'img24', [291, 254, 979, 316]);
    c = a.moveClick(s + 0.5, 'img24', 700, 285, 0.9);
    typing(a, 'img24', '规章制度知识库', c, a.T + 1.8, [482, 274, 930, 296], 489, 285, { px: 13, dt: 0.14 });
    a.focus(s + 3.8, s + 5.6, 'img24', [291, 318, 979, 378]);
    a.cur(s + 3.8, 0.8, 'img24', 700, 348);
    a.focus(s + 5.8, s + 7.6, 'img24', [291, 384, 979, 516]);
    a.cur(s + 5.8, 0.8, 'img24', 640, 460);
    a.focus(s + 7.8, s + 10.4, 'img24', [289, 538, 981, 630]);
    a.cur(s + 7.8, 0.8, 'img24', 460, 584);
    a.cur(s + 9.2, 0.7, 'img24', 810, 584);
    a.focus(s + 10.6, a.T - 0.1, 'img24', [872, 719, 990, 754]);
    a.cur(s + 10.6, 0.9, 'img24', 930, 737);

    s = a.say('若本地已存在个人知识库文件夹，点击【打开知识库】，选择本地知识库，点击【选择文件夹】，导入即可。', 15.0);
    c = a.moveClick(s + 0.5, 'img24', 839, 737, 0.9);
    a.show(c + 0.15, 'img26', { fade: 0.3 });
    a.cam(c + 0.3, 1.1, 'img26', 900, 260, 1.5);
    a.focus(c + 0.9, c + 2.9, 'img26', [1012, 197, 1118, 229]);
    a.badge(c + 0.9, c + 3.0, 1, 'img26', 1012, 197);
    c2 = a.moveClick(c + 1.1, 'img26', 1065, 213, 1.0);
    a.show(c2 + 0.15, 'img25', { fade: 0.3, pop: [449, 183, 1235, 823] });
    a.cam(c2 + 0.4, 1.2, 'img25', 842, 520, 1.25);
    c = a.moveClick(c2 + 1.4, 'img25', 530, 545, 1.0);
    a.focus(c + 0.6, c + 2.2, 'img25', [1036, 785, 1122, 815]);
    c2 = a.moveClick(c + 0.8, 'img25', 1078, 800, 1.0);
    a.extra(c, c2 + 0.15, 'img25', (g, t, I, u) => selected(g, u, [484, 536, 566, 555], 2, false));
    a.show(c2 + 0.15, 'img26', { fade: 0.3 });
    a.cam(c2 + 0.3, 1.2, 'img26', 640, 407, 1.0);
    a.pause(1.0);

    // ---- 3.2.2 打开知识库 ----
    a.card('3.2 个人知识库', '3.2.2 打开知识库', 6);
    s = a.say('点击【打开知识库】按钮，进入各知识库的操作页面。', 8.0);
    a.cam(s + 0.1, 1.1, 'img26', 560, 380, 1.6);
    a.focus(s + 0.3, s + 2.3, 'img26', [541, 390, 579, 420]);
    a.badge(s + 0.3, s + 2.4, 1, 'img26', 541, 390);
    c = a.moveClick(s + 0.6, 'img26', 559, 405, 1.1);
    a.show(c + 0.15, 'img27', { fade: 0.35 });
    a.cam(c + 0.4, 1.3, 'img27', 640, 405, 1.0);
    a.focus(c + 1.0, a.T - 0.1, 'img27', [250, 190, 1252, 330]);
    a.pause(1.0);

    // ---- 3.2.2.1 我的文档 ----
    c = a.card('3.2.2 打开知识库', '3.2.2.1 我的文档', 6);
    a.show(c + 1.2, 'img30', { fade: 0.3 });
    s = a.say('点击【我的文档】标签页，点击【文件】，选择本地文件，即可完成文件上传。', 15.0);
    a.cam(s + 0.1, 1.0, 'img30', 520, 340, 1.5);
    a.focus(s + 0.3, s + 2.1, 'img30', [262, 294, 345, 328]);
    c = a.moveClick(s + 0.5, 'img30', 304, 311, 0.9);
    a.cam(c + 0.4, 1.2, 'img30', 900, 380, 1.5);
    a.focus(c + 0.8, c + 2.8, 'img30', [1069, 356, 1142, 387]);
    a.badge(c + 0.8, c + 2.9, 1, 'img30', 1069, 356);
    c2 = a.moveClick(c + 0.9, 'img30', 1105, 371, 1.1);
    a.show(c2 + 0.15, 'img28', { fade: 0.3, pop: [235, 333, 846, 658] });
    a.cam(c2 + 0.4, 1.2, 'img28', 540, 500, 1.6);
    c = a.moveClick(c2 + 1.4, 'img28', 470, 538, 1.0);
    const tOpen = c + 0.8 + 1.0 + 0.25;
    a.extra(c, tOpen + 0.15, 'img28', (g, t, I, u) => {
      selected(g, u, [418, 529, 560, 547], 2, false);
      g.fillStyle = '#FFFFFF'; g.fillRect(428, 595, 380, 16);
      g.fillStyle = '#1E2933'; g.font = u.font(12, 400); g.textBaseline = 'middle'; g.fillText('测试文档.doc', 432, 603);
    });
    a.focus(c + 0.6, c + 2.2, 'img28', [640, 620, 727, 645]);
    c2 = a.moveClick(c + 0.8, 'img28', 683, 632, 1.0);
    a.show(c2 + 0.15, 'img30', { fade: 0.3 });
    a.cam(c2 + 0.3, 1.2, 'img30', 760, 430, 1.25);

    s = a.say('点击【文件夹】，选择本地文件夹，点击【选择文件夹】，即可完成文件的批量上传。', 13.0);
    a.cam(s + 0.1, 1.0, 'img30', 900, 380, 1.5);
    a.focus(s + 0.3, s + 2.3, 'img30', [1147, 356, 1235, 387]);
    a.badge(s + 0.3, s + 2.4, 2, 'img30', 1147, 356);
    c = a.moveClick(s + 0.5, 'img30', 1190, 371, 1.1);
    a.show(c + 0.15, 'img29', { fade: 0.3, pop: [263, 368, 620, 768] });
    a.cam(c + 0.4, 1.2, 'img29', 460, 560, 1.6);
    c2 = a.moveClick(c + 1.4, 'img29', 335, 629, 1.0);
    a.extra(c2, c2 + 0.8 + 1.0 + 0.25 + 0.15, 'img29', (g, t, I, u) => selected(g, u, [318, 620, 356, 638], 2, false));
    a.focus(c2 + 0.6, c2 + 2.2, 'img29', [420, 718, 507, 748]);
    c = a.moveClick(c2 + 0.8, 'img29', 463, 733, 1.0);
    a.show(c + 0.15, 'img30', { fade: 0.3 });
    a.cam(c + 0.3, 1.2, 'img30', 760, 430, 1.25);

    s = a.say('点击【打开】，即可查看该文档的内容。', 6.0);
    a.cam(s + 0.1, 1.0, 'img30', 900, 480, 1.6);
    a.focus(s + 0.3, a.T - 0.1, 'img30', [1015, 455, 1050, 480]);
    a.badge(s + 0.3, a.T, 3, 'img30', 1015, 455);
    a.moveClick(s + 0.6, 'img30', 1033, 467, 1.1);

    s = a.say('点击【重新解析】，对单个文档进行重新解析，在解析队列中可查看到具体的解析进度。', 11.0);
    a.show(s + 0.1, 'img31', { fade: 0.2 });
    a.focus(s + 0.3, s + 3.5, 'img31', [1055, 455, 1115, 480]);
    a.badge(s + 0.3, s + 3.6, 4, 'img31', 1055, 455);
    a.moveClick(s + 0.6, 'img31', 1085, 467, 1.0);
    a.cam(s + 3.6, 1.2, 'img31', 560, 330, 1.5);
    a.focus(s + 3.9, a.T - 0.1, 'img31', [466, 294, 557, 328]);
    a.cur(s + 3.9, 1.2, 'img31', 513, 311);
    a.pause(1.0);

    // ---- 3.2.2.2 wiki预览 ----
    a.card('3.2.2 打开知识库', '3.2.2.2 wiki预览', 6);
    s = a.say('点击【wiki预览】标签页，可以查看文档解析之后的概要，', 8.0);
    a.cam(s + 0.1, 1.0, 'img31', 520, 330, 1.5);
    a.focus(s + 0.3, s + 2.1, 'img31', [365, 294, 452, 328]);
    a.badge(s + 0.3, s + 2.2, 1, 'img31', 365, 294);
    c = a.moveClick(s + 0.5, 'img31', 406, 311, 1.0);
    a.show(c + 0.15, 'img32', { fade: 0.35 });
    a.cam(c + 0.4, 1.3, 'img32', 640, 500, 1.15);
    a.focus(c + 1.1, a.T - 0.1, 'img32', [546, 340, 1248, 772]);

    s = a.say('会按照概览、实体、概念等维度进行展示。', 9.0);
    a.cam(s + 0.1, 1.1, 'img32', 420, 560, 1.5);
    a.focus(s + 0.3, a.T - 0.1, 'img32', [253, 338, 358, 741]);
    a.cur(s + 0.6, 0.8, 'img32', 320, 431);
    a.hover(s + 1.3, s + 3.0, 'img32', [266, 420, 520, 442]);
    a.cur(s + 3.0, 0.8, 'img32', 310, 494);
    a.hover(s + 3.7, s + 5.4, 'img32', [266, 483, 520, 505]);
    a.cur(s + 5.4, 0.8, 'img32', 310, 640);
    a.hover(s + 6.1, a.T, 'img32', [266, 629, 520, 651]);
    a.pause(1.0);

    // ---- 3.2.2.3 解析队列 ----
    a.card('3.2.2 打开知识库', '3.2.2.3 解析队列', 6);
    s = a.say('点击【解析队列】标签页，可以查看到文件的解析进度，上传的文件默认自动解析。', 11.0);
    a.cam(s + 0.1, 1.0, 'img32', 560, 330, 1.5);
    a.focus(s + 0.3, s + 2.1, 'img32', [466, 291, 557, 325]);
    a.badge(s + 0.3, s + 2.2, 1, 'img32', 466, 291);
    c = a.moveClick(s + 0.5, 'img32', 510, 308, 1.0);
    a.show(c + 0.15, 'img33', { fade: 0.35 });
    a.cam(c + 0.4, 1.3, 'img33', 740, 520, 1.25);
    a.focus(c + 1.1, a.T - 0.1, 'img33', [276, 438, 1214, 502]);

    s = a.say('点击【全部暂停】，可将解析队列中的文件全部暂停解析。', 9.0);
    a.show(s + 0.1, 'img34', { fade: 0.4 });
    a.cam(s + 0.2, 1.1, 'img34', 900, 520, 1.45);
    a.focus(s + 0.5, s + 2.6, 'img34', [1086, 452, 1165, 482]);
    a.badge(s + 0.5, s + 2.7, 2, 'img34', 1086, 452);
    c = a.moveClick(s + 0.8, 'img34', 1125, 467, 1.0);
    a.show(c + 0.15, 'img35', { fade: 0.3 });
    a.focus(c + 0.6, a.T - 0.1, 'img35', [276, 520, 1214, 676]);

    s = a.say('点击【全部开始】，将已暂停解析的文件重新开始解析。', 8.0);
    a.focus(s + 0.3, s + 2.4, 'img35', [1086, 452, 1163, 482]);
    a.badge(s + 0.3, s + 2.5, 3, 'img35', 1086, 452);
    c = a.moveClick(s + 0.6, 'img35', 1125, 467, 1.0);
    a.show(c + 0.15, 'img34', { fade: 0.3 });
    a.focus(c + 0.6, a.T - 0.1, 'img34', [276, 520, 1214, 606]);
    a.pause(1.0);

    // ---- 3.2.3 会话问答 ----
    c = a.card('3.2 个人知识库', '3.2.3 会话问答', 7);
    a.show(c + 1.2, 'img26', { fade: 0.3 });
    a.cam(c + 1.2, 0, 'img26', 640, 407, 1.0);
    s = a.say('点击【会话问答】/【对话】，输入问题后，点击【发送】，', 17.0);
    a.cam(s + 0.1, 1.1, 'img26', 600, 380, 1.6);
    a.focus(s + 0.3, s + 2.4, 'img26', [579, 390, 616, 420]);
    a.badge(s + 0.3, s + 2.5, 1, 'img26', 579, 390);
    a.cur(s + 0.6, 1.0, 'img26', 598, 406);
    a.extra(s + 1.6, s + 2.6, 'img26', (g, t, I, u) => {      // the "会话问答" hover tooltip, from img36
      g.globalAlpha = Math.min(1, (t - (s + 1.6)) / 0.15);
      u.crop(I.img36, 555, 336, 78, 42, 558, 340);
    });
    c = s + 2.4;
    a.click(c, 'img26', 598, 406);
    a.show(c + 0.2, 'img37_empty', { fade: 0.35 });
    a.cam(c + 0.4, 1.2, 'img37', 760, 600, 1.35);
    c2 = a.moveClick(c + 1.0, 'img37', 700, 706, 0.9);
    a.focus(c2 - 0.2, c2 + 3.4, 'img37', [463, 677, 1237, 777]);
    const tq = c2 + 0.3 + 9 * 0.18, tSend = tq + 0.4 + 1.0 + 0.25;
    typing(a, 'img37_empty', '北京出差标准是什么', c2, tSend + 0.2, [476, 694, 1000, 717], 481, 705, { px: 14, dt: 0.18 });
    c = a.moveClick(tq + 0.4, 'img37', 1177, 753, 1.0);
    a.extra(c - 0.9, c + 0.25, 'img37_empty', (g, t, I, u) => enabledButton(g, u, [1128, 739, 1228, 768], '发送消息'));
    a.show(c + 0.2, 'img37', { fade: 0.4 });
    a.cam(c + 0.4, 1.2, 'img37', 760, 430, 1.15);

    s = a.say('模型会基于该知识库给出相关回答。', 9.0);
    a.focus(s + 0.2, s + 4.5, 'img37', [452, 252, 1232, 662]);
    a.cur(s + 0.4, 1.0, 'img37', 900, 520);
    a.cam(s + 4.4, 1.1, 'img37', 1000, 260, 1.5);
    a.focus(s + 4.8, a.T - 0.1, 'img37', [1073, 192, 1163, 237]);
    a.badge(s + 4.8, a.T, 2, 'img37', 1073, 192);
    a.cur(s + 4.9, 1.0, 'img37', 1125, 216);
    a.pause(0.8);
  },
});

export const { setup, renderAt, OUT_DUR, OUT_SUBS } = film;
