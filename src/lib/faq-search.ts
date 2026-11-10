const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();

/** Search the rendered question and full answer; retain the original anchor on every item. */
export function filterFaq(doc: Document, query: string, hash = ''): number {
  const term = normalize(query);
  const items = [...doc.querySelectorAll<HTMLElement>('[data-faq-item]')];
  let count = 0;
  for (const item of items) {
    const matches = !term || normalize(item.textContent ?? '').includes(term);
    item.hidden = !matches;
    if (matches) count++;
    item.querySelector<HTMLDetailsElement>('details')!.open = matches && (!!term || `#${item.id}` === hash);
  }
  for (const section of doc.querySelectorAll<HTMLElement>('[data-faq-section]')) {
    section.hidden = !section.querySelector('[data-faq-item]:not([hidden])');
    const link = doc.querySelector<HTMLElement>(`[data-toc-link][href="#${section.id}"]`);
    if (link) {
      link.hidden = section.hidden;
      const item = link.closest('li');
      if (item) item.hidden = section.hidden;
    }
  }
  const status = doc.querySelector<HTMLElement>('[data-faq-count]');
  if (status) status.textContent = status.dataset.faqCount!.replace('{count}', String(count));
  const empty = doc.querySelector<HTMLElement>('[data-faq-empty]');
  if (empty) empty.hidden = count > 0;
  const clear = doc.querySelector<HTMLButtonElement>('[data-faq-clear]');
  if (clear) clear.hidden = !query;
  const input = doc.querySelector<HTMLInputElement>('[data-faq-search]');
  if (input) input.value = query;
  return count;
}

export function enhanceFaq(doc: Document): void {
  const view = doc.defaultView;
  const page = doc.querySelector<HTMLElement>('[data-faq-page]');
  const input = doc.querySelector<HTMLInputElement>('[data-faq-search]');
  if (!view || !page || !input) return;
  const apply = () => filterFaq(doc, new URLSearchParams(view.location.search).get('q') ?? '', view.location.hash);
  const setQuery = (query: string) => {
    const params = new URLSearchParams(view.location.search);
    if (query) params.set('q', query); else params.delete('q');
    view.history.replaceState(null, '', `${view.location.pathname}${params.size ? `?${params}` : ''}${view.location.hash}`);
    apply();
  };
  apply();
  page.dataset.enhanced = '';
  input.addEventListener('input', () => setQuery(input.value));
  doc.querySelector('[data-faq-clear]')!.addEventListener('click', () => { setQuery(''); input.focus(); });
  view.addEventListener('popstate', apply);
  view.addEventListener('hashchange', () => {
    const target = doc.getElementById(view.location.hash.slice(1));
    if (target?.matches('[data-faq-item][hidden]')) setQuery('');
    else apply();
  });
}
