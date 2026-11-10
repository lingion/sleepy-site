import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import release from '../src/data/release.json';
import faq from '../src/data/faq.json';

const docs = new Map<string, Document>();
const page = (route: string) => {
  if (!docs.has(route)) docs.set(route, new JSDOM(readFileSync(new URL(`../dist/client/${route}index.html`, import.meta.url), 'utf8')).window.document);
  return docs.get(route)!;
};

describe('School, download and help journeys', () => {
  for (const prefix of ['', 'en/']) {
    it(`${prefix || 'zh/'} routes both homepage Android actions through the download center`, () => {
      const doc = page(prefix);
      expect(doc.querySelector('.hero__cta-xl')?.getAttribute('href')).toBe(`/${prefix}download/`);
      expect(doc.querySelector('.download__cta-xl')?.getAttribute('href')).toBe(`/${prefix}download/`);
    });

    it(`${prefix || 'zh/'} makes download sources an explicit choice and preserves every official file`, () => {
      const doc = page(`${prefix}download/`);
      const sources = [...doc.querySelectorAll<HTMLInputElement>('input[name="download-source"]')];
      expect(sources.map(input => input.value)).toEqual(['mirror', 'github']);
      expect(sources.every(input => input.closest('label')?.textContent?.trim())).toBe(true);
      const official = [...doc.querySelectorAll<HTMLAnchorElement>('a[data-download-official]')].map(a => a.dataset.downloadOfficial);
      for (const asset of release.assets) expect(official).toContain(asset.url);
      expect(official).toContain(release.sha256sumsUrl);
      expect(doc.querySelector('[data-dl-primary]')?.getAttribute('href')).toBe(
        release.assets.find(asset => asset.name.includes('universal'))!.url.replace('github.com', prefix ? 'github.com' : 'gh.qdp.qzz.io'),
      );
    });

    it(`${prefix || 'zh/'} presents school search before the compact filters and results`, () => {
      const doc = page(`${prefix}schools/`);
      const search = doc.querySelector('input[data-role="q"]')!;
      const province = doc.querySelector('select[data-role="province"]')!;
      const type = doc.querySelector('select[data-role="type"]')!;
      const results = doc.querySelector('[data-role="groups"]')!;
      expect(search).not.toBeNull();
      expect(province).not.toBeNull();
      expect(type?.closest('details')).not.toBeNull();
      expect(doc.querySelectorAll('.schools__chipbar button')).toHaveLength(0);
      expect(search.compareDocumentPosition(province) & 4).toBeTruthy();
      expect(province.compareDocumentPosition(results) & 4).toBeTruthy();
    });

    it(`${prefix || 'zh/'} allows question search while preserving all answers and direct links`, () => {
      const doc = page(`${prefix}faq/`);
      expect(doc.querySelector('input[data-faq-search]')?.closest('label')).not.toBeNull();
      const items = [...doc.querySelectorAll('[data-faq-item]')];
      expect(items).toHaveLength(faq.sections.reduce((total, section) => total + section.items.length, 0));
      expect(items.every(item => item.querySelector('details > summary') && item.querySelector('.faq__a'))).toBe(true);
      expect(doc.querySelector('main h1')!.compareDocumentPosition(doc.querySelector('[data-role="toc"]')!) & 4).toBeTruthy();
    });
  }
});
