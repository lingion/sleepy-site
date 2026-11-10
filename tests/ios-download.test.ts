import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

describe('iOS installation channels', () => {
  for (const page of ['index.html', 'download/index.html', 'en/index.html', 'en/download/index.html']) {
    it(`${page}: App Store precedes the separate TestFlight entry and explains regional availability`, () => {
      const document = new JSDOM(readFileSync(new URL(`../dist/client/${page}`, import.meta.url), 'utf8')).window.document;
      const channels = document.querySelector('[data-ios-download]')!;
      expect(channels).not.toBeNull();
      const links = [...channels.querySelectorAll('a')];
      expect(links.map(a => a.href)).toEqual([
        'https://apps.apple.com/app/id6827001840',
        'https://testflight.apple.com/join/SxymmDzf',
      ]);
      for (const link of links) {
        expect(link.getAttribute('aria-label')).toBeTruthy();
        expect(link.rel).toContain('noopener');
      }
      const badge = links[0].querySelector('img')!;
      expect(badge.getAttribute('src')).toBe(`/badges/download-on-the-app-store-${page.startsWith('en/') ? 'en' : 'zh'}.svg`);
      expect(badge.getAttribute('height')).toBe('40');
      const icon = links[1].querySelector('img')!;
      expect(icon.getAttribute('src')).toBe('/badges/testflight.jpg');
      expect(icon.getAttribute('width')).toBe(icon.getAttribute('height'));
      expect(links[1].textContent).toContain('TestFlight');
      expect(channels.textContent).toContain(page.startsWith('en/') ? 'outside mainland China' : '中国大陆以外');
      expect(channels.textContent).toContain(page.startsWith('en/') ? 'under review' : '审核中');
      expect(channels.textContent).not.toMatch(/唯一合法|only official release channel/);
    });
  }
});
