// v5 /schools/ 岛纯函数闸(plan Task 4 Step 1)— URL 态三参 + 全展开开关不入 URL
// 深链语义 = 分享 URL 即视图状态;q 走 searchFace(name+aliases+sortKeyFull 拼接面,终审 I7)
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { schools } from './schools-view';
import { applyInitialState, filterRows, parseUrlState, writeUrlState } from './schools-island';

describe('parseUrlState(URL 四态)', () => {
  it('读三参 + 全展开开关不进 URL', () => {
    expect(parseUrlState('?p=GD&t=nuit&q=东软')).toEqual({ q: '东软', province: 'GD', type: 'nuit', expandAll: false });
    expect(parseUrlState('')).toEqual({ q: '', province: '', type: '', expandAll: false });
  });
  it('focus=s 不属四态(岛首屏单独消费,parse 后恒 expandAll:false)', () => {
    expect(parseUrlState('?focus=s')).toEqual({ q: '', province: '', type: '', expandAll: false });
    expect(parseUrlState('?p=GD&focus=s&q=东软').q).toBe('东软');
  });
  it('百分号编码 q 解码还原', () => {
    expect(parseUrlState('?q=%E4%B8%9C%E8%BD%AF').q).toBe('东软');
  });
});

describe('writeUrlState(空值省参)', () => {
  it('单参只写该参(round-trip)', () => {
    expect(writeUrlState({ q: '', province: 'GD', type: '', expandAll: false })).toBe('?p=GD');
  });
  it('全空(含 expandAll:true)= 空 URL — 展开全部永不入分享', () => {
    expect(writeUrlState({ q: '', province: '', type: '', expandAll: true })).toBe('');
  });
  it('三参顺序定死 p→t→q', () => {
    expect(writeUrlState({ q: '东软', province: 'GD', type: 'nuit', expandAll: false })).toBe('?p=GD&t=nuit&q=东软');
  });
  it('parse∘write round-trip 保态', () => {
    const s = { q: '东软', province: 'GD', type: 'nuit', expandAll: false };
    expect(parseUrlState(writeUrlState(s))).toEqual(s);
  });
});

describe('filterRows(URL 态 → 行集)', () => {
  it('深链首屏命中:GD+nuit+东软 = 广东东软学院 1 条', () => {
    const hit = filterRows(schools, parseUrlState('?p=GD&t=nuit&q=东软'));
    expect(hit.map((r) => r.name)).toEqual(['广东东软学院']);
  });
  it('空 q 短路 = 省/协议过滤,不要求查询词', () => {
    const gd = filterRows(schools, parseUrlState('?p=GD'));
    expect(gd).toHaveLength(27);
    expect(gd.every((r) => r.province.code === 'GD')).toBe(true);
  });
  it('全空态 = 348 行全量(JS-off 可读不破)', () => {
    expect(filterRows(schools, parseUrlState(''))).toHaveLength(348);
  });
  it('aliases 入检索面:lixin 命中上海立信(sortKeyFull 不含该串)', () => {
    const hit = filterRows(schools, parseUrlState('?q=lixin')).map((r) => r.name);
    expect(hit).toContain('上海立信会计金融学院');
  });
  it('协议面命中:t=wisedu 全部行 type=wisedu(键集实测无 kingo,取真实键)', () => {
    const hit = filterRows(schools, parseUrlState('?t=wisedu'));
    expect(hit.length).toBeGreaterThan(0);
    expect(hit.every((r) => r.type === 'wisedu')).toBe(true);
  });
});

describe('applyInitialState(纯 DOM 灌入 — 评审焦点 3 入口)', () => {
  const miniHtml = `<!doctype html><body>
    <p class="schools__stat tnum" role="status" data-shown-tpl="显示 {shown} / {total}">显示 3 / 3</p>
    <input data-role="q" type="search" />
    <details data-group="GD"><summary>广东 · 2</summary>
      <ul><li data-school data-province="GD" data-type="nuit" data-search="广东东软学院guangdongdongruanyuan">广东东软学院</li>
      <li data-school data-province="GD" data-type="other" data-search="中山大学zhongshandaxue">中山大学</li></ul></details>
    <details data-group="SD"><summary>山东 · 1</summary>
      <ul><li data-school data-province="SD" data-type="qingdao" data-search="青岛科技大学qingdaokejidaxue">青岛科技大学</li></ul></details>
    <p data-role="empty" hidden>空态</p></body>`;

  it('深链灌入:行 hidden 只留命中,组容器整组隐,计数文本现算', () => {
    const doc = new JSDOM(miniHtml).window.document;
    applyInitialState(doc, '?p=GD&t=nuit&q=东软');
    const visible = [...doc.querySelectorAll('[data-school]')].filter((r) => !(r as HTMLElement).hidden);
    expect(visible.map((r) => r.textContent)).toEqual(['广东东软学院']);
    const groups = [...doc.querySelectorAll('details[data-group]')] as HTMLElement[];
    expect(groups.find((g) => g.dataset.group === 'SD')!.hidden).toBe(true);
    expect(groups.find((g) => g.dataset.group === 'GD')!.hidden).toBe(false);
    expect(doc.querySelector('[role="status"]')!.textContent).toBe('显示 1 / 3');
  });
  it('零命中:空态卡现形 + 计数显示 0', () => {
    const doc = new JSDOM(miniHtml).window.document;
    applyInitialState(doc, '?q=zzzz不存在');
    expect((doc.querySelector('[data-role="empty"]') as HTMLElement).hidden).toBe(false);
    expect(doc.querySelector('[role="status"]')!.textContent).toBe('显示 0 / 3');
  });
  it('空 search = 全量现形,计数不动文本形态', () => {
    const doc = new JSDOM(miniHtml).window.document;
    applyInitialState(doc, '');
    expect([...doc.querySelectorAll('[data-school]')].filter((r) => !(r as HTMLElement).hidden)).toHaveLength(3);
    expect(doc.querySelector('[role="status"]')!.textContent).toBe('显示 3 / 3');
  });
});
