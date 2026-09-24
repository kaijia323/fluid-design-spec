# DESIGN.web.md — Web / B 端专属约束

> 适用范围：Web 应用、B 端后台、管理控制台。
> 前置必读：`Design.md`（共享令牌）+ `fluid-design.skill.md`（动态行为）。
> 冲突裁决：本文件 > `fluid-design.skill.md` > `Design.md`。共享内容不在这里重复。

---

## 1. B 端收敛原则（先记这条）

移动端那套"凝光"到了 Web / B 端要**收敛**：

- 去掉渐变、光斑、装饰性动画。
- 主色用纯色；状态徽章用纯色底 + 小圆点。
- 保留：流畅动效、清晰层级、键盘可达性。
- 流体设计的"响应感"保留，但不能干扰信息读取。
- 按钮按下仍有 `scale(0.98)`；表格行悬停有平滑背景过渡。

一句话：**响应感留着，装饰感去掉。**

## 2. 规格总表（可直接抄）

| 维度 | 规格 |
|---|---|
| 圆角 | 标签 6px、按钮 8px、卡片 12px（收敛为 6–12px） |
| 动效时长 | 150–220ms（比移动端更快） |
| 硬上限 | 单次动效 ≤ 500ms，禁止弹跳曲线 |
| 缓动 | 统一 `--ease-fluid` |
| 导航 | 侧边栏，窄屏（< 860px）收起为抽屉 |
| 交互态 | hover / focus-visible / active / disabled 四态必须齐全 |
| 焦点环 | 主色 2px，偏移 2px |
| 快捷键 | ⌘K / Ctrl+K 聚焦搜索 |
| 表格行 | 可 Tab 聚焦，`focus-within` 显示左侧主色条 |
| 行操作 | hover / focus-within 时显示 |
| 信息密度 | 优先 |

## 3. 圆角

| 组件 | 令牌 | 值 |
|---|---|---|
| 标签 / 徽章 | `--radius-xs` | 6px |
| 按钮 / 输入框 | `--radius-sm` | 8px |
| 卡片 / 面板 / 模态 | `--radius-md` | 12px |
| 头像 / 胶囊 | `--radius-full` | 9999px |

**加粗提醒：B 端卡片是 12px，不要用移动端的 16–24px 大圆角。**

## 4. 动效

| 场景 | 时长 |
|---|---|
| hover / 背景过渡 | 150ms |
| 展开、折叠、下拉 | 150–200ms |
| 抽屉、模态进出 | 200–220ms |
| 按下反馈 | 100ms 内触发 `scale(0.98)` |

- 所有时长 ≤ 220ms，绝不出现 > 500ms 的动效。
- 只动 `transform` 与 `opacity`，不动 `width/height/top/left`（避免重排）。
- 表格行、列表项的悬停只做背景色与描边变化，不做位移。
- 骨架屏用 1.4s 循环的透明度呼吸（※），不要用旋转大图标。

## 5. 布局骨架

```
┌──────────┬────────────────────────────────────┬──────────────┐
│ 侧边栏    │ 顶栏（标题 + 搜索 + 用户）           │              │
│ 240px    ├────────────────────────────────────┤ 右栏（可选）  │
│ 可折叠 64 │ 内容区：统计卡片 4 列 / 表格 / 表单   │ 活动时间线    │
└──────────┴────────────────────────────────────┴──────────────┘
```

| 区块 | 规格 |
|---|---|
| 侧边栏 | 展开 240px，折叠 64px（仅图标）（※） |
| 顶栏 | 高度 56–64px，sticky 置顶，底部 1px 描边（※） |
| 内容区 | 最大宽度 1440px，左右边距 24px |
| 统计卡片 | 一行 4 列，窄屏降为 2 列 / 1 列 |
| 卡片间距 | 16–24px |
| 表格行高 | 常规 48px，紧凑 40px（※） |

## 6. 交互四态与键盘可达

每个可交互元素必须有：

| 状态 | 表现 |
|---|---|
| hover | 背景/描边平滑变化（150ms），可点元素 `cursor: pointer` |
| focus-visible | 焦点环：主色 2px，`outline-offset: 2px`，**禁止去掉 outline 而不给替代** |
| active | 按钮 `scale(0.98)`；行/项背景再加深一档 |
| disabled | 降透明度 + `cursor: not-allowed`，不可聚焦，无动效 |

键盘规范：

- Tab 顺序 = 视觉顺序；不得用正数 `tabindex` 打乱。
- 表格行可 Tab 聚焦；聚焦时左侧显示 2px 主色条（`box-shadow: inset 2px 0 0 var(--color-action-default)`）。
- 行内操作按钮在 hover / `focus-within` 时显示，键盘聚焦时也必须可见（不能只靠 hover 才出现，否则键盘用户无法触达）。
- 弹层：Esc 关闭，打开时焦点移入，关闭后焦点归还触发元素（※）。
- 焦点环在任何背景上都可见（暗色下用提亮主色）。

