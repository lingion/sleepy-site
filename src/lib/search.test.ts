import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { matchSchool, normalize } from './search';

const fixture = JSON.parse(
  readFileSync(new URL('../../src/data/schools.grouped.json', import.meta.url), 'utf8'),
) as { name: string; sortKeyFull: string }[];

describe('normalize 归一化', () => {
  it('大小写不敏感', () => {
    expect(normalize('Jiaotong')).toBe('jiaotong');
  });
  it('全角转半角', () => {
    expect(normalize('ｊｉａｏｔｏｎｇ')).toBe('jiaotong');
  });
  it('空白与全角空格剥离', () => {
    expect(normalize('北京 邮电　大学')).toBe('北京邮电大学');
  });
});

describe('matchSchool 拼音检索(spec §4.1 jiaotong 例)', () => {
  it('「jiaotong」命中多校(西安交通/北京交通/重庆交通/西南交通…)', () => {
    const hits = fixture.filter((s) => matchSchool('jiaotong', s)).map((s) => s.name);
    expect(hits).toContain('北京交通大学');
    expect(hits).toContain('西南交通大学');
    expect(hits.length).toBeGreaterThanOrEqual(4);
  });
  it('中文子串命中(「交通」同样命中)', () => {
    expect(matchSchool('交通', { name: '北京交通大学', sortKeyFull: 'beijingjiaotongdaxue' })).toBe(true);
  });
  it('大小写混查命中', () => {
    expect(matchSchool('JIAOTONG', { name: 'X', sortKeyFull: 'beijingjiaotongdaxue' })).toBe(true);
  });
  it('全角输入命中', () => {
    expect(matchSchool('ｑｉｎｇｄａｏ', { name: 'X', sortKeyFull: 'qingdaokejidaxue' })).toBe(true);
  });
  it('空查询不命中(空态归 UI)', () => {
    expect(matchSchool('', { name: '北京大学', sortKeyFull: 'beijingdaxue' })).toBe(false);
    expect(matchSchool('   ', { name: '北京大学', sortKeyFull: 'beijingdaxue' })).toBe(false);
  });
  it('无匹配查询返回零(空态 microcopy 的触发条件)', () => {
    expect(fixture.filter((s) => matchSchool('zzzzqqqq', s))).toHaveLength(0);
  });
});
