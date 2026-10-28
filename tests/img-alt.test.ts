import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 2026-10-28 Bing 站长扫描报「图片缺失替代文本」。根因:Astro <Image alt="">
// 序列化为裸 alt 属性(无 =""),Bing 将裸 alt 与无 alt 同等计为缺失。
// Shot.astro 的 dark 版截图用 alt="" + aria-hidden 防读屏重复朗读,恰好踩中此计数。
// 本契约消费 dist/client 全站页面:每张 <img> 必须携带非空引号 alt 值。
// 红绿验证:dark 版回到 alt="" → 本文件必红(裸 alt 匹配不到 alt="...")。

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

describe('全站 img 非空 alt 契约(Bing 缺失计数归零)', () => {
  it.each(PAGES)('%s 的每张 <img> 都有非空引号 alt', (page) => {
    const html = read(page);
    const imgs = html.match(/<img\b[^>]*>/g) ?? [];
    const bad = imgs.filter((tag) => !/alt="[^"]+"/.test(tag));
    expect(
      bad,
      `${page} 有 ${bad.length} 张图缺非空 alt:\n${bad.map((t) => t.slice(0, 120)).join('\n')}`,
    ).toEqual([]);
  });
});
