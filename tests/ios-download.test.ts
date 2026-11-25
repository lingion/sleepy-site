import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

describe('iOS installation channels', () => {
  for (const page of ['index.html', 'download/index.html', 'en/index.html', 'en/download/index.html']) {
    it(`${page}: App Store is the only iOS installation entry`, () => {
      const document = new JSDOM(readFileSync(new URL(`../dist/client/${page}`, import.meta.url), 'utf8')).window.document;
      const channels = document.querySelector('[data-ios-download]')!;
      expect(channels).not.toBeNull();
      const links = [...channels.querySelectorAll('a')];
      expect(links.map(a => a.href)).toEqual(['https://apps.apple.com/app/id6827001840']);
      for (const link of links) {
        expect(link.getAttribute('aria-label')).toBeTruthy();
        expect(link.rel).toContain('noopener');
      }
      const badge = links[0].querySelector('img')!;
      expect(badge.getAttribute('src')).toBe(`/badges/download-on-the-app-store-${page.startsWith('en/') ? 'en' : 'zh'}.svg`);
      expect(badge.getAttribute('height')).toBe('40');
      expect(channels.textContent).toContain(page.startsWith('en/') ? 'mainland China and other storefront regions' : '中国大陆区及其他地区');
      expect(channels.textContent.toLowerCase()).not.toContain('testflight');
      expect(channels.textContent).not.toMatch(/唯一合法|only official release channel/);
    });
  }
});
