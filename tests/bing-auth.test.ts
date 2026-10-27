import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 2026-10-27: Bing 站长工具以域名根路径的 BingSiteAuth.xml 做所有权验证。
// 锁两件事: ①文件存在且令牌与 Bing 账号一致(误删/误改 = 验证静默失效, 无告警);
// ②robots.txt 的 Sitemap 仍指向本域(sitemap 断链 Bing 收不到页面)。

const TOKEN = '19048FA9F7E33C0C17F915E97E96D578';

describe('Bing 站长验证文件(根路径所有权)', () => {
  it('public/BingSiteAuth.xml 携带账号令牌', () => {
    const xml = readFileSync(new URL('../public/BingSiteAuth.xml', import.meta.url), 'utf8');
    expect(xml).toContain(`<user>${TOKEN}</user>`);
  });

  it('robots.txt Sitemap 指向 sleepy.is-my.app', () => {
    const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
    expect(robots).toMatch(/^Sitemap: https:\/\/sleepy\.is-my\.app\/sitemap-index\.xml$/m);
  });
});
