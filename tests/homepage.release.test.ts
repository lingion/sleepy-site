import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import release from '../src/data/release.json';
import product from '../src/data/product-release.json';
import catalog from '../src/data/schools.snapshot.json';
import { localizedReleaseNotes, renderReleaseNotes } from '../src/lib/release-notes';

const page = (path: string) => new JSDOM(readFileSync(new URL(`../dist/client/${path}index.html`, import.meta.url), 'utf8')).window.document;

describe('dedicated localized release notes', () => {
  for (const prefix of ['', 'en/']) {
    it(`${prefix || 'zh'}: keeps the notes off home and links the dedicated page`, () => {
      const home = page(prefix);
      expect(home.querySelector('#released')).toBeNull();
      expect(home.querySelector(`nav a[href="/${prefix}releases/"]`)).not.toBeNull();
      const notes = page(`${prefix}releases/`);
      expect(notes.querySelector('[data-release-tag]')?.getAttribute('data-release-tag')).toBe(release.tag);
      const article = notes.querySelector('.release-prose')!;
      const renderedIds = new Set([...article.querySelectorAll('a[id]')].map(el => el.id));
      const language = prefix ? 'en' : 'zh';
      const expectedIds = [...release.body.matchAll(/<a id="([^"]+)"/g)].map(match => match[1]).filter(id => id.startsWith(`${language}-`));
      expect([...renderedIds].sort()).toEqual(expectedIds.sort());
      expect(article.textContent).toContain(prefix ? 'Liquid Glass' : '液态玻璃');
      expect(article.textContent).not.toContain(prefix ? '液态玻璃' : 'Liquid Glass');
      expect(article.querySelectorAll('h2')).toHaveLength(1);
      expect(article.querySelector('h2')?.id).toBe(`release-${prefix ? 'english' : 'chinese'}`);
      const outline = [...notes.querySelectorAll<HTMLAnchorElement>('.document-nav a')];
      expect(outline.map(link => link.hash)).toEqual([...article.querySelectorAll('h2, h3')].map(heading => `#${heading.id}`));
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
    expect(html).toContain('<h2 id="release-english">Heading</h2>');
  });
  it('selects complete language documents without splitting fenced headings', () => {
    const english = '# Release\n\nEnglish notes.\n\n```md\n# Example\n```';
    const chinese = '# Release\n\n中文说明。';
    const markdown = `${english}\n\n---\n\n${chinese}\n`;
    expect(localizedReleaseNotes(markdown, 'en')).toBe(english);
    expect(localizedReleaseNotes(markdown.replace(/\n/g, '\r\n'), 'zh')).toBe(chinese);
  });
  it('rejects an unknown release language layout instead of exposing both languages', () => {
    expect(() => localizedReleaseNotes('# Release\n\nOnly one document.', 'zh')).toThrow('English and Chinese');
  });
  it('keeps existing section deep links when choosing either language', () => {
    const original = new JSDOM(renderReleaseNotes(release.body)).window.document;
    for (const lang of ['en', 'zh'] as const) {
      const localized = new JSDOM(renderReleaseNotes(release.body, lang)).window.document;
      for (const section of localized.querySelectorAll('h3')) {
        expect(section.id).toBe([...original.querySelectorAll('h3')].find(heading => heading.textContent === section.textContent)?.id);
      }
    }
  });
});
