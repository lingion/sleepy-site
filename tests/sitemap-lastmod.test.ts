import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site } from '../src/i18n/ui';
import release from '../src/data/release.json';
import faq from '../src/data/faq.json';

// sitemap lastmod 精确化(SEO 极致批次):爬虫按 lastmod 决定重访优先级,
// 缺 lastmod = 全站同等刷新频率;数据管线日期就是真实更新信号——
// 主页/台账/下载 = release.date(发版驱动),FAQ = faq.json updatedAt(内容管线驱动)。
// 消费 dist/client 产物 —— 先跑 npm run build。

const xml = (() => {
  try {
    return readFileSync(new URL('../dist/client/sitemap-0.xml', import.meta.url), 'utf8');
  } catch {
    throw new Error('dist/client/sitemap-0.xml 不存在——先跑 npm run build 再跑本测试');
  }
})();
const dom = new JSDOM(xml, { contentType: 'text/xml' }).window.document;
const entry = (pathname: string) => {
  const loc = `${site}${pathname}`;
  const url = [...dom.querySelectorAll('url')].find(
    (u) => u.querySelector('loc')?.textContent === loc,
  );
  if (!url) throw new Error(`sitemap 缺 ${loc}`);
  return url.querySelector('lastmod')?.textContent ?? null;
};

const relDay = release.date.slice(0, 10); // 2026-10-25
const faqDay = faq.updatedAt; // 2026-10-26

describe('sitemap lastmod 数据真值(SEO 极致批次)', () => {
  for (const p of ['/', '/en/', '/schools/', '/en/schools/', '/download/', '/en/download/']) {
    it(`${p} lastmod = release.date(${relDay})`, () => {
      expect(entry(p)).toMatch(new RegExp(`^${relDay}`));
    });
  }
  for (const p of ['/faq/', '/en/faq/']) {
    it(`${p} lastmod = faq.updatedAt(${faqDay})`, () => {
      expect(entry(p)).toMatch(new RegExp(`^${faqDay}`));
    });
  }
});
