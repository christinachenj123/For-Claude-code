// 苏电智伴 培训视频 第 2 支：会话区（手册 第三部分 2）
import { makeFilm } from './client.js';

const SIZES = {
  img8_closed: [1275, 814], img8: [1275, 814], img9: [1274, 813], img10: [1272, 815],
  img11_closed: [1273, 814], img11: [1273, 814], img12: [1269, 818], img13: [1270, 809],
  img14: [1352, 708], web4_before: [1404, 735], web4: [1404, 735], web4_on: [1404, 735], web3: [1404, 735],
  web2: [1018, 594], img15: [1271, 814], img16: [1270, 817], img17: [1271, 814], img18: [1272, 818],
};

const GREEN = '#00897B';

// selected checkbox: green box with a white tick
function tick(g, u, x, y, size) {
  g.fillStyle = GREEN;
  u.rr(g, x, y, size, size, 3); g.fill();
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x + size * 0.24, y + size * 0.52); g.lineTo(x + size * 0.43, y + size * 0.7);
  g.lineTo(x + size * 0.77, y + size * 0.32); g.stroke();
}

// simulated typing into an input: blank the placeholder, type text with a caret
function typing(a, img, text, tClick, tEnd, blank, x, y, px) {
  const t0 = tClick + 0.3, dt = 0.18;
  a.extra(tClick + 0.05, tEnd, img, (g, t, I, u) => {
    g.fillStyle = '#FFFFFF'; g.fillRect(blank[0], blank[1], blank[2] - blank[0], blank[3] - blank[1]);
    const n = t < t0 ? 0 : Math.min(text.length, Math.floor((t - t0) / dt) + 1);
    const txt = text.slice(0, n);
    g.font = u.font(px, 400); g.fillStyle = '#1E2933'; g.textBaseline = 'middle';
    g.fillText(txt, x, y);
    if (Math.floor(t * 2.2) % 2 === 0 || n < text.length) g.fillRect(x + 1 + g.measureText(txt).width, y - px * 0.6, 1.2, px * 1.2);
  });
}

