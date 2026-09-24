# 流体设计规范（Fluid Design Spec）

把 ColorOS 17 的「流体设计」设计语言，落成一套**能约束 AI 和前端开发者**的规范文件。

用途：喂给 agent harness（或人）。生成界面前先读规范，生成后按自查清单验收。
来源：ColorOS 17 官方设计语言（已联网核实，见 `SOURCES.md`）+ 本规范的工程化取值。
版本：v2.0 ｜ 语言：中文（令牌名保持英文）

> **⚠️ 口径先说清楚**：**理念是官方的，数值是我们自己定的。**
> 「流体设计 / 凝光视效 / 流体动效 / 柔性反馈 / 浮岛式导航」这些说法来自 OPPO 官方；
> 但**颜色 hex、圆角 px、动效 ms、缓动曲线、断点**这些具体数值，OPPO 从未公开发布过，是本规范为落地自拟的。
> 往外沟通时请说"参照 OPPO 流体设计理念自拟的规范"，别说成"OPPO 官方规范"。逐条出处见 `SOURCES.md`。
>
> **品牌色是项目输入，不是规范资产**：规范只给默认值（日出蓝 `#1A6BFF`），换项目只改 `tokens/brand.css` 一个文件。

---

## 一、目录说明

```
fluid-design-spec/
├── README.md                 # 本文件：怎么用这套规范
├── SOURCES.md                # 来源与核实：哪些是官方原话、哪些是自拟（建议先看）
├── Design.md                 # 共享设计令牌 + 双端差异总纲（9 节，必读）
├── fluid-design.skill.md     # 流体设计动态行为规范：凝光/动效/反馈（双端）
├── DESIGN.mobile.md          # 移动端专属约束
├── DESIGN.web.md             # Web / B 端专属约束
├── tokens/
│   ├── brand.css             # 【唯一改动点】品牌层：2 个输入 + 10 个算法派生值
│   ├── brand.presets.css     # 可选：3 个现成品牌预设（墨绿 / 品红 / 青蓝）
│   ├── tokens.css            # 全局层 + 语义层 + 组件层（引 brand.css）
│   └── tailwind.preset.js    # Tailwind theme.extend 预设
├── scripts/
│   └── brand.mjs             # 换品牌门禁：derive 生成派生值 / check 体检 / selftest 自检
└── specs/                    # 本仓库自己的任务规格（spec-builder 产物）
```

## 二、安装（复制一句话给你的 AI 助手）

**最快路径**：把下面这段整段复制，粘进你的 AI 助手（Claude Code / Codex / Cursor / DSH 都行）的对话框，回车即可。

```
把流体设计规范装进当前项目：用 gh repo clone kaijia323/fluid-design-spec docs/fluid-design-spec 克隆下来（私有仓库，走已登录的 gh 或 SSH），再把「写界面前先声明遵循流体设计规范、写完按各文件末尾的自查清单验收、品牌色只改 tokens/brand.css」记进项目的 AGENTS.md / CLAUDE.md，最后告诉我移动端和 Web 端各该读哪几个文件。
```

**它做完你只需要核对两件事**

1. 仓库是不是落在 `docs/fluid-design-spec/`（位置你说了算，在那一句话里改掉就行）；
2. 它有没有说清读取组合：移动端 = `Design.md` + `fluid-design.skill.md` + `DESIGN.mobile.md`；Web / B 端 = `Design.md` + `fluid-design.skill.md` + `DESIGN.web.md`。

**不想用一句话，两条命令也行**

```bash
gh repo clone kaijia323/fluid-design-spec docs/fluid-design-spec   # 或 git clone git@github.com:kaijia323/fluid-design-spec.git docs/fluid-design-spec
node docs/fluid-design-spec/scripts/brand.mjs check                # 体检，默认配置应当 9 pass / 0 fail / 3 warn
```

克隆完把 `docs/fluid-design-spec/tokens/tokens.css` 引进项目就能用；换品牌只改同目录的 `brand.css`，Tailwind 项目直接引 `tailwind.preset.js`。

