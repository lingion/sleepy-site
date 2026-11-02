import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { zh } from '../src/i18n/zh';
import { en } from '../src/i18n/en';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('released Android homepage coverage', () => {
  const topics = ['editing', 'appearance', 'exchange', 'widgets', 'privacy', 'console'] as const;
  for (const [lang, copy] of [['zh', zh], ['en', en]] as const) {
    it(`${lang}: covers the same released capabilities with their limits`, () => {
      const released = copy.released;
      expect(released).toBeDefined();
      expect(Object.keys(released.items)).toEqual(topics);
      const text = Object.values(released.items).map(item => `${item.title} ${item.body}`).join(' ');
      for (const term of ['500', 'Material 3 Expressive', 'Android 13', 'Android 12', 'sleepy-v1', 'WakeUP', 'JSON', 'ICS', '13', 'OriginOS']) expect(text).toContain(term);
      expect(copy.download.trial).not.toMatch(/提供完整功能|provides full functionality/);
      expect(copy.hero.sub).not.toMatch(/不经任何服务器|passes through no server/);
    });
  }
  it('renders release coverage in both homepages between views and import', () => {
    for (const path of ['../src/pages/index.astro', '../src/pages/en/index.astro']) {
      const page = source(path);
      expect(page).toContain('ReleasedFeatures');
      expect(page.indexOf('<Views')).toBeLessThan(page.indexOf('<ReleasedFeatures'));
      expect(page.indexOf('<ReleasedFeatures')).toBeLessThan(page.indexOf('<Connect'));
    }
    const section = source('../src/components/sections/ReleasedFeatures.astro');
    expect(section).toContain('Object.entries(t.items)');
    expect(section).toContain('{item.body}');
    expect(section).toContain('product.publishedAt');
  });
  it('machine index pins release provenance and correct privacy/platform boundaries', () => {
    const text = source('../public/llms.txt');
    for (const term of ['v1.0.63', 'b16aa84d', '2026-11-01T17:06:44Z', 'sleepy-v1', '500', 'read/write', '352', '2528', '1260']) expect(text).toContain(term);
    expect(text).not.toMatch(/feature-aligned with Android|current builds are unsigned|No account, email, phone number, or student number is required/);
  });
});
