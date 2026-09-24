# Design.md — 流体设计系统 · 共享规范

> **本文件是唯一事实来源（Single Source of Truth）**，定义流体设计的共享设计令牌与双端差异总纲。
> 生成任何界面之前先读本文件，再按目标端读 `DESIGN.mobile.md` 或 `DESIGN.web.md`，动态行为一律读 `fluid-design.skill.md`。
> 版本 v2.0 ｜ 来源：ColorOS 17 流体设计语言 + 官方口径核查（逐条见 `SOURCES.md`）｜ 标注 **※** 的条目为本规范补充定义。
>
> **口径说明（重要）**：本文件里「流体设计 / 凝光视效 / 流体动效 / 柔性反馈」等**理念表述**来自 OPPO 官方；但**具体数值令牌**（颜色 hex、圆角 px、动效 ms、缓动曲线、断点、间距阶）是**本规范为工程落地自拟的取值，OPPO 从未公开发布过这些数值**。请勿把它们当成官方标准对外引用。

---

## 0. 怎么用这份规范

### 0.1 读取组合

| 生成目标 | 必读文件 |
|---|---|
| 移动端界面 | `Design.md` + `fluid-design.skill.md` + `DESIGN.mobile.md` |
| Web / B 端界面 | `Design.md` + `fluid-design.skill.md` + `DESIGN.web.md` |

### 0.2 三条硬性约定

1. 生成前先声明：「我将遵循 Design.md 的规范生成代码。」
2. 规范没有定义的场景 → 复用最接近的已有组件变体，**禁止自创样式或新令牌**。
3. 文件冲突时，越具体越优先：`DESIGN.mobile.md` / `DESIGN.web.md` > `fluid-design.skill.md` > `Design.md`。

### 0.3 机器可读令牌

- `tokens/tokens.css` — CSS 变量（品牌层 → 全局层 → 语义层 → 组件层 四层；品牌层单列在 `tokens/brand.css`）
- `tokens/tailwind.preset.js` — Tailwind `theme.extend` 预设

文档与令牌必须同步：改规范就改令牌，反之亦然。

---

## 1. 视觉主题与情绪

**关键词：轻盈通透、流体自然、温润一致。**

### 1.1 三大核心元素（官方口径）

官方原话：「**流体设计，为流畅而生的全感官设计语言**」——从**视觉效果、过渡动效、触控反馈**三个维度串起一条连贯的体验链路。
出处：ColorOS 17 官网 <https://www.coloros.com/version/coloros17/> 页面文案、ODC26 发布会（2026-09-17）。

| 元素 | 官方原话（节选） | 本规范的落地要求 |
|---|---|---|
| **流体动效**（丝滑连贯） | "细腻的流体动效贯穿系统全局，每一次解锁，时钟在锁屏与桌面间连贯穿梭，一眼舒适；滑动锁屏岛、通知，点击浮岛式导航栏，不同元素自然衔接，无缝流转。" | 转场无缝连贯，禁止硬切 |
| **柔性反馈**（随你而动） | "从按钮、选框，到整个界面，种种元素随你的点按与拖动自然拉伸、受力挤压、灵动回弹，呈现真实的惯性。界面有了生命力，鲜活回应你的触碰。" | 元素随操作收缩、拉伸、回弹 |
| **凝光视效**（自然通透） | "全新凝光视效让界面视觉更显通透纯净，图标与文字依然清晰可读。凝光跟随手指自然流动，并以不同形态指引你状态与进程。" | 光是指引，随手势流动 |

官方还点名了两个具体形态：

- **浮岛式导航栏** —— ColorOS 设计总监陈希：浮岛式导航设计语言覆盖几乎所有内置应用，以**圆形与透明材质**为基底，导航栏等元素全部悬浮化。
- **锁屏岛** —— 可滑动，与通知、浮岛导航栏之间自然衔接。

一句话记法：**光用来指路，动效用来连贯，反馈用来确认。**

### 1.2 设计语言演变（已核实）

| 设计语言 | 版本 | 主张 | 依据 |
|---|---|---|---|
| 无边界设计 | ColorOS 6–12 | 轻快无边界（官方自称"无边界设计 2.0"） | OPPO 官方公众号（ColorOS 7）+ 一加官网「ColorOS 12 自在无边界」 |
| 水生设计 Aquamorphic Design | ColorOS 13–14 | 水生万物：自然、流畅、生命力 | OPPO 官方英文新闻稿 + 台湾官网中文「水生」 |
| 自然光影 | ColorOS 15 | 「见自然，亦见自我」，口号：超轻快，更自在 | coloros.com 官方页面 + 官方文章 A00000066 |
| 光场设计 | ColorOS 16 | 模拟真实光影变化，重构交互 | 官方宣布（2025-10-09）+ 发布（2025-10-15） |
| **流体设计** | **ColorOS 17 起** | **为流畅而生的全感官设计语言** | coloros.com 官网 + ODC26（2026-09-17） |