const film = makeFilm({
  chapter: 1,
  label: '2、会话区',
  steps: ['切换智能体', '智能体管理', '选择模型', '个人知识库', '联网检索', '密码箱', '附件'],
  sizes: SIZES,
  glyphs: '查看今日未读邮件今日金价明天天气',
  build(a) {
    let s, c;
    a.show(0, 'img8_closed', { fade: 0 });

    // ---------------- 2.1.1 切换智能体 ----------------
    a.card('2.1 智能体', '2.1.1 切换智能体', 0);
    s = a.say('点击【默认智能体】，弹出智能体列表页面，', 5.2);
    a.cam(s + 0.2, 1.3, 'img8', 300, 300, 1.55);
    a.focus(s + 0.3, s + 2.4, 'img8', [22, 160, 214, 198]);
    a.badge(s + 0.3, s + 2.6, 1, 'img8', 22, 160);
    c = a.moveClick(s + 0.8, 'img8', 98, 178);
    a.show(c + 0.15, 'img8', { fade: 0.3, pop: [12, 176, 256, 490] });

    s = a.say('点击智能体名称可切换至新的智能体，', 5.0);
    a.focus(s + 0.3, a.T - 0.1, 'img8', [23, 252, 247, 420]);
    a.cur(s + 0.9, 1.0, 'img8', 125, 392);
    a.hover(s + 1.8, a.T, 'img8', [26, 370, 244, 410]);

    s = a.say('所有的配置信息如技能、定时任务、聊天内容等都展示新的智能体内容。');
    a.cam(s + 0.4, 1.6, 'img8', 520, 410, 1.08);
    a.cur(s + 0.8, 1.4, 'img8', 520, 300);
    a.pause(1.0);

    // ---------------- 2.1.2 智能体管理 ----------------
    c = a.card('2.1 智能体', '2.1.2 智能体管理', 1);
    a.show(c + 1.0, 'img9', { fade: 0.2 });
    s = a.say('点击【默认智能体】，弹出页面，点击【智能体管理】按钮，进入智能体管理页面。', 8.0);
    a.cam(s + 0.2, 1.3, 'img9', 330, 300, 1.55);
    a.focus(s + 0.4, s + 3.2, 'img9', [146, 184, 246, 216]);
    a.badge(s + 0.4, s + 3.3, 1, 'img9', 146, 184);
    c = a.moveClick(s + 1.2, 'img9', 195, 199);
    a.show(c + 0.2, 'img10', { fade: 0.35 });
    a.cam(c + 0.6, 1.5, 'img10', 640, 400, 1.02);

    s = a.say('智能体管理页面支持创建、修改、删除等操作。', 8.0);
    a.cam(s + 0.2, 1.2, 'img10', 920, 260, 1.4);
    a.focus(s + 0.5, s + 2.6, 'img10', [1124, 113, 1240, 147]);
    a.cur(s + 0.6, 1.1, 'img10', 1180, 131);
    a.focus(s + 2.8, s + 4.9, 'img10', [1167, 266, 1195, 294]);
    a.cur(s + 2.8, 0.9, 'img10', 1181, 281);
    a.focus(s + 5.1, s + 7.7, 'img10', [866, 306, 895, 332]);
    a.cur(s + 5.1, 0.9, 'img10', 881, 320);
    a.cam(s + 7.0, 1.0, 'img10', 640, 400, 1.02);
    a.pause(1.0);

    // ---------------- 2.2.1 选择模型 ----------------
    a.card('2.2 聊天', '2.2.1 选择模型', 2);
    s = a.say('点击【讨论/聊天】菜单，默认显示Auto model模型，', 8.0);
    a.cam(s + 0.1, 1.0, 'img10', 400, 330, 1.25);
    a.focus(s + 0.3, s + 2.4, 'img10', [20, 222, 214, 258]);
    a.badge(s + 0.3, s + 2.5, 1, 'img10', 20, 222);
    c = a.moveClick(s + 0.6, 'img10', 82, 240, 1.1);
    a.show(c + 0.15, 'img11_closed', { fade: 0.3 });
    a.cam(c + 0.5, 1.2, 'img11', 900, 260, 1.45);
    a.focus(c + 0.8, a.T - 0.1, 'img11', [958, 106, 1088, 139]);
    a.badge(c + 0.8, a.T, 2, 'img11', 958, 106);
    c = a.moveClick(c + 1.0, 'img11', 1022, 122, 1.1);
    a.show(c + 0.12, 'img11', { fade: 0.28, pop: [955, 138, 1147, 266] });

    s = a.say('可以直接问答，会根据实际情况、资源分配、分配最佳模型进行回答。', 10.0);
    a.focus(s + 0.2, s + 1.8, 'img11', [955, 138, 1147, 266]);
    c = a.moveClick(s + 1.9, 'img11', 820, 200, 0.8);
    a.show(c + 0.1, 'img11_closed', { fade: 0.2 });
    a.cam(c + 0.2, 1.3, 'img11', 640, 400, 1.05);
    c = a.moveClick(c + 0.4, 'img11', 612, 384, 1.2);
    a.show(c + 0.2, 'img12', { fade: 0.35 });
    a.focus(c + 1.0, a.T - 0.1, 'img12', [341, 455, 508, 489]);
    a.cam(c + 0.8, 1.2, 'img12', 560, 380, 1.3);
    a.cur(c + 1.0, 1.0, 'img12', 520, 520);
    a.pause(1.0);

    // ---------------- 2.2.2 个人知识库 ----------------
    a.card('2.2 聊天', '2.2.2 个人知识库', 3);
    a.cam(a.T - 2, 0.8, 'img12', 640, 409, 1.02);
    s = a.say('如已创建个人知识库，在聊天页面也可进行知识库问答', 6.0);
    a.focus(s + 0.4, a.T - 0.1, 'img12', [325, 553, 1172, 741]);
    s = a.say('聊天问答窗口选中【个人知识库】，', 5.5);
    a.cam(s + 0.1, 1.2, 'img12', 560, 520, 1.5);
    a.focus(s + 0.3, s + 2.4, 'img12', [458, 562, 557, 589]);
    a.badge(s + 0.3, s + 2.5, 1, 'img12', 458, 562);
    c = a.moveClick(s + 0.7, 'img12', 512, 576, 1.1);
    a.show(c + 0.12, 'img13', { fade: 0.28, pop: [392, 385, 642, 536] });
    s = a.say('可提问知识库相关问题，大模型优先回答知识库相关内容。', 7.0);
    a.focus(s + 0.3, a.T - 0.1, 'img13', [392, 385, 642, 536]);
    a.hover(s + 1.6, a.T, 'img13', [404, 464, 626, 524]);
    c = a.moveClick(s + 0.8, 'img13', 422, 483, 1.0);
    a.extra(c, a.T + 2.0, 'img13', (g, t, I, u) => tick(g, u, 414, 475, 16));
    a.pause(1.0);

    // ---------------- 2.2.3 联网检索 ----------------
    c = a.card('2.2 聊天', '2.2.3 联网检索', 4);
    a.show(c + 1.2, 'web4_before', { fade: 0.4 });
    a.cam(c + 1.2, 0, 'web4_before', 702, 367, 1.0);
    s = a.say('联网检索功能，系统依托内网服务通道实现外网网络访问，', 7.5);
    a.cam(s + 0.2, 1.3, 'web4_before', 700, 470, 1.45);
    a.focus(s + 0.4, s + 2.4, 'web4_before', [629, 547, 704, 575]);
    a.badge(s + 0.4, s + 2.5, 1, 'web4_before', 629, 547);
    c = a.moveClick(s + 0.8, 'web4_before', 666, 561, 1.1);
    a.show(c + 0.12, 'web4', { fade: 0.3, pop: [540, 212, 866, 332] });
    a.cam(c + 0.5, 1.2, 'web4', 702, 330, 1.45);
    a.focus(c + 0.9, a.T - 0.1, 'web4', [550, 220, 854, 322]);

    s = a.say('可对外开展公开信息检索、资料查询等网络操作。', 10.5);
    a.focus(s + 0.2, s + 1.9, 'web4', [789, 277, 842, 311]);
    a.badge(s + 0.2, s + 2.0, 2, 'web4', 789, 277);
    c = a.moveClick(s + 0.4, 'web4', 815, 295, 1.0);
    a.show(c + 0.12, 'web4_on', { fade: 0.3 });
    a.cam(c + 0.3, 1.1, 'web4_on', 720, 560, 1.45);
    let c2 = a.moveClick(c + 0.5, 'web4_on', 560, 591, 0.8);
    let c3 = a.moveClick(c2 + 1.5, 'web4_on', 1070, 665, 0.9);
    typing(a, 'web4_on', '今日金价', c2, c3 + 0.15, [480, 582, 760, 600], 486, 591, 11.5);
    a.show(c3 + 0.15, 'web3', { fade: 0.35 });
    a.cam(c3 + 0.4, 1.2, 'web3', 650, 300, 1.4);
    a.focus(c3 + 0.9, a.T - 0.1, 'web3', [484, 255, 613, 283]);

    s = a.say('每天联网检索额度固定，', 7.0);
    a.tip(s + 0.4, a.T + 9.0, '每天联网检索额度固定');
    a.cam(s + 0.2, 1.0, 'web3', 720, 560, 1.45);
    c2 = a.moveClick(s + 0.5, 'web3', 560, 591, 0.9);
    c3 = a.moveClick(c2 + 1.5, 'web3', 1070, 665, 0.9);
    typing(a, 'web3', '明天天气', c2, c3 + 0.15, [480, 582, 760, 600], 486, 591, 11.5);
    a.show(c3 + 0.15, 'web2', { fade: 0.4 });
    a.cam(c3 + 0.15, 0.6, 'web2', 509, 300, 1.2);
    a.cur(c3 + 0.3, 0.6, 'web2', 560, 420);

    s = a.say('如次数用完时，给出余额不足提示。', 9.5);
    a.focus(s + 0.2, s + 2.8, 'web2', [302, 219, 716, 356]);
    a.focus(s + 3.0, s + 4.3, 'web2', [636, 305, 694, 337]);
    a.badge(s + 3.0, s + 4.4, 3, 'web2', 636, 305);
    c = a.moveClick(s + 3.1, 'web2', 665, 321, 0.9);
    a.show(c + 0.15, 'img15', { fade: 0.45 });
    a.cam(c + 0.15, 0.6, 'img15', 636, 330, 1.3);
    a.cur(c + 0.4, 0.8, 'img15', 700, 300);
    a.focus(c + 0.8, s + 6.6, 'img15', [376, 140, 896, 388]);
    a.focus(s + 6.8, a.T - 0.1, 'img15', [792, 336, 872, 368]);
    a.moveClick(s + 6.9, 'img15', 832, 352, 1.0);
    a.pause(1.0);

    // ---------------- 2.2.4 密码箱 ----------------
    c = a.card('2.2 聊天', '2.2.4 密码箱', 5);
    a.show(c + 1.2, 'img12', { fade: 0.4 });
    a.cam(c + 1.2, 0, 'img12', 634, 409, 1.0);
    s = a.say('新增密码箱功能，用于存储各类平台的账号密码，');
    s = a.say('登录时提供网址并选择对应的密码，模型可直接登录。');
    a.focus(s + 0.2, a.T - 0.1, 'img12', [325, 553, 1172, 741]);
    s = a.say('首次点开【密码箱】，会展示【去设置】按钮，', 6.5);
    a.cam(s + 0.1, 1.2, 'img12', 600, 470, 1.5);
    a.focus(s + 0.3, s + 2.4, 'img12', [565, 562, 642, 589]);
    a.badge(s + 0.3, s + 2.5, 1, 'img12', 565, 562);
    c = a.moveClick(s + 0.7, 'img12', 605, 576, 1.1);
    a.show(c + 0.12, 'img16', { fade: 0.28, pop: [478, 333, 728, 539] });
    a.focus(c + 0.9, a.T + 4.5, 'img16', [550, 487, 652, 520]);
    a.badge(c + 0.9, a.T + 4.6, 2, 'img16', 550, 487);
    s = a.say('点击进入密码箱设置页面进行设置；', 5.0);
    a.cur(s + 0.4, 1.0, 'img16', 600, 504);
    s = a.say('在聊天页面，输入网址并选择已创建的密码，', 8.0);
    a.focus(s + 0.3, s + 2.4, 'img16', [489, 411, 713, 470]);
    c = a.moveClick(s + 0.5, 'img16', 509, 441, 1.0);
    a.extra(c, s + 2.6, 'img16', (g) => {
      g.fillStyle = GREEN;
      g.beginPath(); g.arc(508, 440, 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFFFFF';
      g.beginPath(); g.arc(508, 440, 3.2, 0, Math.PI * 2); g.fill();
    });
    a.show(s + 2.6, 'img12', { fade: 0.25 });
    c = a.moveClick(s + 2.7, 'img12', 640, 614, 0.8);
    const msg = '查看今日未读邮件', t0 = c + 0.3, dt = 0.16;
    a.extra(c + 0.05, a.T + 2.1, 'img12', (g, t, I, u) => {
      g.fillStyle = '#FFFFFF'; g.fillRect(336, 602, 380, 26);
      const n = Math.max(0, Math.min(msg.length, Math.floor((t - t0) / dt) + 1));
      g.font = u.font(14, 400); g.fillStyle = '#1E2933'; g.textBaseline = 'middle';
      const txt = t < t0 ? '' : msg.slice(0, n);
      g.fillText(txt, 341, 615);
      if (Math.floor(t * 2.2) % 2 === 0 || t < t0 + msg.length * dt) {
        g.fillRect(342 + g.measureText(txt).width, 606, 1.2, 18);
      }
    });
    a.focus(c + 0.2, a.T - 0.1, 'img12', [325, 598, 1172, 632]);
    s = a.say('点击【发送】即可。', 6.0);
    a.focus(s + 0.3, s + 2.3, 'img12', [1121, 696, 1159, 734]);
    c = a.moveClick(s + 0.5, 'img12', 1140, 715, 1.2);
    a.show(c + 0.15, 'img17', { fade: 0.35 });
    a.cam(c + 0.3, 1.2, 'img17', 760, 300, 1.25);
    a.focus(c + 0.7, a.T - 0.1, 'img17', [868, 176, 1141, 229]);
    a.cur(c + 0.5, 1.0, 'img17', 760, 400);
    a.pause(1.0);

    // ---------------- 2.2.5 附件 ----------------
    c = a.card('2.2 聊天', '2.2.5 附件', 6);
    a.show(c + 1.2, 'img11_closed', { fade: 0.4 });
    a.cam(c + 1.2, 0, 'img11', 636, 407, 1.0);
    s = a.say('文件上传功能支持多种格式文件如doc、docx、xls、xlsx、pdf、ofd、txt等格式，');
    s = a.say('支持批量上传，单个文件不超过50MB。');
    a.tip(s + 0.6, a.T + 13, '单个文件不超过50MB');
    s = a.say('点击【附件】按钮，上传本地文件，', 7.0);
    a.cam(s + 0.1, 1.2, 'img11', 520, 600, 1.6);
    a.focus(s + 0.3, s + 3.2, 'img11', [333, 700, 362, 728]);
    a.badge(s + 0.3, s + 3.3, 1, 'img11', 333, 700);
    a.cur(s + 0.6, 1.1, 'img11', 348, 715);
    a.extra(s + 1.9, s + 3.4, 'img11_closed', (g, t, I, u) => {
      g.globalAlpha = Math.min(1, (t - (s + 1.9)) / 0.2);
      u.crop(I.img18, 280, 658, 140, 28, 278, 654);
    });
    c = s + 3.2;
    a.click(c, 'img11', 348, 715);
    a.show(c + 0.35, 'img18', { fade: 0.35 });
    a.focus(c + 0.9, a.T - 0.1, 'img18', [348, 568, 488, 624]);
    a.cam(c + 0.6, 1.0, 'img18', 560, 560, 1.4);
    a.cur(c + 0.7, 1.0, 'img18', 600, 650);
    s = a.say('发送文件相关问题，大模型进行总结回答。', 6.0);
    a.focus(s + 0.2, a.T - 0.3, 'img18', [325, 512, 1172, 745]);
    a.cam(s + 0.3, 1.4, 'img18', 636, 409, 1.0);
    a.pause(0.8);
  },
  preload: ['img18'],
});

export const { setup, renderAt, OUT_DUR, OUT_SUBS } = film;
