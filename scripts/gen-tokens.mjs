// M3 token 生成器 — spec §2.1/§2.3(docs/superpowers/specs/2026-10-18-sleepy-site-design.md)
// 用法: npm run tokens(生成物 src/tokens/theme.css + motion.css 入 git;改值先改本脚本)
// 种子: #9B87FE(logo 抽色芯簇, PIL 实测 99.7% 紫带)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';

const SEED = '#9B87FE';
const theme = themeFromSourceColor(argbFromHex(SEED));

// —— scheme 直出角色(v0.3.0 DynamicScheme 字段名 = M3 role 表)——
const SCHEME_ROLES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground', 'onSurface',
  'surfaceVariant', 'onSurfaceVariant',
  'outline', 'outlineVariant', 'scrim',
  'inverseSurface', 'inverseOnSurface', 'inversePrimary',
];

// —— 手生成角色:v0.3.0 scheme 无 surfaceDim/surfaceBright/surfaceContainer*
// (这些是 Material Theme Builder 后期才加的角色;缺则全部走 neutralVariant tone,
//  spec §2.1 v3 纠 v2:容器阶梯 = neutralVariant 非 neutral——官方 Android Color.md
//  dynamic 容器映射到 neutral_variant 调色板)——
// spec §2.1 终值:容器五档 lowest→highest = L t100/96/94/92/90 · D t4/10/12/17/22
// surface(=scheme.surface 同档 t98/t6 复核一致) / Dim L t87 · D t6 / Bright L t98 · D t24
const NEUTRAL_VARIANT_LADDER = {
  surface: { light: 98, dark: 6 },
  'surface-dim': { light: 87, dark: 6 },
  'surface-bright': { light: 98, dark: 24 },
  'surface-container-lowest': { light: 100, dark: 4 },
  'surface-container-low': { light: 96, dark: 10 },
  'surface-container': { light: 94, dark: 12 },
  'surface-container-high': { light: 92, dark: 17 },
  'surface-container-highest': { light: 90, dark: 22 },
};

const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const upper = (hex) => hex.toUpperCase();

function block(mode) {
  const scheme = theme.schemes[mode];
  const nv = theme.palettes.neutralVariant;
  const lines = [];
  for (const role of SCHEME_ROLES) {
    lines.push(`  --md-sys-color-${kebab(role)}: ${upper(hexFromArgb(scheme[role]))};`);
  }
  for (const [role, t] of Object.entries(NEUTRAL_VARIANT_LADDER)) {
    lines.push(`  --md-sys-color-${role}: ${upper(hexFromArgb(nv.tone(t[mode === 'light' ? 'light' : 'dark'])))};`);
  }
  return lines.join('\n');
}

const outDir = fileURLToPath(new URL('../src/tokens', import.meta.url));
mkdirSync(outDir, { recursive: true });

writeFileSync(
  `${outDir}/theme.css`,
  `/* GENERATED — 勿手改。再生成: npm run tokens
 * 脚本: scripts/gen-tokens.mjs · 种子: ${SEED}(logo 抽色)
 * 库: @material/material-color-utilities@0.3.0(0.4.x ESM bug 锁旧版)
 * surface/surfaceDim/Bright/surfaceContainer* = palettes.neutralVariant.tone()(spec §2.1 v3)
 */
:root {
${block('light')}
}

[data-theme=dark] {
${block('dark')}
}
`,
);

// —— motion:官方时长表(m3.material.io tokens-specs,审查员逐值核实;spec §2.3 v3 纠编造)——
const DURATIONS = {
  'duration-short1': 50, 'duration-short2': 100, 'duration-short3': 150, 'duration-short4': 200,
  'duration-medium1': 250, 'duration-medium2': 300, 'duration-medium3': 350, 'duration-medium4': 400,
  'duration-long1': 450, 'duration-long2': 500, 'duration-long3': 550, 'duration-long4': 600,
  'duration-extra-long1': 700, 'duration-extra-long2': 800, 'duration-extra-long3': 900, 'duration-extra-long4': 1000,
};

writeFileSync(
  `${outDir}/motion.css`,
  `/* GENERATED — 勿手改。再生成: npm run tokens
 * 时长 = M3 官方 tokens-specs 表值(spec §2.3 v3);easing 三支同表。
 * 配对(站点约定): enter=medium4 400ms emph-decel · exit=short4 200ms emph-accel · in-place=long2 500ms emphasized
 * 注: M3 easing/duration 体系官方标「no longer maintained」,Expressive 弹簧 Web 端不可用(§0 非目标)——可见决策。
 */
:root {
${Object.entries(DURATIONS).map(([k, v]) => `  --md-sys-motion-${k}: ${v}ms;`).join('\n')}
  --md-sys-motion-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --md-sys-motion-easing-emphasize-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --md-sys-motion-easing-emphasize-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
  --site-stagger: 60ms; /* 滚动揭示错峰,站点常量非 M3 token(spec §2.3) */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --md-sys-motion-duration-short1: 0ms;
    --md-sys-motion-duration-short2: 0ms;
    --md-sys-motion-duration-short3: 0ms;
    --md-sys-motion-duration-short4: 0ms;
    --md-sys-motion-duration-medium1: 0ms;
    --md-sys-motion-duration-medium2: 0ms;
    --md-sys-motion-duration-medium3: 0ms;
    --md-sys-motion-duration-medium4: 0ms;
    --md-sys-motion-duration-long1: 0ms;
    --md-sys-motion-duration-long2: 0ms;
    --md-sys-motion-duration-long3: 0ms;
    --md-sys-motion-duration-long4: 0ms;
    --md-sys-motion-duration-extra-long1: 0ms;
    --md-sys-motion-duration-extra-long2: 0ms;
    --md-sys-motion-duration-extra-long3: 0ms;
    --md-sys-motion-duration-extra-long4: 0ms;
    --site-stagger: 0ms;
  }
}
`,
);

console.log('theme.css + motion.css 已生成(src/tokens/,种子', SEED, ')');