**传承关系（官方原话）**：设计总监陈希——"**光场设计进化为「凝光视效」**"；"流体动效融合效果"继承自 ColorOS 16。也就是说 ColorOS 17 的凝光视效不是凭空冒出来的，是从 16 的光场设计长出来的。

> ⚠️ **两处更正**：
> 1. 会话原始材料把「流体设计」写成"ColorOS 15 至今"，这是**错的**——ColorOS 15 是「自然光影」，16 是「光场设计」，流体设计从 **ColorOS 17** 才开始。
> 2. 本规范 v1.1 曾把 ColorOS 15 的设计语言写成「超轻快，更自在」，那其实是**口号**；官方对 15 的设计语言表述是「**自然光影**」。

### 1.3 设计理念与原则（含核实状态）

| 说法 | 核实状态 | 依据 |
|---|---|---|
| 以人为中心 | ✅ 官方原话 | coloros.com 品牌页「作为以人为中心的智慧跨端系统」；ColorOS 15 发布稿陈希原话。**注意**：官方多在"系统定位"语境使用，不完全是设计口号 |
| 凝光视效 / 流体动效 / 柔性反馈 | ✅ 官方 | ColorOS 17 官网 + ODC26 通稿。官方预热视频文案另有「视效、动效、触控反馈」的说法 |
| 浮岛式导航 | ✅ 官方 | 设计总监陈希预热（2026-08） |
| 光场设计 → 凝光视效的传承 | ✅ 官方 | 陈希："光场设计进化为「凝光视效」" |
| 跨端：多设备无缝流转、一致体验 | ✅ 官方（**已修正措辞**） | 官方原话："打破设备壁垒，实现跨终端无缝流转…**设备无界、体验连续、服务直达**" |
| 直观、轻快、简约而富有设计感 | ⚠️ 查不到官方出处 | 来自会话原始材料 |
| 交互优化从易用性、统一性、创新性着手，前两者占 90% 精力 | ⚠️ 查不到官方出处 | 同上 |
| 大屏适配：更大屏幕呈现更多内容，多种设备保持相似体验 | ⚠️ 查不到官方出处 | 同上（官方只说"跨越设备、始终一致的体验"） |

标 ⚠️ 的三条，在本规范里**只当设计取向使用，不作为官方标准引用**。跨端那条已按官方原话改写，可以直接引用。

### 1.4 情绪板与反面情绪

- 要的样子：晨光、水面、磨砂玻璃、柔和投影、留白。
- 不要的样子：厚重、炫技、拥挤、装饰堆砌、霓虹刺眼。

---

## 2. 色彩系统

### 2.1 四层令牌结构

v1.1 的「Global → Semantic → Component」三层，在 v2.0 扩成四层：把**品牌色**从全局层里拆出来，单独作为「项目输入」的一层。

```
Layer 0 品牌层   --brand-*                                  ← 项目输入，换项目只改这里
      ↓ 引用
Layer 1 全局层   --color-neutral-* / 状态色 / --color-purple  ← 规范资产，不随品牌变
      ↓ 引用
Layer 2 语义层   --color-action-* / --color-bg-* / --color-text-* / --color-border-* / --color-status-* / --color-on-accent* / --color-accent-2
      ↓ 引用
Layer 3 组件层   --button-radius / --input-radius / --card-radius …
```

| 层 | 令牌前缀 | 定义在 | 谁可以引用它 |
|---|---|---|---|
| Layer 0 品牌层 | `--brand-*` | `tokens/brand.css`（示例预设：`tokens/brand.presets.css`） | 语义层（光斑例外见下） |
| Layer 1 全局层 | `--color-neutral-*`、状态色、`--color-purple` | `tokens/tokens.css` | 语义层 |
| Layer 2 语义层 | `--color-action-*` / `--color-bg-*` / `--color-text-*` / `--color-border-*` / `--color-status-*` / `--color-on-accent` / `--color-on-accent-2` / `--color-accent-2` | `tokens/tokens.css` | 组件层、页面代码 |
| Layer 3 组件层 | `--button-radius`、`--input-radius`、`--card-radius`、`--tag-radius`、`--page-gutter` 等 | `tokens/tokens.css` | 页面代码 |

引用方向是硬规则：

- **语义层可以引用品牌层或全局层**；
- **反向禁止**：品牌层、全局层都不许引用语义层（语义层的 `--color-accent-2: var(--brand-accent-2)` 是语义层引用品牌层，合法）；
- **组件层只引用语义层**，不许跨到品牌层或全局层；
- **唯一例外（凝光光斑）**：凝光光斑可以直接读 `--brand-accent`（语义层暂无「品牌色低透明度」令牌），见 `DESIGN.mobile.md` 第 7 节与 `fluid-design.skill.md` 2.2；除此之外组件 / 页面一律不得跨层引用品牌层或全局层。
- 品牌 hex 只允许写在 `tokens/brand.css` 一个文件里，其他地方一律 `var()` 引用，禁止硬编码。

