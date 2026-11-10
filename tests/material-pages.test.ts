import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import policy from '../src/data/privacy.json';

const root = new URL('../dist/client/', import.meta.url).pathname;
const documents = new Map<string, Document>();
const read = (path: string) => {
  const file = path.startsWith(root) ? path : join(root, path);
  if (!documents.has(file)) documents.set(file, new JSDOM(readFileSync(file, 'utf8')).window.document);
  return documents.get(file)!;
};
const routes = ['', 'en/', ...['schools', 'download', 'faq', 'releases', 'licenses', 'privacy'].flatMap(page => [`${page}/`, `en/${page}/`])];

describe('Material page navigation and phone preview contracts', () => {
  it('keeps the phone viewport fixed and the full original app available', () => {
    for (const route of ['', 'en/']) {
      const doc = read(`${route}index.html`);
      const screen = doc.querySelector('[data-phone-screen]')!;
      const frame = screen.querySelector('iframe')!;
      expect([frame.getAttribute('width'), frame.getAttribute('height')]).toEqual(['402', '874']);
      expect(frame.getAttribute('src')).toBe('https://sleepy.is-my.app/preview/');
      expect(doc.querySelector('.hero__demo-caption a')?.getAttribute('href')).toBe(frame.getAttribute('src'));
    }
  });
  it('orders document titles, navigation and body consistently in both languages', () => {
    for (const route of ['licenses/', 'releases/', 'privacy/', 'en/licenses/', 'en/releases/', 'en/privacy/']) {
      const doc = read(`${route}index.html`);
      const heading = doc.querySelector('main h1')!;
      const nav = doc.querySelector('[data-document-nav]')!;
      const body = doc.querySelector('main article')!;
      expect(heading.compareDocumentPosition(nav) & 4, route).toBeTruthy();
      expect(nav.compareDocumentPosition(body) & 4, route).toBeTruthy();
      for (const link of nav.querySelectorAll('a')) expect(doc.getElementById(link.hash.slice(1)), `${route}: ${link.hash}`).not.toBeNull();
    }
  });
  it('preserves every original privacy section without changing the effective date', () => {
    const text = (html: string) => new JSDOM(html).window.document.body.textContent!.replace(/\s+/g, '');
    for (const route of ['privacy/', 'en/privacy/']) {
      const doc = read(`${route}index.html`);
      expect(doc.querySelector('time')?.getAttribute('datetime')).toBe(policy.effectiveDate);
      for (const section of policy.sections) expect(text(doc.getElementById(section.id)!.innerHTML)).toContain(text(section.html));
    }
  });
  it('gives every page one main title and resolves every internal link and fragment', () => {
    const errors: string[] = [];
    for (const route of routes) {
      const doc = read(`${route}index.html`);
      expect(doc.querySelectorAll('main h1').length, route).toBe(1);
      expect(doc.querySelector(`footer a[href="/${route.startsWith('en/') ? 'en/' : ''}privacy/"]`), route).not.toBeNull();
      for (const link of doc.querySelectorAll<HTMLAnchorElement>('a[href]')) {
        const url = new URL(link.getAttribute('href')!, `https://sleepy.is-my.app/${route}`);
        if (url.origin !== 'https://sleepy.is-my.app' || /^\/preview(?:\/|$)/.test(url.pathname)) continue;
        const path = join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
        if (!existsSync(path)) { errors.push(`${route}: ${url.pathname}`); continue; }
        if (url.hash && url.hash !== '#top' && path.endsWith('.html') && !read(path).getElementById(decodeURIComponent(url.hash.slice(1)))) errors.push(`${route}: ${url.pathname}${url.hash}`);
      }
    }
    expect(errors).toEqual([]);
  });
});
