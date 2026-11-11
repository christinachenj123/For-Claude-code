# 用代码拍视频：8 个开源仓库学习笔记

学习对象（2026-11-11 拉取的最新版本）：

| # | 仓库 | 是什么 | 最值得学的 |
|---|---|---|---|
| 1 | [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) | 703 条提示词合集（418 条有复刻） | 真实的提示词长什么样、什么题材最常见 |
| 2 | [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | Claude Code skill + 风格库 | 一整套"导演方法论 + 制作流水线 + 风格说明书" |
| 3 | [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) | 卡拉 OK 歌词 MV（TS + three.js） | 歌词逐词对齐、动态模糊、4K60 渲染 |
| 4 | [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | 同一首歌的另一支 MV（p5.brush 水彩卡通） | 分镜驱动 + 子代理并行分章节制作 |
| 5 | [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | 15 种 MG 风格，每支 10 秒 | 风格提示词模板 + AI 评委评审 rubric |
| 6 | [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | 手绘角色动画起步包（31 种表情） | 角色动画规则、"按观众节奏"计时 |
| 7 | [athemeroy/awesome-claude-5-5-videos](https://github.com/athemeroy/awesome-claude-5-5-videos) | 424 条来源帖的研究型合集 | 题材 × 画风统计、成本与流程分析 |
| 8 | [joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts) | 中文案例 + 可复制提示词 | 9 种技术路线对照、写法经验 |

---

## 一、所有仓库共用的核心原理

模型并不"生成视频"，而是**写一个网页，网页能画出任意时刻 t 的那一帧**，然后用无头浏览器逐帧截图，ffmpeg 合成 MP4。8 个仓库全是这个骨架：

```
一份时间轴（唯一真相：段落、BPM、节拍、命中点、歌词时间）
  ├─ 画面：render(t) 纯函数 → 无头 Chrome 逐帧截图 → video.mp4
  ├─ 配乐：同一份时间轴 → 采样器/合成器 → 音轨
  ├─ 音效：在 EV 事件时间点上合成拟音
  ├─ 旁白：TTS → 语音识别回检 → 逐词时间
  └─ 字幕：.srt + 烧进画面
混音（闪避、压缩）→ ffmpeg 合成 → 两遍 loudnorm 到 −14 LUFS
```

### 页面接口（各仓库写法几乎一样）

| 仓库 | 接口 |
|---|---|
| lemo-opuscar | `window.DUR`、`window.render(t)`、`window.READY`、`window.EV`（音效事件）、`window.TEXTS(t)`（可读性检查） |
| mg-styles-15 | `window.DEMO = {width,height,fps,duration}`、`window.renderAt(t)`、`window.__ready` |
| opus-video-prompts #15 | `seek(t)` |
| pdoom-video | `Scene.render(f, out)`，`f.t` 为歌曲时间 |
| PDoomVideo / ClaudeAnimationBase | `chapter(name, start, end, shots)`，每个镜头 `fn(t, lt, dur)` |

### 铁律：确定性

- 每一帧**只由 t 决定**。不用 `Date.now()`、不用无种子的 `Math.random()`、不用 CSS transition/计时器、帧与帧之间不存状态。
- 原因：要并行、乱序渲染（多 worker），还要做多子帧动态模糊，有状态就会闪烁。
- 随机用带种子的 `mulberry32(seed)` / `hash(i)`。
- 弹簧动画也要写成**闭式解**：目标多次变化时，把每次变化的弹簧响应相加（opus-video-prompts #15 的技巧）。
- 手绘"线条沸腾"效果：随机数每秒重设 12 次（`BOIL`），仍是 t 的函数。

### 渲染提速与画质技巧

- JPEG 截图 + 每个 worker 一个浏览器 + **颗粒放到 ffmpeg 里加**（画在页面里会让每帧都无法压缩）。
- 动态模糊：每帧取多个子帧平均（`--shutter 0.2`）。pdoom-video 做到了**按 32×32 分块自适应采样**：静止区 12 个子帧，快速甩镜 108–324 个，块收敛就停。
- 4K 是真 4K：以 1920×1080 逻辑像素排版，`--scale 2` 物理分辨率渲染。
- 3D：three.js 走 WebGL2/GPU，2× 渲染再缩小；柔光面光源 + 低强度 HDRI 比亮环境光更"真"。

---

## 二、逐个仓库要点

### 1. awesome-opus5-5-videos —— 看真实提示词

数据（`data/videos.json`，703 条）：

- 类别：动态图形 369 · 3D 117 · 讲解 116 · 交互/游戏 101
- 技术标签前五：Canvas 267 · SVG 183 · Three.js 131 · Shader 92 · GSAP 86
- 207 条是作者只公开了部分提示词
- 提示词长度中位数只有 **221 字符**（四分位 124 / 402），最长 1.5 万字符

结论：**大部分爆款提示词都很短**，赢在三件事：

1. 给模型一个身份和野心："shows what an incredible motion designer you are… go all out"
2. 给硬规格：时长、分辨率、帧率、"render the final MP4 and tell me where it's saved"
3. 给一个约束带来惊喜："compose the soundtrack yourself, fully synthesized in code… every cut must land on the beat"

长提示词（如 @anabology 的 Claude Pop MV）则是把**素材、API、参考库、审美禁区**都交代清楚，让模型自己当导演。

### 2. lemo-opuscar —— 最完整的方法论（重点）

结构：`SKILL.md`（入口，拉取库）→ `AGENTS.md`（流程）→ `DIRECTOR.md`（怎么导）→ `TECHNIQUE.md`（怎么做）→ `styles/<slug>/STYLE.md`（风格不变量）。实际 66 种风格，分 11 大类（剪辑纪实、实证影像、手绘绘画、东方传统、印刷版画、图形排版、信息发布、卡通动画、游戏、电影时代、材质 3D）。

**工作流**：一次性提问 → 写 `TREATMENT.md` → 风格帧/角色设定稿 →（用户要求时才）分镜等批准 → 旁白→回检→配乐→动画→混音→渲染 → 自检交付。

**导演规则（DIRECTOR.md）里最有价值的几条：**

- 评判顺序：**声音、节奏、镜头、导演**，好看的画面只是起点。
- 先找 1–2 个对标作品，写下"学什么 / 不学什么"。
- 故事：一个主体、一个目标、一个转折；**前 3 秒必须有钩子**；结尾呼应开头；高潮放一个"只有这种媒介能做的动作"（native move，比如折纸折成转场、墨晕开成下一场）。
- Treatment 必须给 **三种候选结构** 再选一种——第一个想到的通常是陈词滥调。
- 声音：每个可见动作都要有声；三层（环境、拟音、音乐）；**至少两次真正的静默**放在转折前；至少两次声音转场（J-cut/L-cut）；别用万能"钢琴+弦乐"。
- 节奏：先写 cue map 再动画；字幕至少 1.8 s；文字停留 ≈ 中文 字数÷4.5+1.5 s；标题卡 ≥ 4 s。
- 镜头：至少 4 种运镜；一个让人记住的招牌镜头；转场在媒介内部完成，不用默认淡入淡出。
- 交付前对照 demo，6 项（结构、开场、招牌镜头、镜头路径、配乐形状、结尾）至少 4 项不同——**防止抄 demo**。

**STYLE.md 怎么写（以"中国水墨"为例）**：精确到可执行——宣纸色 `#F2ECDE`、墨分五色各自的不透明度（焦 .96 / 浓 .82 / 重 .60 / 淡 .34 / 清 .16）、笔触模型（中心线 × 压力 × 4–60 根笔毛）、唯一的朱红 `#B02E22` 只给印章、人物 12 fps 走两拍但镜头每帧平滑。

### 3 & 4. 两支 P(doom) MV 对照拆解

同一首歌（156.6 s，132 BPM），两种完全相反的思路：

| | mexicat/pdoom-video | JohnHeibel/PDoomVideo |
|---|---|---|
| 概念 | "末日论插图专著"的一页页插版（plates），每版一种绘图语言 | 舞台剧失控：Clawd 从屏幕涂鸦长成星球级超智能，结尾揭示一切是演出 |
| 技术 | TypeScript + three.js + GLSL，bun + Vite | p5.js + p5.brush 水彩 |
| 代码量 | ~2.2 万行，40 个场景文件 | ~7400 行，9 个章节 |
| 文字 | 歌词本身就是画面（被火花写出、骑在曲线上、打成 token、盖在表格上） | 尽量无字，只用少量拟声大字（FOOM、CHOMP） |
| 贯穿线索 | 一个橙色火花拖着线：写歌词→画 loss 曲线→变股票图→弯成回形针→变导火索→引爆 | P(doom) 温度计道具，每段副歌被打气升高 8→34→61→86→99.9 |
| 统一手段 | 一套调色板（墨黑/骨白/信号橙 `#FF4D12`，唯一点缀酸绿只用 2 秒）、一套字体系统、同样的颗粒 | 同一个舞台、同一组角色，色彩弧线：暖→天蓝→太空紫→…→警报红→回到暖红 |
| 计时数据 | Demucs 分轨 + CTC 强制对齐 + Whisper 交叉校验 → 逐词/逐音节时间；节拍/重拍/鼓点 onset | 行级歌词时间 + 分镜表时间点 |
| 人的介入 | 和 Claude 对话迭代了 5 个修订版（客户说写实人眼"恐怖谷"就删掉） | 作者说"一切由模型生成"，只给了两条方向 |
| 并行方式 | 每人只改自己的场景文件，不许改引擎和 timeline | Opus 写 `ANIMATION_GUIDE.md` 给并行子代理，每个子代理只改自己的章节 |

**共同点**：都先写 treatment/storyboard；都是"一个世界、一条线索、一个调色板"；都把大变化卡在重拍上；都要求严格确定性以便并行渲染。

**启示**：要"惊艳的精确感"选 three.js/GLSL + 逐词对齐；要"可爱有人情味"选 p5.brush 手绘 + 角色表演。

### 5. mg-styles-15 —— 风格提示词模板 + 评审闭环

每份提示词 = 通用部分（角色设定、How to work、Rules、Craft checklist、自评、Deliver）+ 四段专属：

```text
# Style            风格名
# Output (fixed)   分辨率、帧率、精确 10.000 s、−14 LUFS、真峰值 ≤ −1 dBTP
# Suggested technical route   推荐技术路线（允许模型换更好的，但要说明理由）
# Creative seed    按秒写的节拍：钩子 → 升级 → 高潮(60–75%处) → 结尾定格 0.8–1.2 s，配色色值，声音
# Signature features and key techniques   可检验的标志特征（"overshoot 0→1.15→1.0 约 8 帧"，而不是"要有弹性"）
```

**评审闭环（rubric.md）**：另开一个 AI 当"严厉评委"，抽 0.5 s 一帧的接触表 + 关键动作胶片条 + 全分辨率细节帧，7 个维度打分（风格忠实、概念惊艳、动效手艺、设计排版、质感、声画同步、技术规格），给 5–10 条带时间码和具体数值的修改。再贴回制作会话改一轮。原片都是"制作→评审→修改"两轮，终评 7.57–8.21。

### 6. ClaudeAnimationBase —— 角色动画规则

三个目标：**手作感、活着、一个整体**。七条规则：

1. 媒介要扎实：全用 p5.brush 笔触，不用平面 p5 图形；线条沸腾；**纯 2D，不投影 3D**，转身靠画好的关键视角（正→3/4→侧→背）
2. **不要文字**——"角色举着写'我迷路了'的牌子"是典型失败
3. 每个镜头都要发生事情：起因 → 反应，反应常常最好笑
4. **计时要建模观众**（模型最常错的）：列出每个镜头观众要看懂的 "reads"，一次一个；快动作、慢意义；先引导视线
5. 活着：没有静止帧；表情通过 `emotions()` 过渡（预备、眯眼、take、过冲），不硬切
6. 每个接缝都要转场，且要属于故事（刷子擦除、iris、甩镜、匹配剪辑、动作剪辑）
7. 写代码前先有分镜

作者经验：推理强度（effort）越高，模型做出的场景越"奢华"、细节越多；所有测试用 xhigh。

### 7. awesome-claude-5-5-videos —— 研究结论

- 424 条去重来源帖：Opus 301 · Fable 68 · Sonnet 54 · Haiku 21
- 游戏/交互 70% 是 3D；广告/发布片 71.6% 是动态图形/界面
- 同一类别里深色和浅色方案都常见（350 个 MG 中深色 198、浅色 152），不要只给一张平均色卡
- 成本要看整项任务：金门桥案例 Haiku $2.19 vs Opus $3.04；短提示词背后往往有丰富的素材、skill 和多轮修改

### 8. opus-video-prompts —— 中文入门 + 技术路线

9 种技术路线：

| 路线 | 适合 |
|---|---|
| 单 HTML + Canvas/JS | 像素、图解、UI 动效 |
| p5.js + p5.brush | 手绘/水彩、MV |
| Remotion（React） | 产品宣传片、长片 |
| HyperFrames | HTML 视频发布片 |
| Manim + TTS | 数学/论文讲解 |
| Python 逐像素线稿 | 中文科普（五千年、大气环流） |
| Three.js/WebGL | 3D 场景、历史战役 |
| 操控专业软件 | AE、Blender、Seedance/Runway API |
| 剪辑已有素材 | ffmpeg、video-use |

写法经验：先分镜后代码；像导演一样给结构；**列禁用清单**（粒子爆炸、RGB 分离、镜头光晕、霓虹辉光、弹跳缓动）；确定性渲染；让模型自己看片返工；effort 开到 high 以上；API key 放 `.env` 并在 `.claude/settings.json` 里 `deny Read(./.env)`。成本：一句话短片几美元，几分钟 MV 单次可能 ~200 美元，按多轮迭代估预算。

---

## 三、提炼出来的"出片清单"

1. **定规格**：时长（默认 30–60 s；MG 10 s）、1920×1080 或 1080×1920、24/30/60 fps、−14 LUFS。
2. **定风格**：写出可检验的标志特征（色值、字体、缓动曲线、帧数），再列一份禁用清单。
3. **写 treatment**：三种候选结构 → 选一种；logline；钩子（前 0.5–3 s）、升级、高潮（60–75%）、呼应式结尾；一个 native move；一条贯穿线索。
4. **cue map 先行**：BPM、小节网格、每个剪辑点/动作/字幕落在哪一拍。画面和声音读同一份时间轴。
5. **风格帧**：用真代码渲 3 张静帧（有角色就画设定稿），自己对照风格说明检查。
6. **制作**：`render(t)` 纯函数；可以按章节拆给子代理，每个只改自己的文件。
7. **声音**：三层；静默；J/L-cut；配乐用风格自己的乐器。
8. **自检**：接触表（每 1–2 s 一帧）、关键动作 0.2 s 胶片条、全分辨率局部、响度/黑帧检测、全速带声看一遍。
9. **评审一轮**：另开会话按 rubric 打分，贴回来改。
10. **交付**：MP4 + 封面 + .srt + TREATMENT.md + CREDITS（只用 CC0/CC BY/OFL）+ 一键 `build.sh`。

## 四、可直接用的提示词骨架

```text
你是这支 <时长> 秒短片的导演、动效设计师、工程师和音效师。
目标：<风格> 最经典也最惊艳的形态，达到高端商业水准；模板感 = 失败。

# 输出（固定）
<宽>×<高>，<fps> fps，精确 <时长> s，H.264 + 立体声 AAC 48 kHz，−14 LUFS，真峰值 ≤ −1 dBTP，文件 video.mp4。

# 技术路线
单个 index.html，暴露 window.renderAt(t)，每帧只由 t 决定（无计时器、无 CSS 过渡、无跨帧状态、随机数带种子）。
Playwright 逐帧截图 + ffmpeg 合成；配乐和音效用代码合成，读同一份 cues.json。

# 创意种子
<一句话片名>
- 0–X s 钩子：…
- X–Y s 升级：…
- Y s 高潮（约 60–75% 处）：…
- 最后 1 s 定格：…
配色：<3–6 个色值>；字体：<字体>；声音：<风格 + 关键音效>

# 标志特征（按此评判）
<可检验的特征与技法，每条一行，带数值>

# 禁用
粒子爆炸、RGB 分离、镜头光晕、霓虹辉光、千篇一律的居中字幕、写实人脸、<其他>

# 工作方式
1. 先写 TREATMENT.md（三种结构选一）和 cue map，给我看过再写代码。
2. 渲 6–10 张关键静帧并亲自看，改到每张都能当海报。
3. 做动画；正式渲染前抽查每拍一帧。
4. 渲染后出接触表自检，修一轮；告诉我文件位置。
```

## 五、注意事项

- 版权：参考只学语法，不抄角色、旋律、镜头、Logo；品牌名和文案用虚构的；素材只用 CC0/CC BY/OFL 并写进 CREDITS。
- 中文字体要按用到的字子集化（Google Fonts `&text=`），本地加载，不在渲染时联网。
- 地图：lemo-opuscar DIRECTOR.md §13 有专门规则（不画国界除非必要；出现中国时须完整，含台湾、南海诸岛等）。
- 本笔记只读了这些仓库的文档和部分源码，没有在本环境里实际渲染。