Tailwind 侧同构：`tokens/tailwind.preset.js` 已把 `colors.brand`（`--brand-accent*`）、`colors.accent`（`--color-accent-2`）、`colors['on-accent']`（`--color-on-accent`）挂进 `theme.extend`；写 Tailwind 用 `bg-brand` / `text-on-accent`，不要写任意值 `bg-[#1a6bff]`。

### 2.2 品牌层（Layer 0）：可替换，唯一改动点

**品牌色是项目输入，不是规范的一部分**；规范只提供默认值（默认日出蓝 `#1A6BFF`），换项目只改 `tokens/brand.css`。（颜色 hex 是本规范自拟的，OPPO 从未公开过这些数值。）

| 令牌 | 类型 | 默认值 | 用途 |
|---|---|---|---|
| `--brand-accent` | **输入（唯一必改项）** | `#1a6bff` | 项目品牌主色（默认日出蓝）：主按钮、焦点环、链接、info 状态 |
| `--brand-accent-2` | **输入** | `#ff8c42` | 第二强调色（默认日落橘）；语义名是 `--color-accent-2` |
| `--brand-accent-hover` | 派生 | `#2c7cff` | 明色悬停 |
| `--brand-accent-active` | 派生 | `#0053e6` | 明色按下 |
| `--brand-accent-bright` | 派生 | `#4fa0ff` | 暗色模式用的提亮版（对暗底 ≥ 4.5:1） |
| `--brand-accent-bright-hover` | 派生 | `#5fb1ff` | 暗色悬停 |
| `--brand-accent-bright-active` | 派生 | `#3989ff` | 暗色按下 |
| `--brand-on-accent` | 派生 | `#ffffff` | 品牌主色**实心按钮上的文字色**（明色） |
| `--brand-on-accent-bright` | 派生 | `#1a1d24` | 提亮主色上的文字色（暗色） |
| `--brand-accent-2-hover` | 派生 | `#ff9c53` | 第二色悬停 |
| `--brand-accent-2-active` | 派生 | `#e67627` | 第二色按下 |
| `--brand-on-accent-2` | 派生 | `#1a1d24` | 第二色实心块上的文字色 |

前两行是**输入**，后十行是**派生**：由固定算法从输入算出来（OKLab 只调明度 L，C 与 H 不动，禁止用 HSL / HSV），**不要手改**；手改后 `node scripts/brand.mjs check` 的 G8 会报「派生值与算法不一致」。

**换品牌五步法**：

1. **填 2 个输入**：项目品牌主色写进 `--brand-accent`（唯一必改项）；第二强调色可选写进 `--brand-accent-2`，不填就沿用默认日落橘 `#ff8c42`。
2. **跑 derive**：`node scripts/brand.mjs derive '#0e7a5f' --brand-2 '#ff8c42'`（换成你的色值），用输出的 10 行逐字覆盖 `tokens/brand.css` 的 `@brand-derived` 段。
3. **跑 check**：`node scripts/brand.mjs check`，G1~G9 全 pass 才算过门禁；有 fail 就回去调品牌色，**不许放宽阈值**。
4. **明暗两套各看一眼**：重点看主色实心按钮上的文字（`--color-on-accent`）、焦点环、hover / active 三态。
5. **提交**：只提交 `tokens/brand.css`，`tokens/tokens.css` 一行都不用动。

- v1.1 的 `--color-primary` / `-hover` / `-active` / `-bright` / `-bright-hover` / `-bright-active` 六个旧名保留为兼容别名（deprecated），在 `tokens/tokens.css` 末尾指向对应的 `--brand-*`；新代码不要再用旧名。
- 项目有多套品牌时，照 `tokens/brand.presets.css` 写预设，用 `<html data-brand="ink-green">` 切换（内置 `ink-green` / `magenta` / `teal`）。
- **预设引入顺序**：预设文件要放在 `tokens.css`（或 `brand.css`）**之后**引入，正确顺序是 `tokens.css → brand.presets.css`。原因：`tokens.css` 第一行的 `@import "./brand.css"` 会把默认品牌值展开在预设之后，同特异性下后者胜，顺序放错三个预设会全部失效。预设选择器已用 `:root[data-brand]` 做双保险，顺序放错也不会失效；但规范仍要求按上面的顺序引入。

### 2.3 全局层（Layer 1）：规范资产，不随项目变

中性色阶、状态色与分类色是规范资产，任何项目都不改，只在 `tokens/tokens.css` 里定义一次。第二强调色不在这一层：它是品牌层的第 2 个输入，语义名 `--color-accent-2` 挂在语义层（见 2.2 / 2.4）。

