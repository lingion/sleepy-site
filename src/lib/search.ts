// 拼音子串搜索纯函数 — spec §4.1 EN 策略:校名保中文,sortKeyFull 拼音检索
// 归一化: 小写 + 全角转半角 + 去空白。命中 = name 或 sortKeyFull 含归一查询串。

export interface SearchableSchool {
  name: string;
  sortKeyFull: string;
  aliases?: string[];
}

/** 大小写/全角/空白归一(搜索与数据两侧同函数,保证对称) */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[　\s]/g, '');
}

/** 检索面唯一语义(终审 I7):name + aliases + sortKeyFull 拼接归一 —— 服务端 data-search 与岛运行时共读同一表达式 */
export function searchFace(school: SearchableSchool): string {
  return normalize(school.name + (school.aliases ?? []).join('') + school.sortKeyFull);
}

export function matchSchool(q: string, school: SearchableSchool): boolean {
  const nq = normalize(q);
  if (nq === '') return false; // 空查询不算命中(空态由 UI 层处理)
  return searchFace(school).includes(nq);
}
