// Release 资产拉取 — spec §4.2 防腐烂执行体
// 契约: GitHub API latest(有 GITHUB_TOKEN 走认证,绕 CF/匿名 60/hr)→ src/data/release.json
// 失败分级(spec §5): releases 腐烂不可装绿 → 拉取失败 exit 1;
//   唯一例外 = 显式 --offline(本地开发用,读仓内快照 + 打 BUILD_META 警告;CI 禁用此旗标)。
// 烘入 BUILD_TIME: 每次成功拉取/离线快照都写 builtAt,footer meta 展示(tag+time 可见腐烂信号)。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/release.json', import.meta.url));
const API = 'https://api.github.com/repos/lingion/sleepy/releases/latest';
const ABI = ['app-arm64-v8a-release.apk', 'app-armeabi-v7a-release.apk', 'app-x86_64-release.apk', 'app-universal-release.apk'];

export function validate(rel) {
  const errs = [];
  if (!rel.tag || !/^v\d+\.\d+\.\d+$/.test(rel.tag)) errs.push(`tag 异常: ${rel.tag}`);
  if (!Array.isArray(rel.assets) || rel.assets.length !== 4) errs.push(`资产应为 4 ABI,实得 ${rel.assets?.length}`);
  else {
    for (const a of rel.assets) {
      if (!ABI.includes(a.name)) errs.push(`未知资产名: ${a.name}`);
      if (!/^https/.test(a.url)) errs.push(`资产 url 非绝对: ${a.name}`);
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
    assets: assets
      .filter((a) => ABI.includes(a.name))
      .map((a) => ({ name: a.name, url: dl(a), size: a.size })),
    sha256sumsUrl: sums ? dl(sums) : null,
    builtAt: new Date().toISOString(),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const offline = process.argv.includes('--offline');
  let rel;
  if (offline) {
    rel = JSON.parse(readFileSync(OUT, 'utf8'));
    console.warn(`[fetch-release] --offline:使用仓内快照 BUILD_META tag=${rel.tag} fetched=${rel.builtAt}`);
    console.warn('[fetch-release] CI 禁用 --offline(spec §4.2:API 失败必须非零退出,禁装绿)');
  } else {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    let res;
    try {
      res = await fetch(API, { headers, signal: AbortSignal.timeout(20_000) });
    } catch (err) {
      console.error(`[fetch-release] API 网络失败: ${err.message} — 下载页腐烂不可装绿,exit 1(spec §4.2/§5)`);
      process.exit(1);
    }
    if (!res.ok) {
      console.error(`[fetch-release] API HTTP ${res.status} — exit 1(禁烘旧 tag 装绿)`);
      process.exit(1);
    }
    rel = releaseFromApi(await res.json());
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
