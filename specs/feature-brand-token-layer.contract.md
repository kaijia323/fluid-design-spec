# 冻结契约 · feature-brand-token-layer

> 本文件是 `specs/feature-brand-token-layer.yaml` 的正文附录，**令牌名、默认值、算法、门禁阈值、CLI 契约均已冻结**。
> 三名执行者（tokens-dev / script-dev / docs-core）都按本文件写；任何人不得自行改数值或放宽阈值。需要改先找 lead。

---

## 1. Layer 0 品牌层：12 个令牌与默认值

默认品牌色 = **日出蓝 `#1a6bff`**（v1.1 原主色，保持不变）；`tokens/brand.css` 必须逐字写入下表（小写 hex，两空格缩进）。

| 令牌 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `--brand-accent` | **输入（唯一必改项）** | `#1a6bff` | 项目品牌主色 |
| `--brand-accent-2` | **输入** | `#ff8c42` | 第二强调色（日落橘，沿用 v1.1） |
| `--brand-accent-hover` | 派生 | `#2c7cff` | 明色悬停 |
| `--brand-accent-active` | 派生 | `#0053e6` | 明色按下 |
| `--brand-accent-bright` | 派生 | `#4fa0ff` | 暗色模式用的提亮版（对暗底 ≥4.5:1） |
| `--brand-accent-bright-hover` | 派生 | `#5fb1ff` | 暗色悬停 |
| `--brand-accent-bright-active` | 派生 | `#3989ff` | 暗色按下 |
| `--brand-on-accent` | 派生 | `#ffffff` | 品牌主色**实心按钮上的文字色**（明色） |
| `--brand-on-accent-bright` | 派生 | `#1a1d24` | 提亮主色上的文字色（暗色） |
| `--brand-accent-2-hover` | 派生 | `#ff9c53` | 第二色悬停 |
| `--brand-accent-2-active` | 派生 | `#e67627` | 第二色按下 |
| `--brand-on-accent-2` | 派生 | `#1a1d24` | 第二色实心块上的文字色 |

**与 v1.1 手写值的差异（已知并接受，见 SPEC open_questions）**
`--brand-accent-hover` `#3d82ff → #2c7cff`；`--brand-accent-active` `#1557d6 → #0053e6`；`--brand-accent-bright` `#5b93ff → #4fa0ff`。
原因：v2.0 的默认值必须等于 `derive('#1a6bff')` 的输出，否则默认预设自身过不了门禁。

## 2. 示例预设（`tokens/brand.presets.css`，3 个）

选择依据：色相离状态色（success `#34c759` / warning `#ff9500` / error `#ff3b30`）**以及分类标识色 `--color-purple` `#8b5cf6`** 都 ≥15°。
（原先的靛紫预设 `#5b4be0` 离 `--color-purple` 只有 12°，会被 W3 提示，故换成品红 `#a21caf`。）

**选择器必须用 `:root[data-brand="xxx"]`，不能用裸 `[data-brand="xxx"]`**：两者特异性同为 (0,1,0) 与品牌默认值的 `:root` 打平，顺序错就会被默认值盖回去（真实浏览器已复现：按 `brand.css → presets.css → tokens.css` 引入时三个预设全部失效）。`:root[data-brand]` 是 (0,2,0)，稳压 `:root`，顺序错也不会失效。引入顺序仍建议：`tokens.css`（或 `brand.css`）→ `brand.presets.css`。

| 选择器 | `--brand-accent` | hue | hover | active | bright | bright-hover | bright-active | on-accent | on-accent-bright |
|---|---|---|---|---|---|---|---|---|---|
| `:root[data-brand="ink-green"]` | `#0e7a5f` | ≈170° | `#27896d` | `#00654c` | `#4fab8e` | `#5fbb9d` | `#379579` | `#ffffff` | `#1a1d24` |
| `:root[data-brand="magenta"]` | `#a21caf` | ≈324° | `#b332bf` | `#8b0098` | `#d859e4` | `#e96af5` | `#c041cd` | `#ffffff` | `#1a1d24` |
| `:root[data-brand="teal"]` | `#0e7490` | ≈223° | `#27839f` | `#00607b` | `#4ea5c2` | `#5fb5d3` | `#368fac` | `#ffffff` | `#1a1d24` |

预设只覆盖品牌主色相关的 8 个令牌，第二色沿用默认。用法 `<html data-brand="ink-green">`，且 presets.css 必须在 brand.css **之后**引入。

## 3. `tokens/tokens.css` 改造点

1. **Layer 1 全局层**：删掉 6 个品牌 hex（`--color-primary*`）；日落橘 `--color-accent` 改名为 `--color-accent-2`，**归入 Layer 2 语义层**（放在「语义层 · 不随主题变」的独立 `:root` 块），写成 `--color-accent-2: var(--brand-accent-2);`，同块里加 `--color-on-accent-2: var(--brand-on-accent-2);`。这样组件引用的仍是语义层令牌，不破坏「组件只引用语义层」；全局层（Layer 1）只剩中性色阶、状态色、`--color-purple` 与字体/间距/圆角/动效。
2. **Layer 2 语义层（明色）**：
   `--color-action-default: var(--brand-accent)`、`-hover: var(--brand-accent-hover)`、`-active: var(--brand-accent-active)`、`--color-focus-ring: var(--brand-accent)`、`--color-status-info: var(--brand-accent)`；
   新增 `--color-on-accent: var(--brand-on-accent)`。（`--color-accent-2` 与 `--color-on-accent-2` 不在这里，它们放在上面第 1 条说的「语义层 · 不随主题变」块里。）
