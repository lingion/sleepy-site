// FAQPage JSON-LD 生成(SEO 极致批次 S3c;「SEO 做到极致」定令(2026-10-27)覆盖旧 D8 禁例——
// D8 成文于 2026-10 富结果政策讨论期,FAQPage 结构仍被 Google/Bing 正常解析展示)。
// acceptedAnswer.text 必须是扁平纯文本:link 取锚文本、code/bold 取原字、pre 保内容、
// list 换行连接——schema 不允许 Answer 内嵌 HTML 之外的标记,JSON 残留即毒。
import faq from '../data/faq.json';

type Inline = { t: string; v?: string; inline?: Inline[] };
type Block = { type: string; inline?: Inline[]; items?: Inline[][]; text?: string };

function inlineText(inls: Inline[]): string {
  return inls
    .map((i) => (i.t === 'link' ? inlineText(i.inline ?? []) : (i.v ?? '')))
    .join('');
}

function blockText(b: Block): string {
  if (b.type === 'paragraph') return inlineText(b.inline ?? []);
  if (b.type === 'list') return (b.items ?? []).map((li) => inlineText(li)).join('\n');
  if (b.type === 'pre') return b.text ?? '';
  return '';
}

export function faqJsonLd(lang: 'zh' | 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage' as const,
    mainEntity: faq.sections.flatMap((s) =>
      s.items.map((it) => ({
        '@type': 'Question' as const,
        name: it.q[lang],
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: it.a[lang].map(blockText).join('\n\n'),
        },
      })),
    ),
  };
}
