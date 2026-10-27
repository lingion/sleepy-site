import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site, repoUrl } from '../src/i18n/ui';
import release from '../src/data/release.json';

// SEO/GEO 批次(2026-10-27):SoftwareApplication 字段补全 + 站级实体图去歧义。
// Google 官方 SoftwareApp 文档:offers 必填(免费应用 price=0),applicationCategory
// 必为 22 枚举之一;课程表应用归 EducationalApplication。Organization sameAs 多源、
// alternateName 中文品牌 = 实体消歧(GEO 核心:AI 引擎对"Sleepy=轻课表"建同一实体)。
// 消费 dist/client 产物 —— 先跑 npm run build。

const doc = (p: string) =>
  new JSDOM(readFileSync(new URL(`../dist/client/${p}`, import.meta.url), 'utf8')).window.document;
const pageLd = (p: string) =>
  [...doc(p).querySelectorAll('head script[type="application/ld+json"]')]
    .map((s) => JSON.parse(s.textContent!))
    .filter((x) => !x['@graph']);
const graphOf = (p: string) =>
  [...doc(p).querySelectorAll('head script[type="application/ld+json"]')]
    .map((s) => JSON.parse(s.textContent!))
    .find((x) => x['@graph'])!['@graph'];

describe('SoftwareApplication 字段补全(Google 官方必填/推荐面)', () => {
  for (const [file, lang] of [['index.html', 'zh'], ['en/index.html', 'en']] as const) {
    it(`${lang}:applicationCategory=EducationalApplication 且 offers 免费声明`, () => {
      const ld = pageLd(file)[0];
      expect(ld.applicationCategory).toBe('EducationalApplication');
      expect(ld.offers['@type']).toBe('Offer');
      expect(ld.offers.price).toBe('0');
      expect(ld.offers.priceCurrency).toBe('USD');
      expect(ld.dateModified).toBe(release.date);
    });
  }
});

describe('站级实体图去歧义', () => {
  const org = () => graphOf('index.html').find((n: { '@type': string }) => n['@type'] === 'Organization');
  it('Organization sameAs 同时含 Android 与 iOS 两仓', () => {
    const sameAs = org().sameAs;
    expect(Array.isArray(sameAs)).toBe(true);
    expect(sameAs).toContain(repoUrl);
    expect(sameAs).toContain('https://github.com/lingion/sleepy-ios');
  });
  it('Organization alternateName 含中文名「轻课表」', () => {
    expect(org().alternateName).toContain('轻课表');
  });
  it('WebSite 带 description(实体可被摘要引用)', () => {
    const ws = graphOf('index.html').find((n: { '@type': string }) => n['@type'] === 'WebSite');
    expect(ws.description).toBeTruthy();
  });
});
