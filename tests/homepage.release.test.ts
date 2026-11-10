import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import release from '../src/data/release.json';
import product from '../src/data/product-release.json';
import catalog from '../src/data/schools.snapshot.json';
import { renderReleaseNotes } from '../src/lib/release-notes';

const page = (path: string) => new JSDOM(readFileSync(new URL(`../dist/client/${path}index.html`, import.meta.url), 'utf8')).window.document;

describe('dedicated complete release notes', () => {
  for (const prefix of ['', 'en/']) {
    it(`${prefix || 'zh'}: keeps the notes off home and links the dedicated page`, () => {
      const home = page(prefix);
      expect(home.querySelector('#released')).toBeNull();
      expect(home.querySelector(`nav a[href="/${prefix}releases/"]`)).not.toBeNull();
      const notes = page(`${prefix}releases/`);
      expect(notes.querySelector('[data-release-tag]')?.getAttribute('data-release-tag')).toBe(release.tag);
      const article = notes.querySelector('.release-prose')!;
      const renderedIds = new Set([...article.querySelectorAll('[id]')].map(el => el.id));
      const expectedIds = [...release.body.matchAll(/<a id="([^"]+)"/g)].map(match => match[1]);
      expect([...renderedIds].sort()).toEqual(expectedIds.sort());
      expect(article.textContent).toContain('Liquid Glass');
      expect(article.textContent).toContain('液态玻璃');
      expect(article.textContent!.length).toBeGreaterThan(10000);
    });
  }
  it('keeps download, product, public metadata and catalog on the same immutable release', () => {
    const live = JSON.parse(readFileSync(new URL('../public/release.json', import.meta.url), 'utf8'));
    expect(product.tag).toBe(release.tag);
    expect(catalog.ref).toBe(release.tag);
    expect(catalog.sourceSha).toBe(release.sourceSha);
    expect(product.commit).toBe(release.sourceSha);
    expect(live.assets).toEqual(release.assets);
    expect(live.body).toBe(release.body);
  });
  it('renders Markdown without allowing executable release content', () => {
    const html = renderReleaseNotes('<script>alert(1)</script><iframe src="https://bad.example"></iframe>\n<a id="evidence"></a>\n[bad](javascript:alert(1))\n# Heading');
    expect(html).not.toMatch(/<script|<iframe|javascript:/);
    expect(html).toContain('id="evidence"');
    expect(html).toContain('<h2>Heading</h2>');
  });
});
