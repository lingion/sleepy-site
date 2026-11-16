import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site } from '../src/i18n/ui';
import release from '../src/data/release.json';
import faq from '../src/data/faq.json';
import reviews from '../src/data/content-reviews.json';

// Release-driven pages and editorial reviews have separate timestamps.
// A newer published release must not make this test require yesterday’s review date.
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

const reviewed = reviews as Record<string, string>;
const releaseDriven = new Set(['/', '/download/']);

describe('sitemap reflects release dates and genuine content reviews', () => {
  for (const base of ['/', '/download/', '/faq/', '/guides/', '/guides/wakeup-migration/', '/guides/backup-restore/', '/privacy/']) {
    for (const path of [base, '/en' + base]) {
      it(`${path} includes the current editorial review date`, () => {
        const dates = [reviewed[base], base === '/faq/' ? faq.updatedAt : releaseDriven.has(base) ? release.date : undefined].filter((date): date is string => Boolean(date));
        const expected = Math.max(...dates.map(date => new Date(date).getTime()));
        expect(entry(path)).toBe(new Date(expected).toISOString());
      });
    }
  }
  for (const path of ['/schools/', '/en/schools/', '/releases/', '/en/releases/']) {
    it(`${path} uses the release pipeline timestamp`, () => {
      expect(entry(path)).toBe(new Date(release.date).toISOString());
    });
  }
  for (const path of ['/licenses/', '/en/licenses/']) {
    it(`${path} does not borrow an unrelated release timestamp`, () => {
      expect(entry(path)).toBeNull();
    });
  }
  it('preserves the reviewed feature FAQ baseline separately from automated releases', () => {
    const editorialSource = readFileSync(new URL('../fixtures/FAQ.md', import.meta.url), 'utf8');
    const reviewedAt = editorialSource.match(/内容核对日期[：:]\s*(\d{4}-\d{2}-\d{2})/)?.[1];
    const reviewedVersion = editorialSource.match(/产品基线为 Android (v[\d.]+)/)?.[1];
    expect(reviewedAt).toBeTruthy();
    expect(reviewedVersion).toBeTruthy();
    expect(faq.updatedAt).toBe(reviewedAt);
    expect(faq.reviewedVersion).toBe(reviewedVersion);
  });
});
