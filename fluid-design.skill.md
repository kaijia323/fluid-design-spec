# fluid-design.skill.md — 流体设计动态行为规范（双端）

> 这份文件只管"动"的部分：**凝光视效、流体动效、柔性反馈**。
> 移动端和 Web / B 端都读它；静态样式（颜色、字号、间距、圆角）看 `Design.md` 和各端文件。
> 优先级：`DESIGN.mobile.md` / `DESIGN.web.md` > 本文件 > `Design.md`。
> 口径：本文件的具体数值（圆角 / 时长 / 缓动 / 断点）为工程自拟取值，OPPO 未公开发布过；官方口径与出处见 `SOURCES.md`。

---

## 1. 三大动态行为总览

| 元素 | 一句话定义 | 判断标准 | 禁止 |
|---|---|---|---|
| **凝光视效** | 光不是装饰，是界面的指引 | 光的位置能解释"现在该看哪里 / 刚发生了什么" | 与操作无关的闪烁、常驻旋转光 |
| **流体动效** | 转场无缝连贯，不硬切 | 首尾状态连续，没有跳变 | 硬切、弹跳曲线、> 500ms |
| **柔性反馈** | 元素随操作收缩、拉伸、回弹 | 反馈在 100ms 内开始，跟手 1:1 | 迟滞、脱手、无反馈 |

一条总原则：**动效必须承担功能**（指引、连贯、确认），纯装饰的动 = 删掉。

---

## 2. 凝光视效（Light Guidance）

### 2.1 规则

1. 光必须承担指引功能，随手势（指针 / 触摸）自然流动。
2. 面对不同场景可以改变形态（光斑、光晕、高光边），但始终作为视觉指引存在。
3. 同一屏同一时刻只允许**一个**主要光源。
4. 光只在"用户正在操作"或"需要指引"时出现；静置后衰减为静态（※）。
5. 光效只作用于浮层、按钮、卡片边缘，不覆盖正文文字。

### 2.2 实现要点（移动端）

```
.light-follow {
  /* 指针/触摸坐标由 JS 写入 CSS 变量，光斑跟随 */
  background:
    radial-gradient(220px circle at var(--pointer-x, 50%) var(--pointer-y, 0%),
      color-mix(in srgb, var(--brand-accent) 18%, transparent), transparent 70%),
    var(--color-bg-surface);
  transition: background-position var(--duration-300) var(--ease-fluid);
}
```

- 用 `transform: translate3d()` 或背景位置移动，避免触发重排。
- 光斑透明度建议 ≤ 0.2，暗色下可略高（※）。
- 光斑颜色取品牌主色（`--brand-accent`），**不允许写死 hex**。这里的 `color-mix()` 只用于光斑的半透明派生；令牌本身的派生值是静态 hex，不依赖它（见 `tokens/brand.css`）。这是规范里**唯一允许直接读品牌层**的地方（语义层暂无"品牌色低透明度"令牌）；要兼容老 WebView，就在 `tokens/brand.css` 里补一个低透明度的品牌色令牌（**当前不存在，需按需新增**），再用 `@supports not (color: color-mix(in srgb, red, blue))` 切过去——**不要**在组件里写死 `rgba()`。

### 2.3 双端差异

| 维度 | 移动端 | Web / B 端 |
|---|---|---|
| 光斑 | 可用（背景光斑、按钮内光斑） | **禁用** |
| 渐变 | 可用（凝光渐变） | **禁用**，品牌主色用纯色 |
| 替代方案 | — | 用描边、悬停背景、焦点环表达"注意力" |

> B 端不是"没有光"，而是把光换成**对比度与层级**：品牌主色纯色、焦点环、行高亮。

---

## 3. 流体动效（Fluid Motion）

### 3.1 缓动曲线

| 令牌 | 值 | 用途 |
|---|---|---|
| `--ease-fluid` | `cubic-bezier(0.2, 0, 0, 1)` | **所有转场默认曲线** |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 回弹（按下释放、拖拽回位） |
| `--ease-spring-soft` | `cubic-bezier(0.34, 1.4, 0.64, 1)` | 轻微回弹（小元件）（※） |

**所有转场的缓动统一使用 `--ease-fluid`。** 只有明确需要"回弹"时才用 spring 曲线。

### 3.2 标准进入 / 退出

| 动作 | 表现 |
|---|---|
| 元素进入 | `opacity 0 → 1` + `translateY(8px → 0)` |
| 元素退出 | `opacity 1 → 0` + `translateY(0 → -4px)` |
| 视图切换 | 淡入 + 上移 10px（移动端） |
| 抽屉 / 模态 | Web 端水平或缩放进入，150–220ms |

**禁止硬切**：任何状态变化都要有过渡；列表刷新用淡入，不要闪一下。

### 3.3 时长映射（双端核心差异）

| 场景 | 移动端 | Web / B 端 |
|---|---|---|
| 微交互（hover、按下） | 100–150ms | 100–150ms |
| 导航隐藏 / 浮现 | 200ms | 150–200ms |
| 常规进入 / 退出 | 300ms | 150ms |
| 视图 / 页面切换 | 300–400ms | 200–220ms |
| 模态 / 抽屉 | 300–400ms | 200–220ms |
| **硬上限** | 500ms | 500ms |

- 移动端整体区间 **300–400ms**；Web / B 端整体区间 **150–220ms**（比移动端更快）。
- 超过 500ms 的动效一律视为越界。

### 3.4 时序编排（※）

