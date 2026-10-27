// 全站在线体验链迁移闸(2026-10-27 用户质问「官网点击跳转的还是老链接」后补上闭环):
// 官网所有指向网页预览的入口一律走 sleepy.is-my.app/preview(方案三反代),
// 老入口 sleepy.qdp.qzz.io 只允许存在于反代上游常量,不许再出现在任何面向访客的链接里。
// 锁四层: 单源常量(ui.ts) / FAQ 双语产物(faq.json ← fixtures/FAQ.md + scripts/faq-en.md) / llms.txt / 反代自身。
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { onlineTrialUrl } from '../src/i18n/ui';
import faq from '../src/data/faq.json';

export const PREVIEW_URL = 'https://sleepy.is-my.app/preview';

describe('在线体验链单源 = /preview', () => {
  it('ui.ts onlineTrialUrl 常量指向官网 preview 前缀', () => {
    expect(onlineTrialUrl).toBe(PREVIEW_URL);
  });

  it('faq.json 双语「在线体验/online trial」链接全部指向 preview', () => {
    const hrefs: string[] = [];
    const walk = (n: unknown) => {
      if (Array.isArray(n)) n.forEach(walk);
      else if (n && typeof n === 'object') {
        const o = n as Record<string, unknown>;
        if (o.t === 'link' && typeof o.href === 'string') hrefs.push(o.href);
        Object.values(o).forEach(walk);
      }
    };
    walk(faq);
    const trial = hrefs.filter((h) => h.includes('qdp.qzz.io') || h === PREVIEW_URL);
    expect(trial.length).toBeGreaterThanOrEqual(2); // zh + en 至少各一
    for (const h of trial) expect(h).toBe(PREVIEW_URL);
  });

  it('llms.txt 的 web trial 行指向 preview 且老域名绝迹', () => {
    const txt = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8');
    expect(txt).toContain(PREVIEW_URL);
    expect(txt).not.toContain('qdp.qzz.io');
  });

  it('FAQ 两处源快照(中英)同样迁移,防 npm run data 回灌老链', () => {
    const zhMd = readFileSync(new URL('../fixtures/FAQ.md', import.meta.url), 'utf8');
    const enMd = readFileSync(new URL('../scripts/faq-en.md', import.meta.url), 'utf8');
    expect(zhMd).not.toContain('qdp.qzz.io');
    expect(enMd).not.toContain('qdp.qzz.io');
    expect(zhMd).toContain(PREVIEW_URL);
    expect(enMd).toContain(PREVIEW_URL);
  });

  it('反代自身 UPSTREAM_ORIGIN 保持老域名(它是上游来源,不是访客入口)', async () => {
    const { UPSTREAM_ORIGIN } = await import('../functions/preview/[[path]].ts');
    expect(UPSTREAM_ORIGIN).toBe('https://sleepy.qdp.qzz.io');
  });
});
