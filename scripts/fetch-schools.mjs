// Refresh the reviewed release, never a mutable Android working tree or main.
// Configured local Git objects, GitHub CLI and REST are equivalent immutable sources.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { buildGeoIndex, classifyProvince } from '../src/lib/geo.ts';

const snapshotUrl = new URL('../src/data/schools.snapshot.json', import.meta.url);
const previous = JSON.parse(readFileSync(snapshotUrl, 'utf8'));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--ref')) throw new Error('Usage: fetch-schools.mjs [--ref <release-tag>]');
const ref = args[1] ?? previous.ref;
if (!/^v\d+\.\d+\.\d+$/.test(ref ?? '')) throw new Error('A release tag is required');

async function getApi(path) {
  try {
    return JSON.parse(execFileSync('gh', ['api', `repos/lingion/sleepy/${path}`], {
      encoding: 'utf8', maxBuffer: 15 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'],
    }));
  } catch {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/lingion/sleepy/${path}`, {
      signal: AbortSignal.timeout(60000), headers,
    });
    if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`);
    return response.json();
  }
}

async function readSource(path, sourceSha) {
  if (process.env.SLEEPY_REPO_DIR) {
    try {
      return JSON.parse(execFileSync('git', ['show', `${sourceSha}:${path}`], {
        cwd: process.env.SLEEPY_REPO_DIR, encoding: 'utf8', maxBuffer: 15 * 1024 * 1024,
        timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'],
      }));
    } catch { /* Use the same immutable revision through the API instead. */ }
  }
  let file = await getApi(`contents/${path}?ref=${sourceSha}`);
  if (file.encoding !== 'base64' && /^[0-9a-f]{40}$/.test(file.sha ?? '')) {
    file = await getApi(`git/blobs/${file.sha}`);
  }
  if (file.encoding !== 'base64' || typeof file.content !== 'string') throw new Error(`Invalid source body: ${path}`);
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
}

try {
  const commit = await getApi(`commits/${encodeURIComponent(ref)}`);
  const sourceSha = commit.sha;
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('Invalid source commit SHA');
  const sourcePath = 'app/src/main/assets/schools.json';
  const citySourcePath = 'app/src/main/assets/school_cities.json';
  const [schools, cities] = await Promise.all([readSource(sourcePath, sourceSha), readSource(citySourcePath, sourceSha)]);
  if (!Array.isArray(schools) || !schools.length || schools.some(s => !s.name || !s.catalogId)
      || new Set(schools.map(s => s.catalogId)).size !== schools.length) throw new Error('Invalid school snapshot');
  const allowed = new Set(['supported', 'grad_supported', 'unverified', 'grad_unverified', 'pending', 'grad_pending']);
  if (schools.some(s => !allowed.has(s.status ?? 'supported'))) throw new Error('Unknown source status');
  if (!cities.schools || typeof cities.schools !== 'object') throw new Error('Invalid city snapshot');
  const idx = buildGeoIndex(JSON.parse(readFileSync(new URL('../src/data/geo-prefix.json', import.meta.url), 'utf8')));
  const provinceBySchool = {};
  for (const [name, values] of Object.entries(cities.schools)) {
    const codes = values.map(city => classifyProvince(city, idx)?.code);
    if (codes.length && codes.every(code => code && code === codes[0])) provinceBySchool[name] = codes[0];
  }
  const release = await getApi(`releases/tags/${encodeURIComponent(ref)}`);
  const releasedAt = release.published_at?.slice(0, 10);
  if (!releasedAt) throw new Error('Release publication date missing');
  // Validate every input before replacing either tracked snapshot. Keep all statuses.
  writeFileSync(new URL('../fixtures/schools.json', import.meta.url), JSON.stringify(schools, null, 2) + '\n');
  writeFileSync(snapshotUrl, JSON.stringify({ ref, sourceSha, sourcePath, releasedAt, citySourcePath, provinceBySchool }, null, 2) + '\n');
  console.log(`[fetch-schools] ${ref} (${sourceSha}): ${schools.length} full records; run build-schools.mjs next.`);
} catch (error) {
  console.error(`[fetch-schools] Refresh aborted; existing snapshot retained: ${error.message}`);
  process.exitCode = 1;
}
