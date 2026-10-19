import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { zh } from '../src/i18n/zh';
import schools from '../src/data/schools.grouped.json';
import { matchSchool } from '../src/lib/search';
import { site } from '../src/i18n/ui';

// T7 EN 镜像产物闸:dist/client/en/index.html 由 npm run build 产出。
// 校名保中文是设计(spec §4.1),所以「无中文泄漏」= zh.ts 叶子文案零出现,
// 而不是整页无汉字。

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

describe('/en/ 结构镜像', () => {
  it('六段 + footer 依序齐备,DOM 序不变量同 zh', () => {
    for (const id of ['hero', 'features', 'schools', 'gallery', 'download', 'trust']) {
      expect(doc.getElementById(id), `section #${id}`).not.toBeNull();
    }
    const cards = [...doc.querySelectorAll('#features .reveal')];
    expect(cards.map((c) => c.getAttribute('style'))).toEqual([
      '--reveal-i: 0;', '--reveal-i: 1;', '--reveal-i: 2;', '--reveal-i: 3;',
    ]);
  });
  it('blob 计数 = 3', () => {
    expect(doc.querySelectorAll('[data-blob]').length).toBe(3);
  });
  it('语言链指向 zh 主页', () => {
    const lang = doc.querySelector('.appbar__lang');
    expect(lang?.getAttribute('href')).toBe('/');
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
  it('校名中文保留(设计,非泄漏):EN 页仍列真实校名', () => {
    expect(HTML.includes(schools[0].name)).toBe(true);
  });
});

describe('EN 检索数据侧(spec §4.1 jiaotong 例)', () => {
  it('拼音查询在真实数据命中多校', () => {
    const hits = schools.filter((s) => matchSchool('jiaotong', s));
    expect(hits.length).toBeGreaterThanOrEqual(3);
  });
});
