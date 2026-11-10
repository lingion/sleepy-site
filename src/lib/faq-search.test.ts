import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { enhanceFaq, filterFaq } from './faq-search';
const html = () => readFileSync(new URL('../../dist/client/faq/index.html', import.meta.url), 'utf8');
const visible = (doc: Document) => [...doc.querySelectorAll<HTMLElement>('[data-faq-item]:not([hidden])')];

describe('FAQ search and original anchors', () => {
  it('matches both questions and complete answers and opens the matching answers', () => {
    const doc = new JSDOM(html()).window.document;
    const term = 'sleepy-v1';
    const expected = [...doc.querySelectorAll<HTMLElement>('[data-faq-item]')].filter(item => item.textContent!.toLowerCase().includes(term.toLowerCase()));
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.some(item => !item.querySelector('summary')!.textContent!.includes(term))).toBe(true);
    expect(filterFaq(doc, term)).toBe(expected.length);
    expect(visible(doc).map(item => item.id)).toEqual(expected.map(item => item.id));
    expect(visible(doc).every(item => item.querySelector<HTMLDetailsElement>('details')!.open)).toBe(true);
    expect([...doc.querySelectorAll<HTMLElement>('[data-faq-section]')].every(section => section.hidden === !section.querySelector('[data-faq-item]:not([hidden])'))).toBe(true);
    for (const section of doc.querySelectorAll<HTMLElement>('[data-faq-section]')) {
      const link = doc.querySelector<HTMLElement>(`[data-toc-link][href="#${section.id}"]`)!;
      expect(link.closest<HTMLLIElement>('li')!.hidden).toBe(section.hidden);
    }
  });
  it('shows an empty state, then restores all answers after clearing', () => {
    const doc = new JSDOM(html()).window.document;
    expect(filterFaq(doc, 'zzzzNoMatchingQuestion12345')).toBe(0);
    expect(doc.querySelector<HTMLElement>('[data-faq-empty]')?.hidden).toBe(false);
    expect(filterFaq(doc, '')).toBe(54);
    expect(visible(doc)).toHaveLength(54);
    expect(doc.querySelector<HTMLElement>('[data-faq-empty]')?.hidden).toBe(true);
    expect(doc.querySelector<HTMLButtonElement>('[data-faq-clear]')?.hidden).toBe(true);
    expect([...doc.querySelectorAll<HTMLLIElement>('[data-document-nav] li')].every(item => !item.hidden)).toBe(true);
  });
  it('opens original question hashes on initial load and after a hash change', () => {
    const dom = new JSDOM(html(), {url: 'https://sleepy.is-my.app/faq/'});
    const {document: doc} = dom.window;
    const id = doc.querySelector('[data-faq-item]')!.id;
    dom.window.history.replaceState(null, '', `#${id}`);
    enhanceFaq(doc);
    expect(doc.getElementById(id)!.querySelector<HTMLDetailsElement>('details')!.open).toBe(true);
    dom.window.history.replaceState(null, '', `?q=zzzzNoMatch#${id}`);
    dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
    expect(doc.getElementById(id)!.hidden).toBe(true);
    dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
    expect(dom.window.location.search).toBe('');
    expect(doc.getElementById(id)!.querySelector<HTMLDetailsElement>('details')!.open).toBe(true);
  });
  it('uses actual input, clear and history events to keep the URL and results together', () => {
    const dom = new JSDOM(html(), {url: 'https://sleepy.is-my.app/faq/?q=备份'});
    const doc = dom.window.document;
    enhanceFaq(doc);
    const input = doc.querySelector<HTMLInputElement>('[data-faq-search]')!;
    expect(input.value).toBe('备份');
    expect(visible(doc).length).toBeGreaterThan(0);
    input.value = '导入';
    input.dispatchEvent(new dom.window.Event('input', {bubbles: true}));
    expect(new URLSearchParams(dom.window.location.search).get('q')).toBe('导入');
    doc.querySelector<HTMLButtonElement>('[data-faq-clear]')!.click();
    expect(dom.window.location.search).toBe('');
    expect(visible(doc)).toHaveLength(54);
    expect(doc.activeElement).toBe(input);
    dom.window.history.replaceState(null, '', '?q=备份');
    dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
    expect(input.value).toBe('备份');
    expect(visible(doc).length).toBeLessThan(54);
  });
});
