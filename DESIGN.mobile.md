# DESIGN.mobile.md — 移动端专属约束

> 适用范围：手机端 App / H5（375px 起设计，暗色优先）。
> 前置必读：`Design.md`（共享令牌）+ `fluid-design.skill.md`（动态行为）。
> 冲突裁决：本文件 > `fluid-design.skill.md` > `Design.md`。共享内容不在这里重复。

---

## 1. 移动端基调

- 大圆角、浮岛导航、磨砂浮层，整体轻盈通透。
- 一切操作都要"跟手"：拖拽 1:1 跟手，松手有惯性，按下有回弹。
- 暗色优先，光斑与渐变可用，但**光必须指路**，不能只是好看。
- 交互态移动端更关注 `:active` 与触摸反馈，而不是 hover。

## 2. 规格总表（可直接抄）

| 维度 | 规格 |
|---|---|
| 圆角 | 卡片 16px、按钮 12px、小组件 20px、浮岛导航 24px |
| 动效时长 | 300–400ms（导航隐藏/浮现 200ms） |
| 硬上限 | 单次动效 ≤ 500ms，禁止弹跳曲线 |
| 缓动 | 统一 `--ease-fluid`；回弹用 `--ease-spring` |
| 布局 | 移动优先，先设计 375px，向上适配 |
| 断点 | 640px / 1024px / 1440px |
| 按钮高度 | 44–48px |
| 输入框字号 | ≥ 16px（避免 iOS 自动缩放） |
| 安全区域 | `env(safe-area-inset-bottom)` |
| 触控热区 | ≥ 44 × 44px |
| 页面边距 | 左右 16px，区块间距 24px |

## 3. 圆角与形状

| 组件 | 令牌 | 值 |
|---|---|---|
| 卡片 / 列表容器 | `--radius-lg` | 16px |
| 按钮 | `--radius-md` | 12px |
| 输入框 | `--radius-md` | 12px |
| 小组件 / 快捷操作 | `--radius-xl` | 20px |
| 浮岛导航 / 底部浮层 | `--radius-2xl` | 24px |
| 标签 / 头像 / 胶囊搜索 | `--radius-full` | 9999px |

**加粗提醒：卡片圆角是 16px，不是 12px，也不是 24px。** 只有浮岛和底部浮层才用 24px；超过 28px 的圆角一律视为越界。

## 4. 动效时长与时序

| 场景 | 时长 | 说明 |
|---|---|---|
| 常规元素进入 | 300ms | `opacity 0→1` + `translateY(8px→0)` |
| 常规元素退出 | 300ms | `opacity 1→0` + `translateY(0→-4px)` |
| 视图/页面切换 | 300–400ms | 淡入 + 上移 10px |
| 浮岛导航隐藏/浮现 | 200ms | `translateY + opacity` |
| 按钮按压反馈 | 100–150ms | `scale(0.96)`，松手弹性回位 |
| 列表与卡片入场 | 300–400ms | 需要编排时可做 40ms 阶梯（※） |

- 所有转场必须无缝连贯，**禁止硬切**。
- 缓动统一 `--ease-fluid`，回弹 `--ease-spring`。
- 禁止弹跳曲线（`cubic-bezier` 中 y 超过 1.6 的过冲）。

## 5. 浮岛式导航（重点规范）

**形态**

- 始终**居中悬浮**在底部，距屏幕底部 16–20px。
- 圆角 24px，磨砂背景 + 1px 半透明描边 + 极轻投影。
- 必须叠加安全区域：`bottom: calc(16px + env(safe-area-inset-bottom))`（※）。
- 页签 3–5 个，图标 + 文字，当前项用主色。

**行为**

| 行为 | 规则 |
|---|---|
| 向下滚动 | 导航自动隐藏（`translateY(100%) + opacity 0`） |
| 向上滚动 | 导航自动浮现 |
| 隐藏/浮现时长 | 200ms |
| 当前页指示器 | 使用凝光小点（跟随主色的小光点），不是粗下划线 |
| 切换页签 | 指示点平滑位移，不做整条导航重绘 |

**禁止**

- ❌ 固定在底部但不居中、贴边的"通栏 tab"（那是旧模式）。
- ❌ 导航上叠加渐变光带。
- ❌ 隐藏过程中仍可点击（隐藏期间必须 `pointer-events: none` 或移出可点区域）。

## 6. 触控与柔性反馈

