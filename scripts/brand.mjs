#!/usr/bin/env node
/* ============================================================================
 * 流体设计规范 · 品牌层门禁脚本            scripts/brand.mjs   v2.0
 *
 * 契约来源：specs/feature-brand-token-layer.contract.md（令牌名 / 默认值 /
 *           派生算法 / 门禁阈值 / CLI 全部冻结，本文件不得自行放宽任何阈值）
 *
 * 用法：
 *   node scripts/brand.mjs check                                         读 tokens/brand.css + tokens/tokens.css + tokens/brand.presets.css，跑 G1~G9
 *   node scripts/brand.mjs check   --brand '#0e7a5f' [--brand-2 '#hex']  不读文件，直接体检候选品牌色，跑 G1~G6
 *   node scripts/brand.mjs derive  '#0e7a5f' [--brand-2 '#hex']          打印 10 行派生段（两空格缩进 / 小写 hex / 行尾分号）
 *   node scripts/brand.mjs selftest                                      3 个负例自检，全部按预期被拦才 exit 0
 *
 * 退出码：无 fail → 0；有 fail 或解析失败 → 1
 * 零依赖：只用 node:fs / node:process / node:path，Node >= 18
 *
 * CSS 解析模型（契约 §8，改解析逻辑前先读这段）：
 *   三张表 base / light / dark；明色有效值 = base + light，暗色有效值 = base + dark。
 *   选择器块按逗号拆段、逐段判定再取并集（见 tablesForSelector）：
 *     · @media (prefers-color-scheme: dark) 里的块、:root:not([data-theme="light"])、
 *       :root[data-theme="dark"]                          → 主题专属 dark
 *     · :root[data-theme="light"]                         → light
 *     · 其余（裸 :root、:root[data-platform="mobile"] …）  → base（明暗都算）
 *   关键点：选择器列表里有【裸 :root】时（例如 :root, :root[data-theme="light"]），
 *   该段暗色下也命中，所以整块要同时进 base 与 light；只判 light 会把
 *   --color-status-success 这类令牌误判成暗色未定义。
 *   var() 链最多 8 跳，检测循环；解析失败一律打印行号并 exit 1，不静默跳过。
 * ==========================================================================*/

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/* ========================== 契约常量（冻结，勿改） ========================== */

const DARK_BG_FOR_BRIGHT   = '#0b0d12';   // 提亮主色的校验暗底
const ON_ACCENT_CANDIDATES = ['#ffffff', '#1a1d24'];
const CONTRAST_MIN         = 4.5;         // G1/G2/G3/G6 阈值
const CONTRAST_TIGHT       = 5.0;         // W2 提示阈值
const DL_MIN               = 0.03;        // G4 交互态 OKLab ΔL 阈值
const HUE_MIN              = 15;          // G5 色相环距离阈值（度）
const HOVER_DL             = 0.05;        // hover  OKLab L 增量
const ACTIVE_DL            = -0.07;       // active OKLab L 增量
const BRIGHT_EXTRA         = 0.16;        // bright 的最小提亮量
const BRIGHT_STEP          = 0.005;       // lNeeded 步长
const MAX_VAR_DEPTH        = 8;           // var() 链最大层数
const DEFAULT_BRAND_2      = '#ff8c42';   // 默认第二强调色（日落橘）

/* 规范钉死的中性色 / 状态色（候选模式不读文件时使用；与 tokens.css 一致） */
const FROZEN = {
  'color-success': '#34c759',
  'color-warning': '#ff9500',
  'color-error':   '#ff3b30',
};
const FROZEN_TEXT = {
  light: {
    'bg-base':        '#f5f6f9',   // --color-neutral-50
    'text-primary':   '#1a1d24',   // --color-neutral-800
    'text-secondary': '#5a6270',   // --color-neutral-600
    'text-tertiary':  '#8a93a3',   // --color-neutral-400
  },
  dark: {
    'bg-base':        '#0b0d12',   // --color-neutral-950
    'text-primary':   '#f2f4f8',   // --color-ink-bright
    'text-secondary': '#a8b0bf',   // --color-neutral-300
    'text-tertiary':  '#6e7686',   // --color-neutral-500
  },
};

/* 派生段 10 个令牌，顺序即 derive 输出顺序（契约 §1 表格顺序） */
const DERIVED_ORDER = [
  '--brand-accent-hover',
  '--brand-accent-active',
  '--brand-accent-bright',
  '--brand-accent-bright-hover',
  '--brand-accent-bright-active',
  '--brand-on-accent',
  '--brand-on-accent-bright',
  '--brand-accent-2-hover',
  '--brand-accent-2-active',
  '--brand-on-accent-2',
];

const PATHS = {
  brand:    'tokens/brand.css',
  tokens:   'tokens/tokens.css',
  presets:  'tokens/brand.presets.css',
  tailwind: 'tokens/tailwind.preset.js',
};

/* 预设块里必须与 derive 一致的 7 个派生值（第二色不随预设变，不含 accent-2 三项） */
const PRESET_DERIVED = [
  '--brand-accent-hover',
  '--brand-accent-active',
  '--brand-accent-bright',
  '--brand-accent-bright-hover',
  '--brand-accent-bright-active',
  '--brand-on-accent',
  '--brand-on-accent-bright',
];

/* ============================== 颜色数学 ================================== */
/* OKLab / OKLCH 使用 CSS Color 4 标准矩阵；对比度用 WCAG 相对亮度。
   明度只走 OKLab L —— 禁止 HSL / HSV。                                      */

function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('不是合法的 6 位 hex：' + hex);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(rgb) {
  return '#' + rgb.map((c) => {
    const v = Math.max(0, Math.min(255, Math.round(c)));
    return v.toString(16).padStart(2, '0');
  }).join('');
}

function isHex(v) { return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v).trim()); }

