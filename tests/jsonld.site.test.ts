import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site, repoUrl } from '../src/i18n/ui';

// SEO 极致批次 S3a:站级实体图(WebSite + Organization)铺全部可收录页,
// 给品牌搜索/知识面板一个稳定锚点;404(noindex)豁免。
// 消费 dist/client 产物 —— 先跑 npm run build。

const doc = (p: string) =>
  new JSDOM(readFileSync(new URL(`../dist/client/${p}`, import.meta.url), 'utf8')).window.document;

const siteGraph = (p: string) => {
  const scripts = [...doc(p).querySelectorAll('head script[type="application/ld+json"]')];
  const g = scripts.map((s) => JSON.parse(s.textContent!)).find((x) => x['@graph']);
  if (!g) throw new Error(`${p} 缺站级 @graph WebSite/Organization`);
  return g;
};

describe('站级 JSON-LD 图(WebSite + Organization)', () => {
  for (const p of ['index.html', 'en/index.html', 'schools/index.html', 'en/schools/index.html',
    'download/index.html', 'en/download/index.html', 'faq/index.html', 'en/faq/index.html']) {
    it(`${p}:@graph 含 WebSite(url=site)+ Organization(sameAs=repo, logo)`, () => {
      const g = siteGraph(p);
      expect(g['@context']).toBe('https://schema.org');
      const ws = g['@graph'].find((x: any) => x['@type'] === 'WebSite');
      const org = g['@graph'].find((x: any) => x['@type'] === 'Organization');
      expect(ws.url).toBe(site);
      expect(ws.inLanguage).toEqual(expect.arrayContaining(['zh-CN', 'en']));
      expect(org.sameAs).toBe(repoUrl);
      expect(org.logo.url).toMatch(/apple-touch-icon\.png/);
      expect(org.logo.width).toBe(180);
    });
  }
  it('404(noindex)零 ld+json(免收录页不发实体)', () => {
    expect(doc('404.html').querySelectorAll('script[type="application/ld+json"]').length).toBe(0);
  });
});
