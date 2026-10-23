import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// T5 布局壳静态闸(spec §2.1/§2.2/§2.3/§2.4 可 grep 的部分):
// CSS/组件源码文本断言——DOM 级验收(data-blob 计数=3)在 T6 页面就位后测。

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const globalCss = read('../styles/global.css');
const base = read('../layouts/Base.astro');
const appBar = read('../components/AppBar.astro');
const blob = read('../components/Blob.astro');
const footer = read('../components/Footer.astro');
const ui = read('../i18n/ui.ts');

describe('global.css 设计契约(spec §2.2)', () => {
  it('控件描边用 outline,禁 outlineVariant(WCAG 非文本 1.67:1 教训)', () => {
    const controlRules = globalCss.match(/\.site-(chip|field|button|search)[^{]*\{[^}]*\}/g) ?? [];
    expect(controlRules.length).toBeGreaterThan(0);
    // 控件规则里 outlineVariant 绝迹
    for (const rule of controlRules) {
      expect(rule).not.toMatch(/outline-variant/);
    }
    // 实描边(非 none/transparent)必 = outline;受约束控件(outlined 按钮/field/chip)≥3
    let outlined = 0;
    for (const rule of controlRules) {
      if (/border:\s*[^nt\s][^;]*;/.test(rule)) {
        expect(rule).toMatch(/var\(--md-sys-color-outline\)/);
        outlined++;
      }
    }
    expect(outlined).toBeGreaterThanOrEqual(3);
    // outlineVariant 全文件仅 .site-divider 一处(连字符形式 = 变量引用)
    expect((globalCss.match(/--md-sys-color-outline-variant/g) ?? []).length).toBe(1);
    const dividerIdx = globalCss.indexOf('.site-divider');
    expect(dividerIdx).toBeGreaterThan(0);
    expect(globalCss.indexOf('--md-sys-color-outline-variant')).toBeGreaterThan(dividerIdx);
  });
  it('lightbox scrim = #000000 32%(M3 dialog 值,spec §2.2)', () => {
    expect(globalCss).toMatch(/--site-lightbox-scrim:\s*rgba\(0,\s*0,\s*0,\s*0\.32\)/);
  });
  it('15 阶 M3 type scale 全量', () => {
    for (const t of ['display-large', 'display-medium', 'display-small', 'headline-large', 'headline-medium', 'headline-small', 'title-large', 'title-medium', 'title-small', 'body-large', 'body-medium', 'body-small', 'label-large', 'label-medium', 'label-small']) {
      expect(globalCss).toContain(`--md-sys-typescale-${t}`);
    }
  });
  it('shape 六档 xs4/sm8/md12/lg16/xl28 + full9999', () => {
    expect(globalCss).toMatch(/--md-sys-shape-corner-small:\s*8px/);
    expect(globalCss).toMatch(/--md-sys-shape-corner-medium:\s*12px/);
    expect(globalCss).toMatch(/--md-sys-shape-corner-full:\s*9999px/);
  });
  it('CJK 系统栈(不拖 Noto Web 字体,spec §2.2 定案)', () => {
    expect(globalCss).toContain('PingFang SC');
    expect(globalCss).toContain('HarmonyOS Sans SC');
    expect(globalCss).toContain('Microsoft YaHei');
  });
  it('reduced-motion reveal 升档:opacity 200ms 淡入 + 位移归零(v4 spec §6,旧 §2.3「0ms 直出」契约随 v4 废弃)', () => {
    const reduceBlock = globalCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/);
    expect(reduceBlock, 'global.css 须有 reduce 块').not.toBeNull();
    expect(reduceBlock[0]).toMatch(/transition:\s*opacity 200ms ease/);
    expect(reduceBlock[0]).toMatch(/transform:\s*none/);
    // 旧「直出 opacity:1」必须绝迹:opacity 交由 data-revealed 控制
    expect(reduceBlock[0]).not.toMatch(/\.js \.reveal\s*\{[^}]*opacity:\s*1\s*[;}]/);
    expect(globalCss).toMatch(/\.js \.reveal\[data-revealed='true'\]\s*\{[^}]*opacity:\s*1/);
  });
  it('内容列 1040dp + section 间距 128/80(spec §2.2/§2.4)', () => {
    expect(globalCss).toContain('--site-content-col: 1040px');
    expect(globalCss).toContain('--site-section-gap: 128px');
    expect(globalCss).toContain('80px');
  });
  it('段距三档 128/80/48 + ≤600px 档切 gap-small(v4 spec §5.2/§9)', () => {
    expect(globalCss).toContain('--site-section-gap-narrow: 80px');
    expect(globalCss).toMatch(/--site-section-gap-small:\s*48px/);
    const narrow = globalCss.match(/@media \(max-width: 600px\)\s*\{\s*:root\s*\{[^}]*--site-section-gap:\s*var\(--site-section-gap-small\)/);
    expect(narrow, '≤600px 档必须切换 --site-section-gap 至 gap-small').not.toBeNull();
    // 档位次序:600 块在 840 块之后(级联后置才准 ≤600 覆盖 ≤840)
    expect(globalCss.indexOf('@media (max-width: 600px)')).toBeGreaterThan(
      globalCss.indexOf('@media (max-width: 840px)')
    );
  });
  it('锚点落点避 sticky AppBar:section[id]{scroll-margin-top:80px}(v4 spec §4)', () => {
    expect(globalCss).toMatch(/section\[id\]\s*\{[^}]*scroll-margin-top:\s*80px/);
  });
  it('红线词零出现(赋能/极致/匠心,spec §2.5)', () => {
    for (const word of ['赋能', '极致', '匠心']) {
      expect(globalCss).not.toContain(word);
    }
  });
});

