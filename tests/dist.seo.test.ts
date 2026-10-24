import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site } from '../src/i18n/ui';

// v5 分发基建产物闸(spec §2.6/§8;Task 2 起步,Task 8 续增 OG/robots/RSS/JSON-LD 用例)。
// 消费 dist/client/index.html 与 dist/client/en/index.html —— 先跑 npm run build。
// 本文件 Task 2 落地四用例:多页化回归守卫(hreflang/语言链允许绿)+ 改造先红项(锚点绝对化/hasHero 方向锁)。

const read = (p: string) => {
  try {
    return readFileSync(new URL(p, import.meta.url), 'utf8');
  } catch {
    throw new Error(`${p} 不存在——先跑 npm run build 再跑本测试(spec §6 产物级验收)`);
  }
};

const zhDoc = new JSDOM(read('../dist/client/index.html')).window.document;
const enDoc = new JSDOM(read('../dist/client/en/index.html')).window.document;
const zhHead = zhDoc.querySelector('head')!;

describe('hreflang 多页化(Base 语义对,spec §2.6-2)', () => {
  it('zh 主页双指本页对:zh-CN→/ · en→/en/(Task 2 回归守卫,v4 值恰同)', () => {
    expect(zhHead.querySelector('link[hreflang="zh-CN"]')!.getAttribute('href')).toBe(site + '/');
    expect(zhHead.querySelector('link[hreflang="en"]')!.getAttribute('href')).toBe(site + '/en/');
    expect(zhHead.querySelector('link[hreflang="x-default"]')!.getAttribute('href')).toBe(site + '/');
  });
  it('en 主页双指本页对:zh-CN→/ · en→/en/', () => {
    const head = enDoc.querySelector('head')!;
    expect(head.querySelector('link[hreflang="zh-CN"]')!.getAttribute('href')).toBe(site + '/');
    expect(head.querySelector('link[hreflang="en"]')!.getAttribute('href')).toBe(site + '/en/');
  });
});

describe('AppBar 跨页锚点(spec §2.1 绝对路径不变量)', () => {
  it('zh 主页四 href = /#views · /schools/ · /faq/ · //#reminders', () => {
    for (const h of ['/#views', '/schools/', '/faq/', '/#reminders'])
      expect(zhDoc.querySelector(`#appbar a[href="${h}"]`), h).not.toBeNull();
  });
  it('en 主页四 href = /en/#views · /en/schools/ · /en/faq/ · /en/#reminders', () => {
    for (const h of ['/en/#views', '/en/schools/', '/en/faq/', '/en/#reminders'])
      expect(enDoc.querySelector(`#appbar a[href="${h}"]`), h).not.toBeNull();
  });
  it('裸 # 锚点绝迹 + 旧 #trust/#schools 锚点绝迹(负闸)', () => {
    const anchors = [...zhDoc.querySelectorAll('#appbar nav a')];
    for (const a of anchors) {
      expect(a.getAttribute('href')?.startsWith('#'), a.textContent ?? '').toBe(false);
      expect(a.getAttribute('href')).not.toBe('#trust');
      expect(a.getAttribute('href')).not.toBe('#schools');
    }
  });
  it('CTA 钮 href 站内 /download/(zh)与 /en/download/(en)', () => {
    expect(zhDoc.querySelector('#appbar [data-appbar-cta]')!.getAttribute('href')).toBe('/download/');
    expect(enDoc.querySelector('#appbar [data-appbar-cta]')!.getAttribute('href')).toBe('/en/download/');
  });
});

describe('AppBar CTA 缺省态 prop 化 + 语言链 mirror(源码方向锁)', () => {
  const src = read('../src/components/AppBar.astro');
  it('缺省态三元 hasHero ? show : hide(方向锁:反转即红)', () => {
    expect(src).toMatch(/hasHero\s*\?\s*['"]show['"]\s*:\s*['"]hide['"]/);
    expect(src).not.toMatch(/hasHero\s*\?\s*['"]hide['"]\s*:\s*['"]show['"]/);
  });
  it('语言链读 mirror,单页假设 ternary 绝迹', () => {
    // 正闸:.appbar__lang 的 href 属性消费 mirror prop
    expect(src).toMatch(/class="site-chip appbar__lang[^"]*"\s+href=\{mirror\}/);
    // 负闸:旧形态 = href 属性内直接写单页 ternary;prop 缺省值回退(planned「缺省回退单页值」)不算残留
    expect(src).not.toMatch(/href=\{lang === 'zh' \? '\/en\/' : '\/'\}/);
  });
  it('trust 锚点项与锚点键绝迹(AppBar 源码不再引 anchors.trust)', () => {
    expect(src).not.toMatch(/anchors\.trust/);
    expect(src).not.toContain('#trust');
  });
});

describe('en 主页语言链回归守卫(mirror 值不变,终审 I4)', () => {
  it('en 页 .appbar__lang href 仍为 /(改造前后同值,防透传断线)', () => {
    expect(enDoc.querySelector('.appbar__lang')!.getAttribute('href')).toBe('/');
  });
  it('zh 页 .appbar__lang href 仍为 /en/', () => {
    expect(zhDoc.querySelector('.appbar__lang')!.getAttribute('href')).toBe('/en/');
  });
});