**中性色阶**（明暗两套底色与文字的来源）

| 令牌 | 值 | 说明 |
|---|---|---|
| `--color-neutral-0` | `#ffffff` | 明色表面 |
| `--color-neutral-50` | `#f5f6f9` | 明色页面底色 |
| `--color-neutral-100` | `#edeff3` | 明色凹陷区 |
| `--color-neutral-150` | `#dfe3ea` | 备用阶（语义层未引用） |
| `--color-neutral-300` | `#a8b0bf` | 暗色次要文字 |
| `--color-neutral-400` | `#8a93a3` | 明色提示文字 |
| `--color-neutral-500` | `#6e7686` | 暗色提示文字 |
| `--color-neutral-600` | `#5a6270` | 明色次要文字 |
| `--color-neutral-700` | `#2a2f3a` | 备用阶（语义层未引用） |
| `--color-neutral-800` | `#1a1d24` | 明色主文字 |
| `--color-neutral-900` | `#14171f` | 暗色表面 |
| `--color-neutral-950` | `#0b0d12` | 暗色页面底色 |
| `--color-neutral-1000` | `#090a0e` | 暗色凹陷区 |
| `--color-ink-bright` | `#f2f4f8` | 暗色主文字 |

**状态色与分类色**（不随品牌变）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--color-success` | `#34c759` | 成功状态 |
| `--color-warning` | `#ff9500` | 警告状态 |
| `--color-error` | `#ff3b30` | 错误、危险操作 |
| `--color-purple` | `#8b5cf6` | 次级强调、分类标识（和品牌主色是两回事） |

状态色经语义层的 `--color-status-success` / `--color-status-warning` / `--color-status-error` 使用；`--color-status-info` 是例外，它等于品牌主色（见 2.4）。

### 2.4 语义层（Layer 2）：明 / 暗对照

**暗色是主模式**，明色为自动切换的备选。以下暗色列是设计基准，先做暗色再做明色。带 `var(--brand-*)` 的行取值随项目品牌变；写死的 hex 是默认品牌（日出蓝）下的解析结果。

| 语义令牌 | 明色 | 暗色 | 用途 |
|---|---|---|---|
| `--color-bg-base` | `#F5F6F9` | `#0B0D12` | 页面底色 |
| `--color-bg-surface` | `#FFFFFF` | `#14171F` | 卡片、面板 |
| `--color-bg-elevated` | `rgba(255,255,255,0.72)` | `rgba(28,32,42,0.72)` | 磨砂浮层（Liquid Acrylic） |
| `--color-bg-sunken` | `#EDEFF3` | `#090A0E` | 凹陷区、代码块 |
| `--color-text-primary` | `#1A1D24` | `#F2F4F8` | 主文字 |
| `--color-text-secondary` | `#5A6270` | `#A8B0BF` | 次要文字 |
| `--color-text-tertiary` | `#8A93A3` | `#6E7686` | 提示、占位 |
| `--color-text-inverse` | `#FFFFFF` | `#0B0D12` | 反色文字；**不要**拿它当主色按钮文字，那是 `--color-on-accent` 的活 |
| `--color-border-subtle` | `rgba(26,29,36,0.08)` | `rgba(255,255,255,0.08)` | 分隔线、描边 |
| `--color-border-strong` | `rgba(26,29,36,0.16)` | `rgba(255,255,255,0.16)` | 输入框、需要强调的边界 |
| `--color-action-default` | `var(--brand-accent)` | `var(--brand-accent-bright)` | 可点击主色（主按钮、链接） |
| `--color-action-hover` | `var(--brand-accent-hover)` | `var(--brand-accent-bright-hover)` | 悬停态 |
| `--color-action-active` | `var(--brand-accent-active)` | `var(--brand-accent-bright-active)` | 按下态 |
| `--color-focus-ring` | `var(--brand-accent)` | `var(--brand-accent-bright)` | 焦点环 |
| `--color-accent-2` | `var(--brand-accent-2)`（默认 `#FF8C42`） | 同明色（**不随主题变**） | 第二强调色：强调、辅助高亮（品牌层第 2 个输入，项目可换） |
| `--color-on-accent` | `var(--brand-on-accent)`（默认 `#FFFFFF`） | `var(--brand-on-accent-bright)`（默认 `#1A1D24`） | **品牌主色实心按钮 / 色块上的文字色** |
| `--color-on-accent-2` | `var(--brand-on-accent-2)`（默认 `#1A1D24`） | 同明色（**不随主题变**） | 第二强调色实心块上的文字色 |
| `--color-status-success` | `var(--color-success)` | 同明色 | 成功状态 |
| `--color-status-warning` | `var(--color-warning)` | 同明色 | 警告状态 |
| `--color-status-error` | `var(--color-error)` | 同明色 | 错误、危险操作 |
| `--color-status-info` | `var(--brand-accent)` | `var(--brand-accent-bright)` | 信息提示（跟随品牌主色，与焦点环同步） |