describe('Base.astro head 契约(spec §1/§3)', () => {
  it('FOUC 守卫 = <head> 内联脚本先读 localStorage 再进首帧', () => {
    expect(base).toContain('is:inline');
    expect(base).toContain('sleepy-theme');
    expect(base).toContain('data-theme');
    expect(base).toContain('prefers-color-scheme');
  });
  it('hreflang 双指 zh/en + x-default', () => {
    expect(base).toContain('hreflang="zh-CN"');
    expect(base).toContain('hreflang="en"');
    expect(base).toContain('hreflang="x-default"');
  });
  it('构建 meta:tag+builtAt 经 Base→Footer 落 data-build,可见腐烂信号(spec §4.2)', () => {
    expect(base).toContain('release.json');
    expect(base).toMatch(/build=/);
    expect(footer).toMatch(/data-build=/);
  });
  it('og + twitter 基础 meta', () => {
    expect(base).toContain('og:title');
    expect(base).toContain('twitter:card');
  });
});

describe('AppBar.astro(spec §2.2/§2.5)', () => {
  it('sticky 定位', () => {
    expect(appBar).toMatch(/position:\s*sticky/);
  });
  it('滚动态 tonal surface→surfaceContainer,无阴影', () => {
    expect(appBar).toContain('--md-sys-color-surface-container');
    expect(appBar).not.toMatch(/box-shadow/);
  });
  it('明暗按钮 tooltip「晚课专用。」逐字', () => {
    expect(appBar).toContain('晚课专用。');
  });
  it('zh|EN 语言切换', () => {
    expect(appBar).toContain('EN');
  });
});

describe('Blob.astro 三档定值(spec §2.4,数值定死)', () => {
  it('hue 0/+15/-15° 三档 + stops 角 135/90/200 成对', () => {
    expect(blob).toContain('293.82');
    expect(blob).toContain('308.82');
    expect(blob).toContain('278.82');
    expect(blob).toContain('135deg');
    expect(blob).toContain('90deg');
    expect(blob).toContain('200deg');
  });
  it('data-blob 属性(mechanical 验收锚,spec §6)', () => {
    expect(blob).toContain('data-blob');
  });
});

describe('Footer.astro(spec §2.5)', () => {
  it('inverse-surface 底 + blob#3', () => {
    expect(footer).toContain('--md-sys-color-inverse-surface');
    expect(footer).toMatch(/variant=\{2\}|variant=2/);
  });
  it('GPL + QQ 群号 + sponsor 钉死链接(值在 ui.ts,Footer 引用)', () => {
    expect(footer).toContain('GPL');
    expect(ui).toContain('1063407652');
    expect(ui).toContain('https://github.com/lingion/sleepy/blob/main/sponsor.md');
    expect(footer).toContain('{qqGroup}');
    expect(footer).toContain('{sponsorUrl}');
  });
});
