// Make a Word document listing when each subtitle appears, from a rendered film's .srt.
// Usage: node tools/subs_docx.js out/1/subtitles.srt "deliver/01_下载安装登录_字幕时间.docx" "01_下载安装登录.mp4" <video seconds>
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, BorderStyle } = require('docx');

const [srtPath, outPath, videoName, videoSec] = process.argv.slice(2);
const toSec = (s) => { const [h, m, rest] = s.split(':'); const [sec, ms] = rest.split(','); return +h * 3600 + +m * 60 + +sec + +ms / 1000; };
const fmt = (x) => { const m = Math.floor(x / 60), s = x - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`; };
const cues = fs.readFileSync(srtPath, 'utf8').trim().split(/\r?\n\r?\n/).map((b) => {
  const l = b.split(/\r?\n/); const [a, z] = l[1].split(' --> ');
  return { t0: toSec(a), t1: toSec(z), text: l.slice(2).join('') };
});

const FONT = 'Microsoft YaHei';
const widths = [800, 1500, 1500, 1100, 4126];   // A4 with 2.54 cm margins: 9026 DXA
const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFC8D0' };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, i, head) => new TableCell({
  width: { size: widths[i], type: WidthType.DXA }, borders,
  shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E0F2EF' } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: [new Paragraph({ alignment: i < 4 ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({ text, bold: !!head, font: FONT, size: 21 })] })],
});
const header = new TableRow({ tableHeader: true,
  children: ['序号', '出现时间', '消失时间', '时长（秒）', '字幕内容'].map((t, i) => cell(t, i, true)) });
const rows = cues.map((c, k) => new TableRow({ children: [
  String(k + 1), fmt(c.t0), fmt(c.t1), (c.t1 - c.t0).toFixed(1), c.text].map((t, i) => cell(t, i)) }));

const p = (text, o = {}) => new Paragraph({ spacing: { after: 120 }, ...o,
  children: [new TextRun({ text, font: FONT, size: 21, ...(o.run || {}) })] });
const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [{ id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 32, bold: true }, paragraph: { spacing: { before: 0, after: 200 }, keepNext: true } }] },
  sections: [{ children: [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '字幕时间表：1、下载、安装和登录', font: FONT })] }),
    p(`对应视频：${videoName}，总时长 ${fmt(+videoSec)}，共 ${cues.length} 条字幕。`),
    p('时间格式为“分:秒”，精确到 0.1 秒，按视频实际播放时间计算。字幕内容取自《苏电智伴（IM）使用手册》第三部分原文。'),
    new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: widths, rows: [header, ...rows] }),
  ] }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(outPath, b); console.log('wrote', outPath, cues.length, 'cues'); });