function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c) {
  const x = Math.max(0, Math.min(1, c));
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

/* hex → OKLab */
function hexToOklab(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/* OKLab → hex（钳制到 sRGB 后取最近整数） */
function oklabToHex(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  const lr =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  return rgbToHex([linearToSrgb(lr) * 255, linearToSrgb(lg) * 255, linearToSrgb(lb) * 255]);
}

/* hex → OKLCH */
function hexToOklch(hex) {
  const { L, a, b } = hexToOklab(hex);
  const C = Math.sqrt(a * a + b * b);
  let H = Math.atan2(b, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

/* at(l)：只动 L，C / H 不变 */
function atL(oklch, l) {
  const L = Math.max(0, Math.min(1, l));
  const rad = oklch.H * Math.PI / 180;
  return oklabToHex(L, oklch.C * Math.cos(rad), oklch.C * Math.sin(rad));
}

function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(hexA, hexB) {
  const a = relLuminance(hexA), b = relLuminance(hexB);
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function hueDistance(h1, h2) {
  const d = Math.abs(((h1 - h2) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/* 两候选文字色里挑对比度更高的那个 */
function pickOnAccent(bgHex) {
  let best = null;
  for (const cand of ON_ACCENT_CANDIDATES) {
    const c = contrast(cand, bgHex);
    if (!best || c > best.contrast) best = { hex: cand, contrast: c };
  }
  return best;
}

/* ============================ §5 派生算法 ================================= */

function derive(accentHex, accent2Hex) {
  const accent = isHex(accentHex) ? rgbToHex(hexToRgb(accentHex)) : null;
  const accent2 = isHex(accent2Hex || DEFAULT_BRAND_2) ? rgbToHex(hexToRgb(accent2Hex || DEFAULT_BRAND_2)) : null;
  if (!accent) throw new Error('品牌主色不是合法 hex：' + accentHex);
  if (!accent2) throw new Error('第二强调色不是合法 hex：' + accent2Hex);

  const A = hexToOklch(accent);
  const A2 = hexToOklch(accent2);

  // 3/4：明色交互态
  const hover = atL(A, A.L + HOVER_DL);
  const active = atL(A, A.L + ACTIVE_DL);

  // 5：lNeeded —— 从 L 起以 0.005 步长递增，直到对暗底 contrast >= 4.5（上限 1.0）
  let lNeeded = 1;
  for (let l = A.L; l <= 1 + 1e-9; l += BRIGHT_STEP) {
    const lc = Math.min(1, l);
    if (contrast(atL(A, lc), DARK_BG_FOR_BRIGHT) >= CONTRAST_MIN) { lNeeded = lc; break; }
    if (lc >= 1) break;
  }
  const lBright = Math.min(1, Math.max(A.L + BRIGHT_EXTRA, lNeeded));
  const bright = atL(A, lBright);

  // 6/7：暗色交互态
  const brightHover = atL(A, lBright + HOVER_DL);
  const brightActive = atL(A, lBright + ACTIVE_DL);

  // 8/9：按钮文字色
  const onAccent = pickOnAccent(accent);
  const onAccentBright = pickOnAccent(bright);

  // 10：第二色（同 3/4/8，不做 bright）
  const a2Hover = atL(A2, A2.L + HOVER_DL);
  const a2Active = atL(A2, A2.L + ACTIVE_DL);
  const onAccent2 = pickOnAccent(accent2);

  const values = {
    '--brand-accent-hover': hover,
    '--brand-accent-active': active,
    '--brand-accent-bright': bright,
    '--brand-accent-bright-hover': brightHover,
    '--brand-accent-bright-active': brightActive,
    '--brand-on-accent': onAccent.hex,
    '--brand-on-accent-bright': onAccentBright.hex,
    '--brand-accent-2-hover': a2Hover,
    '--brand-accent-2-active': a2Active,
    '--brand-on-accent-2': onAccent2.hex,
  };

  return {
    accent, accent2, values,
    meta: {
      lBase: A.L, lBright, lNeeded,
      hoverDL: hexToOklab(values['--brand-accent-hover']).L - hexToOklab(accent).L,
      activeDL: hexToOklab(values['--brand-accent-active']).L - hexToOklab(accent).L,
      brightHoverDL: hexToOklab(values['--brand-accent-bright-hover']).L - hexToOklab(bright).L,
      brightActiveDL: hexToOklab(values['--brand-accent-bright-active']).L - hexToOklab(bright).L,
      onAccent, onAccentBright, onAccent2,
    },
  };
}

/* 派生段的 10 行文本（两空格缩进 / 小写 hex / 行尾分号） */
function deriveLines(accentHex, accent2Hex) {
  const d = derive(accentHex, accent2Hex);
  return DERIVED_ORDER.map((n) => '  ' + n + ': ' + d.values[n] + ';');
}

/* ============================== §8 CSS 解析 =============================== */

class CssError extends Error {}

/* 去注释，保留换行以维持行号映射 */
function stripComments(src, fileName) {
  let out = '';
  const lineMap = [];
  let line = 1, i = 0, commentStartLine = 1;
  while (i < src.length) {
    if (src[i] === '/' && src[i + 1] === '*') {
      commentStartLine = line;
      i += 2;
      let closed = false;
      while (i < src.length) {
        if (src[i] === '*' && src[i + 1] === '/') { i += 2; closed = true; break; }
        if (src[i] === '\n') { out += '\n'; lineMap.push(line); line++; }
        i++;
      }
      if (!closed) throw new CssError(fileName + ' 第 ' + commentStartLine + ' 行：注释 /* 未闭合');
      continue;
    }
    out += src[i];
    lineMap.push(line);
    if (src[i] === '\n') line++;
    i++;
  }
  return { text: out, lineMap };
}

const DARK_MEDIA_RE = /prefers-color-scheme\s*:\s*dark/i;
const THEME_DARK_RE = /\[\s*data-theme\s*=\s*["']?dark["']?\s*\]/i;
const THEME_LIGHT_RE = /\[\s*data-theme\s*=\s*["']?light["']?\s*\]/i;
const NOT_LIGHT_RE = /:not\(\s*\[\s*data-theme\s*=\s*["']?light["']?\s*\]\s*\)/i;

/*
 * 一个选择器块进哪几张表（契约 §8）—— 按逗号拆段，逐段判定后取并集：
 *   @media (prefers-color-scheme: dark) 里的任何块            → dark（主题专属）
 *   :root:not([data-theme="light"]) 或 [data-theme="dark"]  → dark（主题专属）
 *   [data-theme="light"]                                     → light
 *   其它（裸 :root、:root[data-platform="mobile"] 等）        → base
 * 注意：选择器列表里出现【裸 :root】时（例如 :root, :root[data-theme="light"]），
 * 那一段在暗色下同样命中，所以整块除 light 外还要进 base —— 只判 light 会把
 * --color-status-success 这类「暗色下其实有定义」的令牌误判成未定义。
 */
function tablesForSelector(selector, inDark) {
  if (inDark) return ['dark'];
  const parts = selector.split(',').map((s) => s.trim()).filter(Boolean);
  const out = new Set();
  for (const p of parts) {
    if (NOT_LIGHT_RE.test(p) || THEME_DARK_RE.test(p)) out.add('dark');
    else if (THEME_LIGHT_RE.test(p)) out.add('light');
    else out.add('base');
  }
  return out.size ? [...out] : ['base'];
}

/*
 * 解析 CSS 为三张表：base / light / dark
 *   base  = 普通 :root
 *   light = :root, :root[data-theme="light"]
 *   dark  = @media (prefers-color-scheme: dark) 里的 :root:not([data-theme="light"]) 与 :root[data-theme="dark"]
 * 解析失败抛 CssError（带文件名与行号），绝不静默跳过。
 */
function parseCss(src, fileName) {
  const { text, lineMap } = stripComments(src, fileName);
  const lineAt = (idx) => lineMap[Math.min(idx, lineMap.length - 1)] || 1;

  const tables = { base: new Map(), light: new Map(), dark: new Map() };
  const stack = [];           // { type: 'at'|'block', isDark, table, line }
  let buf = '', bufLine = 1, i = 0;

  const fail = (idx, msg) => { throw new CssError(fileName + ' 第 ' + lineAt(idx) + ' 行：' + msg); };

  const enclosingDark = () => stack.some((f) => f.type === 'at' && f.isDark);

  while (i < text.length) {
    const ch = text[i];

    if (ch === '{') {
      const prelude = buf.trim();
      const startLine = bufLine;
      buf = ''; bufLine = lineAt(i + 1);
      if (prelude === '') fail(i, '出现没有选择器的 "{ ... }" 块');
      if (prelude.startsWith('@')) {
        stack.push({ type: 'at', isDark: DARK_MEDIA_RE.test(prelude), line: startLine, prelude });
      } else {
        if (stack.some((f) => f.type === 'block')) {
          fail(i, '选择器块嵌套在选择器块里（"' + prelude + '"），本脚本只支持 @media 嵌套一层');
        }
        const tabs = tablesForSelector(prelude, enclosingDark());
        stack.push({ type: 'block', tables: tabs, line: startLine, selector: prelude });
      }
      i++;
      continue;
    }

    if (ch === '}') {
      if (stack.length === 0) fail(i, '多余的 "}"（没有与之配对的 "{"）');
      const leftover = buf.trim();
      if (leftover !== '') {
        throw new CssError(fileName + ' 第 ' + bufLine + ' 行：语句未以 ";" 结束 "' + leftover.slice(0, 60) + '"（契约 §8：一个声明一行、行尾分号）');
      }
      stack.pop();
      buf = ''; bufLine = lineAt(i + 1);
      i++;
      continue;
    }

    if (ch === ';') {
      const decl = buf.trim();
      const declLine = bufLine;
      buf = ''; bufLine = lineAt(i + 1);
      i++;
      if (decl === '') continue;
      const top = stack.length ? stack[stack.length - 1] : null;
      if (!top || top.type === 'at') continue;   // 顶层 @import / @charset 等语句，忽略
      const m = /^(--[A-Za-z0-9_-]+)\s*:\s*([\s\S]*)$/.exec(decl);
      if (m) {
        const dup = /(^|\s)(--[A-Za-z0-9_-]+)\s*:/.exec(m[2]);
        if (dup) {
          throw new CssError(fileName + ' 第 ' + declLine + ' 行：声明 "' + m[1] +
            '" 的值里又出现 "' + dup[2] + ':"，疑似上一条声明缺行尾分号');
        }
        for (const t of top.tables) tables[t].set(m[1], { value: m[2].trim(), file: fileName, line: declLine });
        continue;
      }
      // 非自定义属性（如 color-scheme: dark）不参与令牌表，允许存在
      if (/^[-A-Za-z][-A-Za-z0-9]*\s*:\s*[\s\S]*$/.test(decl)) continue;
      throw new CssError(fileName + ' 第 ' + declLine + ' 行：无法解析的声明 "' + decl.slice(0, 60) + '"');
    }

    if (ch === '\n' && buf.trim() === '') { bufLine = lineAt(i + 1); }
    buf += ch;
    i++;
  }

  if (stack.length) {
    const f = stack[stack.length - 1];
    throw new CssError(fileName + ' 第 ' + f.line + ' 行：块 "{" 未闭合（' + (f.selector || f.prelude) + '）');
  }
  if (buf.trim() !== '') {
    throw new CssError(fileName + ' 第 ' + bufLine + ' 行：语句未以 ";" 结束 "' + buf.trim().slice(0, 60) + '"');
  }
  return tables;
}

/*
 * 解析 brand.presets.css 的预设块：每个含 [data-brand="xxx"] 的块收成一个 { brand, decls }。
 * 兼容两种选择器写法：[data-brand="x"]（旧）与 :root[data-brand="x"]（新）。
 * 解析失败一律带行号抛 CssError，不静默跳过。
 */
function parseBrandBlocks(src, fileName) {
  const { text, lineMap } = stripComments(src, fileName);
  const lineAt = (idx) => lineMap[Math.min(idx, lineMap.length - 1)] || 1;
  const blocks = [];
  const stack = [];            // { brand, prelude, line, decls }
  let buf = '', bufLine = 1, i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (ch === '{') {
      const prelude = buf.trim();
      const startLine = bufLine;
      buf = ''; bufLine = lineAt(i + 1);
      if (prelude === '') throw new CssError(fileName + ' 第 ' + lineAt(i) + ' 行：出现没有选择器的 "{ ... }" 块');
      const m = /\[\s*data-brand\s*=\s*["']?([A-Za-z0-9_-]+)["']?\s*\]/.exec(prelude);
      stack.push({ brand: m ? m[1] : null, prelude, line: startLine, decls: new Map() });
      i++; continue;
    }
    if (ch === '}') {
      if (stack.length === 0) throw new CssError(fileName + ' 第 ' + lineAt(i) + ' 行：多余的 "}"（没有与之配对的 "{"）');
      const leftover = buf.trim();
      if (leftover !== '') {
        throw new CssError(fileName + ' 第 ' + bufLine + ' 行：语句未以 ";" 结束 "' + leftover.slice(0, 60) + '"');
      }
      const top = stack.pop();
      if (top.brand) blocks.push(top);
      buf = ''; bufLine = lineAt(i + 1);
      i++; continue;
    }
    if (ch === ';') {
      const decl = buf.trim();
      const declLine = bufLine;
      buf = ''; bufLine = lineAt(i + 1);
      i++;
      if (decl === '') continue;
      const top = stack.length ? stack[stack.length - 1] : null;
      if (!top) continue;
      const m = /^(--[A-Za-z0-9_-]+)\s*:\s*([\s\S]*)$/.exec(decl);
      if (m) {
        const dup = /(^|\s)(--[A-Za-z0-9_-]+)\s*:/.exec(m[2]);
        if (dup) {
          throw new CssError(fileName + ' 第 ' + declLine + ' 行：声明 "' + m[1] + '" 的值里又出现 "' + dup[2] + ':"，疑似上一条声明缺行尾分号');
        }
        top.decls.set(m[1], { value: m[2].trim(), line: declLine });
        continue;
      }
      if (/^[-A-Za-z][-A-Za-z0-9]*\s*:\s*[\s\S]*$/.test(decl)) continue;
      throw new CssError(fileName + ' 第 ' + declLine + ' 行：无法解析的声明 "' + decl.slice(0, 60) + '"');
    }
    if (ch === '\n' && buf.trim() === '') bufLine = lineAt(i + 1);
    buf += ch; i++;
  }
  if (stack.length) {
    const f = stack[stack.length - 1];
    throw new CssError(fileName + ' 第 ' + f.line + ' 行：块 "{" 未闭合（' + f.prelude + '）');
  }
  if (buf.trim() !== '') {
    throw new CssError(fileName + ' 第 ' + bufLine + ' 行：语句未以 ";" 结束 "' + buf.trim().slice(0, 60) + '"');
  }
  /* 同名预设出现多次时按文件顺序合并（后面的赢） */
  const byBrand = new Map();
  for (const b of blocks) {
    const cur = byBrand.get(b.brand) || { brand: b.brand, selector: b.prelude, line: b.line, decls: new Map() };
    for (const [k, v] of b.decls) cur.decls.set(k, v);
    byBrand.set(b.brand, cur);
  }
  return [...byBrand.values()];
}

function mergeTables(a, b) {
  const out = new Map(a);
  for (const [k, v] of b) out.set(k, v);
  return out;
}

/* var() 链解析：最多 8 层，检测循环；返回 null 表示未定义 */
function resolveVar(name, eff, chain) {
  /* 归一化：表里的键带 "--" 前缀，调用方带不带都接受 */
  const key = name.startsWith('--') ? name : '--' + name;
  const short = key.slice(2);
  const path0 = chain || [];
  if (path0.includes(short)) {
    throw new CssError('var(--' + short + ') 出现循环引用：' + path0.concat(short).map((n) => '--' + n).join(' → '));
  }
  if (path0.length > MAX_VAR_DEPTH) {
    throw new CssError('var(--' + short + ') 链式引用超过 ' + MAX_VAR_DEPTH + ' 层：' +
      path0.concat(short).map((n) => '--' + n).join(' → '));
  }
  const def = eff.get(key);
  if (!def) return null;
  const v = String(def.value).trim();
  const m = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,([\s\S]*))?\)$/.exec(v);
  if (!m) return v;
  const inner = resolveVar(m[1], eff, path0.concat(short));
  if (inner === null) {
    if (m[2] !== undefined) return m[2].trim();
    throw new CssError(def.file + ' 第 ' + def.line + ' 行：--' + short + ' 引用了未定义的 var(' + m[1] + ')');
  }
  return inner;
}

/* 解析成可算对比度的颜色值（hex / rgb() / rgba()） */
function toColor(value, where) {
  const v = String(value).trim();
  if (isHex(v)) return rgbToHex(hexToRgb(v));
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i.exec(v);
  if (m) {
    const a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    if (a >= 0.999) return rgbToHex([+m[1], +m[2], +m[3]]);
    throw new CssError((where ? where + '：' : '') + '半透明颜色 "' + v + '" 无法计算对比度（需要不透明色）');
  }
  throw new CssError((where ? where + '：' : '') + '无法解析为颜色 "' + v + '"');
}

/* ============================== 门禁与输出 ================================ */

const gates = [];
const warns = [];
const notes = [];

function record(id, name, actual, threshold, ok, detail) {
  gates.push({ id, name, actual, threshold, status: ok ? 'pass' : 'fail', detail });
}
function warn(id, name, actual, threshold, detail) {
  warns.push({ id, name, actual, threshold, status: 'warn', detail });
}
function ratio(x) { return x.toFixed(2) + ':1'; }
function deg(x) { return x.toFixed(1) + '°'; }
function signed(x) { return (x >= 0 ? '+' : '') + x.toFixed(4); }

/* ---- G1 / G2 / G3 / G6：对比度 ---- */
function gateContrast(id, name, fgHex, bgHex, extra) {
  const c = contrast(fgHex, bgHex);
  record(id, name, ratio(c) + '（' + fgHex + ' / ' + bgHex + '）', '≥ ' + CONTRAST_MIN + ':1',
    c >= CONTRAST_MIN - 1e-9, extra || '');
  return c;
}

/* ---- G4：交互态可辨（OKLab ΔL） ---- */
function gateDeltaL(pairs, nominal) {
  const measured = pairs.map(([label, a, b]) => ({
    label,
    base: a,
    target: b,
    dL: hexToOklab(b).L - hexToOklab(a).L,
  }));
  const minAbs = Math.min.apply(null, measured.map((m) => Math.abs(m.dL)));
  const shown = measured.map((m) => m.label + ' ' + signed(m.dL)).join(' / ');
  /* 名义步长 = 契约 §5 的 L 增量；实测 ΔL 是落到 8bit sRGB 后的值（出界钳制会吃掉一点） */
  const nom = nominal ? '；名义步长 ' + Object.keys(nominal).map((k) => k + ' ' + signed(nominal[k])).join(' / ') : '';
  record('G4', '交互态可辨（与基准的 OKLab |ΔL|）',
    '实测 min |ΔL| ' + minAbs.toFixed(4) + '（' + shown + nom + '）', '≥ ' + DL_MIN.toFixed(2) + ' (OKLab L)',
    measured.every((m) => Math.abs(m.dL) >= DL_MIN - 1e-9), '');
  return measured;
}

/* ---- G5：品牌主色与状态色色相环距离 ---- */
function gateHue(accentHex, statusColors, labelLiteral) {
  const h = hexToOklch(accentHex).H;
  let worst = null;
  for (const [key, hex] of statusColors) {
    const hs = hexToOklch(hex).H;
    const d = hueDistance(h, hs);
    const item = { name: '--color-' + key, hex, hue: hs, dist: d };
    if (!worst || d < worst.dist) worst = item;
  }
  const ok = worst.dist >= HUE_MIN - 1e-9;
  const detail = ok
    ? '品牌色色相 ' + deg(h) + '，最近的 ' + worst.name + '(' + worst.hex + ', ' + deg(worst.hue) + ') 距离 ' + deg(worst.dist)
    : '品牌色色相 ' + deg(h) + '，与 ' + worst.name + '(' + worst.hex + ', ' + deg(worst.hue) + ') 色相距离 ' +
      Math.round(worst.dist) + '° < ' + HUE_MIN + '°（精确 ' + deg(worst.dist) + '）';
  record('G5', (labelLiteral || '品牌主色') + '与 success/warning/error 色相环距离',
    deg(worst.dist) + '（最近 ' + worst.name + '）', '≥ ' + HUE_MIN + '°', ok, detail);
  return worst;
}

/* ---- W4：第二强调色与状态色撞色：降级为 W 提示，不拦 ---- */
function warnHue2(accent2Hex, statusColors) {
  const h = hexToOklch(accent2Hex).H;
  let worst = null;
  for (const [key, hex] of statusColors) {
    const d = hueDistance(h, hexToOklch(hex).H);
    if (!worst || d < worst.dist) worst = { name: '--color-' + key, hex, dist: d };
  }
  if (worst.dist < HUE_MIN - 1e-9) {
    warn('W4', '第二强调色与状态色色相距离（仅提示，不拦）',
      deg(worst.dist) + '（' + accent2Hex + ' 最近 ' + worst.name + '）', '建议 ≥ ' + HUE_MIN + '°',
      '第二色不承载状态语义，只做小面积强调；如需更稳可微调色相');
  }
}

/* ---- W3：品牌色 / 第二强调色与分类标识色 --color-purple 撞色（提示，不拦） ---- */
function warnPurple(accentHex, accent2Hex, purpleHex) {
  if (!purpleHex) return;
  const hp = hexToOklch(purpleHex).H;
  const hits = [];
  for (const [label, hex] of [['--brand-accent', accentHex], ['--brand-accent-2', accent2Hex]]) {
    if (!hex) continue;
    const d = hueDistance(hexToOklch(hex).H, hp);
    if (d < HUE_MIN - 1e-9) {
      hits.push(label + ' ' + hex + '（' + deg(hexToOklch(hex).H) + '）距离 ' + Math.round(d) + '°');
    }
  }
  if (hits.length) {
    warn('W3', '品牌色与分类标识色分不清（--color-purple ' + purpleHex + '）', hits.join('；'),
      '建议 ≥ ' + HUE_MIN + '°', '紫色品牌容易被误读成 --color-purple 分类标识；只做小面积强调可接受');
  }
}

/* 分类标识色从 tokens.css 解析（不写死 hex）；读不到就跳过 W3（提示不拦，不影响退出码） */
function purpleFromTokens() {
  try {
    const abs = path.join(ROOT, PATHS.tokens);
    if (!fs.existsSync(abs)) return null;
    const t = parseCss(fs.readFileSync(abs, 'utf8'), PATHS.tokens);
    const def = t.base.get('--color-purple');
    if (!def) return null;
    const v = toColor(def.value, PATHS.tokens + ' 第 ' + def.line + ' 行');
    return isHex(v) ? rgbToHex(hexToRgb(v)) : null;
  } catch (e) {
    return null;
  }
}

/* ---- W1：--color-text-tertiary ---- */
function warnTertiary(lightT, lightBg, darkT, darkBg) {
  const cl = contrast(lightT, lightBg), cd = contrast(darkT, darkBg);
  if (cl < CONTRAST_MIN - 1e-9 || cd < CONTRAST_MIN - 1e-9) {
    warn('W1', '--color-text-tertiary 对底色（仅提示/占位用）',
      '明 ' + ratio(cl) + ' / 暗 ' + ratio(cd), '≥ ' + CONTRAST_MIN + ':1',
      'tertiary 只用于提示与占位，不用于正文');
  }
}

/* ---- W2：G1 实测 < 5.0 ---- */
function warnTightG1(c) {
  if (c < CONTRAST_TIGHT && c >= CONTRAST_MIN - 1e-9) {
    warn('W2', 'G1 实测偏紧（过线但 < ' + CONTRAST_TIGHT + ':1）', ratio(c), '建议 ≥ ' + CONTRAST_TIGHT + ':1',
      '品牌色再深一点点会更稳');
  }
}

/* ---- 输出 ---- */
function printLine(g) {
  const detail = g.detail ? '  ' + g.detail : '';
  console.log(g.id + ' ' + g.name + '  ' + g.actual + '  阈值 ' + g.threshold + '  ' + g.status + detail);
}

function summarize() {
  const p = gates.filter((g) => g.status === 'pass').length;
  const f = gates.filter((g) => g.status === 'fail').length;
  console.log('结果：' + p + ' pass / ' + f + ' fail / ' + warns.length + ' warn');
  return f === 0;
}

/* ============================ 候选模式 G1~G6 ============================== */

function statusColorsFrom(table, fallback) {
  const out = [];
  for (const key of ['success', 'warning', 'error']) {
    const def = table && table.get('--color-' + key);
    let hex = fallback['color-' + key] || fallback[key];
    if (!hex) throw new CssError('缺少规范冻结的状态色 --color-' + key);
    if (def) {
      try {
        const resolved = toColor(def.value, def.file + ' 第 ' + def.line + ' 行');
        if (isHex(resolved)) hex = resolved;
      } catch (e) { /* 保底用规范冻结值 */ }
    }
    out.push([key, rgbToHex(hexToRgb(hex))]);
  }
  return out;
}

function runCandidateGates(accentHex, accent2Hex, statusColors, textTables, label, purpleHex) {
  const d = derive(accentHex, accent2Hex);
  const v = d.values;

  console.log('品牌色体检 · ' + label + '：--brand-accent ' + d.accent + ' / --brand-accent-2 ' + d.accent2);
  console.log('（候选模式不读文件，G6 与色相基准用规范冻结的中性色 / 状态色）');

  const c1 = gateContrast('G1', '按钮文字对比（--brand-on-accent / --brand-accent）',
    v['--brand-on-accent'], d.accent);
  if (c1 < CONTRAST_MIN - 1e-9) {
    gates[gates.length - 1].detail = '白字 ' + ratio(contrast('#ffffff', d.accent)) +
      '，深字 ' + ratio(contrast('#1a1d24', d.accent)) + ' —— 建议把品牌色明度调低，或改用深色文字';
  }
  gateContrast('G2', '暗色按钮文字对比（--brand-on-accent-bright / --brand-accent-bright）',
    v['--brand-on-accent-bright'], v['--brand-accent-bright']);
  gateContrast('G3', '暗色提亮主色对暗底（--brand-accent-bright / 暗色 --color-bg-base）',
    v['--brand-accent-bright'], textTables.dark['bg-base']);
  gateDeltaL([
    ['hover', d.accent, v['--brand-accent-hover']],
    ['active', d.accent, v['--brand-accent-active']],
    ['bright-hover', v['--brand-accent-bright'], v['--brand-accent-bright-hover']],
    ['bright-active', v['--brand-accent-bright'], v['--brand-accent-bright-active']],
  ], {
    hover: HOVER_DL,
    active: ACTIVE_DL,
    'bright-hover': HOVER_DL,
    'bright-active': ACTIVE_DL,
  });
  gateHue(d.accent, statusColors, '品牌主色');
  const g6 = {
    lp: contrast(textTables.light['text-primary'], textTables.light['bg-base']),
    ls: contrast(textTables.light['text-secondary'], textTables.light['bg-base']),
    dp: contrast(textTables.dark['text-primary'], textTables.dark['bg-base']),
    ds: contrast(textTables.dark['text-secondary'], textTables.dark['bg-base']),
  };
  record('G6', '正文 / 次要文字对比（明暗两套，--color-text-primary、--color-text-secondary / --color-bg-base）',
    '明 ' + ratio(g6.lp) + ' 明次 ' + ratio(g6.ls) + ' 暗 ' + ratio(g6.dp) + ' 暗次 ' + ratio(g6.ds),
    '≥ ' + CONTRAST_MIN + ':1',
    Object.values(g6).every((c) => c >= CONTRAST_MIN - 1e-9), '');

  warnTightG1(c1);
  warnHue2(d.accent2, statusColors);
  warnPurple(d.accent, d.accent2, purpleHex);
  return d;
}

/* ============================== 文件模式 ================================== */

function readFileOrDie(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) throw new CssError('找不到 ' + rel + '（品牌层文件缺失，先跑 tokens-dev 的产出）');
  return fs.readFileSync(abs, 'utf8');
}

function extractDerivedSection(src) {
  const start = src.indexOf('@brand-derived:start');
  const end = src.indexOf('@brand-derived:end');
  if (start < 0 || end < 0 || end < start) return null;
  const body = src.slice(start, end);
  return body.split('\n')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('--') && s.endsWith(';'));
}

function collectVarRefs(src, label, out) {
  const re = /var\(\s*(--[A-Za-z0-9_-]+)/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push({ name: m[1], file: label });
}

function runFileGates() {
  const brandSrc = readFileOrDie(PATHS.brand);
  const tokensSrc = readFileOrDie(PATHS.tokens);
  const twSrc = fs.existsSync(path.join(ROOT, PATHS.tailwind)) ? readFileOrDie(PATHS.tailwind) : '';

  const brandTables = parseCss(brandSrc, PATHS.brand);
  const tokenTables = parseCss(tokensSrc, PATHS.tokens);

  const brandBase = brandTables.base;
  const effLight = mergeTables(mergeTables(tokenTables.base, tokenTables.light), brandTables.base);
  const effDark = mergeTables(mergeTables(tokenTables.base, tokenTables.dark), brandTables.base);
  const effLightAll = mergeTables(effLight, brandTables.light);
  const effDarkAll = mergeTables(effDark, brandTables.dark);

  const need = (name, where) => {
    const def = where.get(name);
    if (!def) throw new CssError('缺少令牌定义 ' + name);
    return def;
  };

  const accentDef = need('--brand-accent', brandBase);
  const accent2Def = brandBase.get('--brand-accent-2');
  const accent = toColor(accentDef.value, PATHS.brand + ' 第 ' + accentDef.line + ' 行');
  const accent2 = accent2Def ? toColor(accent2Def.value, PATHS.brand + ' 第 ' + accent2Def.line + ' 行') : DEFAULT_BRAND_2;

  const expected = derive(accent, accent2);
  const ev = expected.values;

  /* 品牌派生值：以 brand.css 里实际写的为准（手改派生行必须被门禁抓到） */
  const actual = {};
  for (const n of DERIVED_ORDER) {
    const def = brandBase.get(n);
    actual[n] = def ? toColor(def.value, PATHS.brand + ' 第 ' + def.line + ' 行') : null;
  }

  const statusColors = statusColorsFrom(tokenTables.base, FROZEN);

  console.log('品牌层门禁 · 读取 ' + PATHS.brand + ' + ' + PATHS.tokens + ' + ' + PATHS.presets);
  console.log('输入：--brand-accent ' + accent + ' / --brand-accent-2 ' + accent2 +
    '（暗底 ' + DARK_BG_FOR_BRIGHT + '，文字候选 #ffffff / #1a1d24）');

  /* G1 / G2 */
  const aOn = actual['--brand-on-accent'] || ev['--brand-on-accent'];
  const aBright = actual['--brand-accent-bright'] || ev['--brand-accent-bright'];
  const aOnBright = actual['--brand-on-accent-bright'] || ev['--brand-on-accent-bright'];
  const c1 = gateContrast('G1', '按钮文字对比（--brand-on-accent / --brand-accent）', aOn, accent,
    actual['--brand-on-accent'] ? '' : '（brand.css 缺该派生行，用算法值兜底）');
  if (c1 < CONTRAST_MIN - 1e-9) {
    gates[gates.length - 1].detail = '白字 ' + ratio(contrast('#ffffff', accent)) +
      '，深字 ' + ratio(contrast('#1a1d24', accent)) + ' —— 建议把品牌色明度调低，或改用深色文字';
  }
  gateContrast('G2', '暗色按钮文字对比（--brand-on-accent-bright / --brand-accent-bright）', aOnBright, aBright,
    actual['--brand-on-accent-bright'] ? '' : '（brand.css 缺该派生行，用算法值兜底）');

  /* G3 */
  const darkBg = toColor(resolveVar('color-bg-base', effDarkAll), PATHS.tokens + ' 暗色 --color-bg-base');
  gateContrast('G3', '暗色提亮主色对暗底（--brand-accent-bright / 暗色 --color-bg-base）', aBright, darkBg);

  /* G4 */
  const aHover = actual['--brand-accent-hover'] || ev['--brand-accent-hover'];
  const aActive = actual['--brand-accent-active'] || ev['--brand-accent-active'];
  const aBHover = actual['--brand-accent-bright-hover'] || ev['--brand-accent-bright-hover'];
  const aBActive = actual['--brand-accent-bright-active'] || ev['--brand-accent-bright-active'];
  gateDeltaL([
    ['hover', accent, aHover],
    ['active', accent, aActive],
    ['bright-hover', aBright, aBHover],
    ['bright-active', aBright, aBActive],
  ], {
    hover: HOVER_DL,
    active: ACTIVE_DL,
    'bright-hover': HOVER_DL,
    'bright-active': ACTIVE_DL,
  });

  /* G5 */
  gateHue(accent, statusColors, '品牌主色');
  if (accent2) warnHue2(accent2, statusColors);

  /* W3：分类标识色 --color-purple 从 tokens.css 解析（不写死 hex） */
  const purpleDef = tokenTables.base.get('--color-purple');
  let purpleHex = null;
  if (purpleDef) {
    const pv = toColor(purpleDef.value, PATHS.tokens + ' 第 ' + purpleDef.line + ' 行');
    if (isHex(pv)) purpleHex = rgbToHex(hexToRgb(pv));
  }
  warnPurple(accent, accent2, purpleHex);

  /* G6 */
  const lightBg = toColor(resolveVar('color-bg-base', effLightAll), PATHS.tokens + ' 明色 --color-bg-base');
  const lTP = toColor(resolveVar('color-text-primary', effLightAll), '--color-text-primary');
  const lTS = toColor(resolveVar('color-text-secondary', effLightAll), '--color-text-secondary');
  const dTP = toColor(resolveVar('color-text-primary', effDarkAll), '--color-text-primary');
  const dTS = toColor(resolveVar('color-text-secondary', effDarkAll), '--color-text-secondary');
  const g6ok = [contrast(lTP, lightBg), contrast(lTS, lightBg), contrast(dTP, darkBg), contrast(dTS, darkBg)]
    .every((c) => c >= CONTRAST_MIN - 1e-9);
  record('G6', '正文 / 次要文字对比（明暗两套，--color-text-primary、--color-text-secondary / --color-bg-base）',
    '明 ' + ratio(contrast(lTP, lightBg)) + ' 明次 ' + ratio(contrast(lTS, lightBg)) +
    ' 暗 ' + ratio(contrast(dTP, darkBg)) + ' 暗次 ' + ratio(contrast(dTS, darkBg)),
    '≥ ' + CONTRAST_MIN + ':1', g6ok, '');

  /* W1 */
  const lTT = toColor(resolveVar('color-text-tertiary', effLightAll), '--color-text-tertiary');
  const dTT = toColor(resolveVar('color-text-tertiary', effDarkAll), '--color-text-tertiary');
  warnTertiary(lTT, lightBg, dTT, darkBg);

  /* W2 */
  warnTightG1(c1);

  /* G7：var() 引用完整性 */
  const defined = new Set();
  for (const t of [brandTables, tokenTables]) {
    for (const k of ['base', 'light', 'dark']) for (const n of t[k].keys()) defined.add(n.slice(2));
  }
  const refs = [];
  const cssNoComment = (s) => stripComments(s, 'x').text;
  collectVarRefs(cssNoComment(brandSrc), PATHS.brand, refs);
  collectVarRefs(cssNoComment(tokensSrc), PATHS.tokens, refs);
  if (twSrc) {
    const twClean = twSrc.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
    collectVarRefs(twClean, PATHS.tailwind, refs);
  }
  const missing = [...new Set(refs.filter((r) => !defined.has(r.name.slice(2))).map((r) => r.name + '(' + r.file + ')'))];
  record('G7', '令牌引用完整性（brand.css / tokens.css / tailwind.preset.js 的 var(--x) 均有定义）',
    '未定义 ' + missing.length + ' 个（共 ' + refs.length + ' 处引用）', '未定义数 = 0',
    missing.length === 0, missing.length ? '缺：' + missing.join(', ') : '');

  /* G8：派生段与算法一致 */
  const section = extractDerivedSection(brandSrc);
  const expectLines = DERIVED_ORDER.map((n) => n + ': ' + ev[n] + ';');
  if (!section) {
    record('G8', '派生段与算法一致（brand.css @brand-derived == derive 输出）',
      '未找到 @brand-derived:start / :end 分节标记', 'diff = 0', false, '品牌层格式不符合契约 §9');
  } else {
    const gotLines = section.map((s) => s.replace(/\s+/g, ' ').replace(/;\s*$/, ';').trim());
    const diffs = [];
    for (let i = 0; i < Math.max(gotLines.length, expectLines.length); i++) {
      if (gotLines[i] !== expectLines[i]) {
        diffs.push('第 ' + (i + 1) + ' 行 文件「' + (gotLines[i] || '（缺）') + '」≠ 算法「' + (expectLines[i] || '（缺）') + '」');
      }
    }
    record('G8', '派生段与算法一致（brand.css @brand-derived == derive 输出）',
      'diff = ' + diffs.length, 'diff = 0', diffs.length === 0,
      diffs.length ? '共 ' + diffs.length + ' 条不一致：' + diffs.slice(0, 10).join('；') +
        (diffs.length > 10 ? '；（还有 ' + (diffs.length - 10) + ' 条，见 derive 输出）' : '') +
        ' —— 重跑 derive 覆盖派生段' : '');
  }


  /* G9：预设体检 —— brand.presets.css 是随仓库发布的产物，必须有门禁看着 */
  const presetsAbs = path.join(ROOT, PATHS.presets);
  if (!fs.existsSync(presetsAbs)) {
    record('G9', '预设体检（brand.presets.css）', '未找到 ' + PATHS.presets, '全部预设一致且 ≥' + CONTRAST_MIN + ':1', false,
      '预设是随仓库发布的产物，缺失即拦');
  } else {
    const presetBlocks = parseBrandBlocks(fs.readFileSync(presetsAbs, 'utf8'), PATHS.presets);
    const problems = [];
    let okCount = 0;
    for (const blk of presetBlocks) {
      const bad = [];
      try {
        const accDef = blk.decls.get('--brand-accent');
        if (!accDef) throw new Error('块内缺 --brand-accent');
        const acc = toColor(accDef.value, PATHS.presets + ' 第 ' + accDef.line + ' 行');
        /* ① 7 个派生值必须等于 derive(该块 --brand-accent) */
        const want = derive(acc, accent2).values;
        for (const n of PRESET_DERIVED) {
          const d = blk.decls.get(n);
          if (!d) { bad.push(n + ' 缺'); continue; }
          const got = toColor(d.value, PATHS.presets + ' 第 ' + d.line + ' 行');
          if (got !== want[n]) bad.push(n + ' 文件 ' + got + ' ≠ 算法 ' + want[n]);
        }
        /* ② 该预设自己的 G1 / G2 对比度 */
        const onAcc = blk.decls.get('--brand-on-accent');
        const onBright = blk.decls.get('--brand-on-accent-bright');
        const brightDef = blk.decls.get('--brand-accent-bright');
        if (onAcc) {
          const c1 = contrast(toColor(onAcc.value, ''), acc);
          if (c1 < CONTRAST_MIN - 1e-9) bad.push('G1 对比 ' + ratio(c1) + ' < ' + CONTRAST_MIN + ':1');
        }
        if (onBright && brightDef) {
          const c2 = contrast(toColor(onBright.value, ''), toColor(brightDef.value, ''));
          if (c2 < CONTRAST_MIN - 1e-9) bad.push('G2 对比 ' + ratio(c2) + ' < ' + CONTRAST_MIN + ':1');
        }
      } catch (e) {
        bad.push(e.message);
      }
      if (bad.length) problems.push('[' + blk.brand + '] ' + bad.join('；'));
      else okCount++;
    }
    if (presetBlocks.length === 0) {
      record('G9', '预设体检（brand.presets.css）', '未解析到 data-brand 预设块', '全部预设一致且 ≥' + CONTRAST_MIN + ':1', false,
        '应有 [data-brand="xxx"] 或 :root[data-brand="xxx"] 块');
    } else {
      record('G9', '预设体检（brand.presets.css ' + presetBlocks.length + ' 个预设）',
        okCount + '/' + presetBlocks.length + ' 一致且达标', '全部一致且 ≥' + CONTRAST_MIN + ':1', problems.length === 0,
        problems.length ? '共 ' + problems.length + ' 个预设不合格：' + problems.join(' ｜ ') : '');
    }
  }

  /* 附加信息（不影响退出码） */
  notes.push('派生参考：hover ' + ev['--brand-accent-hover'] + ' / active ' + ev['--brand-accent-active'] +
    ' / bright ' + ev['--brand-accent-bright'] + '（lNeeded ' + expected.meta.lNeeded.toFixed(3) +
    '，lBright ' + expected.meta.lBright.toFixed(3) + '）');
  return expected;
}

/* ================================ selftest ================================ */

function selftest() {
  const frozenStatus = statusColorsFrom(null, FROZEN);
  const results = [];

  /* 在"静默"模式下跑一遍门禁，拿到结构化结果（不打印） */
  function runQuiet(fn) {
    const savedLog = console.log;
    const g0 = gates.length, w0 = warns.length;
    console.log = () => {};
    try { fn(); } finally { console.log = savedLog; }
    const g = gates.splice(g0);
    const w = warns.splice(w0);
    return { gates: g, warns: w };
  }

  console.log('自检 · 3 个负例 + 1 个正例（默认品牌色 ' + '#1a6bff' + '）');

  /* 正例：默认品牌色 + 规范中性色，G1~G6 必须全 pass */
  {
    const r = runQuiet(() => runCandidateGates('#1a6bff', DEFAULT_BRAND_2, frozenStatus, FROZEN_TEXT, 'positive', null));
    const failed = r.gates.filter((g) => g.status === 'fail');
    const ok = failed.length === 0 && r.gates.length === 6;
    results.push({ label: '正例 默认 #1a6bff → G1~G6 全 pass', ok, detail: ok ? '' : failed.map((g) => g.id).join(',') });
  }

  /* 负例 1：G1 —— 亮品牌色 #ffd400 配手写的白字 --brand-on-accent */
  {
    const d = derive('#ffd400', DEFAULT_BRAND_2);
    const onAccent = { ...d.values, '--brand-on-accent': '#ffffff' };   // 模拟有人手写死白字
    const hex = onAccent['--brand-on-accent'], accent = d.accent;
    const g = runQuiet(() => {
      const c = contrast(hex, accent);
      record('G1', '按钮文字对比（--brand-on-accent / --brand-accent）', ratio(c) + '（' + hex + ' / ' + accent + '）',
        '≥ ' + CONTRAST_MIN + ':1', c >= CONTRAST_MIN - 1e-9, '');
    });
    const hit = g.gates.some((x) => x.id === 'G1' && x.status === 'fail');
    const c = contrast(hex, accent);
    results.push({
      label: '负例 1 G1：#ffd400 手写白字 --brand-on-accent: #ffffff',
      ok: hit,
      detail: '实测 ' + ratio(c) + ' < ' + CONTRAST_MIN + ':1（算法本来会选 ' + d.meta.onAccent.hex + '，' + ratio(d.meta.onAccent.contrast) + '）',
      got: g.gates,
    });
  }

  /* 负例 2：G4 —— hover 与默认值相同（ΔL = 0） */
  {
    const d = derive('#1a6bff', DEFAULT_BRAND_2);
    const v = d.values;
    const g = runQuiet(() => {
      gateDeltaL([
        ['hover', d.accent, d.accent],                                  // 手改成与默认值相同
        ['active', d.accent, v['--brand-accent-active']],
        ['bright-hover', v['--brand-accent-bright'], v['--brand-accent-bright-hover']],
        ['bright-active', v['--brand-accent-bright'], v['--brand-accent-bright-active']],
      ]);
    });
    const hit = g.gates.some((x) => x.id === 'G4' && x.status === 'fail');
    const dLs = [
      ['hover', d.accent, d.accent],
      ['active', d.accent, v['--brand-accent-active']],
    ].map(([, a, b]) => hexToOklab(b).L - hexToOklab(a).L);
    results.push({
      label: '负例 2 G4：--brand-accent-hover 手改成与 --brand-accent 相同',
      ok: hit,
      detail: 'hover ΔL = ' + signed(dLs[0]) + ' < ' + DL_MIN.toFixed(2) + '（active 仍为 ' + signed(dLs[1]) + '）',
      got: g.gates,
    });
  }

  /* 负例 3：G5 —— #c2410c 撞 --color-error 色相 */
  {
    const g = runQuiet(() => gateHue('#c2410c', frozenStatus, '品牌主色'));
    const failed = g.gates.filter((x) => x.id === 'G5' && x.status === 'fail');
    results.push({
      label: '负例 3 G5：#c2410c 与 --color-error 撞色',
      ok: failed.length === 1,
      detail: failed.length ? failed[0].detail : '未按预期拦下',
      got: g.gates,
    });
  }

  let allOk = true;
  for (const r of results) {
    console.log('');
    console.log((r.ok ? '✓ ' : '✗ ') + r.label);
    if (!r.ok && r.got) for (const g of r.got) printLine(g);
    if (r.detail) console.log('    ' + r.detail);
    if (!r.ok) allOk = false;
  }
  console.log('');
  const negs = results.slice(1);
  const negOk = negs.every((r) => r.ok);
  console.log('结果：' + (allOk ? '3 个负例全部按预期被拦，正例 G1~G6 全 pass' : '自检未通过') +
    '（负例 ' + negs.filter((r) => r.ok).length + '/3' + (results[0].ok ? '，正例 pass' : '，正例 FAIL') + '）');
  return allOk && negOk;
}

/* ================================== CLI =================================== */

const ROOT = path.dirname(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)));

const USAGE = [
  '用法：',
  "  node scripts/brand.mjs check                                       读 tokens/brand.css + tokens/tokens.css + tokens/brand.presets.css，跑 G1~G9",
  "  node scripts/brand.mjs check --brand '#0e7a5f' [--brand-2 '#hex']  不读文件，直接体检候选品牌色，跑 G1~G6",
  "  node scripts/brand.mjs derive '#0e7a5f' [--brand-2 '#hex']         打印 10 行派生段（两空格缩进 / 小写 hex / 行尾分号）",
  '  node scripts/brand.mjs selftest                                    3 个负例自检，全部按预期被拦才 exit 0',
].join('\n');

function parseArgs(argv) {
  const out = { brand: null, brand2: null, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--brand' || a === '--brand-2') {
      const val = argv[i + 1];
      if (!val || val.startsWith('--')) throw new Error(a + ' 后面缺少 hex 值');
      if (a === '--brand') out.brand = val; else out.brand2 = val;
      i++;
    } else if (a.startsWith('--brand=')) {
      out.brand = a.slice('--brand='.length);
    } else if (a.startsWith('--brand-2=')) {
      out.brand2 = a.slice('--brand-2='.length);
    } else if (a === '-h' || a === '--help') {
      out.help = true;
    } else if (a.startsWith('-')) {
      throw new Error('无法识别的参数：' + a);
    } else {
      out.positional.push(a);        // derive '#hex' 的位置参数
    }
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === '-h' || cmd === '--help') {
    console.log(USAGE);
    return cmd ? 0 : 1;
  }

  let opts;
  try { opts = parseArgs(argv.slice(1)); }
  catch (e) { console.error('参数错误：' + e.message + '\n\n' + USAGE); return 1; }

  if (cmd === 'derive') {
    const hex = opts.brand || opts.positional[0];
    if (!hex) { console.error('derive 需要品牌主色：node scripts/brand.mjs derive \'#0e7a5f\'\n\n' + USAGE); return 1; }
    if (opts.positional.length > 1) { console.error('derive 只接受一个品牌主色（第二色用 --brand-2 \'#hex\'）\n\n' + USAGE); return 1; }
    try {
      for (const line of deriveLines(hex, opts.brand2 || DEFAULT_BRAND_2)) console.log(line);
      return 0;
    } catch (e) {
      console.error('错误：' + e.message);
      return 1;
    }
  }

  if (cmd === 'check') {
    try {
      if (!opts.brand && opts.positional.length) {
        console.error('候选模式请写 --brand：node scripts/brand.mjs check --brand \'' + opts.positional[0] + '\'\n\n' + USAGE);
        return 1;
      }
      if (opts.brand) {
        runCandidateGates(opts.brand, opts.brand2 || DEFAULT_BRAND_2,
          statusColorsFrom(null, FROZEN), FROZEN_TEXT, '候选品牌色', purpleFromTokens());
        for (const g of gates) printLine(g);
        for (const w of warns.slice().sort((a, b) => a.id.localeCompare(b.id))) printLine(w);
        return summarize() ? 0 : 1;
      }
      if (opts.brand2) { console.error('check 不带 --brand 时不能只给 --brand-2（文件模式的第二色来自 tokens/brand.css）\n\n' + USAGE); return 1; }
      runFileGates();
      for (const g of gates) printLine(g);
      for (const w of warns.slice().sort((a, b) => a.id.localeCompare(b.id))) printLine(w);
      for (const n of notes) console.log('说明：' + n);
      return summarize() ? 0 : 1;
    } catch (e) {
      if (e instanceof CssError) { console.error('解析失败：' + e.message); return 1; }
      console.error('错误：' + e.message);
      return 1;
    }
  }

  if (cmd === 'selftest') {
    try {
      return selftest() ? 0 : 1;
    } catch (e) {
      console.error('自检异常：' + e.message);
      return 1;
    }
  }

  console.error('未知子命令：' + cmd + '\n\n' + USAGE);
  return 1;
}

process.exit(main());
