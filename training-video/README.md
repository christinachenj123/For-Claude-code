# 苏电智伴（IM）使用手册 · 第三部分 培训视频

用手册第三部分的截图做成的"录屏式"讲解视频：无配乐、无配音，字幕取自手册原文。

## 成片

| 支 | 内容 | 文件 |
|---|---|---|
| 1 | 下载、安装登录 | `deliver/01_下载安装登录.mp4`、`.srt` |
| 2 | 会话区 | `deliver/02_会话区.mp4`、`.srt` |
| 3 | 工作区（技能、个人知识库） | `deliver/03_工作区.mp4`、`.srt` |

## 怎么做的

- `tools/preprocess.py`（第 1 支）、`tools/preprocess2.py`（第 2 支）、`tools/preprocess3.py` + `tools/compose3.mjs`（第 3 支）：从截图里去掉红框、给姓名和账号打码、还原下拉菜单打开前的页面，输出到 `assets/`。
- `film.js`：第 1 支的时间轴和画面。`client.js` 是客户端窗口类视频（第 2、3 支）的通用引擎，`film2.js`、`film3.js` 是第 2、3 支的时间轴。整体按 1.2 倍速输出。每一帧只由时间 t 决定（`renderAt(t)`）。字幕停留时间按"字数 ÷ 4 + 1.5 秒、最短 2.5 秒"计算。
- `index.html`：预览页，`?film=2&t=30` 看某一帧，`?play` 实时播放。
- `render.mjs`：无头 Chromium 逐帧截图，ffmpeg 合成 1920×1080、30 fps 的 MP4，同时导出 `.srt`。

## 重新生成

```bash
npm install
python3 -I tools/preprocess.py && python3 -I tools/preprocess2.py   # 需要原始截图放在 src/（不入库）
node render.mjs video --workers=3 --film=2  # → out/2/video.mp4, out/2/subtitles.srt
node render.mjs stills 10,40,80 --film=2    # 抽查静帧
```
