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

// 第 4 层归组 — moe 目录号解省码:catalogId 'moe:GGPPNNNNNN'(教育部代码,第 3-4 位 = 省级行政区划码)。
// 行政区划码是数字,本站省码是缩写(geo.provinces 键),故需全表映射;映射结果必须仍是已声明省码才算命中。
// 非 moe 形态(Q_清华/W_唤醒指纹/null)一律 null —— 归组残差由人工表兜底,不猜。
const NUM2CODE: Record<string, string> = {
  '11': 'BJ', '12': 'TJ', '13': 'HE', '14': 'SX', '15': 'NM',
  '21': 'LN', '22': 'JL', '23': 'HL',
  '31': 'SH', '32': 'JS', '33': 'ZJ', '34': 'AH', '35': 'FJ', '36': 'JX', '37': 'SD',
  '41': 'HA', '42': 'HB', '43': 'HN', '44': 'GD', '45': 'GX', '46': 'HI',
  '50': 'CQ', '51': 'SC', '52': 'GZ', '53': 'YN', '54': 'XZ',
  '61': 'SN', '62': 'GS', '63': 'QH', '64': 'NX', '65': 'XJ',
};

export function decodeProvinceByCatalogId(
  catalogId: string | undefined | null,
  provinces: Record<string, ProvinceMeta>,
): string | null {
  const m = typeof catalogId === 'string' ? catalogId.match(/^moe:(\d{10})$/) : null;
  if (!m) return null;
  const code = NUM2CODE[m[1].slice(2, 4)];
  return code && provinces[code] ? code : null;
}