**可选：装成全局 skill**（Claude Code 这类支持 skills 的助手）——把仓库放到 `~/.claude/skills/fluid-design/`，再把 `fluid-design.skill.md` 复制成 `~/.claude/skills/fluid-design/SKILL.md`，之后任何项目里说一句「按流体设计规范来」就能触发，不用每个项目重复克隆。

> **注意：本仓库当前是私有（private）**。你和已登录的助手能克隆；给别人用要先在 GitHub 加 Collaborator，否则对方会报 `could not read Username`。克隆失败时，先让助手跑一次 `gh auth status` 看有没有权限。

## 三、上手四步

1. **先定品牌色**（只有这一步跟项目有关）
   - 有品牌色：改 `tokens/brand.css` 的 `--brand-accent`（可选再改 `--brand-accent-2`），跑 `node scripts/brand.mjs derive '#你的色值'` 覆盖派生段；
   - 没品牌色：直接用默认日出蓝，什么都不用改；
   - 想看看换色长什么样：`tokens/brand.presets.css` 里有 3 个预设（`ink-green` / `magenta` / `teal`），给 `<html data-brand="ink-green">` 就能切换。
     **引入顺序**：`tokens.css` → `brand.presets.css`（预设要排在品牌默认值后面才生效）。
2. **选读取组合**
   - 生成移动端：`Design.md` + `fluid-design.skill.md` + `DESIGN.mobile.md`
   - 生成 Web / B 端：`Design.md` + `fluid-design.skill.md` + `DESIGN.web.md`
3. **生成前先声明**：「我将遵循 Design.md 的规范生成代码。」
4. **生成后自查**：对照各文件末尾的自查清单（硬编码颜色、漏交互态、动效时长越界、反模式元素），并跑一次 `node scripts/brand.mjs check`。

## 四、换品牌（v2.0 新增）

品牌色是**项目输入**，规范资产（中性色阶、状态色）不跟着变。目录里只有 `tokens/brand.css` 需要按项目改，其余文件一个字都不用动。

**五步法**

1. **填 2 个输入**：`--brand-accent`（品牌主色）、`--brand-accent-2`（第二强调色，可不改）。
2. **生成派生值**：`node scripts/brand.mjs derive '#0e7a5f'`，把输出粘进 `@brand-derived` 段。hover / 按下 / 暗色提亮 / 按钮文字色都由算法算，不要手写。
3. **过门禁**：`node scripts/brand.mjs check` —— 对比度、交互态可辨性、状态色撞色、令牌引用完整性、预设体检，全 pass 才算换完。
4. **明暗各看一眼**：明色看按钮白字，暗色看提亮主色与焦点环。
5. **提交**：只提交 `tokens/brand.css`（以及可选的 presets）。

**门禁一览**（`node scripts/brand.mjs check`）

| 编号 | 查什么 | 阈值 |
|---|---|---|
| G1 / G2 | 品牌主色实心块上的文字对比度（明 / 暗） | ≥ 4.5:1 |
| G3 | 暗色提亮主色对暗色底 | ≥ 4.5:1 |
| G4 | hover / active 与默认态是否肉眼可分（OKLab 明度差） | ≥ 0.03 |
| G5 | 品牌主色与成功 / 警告 / 错误色的色相距离 | ≥ 15° |
| G6 | 明暗两套下正文、次要文字对比度 | ≥ 4.5:1 |
| G7 | 令牌引用完整性（`var(--x)` 有没有定义） | 未定义数 = 0 |
| G8 | 派生段是否等于算法输出（防手改走样） | diff = 0 |
| G9 | 预设体检：`brand.presets.css` 里每个预设的派生值与算法一致、按钮文字对比度达标 | 全部一致且达标 |

> 除 G1~G9 外，`check` 还会打**提示**（不拦，但值得看一眼）：W1 提示色对比不足、W2 主色按钮文字偏紧（< 5:1）、W3 品牌色与分类标识色 `--color-purple` 分不清、W4 第二强调色与状态色太近。默认预设跑出来是 3 条（W3 只有品牌色确实靠近紫色时才出现）。

> 两点必须记住：**主色实心按钮上的文字用 `--color-on-accent`**（不要写 `#fff`，浅色品牌下会不可读）；**状态色不随品牌变**，品牌色撞上错误红/警告橙要改品牌色相，或给该状态加图标与文字。

