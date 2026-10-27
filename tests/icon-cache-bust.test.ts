import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 品牌圆角化(2026-10-27)后,图标 URL 若不变,浏览器 favicon 缓存永不回源——
// 老访客标签页钉死尖角旧图(sleepy.is-my.app 根页面与 /preview 同病,web 侧
// 已在 index.html 加 ?v=1;site 侧三枚图标入口在此补齐)。契约锁产物级 URL。
// 消费 dist/client 产物 —— 先跑 npm run build。

const html = (() => {
  try {
    return readFileSync(new URL('../dist/client/index.html', import.meta.url), 'utf8');
  } catch {
    throw new Error('dist/client/index.html 不存在——先跑 npm run build 再跑本测试');
  }
})();

const hrefOf = (rel: string) => {
  const m = html.match(new RegExp(`<link rel="${rel}"[^>]*href="([^"]+)"`));
  if (!m) throw new Error(`dist 中找不到 rel="${rel}" 链接`);
  return m[1]!;
};

describe('site 图标 URL 缓存破除(圆角换代必需)', () => {
  it('favicon.svg 链接带版本查询串', () => {
    expect(hrefOf('icon')).toMatch(/^\/favicon\.svg\?v=\d+$/);
  });
  it('favicon.ico 备胎带版本查询串', () => {
    expect(hrefOf('alternate icon')).toMatch(/^\/favicon\.ico\?v=\d+$/);
  });
  it('apple-touch-icon 带版本查询串', () => {
    expect(hrefOf('apple-touch-icon')).toMatch(/^\/apple-touch-icon\.png\?v=\d+$/);
  });
});

// 同一分发面补课:OG 富化(爬虫预取渲染省一跳)+ apple-touch sizes 声明。