- 同一组元素入场，间隔 30–50ms 阶梯推进；超过 5 个元素不要继续加延迟。
- 退出比进入快一档（约 0.8 倍），避免拖尾。
- 用户连续操作时，新动效立即接管旧动效（`transition` 天然覆盖），不要排队。

---

## 4. 柔性反馈（Soft Feedback）

### 4.1 规则

| 操作 | 反馈 |
|---|---|
| 按钮按下 | 移动端 `scale(0.96)` / Web `scale(0.98)`，释放弹性回位 |
| 拖拽控件 | 随指尖拉伸，最大 **120%**，释放回弹 |
| 滑动操作 | **跟手度 1.0**，释放后惯性滚动 |
| 开关 / 图标切换 | 弹性缩放，不做位移动画 |
| 列表项点击 | 背景平滑加深，不做整行位移抖动 |

- 反馈必须在 **100ms 内开始**，否则用户会感觉"没反应"。
- 跟手度 1.0：手指移动 1px，元素移动 1px，不允许阻尼滞后。
- 释放后必须回到合法状态（要么执行，要么回弹原位），不允许卡在中间。

### 4.2 双端差异

| 维度 | 移动端 | Web / B 端 |
|---|---|---|
| 按钮按下缩放 | `scale(0.96)` | `scale(0.98)` |
| 触觉反馈 | 可用（轻/中/重） | 不适用 |
| hover | 次要 | **必须**有（键鼠主交互） |
| 拖拽回弹 | 120% + spring | 一般不超 1.05 倍缩放（※） |
| 焦点反馈 | 触摸为主 | 焦点环品牌主色 2px、偏移 2px |

---

## 5. 双端速查

| 决策点 | 移动端 | Web / B 端 |
|---|---|---|
| 主缓动 | `--ease-fluid` | `--ease-fluid` |
| 回弹 | 大量使用（spring） | 少量使用（按下、展开） |
| 时长区间 | 300–400ms | 150–220ms |
| 光效 | 凝光光斑可用 | 禁用 |
| 渐变 | 可用 | 禁用 |
| 反馈起点 | 触摸 | hover / focus-visible |
| 降级 | `prefers-reduced-motion` | 同左 |

---

## 6. prefers-reduced-motion 降级（强制）

**所有触控反馈与动效都必须提供降级方案**，这是硬性要求，不是可选项。

降级规则：

1. 去掉位移（`translate`）与缩放（`scale`），保留 ≤ 150ms 的透明度变化。
2. 光斑停止跟随，改为静态高光。
3. 惯性滚动、回弹、阶梯入场全部取消，直接切换状态。
4. 骨架屏的呼吸动画改为静态灰块（※）。

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: var(--duration-100) !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7. 性能约束（※）

- 只动 `transform` 和 `opacity`，不动 `width / height / top / left / margin`。
- 需要长列表动画时用 `will-change: transform`，动画结束立刻移除。
- 目标 60fps：单帧脚本时间 < 8ms；跟手交互不要走 React state 重渲染，直接改 CSS 变量或 ref 样式。
- 磨砂层（`backdrop-filter`）同屏不超过 2 处，避免移动端掉帧。
- 光斑跟随用 `requestAnimationFrame` 节流，不要在 `scroll` 里同步计算。

---

## 8. 反模式

- ❌ 无意义的装饰性动画、与用户操作无关的光效。
- ❌ 弹跳曲线（回弹系数过冲 > 1.6）、> 500ms 的动效。
- ❌ 硬切：状态突变、列表闪烁、图片跳变。
- ❌ 跟手阻尼（手指移动 100px，元素只动 60px）。
- ❌ B 端出现光斑、渐变、常驻动画。
- ❌ 只给 hover 不给 `prefers-reduced-motion` 降级。
- ❌ 同一屏多个光源互相抢注意力。

---

## 9. 自查清单

- [ ] 每个动效是否都有明确功能（指引 / 连贯 / 确认）？
- [ ] 缓动是否统一走 `--ease-fluid`，回弹才用 spring？
- [ ] 时长是否在区间内（移动 300–400ms，Web 150–220ms），且都 ≤ 500ms？
- [ ] 进入是 `opacity + translateY(8px→0)`，退出是 `translateY(0→-4px)`？
- [ ] 按下反馈是 `scale(0.96)` / `scale(0.98)`，且 100ms 内开始？
- [ ] 拖拽最大 120%、跟手度 1.0、释放有回弹或落地？
- [ ] 是否有 `prefers-reduced-motion` 降级？
- [ ] 光斑 / 高光用的颜色是否来自 `--brand-accent`，没有写死品牌 hex？
- [ ] B 端是否已经去掉渐变与光斑？
- [ ] 是否只动 `transform` / `opacity`，没有触发重排？

---

## 10. 可复用片段

```
/* 进入 / 退出 */
@keyframes fluid-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fluid-exit {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-4px); }
}

.enter { animation: fluid-enter var(--motion-enter) var(--ease-fluid) both; }
.exit  { animation: fluid-exit  var(--motion-exit)  var(--ease-fluid) both; }

/* 视图切换（移动端：淡入 + 上移 10px） */
@keyframes view-switch {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.view-enter { animation: view-switch var(--duration-300) var(--ease-fluid) both; }

/* 卡片入场阶梯 */
.stagger > * { animation: fluid-enter var(--duration-300) var(--ease-fluid) both; }
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 40ms; }
.stagger > *:nth-child(3) { animation-delay: 80ms; }
.stagger > *:nth-child(4) { animation-delay: 120ms; }
.stagger > *:nth-child(5) { animation-delay: 160ms; }
```
