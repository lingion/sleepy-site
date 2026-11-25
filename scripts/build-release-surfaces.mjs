import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Fetching a release refreshes distribution data only. Editorial claims keep
// the version and date that were actually reviewed in content-baseline / FAQ.
export function buildReleaseSurfaces({ release, product, catalog, baseline, faq }) {
  if (release.tag !== product.tag || catalog.ref !== release.tag
    || release.sourceSha !== product.commit || catalog.sourceSha !== product.commit) {
    throw new Error('Mixed release surfaces');
  }
  if (!product.snapshotRefreshedAt) throw new Error('Missing release snapshot refresh date');
  if (!faq.reviewedVersion || !faq.updatedAt) throw new Error('Missing FAQ editorial baseline');
  for (const platform of ['android', 'ios']) {
    const review = baseline[platform];
    if (!review?.version || !/^[0-9a-f]{40}$/.test(review.commit) || !review.reviewedAt) {
      throw new Error(`Missing ${platform} editorial baseline`);
    }
  }
  const releaseJson = JSON.stringify({ ...release, catalog: {
    sourceSha: catalog.sourceSha, ref: catalog.ref, rowCount: catalog.rowCount,
  } }, null, 2) + '\n';
  const llms = `# Sleepy · 轻课表 — Official Website

> Release snapshot: Android ${release.tag}, source commit ${product.commit}, published ${release.date}. Snapshot refreshed ${product.snapshotRefreshedAt}. Source: ${product.sourceUrl}. Snapshot refresh is automated and does not establish a new editorial review.

Sleepy (轻课表) is an independent, free, ad-free, local-first university timetable app maintained by Lingion. Project code is GPL-3.0; bundled third-party components retain their own licenses. See the licenses page for scope. Android, iOS and the web trial have separate feature sets.

## Documentation reviews

- Android feature descriptions: ${baseline.android.version}, source commit ${baseline.android.commit}, reviewed ${baseline.android.reviewedAt}. Source: https://github.com/lingion/sleepy/tree/${baseline.android.commit}.
- iOS feature descriptions: ${baseline.ios.version}, source commit ${baseline.ios.commit}, reviewed ${baseline.ios.reviewedAt}. Source: https://github.com/lingion/sleepy-ios/tree/${baseline.ios.commit}.
- Bilingual FAQ: Android ${faq.reviewedVersion}, reviewed ${faq.updatedAt}. Pages: https://sleepy.is-my.app/faq/ and https://sleepy.is-my.app/en/faq/. Machine-readable FAQ: https://sleepy.is-my.app/faq.json.
- These editorial baselines are independent of the current release snapshot. Later downloads and release notes do not imply that the feature descriptions were reviewed again.

## Reviewed Android feature scope

The following notes describe Android ${baseline.android.version}, reviewed ${baseline.android.reviewedAt}; they do not establish iOS or web feature parity.

- AI screenshot conversion copies a prompt to the clipboard. You choose an AI service, send the prompt and screenshot yourself, and paste its sleepy-v1 response back into Sleepy for preview. Sleepy does not automatically upload screenshots or call an AI service. Check courses, teaching weeks and period times before importing.
- WebDAV is manual backup and restore over HTTPS, not automatic realtime or cross-platform synchronization. Full .sleepybackup archives are unencrypted ZIP files; the server administrator may read them. Uploads and downloads are limited to 100 MiB. Testing may create the configured directory. WebDAV credentials and connection settings remain local and are excluded from exported and Android system backups. Removing local settings does not delete remote archives; no remote-delete control is provided.
- Widgets have five families and 15 Manifest-registered configuration entries. The seven-day vertical and three-day horizontal 4×2 week grids are independent entries. The old 4×2 receiver was replaced: remove its old home-screen instance and add a new vertical or horizontal widget. Launcher and background restrictions still affect refresh timing.
- New academic imports can retain base period times and date rules for source-provided intervals and years. Day details, Today, widgets, course notifications, daily summaries and class-time do-not-disturb resolve the actual date; explicit course clock times take priority. Some main grids, time scales and overlays still use the current day's period times. Updating or appending an existing timetable does not replace date rules; combined imports cannot directly bind an existing shared period timetable. Ordinary timetable/period exports and ICS do not retain the complete plan; use a compatible full .sleepybackup to preserve it.
- Saved school identity and academic-update eligibility are separate. Timetables created through the in-app academic import flow may return to their original school entry while still eligible. Manual/file/text imports, copied timetables and restored exported backups do not gain update eligibility merely by containing school metadata.

## Current release

- Release: ${release.url}
- Complete Chinese release notes: https://sleepy.is-my.app/releases/
- Complete English release notes: https://sleepy.is-my.app/en/releases/
- Machine-readable release notes, APK assets and SHA-256 digests: https://sleepy.is-my.app/release.json
- Download: https://sleepy.is-my.app/download/
${release.assets.map(a => `- ${a.name}: ${a.url}${a.sha256 ? ` (SHA-256 ${a.sha256})` : ''}`).join('\n')}
- Checksum manifest: ${release.sha256sumsUrl}

## Website pages

- https://sleepy.is-my.app/ and /en/: product overview and interactive demo timetable.
- https://sleepy.is-my.app/schools/ and /en/schools/: ${catalog.rowCount} school directory entries (${catalog.configuredCount} configured, ${catalog.unverifiedCount} unverified) from ${catalog.ref} (${catalog.sourceSha}). Listing does not guarantee a successful login at every school.
- https://sleepy.is-my.app/releases/ and /en/releases/: complete upstream notes in the page language only, refreshed with the assets as one deployment. The machine-readable release snapshot preserves the full bilingual original.
- https://sleepy.is-my.app/faq/ and /en/faq/: bilingual FAQ reviewed against Android ${faq.reviewedVersion} on ${faq.updatedAt}. Newer release behavior is documented in the release notes. Machine-readable FAQ: https://sleepy.is-my.app/faq.json.
- User guides: https://sleepy.is-my.app/guides/ and https://sleepy.is-my.app/en/guides/.
- WakeUp migration guide: https://sleepy.is-my.app/guides/wakeup-migration/ and https://sleepy.is-my.app/en/guides/wakeup-migration/. Offline exports and online codes are distinct import paths; preview and check dates and period times.
- Backup and restore guide: https://sleepy.is-my.app/guides/backup-restore/ and https://sleepy.is-my.app/en/guides/backup-restore/. The guide cites its own reviewed Android implementation and date; its manual WebDAV instructions do not establish iOS or web support.
- Web trial: https://sleepy.is-my.app/preview
- Android source: https://github.com/lingion/sleepy. Project index: https://github.com/lingion/sleepy/blob/main/llms.txt.
- iOS source: https://github.com/lingion/sleepy-ios. App Store release: https://apps.apple.com/app/id6827001840, available in mainland China and other storefront regions. The App Store is the only official installation and update channel; GitHub is the source repository, not an iOS update channel.
- iOS release versions and system requirements are listed on the App Store; they do not follow the Android release snapshot.
- Android download source: choose the project mirror (https://gh.qdp.qzz.io) or original GitHub files on https://sleepy.is-my.app/download/. Both provide the same release files; verify with the published SHA-256 manifest.
- Open-source licenses and credits: https://sleepy.is-my.app/licenses/ and /en/licenses/.
- Privacy policy: https://sleepy.is-my.app/privacy/ and /en/privacy/.

No Sleepy account is required. Academic import may need school credentials. Local storage does not mean every feature operates without a network. Refer to the released source and complete notes for version-specific behavior.
`;
  return { releaseJson, llms };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
  const surfaces = buildReleaseSurfaces({
    release: read('src/data/release.json'),
    product: read('src/data/product-release.json'),
    catalog: read('src/data/schools.snapshot.json'),
    baseline: read('src/data/content-baseline.json'),
    faq: read('src/data/faq.json'),
  });
  writeFileSync(new URL('../public/release.json', import.meta.url), surfaces.releaseJson);
  writeFileSync(new URL('../public/llms.txt', import.meta.url), surfaces.llms);
}
