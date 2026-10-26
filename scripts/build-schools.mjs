// 教务分组构建 — spec §4.1 不变量执行体
// 输入: fixtures/schools.json(快照) + src/data/geo-prefix.json + src/data/province-manual.json
// 输出: src/data/schools.grouped.json — 每条 +province:{code,zh,en}(sortKey==='*' →「其它」桶)
// 归组四层(顺序固定):① '*'→其它 ② 人工表 ③ 最长前缀 ④ moe 目录号解省码;四层皆空 = 未归组。
// 闸: ungrouped==0 否则 exit 1(覆盖率不变量,数字不硬编码);协议/省份计数全部现场派生打印。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  buildGeoIndex,
  classifyProvince,
  decodeProvinceByCatalogId,
} from '../src/lib/geo.ts';

const geo = JSON.parse(readFileSync(new URL('../src/data/geo-prefix.json', import.meta.url), 'utf8'));
const manual = JSON.parse(readFileSync(new URL('../src/data/province-manual.json', import.meta.url), 'utf8'));
const schools = JSON.parse(readFileSync(new URL('../fixtures/schools.json', import.meta.url), 'utf8'));

const OTHER = { code: 'OTHER', zh: '其它', en: 'Other' };
const idx = buildGeoIndex(geo);

const grouped = [];
const ungrouped = [];
let manualHits = 0;
let prefixHits = 0;
let moeHits = 0;
let starHits = 0;
for (const s of schools) {
  let code;
  if (s.sortKey === '*') {
    code = OTHER.code; // 北邮 VPN/WebVPN 两条,不静默丢(spec §4.1)
    starHits++;
  } else if (s.name in manual) {
    code = manual[s.name]; // 人工表优先于前缀(地理纠错,如 北师大珠海分校→GD)
    manualHits++;
  } else {
    const hit = classifyProvince(s.name, idx);
    if (hit) {
      code = hit.code;
      prefixHits++;
    } else {
      const moe = decodeProvinceByCatalogId(s.catalogId, geo.provinces);
      if (moe) {
        code = moe; // 第 4 层:名称无地理头,但教育部代码第 3-4 位是省级区划码
        moeHits++;
      } else {
        ungrouped.push(s.name);
        continue;
      }
    }
  }
  const meta = code === OTHER.code ? OTHER : geo.provinces[code];
  if (!meta) {
    console.error(`[build-schools] 省码 ${code} 无对应 meta(geo-prefix 查错层?)`);
    process.exit(1);
  }
  // 官网不消费教务 URL(点击不跳转,spec §3③);catalogId/status 只服务归组与对账,不进包体
  const { url, catalogId, status, ...rest } = s;
  grouped.push({ ...rest, province: { code, zh: meta.zh, en: meta.en } });
}

if (ungrouped.length > 0) {
  console.error(`[build-schools] 覆盖率不变量破裂: ${ungrouped.length} 条无法判定省份 →`);
  for (const n of ungrouped) console.error(`  - ${n}`);
  console.error("修法: 补 src/data/geo-prefix.json(前缀)或 province-manual.json(方向头校名人工表);moe 码异常需对账上游");
  process.exit(1);
}

// 协议面闸改「派生一致」而非「钉死数字」:源 fixture 与产物 type 集合必须全等(丢型 = 分组 bug);
// 计数真值以打印为准(§4.1「在用协议数」随上游目录演进,逐批对账一次,测试侧另锁)。
const srcTypes = new Set(schools.map((s) => s.type));
const outTypes = new Set(grouped.map((g) => g.type));
if (srcTypes.size !== outTypes.size || [...srcTypes].some((t) => !outTypes.has(t))) {
  console.error('[build-schools] 协议面不一致: 源与产物 type 集合不等(分组丢型?)');
  process.exit(1);
}
const provCodes = new Set(grouped.map((g) => g.province.code));
if (provCodes.has('undefined')) {
  console.error('[build-schools] province.code 有缺失(meta 查错层?)');
  process.exit(1);
}
if (!provCodes.has('OTHER')) {
  console.error("[build-schools] 「其它」桶缺失('*' 条目被丢?)");
  process.exit(1);
}

const out = fileURLToPath(new URL('../src/data/schools.grouped.json', import.meta.url));
writeFileSync(out, `${JSON.stringify(grouped, null, 2)}\n`);
console.log(
  `[build-schools] ${grouped.length}/${schools.length} 条全分组(前缀 ${prefixHits} · 人工表 ${manualHits} · moe解 ${moeHits} · '*'→其它 ${starHits})· ${provCodes.size} 省码(含其它)· ${srcTypes.size} 协议`,
);
