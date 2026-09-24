# 独立复核报告 · feature-brand-token-layer（v2.0）

> 复核人：**verifier**（task-5）｜ 日期：2026-09-24 ｜ 方式：**只读 + 跑命令**，不修改任何交付文件（本文件是唯一写入）
> 复核四轮：**初检（rev1）→ 复验（rev3，修复后）→ 最终确认（rev5）→ 收尾确认（rev6）**。初检结论 8 pass / 2 fail；**rev3 / rev5 / rev6 均为 10 pass / 0 fail**。最终交付快照与 md5 见文末「五、最终交付快照（rev5）」（其中 md5 已更新到 rev6）。
> 结论一句话：初检发现的「预设顺序失效」「预设名写错」「AC1 口径不自洽」「预设不在门禁范围」「G8 摘要不全」**5 项全部修复并已复验通过**；品牌层、派生算法、门禁脚本、兼容别名、文档令牌表经独立复算与端到端负例验证无问题。

## 复核方法与环境

- 只用 node v24.14.1 / python3 / grep / Playwright（Chromium）；临时实验全部在 `/tmp` 副本里做，仓库内**零残留**（无 `.playwright-mcp/`、无临时文件；两个临时 http 服务 8791/8792 均已 kill，无监听）。
- 颜色数学不采信脚本自述：另写 Python 实现（WCAG 相对亮度 + CSS Color 4 标准 OKLab 矩阵），先用 `#fff`/`#f00`/`#000` 公开参考值自检，再复算对比度与 ΔL。CSS 解析与 var() 链解析也另写独立实现（用于 AC7/AC10/AC8）。
- AC1 需临时改 `tokens/brand.css`：改前记 md5 + 备份 `/tmp/*.orig`，用 `trap` 保证退出即还原；**还原后 md5 一致且 `cmp` 逐字节相同**（rev3 复验同样执行了一遍）。
- **以真实浏览器验证预设**：临时 `python3 -m http.server` + Playwright，用真实 `<link>` 与 `@import`（不是把 @import 展开注入 `<style>`），验完关浏览器、kill 服务。

### 交付文件 md5（rev3，本次复验的冻结版本）

| 文件 | rev1（初检） | rev3（复验） | **rev5（最终交付）** |
|---|---|---|---|
| `tokens/brand.css` | 46812268232ec39eaebbc82194dd5626 | 46812268232ec39eaebbc82194dd5626 | **46812268232ec39eaebbc82194dd5626**（未变） |
| `tokens/tokens.css` | 15fc7213663b4fee384c34839dc69c5f | 15fc7213663b4fee384c34839dc69c5f | **15fc7213663b4fee384c34839dc69c5f**（未变） |
| `tokens/tailwind.preset.js` | b1ea7085489ab667757439473421615d | b1ea7085489ab667757439473421615d | **b1ea7085489ab667757439473421615d**（未变） |
| `tokens/brand.presets.css` | 92dd847de3c3ca83ea1c0a5c41c78eac | 68dec880c6ddd0efc15a2ee0c3e783f9 | **68dec880c6ddd0efc15a2ee0c3e783f9**（选择器改 `:root[data-brand]` + 顺序口径） |
| `scripts/brand.mjs` | c6f3ca71091d0cfc450f810992383006 | a141a7540c4851247e34dcf28b9416ae | **a141a7540c4851247e34dcf28b9416ae**（新增 G9、G8 列全） |
| `Design.md` | b736eacd5d1ab567d1b6d9fa7f9d1130 | 92f7ca3a9ffe534d7ff94c72b5582447 | **bda99e9ae971d91700a0cdb539afbf9b**（2.1 补 L123 光斑例外 + L113 层表引用方） |
| `README.md` | 05d011443e64f80e83238510aca0ed6b | d29539e7b768fb17e35bfe9340998361 | **d29539e7b768fb17e35bfe9340998361** |
| `DESIGN.mobile.md` | ba641918a15be7f142cacd54727164d6 | 2c92a0262868feecf283319340485324 | **b319f764f13bdd25e68c266b2bd2b446**（rev5 改兜底方向；**rev6** 与 skill.md 统一措辞、去掉具体令牌名） |
| `DESIGN.web.md` | 9a4d302e0b52476e0dddb6b22ad46d83 | d530d4310b693b084b8163fb4eb027fe | **d530d4310b693b084b8163fb4eb027fe** |
| `SOURCES.md` | b0ed90b8e7206d3dcfa9422788e29954 | b0ed90b8e7206d3dcfa9422788e29954 | **b0ed90b8e7206d3dcfa9422788e29954**（未变） |
| `fluid-design.skill.md` | 26c8add441d14559bbaec453c26e316e | 26c8add441d14559bbaec453c26e316e | **c3f8189b42f33b4045986be63f6ed13a**（rev4 补例外；**rev6** 兜底措辞与 mobile 统一） |
| `specs/…contract.md` | 5624d715d910480aac96094463cf3b1c | 59aa5717f7326234fc0cdfe3bc2637ff | **59aa5717f7326234fc0cdfe3bc2637ff**（§2 选择器口径 + G9 行） |
| `specs/…yaml` | 7664b97691a5100b6e22fb9cca875e83 | 0a461ab7453e0edfe6a4b7dc7743f384 | **f982423f7825aa8753685b210e01486e**（AC1/AC9 改写 + follow_ups F4~F7） |

