import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Upstream follows the release SOP: English then Chinese, each with one level-one title.
// Token boundaries avoid mistaking a heading inside fenced code for a language boundary.
export function localizedReleaseNotes(markdown: string, lang: 'zh' | 'en'): string {
  const tokens = marked.lexer(markdown);
  const titles = tokens.flatMap((token, index) => token.type === 'heading' && token.depth === 1 ? [index] : []);
  if (titles.length !== 2) throw new Error('Release notes must contain English and Chinese documents with one level-one title each.');
  const section = lang === 'en' ? tokens.slice(titles[0], titles[1]) : tokens.slice(titles[1]);
  while (section.at(-1)?.type === 'space') section.pop();
  if (lang === 'en' && section.at(-1)?.type === 'hr') section.pop();
  return section.map(token => token.raw).join('').trim();
}

// Render as build-time content; release Markdown cannot inject scripts, frames or styles.
// The raw bilingual release stays unchanged in the machine-readable snapshot.
export function renderReleaseNotes(markdown: string, lang?: 'zh' | 'en'): string {
  const content = lang ? localizedReleaseNotes(markdown, lang) : markdown;
  let section = 0;
  // Keep Chinese section IDs from the original bilingual page so shared links survive.
  let heading = lang === 'zh'
    ? marked.lexer(localizedReleaseNotes(markdown, 'en')).filter(token => token.type === 'heading' && token.depth === 2).length
    : 0;
  return sanitizeHtml(marked.parse(content, { async: false }) as string, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'h1', 'h2', 'details', 'summary', 'img'],
    allowedAttributes: { a: ['href', 'id', 'title'], h2: ['id'], h3: ['id'], img: ['src', 'alt', 'title'], code: ['class'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: {
      h1: () => ({ tagName: 'h2', attribs: { id: lang === 'zh' ? 'release-chinese' : section++ === 0 ? 'release-english' : 'release-chinese' } }),
      h2: () => ({ tagName: 'h3', attribs: { id: `release-section-${heading++}` } }), h3: 'h4',
    },
  });
}