- **同一个 `--color-action-default`，明色取 `--brand-accent`，暗色取 `--brand-accent-bright`**——同一令牌在明暗两套下取值不同，这是设计意图：暗色底色是 `#0B0D12`，直接用明色主色对比度不够。
- `--color-accent-2` 与 `--color-on-accent-2` 属于语义层，但**不随明暗主题变**（两套取值相同）；`--color-accent-2` 指向品牌层的第二输入 `--brand-accent-2`（默认日落橘 `#ff8c42`），`--color-accent` 是它的 v1 兼容别名（deprecated，颜色不变）。

### 2.5 暗色模式

- **暗色优先**：先设计暗色，再补明色。
- 用 `prefers-color-scheme: dark` 自动切换；切换过程不要做长时间的整页过渡动画。
- 暗色下不要用纯黑 `#000` 打底，用 `#0B0D12`，避免 OLED 上边缘发"死黑"。
- 暗色下主色取 `--brand-accent-bright`（默认 `#4FA0FF`），由派生算法保证它对暗色底色 `#0B0D12` 的对比度 ≥ 4.5:1；**不要手写提亮值**，改了输入就重跑 `derive`。

### 2.6 用法规则

- 正文文字与背景对比度 ≥ 4.5:1，大字（≥ 18.66px 粗体或 ≥ 24px）≥ 3:1。
- 状态色只表达状态，不用于装饰；成功/警告/错误不能互换使用。
- 半透明只用于浮层（磨砂卡片、浮岛），正文区域保持实底。
- 同一屏内主色面积不要超过 20%，主色留给唯一主操作。
- **状态色不随品牌变**：换品牌只动品牌层的 2 个输入，`--color-success` / `--color-warning` / `--color-error` 永远是规范值。
- **品牌主色与状态色的色相距离必须 ≥ 15°**（由 `node scripts/brand.mjs check` 的 G5 判定）；撞色时要么微调品牌色相，要么让该状态改用「图标 + 文字」兜底——规范不替项目决定。
- **主色实心按钮上的文字用 `--color-on-accent`**，不要写 `#fff`，也不要用 `--color-text-inverse`（那个是给非品牌色背景用的）；第二强调色实心块上的文字用 `--color-on-accent-2`。

### 2.7 门禁与验证

换品牌、改品牌色之后必须跑 `node scripts/brand.mjs check`；门禁跑不过就是不能用，不要靠「看着还行」放行。

| 编号 | 查什么 | 阈值 | 拦不拦 |
|---|---|---|---|
| G1 | `--brand-on-accent` 对 `--brand-accent` 的对比度 | ≥ 4.5:1 | 拦 |
| G2 | `--brand-on-accent-bright` 对 `--brand-accent-bright` | ≥ 4.5:1 | 拦 |
| G3 | `--brand-accent-bright` 对暗色 `--color-bg-base` | ≥ 4.5:1 | 拦 |
| G4 | 交互态可辨：hover / active / bright-hover / bright-active 与各自基准的 OKLab 明度差 ΔL | ≥ 0.03 | 拦 |
| G5 | **品牌主色**与 `--color-success` / `--color-warning` / `--color-error` 的 OKLCH 色相环距离 | ≥ 15° | 拦 |
| G6 | 明暗两套下 `--color-text-primary`、`--color-text-secondary` 对 `--color-bg-base` 的对比度 | ≥ 4.5:1 | 拦 |
| G7 | 令牌引用完整性：`brand.css` / `tokens.css` / `tailwind.preset.js` 里每个 `var(--x)` 都有定义 | 未定义数 = 0 | 拦 |
| G8 | 派生值与算法一致：`brand.css` 派生段 == `derive(读到的输入)` 的输出 | diff = 0 | 拦 |
| G9 | 预设体检：`brand.presets.css` 每个预设有派生值与算法一致、且 G1/G2 对比度达标 | 全部一致且达标 | 拦 |
| W1 | `--color-text-tertiary` 对 `--color-bg-base`（页面底色，不是 surface；只用于提示、占位） | < 4.5:1 时提示（默认实测 明 2.86:1 / 暗 4.26:1） | 不拦 |
| W2 | G1 实测值 < 5.0:1（过线但偏紧） | 提示 | 不拦 |
| W3 | 品牌主色与分类标识色 `--color-purple` 的色相环距离 | < 15° 时提示 | 不拦 |
| W4 | 第二强调色与 `--color-success` / `--color-warning` / `--color-error` 的色相环距离 | < 15° 时提示 | 不拦 |

G5 只查品牌主色，不查第二强调色：第二色不承载状态语义，只做小面积强调。默认第二色 `#ff8c42` 与 `--color-warning` 只差 12.2°，`check` 会把它作为 **W4** 提示打印出来，**不算失败**。

