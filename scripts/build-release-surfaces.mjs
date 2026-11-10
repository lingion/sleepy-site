import { readFileSync, writeFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const release = read('src/data/release.json');
const product = read('src/data/product-release.json');
const catalog = read('src/data/schools.snapshot.json');
if (release.tag !== product.tag || catalog.ref !== release.tag) throw new Error('Mixed release surfaces');
writeFileSync(new URL('../public/release.json', import.meta.url), JSON.stringify({ ...release, catalog: {
  sourceSha: catalog.sourceSha, ref: catalog.ref, rowCount: catalog.rowCount,
} }, null, 2) + '\n');
writeFileSync(new URL('../public/llms.txt', import.meta.url), `# Sleepy · 轻课表 — Official Website

> Release snapshot: Android ${release.tag}, source commit ${product.commit}, published ${release.date}. Snapshot refreshed ${product.reviewedAt}. Source: ${product.sourceUrl}.

Sleepy is an independent, GPL-3.0, local-first university timetable app maintained by Lingion. Android, iOS and the web trial have separate feature sets.

## Current release

- Release: ${release.url}
- Complete English and Chinese release notes: https://sleepy.is-my.app/releases/
- Machine-readable release notes, APK assets and SHA-256 digests: https://sleepy.is-my.app/release.json
- Download: https://sleepy.is-my.app/download/
${release.assets.map(a => `- ${a.name}: ${a.url}${a.sha256 ? ` (SHA-256 ${a.sha256})` : ''}`).join('\n')}
- Checksum manifest: ${release.sha256sumsUrl}

## Website pages

- https://sleepy.is-my.app/ and /en/: product overview and interactive demo timetable.
- https://sleepy.is-my.app/schools/ and /en/schools/: ${catalog.rowCount} school connections from ${catalog.ref} (${catalog.sourceSha}). Listing does not guarantee a successful login at every school.
- https://sleepy.is-my.app/releases/ and /en/releases/: complete upstream release notes, refreshed with the assets as one deployment.
- https://sleepy.is-my.app/faq/ and /en/faq/: reviewed bilingual FAQ, with its separate editorial date. New release behavior is documented in the release notes. Machine-readable FAQ: https://sleepy.is-my.app/faq.json.
- Web trial: https://sleepy.is-my.app/preview
- Android source: https://github.com/lingion/sleepy. Project index: https://github.com/lingion/sleepy/blob/main/llms.txt.
- iOS source: https://github.com/lingion/sleepy-ios. App Store release: https://apps.apple.com/app/id6827001840, available outside mainland China. The mainland China release is still under review; use TestFlight there: https://testflight.apple.com/join/SxymmDzf. Store and beta versions are independent; GitHub is the source repository, not an iOS update channel.
- App Store and TestFlight availability was reviewed on 2026-11-10, separately from the Android release snapshot.
- Android download source: choose the project mirror (https://gh.qdp.qzz.io) or original GitHub files on https://sleepy.is-my.app/download/. Both provide the same release files; verify with the published SHA-256 manifest.
- Open-source licenses and credits: https://sleepy.is-my.app/licenses/ and /en/licenses/.
- Privacy policy: https://sleepy.is-my.app/privacy/ and /en/privacy/.

No Sleepy account is required. Academic import may need school credentials. Local storage does not mean every feature operates without a network. Refer to the released source and complete notes for version-specific behavior.
`);
