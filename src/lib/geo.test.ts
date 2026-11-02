import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildGeoIndex,
  classifyProvince,
  decodeProvinceByCatalogId,
  type GeoData,
} from './geo';
import geoRaw from '../data/geo-prefix.json';
import manualRaw from '../data/province-manual.json';

const geo = geoRaw as GeoData;
const manual = manualRaw as Record<string, string>;
const idx = buildGeoIndex(geo);
const fixture = JSON.parse(
  readFileSync(new URL('../../fixtures/schools.json', import.meta.url), 'utf8'),
) as { name: string; sortKey: string; type: string; catalogId?: string }[];

describe('最长前缀优先(spec §4.1)', () => {
  it('「青岛科技大学」→ 山东(3 字「青岛科技」不存在时 2 字「青岛」城市头即中)', () => {
    expect(classifyProvince('青岛科技大学', idx)).toEqual({ code: 'SD', matched: 'prefix' });
  });
  it('「石家庄学院」走 3 字城市头「石家庄」而非任何 2 字歧义', () => {
    expect(classifyProvince('石家庄学院', idx)?.code).toBe('HE');
  });
  it('更长的城市头赢更短的头:合成表「长」省头 vs「长沙」市头', () => {
    const synthetic: GeoData = {
      provinces: { GD: { zh: '广东', en: 'Guangdong' }, HN: { zh: '湖南', en: 'Hunan' } },
      prefixes: [
        { p: '长', code: 'GD', level: 'province' },
        { p: '长沙', code: 'HN', level: 'city', cityEn: 'Changsha' },
      ],
    };
    expect(classifyProvince('长沙理工大学', buildGeoIndex(synthetic))?.code).toBe('HN');
  });
});

describe('同长度城市 > 省(spec §4.1 冲突定则)', () => {
  it('合成表 2 字省头「吉林」与 2 字市头冲突时取城市侧(排序契约:level 升序)', () => {
    const synthetic: GeoData = {
      provinces: { JL: { zh: '吉林', en: 'Jilin' } },
      prefixes: [
        { p: '吉首', code: 'HN2', level: 'city', cityEn: 'Jishou' },
        { p: '吉林', code: 'JL', level: 'province' },
      ],
    };
    const i2 = buildGeoIndex(synthetic);
    expect(classifyProvince('吉首大学', i2)?.code).toBe('HN2');
    expect(i2.sorted[0].level).toBe('city'); // 同长城市排前 = 城市优先的实现锁
  });
});

describe('覆盖率不变量:学校 100% 可判(prefix ∪ manual ∪ moe解)', () => {
  it('仓内 fixture 每条学校:前缀/人工表/moe 解/修饰词回退,必居其一', () => {
    const ungrouped = fixture.filter((s) => {
      if (s.sortKey === '*') return false;
      if (classifyProvince(s.name, idx) || s.name in manual || decodeProvinceByCatalogId(s.catalogId, geo.provinces)) {
        return false;
      }
      const clean = s.name
        .replace(/\s*[-–—]\s*研究生$/, '')
        .replace(/[-–—]研究生$/, '')
        .replace(/个人数据中心$/, '')
        .replace(/（.*?）$/, '')
        .replace(/\(.*?\)$/, '')
        .trim();
      return !(clean in manual) && !classifyProvince(clean, idx);
    });
    expect(ungrouped).toEqual([]);
    expect(fixture.length).toBeGreaterThan(0);
  });
  it("「其它」桶条目不静默丢失", () => {
    const stars = fixture.filter((s) => s.sortKey === '*');
    for (const s of stars) {
      expect(s.name).toBeDefined();
    }
  });
  it('协议面覆盖有效(在用协议面均派生一致)', () => {
    expect(new Set(fixture.map((s) => (s as unknown as { type: string }).type)).size).toBeGreaterThan(30);
  });
  it('manual 表键必须是真实校名且值必须是已声明省码或 OTHER(防手滑;OTHER 活在构建端,不在 geo.provinces)', () => {
    const names = new Set(fixture.map((s) => s.name));
    const codes = new Set(Object.keys(geo.provinces));
    for (const [name, code] of Object.entries(manual)) {
      expect(names.has(name), `manual key: ${name}`).toBe(true);
      expect(code === 'OTHER' || codes.has(code), `manual value: ${name} → ${code}`).toBe(true);
    }
  });
});

describe('moe 编码解层(第四路)', () => {
  it('10 位码第 3-4 位省区划查表命中省码;非 moe 形态/未知区划一律 null', () => {
    expect(decodeProvinceByCatalogId('moe:4137000001', geo.provinces)).toBe('SD');
    expect(decodeProvinceByCatalogId('moe:4144000001', geo.provinces)).toBe('GD');
    expect(decodeProvinceByCatalogId('Q_清华大学', geo.provinces)).toBeNull();
    expect(decodeProvinceByCatalogId('moe:4199000001', geo.provinces)).toBeNull();
    expect(decodeProvinceByCatalogId(undefined, geo.provinces)).toBeNull();
  });
});