```
node scripts/brand.mjs check                                  # 读 tokens/brand.css + tokens/tokens.css，跑 G1~G9
node scripts/brand.mjs check --brand '#0e7a5f'                # 不读文件，直接体检一个候选品牌色，跑 G1~G6
node scripts/brand.mjs derive '#0e7a5f' --brand-2 '#ff8c42'   # 打印 10 行派生段，逐字粘贴进 brand.css
node scripts/brand.mjs selftest                               # 3 个负例自检，全部按预期被拦才 exit 0
```

- 退出码：没有 fail → `0`；有 fail 或解析失败 → `1`。
- 每条门禁输出一行 `G1 <名称> 实测 阈值 pass|fail`，末尾一行 `结果：N pass / M fail / K warn`。
- 解析失败会打印出错行号并 `exit 1`，不会静默跳过——所以 `brand.css` 的格式（一行一个声明、两个空格缩进、行尾分号、hex 小写）别打乱。

### 2.8 禁止项

- ❌ 硬编码颜色值（`#fff`、`rgb(0,0,0)` 等），必须走 CSS 变量。
- ❌ 在组件、页面、Tailwind 任意值里写品牌 hex（`#1a6bff`、`#2c7cff` …）——品牌 hex 只允许出现在 `tokens/brand.css`。
- ❌ 用 `--color-text-inverse` 当主色按钮的文字色（按钮文字用 `--color-on-accent`，第二强调块用 `--color-on-accent-2`）。
- ❌ 品牌色与状态色同屏撞色（色相距离 < 15°，G5 直接拦）。
- ❌ 紫蓝渐变、彩虹渐变作为品牌表达。
- ❌ 同一屏出现两个以上"主色按钮"抢焦点。
- ❌ 用颜色单独传达信息（必须同时有文字或图标）。

---

## 3. 字体排印

### 3.1 字体族

```
--font-sans: "OPPO Sans 4.0", "OPPO Sans", "HarmonyOS Sans SC", Inter, -apple-system,
             "PingFang SC", "Microsoft YaHei", sans-serif;
--font-mono: "SF Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
```

规则：中文优先 OPPO Sans（官方品牌字体，当前 4.0，与汉仪联合开发，**允许个人和企业免费使用、含商业用途**），缺字回退 HarmonyOS Sans SC / PingFang SC；数字与代码用等宽字体便于对齐。

> 授权限制（官方条款）：不得对字体改编或二次开发、不得对外售卖、不得提供其他下载渠道、不得用于违法用途。版权归 OPPO 广东移动通信有限公司所有。引入前请以官网最新条款为准。

### 3.2 字阶

| 令牌 | 字号 / 行高 | 字重 | 用途 |
|---|---|---|---|
| `--text-caption` | 12px / 18px | 400–500 | 标签、角标、辅助说明 |
| `--text-body-sm` | 14px / 22px | 400 | 次要正文、表格内容 |
| `--text-body` | 16px / 24px | 400 | 正文基线 |
| `--text-title` | 20px / 28px | 500–600 | 卡片标题、区块标题 |
| `--text-headline` | 24px / 32px | 600 | 页面标题 |
| `--text-display` | 32px / 40px | 600 | 数据大字、欢迎语 |

字重只用 `400 / 500 / 600` 三档（※）。

### 3.3 排印规则

- 正文最小 14px；移动端**输入框字号 ≥ 16px**，避免 iOS 自动缩放。
- 一行中文 20–34 字为宜；英文行宽 ≤ 75 字符。
- 数字型数据用 `font-variant-numeric: tabular-nums` 对齐（※）。
- 层级靠字号 + 字重 + 颜色差共同建立，不靠下划线或大写字母堆叠。

### 3.4 禁止项

- ❌ 用 emoji 代替图标。
- ❌ 一屏内超过 3 种字号。
- ❌ 全大写中文、超长斜体、艺术字。
- ❌ 字号用奇数非标准值（13px、15px、17px 等）随意造阶。

---

## 4. 组件样式

### 4.1 圆角

全局圆角阶（`tokens/tokens.css`）：

| 令牌 | 值 |
|---|---|
| `--radius-xs` | 6px |
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 20px |
| `--radius-2xl` | 24px |
| `--radius-full` | 9999px |

组件映射按端不同（详见各端文件）：

| 组件 | 移动端 | Web / B 端 |
|---|---|---|
| 标签 / Tag | `--radius-full` | `--radius-xs` (6px) |
| 按钮 | `--radius-md` (12px) | `--radius-sm` (8px) |
| 卡片 | `--radius-lg` (16px) | `--radius-md` (12px) |
| 小组件 | `--radius-xl` (20px) | `--radius-md` (12px) |
| 浮岛导航 / 浮层 | `--radius-2xl` (24px) | `--radius-md` (12px) |
| 输入框 | `--radius-md` (12px) | `--radius-sm` (8px) |

