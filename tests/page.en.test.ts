import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { zh } from '../src/i18n/zh';
import { en } from '../src/i18n/en';
import schools from '../src/data/schools.grouped.json';
import { matchSchool } from '../src/lib/search';
import { site } from '../src/i18n/ui';

// v4 EN 镜像产物闸(§7 R5 同形 + §14 再基线):dist/client/en/index.html。
// 校名保中文是设计(spec §4.1),所以「无中文泄漏」= zh.ts 叶子文案零出现,而不是整页无汉字。

const HTML = (() => {
  try {
    return readFileSync(new URL('../dist/client/en/index.html', import.meta.url), 'utf8');
  } catch {
    throw new Error('dist/client/en/index.html 不存在——先跑 npm run build');
  }
})();
const dom = new JSDOM(HTML);
const doc = dom.window.document;

describe('/en/ hreflang 互指(spec §1)', () => {
  it('zh-CN ↔ en 双向 + x-default', () => {
    const alts = [...doc.querySelectorAll('link[rel="alternate"][hreflang]')];
    const map = new Map(alts.map((a) => [a.getAttribute('hreflang'), a.getAttribute('href')]));
    expect(map.get('zh-CN')).toBe(site + '/');
    expect(map.get('en')).toBe(site + '/en/');
    expect(map.get('x-default')).toBe(site + '/');
  });
  it('canonical 指向 /en/,lang=en', () => {
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(site + '/en/');
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
  });
});

describe('/en/ 结构镜像(v5 八段)', () => {
  const ids = ['hero', 'views', 'connect', 'schoolCard', 'reminders', 'gallery', 'trust', 'download'];
  const PROTO: Record<string, string> = {
    hero: 'split', views: 'showcase', connect: 'edit-split', schoolCard: 'entry-card',
    reminders: 'pinned', gallery: 'full-bleed-band', trust: 'narration', download: 'tonal-band',
  };
  it('八段依序 + data-prototype 同 zh 页', () => {
    const secs = [...doc.querySelectorAll('main > section')];
    expect(secs.map((s) => s.id)).toEqual(ids);
    for (const s of secs) expect(s.getAttribute('data-prototype'), `#${s.id}`).toBe(PROTO[s.id]);
  });
  it('blob 恰一 = hero', () => {
    const blobs = [...doc.querySelectorAll('[data-blob]')];
    expect(blobs.length).toBe(1);
    expect(blobs[0].getAttribute('data-blob')).toBe('0');
  });
  it('embeds the complete original web app at its unchanged URL with English accessible copy', () => {
    const frame = doc.querySelector('#hero iframe[data-timetable-demo]');
    expect(doc.querySelectorAll('iframe').length).toBe(1);
    expect(frame?.getAttribute('title')).toBe(en.hero.demoTitle);
    expect(frame?.getAttribute('src')).toBe('https://sleepy.is-my.app/preview/');
    const url = new URL(frame!.getAttribute('src')!);
    expect(url.search).toBe('');
    expect(url.hash).toBe('');
    expect(doc.querySelector('#hero img')).toBeNull();
    expect(doc.querySelector('link[rel="preload"][as="image"]')).toBeNull();
  });
  it('keeps the original copy-first visual position', () => {
    const grid = doc.querySelector('#hero .hero__grid')!;
    expect([...grid.children].map((el) => el.className)).toEqual(['hero__copy', 'hero__device']);
    expect(grid.querySelector('.hero__device > iframe')).not.toBeNull();
  });
  it('provides the same full original URL for opening a new tab', () => {
    const link = doc.querySelector('.hero__demo-caption a');
    expect(link?.getAttribute('href')).toBe('https://sleepy.is-my.app/preview/');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('runs the full original web app without sandbox restrictions', () => {
    const frame = doc.querySelector('#hero iframe')!;
    expect(frame.hasAttribute('sandbox')).toBe(false);
  });
  it('does not rewrite the web app URL when the host theme changes', () => {
    const source = readFileSync(new URL('../src/components/sections/Hero.astro', import.meta.url), 'utf8');
    expect(source).not.toMatch(/syncTheme|searchParams|MutationObserver/);
    const scripts = [...doc.scripts].map((script) => script.textContent ?? '').join('\n');
    expect(scripts).not.toMatch(/searchParams\s*\.\s*set\s*\(\s*['"`]theme['"`]/);
  });
  it('describes the full original web app in English', () => {
    expect(doc.querySelector('#hero iframe')?.getAttribute('title')).toBe('Full Sleepy web app');
    expect(doc.querySelector('.hero__demo-caption')?.textContent).toContain('original interface and features');
    expect(doc.querySelector('.hero__demo-caption a')?.textContent).toBe('Open full web app in a new tab');
  });
  it('AppBar 4 导航项(en 前缀绝对路径)+ data-appbar-cta', () => {
    for (const h of ['/en/#views', '/en/schools/', '/en/faq/', '/en/#reminders']) {
      expect(doc.querySelector(`#appbar a[href="${h}"]`), h).not.toBeNull();
    }
    expect(doc.querySelector('#appbar [data-appbar-cta]')).not.toBeNull();
  });
  it('语言链指向 zh 主页', () => {
    expect(doc.querySelector('.appbar__lang')?.getAttribute('href')).toBe('/');
  });
});

describe('/en/ 无 zh 文案泄漏(组件 props 全覆盖)', () => {
  const leaves: string[] = [];
  (function walk(o: object) {
    for (const v of Object.values(o)) {
      if (typeof v === 'string' && /[一-鿿]/.test(v)) leaves.push(v);
      else if (v && typeof v === 'object') walk(v);
    }
  })(zh);
  it('zh.ts 全部含汉字叶子在 EN 页零出现', () => {
    for (const s of leaves) expect(HTML.includes(s), `泄漏: ${s.slice(0, 20)}`).toBe(false);
  });
  it('EN 页 en.ts 关键串在场(组件 copy=en 全覆盖反证;trial/schools.heading pin 随 §10 迁出主页)', () => {
    // 可见文本 = 剔除 script/style 体(内联脚本的 ?. / ?? 会污染问句闸)
    const clone = doc.body!.cloneNode(true) as DocumentFragment;
    for (const n of clone.querySelectorAll('script, style')) n.remove();
    const text = (clone.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toContain(en.hero.slogan); // slogan A 案现值(en.ts 单点,§7.2 签收前可换)
    expect(text).toContain(en.gallery.heading);
  });
  it('EN 页零问号(R2 双语同规)', () => {
    const clone = doc.body!.cloneNode(true) as DocumentFragment;
    for (const n of clone.querySelectorAll('script, style')) n.remove();
    expect(clone.textContent ?? '').not.toMatch(/[?？]/);
  });
});

describe('EN 检索数据侧(spec §4.1 jiaotong 例)', () => {
  it('拼音查询在真实数据命中多校', () => {
    const hits = schools.filter((s) => matchSchool('jiaotong', s));
    expect(hits.length).toBeGreaterThanOrEqual(3);
  });
});
