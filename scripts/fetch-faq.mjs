// FAQ 快照刷新 — spec §5 内容类陈旧可接受(手动执行,不进 CI data 链路)
// 职责分工照 fetch-schools.mjs 先例:本脚本只负责把主仓最新 FAQ.md 回写 fixtures/FAQ.md;
// 构建侧(build-faq.mjs)永远只读仓内快照,离线确定。
// 失败 = 警告 + 保留旧快照 exit 0(内容类,陈旧可接受;与 releases 防腐烂的 exit 1 分级不同)。
// 用法: node scripts/fetch-faq.mjs(手动;跑完记得重跑 node scripts/build-faq.mjs 再生成 faq.json)
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAW_URL = 'https://raw.githubusercontent.com/lingion/sleepy/main/FAQ.md';
const SNAPSHOT = fileURLToPath(new URL('../fixtures/FAQ.md', import.meta.url));

async function main() {
  let text;
  try {
    const res = await fetch(RAW_URL, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
    if (!/^# /.test(text)) throw new Error('内容非 Markdown 顶层标题(疑似错误页)');
  } catch (err) {
    console.warn(`[fetch-faq] 拉取失败(${err.message}),保留仓内快照继续 — spec §5 内容类陈旧可接受`);
    return;
  }
  const before = readFileSync(SNAPSHOT, 'utf8').split('\n').length;
  const nextLines = text.split('\n').length;
  writeFileSync(SNAPSHOT, text.endsWith('\n') ? text : `${text}\n`);
  console.log(`[fetch-faq] 快照更新: ${before} → ${nextLines} 行`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