### 4.2 按钮

| 维度 | 移动端 | Web / B 端 |
|---|---|---|
| 高度 | 44–48px | 32 / 36 / 40px 三档（※） |
| 圆角 | 12px | 8px |
| 按下 | `scale(0.96)` + 弹性回位 | `scale(0.98)` |
| 变体 | 主色实心 / 次要描边 / 文字按钮 | 同左 + 危险按钮 |

- 一个视图只允许一个主色实心按钮。
- 禁用态：降透明度 + `cursor: not-allowed`，且不响应动效。
- 加载态：按钮内联 loading，宽度不变，防止布局跳动（※）。

### 4.3 卡片

- 移动端：大圆角（16px）+ 磨砂（`backdrop-filter`）+ 极轻投影，禁止卡片套卡片。
- Web / B 端：12px 圆角 + 1px 描边，通常不用投影，靠描边和背景差区分层级。
- 卡片内边距：移动端 16–20px，Web 端 16–24px（※）。

### 4.4 导航

| 端 | 形态 | 行为 |
|---|---|---|
| 移动端 | 浮岛式，居中悬浮 | 向下滚动隐藏，向上滚动浮现 |
| Web / B 端 | 侧边栏 | 窄屏（< 860px）收成抽屉 |

详见 `DESIGN.mobile.md` 第 5 节、`DESIGN.web.md` 第 5 节。

### 4.5 输入框四态

所有输入控件必须具备四态，缺一不可：

1. 默认：`--color-border-strong` 描边，surface 底色。
2. 悬停：描边加深或主色 30% 透明版。
3. 聚焦：主色描边 2px + 焦点环，标签上浮或变色。
4. 错误 / 禁用：错误态用 `--color-error` + 错误文案；禁用态降透明度且不可聚焦。

### 4.6 禁止项

- ❌ 卡片嵌套卡片。
- ❌ 阴影超过 2 层。
- ❌ 纯直角（0 圆角）与超大圆角（> 28px）混用。
- ❌ 自造组件变体（规范里没有的按钮/卡片样式）。

---

## 5. 布局与间距

### 5.1 4px 基准间距阶

| 令牌 | 值 | 典型用途 |
|---|---|---|
| `--space-1` | 4px | 图标与文字间距 |
| `--space-2` | 8px | 紧凑元素间距 |
| `--space-3` | 12px | 列表项内间距 |
| `--space-4` | 16px | 页面左右边距（移动端） |
| `--space-5` | 20px | 卡片内边距（移动端） |
| `--space-6` | 24px | 区块间距、页面边距（Web） |
| `--space-8` | 32px | 大区块分隔 |
| `--space-10` | 40px | 页面顶部留白 |

### 5.2 规则

- 所有间距必须是 **4 的倍数**，只从上表取值。
- 相关元素靠近，无关元素拉开：组内 4–12px，组间 24–32px。
- 移动端：页面左右边距 16px，区块间距 24px，最大内容宽度 = 屏宽。
- Web / B 端：页面左右边距 24px，内容最大宽度 1440px，超出居中留白（※）。

### 5.3 禁止项

- ❌ 任意非 4 倍数的间距（5px、7px、13px、18px）。
- ❌ 用 margin 精确到小数位做视觉微调。
- ❌ 用空 div 撑高度。

---

## 6. 深度与阴影

- 优先用**背景模糊 + 半透明**表达层级（Liquid Acrylic），阴影是补充手段。
- 阴影最多 2 级，且最多 2 层叠加。

| 令牌 | 明色 | 暗色 | 用途 |
|---|---|---|---|
| `--shadow-1` | `0 1px 3px rgba(16,20,28,0.08)` | `0 1px 3px rgba(0,0,0,0.32)` | 卡片、浮岛 |
| `--shadow-2` | `0 8px 24px rgba(16,20,28,0.10)` | `0 8px 24px rgba(0,0,0,0.40)` | 模态、下拉、抽屉 |
| `--blur-acrylic` | `20px` | `20px` | 磨砂背景模糊 |

规则：
- 磨砂层必须同时有 1px 半透明描边（`--color-border-subtle`），否则在浅色背景上会"糊"。
- 浮层越高，模糊越大、阴影越柔；不要靠加深阴影颜色来提升层级。
- 禁止模糊用在正文文字层上（可读性优先）。

---

## 7. 设计准则与反模式

### 7.1 必做

1. 所有颜色、间距、圆角、时长都来自令牌。
2. 交互元素必须四态齐全。
3. 所有动效走 `--ease-fluid`，时长在各自区间内。
4. 所有动效提供 `prefers-reduced-motion` 降级。
5. 光效只用于指引，跟随用户操作。
6. 键盘可达：焦点可见、顺序合理。
7. 文字对比度达标。
8. 层级靠背景、描边、留白建立。

