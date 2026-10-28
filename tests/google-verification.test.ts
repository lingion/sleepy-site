import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 2026-10-28: Google Search Console 以 sleepy.is-my.app 做所有权验证。
// 用户提供的 DNS TXT 记录同一令牌(google-site-verification=l9EkNtXUntA_...);
// 域名属性要求验证标记可经「替代方式」meta 标签满足, 官方同样要求验证后保留——
// 删除 = 站点静默掉出 Search Console 管辖(收录/移除/安全报告全断)且无告警。
// 锁两件事: ①Base.astro 携带与 GSC 一致的令牌(误改误删即红);
// ②该行按字面量无条件渲染(不带 JSX 条件前缀), 与 baidu-site-verification 同模式。

const TOKEN = 'l9EkNtXUntA_ZyNvr2f6GpYpTziiw-vSKOI3Sotl5aY';

describe('Google Search Console 验证 meta(替代方式)', () => {
  it('Base.astro 的 head 携带 GSC 令牌且不挂条件', () => {
    const layout = readFileSync(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8');
    expect(layout).toContain('<meta name="google-site-verification" content="' + TOKEN + '" />');
    const line = layout.split('\n').find((l) => l.includes('google-site-verification'));
    expect(line?.trim().startsWith('<meta')).toBe(true);
  });
});
