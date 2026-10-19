// 拼音子串搜索纯函数 — spec §4.1 EN 策略:校名保中文,sortKeyFull 拼音检索
// 归一化: 小写 + 全角转半角 + 去空白。命中 = name 或 sortKeyFull 含归一查询串。

export interface SearchableSchool {
  name: string;
  sortKeyFull: string;
}

/** 大小写/全角/空白归一(搜索与数据两侧同函数,保证对称) */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[　\s]/g, '');
}

export function matchSchool(q: string, school: SearchableSchool): boolean {
  const nq = normalize(q);
  if (nq === '') return false; // 空查询不算命中(空态由 UI 层处理)
  return normalize(school.name).includes(nq) || normalize(school.sortKeyFull).includes(nq);
}