3. **Layer 2 语义层（暗色，两个块都要改：@media dark 与 [data-theme="dark"]）**：
   `--color-action-default: var(--brand-accent-bright)`、`-hover: var(--brand-accent-bright-hover)`、`-active: var(--brand-accent-bright-active)`、`--color-focus-ring: var(--brand-accent-bright)`、**`--color-status-info: var(--brand-accent-bright)`**（与明色一致：info 跟随品牌色，暗色下必须一起提亮，否则会出现「焦点环亮、info 暗」）；`--color-on-accent: var(--brand-on-accent-bright)`。
4. **v1 兼容别名块**（放在文件末尾，单独一节并标 deprecated）：
   `--color-primary` → `var(--brand-accent)`；`--color-primary-hover` → `var(--brand-accent-hover)`；`--color-primary-active` → `var(--brand-accent-active)`；`--color-primary-bright` → `var(--brand-accent-bright)`；`--color-primary-bright-hover` → `var(--brand-accent-bright-hover)`；`--color-primary-bright-active` → `var(--brand-accent-bright-active)`；`--color-accent` → `var(--color-accent-2)`。
5. **文件顶部加** `@import "./brand.css";`（必须是第一行非注释语句），并在注释里说明「先引 brand.css 也可以，两者等价」。
   ⚠️ 连带影响：`@import` 会在 tokens.css 的位置就地展开品牌默认值。若页面按 `<link>` 顺序 `brand.css → brand.presets.css → tokens.css` 引入，展开后的默认值排在预设之后、同特异性后者胜，**预设会全部失效**。所以文档改品牌预设的示例顺序必须写成 `tokens.css → brand.presets.css`（预设选择器同时提到 `:root[data-brand]` 双保险）。
6. `--color-text-inverse` 保持原样；但文档里必须写明：**按钮/主色块上的文字用 `--color-on-accent`，不要用 `--color-text-inverse`，也不要写 `#fff`**。

## 4. `tokens/tailwind.preset.js` 改造点

`theme.extend.colors` 里：
```js
brand: { DEFAULT: 'var(--brand-accent)', hover: 'var(--brand-accent-hover)', active: 'var(--brand-accent-active)', bright: 'var(--brand-accent-bright)' },
accent: 'var(--color-accent-2)',        // v1 的 accent 键保留，指向新的第二强调色
'on-accent': 'var(--color-on-accent)',
```
顶层必须仍能 `require()`，且不引入任何依赖。

## 5. 派生算法（冻结伪码）

```
输入：brand hex
1. hex → OKLab(L, a, b) → OKLCH(L, C, H)           // 不动 C、H，只动 L
2. at(l) = OKLCH(l, C, H) → 钳制到 sRGB 后取最近整数 → 小写 hex
3. --brand-accent-hover         = at(L + 0.05)
4. --brand-accent-active        = at(L - 0.07)
5. lNeeded = 从 L 起以 0.005 步长递增，直到 contrast(at(l), #0b0d12) >= 4.5（上限 1.0）
   lBright = min(1, max(L + 0.16, lNeeded))
   --brand-accent-bright        = at(lBright)
6. --brand-accent-bright-hover  = at(lBright + 0.05)
7. --brand-accent-bright-active = at(lBright - 0.07)
8. --brand-on-accent        = argmax_contrast(#ffffff, #1a1d24) against accent；两者都 <4.5 → G1 fail
9. --brand-on-accent-bright = 同上，against bright
10. 第二色：同 3/4/8，不做 bright
```
常量：暗底 `#0b0d12`；文字候选 `#ffffff` / `#1a1d24`；对比度用 WCAG 相对亮度；OKLab 用 CSS Color 4 标准矩阵。**不得用 HSL/HSV 调明度。**

## 6. 门禁表（check 逐条输出）

