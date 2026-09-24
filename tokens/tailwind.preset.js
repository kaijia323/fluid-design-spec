/**
 * 流体设计 · Tailwind 预设
 * 版本 v1.1 ｜ 配套文档：../Design.md、../SOURCES.md
 *
 * 用法（Tailwind v3，tailwind.config.js）：
 *   const fluid = require('./tokens/tailwind.preset.js');
 *   module.exports = { presets: [fluid], content: [...] };
 *
 * Tailwind v4：把下面的值搬进 CSS 的 @theme 块即可（令牌本身已在 tokens.css）。
 *
 * 说明：组件层令牌（--button-radius 等）由 tokens.css 按 <html data-platform> 决定，
 *       本预设只负责把全局 / 语义令牌接到 Tailwind 的工具类上。
 */

const tokens = {
  colors: {
    primary: {
      DEFAULT: 'var(--color-action-default)',
      hover: 'var(--color-action-hover)',
      active: 'var(--color-action-active)',
      brand: 'var(--color-primary)',
    },
    accent: 'var(--color-accent)',
    success: 'var(--color-status-success)',
    warning: 'var(--color-status-warning)',
    error: 'var(--color-status-error)',
    purple: 'var(--color-purple)',
    base: 'var(--color-bg-base)',
    surface: 'var(--color-bg-surface)',
    elevated: 'var(--color-bg-elevated)',
    sunken: 'var(--color-bg-sunken)',
    ink: {
      DEFAULT: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
      tertiary: 'var(--color-text-tertiary)',
      inverse: 'var(--color-text-inverse)',
    },
    line: {
      subtle: 'var(--color-border-subtle)',
      strong: 'var(--color-border-strong)',
    },
  },

  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },

  fontSize: {
    caption: ['var(--text-caption)', { lineHeight: 'var(--text-caption-lh)' }],
    'body-sm': ['var(--text-body-sm)', { lineHeight: 'var(--text-body-sm-lh)' }],
    body: ['var(--text-body)', { lineHeight: 'var(--text-body-lh)' }],
    title: ['var(--text-title)', { lineHeight: 'var(--text-title-lh)' }],
    headline: ['var(--text-headline)', { lineHeight: 'var(--text-headline-lh)' }],
    display: ['var(--text-display)', { lineHeight: 'var(--text-display-lh)' }],
  },

  fontWeight: {
    regular: 'var(--weight-regular)',
    medium: 'var(--weight-medium)',
    semibold: 'var(--weight-semibold)',
  },

  /* 4px 基准间距（保留 Tailwind 默认桩，另加语义名） */
  spacing: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    8: 'var(--space-8)',
    10: 'var(--space-10)',
    gutter: 'var(--page-gutter)',
  },

  borderRadius: {
    xs: 'var(--radius-xs)',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    full: 'var(--radius-full)',
    /* 组件级：跟随平台（data-platform）自动切换 */
    button: 'var(--button-radius)',
    input: 'var(--input-radius)',
    card: 'var(--card-radius)',
    tag: 'var(--tag-radius)',
  },

  boxShadow: {
    /* 最多两级，禁止再加深 */
    1: 'var(--shadow-1)',
    2: 'var(--shadow-2)',
    none: 'none',
  },

  backdropBlur: {
    acrylic: 'var(--blur-acrylic)',
  },

  transitionDuration: {
    100: 'var(--duration-100)',
    150: 'var(--duration-150)',
    200: 'var(--duration-200)',
    220: 'var(--duration-220)',
    300: 'var(--duration-300)',
    400: 'var(--duration-400)',
    /* 语义：按平台自动切换（移动 300ms / Web 150ms） */
    enter: 'var(--motion-enter)',
    exit: 'var(--motion-exit)',
  },

  transitionTimingFunction: {
    fluid: 'var(--ease-fluid)',
    spring: 'var(--ease-spring)',
    'spring-soft': 'var(--ease-spring-soft)',
  },

  scale: {
    'press-mobile': 'var(--press-scale-mobile)',
    'press-web': 'var(--press-scale-web)',
    drag: 'var(--drag-max-scale)',
  },

  maxWidth: {
    content: 'var(--content-max)',
  },
};

module.exports = { theme: { extend: tokens } };
