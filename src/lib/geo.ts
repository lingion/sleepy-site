// 教务省份分组纯函数 — spec §4.1
// 匹配规则(定死):最长前缀优先;同长度城市 > 省(青岛理工→山东 via 青岛,非任何 2 字省头歧义)。
// 不变量由 scripts/build-schools.mjs 的覆盖率断言守住(ungrouped==0 否则 exit 1),数字不硬编码。

export interface ProvinceMeta {
  zh: string;
  en: string;
}

export interface PrefixEntry {
  p: string;
  code: string;
  level: 'province' | 'city';
  cityEn?: string;
}

export interface GeoData {
  provinces: Record<string, ProvinceMeta>;
  prefixes: PrefixEntry[];
}

export interface GeoIndex {
  /** 按前缀长度降序排;同长度省在前、城市在后(实现「城市 > 省」只需把同长城市条目排前) */
  sorted: PrefixEntry[];
  provinces: Record<string, ProvinceMeta>;
}

export interface ClassifyResult {
  code: string;
  matched: 'prefix' | 'manual';
}

export function buildGeoIndex(geo: GeoData): GeoIndex {
  // 排序契约:长度降序 → level 升序(city 先于 province,保证同长城市赢) → 字典序(确定性)
  const sorted = [...geo.prefixes].sort((a, b) => {
    if (b.p.length !== a.p.length) return b.p.length - a.p.length;
    if (a.level !== b.level) return a.level === 'city' ? -1 : 1;
    return a.p.localeCompare(b.p, 'zh');
  });
  return { sorted, provinces: geo.provinces };
}

export function classifyProvince(name: string, idx: GeoIndex): ClassifyResult | null {
  for (const e of idx.sorted) {
    if (name.startsWith(e.p)) return { code: e.code, matched: 'prefix' };
  }
  return null;
}