- 复验前我按「连续 4 轮聚合 md5 不变」确认了 rev3 版本冻结（聚合 md5 `fefa6242b03fafeb948529fc5cb85a3b`）。
- rev4（DESIGN.mobile.md / fluid-design.skill.md / SPEC yaml）与 rev5（Design.md / DESIGN.mobile.md）是我复验快照之后的两次小改，**均已单独复验**，明细与最终 md5 见文末「五、最终交付快照（rev5）」。
- ⚠️ `specs/feature-brand-token-layer.yaml` 在我复核期间被 lead 改过三次（属 lead 自己的收尾，不是交付物漂移）；我复核用的是**当前**的 AC1/AC9 原文，与下文判定一致（rev5 的 AC1/AC9 文本与 rev3 逐字相同，仅行号因新增 follow_ups 下移）。

## 一、逐条判定（最终修订 rev6；rev5/rev6 的改动全在文档层，实测数据沿用 rev3，已回归验证）

| AC | 判定 | 证据命令 | 实测输出摘要 |
|---|---|---|---|
| AC1 换品牌只改一个文件 | **pass** ✅（初检为 fail，已随 SPEC 改写修复） | /tmp 副本：`sed` 改 `--brand-accent: #0e7a5f` + `derive '#0e7a5f'` 覆盖 `@brand-derived` → `node scripts/brand.mjs check`；`diff -rq $SRC/tokens tokens`；repo 内改前 md5 → 还原 → md5/`cmp` | 五步法后 **exit 0（9 pass / 0 fail）**；`diff -rq` 显示**只有 brand.css 不同**（其余文件一个字不用动）。反向确认「只改输入不覆盖派生段」→ **exit 1**，G4 fail（active ΔL -0.0112）+ G8 fail（diff = 5），属设计意图。`tokens.css` 品牌 hex = **0**。仓库内还原：md5 前后同为 46812268232ec39eaebbc82194dd5626，`cmp` 与备份、与初检前基线均逐字节相同 |
| AC2 默认值可复现 | **pass** | 抽 `@brand-derived` 段 → `derive '#1a6bff'` → `diff`/`cmp`/`md5sum` | 两侧 10 行、`diff` 空、**md5 同为 17349ffb56d39360771eb652ec8333b6**；`cat -A` 证实两空格缩进 + 行尾分号 |
| AC3 门禁能拦坏值 | **pass** | `selftest`；/tmp 副本把 hover 改成 `#1a6bff` 后 `check`；对脚本做变异测试 | selftest **exit 0**，三负例点名 **G1**（1.43:1）/ **G4**（+0.0000）/ **G5**（10°<15°）；文件态负例 **exit 1** 且 G4 被点名。变异测试：DL_MIN→-1、HUE_MIN→0、CONTRAST_MIN→0、G4 断言→恒真，对应负例立刻 ✗ 且 selftest exit 1 → **selftest 是真测试** |
| AC4 明暗对比达标 | **pass** | `check`；我自己的 Python WCAG 复算 9 个值 | G1 4.57 / G2 6.27 / G3 7.22 / G6 明 15.61、明次 5.69、暗 17.65、暗次 8.91，全 ≥4.5:1。**独立复算 4.5742 / 6.2682 / 7.2231 / 15.6068 / 5.6891 / 17.6498 / 8.9099**（W1 2.8649 / 4.2559），偏差 ≤0.005 → 脚本没算错 |
| AC5 撞色可判定 | **pass** | `check --brand '#c2410c'`；`check --brand '#0e7a5f'` | 前者 **exit 1** + 「与 --color-error(#ff3b30, 28.7°) 色相距离 **10° < 15°**（精确 9.7°）」；后者 **exit 0**。独立复算色相距离 9.7° 一致 |
| AC6 交互态可辨 | **pass** | `check` 的 G4 行；我的 Python OKLab 复算 | 实测 hover **+0.0371** / active **-0.0699** / bright-hover **+0.0428** / bright-active **-0.0559**，min\|ΔL\| 0.0371 ≥ 0.03；同时打印名义步长 +0.0500 / -0.0700。**复算逐值吻合（≤0.0002）** |
| AC7 兼容不破 | **pass** | 我的独立解析器；`node -e "require('./tokens/tailwind.preset.js')"` | 六个 `--color-primary*` 与对应 `--brand-*` **逐项相同**；`--color-accent` = `--color-accent-2` = #ff8c42；require 成功、`brand.DEFAULT === 'var(--brand-accent)'`、`accent = var(--color-accent-2)`、`on-accent = var(--color-on-accent)`；零依赖。**两个暗色块（@media 与 [data-theme="dark"]）18 条声明逐条相同**，action/focus-ring/status-info 一起切 bright |
| AC8 文档一致 | **pass**（已在修订后的 Design.md 上重跑） | Python 抽取 Design.md 第 2 节（L95~286）全部令牌名，逐个找定义 | 61 个真实令牌名、**未定义 0**（`--x`/`--brand`/`--brand-2` 是占位符与 CLI 参数）；L221 明文写「同一个 `--color-action-default`，明色取 `--brand-accent`，暗色取 `--brand-accent-bright`」 |
| AC9 预设可用（含真实浏览器） | **pass** ✅（初检为 fail，已修复） | `check` 的 **G9**；三个预设色 `check --brand`；Playwright 真实 `<link>`+`@import` 三种顺序 | G9「3/3 一致且达标」pass；三色 exit 0；**浏览器实测（修复后）三种引入顺序全部生效**：ink-green #0e7a5f / magenta #a21caf / teal #0e7490，按钮渲染色分别 rgb(14,122,95) / rgb(162,28,175) / rgb(14,116,144)，与预设值完全相等。连初检时报坏的顺序 `brand.css → presets.css → tokens.css` 现在也生效 |
| AC10 引用完整 | **pass** | `check` 的 G7/G8；我自己的独立 grep | G7「未定义 **0** 个（共 **150** 处引用）」、G8「diff = **0**」。独立统计 brand.css 0 + tokens.css 71 + tailwind.preset.js 79 = **150 处、未定义 0**，与脚本一致 |

## 二、复验（修复后）

针对初检提出的 5 条，逐条复验：

| # | 初检问题 | 修复方式 | 我的复验证据 | 结论 |
|---|---|---|---|---|
| 1 | **预设按文档顺序完全失效**（`:root` 与裸 `[data-brand]` 特异性打平，被 tokens.css 的 `@import "./brand.css"` 就地覆盖） | presets.css 三个选择器改 `:root[data-brand="…"]`（0,2,0）；头部示例顺序改成 `tokens.css → presets.css`；Design.md/README/contract 补顺序口径 | 真实浏览器（Chromium，临时 http 服务 + 真实 link/@import）三种顺序各测一遍：**顺序 A** `brand.css→presets.css→tokens.css`（初检报坏的顺序）、**顺序 B** `brand.css→tokens.css→presets.css`、**顺序 C** `tokens.css→presets.css`，三个预设**全部生效**且按钮渲染色等于预设值；`indigo` 作为不存在的预设名依然无效（文档已不再提它） | **已修复** ✅ |
| 2 | 文档预设名写错（Design.md「indigo」/ README「靛紫」，实际是 magenta 品红） | 改成 magenta / 品红 | `grep -rn 'indigo\|靛紫'` 覆盖 Design.md、README、SOURCES、三个端文件、tokens/ → **0 命中**；Design.md L157 与 README L30/L43 现在都写 `magenta` / 品红 | **已修复** ✅ |
| 3 | AC1 原文口径不自洽（「只改输入 → check exit 0」实际 exit 1） | SPEC AC1 改写为「按五步法只改 brand.css（输入 + derive 覆盖派生段）→ exit 0」，并注明「只改输入时 G4+G8 fail 属设计意图」 | 变体 A（只改输入）：**exit 1**，G4 fail（min\|ΔL\| 0.0112）+ G8 fail（diff = 5，文案为「共 5 条不一致」并列全 5 条）；变体 B（五步法）：**exit 0，9 pass / 0 fail / 2 warn**，`diff -rq` 证明只有 brand.css 变化 | **已修复** ✅（实现行为与算法自洽，改的是 AC 文案） |
| 4 | `brand.presets.css` 不在任何门禁范围内（改坏预设 check 仍 exit 0） | 新增 **G9 预设体检**：每个预设 7 个派生值 == derive 输出，且该预设 G1/G2 ≥4.5:1；缺文件、无预设块也 fail | 5 个负例全部 **G9 fail + exit 1**：① 派生值改坏（#4fab8e→#123456）→「2/3 一致且达标…[ink-green] --brand-accent-bright 文件 #123456 ≠ 算法 #4fab8e；G2 对比 1.33:1」；② 输入改成 #ffd400 但派生段不换 → 列出 6 处不一致 + G1 1.43:1；③ **派生值全部等于 derive 但对比度不够**（自造 #846ee6 预设，7 项 mismatch=0）→「G1 对比 4.30:1 < 4.5:1」；④ 删掉 presets.css →「未找到 tokens/brand.presets.css…缺失即拦」；⑤ 清掉所有 `data-brand` 块 →「未解析到 data-brand 预设块」。G9 是拦门禁（单独失败即 exit 1） | **已修复** ✅ |
| 5 | G8 失败摘要只列 4 条（报 diff=5 却只显示 4 条） | 改为列出全部不一致项（上限 10 条） | 变体 A 复验输出：「共 5 条不一致：第 1 行…第 5 行…—— 重跑 derive 覆盖派生段」，5 条全部列出 | **已修复** ✅ |
| 6 | （附带）DESIGN.mobile.md L68 / DESIGN.web.md L15 让组件直接用 `--brand-accent`，与「组件只引用语义层」冲突；README 提示条数写成 4 条（实际 3 条） | 改用语义令牌口径；README 改为「默认预设跑出来是 3 条」 | L68/L15 已不再出现；`check` 默认实际输出 W1/W2/W4 **3 条**，与 README 新表述一致 | **已修复** ✅ |

## 三、额外发现

### 已修复（初检提出、复验确认）

- 预设顺序失效、预设名 indigo/靛紫、AC1 口径、预设无门禁、G8 摘要不全、组件直用品牌层令牌（L68/L15）、README 提示条数 —— **7 项全部修复**（详见上一节）。
- contract §2 预设表里 hue 由写死的 `324.0°` 改成 `≈324°` 这类近似值，四舍五入歧义也一并消除。

### 仍存在的非阻塞项（建议列入 follow-up，不拦交付）

> rev4/rev5 后状态更新：下面 1、2 两条的**文档口径部分已由 rev4/rev5 处理**（光斑已写明是「唯一允许直接读品牌层」的例外，兜底改为「在 brand.css 加令牌」而不是写死 rgba()）；第 3、4、5 条已由 lead 写进 SPEC 的 follow_ups **F4 / F5 / F7**。rev5 之后**真正还没修**的只剩 2 条，见「5.4 rev5 残留」：skill.md:47 的旧兜底措辞未同步、`--brand-accent-soft` 未标注「待新增」。以下原文保留作记录。

1. **【低】`color-mix()` 仍出现在新写的文档示例里**：`DESIGN.mobile.md:101` 与 `fluid-design.skill.md:39 / :47 / :203` 的光斑写法用 `color-mix(in srgb, var(--brand-accent) 18%, transparent)`，与 SPEC 约束「不依赖 `color-mix()` / `oklch()` / 相对颜色语法：派生值是静态 hex，老 WebView 也能用」字面口径冲突。令牌派生确实只输出静态 hex（不受影响），skill.md 也自注了这层区别，但老 WebView 会整条丢弃该声明 → 光斑不显示。
2. **【低】光斑示例仍直接从组件/页面引用 Layer 0**：`DESIGN.mobile.md:101`、`fluid-design.skill.md:39/47/203` 让光斑取 `--brand-accent`，而 `Design.md:122` 的硬规则是「组件层只引用语义层」。语义层目前没有「品牌色低透明度」这类令牌，属规范缺口 —— 要么补一个语义令牌，要么在文档里显式写明这是唯一例外。`DESIGN.web.md:99` 属描述性说明（讲焦点环暗色解析到哪个值），可不改。
3. **【低】selftest 没有覆盖 G9**：selftest 仍是「3 负例 + 1 正例」，只练 G1/G4/G5；G9 的有效性目前只由我手工的 5 个负例证明。建议给 selftest 补一个「改坏预设派生值 → G9 fail」的负例，否则将来重构 G9 时自检不会报警。
4. **【低】G9 边界显示取整**：用临界色 `#699018`（on-accent 最优对比 4.4995）时，G9 文案打印「G1 对比 **4.50:1** < 4.5:1」——判定用严格比较（正确），但显示两位小数会让人误以为 4.50 不小于 4.5。建议该行显示三位小数或加「(精确 4.4995)」。
5. **【信息】README「二、三步上手」标题写三步、实际列 4 步**（v1.1 遗留措辞，非本次引入，也不影响任何 AC）。

### 采纳说明（供 lead 收尾参考，不影响判定）

- 初检的 fail 全部是「文档/口径/测试覆盖」层面，**核心实现（品牌层、派生算法、门禁数学、兼容别名）一次都没错**：脚本的对比度、OKLab ΔL、OKLCH 色相距离，我用独立实现复算三遍，数值全部吻合。
- 初检 lead 任务书里「只改输入时 G1~G7 仍 pass」的预期不成立（G4 也会 fail）——已在复验中用实测澄清，并写进了新的 SPEC AC1 说明。

## 四、未验证项与原因

| 未验证项 | 原因 |
|---|---|
| 换品牌后「明暗两套各看一眼」的**视觉观感** | SPEC out_of_scope 明确不生成示范 HTML；我只做数值门禁 + 浏览器 computed style 校验，没有做视觉评审/截图比对（观感属设计决策） |
| `prefers-color-scheme: dark` **自动切换**路径 | Playwright MCP 未提供 colorScheme 覆写，浏览器实测走 `[data-theme="dark"]` 强制块；用文本级比对兜底：`@media` 暗色块与 `[data-theme="dark"]` 块 **18 条声明逐条相同** |
| 旧 WebView / 非 Chromium 引擎上的表现 | 无对应环境。浏览器验证只在 Chromium 做；`color-mix()` 的降级只能从口径上指出（见额外发现 1） |
| Tailwind / PostCSS 真实构建 | SPEC out_of_scope 不引入构建管线；只验了 `require()` 成功与 `theme.extend` 结构 |
| `.git` 内部对象里的品牌 hex | `grep -rniF` 扫的是工作区文件；`.git` 内是压缩对象，未解包扫描（与交付物无关，不影响结论） |
| SPEC yaml 的后续编辑 | 复核期间 lead 又改了两次 SPEC（AC 文本 + 收尾），我以**当前** AC1/AC9 文本为准判定；SPEC 其余字段（status/verification）属 lead 自己的收尾范围 |

---

**最终结论**：最终交付版（**rev6**，交付文件 md5 见「五、最终交付快照（rev5）」的 5.1 表，已更新到 rev6 值）**10 条 AC 全部 pass**；初检发现的 5 个问题 + 2 个附带口径问题全部修复并经我独立复验；rev5/rev6 的文档层小改我也逐次复验（未触碰 tokens/ 与 scripts/）。rev5 留下的 2 条非阻塞建议（skill.md 兜底措辞未同步、`--brand-accent-soft` 无定义且未标注）**已在 rev6 修掉**：两处措辞统一、具体令牌名删除，两个文件未定义令牌名各为 0。本轮复核未修改任何交付文件。

## 五、最终交付快照（rev5）

### 5.1 最终 md5（13 个交付文件，以本节为权威快照）

```
46812268232ec39eaebbc82194dd5626  tokens/brand.css
15fc7213663b4fee384c34839dc69c5f  tokens/tokens.css
68dec880c6ddd0efc15a2ee0c3e783f9  tokens/brand.presets.css
b1ea7085489ab667757439473421615d  tokens/tailwind.preset.js
a141a7540c4851247e34dcf28b9416ae  scripts/brand.mjs
bda99e9ae971d91700a0cdb539afbf9b  Design.md
d29539e7b768fb17e35bfe9340998361  README.md
b0ed90b8e7206d3dcfa9422788e29954  SOURCES.md
b319f764f13bdd25e68c266b2bd2b446  DESIGN.mobile.md
d530d4310b693b084b8163fb4eb027fe  DESIGN.web.md
c3f8189b42f33b4045986be63f6ed13a  fluid-design.skill.md
f982423f7825aa8753685b210e01486e  specs/feature-brand-token-layer.yaml
59aa5717f7326234fc0cdfe3bc2637ff  specs/feature-brand-token-layer.contract.md
```

rev1→rev6 的演进痕迹见本文开头那张表（rev1 / rev3 / rev5 三列，rev6 值见本节）。落笔前我复核了两次 md5，**无写入进行中**，交付文件与 rev3 复验快照在 tokens/、scripts/ 与其余文档上一致。
> **rev6（本报告最后一次更新）**：仅 `DESIGN.mobile.md` 与 `fluid-design.skill.md` 两处光斑兜底措辞统一为「在 `tokens/brand.css` 里补一个低透明度品牌色令牌（**当前不存在，需按需新增**），再用 `@supports not (color: color-mix(...))` 切过去——不要在组件里写死 `rgba()`」，并删掉了具体令牌名 `--brand-accent-soft`；`Design.md` 仍 bda99e9a…，`scripts/`、`tokens/` 与 rev5 一致（AC 判定不受影响，仍 10/10 pass）。

### 5.2 rev4 / rev5 三次小改的复验（都在复验快照之后）

| 版本 | 改了什么 | 我的复验 | 结论 |
|---|---|---|---|
| rev4 | `DESIGN.mobile.md` / `fluid-design.skill.md`：光斑处补「唯一例外」措辞、color-mix 内核要求与 @supports 兜底提示；SPEC 补 follow_ups F4~F7（AC 文本未变） | AC8 令牌扫描：DESIGN.mobile.md 29 个令牌名 / **0 未定义**；skill.md 11 / **0**。F4~F7 确认在位（L162~165）；AC1/AC9 文本与 rev3 逐字相同 | 通过 ✅ |
| rev5a | `Design.md` 2.1：层表 L113 Layer 0 引用方改「语义层（光斑例外见下）」，硬规则后新增 L123「唯一例外（凝光光斑）…除此之外组件 / 页面一律不得跨层引用品牌层或全局层」 | AC8 令牌扫描（第 2 节）：61 个令牌名，仅 3 个命中 `--x` / `--brand` / `--brand-2` = 占位符与 CLI 参数，**真实未定义 0**。交叉引用核对：L123 → `DESIGN.mobile.md` **第 7 节**（L99 标题，光斑 L101 在该节内）✓；→ `fluid-design.skill.md` **2.2**（L32 标题，光斑 L47 在该节内）✓；L113 层表与 L123 例外互相呼应 ✓；例外自带排他句「除此之外…一律不得跨层」→ 与 L122 硬规则**不矛盾** ✓ | 通过 ✅ |
| rev5b | `DESIGN.mobile.md` L101：老内核兜底从「退回固定 rgba()」改为「在 `tokens/brand.css` 里加低透明度品牌色令牌（如 `--brand-accent-soft`）+ @supports 切换，不要在组件里写死 rgba()」 | 歧义已消除，品牌 hex 仍只出现在 brand.css，与 2.8「禁止硬编码颜色」不再冲突 | 通过 ✅ |

### 5.3 rev5 回归跑（交付文件未变，判定继续有效）

| 检查 | 结果 |
|---|---|
| `node scripts/brand.mjs check` | **exit 0**，9 pass / 0 fail / 3 warn |
| `node scripts/brand.mjs selftest` | **exit 0** |
| `check --brand '#c2410c'` / `'#0e7a5f'` | **exit 1** / **exit 0**（与 AC5 一致） |
| AC2 `derive '#1a6bff'` vs `@brand-derived` | `cmp` 逐字节相同 |
| AC7 `require('./tokens/tailwind.preset.js')` | 成功，`brand.DEFAULT = var(--brand-accent)` |
| AC10 独立 grep | brand.css 0 + tokens.css 71 + tailwind.preset.js 79 = 150 处，未定义 **0** |

### 5.4 rev5 残留（2 条，非阻塞）

1. **`fluid-design.skill.md:47` 的兜底措辞没跟着 rev5 同步**：仍是「要兼容老 WebView 就在 `@supports not (color: color-mix(...))` 里**退回固定 rgba()**」，而同一版 `DESIGN.mobile.md:101` 已改成「在 brand.css 加低透明度令牌，不要 在组件里写死 rgba()」。Design.md L123 的例外条同时指向这两处，读者会拿到两种互相打架的兜底说法，且 skill.md 那句仍与 2.8「禁止硬编码颜色」字面冲突。建议把 skill.md:47 同步成 mobile 的说法。
2. **`DESIGN.mobile.md:101` 新引入的 `--brand-accent-soft` 在 tokens/ 里并不存在**（全仓只有这一处提及，写法是「再加一个…（如 `--brand-accent-soft`）」，语义上是「待你新增的令牌」）。它不影响 AC8（AC8 只查 Design.md 第 2 节的令牌表），但按「文档里出现的令牌名都应能找到定义」的严格口径，这是本次唯一一个未定义名；建议补一句「（当前不存在，需自行新增）」，否则 AI 生成代码可能直接写 `var(--brand-accent-soft)`，而 G7 只扫 CSS/JS、扫不到 md。

> **rev6 更新**：以上 2 条已全部修掉并复验通过 —— 两处措辞统一为「在 brand.css 里补令牌（当前不存在，需按需新增）」，`--brand-accent-soft` 这个名字已从两份文档删除（全仓只剩本报告的历史记录）；两个文件的令牌名未定义数均为 **0**。
