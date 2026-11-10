// Release 资产拉取 — spec §4.2 防腐烂执行体
// Resolve the latest stable release by default; explicit tags are for local inspection.
// 失败分级(spec §5): releases 腐烂不可装绿 → 拉取失败 exit 1;
//   唯一例外 = 显式 --offline(本地开发用,读仓内快照 + 打 BUILD_META 警告;CI 禁用此旗标)。
// 烘入 BUILD_TIME: 每次成功拉取/离线快照都写 builtAt,footer meta 展示(tag+time 可见腐烂信号)。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const OUT = fileURLToPath(new URL('../src/data/release.json', import.meta.url));
export function releaseApiUrl(tag = 'latest') {
  if (tag !== 'latest' && !/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error(`Invalid release tag: ${tag}`);
  return `https://api.github.com/repos/lingion/sleepy/releases/${tag === 'latest' ? 'latest' : `tags/${tag}`}`;
}
const ABI = ['app-arm64-v8a-release.apk', 'app-armeabi-v7a-release.apk', 'app-x86_64-release.apk', 'app-universal-release.apk'];

export function validate(rel) {
  const errs = [];
  if (!rel.tag || !/^v\d+\.\d+\.\d+$/.test(rel.tag)) errs.push(`tag 异常: ${rel.tag}`);
  if (!rel.date || !Number.isFinite(Date.parse(rel.date))) errs.push('Release publication date missing');
  if (!Array.isArray(rel.assets) || rel.assets.length !== 4) errs.push(`资产应为 4 ABI,实得 ${rel.assets?.length}`);
  else {
    for (const a of rel.assets) {
      if (!ABI.includes(a.name)) errs.push(`未知资产名: ${a.name}`);
      if (!/^https:\/\//.test(a.url)) errs.push(`资产 url 非绝对: ${a.name}`);
      if (typeof a.size !== 'number' || a.size <= 0) errs.push(`资产 size 异常: ${a.name}`);
    }
    const missing = ABI.filter((n) => !rel.assets.some((a) => a.name === n));
    if (missing.length) errs.push(`缺 ABI: ${missing.join(', ')}`);
  }
  if (!rel.sha256sumsUrl || !/sha256sums\.txt$/.test(rel.sha256sumsUrl)) errs.push(`sha256sumsUrl 缺失/异常: ${rel.sha256sumsUrl}`);
  return errs;
}

export function releaseFromApi(json) {
  // REST(/releases/latest)字段 = tag_name/browser_download_url;gh --json 变体 = tagName/url。
  // 两路都容忍:REST 是 CI 通路,gh 变体仅本地快照/调试用。
  const assets = json.assets ?? [];
  const dl = (a) => a.browser_download_url ?? a.url;
  const sums = assets.find((a) => a.name === 'sha256sums.txt');
  return {
    tag: json.tag_name ?? json.tagName,
    date: json.published_at ?? json.publishedAt ?? json.created_at ?? json.createdAt,
    id: json.id,
    url: json.html_url ?? json.url,
    name: json.name ?? json.tag_name ?? json.tagName,
    body: json.body ?? '',
    assets: assets
      .filter((a) => ABI.includes(a.name))
      .map((a) => ({ name: a.name, url: dl(a), size: a.size, ...(a.id ? { id: a.id } : {}),
        ...(/^sha256:[0-9a-f]{64}$/.test(a.digest ?? '') ? { sha256: a.digest.slice(7) } : {}) })),
    sha256sumsUrl: sums ? dl(sums) : null,
    builtAt: new Date().toISOString(),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const offline = process.argv.includes('--offline');
  const tagIndex = process.argv.indexOf('--tag');
  const selectedTag = tagIndex >= 0 ? process.argv[tagIndex + 1] : 'latest';
  const apiUrl = releaseApiUrl(selectedTag);
  let rel;
  if (offline) {
    rel = JSON.parse(readFileSync(OUT, 'utf8'));
    console.warn(`[fetch-release] --offline:使用仓内快照 BUILD_META tag=${rel.tag} fetched=${rel.builtAt}`);
    console.warn('[fetch-release] CI 禁用 --offline(spec §4.2:API 失败必须非零退出,禁装绿)');
  } else {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    let rawJson = null;
    try {
      const res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10_000) });
      if (res.ok) rawJson = await res.json();
    } catch {
      // Preserve the CLI fallback while keeping the same explicit version.
    }
    if (!rawJson) {
      try {
        const endpoint = selectedTag === 'latest' ? 'releases/latest' : `releases/tags/${selectedTag}`;
        const ghOut = execFileSync('gh', ['api', `repos/lingion/sleepy/${endpoint}`], {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        rawJson = JSON.parse(ghOut);
      } catch (err) {
        console.error(`[fetch-release] API 与 gh CLI 均失败: ${err.message} — 下载页腐烂不可装绿,exit 1(spec §4.2/§5)`);
        process.exit(1);
      }
    }
    if (rawJson.draft || rawJson.prerelease) throw new Error('Only published stable releases may update production');
    rel = releaseFromApi(rawJson);
    if (!rel.body.trim()) throw new Error('Release notes are required');
    const commit = JSON.parse(execFileSync('gh', ['api', `repos/lingion/sleepy/commits/${rel.tag}`], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], timeout: 60000,
    }));
    if (!/^[0-9a-f]{40}$/.test(commit.sha)) throw new Error('Invalid release source SHA');
    rel.sourceSha = commit.sha;
  }
  const errs = validate(rel);
  if (errs.length) {
    console.error('[fetch-release] release.json 校验失败:');
    for (const e of errs) console.error(`  - ${e}`);
    process.exit(1);
  }
  writeFileSync(OUT, `${JSON.stringify(rel, null, 2)}\n`);
  console.log(`[fetch-release] ${rel.tag} · 4 ABI + sha256sums · builtAt=${rel.builtAt}`);
}