| 编号 | 内容 | 阈值 | 拦不拦 |
|---|---|---|---|
| G1 | `--brand-on-accent` 对 `--brand-accent` 的对比度 | ≥ 4.5:1 | 拦 |
| G2 | `--brand-on-accent-bright` 对 `--brand-accent-bright` | ≥ 4.5:1 | 拦 |
| G3 | `--brand-accent-bright` 对暗色 `--color-bg-base` | ≥ 4.5:1 | 拦 |
| G4 | 交互态可辨：hover/active/bright-hover/bright-active 与各自基准的 OKLab ΔL | ≥ 0.03 | 拦 |
| G5 | **品牌主色**与 success/warning/error 的 OKLCH 色相环距离 | ≥ 15° | 拦 |
| G6 | 明暗两套下 `--color-text-primary`、`--color-text-secondary` 对 `--color-bg-base` | ≥ 4.5:1 | 拦 |
| G7 | 令牌引用完整性：brand.css / tokens.css / tailwind.preset.js 中所有 `var(--x)` 均有定义 | 未定义数 = 0 | 拦 |
| G8 | 派生值与算法一致：brand.css 派生段 == `derive(读取到的输入)` 输出 | diff = 0 | 拦 |
| G9 | 预设体检：`brand.presets.css` 每个 `:root[data-brand]` 块 —— ① 7 个派生值 == `derive(该块输入)`；② 该预设的 G1/G2 对比度达标 | 全部一致且 pass | 拦 |
| W1 | `--color-text-tertiary` 对底色（仅提示/占位用） | <4.5 时提示 | 不拦 |
| W2 | G1 实测值 <5.0:1（过线但偏紧） | 提示 | 不拦 |
| W3 | 品牌主色与分类标识色 `--color-purple` 的色相环距离（`--color-purple` 从 tokens.css 解析，不写死） | <15° 时提示 | 不拦 |
| W4 | 第二强调色与 success/warning/error 的色相环距离 | <15° 时提示 | 不拦 |

**G5 只查品牌主色**，不查第二强调色：第二色不承载状态语义，只做小面积强调。默认第二色 `#ff8c42` 与 warning `#ff9500` 只差 12.2°，这条会作为 W 提示打印出来（不算失败）。

## 7. CLI 契约（`scripts/brand.mjs`）

```
node scripts/brand.mjs check                               # 读 tokens/brand.css + tokens/tokens.css + tokens/brand.presets.css，跑 G1~G9
node scripts/brand.mjs check --brand '#0e7a5f' [--brand-2 '#hex']   # 不读文件，直接体检一个候选品牌色，跑 G1~G6
node scripts/brand.mjs derive '#0e7a5f' [--brand-2 '#hex'] # 打印 10 行派生段（两空格缩进、小写 hex、行尾分号）
node scripts/brand.mjs selftest                            # 3 个负例自检，全部按预期被拦才 exit 0
```

- 退出码：无 fail → `0`；有 fail 或解析失败 → `1`。
- 输出格式：每条门禁一行 `G1 <名称>  实测  阈值  pass|fail`；末尾一行 `结果：N pass / M fail / K warn`。
- 解析失败必须打印出错行号并 exit 1，**不许静默跳过**。
- 只用 Node 内置模块（`node:fs`、`node:process`、`node:path`），Node ≥18 可跑。

## 8. CSS 解析契约

- 支持 `选择器 { ... }` 与 `@media (prefers-color-scheme: dark) { ... }` 嵌套一层。
- 三张表：`base`（普通 `:root`）、`light`（`:root, :root[data-theme="light"]`）、`dark`（`@media dark` 内的 `:root:not([data-theme="light"])` 与 `:root[data-theme="dark"]`）。
- 明色有效值 = base + light；暗色有效值 = base + dark。
- `var(--x)` 链式解析，最多 8 层，检测到循环直接报错。
- 声明格式：`--name: value;`，值里允许 `var()` / hex / rgba()。

## 9. `tokens/brand.css` 文件格式契约（脚本要能稳定解析）

```css
:root {
  /* @brand-inputs:start */
  --brand-accent: #1a6bff;
  --brand-accent-2: #ff8c42;
  /* @brand-inputs:end */

  /* @brand-derived:start */
  --brand-accent-hover: #2c7cff;
  ... 共 10 行 ...
  /* @brand-derived:end */
}
```
- 一个声明一行，两个空格缩进，行尾分号，hex 全小写。
- 分节标记是给人看的，解析器忽略。
- `derive` 的输出 = 派生段那 10 行，逐字可粘贴。

## 10. 命名与迁移映射（文档与脚本共用）

| v1.1 | v2.0 | 处理 |
|---|---|---|
| `--color-primary` | `--brand-accent` | 旧名保留为别名，标 deprecated |
| `--color-primary-hover/-active/-bright/-bright-hover/-bright-active` | `--brand-accent-hover/-active/-bright/-bright-hover/-bright-active` | 同上 |
| `--color-accent`（日落橘） | `--color-accent-2` | 旧名保留为别名，颜色不变 |
| `--color-text-primary` | 不变 | 与品牌层彻底分家，不再撞名 |
| — | `--color-on-accent` / `--color-on-accent-2` | 新增语义令牌 |

## 11. 统一口径（所有文档必须用同样的说法）

1. 「**品牌色是项目输入，不是规范的一部分**；规范只提供默认值（默认日出蓝 `#1A6BFF`），换项目只改 `tokens/brand.css`。」
2. 「颜色 hex 是本规范自拟的，OPPO 从未公开过这些数值。」（与 SOURCES.md 第四、五节一致）
3. 「主色实心按钮上的文字，用 `--color-on-accent`，不要写 `#fff`。」
4. 「状态色不随品牌变；品牌色与状态色色相距离必须 ≥15°（由 `node scripts/brand.mjs check` 判定）。」
5. 「换品牌五步：填 2 个输入 → 跑 `derive` 覆盖派生段 → 跑 `check` 过门禁 → 明暗两套各看一眼 → 提交。」
