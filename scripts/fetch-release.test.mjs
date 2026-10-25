import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { releaseFromApi, validate } from './fetch-release.mjs';

const snapshot = JSON.parse(
  readFileSync(new URL('../src/data/release.json', import.meta.url), 'utf8'),
);

describe('validate 防腐烂闸(spec §4.2)', () => {
  it('缺 sha256sumsUrl → 校验失败', () => {
    const errs = validate({ ...snapshot, sha256sumsUrl: null });
    expect(errs.some((e) => /sha256sums/.test(e))).toBe(true);
  });
  it('未知资产名(ABI 漂移)→ 校验失败', () => {
    const bad = { ...snapshot, assets: [{ name: 'app-riscv64-release.apk', url: 'https://x', size: 1 }, ...snapshot.assets.slice(0, 3)] };
    expect(validate(bad).length).toBeGreaterThan(0);
  });
  it('非 v*.*.* 的 tag → 校验失败', () => {
    expect(validate({ ...snapshot, tag: 'nightly-2026' }).length).toBeGreaterThan(0);
  });
  it('仓内快照 release.json 本身必须通过校验(快照腐烂 = 测试红)', () => {
    expect(validate(snapshot)).toEqual([]);
    expect(snapshot.tag).toBe('v1.0.62');
    expect(snapshot.assets.map((a) => a.name).sort()).toEqual(
      ['app-arm64-v8a-release.apk', 'app-armeabi-v7a-release.apk', 'app-universal-release.apk', 'app-x86_64-release.apk'].sort(),
    );
  });
});

describe('releaseFromApi 双格式映射', () => {
  const fake = (over) => ({
    tag_name: 'v1.2.3',
    published_at: '2026-01-01T00:00:00Z',
    assets: [
      { name: 'app-arm64-v8a-release.apk', browser_download_url: 'https://a/1', size: 10 },
      { name: 'app-armeabi-v7a-release.apk', browser_download_url: 'https://a/2', size: 11 },
      { name: 'app-x86_64-release.apk', browser_download_url: 'https://a/3', size: 12 },
      { name: 'app-universal-release.apk', browser_download_url: 'https://a/4', size: 13 },
      { name: 'sha256sums.txt', browser_download_url: 'https://a/5', size: 367 },
      { name: 'source.zip', browser_download_url: 'https://a/6', size: 999 },
    ],
    ...over,
  });
  it('REST 格式:筛 4 ABI + sha256sumsUrl,忽略无关资产', () => {
    const r = releaseFromApi(fake());
    expect(r.assets).toHaveLength(4);
    expect(r.sha256sumsUrl).toBe('https://a/5');
    expect(r.tag).toBe('v1.2.3');
    expect(r.builtAt).toMatch(/Z$/);
  });
  it('gh --json 变体(tagName/url)同样可映射', () => {
    const r = releaseFromApi({
      tagName: 'v1.0.61',
      publishedAt: '2026-10-10T14:09:31Z',
      assets: [
        { name: 'sha256sums.txt', url: 'https://g/5', size: 367 },
        ...['arm64-v8a', 'armeabi-v7a', 'universal', 'x86_64'].map((k) => ({ name: `app-${k}-release.apk`, url: `https://g/${k}`, size: 4600000 })),
      ],
    });
    expect(r.assets).toHaveLength(4);
    expect(r.sha256sumsUrl).toBe('https://g/5');
  });
});
