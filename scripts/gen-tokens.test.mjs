import { readFileSync } from 'node:fs';
import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';
import { beforeAll, describe, expect, it } from 'vitest';

// 生成物锁值 = spec §2.1/§2.3 的可执行契约(docs/superpowers/specs/2026-10-18-sleepy-site-design.md)。
// 双轨对账:测试不经生成器代码路径,独立用 theme.palettes 重算 neutralVariant tone 再与 theme.css 比对。
// 变红 = token 表被改动;必须逐值对 spec 审读后才允许更新期望。

const SEED = '#9B87FE';
const theme = themeFromSourceColor(argbFromHex(SEED));
const nv = theme.palettes.neutralVariant;
const neutral = theme.palettes.neutral;

// spec §2.1 容器阶梯(surface/surfaceDim/surfaceBright/surfaceContainer* 全部 neutralVariant tone)
const LADDER = [
  ['surface', { l: 98, d: 6 }],
  ['surface-dim', { l: 87, d: 6 }],
  ['surface-bright', { l: 98, d: 24 }],
  ['surface-container-lowest', { l: 100, d: 4 }],
  ['surface-container-low', { l: 96, d: 10 }],
  ['surface-container', { l: 94, d: 12 }],
  ['surface-container-high', { l: 92, d: 17 }],
  ['surface-container-highest', { l: 90, d: 22 }],
];

let lightBlock, darkBlock, motion;

beforeAll(() => {
  const css = readFileSync(new URL('../src/tokens/theme.css', import.meta.url), 'utf8');
  lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('[data-theme=dark]'));
  darkBlock = css.slice(css.indexOf('[data-theme=dark]'));
  motion = readFileSync(new URL('../src/tokens/motion.css', import.meta.url), 'utf8');
});

const varOf = (block, name) => {
  const m = block.match(new RegExp(`--${name}: (#[0-9A-Fa-f]{6})`));
  return m ? m[1].toUpperCase() : null;
};

describe('theme.css 角色直出(v0.3.0 scheme 复核值, spec §2.1)', () => {
  it('light primary = #604BBF', () => {
    expect(varOf(lightBlock, 'md-sys-color-primary')).toBe('#604BBF');
  });
  it('dark primary = #CABEFF', () => {
    expect(varOf(darkBlock, 'md-sys-color-primary')).toBe('#CABEFF');
  });
  it('primaryContainer L #E6DEFF / D #4830A5', () => {
    expect(varOf(lightBlock, 'md-sys-color-primary-container')).toBe('#E6DEFF');
    expect(varOf(darkBlock, 'md-sys-color-primary-container')).toBe('#4830A5');
  });
});

describe('容器阶梯 = neutralVariant tone 双轨对账(spec §2.1 v3 纠值)', () => {
  it.each(LADDER)('%s L = neutralVariant.tone', (role, t) => {
    expect(varOf(lightBlock, `md-sys-color-${role}`)).toBe(hexFromArgb(nv.tone(t.l)).toUpperCase());
  });
  it.each(LADDER)('%s D = neutralVariant.tone', (role, t) => {
    expect(varOf(darkBlock, `md-sys-color-${role}`)).toBe(hexFromArgb(nv.tone(t.d)).toUpperCase());
  });
  it('dark highest ≠ neutral 同档(生成器必须走 neutralVariant,非 v2 之误 neutral)', () => {
    const wrong = hexFromArgb(neutral.tone(22)).toUpperCase();
    expect(varOf(darkBlock, 'md-sys-color-surface-container-highest')).not.toBe(wrong);
  });
  it('light 五档容器严格互异 = 100/96/94/92/90 单调', () => {
    const vals = ['lowest', 'low', '', 'high', 'highest'].map((s) =>
      varOf(lightBlock, `md-sys-color-surface-container${s ? `-${s}` : ''}`),
    );
    expect(new Set(vals).size).toBe(5);
  });
});

describe('必备角色全集存在性(spec §2.1)', () => {
  const required = [
    'primary', 'on-primary', 'primary-container', 'on-primary-container',
    'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
    'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
    'error', 'on-error', 'error-container', 'on-error-container',
    'surface', 'surface-dim', 'surface-bright', 'surface-variant', 'on-surface-variant',
    'surface-container-lowest', 'surface-container-low', 'surface-container',
    'surface-container-high', 'surface-container-highest',
    'outline', 'outline-variant', 'scrim',
    'inverse-surface', 'inverse-on-surface', 'inverse-primary',
    'background', 'on-background', 'on-surface',
  ];
  it.each(required)('--md-sys-color-%s 双模存在', (role) => {
    expect(varOf(lightBlock, `md-sys-color-${role}`)).not.toBeNull();
    expect(varOf(darkBlock, `md-sys-color-${role}`)).not.toBeNull();
  });
  it('scrim 双模 = #000000(M3 dialog scrim 基色, 32% 由用法侧给)', () => {
    expect(varOf(lightBlock, 'md-sys-color-scrim')).toBe('#000000');
    expect(varOf(darkBlock, 'md-sys-color-scrim')).toBe('#000000');
  });
});

describe('motion.css 官方时长表(spec §2.3 v3 纠编造)', () => {
  const table = {
    'duration-short1': 50, 'duration-short2': 100, 'duration-short3': 150, 'duration-short4': 200,
    'duration-medium1': 250, 'duration-medium2': 300, 'duration-medium3': 350, 'duration-medium4': 400,
    'duration-long1': 450, 'duration-long2': 500, 'duration-long3': 550, 'duration-long4': 600,
    'duration-extra-long1': 700, 'duration-extra-long2': 800, 'duration-extra-long3': 900, 'duration-extra-long4': 1000,
  };
  it.each(Object.entries(table))('--md-sys-motion-%s = %sms', (name, ms) => {
    expect(motion).toContain(`--md-sys-motion-${name}: ${ms}ms`);
  });
  it('easing 三支', () => {
    expect(motion).toContain('cubic-bezier(0.2, 0, 0, 1)');
    expect(motion).toContain('cubic-bezier(0.05, 0.7, 0.1, 1)');
    expect(motion).toContain('cubic-bezier(0.3, 0, 0.8, 0.15)');
  });
  it('stagger 60ms 站点常量(注非-M3)', () => {
    expect(motion).toContain('--site-stagger: 60ms');
  });
});
