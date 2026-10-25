// 教务快照刷新 — spec §4.1:快照 = 有意冻结副本(入仓),网络拉取仅刷新。
// 失败分级:网络失败 → 警告 + 用仓内快照继续(内容类,陈旧可接受;spec §5)。
// 口径:上游全表含 pending/grad_pending 在途条目,官网只收录「在用」cohort
//       (status ∉ {pending, grad_pending};字段缺省 = supported,老快照兼容)。
// 用法: node scripts/fetch-schools.mjs(CI 的 data 步骤前可选跑;本地离线安全)
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAW_URL =
  'https://raw.githubusercontent.com/lingion/sleepy/main/app/src/main/assets/schools.json';
const SNAPSHOT = fileURLToPath(new URL('../fixtures/schools.json', import.meta.url));

const IN_USE = (s) => s.status !== 'pending' && s.status !== 'grad_pending';

async function main() {
  let text;
  try {
    const res = await fetch(RAW_URL, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
    JSON.parse(text); // 解析失败(HTML 错误页等)同样走兜底
  } catch (err) {
    console.warn(`[fetch-schools] 拉取失败(${err.message}),使用仓内快照继续 — spec §5 内容类陈旧可接受`);
    return;
  }
  const before = JSON.parse(readFileSync(SNAPSHOT, 'utf8')).length;
  const full = JSON.parse(text);
  const next = full.filter(IN_USE);
  writeFileSync(SNAPSHOT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`[fetch-schools] 快照更新: ${before} → ${next.length} 条(上游全表 ${full.length},在途剔除 ${full.length - next.length})`);
}

main();
