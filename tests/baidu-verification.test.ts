import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 2026-10-28: 百度站长平台以首页 head 的 meta 标签做所有权验证(HTML 标签方式)。
// 官方明文「成功验证后请不要删除该标签」——删除 = 站点静默掉出资源平台管辖, 无告警。
// 锁两件事: ①Base.astro 携带与百度账号匹配的令牌(误改误删即红);
// ②该行按字面量无条件渲染(不带 JSX 条件前缀)。

const TOKEN = 'codeva-kA7BwrU2wy';

describe('百度站长验证 meta(HTML 标签方式)', () => {
  it('Base.astro 的 head 携带账号令牌且不挂条件', () => {
    const layout = readFileSync(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8');
    expect(layout).toContain('<meta name="baidu-site-verification" content="' + TOKEN + '" />');
    const line = layout.split('\n').find((l) => l.includes('baidu-site-verification'));
    expect(line?.trim().startsWith('<meta')).toBe(true);
  });
});
