import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { releaseApiUrl } from './fetch-release.mjs';

describe('release refresh contract', () => {
  it('follows the latest published release without a manual version edit', () => {
    expect(releaseApiUrl()).toMatch(/\/releases\/latest$/);
  });
  it('uses one resolved immutable source for downloads, notes and the catalog', () => {
    const sync = readFileSync(new URL('./sync-data.mjs', import.meta.url), 'utf8');
    expect(sync).toContain('fetch-release.mjs');
    expect(sync).toContain('fetch-schools.mjs');
    expect(sync).toContain('release.sourceSha');
    expect(sync).toContain('release.tag');
    expect(sync).toContain('product-release.json');
  });
});
