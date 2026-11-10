import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Preserve the complete upstream bilingual document, including evidence anchors.
// Render as build-time content; release Markdown cannot inject scripts, frames or styles.
export function renderReleaseNotes(markdown: string): string {
  return sanitizeHtml(marked.parse(markdown, { async: false }) as string, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'h1', 'h2', 'details', 'summary', 'img'],
    allowedAttributes: { a: ['href', 'id', 'title'], img: ['src', 'alt', 'title'], code: ['class'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: { h1: 'h2', h2: 'h3', h3: 'h4' },
  });
}
