import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Meaningful images require alt text. Explicitly hidden decorative icons use an empty
// alt to avoid repeating their adjacent label; they must not be forced into narration.
const PAGES = [
  'index.html',
  'en/index.html',
  'faq/index.html',
  'en/faq/index.html',
  'download/index.html',
  'en/download/index.html',
  'schools/index.html',
  'en/schools/index.html',
];

const read = (p: string) => {
  try {
    return readFileSync(new URL(`../dist/client/${p}`, import.meta.url), 'utf8');
  } catch {
    throw new Error(`${p} 不存在——先跑 npm run build 再跑本测试(产物级验收,同 dist.seo.test.ts 约定)`);
  }
};

describe('全站图片替代文本与装饰图标语义', () => {
  it.each(PAGES)('%s 的图片有替代文本或明确的装饰语义', (page) => {
    const html = read(page);
    const imgs = html.match(/<img\b[^>]*>/g) ?? [];
    const bad = imgs.filter((tag) => !/\salt="[^"]+"/.test(tag) && !(/\salt=""/.test(tag) && /\saria-hidden="true"/.test(tag)));
    expect(
      bad,
      `${page} 有 ${bad.length} 张图缺替代文本或装饰语义:\n${bad.map((t) => t.slice(0, 120)).join('\n')}`,
    ).toEqual([]);
  });
});
