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
  it('C1 首图 = 01-week(与 zh 同构)', () => {
    expect([...doc.querySelectorAll('img')][0].getAttribute('src')).toContain('01-week');
  });
  it('LCP:high=1 / low=1 / preload=1 且 preload href = 高优先图 src(T3)', () => {
    expect(doc.querySelectorAll('img[fetchpriority="high"]').length).toBe(1);
    expect(doc.querySelectorAll('img[fetchpriority="low"]').length).toBe(1);
    const preload = doc.querySelector('head link[rel="preload"][as="image"]');
    expect(preload).not.toBeNull();
    expect(preload?.getAttribute('href')).toBe(doc.querySelector('img[fetchpriority="high"]')?.getAttribute('src'));
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
