import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Preserve the complete upstream bilingual document, including evidence anchors.
// Render as build-time content; release Markdown cannot inject scripts, frames or styles.
export function renderReleaseNotes(markdown: string): string {
  let section = 0;
  let heading = 0;
  return sanitizeHtml(marked.parse(markdown, { async: false }) as string, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'h1', 'h2', 'details', 'summary', 'img'],
    allowedAttributes: { a: ['href', 'id', 'title'], h2: ['id'], h3: ['id'], img: ['src', 'alt', 'title'], code: ['class'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: {
      h1: () => ({ tagName: 'h2', attribs: { id: section++ === 0 ? 'release-english' : 'release-chinese' } }),
      h2: () => ({ tagName: 'h3', attribs: { id: `release-section-${heading++}` } }), h3: 'h4',
    },
  });
}