## 五、双端差异一页速查

| 决策点 | 移动端 | Web / B 端 |
|---|---|---|
| 圆角 | 16–24px（卡片 16、按钮 12、小组件 20、浮岛 24） | 6–12px（标签 6、按钮 8、卡片 12） |
| 动效时长 | 300–400ms | 150–220ms |
| 导航 | 浮岛式，居中悬浮，滚动隐藏/浮现 | 侧边栏，窄屏收成抽屉 |
| 渐变 | 可用（凝光） | 禁用 |
| 光斑 | 可用 | 禁用 |
| 交互态 | hover / active / focus / disabled | hover / focus-visible / active / disabled |
| 按钮按下缩放 | scale(0.96) | scale(0.98) |
| 焦点环 | 品牌主色 2px，偏移 2px | 品牌主色 2px，偏移 2px |
| 快捷键 | 无 | ⌘K / Ctrl+K 聚焦搜索 |
| 信息密度 | 中等 | 优先 |

## 六、三句话记住它

- **凝光视效**：光不是装饰，是界面的指引；光影随手势走。
- **流体动效**：转场无缝连贯，不硬切，一切缓动都走 `--ease-fluid`。
- **柔性反馈**：元素随操作收缩、拉伸、回弹，始终跟手。

## 七、反模式（红线，出现即返工）

- 紫蓝渐变、emoji 当图标
- 卡片套卡片、阴影超过 2 层
- 硬编码颜色值（必须走 CSS 变量）
- 在组件里写死品牌 hex（品牌色只能来自 `tokens/brand.css`）
- 主色块上的文字写 `#fff`（必须用 `--color-on-accent`）
- 间距不是 4 的倍数
- 与用户操作无关的装饰性动画、无意义闪烁
- 弹跳曲线、超过 500ms 的动效
- Web / B 端出现渐变、光斑、装饰性动画

## 八、v1 → v2 迁移（如果你已经用了 v1.1）

| v1.1 | v2.0 | 处理 |
|---|---|---|
| `--color-primary` | `--brand-accent` | 旧名保留为兼容别名，标注 deprecated，可继续用但不建议 |
| `--color-primary-hover/-active/-bright/-bright-hover/-bright-active` | `--brand-accent-hover/-active/-bright/-bright-hover/-bright-active` | 同上 |
| `--color-accent`（日落橘） | `--color-accent-2` | 颜色不变，旧名保留为别名 |
| —— | `--color-on-accent` / `--color-on-accent-2` | 新增：主色块上的文字色，别再写 `#fff` |

数值上有一处**可见但很小**的变化：`--brand-accent-hover` `#3D82FF → #2C7CFF`、`--brand-accent-bright` `#5B93FF → #4FA0FF`。原因是 v2.0 的默认值必须等于 `node scripts/brand.mjs derive '#1A6BFF'` 的输出，否则默认预设自己就过不了门禁。

## 九、未包含的内容

按要求，本次**没有生成示范 HTML**。原会话里提到的 4 个示范页（移动端登录页、移动端主页、移动端四页导航 SPA、Web/B 端后台）只作为「待补的验收样例」列在这里，需要时再按本规范生成：

- 移动端登录页：凝光光斑背景 + Liquid Acrylic 卡片 + 输入框四态 + 浮岛提示
- 移动端主页：问候语 + 继续工作卡片（进度环 + 光斑）+ 快捷操作网格 + 最近活动 + 浮岛导航
- 移动端四页导航 SPA：首页 / 探索 / 消息 / 我的，视图切换淡入 + 上移 10px
- Web/B 端后台：侧边栏 + 顶栏 + 统计卡片 + 表格 + 活动时间线 + ⌘K

## 十、维护方式

改规范 = 同时改文档和 `tokens/` 里的令牌，两者必须一致；改完跑一次 `node scripts/brand.mjs check`（它会顺手检查令牌引用有没有断）。
建议流程：先用一个页面跑一遍 → 看偏差 → 在对应文件的组件章节加粗标注修补 → 更新自查清单 → 迭代令牌。
品牌色这块只有 `tokens/brand.css` 会被项目方改动，规范侧的改动不要写进那个文件。
