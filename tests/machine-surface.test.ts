import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { site } from '../src/i18n/ui';

// GEO/分发面批次(2026-10-27):llms.txt 声称的机读源必须真实可达(线上实测
// /faq.json 曾返回 404 假 200 —— 声称必有实物是信任基石,AI 抓取验证失败
// 即整份 llms.txt 降权)。_headers = Cloudflare Pages 官方缓存/安全头通道
// (部署目录 _headers 文件);security.txt = RFC 9116 信任信号。
// 均消费 dist/client 产物与 public 源 —— 先跑 npm run build。

const read = (p: string) => {
  const u = new URL(p, import.meta.url);
  if (!existsSync(u)) throw new Error(`${p} 不存在——先跑 npm run build 再跑本测试`);
  return readFileSync(u, 'utf8');
};

describe('faq.json 机读路由(llms.txt 引址实物)', () => {
  it('/faq.json 产物存在且为可解析 JSON(非 404 页假 200)', () => {
    const body = read('../dist/client/faq.json');
    const parsed = JSON.parse(body);
    expect(Array.isArray(parsed.sections)).toBe(true);
    expect(parsed.updatedAt).toBeTruthy();
  });
  it('llms.txt 引址形态 = 绝对 URL 指本站', () => {
    const txt = read('../public/llms.txt');
    expect(txt).toContain(`${site}/faq.json`);
  });
  it('llms.txt 的 android/ios llms 引址用 blob 形态(raw 端点用户侧网络不通)', () => {
    const txt = read('../public/llms.txt');
    expect(txt).toContain('https://github.com/lingion/sleepy/blob/main/llms.txt');
    expect(txt).not.toContain('raw.githubusercontent.com');
  });
});

describe('_headers 部署配置(Cloudflare Pages public/_headers)', () => {
  const h = read('../public/_headers');
  it('内容哈希资产 immutable 长缓存', () => {
    expect(h).toMatch(/\/_astro\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
  });
  it('HTML 零缓存(改版即时可见)+ 安全头三件套', () => {
    expect(h).toMatch(/^\/\n\s+Cache-Control: public, max-age=0, must-revalidate/m);
    expect(h).toMatch(/X-Content-Type-Options: nosniff/);
    expect(h).toMatch(/Referrer-Policy: strict-origin-when-cross-origin/);
  });
  // 官方合并语义:_headers 多 pattern 命中同一请求时全部继承、同名头逗号拼接。
  // /* 块再带 Cache-Control 会让资产响应头双值(线上 2026-10-27 实测拼接现场)。
  it('全局 /* 块不含 Cache-Control(缓存指令单点声明,防逗号双值)', () => {
    const rootBlock = h.match(/^\/\*\n(?:[ \t]+\S.*\n?)*/m)![0];
    expect(rootBlock).not.toMatch(/Cache-Control/);
  });
});

describe('security.txt(RFC 9116 信任信号)', () => {
  const body = read('../dist/client/.well-known/security.txt');
  it('Contact 与 Expires 齐备,Contact 指真实页面', () => {
    expect(body).toMatch(/^Contact: https:\/\/github\.com\/lingion\/sleepy\/security/m);
    expect(body).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T/m);
  });
});

describe('页脚回顶链(纯锚,禁重载)', () => {
  // 用户报障(2026-10-27):旧实现 href={path} 指当前页路径 —— 点「回到顶部」
  // = 整页重新加载。HTML 规范 fragment "top" 特例:无同名元素时滚动到文档
  // 顶部(不导航不重载);html{scroll-behavior:smooth} 已全局就位。
  const pages = ['index.html', 'en/index.html', 'schools/index.html', 'en/schools/index.html',
    'download/index.html', 'en/download/index.html', 'faq/index.html', 'en/faq/index.html'];
  for (const p of pages) {
    it(`${p}:回顶锚 href="#top"(非本页路径,点击不触发导航)`, () => {
      const html = read(`../dist/client/${p}`);
      const m = html.match(/<a href="([^"]*)"[^>]*>(?:回到顶部|Back to top)<\/a>/);
      expect(m, '页脚应有回顶锚').not.toBeNull();
      expect(m![1]).toBe('#top');
    });
  }
});
