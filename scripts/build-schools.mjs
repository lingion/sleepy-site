// 教务分组构建 — spec §4.1 不变量执行体
// 输入: fixtures/schools.json(快照) + src/data/geo-prefix.json + src/data/province-manual.json
// 输出: src/data/schools.grouped.json — 每条 +province:{code,zh,en}(sortKey==='*' →「其它」桶)
// 闸: ungrouped==0 否则 exit 1(覆盖率不变量,数字不硬编码);type 计数与源一致(33 协议闸)。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildGeoIndex, classifyProvince } from '../src/lib/geo.ts';

const geo = JSON.parse(readFileSync(new URL('../src/data/geo-prefix.json', import.meta.url), 'utf8'));
const manual = JSON.parse(readFileSync(new URL('../src/data/province-manual.json', import.meta.url), 'utf8'));
const schools = JSON.parse(readFileSync(new URL('../fixtures/schools.json', import.meta.url), 'utf8'));

const OTHER = { code: 'OTHER', zh: '其它', en: 'Other' };
const idx = buildGeoIndex(geo);

const grouped = [];
const ungrouped = [];
let manualHits = 0;
for (const s of schools) {
  let code;
  if (s.sortKey === '*') {
    code = OTHER.code; // 北邮 VPN/WebVPN 两条,不静默丢(spec §4.1)
  } else if (s.name in manual) {
    code = manual[s.name]; // 人工表优先于前缀(地理纠错,如 北师大珠海分校→GD)
    manualHits++;
  } else {
    const hit = classifyProvince(s.name, idx);
    if (hit) {
      code = hit.code;
    } else {
      ungrouped.push(s.name);
      continue;
    }
  }
  const meta = code === OTHER.code ? OTHER : geo.provinces[code];
  if (!meta) {
    console.error(`[build-schools] 省码 ${code} 无对应 meta(geo-prefix 查错层?)`);
    process.exit(1);
  }
  const { url, ...rest } = s; // 官网不消费教务 URL(点击不跳转,spec §3③),剥除减小注水
  grouped.push({ ...rest, province: { code, zh: meta.zh, en: meta.en } });
}

if (ungrouped.length > 0) {
  console.error(`[build-schools] 覆盖率不变量破裂: ${ungrouped.length} 条无法判定省份 →`);
  for (const n of ungrouped) console.error(`  - ${n}`);
  console.error('修法: 补 src/data/geo-prefix.json(前缀)或 province-manual.json(方向头校名人工表)');
  process.exit(1);
}

const types = new Set(schools.map((s) => s.type));
if (types.size !== 33) {
  console.error(`[build-schools] 协议计数异常: 期望 33,实得 ${types.size}(源数据变了?对账 spec §4.1 口径)`);
  process.exit(1);
}
const provCodes = new Set(grouped.map((g) => g.province.code));
if (provCodes.has('undefined')) {
  console.error('[build-schools] province.code 有缺失(meta 查错层?)');
  process.exit(1);
}
if (!provCodes.has('OTHER')) {
  console.error('[build-schools] 「其它」桶缺失('*' 条目被丢?)');
  process.exit(1);
}

const out = fileURLToPath(new URL('../src/data/schools.grouped.json', import.meta.url));
writeFileSync(out, `${JSON.stringify(grouped, null, 2)}\n`);
console.log(
  `[build-schools] ${grouped.length}/${schools.length} 条全分组(前缀命中 ${schools.length - manualHits - 2} · 人工表 ${manualHits} · '*'→其它 2)· ${provCodes.size} 省 + 其它 · ${types.size} 协议`,
);