| 操作 | 反馈 |
|---|---|
| 按钮按下 | `scale(0.96)`，释放弹性回位 |
| 拖拽控件 | 随指尖拉伸，最大 120%，释放回弹 |
| 滑动 / 滚动 | 跟手度 1.0，释放后惯性滚动 |
| 列表项点击 | 背景色平滑加深（150ms 内），不做位移抖动 |
| 密码可见切换 | 弹性缩放反馈（图标 scale 0.9 → 1） |

- 所有触控反馈必须提供 `prefers-reduced-motion` 替代方案（去掉位移与缩放，只保留透明度或直接瞬变）。
- 禁止长按 300ms 以上的"假加载"动画；加载超过 400ms 必须显示骨架屏或进度指示。

## 7. 凝光视效（移动端用法）

- 光斑随指针 / 触摸位置流动：`radial-gradient` 跟随指针坐标，用 CSS 变量传坐标（※）。
- 登录页：背景光斑 + Liquid Acrylic 卡片（半透明磨砂 + 极轻投影）。
- 主按钮：光斑跟随指针在按钮内移动，按压时光斑收拢。
- 光只在"用户正在操作"或"需要指引"的时候出现；静置 2s 后应衰减到静态（※）。
- 禁止：与操作无关的自动闪烁、常驻旋转光环、多个光斑互相抢注意力。

## 8. 布局与栅格

- 单列为主，卡片全宽减去左右 16px 边距。
- 快捷操作网格：4 列，图标 + 文字，各格配色微差（保持同一色系）。
- 列表项高度 ≥ 56px，左侧图标 24px，右箭头在有跳转时出现。
- 底部内容必须为浮岛导航留出 88–100px 的滚动空间（※）。
- 首屏不要放超过 2 个"卡片组"，避免小屏拥挤。

## 9. 表单与输入

- 输入框字号 ≥ 16px；高度 44–48px；圆角 12px。
- 四态齐全：默认 / 悬停 / 聚焦（主色 2px 描边 + 标签上浮）/ 错误或禁用。
- 键盘类型与输入内容匹配（`inputmode`、`type`），错误提示紧贴字段下方。
- 提交按钮在键盘弹出时不得被遮挡：使用 `position: sticky` 或滚动补偿（※）。

## 10. 无障碍与降级

- 触控热区 ≥ 44 × 44px，图标点击区域不足时用 padding 补足。
- 颜色不是唯一信息载体；状态徽章必须带文字。
- 支持系统字体放大到 200% 时布局不破（※）。
- 支持 `prefers-reduced-motion`：去掉位移、缩放、光斑流动，仅保留 ≤ 150ms 的透明度变化。

## 11. 移动端自查清单

- [ ] 卡片圆角是 16px、按钮 12px、浮岛 24px？
- [ ] 动效时长在 300–400ms 内，导航隐藏/浮现是 200ms？
- [ ] 缓动是 `--ease-fluid`，回弹用 `--ease-spring`？
- [ ] 按下有 `scale(0.96)`，拖拽最大 120%，跟手度 1.0？
- [ ] 浮岛导航居中、距底 16–20px、带 `env(safe-area-inset-bottom)`？
- [ ] 输入框字号 ≥ 16px，四态齐全？
- [ ] 是否误用了 Web 端的侧边栏 / 小圆角 / 150ms 快动效？

## 12. 可复用片段

```
/* 移动端组件令牌（覆盖 Web 默认值） */
:root[data-platform="mobile"] {
  --button-radius: var(--radius-md);   /* 12px */
  --button-height: 48px;
  --card-radius: var(--radius-lg);     /* 16px */
  --widget-radius: var(--radius-xl);   /* 20px */
  --island-radius: var(--radius-2xl);  /* 24px */
  --page-gutter: var(--space-4);       /* 16px */
  --motion-enter: var(--duration-300);
  --motion-exit: var(--duration-300);
  --press-scale: var(--press-scale-mobile);  /* 0.96 */
}

/* 浮岛导航 */
.float-island {
  position: fixed;
  left: 50%;
  bottom: calc(16px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  border-radius: var(--island-radius);
  background: var(--color-bg-elevated);
  backdrop-filter: blur(var(--blur-acrylic));
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-1);
  transition: transform var(--duration-200) var(--ease-fluid),
              opacity var(--duration-200) var(--ease-fluid);
}
.float-island[data-hidden="true"] {
  transform: translate(-50%, 120%);
  opacity: 0;
  pointer-events: none;
}

/* 按下反馈 */
.pressable { transition: transform var(--duration-150) var(--ease-spring); }
.pressable:active { transform: scale(var(--press-scale)); }

@media (prefers-reduced-motion: reduce) {
  .float-island, .pressable { transition-duration: var(--duration-100); }
  .pressable:active { transform: none; }
}
```
