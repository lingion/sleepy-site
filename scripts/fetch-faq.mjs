// Explicitly refresh the reviewed editorial FAQ; never silently consume Android main.
// Use --source /path/to/FAQ.md or --ref <immutable commit>, then update the paired translation.
// Normal build-faq generation remains offline. Failed refresh preserves the old file and exits nonzero.
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Editorial FAQ revisions are separate from the released product tag. Refresh is explicit.
const refIndex = process.argv.indexOf('--ref');
const ref = refIndex >= 0 ? process.argv[refIndex + 1] : null;
const sourceIndex = process.argv.indexOf('--source');
const localSource = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : null;
const RAW_URL = ref ? `https://raw.githubusercontent.com/lingion/sleepy/${encodeURIComponent(ref)}/FAQ.md` : null;
const SNAPSHOT = fileURLToPath(new URL('../fixtures/FAQ.md', import.meta.url));

async function main() {
  let text;
  if ((!ref && !localSource) || (ref && localSource)) {
    console.error('Specify exactly one reviewed FAQ source: --source path or --ref immutable-commit');
    process.exitCode = 1;
    return;
  }
  try {
    if (localSource) text = readFileSync(localSource, 'utf8');
    else {
      if (!/^[0-9a-f]{40}$/.test(ref)) throw new Error('--ref must be an immutable 40-character commit SHA');
      const res = await fetch(RAW_URL, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
    }
    if (!/^# /.test(text)) throw new Error('内容非 Markdown 顶层标题(疑似错误页)');
  } catch (err) {
    console.error(`[fetch-faq] Refresh failed (${err.message}); existing reviewed snapshot preserved.`);
    process.exitCode = 1;
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
