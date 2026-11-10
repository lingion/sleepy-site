import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { releaseFromApi } from './fetch-release.mjs';

export function assertCurrentRelease(snapshot, raw) {
  const comparable = ({ id, tag, date, body, assets, sha256sumsUrl }) => ({
    id, tag, date, body, sha256sumsUrl,
    assets: [...assets].sort((a, b) => a.name.localeCompare(b.name)),
  });
  if (raw.draft || raw.prerelease ||
      JSON.stringify(comparable(snapshot)) !== JSON.stringify(comparable(releaseFromApi(raw)))) {
    throw new Error('Upstream release changed during the build; a fresh sync must publish it');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const release = JSON.parse(readFileSync(new URL('../src/data/release.json', import.meta.url), 'utf8'));
  const latest = JSON.parse(execFileSync('gh', ['api', 'repos/lingion/sleepy/releases/latest'], { encoding: 'utf8' }));
  assertCurrentRelease(release, latest);
  console.log(`[verify-latest] ${release.tag}: current published release matches this deployment`);
}
