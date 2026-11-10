// Resolve latest once. Every release-derived input in this build shares its tag and commit.
// A failed stage stops publication; Cloudflare continues serving the previous complete deployment.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const run = (script, args = []) => execFileSync(process.execPath, [`scripts/${script}`, ...args], { cwd: root, stdio: 'inherit' });
run('fetch-release.mjs');
const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const release = read('src/data/release.json');
if (!/^[0-9a-f]{40}$/.test(release.sourceSha)) throw new Error('Missing immutable release source');
run('fetch-schools.mjs', ['--ref', release.tag]);
run('build-schools.mjs');
const catalog = read('src/data/schools.snapshot.json');
if (catalog.ref !== release.tag || catalog.sourceSha !== release.sourceSha) throw new Error('Mixed release/catalog snapshots');
const product = {
  tag: release.tag, commit: release.sourceSha, publishedAt: release.date,
  reviewedAt: release.builtAt.slice(0, 10), sourceUrl: `https://github.com/lingion/sleepy/tree/${release.tag}`,
};
writeFileSync(new URL('../src/data/product-release.json', import.meta.url), JSON.stringify(product, null, 2) + '\n');
// The bilingual editorial FAQ carries its own review date and is not relabelled as a newer edition.
run('build-faq.mjs');
run('build-release-surfaces.mjs');
execFileSync(process.execPath, ['tools/make-og.mjs'], { cwd: root, stdio: 'inherit' });
console.log(`[sync-data] ${release.tag} (${release.sourceSha}): complete release snapshot ready`);
