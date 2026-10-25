// 教务展示层纯派生 — spec §3③:数字从数据现算,不硬编码(§4.1 不变量「禁写 346 校」同源)
import schoolsRaw from '../data/schools.grouped.json';
import type { ProvinceMeta } from './geo';

export interface SchoolRow {
  name: string;
  type: string;
  sortKeyFull: string;
  aliases: string[];
  province: ProvinceMeta & { code: string };
}

export const schools = schoolsRaw as unknown as SchoolRow[];

/** 名录快照最后刷新日(= fixtures/schools.json 对应上游 assets 末次 data 提交的真实日期 6759ad4d #179;重跑 data 链路时同步,目检可发现 — spec §5 内容类陈旧可接受) */
export const catalogUpdatedAt = '2026-10-18';

export const provinceCount = new Set(schools.map((s) => s.province.code)).size;
export const typeCount = new Set(schools.map((s) => s.type)).size;
export const rowCount = schools.length;

/** 省份 chip 顺序:码排序稳定,「其它」垫底 */
export function provincesOrdered(): (ProvinceMeta & { code: string })[] {
  const map = new Map<string, ProvinceMeta & { code: string }>();
  for (const s of schools) map.set(s.province.code, s.province);
  return [...map.values()].sort((a, b) =>
    a.code === 'OTHER' ? 1 : b.code === 'OTHER' ? -1 : a.code.localeCompare(b.code),
  );
}

export function typesOrdered(): string[] {
  return [...new Set(schools.map((s) => s.type))].sort();
}