## 7. 快捷键

| 快捷键 | 行为 |
|---|---|
| ⌘K / Ctrl+K | 聚焦全局搜索（任何页面可用） |
| Esc | 关闭弹层 / 清空搜索 |
| ⌘/ / Ctrl+/ | 展示快捷键帮助（可选）（※） |

- 快捷键提示要写在搜索框 placeholder 里（如 "搜索 ⌘K"）。
- 不要用浏览器保留快捷键（⌘W、⌘T 等）。

## 8. 数据表格（B 端核心）

- 结构：表头（可排序）+ 行 + 状态徽章 + 行操作 + 分页。
- 排序：点击表头切换升/降序，当前排序列显示方向箭头与主色文字。
- 状态徽章：纯色底 + 小圆点 + 文字，不用渐变、不用大面积色块。
- 行操作：默认隐藏，hover / focus-within 显示；不超过 3 个直接操作，其余收进"更多"。
- 分页：显示总数与页码范围；切换后保持滚动位置或回到表格顶部（※）。
- 空态：必须有插画/说明 + 一个主操作按钮。
- 数字列右对齐并使用 `tabular-nums`；长文本列可截断 + tooltip。
- 加载态：骨架行，不改变行高。

## 9. 响应式

- 断点：640px / 1024px / 1440px。
- < 860px：侧边栏收起为抽屉，用按钮或手势唤出。
- 1024px 以下：统计卡片 4 列 → 2 列；右栏时间线移到主列下方。
- 640px 以下：表格允许横向滚动，或隐藏次要列（保留首列与操作列）。
- 大屏（≥ 1440px）：内容区最大 1440px 居中，不做无限拉伸。

## 10. 表单与反馈

- 标签在输入框上方（左对齐），不用 placeholder 当标签。
- 校验：失焦即校验，错误文案紧贴字段下方并用 `--color-error`。
- 危险操作二次确认，主按钮文案写清动作（如"删除 3 个应用"）。
- 反馈用轻量 toast，自动消失 3s（※）；不要用阻塞式弹窗做成功提示。
- 提交按钮要有 loading 态，宽度不变。

## 11. 无障碍

- 正文对比度 ≥ 4.5:1；暗色模式同样达标。
- 所有图标按钮必须有 `aria-label` 或可见文字。
- 表单元素与 label 用 `for/id` 关联；错误用 `aria-describedby` 关联。
- 支持仅键盘完成主流程（登录、搜索、编辑、提交）。

## 12. Web 端自查清单

- [ ] 圆角是否收敛到 6–12px（没有误用 16–24px）？
- [ ] 动效是否在 150–220ms 内？
- [ ] hover / focus-visible / active / disabled 四态是否齐全？
- [ ] 焦点环是否是主色 2px、偏移 2px，且没有被 `outline: none` 干掉？
- [ ] ⌘K / Ctrl+K 是否可用？
- [ ] 表格行能否 Tab 聚焦？行操作在键盘聚焦时是否可见？
- [ ] 是否出现了渐变、光斑、装饰性动画？
- [ ] 信息密度是否优先（没有被大留白和大气泡拖垮）？

## 13. 可复用片段

```
/* Web / B 端组件令牌（默认值） */
:root {
  --button-radius: var(--radius-sm);   /* 8px */
  --button-height: 36px;
  --card-radius: var(--radius-md);     /* 12px */
  --tag-radius: var(--radius-xs);      /* 6px */
  --page-gutter: var(--space-6);       /* 24px */
  --motion-enter: var(--duration-150);
  --motion-exit: var(--duration-150);
  --press-scale: var(--press-scale-web);     /* 0.98 */
  --sidebar-width: 240px;
  --content-max: 1440px;
}

/* 四态按钮 */
.btn {
  border-radius: var(--button-radius);
  height: var(--button-height);
  transition: background-color var(--duration-150) var(--ease-fluid),
              transform var(--duration-150) var(--ease-fluid);
}
.btn:hover { background: var(--color-action-hover); }
.btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
.btn:active { transform: scale(var(--press-scale)); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* 表格行 */
.table-row { transition: background-color var(--duration-150) var(--ease-fluid); }
.table-row:hover { background: var(--color-bg-sunken); }
.table-row:focus-within {
  box-shadow: inset 2px 0 0 var(--color-action-default);
}
.table-row .row-actions { opacity: 0; transition: opacity var(--duration-150) var(--ease-fluid); }
.table-row:hover .row-actions,
.table-row:focus-within .row-actions { opacity: 1; }
```