### 7.2 反模式（出现即返工）

| 反模式 | 说明 |
|---|---|
| 紫蓝渐变 | 不是本设计语言的表达 |
| emoji 当图标 | 必须使用图标库统一描边粗细 |
| 卡片套卡片 | 层级混乱 |
| 阴影超过 2 层 | 视觉变脏 |
| 硬编码颜色 | 破坏主题与暗色模式 |
| 非 4 倍数间距 | 破坏节奏 |
| 无意义装饰动画 | 光效/动效必须承担功能 |
| 弹跳曲线、> 500ms 动效 | 拖慢感知速度 |
| Web/B 端出现渐变、光斑 | 干扰信息读取 |

### 7.3 生成后自查清单

- [ ] 有没有硬编码颜色 / 间距 / 圆角？
- [ ] 交互态是否漏了 hover、focus-visible、active、disabled？
- [ ] 动效时长是否越界（移动端 300–400ms，Web 150–220ms，硬上限 500ms）？
- [ ] 是否出现反模式元素（渐变、emoji 图标、嵌套卡片、超 2 层阴影）？
- [ ] 暗色模式下对比度是否仍然达标？
- [ ] 是否提供了 `prefers-reduced-motion` 降级？
- [ ] 换品牌后跑过 `node scripts/brand.mjs check`，G1~G9 全 pass？
- [ ] 主色按钮 / 色块上的文字用的是 `--color-on-accent`（不是 `#fff`，也不是 `--color-text-inverse`）？
- [ ] 品牌色与状态色没有撞色（色相距离 ≥ 15°）？

---

## 8. 响应式

- **移动优先**：先设计 375px，再向上适配。
- 断点：`640px` / `1024px` / `1440px`。
- 移动端单列为主；Web 端在 1024px 以上启用侧边栏 + 内容区。
- 组件级适配优先用容器查询（`@container`），整页布局用媒体查询（※）。
- 移动端必须处理安全区域：`padding-bottom: env(safe-area-inset-bottom)`。
- 大屏原则：更大屏幕呈现更多内容，但保持相似的操作路径与视觉语言。
- 触控热区 ≥ 44 × 44px（移动端）；Web 端可点击文字行高 ≥ 32px（※）。

---

## 9. AI 提示词引用

### 9.1 移动端模板

```
我将遵循 Design.md 的规范生成代码，并同时遵循 fluid-design.skill.md 与 DESIGN.mobile.md。
要求：暗色优先；圆角按移动端映射；动效 300–400ms、统一 --ease-fluid；
触控反馈 scale(0.96)；浮岛式导航；间距全部取 4px 基准令牌；不使用任何硬编码颜色。
```

### 9.2 Web / B 端模板

```
我将遵循 Design.md 的规范生成代码，并同时遵循 fluid-design.skill.md 与 DESIGN.web.md。
要求：圆角 6–12px；动效 150–220ms；四态齐全（hover / focus-visible / active / disabled）；
焦点环主色 2px、偏移 2px；支持 ⌘K / Ctrl+K 聚焦搜索；禁用渐变与光斑；
表格行可 Tab 聚焦，行操作在 hover / focus-within 时显示。
```

### 9.3 越界处理

- 规范未覆盖 → 复用最接近的已有组件变体，禁止自创。
- 需要新令牌 → 先补进 `Design.md` 与 `tokens/tokens.css`，再写代码。
- 出现冲突 → 按 0.2 的优先级裁决。

---

## 附录 A：双端差异速查

| 决策点 | 移动端 | Web / B 端 |
|---|---|---|
| 圆角 | 16–24px | 6–12px |
| 动效时长 | 300–400ms | 150–220ms |
| 导航 | 浮岛式 | 侧边栏 |
| 渐变 | 可用（凝光） | 禁用 |
| 光斑 | 可用 | 禁用 |
| 交互态 | hover / active / focus / disabled | hover / focus-visible / active / disabled |
| 按钮缩放 | `scale(0.96)` | `scale(0.98)` |
| 焦点环 | 主色 2px | 主色 2px，偏移 2px |
| 快捷键 | 无 | ⌘K / Ctrl+K |
| 信息密度 | 中等 | 优先 |

## 附录 B：验证与迭代流程

1. **先跑一个页面**：同一个登录页分别出移动端和 Web 端，观察偏差。
2. **针对性修补**：比如 Web 端缺 hover 态，就在 `DESIGN.web.md` 对应章节**加粗标注**。
3. **建立自查清单**：硬编码颜色、遗漏交互态、动效时长越界、反模式元素。
4. **迭代令牌**：如果 AI 总用 16px 圆角但你想要 12px，就在组件章节加粗标注它。
5. **技术栈建议**：React + Tailwind，把 `tokens/tailwind.preset.js` 注册进 `theme.extend`。
