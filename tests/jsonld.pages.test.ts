import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site } from '../src/i18n/ui';
import release from '../src/data/release.json';
import faq from '../src/data/faq.json';

// SEO 极致批次 S3b/S3c:en 主页 SoftwareApplication 对等(双语对页实体对称,
// en 爬虫不再只拿到站级图);FAQ 双语页 FAQPage 富结果图(「做到极致」定令 2026-10-27,
// 覆盖旧 D8 禁例——D8 成文于富结果收紧前,FAQPage 现仍被 Google/Bing 展示)。
// 消费 dist/client 产物 —— 先跑 npm run build。

const doc = (p: string) =>
  new JSDOM(readFileSync(new URL(`../dist/client/${p}`, import.meta.url), 'utf8')).window.document;
const pageLd = (p: string) =>
  [...doc(p).querySelectorAll('head script[type="application/ld+json"]')]
    .map((s) => JSON.parse(s.textContent!))
    .filter((x) => !x['@graph']);

const itemCount = faq.sections.reduce((n, s) => n + s.items.length, 0);

describe('en 主页 SoftwareApplication 对等', () => {
  it('en 主页页级图 = SoftwareApplication,image 指 og/home-en', () => {
    const lds = pageLd('en/index.html');
    expect(lds.length).toBe(1);
    const ld = lds[0];
    expect(ld['@type']).toBe('SoftwareApplication');
    expect(ld.softwareVersion).toBe(release.tag);
    expect(ld.image).toBe(`${site}/og/home-en.png`);
  });
});

describe('FAQ 双语页 FAQPage 图', () => {
  for (const [p, lang] of [['faq/index.html', 'zh'], ['en/faq/index.html', 'en']] as const) {
    it(`${p}:mainEntity 数 = faq.json 条目数(${itemCount}),问句与答案同源`, () => {
      const ld = pageLd(p).find((x) => x['@type'] === 'FAQPage');
      expect(ld, `${p} 缺 FAQPage`).toBeTruthy();
      expect(ld.mainEntity.length).toBe(itemCount);
      const first = ld.mainEntity[0];
      expect(first['@type']).toBe('Question');
      expect(first.name).toBe(faq.sections[0].items[0].q[lang]);
      expect(first.acceptedAnswer['@type']).toBe('Answer');
      expect(first.acceptedAnswer.text.length).toBeGreaterThan(20);
      expect(first.acceptedAnswer.text).not.toMatch(/[{}"]/); // 扁平纯文本,非 JSON 残留
    });
  }
  it('FAQ 页答案含链接锚文本(展平保文字不含标记)', () => {
    const ld = pageLd('faq/index.html').find((x) => x['@type'] === 'FAQPage');
    const all = ld.mainEntity.map((q: any) => q.acceptedAnswer.text).join('\n');
    expect(all).toContain('GitHub Releases'); // link inline 展平后的锚文本
  });
});
