import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { applyInitialState, filterRows, parseUrlState, writeUrlState } from '../src/lib/schools-island';
import { catalogUpdatedAt, schools, provincesOrdered } from '../src/lib/schools-view';
import { searchFace } from '../src/lib/search';
import { zh } from '../src/i18n/zh';
import { en } from '../src/i18n/en';
import { site } from '../src/i18n/ui';

const page = (prefix = '') => new JSDOM(readFileSync(new URL(`../dist/client/${prefix}schools/index.html`, import.meta.url), 'utf8')).window.document;
const visible = (doc: Document) => [...doc.querySelectorAll<HTMLElement>('[data-school]:not([hidden])')];

describe('School lookup and full directory', () => {
  for (const [prefix, copy] of [['', zh], ['en/', en]] as const) {
    it(`${prefix || 'zh/'} retains every catalog identity, search alias and status without JavaScript`, () => {
      const doc = page(prefix);
      const rows = new Map([...doc.querySelectorAll<HTMLElement>('[data-school]')].map(row => [row.dataset.catalogId, row]));
      expect(rows.size).toBe(schools.length);
      for (const school of schools) {
        const row = rows.get(school.catalogId)!;
        expect(row.textContent).toContain(school.name);
        expect(row.dataset.search).toBe(searchFace(school));
        expect(row.dataset.status).toBe(school.status);
      }
      const groups = [...doc.querySelectorAll<HTMLDetailsElement>('details[data-group]')];
      expect(groups).toHaveLength(provincesOrdered().length);
      expect(groups.every(group => !group.open && !!group.querySelector('summary'))).toBe(true);
      expect(doc.querySelector('h1')?.textContent).toBe(copy.schoolsPage.heading);
      expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${site}/${prefix}schools/`);
    });
  }
  it('shows 24 results initially, appends the next 24 in order and makes the complete directory reachable', () => {
    const doc = page();
    // Keep representative region groups for paging; full catalog identity is checked above.
    [...doc.querySelectorAll('[data-school]')].slice(72).forEach(row => row.remove());
    const all = [...doc.querySelectorAll<HTMLElement>('[data-school]')].map(row => row.dataset.catalogId);
    expect(applyInitialState(doc, '')).toEqual({ matched: 72, shown: 24 });
    const first = visible(doc).map(row => row.dataset.catalogId);
    expect(first).toEqual(all.slice(0, 24));
    applyInitialState(doc, '', 48);
    expect(visible(doc).map(row => row.dataset.catalogId)).toEqual(all.slice(0, 48));
    expect(visible(doc).slice(0, 24).map(row => row.dataset.catalogId)).toEqual(first);
    applyInitialState(doc, '', 72);
    expect(visible(doc).map(row => row.dataset.catalogId)).toEqual(all);
    expect(doc.querySelector<HTMLButtonElement>('[data-role="more"]')?.hidden).toBe(true);
  });
  it('combines region, system and school name and fills the corresponding controls', () => {
    const doc = page();
    expect(applyInitialState(doc, '?p=GD&t=nuit&q=东软')).toEqual({matched: 1, shown: 1});
    expect(visible(doc)[0].textContent).toContain('广东东软学院');
    expect(doc.querySelector('[role="status"]')?.textContent).toBe('找到 1 所学校');
    expect(doc.querySelector<HTMLInputElement>('[data-role="q"]')?.value).toBe('东软');
    expect(doc.querySelector<HTMLSelectElement>('[data-role="province"]')?.value).toBe('GD');
    expect(doc.querySelector<HTMLSelectElement>('[data-role="type"]')?.value).toBe('nuit');
  });
  it('searches aliases through the same semantics as the directory data', () => {
    const doc = page();
    const q = 'lixin';
    const expected = filterRows(schools, parseUrlState(`?q=${q}`));
    const {matched} = applyInitialState(doc, `?q=${q}`);
    expect(matched).toBe(expected.length);
    expect(visible(doc).map(row => row.dataset.catalogId).sort()).toEqual(expected.map(row => row.catalogId).sort());
    expect(visible(doc).some(row => row.textContent?.includes('上海立信会计金融学院'))).toBe(true);
  });
  it('provides a recoverable empty state and restores defaults when filters are cleared', () => {
    const doc = page();
    applyInitialState(doc, '?p=GD&q=zzzz不存在');
    expect(visible(doc)).toHaveLength(0);
    expect(doc.querySelector<HTMLElement>('[data-role="empty"]')?.hidden).toBe(false);
    expect(doc.querySelector<HTMLButtonElement>('[data-role="reset"]')?.hidden).toBe(false);
    expect(doc.querySelector('[data-role="empty"] a')?.getAttribute('href')).toContain('template=school_adaptation.yml');
    applyInitialState(doc, '');
    expect(visible(doc)).toHaveLength(24);
    expect(doc.querySelector<HTMLElement>('[data-role="empty"]')?.hidden).toBe(true);
    expect(doc.querySelector<HTMLButtonElement>('[data-role="reset"]')?.hidden).toBe(true);
    expect(doc.querySelector<HTMLInputElement>('[data-role="q"]')?.value).toBe('');
  });
  it('preserves reserved characters when sharing school searches', () => {
    const state = {...parseUrlState(''), q: 'School & Research #1 + 研究生'};
    expect(parseUrlState(writeUrlState(state))).toEqual(state);
  });
  it('keeps the catalog date and an adaptation request reachable', () => {
    const doc = page();
    expect(doc.querySelector('.schools__foot time')?.textContent).toBe(catalogUpdatedAt);
    expect(doc.querySelector('.schools__foot a')?.getAttribute('href')).toContain('template=school_adaptation.yml');
    expect(doc.querySelector('input[autofocus]')).toBeNull();
  });
});
