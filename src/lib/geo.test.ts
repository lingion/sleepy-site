import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildGeoIndex, classifyProvince, type GeoData } from './geo';
import geoRaw from '../data/geo-prefix.json';
import manualRaw from '../data/province-manual.json';

const geo = geoRaw as GeoData;
const manual = manualRaw as Record<string, string>;
const idx = buildGeoIndex(geo);
const fixture = JSON.parse(
  readFileSync(new URL('../../fixtures/schools.json', import.meta.url), 'utf8'),
) as { name: string; sortKey: string }[];

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

describe('覆盖率不变量:348 条 100% 可判(prefix ∪ manual)', () => {
  it('仓内 fixture 每条学校:前缀命中或人工表命中,二者必居其一', () => {
    const ungrouped = fixture.filter(
      (s) => s.sortKey !== '*' && !classifyProvince(s.name, idx) && !(s.name in manual),
    );
    expect(ungrouped).toEqual([]);
    expect(fixture.length).toBe(348);
  });
  it("「其它」桶恰含 sortKey='*' 两条(北邮 VPN/WebVPN,不静默丢)", () => {
    const stars = fixture.filter((s) => s.sortKey === '*');
    expect(stars.map((s) => s.name).sort()).toEqual(
      ['北京邮电大学新教务（VPN）', '北京邮电大学新教务（WebVPN）'].sort(),
    );
  });
  it('33 协议计数锁(spec §4.1 口径「33 协议」;源数据协议面变化 = 有意变更,须对账后更新)', () => {
    expect(new Set(fixture.map((s) => (s as { type: string }).type)).size).toBe(33);
  });
  it('manual 表键必须是真实校名且值必须是已声明省码(防手滑)', () => {
    const names = new Set(fixture.map((s) => s.name));
    const codes = new Set(Object.keys(geo.provinces));
    for (const [name, code] of Object.entries(manual)) {
      expect(names.has(name), `manual key: ${name}`).toBe(true);
      expect(codes.has(code), `manual value: ${name} → ${code}`).toBe(true);
    }
  });
});
