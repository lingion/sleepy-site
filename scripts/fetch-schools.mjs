// 教务快照刷新 — spec §4.1:快照 = 有意冻结副本(入仓),自动读取安卓最新更新。
// 优先级: ① 本地安卓仓库(origin/main 或工作区) ② gh CLI (GitHub API raw) ③ 网络直接拉取 ④ 仓内快照兜底
// 口径: 上游全表含 pending/grad_pending 在途条目,官网只收录「在用」cohort
//       (status ∉ {pending, grad_pending};字段缺省 = supported,老快照兼容)。
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const SNAPSHOT = fileURLToPath(new URL('../fixtures/schools.json', import.meta.url));
const RAW_URL = 'https://raw.githubusercontent.com/lingion/sleepy/main/app/src/main/assets/schools.json';
const API_URL = 'https://api.github.com/repos/lingion/sleepy/contents/app/src/main/assets/schools.json';

const IN_USE = (s) => s.status !== 'pending' && s.status !== 'grad_pending';

function tryLocalRepo() {
  const candidates = [
    process.env.SLEEPY_REPO_DIR,
    '/Users/lingion_k/sleepy',
    '../sleepy',
  ].filter(Boolean);

  for (const dir of candidates) {
    if (existsSync(dir)) {
      try {
        const out = execSync('git show origin/main:app/src/main/assets/schools.json', {
          cwd: dir,
          encoding: 'utf8',
          maxBuffer: 15 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        JSON.parse(out);
        return { text: out, source: `本地仓库 origin/main (${dir})` };
      } catch {}

      const filePath = `${dir}/app/src/main/assets/schools.json`;
      if (existsSync(filePath)) {
        try {
          const out = readFileSync(filePath, 'utf8');
          JSON.parse(out);
          return { text: out, source: `本地文件 (${filePath})` };
        } catch {}
      }
    }
  }
  return null;
}

function tryGhCli() {
  try {
    const out = execSync('gh api -H "Accept: application/vnd.github.raw" repos/lingion/sleepy/contents/app/src/main/assets/schools.json', {
      encoding: 'utf8',
      maxBuffer: 15 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    JSON.parse(out);
    return { text: out, source: 'gh api CLI' };
  } catch {
    return null;
  }
}

async function tryNetworkFetch() {
  const headers = { Accept: 'application/vnd.github.raw' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  // 1. 尝试 GitHub REST API
  try {
    const res = await fetch(API_URL, { headers, signal: AbortSignal.timeout(15_000) });
    if (res.ok) {
      const text = await res.text();
      JSON.parse(text);
      return { text, source: 'GitHub API (contents)' };
    }
  } catch {}

  // 2. 尝试 raw.githubusercontent.com 直连/镜像
  const urls = [
    RAW_URL,
    'https://raw.gitmirror.com/lingion/sleepy/main/app/src/main/assets/schools.json',
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(15_000) });
      if (res.ok) {
        const text = await res.text();
        JSON.parse(text);
        return { text, source: `网络直连 (${u})` };
      }
    } catch {}
  }
  return null;
}

async function main() {
  let fetched = tryLocalRepo() || tryGhCli() || (await tryNetworkFetch());

  if (!fetched) {
    console.warn('[fetch-schools] 未能从本地仓库或网络拉取最新 schools.json，使用仓内快照继续');
    return;
  }

  const before = JSON.parse(readFileSync(SNAPSHOT, 'utf8')).length;
  const full = JSON.parse(fetched.text);
  const next = full.filter(IN_USE);
  writeFileSync(SNAPSHOT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`[fetch-schools] 成功从 ${fetched.source} 读取最新教务: 快照 ${before} → ${next.length} 条 (上游全量 ${full.length}, 排除在途 ${full.length - next.length})`);
}

main();
