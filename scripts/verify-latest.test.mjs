import { describe, expect, it } from 'vitest';
import { assertCurrentRelease } from './verify-latest.mjs';
import { releaseFromApi } from './fetch-release.mjs';

const raw = {
  id: 10, tag_name: 'v1.2.3', published_at: '2026-11-10T00:00:00Z', body: '# Complete notes',
  assets: [{ id: 20, name: 'app-universal-release.apk', size: 100, browser_download_url: 'https://github.com/lingion/sleepy/releases/download/v1.2.3/app-universal-release.apk', digest: `sha256:${'a'.repeat(64)}` }],
};
describe('publication cannot regress or mix changed assets', () => {
  it('accepts an unchanged release regardless of its local build time', () => {
    expect(() => assertCurrentRelease({ ...releaseFromApi(raw), builtAt: 'yesterday' }, raw)).not.toThrow();
  });
  it.each([
    { ...raw, id: 11, tag_name: 'v1.2.4' },
    { ...raw, body: '# Corrected notes' },
    { ...raw, assets: [{ ...raw.assets[0], id: 21 }] },
    { ...raw, assets: [{ ...raw.assets[0], digest: `sha256:${'b'.repeat(64)}` }] },
    { ...raw, draft: true },
    { ...raw, prerelease: true },
  ])('stops a deployment when the current published source changes (%j)', current => {
    expect(() => assertCurrentRelease(releaseFromApi(raw), current)).toThrow(/changed/);
  });
});
