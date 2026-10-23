#!/usr/bin/env node
// i18n 泄漏闸(v4 spec §7/C2):
//   用法: node tools/i18n-leak-check.mjs src/i18n/zh.ts src/i18n/en.ts [--forbid-question]
//   检查 1(键树对称): zh/en 叶子键路径集合必须完全一致(= i18n-parity 的 CLI 侧镜像)。
//   检查 2(forbid-question): 全部字符串叶子禁问句形态与口语 —— 半角?、全角?、吗、呢、
//     不慌、扫一眼、该出现时出现;命中即列 键路径 + 行,exit 2。
//   注: node ≥22.18 原生剥 TS 类型,可直接 import .ts(erasable syntax only)。
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const FORBIDDEN = [
  { re: /\?|？/, why: '问句(R2)' },
  { re: /吗/, why: '口语问尾(R2/R4)' },
  { re: /呢/, why: '口语问尾(R2/R4)' },
  { re: /不慌/, why: '口语(R4)' },
  { re: /扫一眼/, why: '口语(R4)' },
  { re: /该出现时出现/, why: '口语(R4)' },
];

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const questionOnly = process.argv.includes('--forbid-question');
if (args.length < 2) {
  console.error('用法: node tools/i18n-leak-check.mjs <zh.ts> <en.ts> [--forbid-question]');
  process.exit(2);
}
const [zhPath, enPath] = args.map((p) => resolve(p));

// 取默认导出对象(文件顶部 export const zh / en)
const grab = async (p) => {
  const mod = await import(pathToFileURL(p).href);
  const key = Object.keys(mod).find((k) => k !== 'default' && typeof mod[k] === 'object');
  if (!key) throw new Error(`无导出字典: ${p}`);
  return mod[key];
};
const zh = await grab(zhPath);
const en = await grab(enPath);

function leaves(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) leaves(v, path, out);
    else if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
      v.forEach((item, i) => leaves(item, `${path}[${i}]`, out));
    } else if (typeof v === 'string') out.push([path, v]);
    else out.push([path, '']); // 函数叶子:体由测试侧断言,此处只对称计数
  }
  return out;
}

const zl = leaves(zh);
const el = leaves(en);
let fail = 0;

if (!questionOnly) {
  const zKeys = zl.map(([k]) => k).sort();
  const eKeys = el.map(([k]) => k).sort();
  const same = zKeys.length === eKeys.length && zKeys.every((k, i) => k === eKeys[i]);
  console.log(`键数对称: zh=${zKeys.length} en=${eKeys.length} ${same ? 'OK' : 'MISMATCH'}`);
  if (!same) {
    const diff = [...zKeys.filter((k) => !eKeys.includes(k)), ...eKeys.filter((k) => !zKeys.includes(k))];
    console.log('差异键:', diff.join(', ') || '(仅顺序差异)');
    fail = 2;
  }
}

let hits = 0;
for (const [src, list] of [[zhPath, zl], [enPath, el]]) {
  for (const [path, value] of list) {
    for (const { re, why } of FORBIDDEN) {
      if (re.test(value)) {
        console.log(`HIT ${src} ${path} — ${why}: ${JSON.stringify(value.slice(0, 60))}`);
        hits++;
      }
    }
  }
}
if (hits) fail = 2;
console.log(fail ? `FAIL: 问句/口语命中 ${hits}` : `forbid-question: 零命中 OK (${zl.length + el.length} 叶子)`);
process.exit(fail);
