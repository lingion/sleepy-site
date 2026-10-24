// v5 /faq/ 产物闸(plan Task 6 Step 1)— dist/client/faq/index.html 级 DOM 验收
// 快照渲染(34 问 = faq.json = FAQ.md ### 计数)、8 节(「相关链接」无问剔除)、禁问句豁免面 = article 外框架文本、
// TOC 锚点全命中、相对仓库链绝对化死链防御(spec R4 目检可发现 = 尾卡「更新于」直读 faq.json)
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import faq from '../src/data/faq.json';
import { zh } from '../src/i18n/zh';
import { en } from '../src/i18n/en';
import { qqGroup, repoUrl } from '../src/i18n/ui';

const load = (p: string): JSDOM => {
  try {
    return new JSDOM(readFileSync(new URL(p, import.meta.url), 'utf8'));
  } catch {
    throw new Error(`${p} 不存在——先跑 npm run build 再跑本测试(spec §6 产物级验收)`);
  }
};

const zhDom = load('../dist/client/faq/index.html');
const zhDoc = zhDom.window.document;
const zhHtml = zhDoc.documentElement.innerHTML;
const enDoc = load('../dist/client/en/faq/index.html').window.document;
const enHtml = enDoc.documentElement.innerHTML;

describe('快照计数闸(plan Task 6)', () => {
  it('34 问 = faq.json items 总和 = FAQ.md ### 计数 = 页面 article 数', () => {
    const mdCount = (readFileSync(new URL('../fixtures/FAQ.md', import.meta.url), 'utf8').match(/^### /gm) ?? []).length;
    expect(mdCount).toBe(34);
    expect(faq.sections.reduce((n, s) => n + s.items.length, 0)).toBe(34);
    expect(zhDoc.querySelectorAll('[data-faq-item]')).toHaveLength(34);
    expect(enDoc.querySelectorAll('[data-faq-item]')).toHaveLength(34);
  });
  it('8 节(终审 I9:FAQ.md 实测 9 个 ## 节,剔除「相关链接」恰 8)且节名序 = faq.json zh 序', () => {
    const secs = [...zhDoc.querySelectorAll('[data-faq-section]')];
    expect(secs).toHaveLength(8);
    expect(secs.map((s) => s.getAttribute('data-section'))).toEqual([
      '项目是什么', '安装与版本', '导入与导出', '课表、冲突与作息表', '小组件', '提醒', '主题与外观', '开发、测试与贡献',
    ]);
    expect(zhHtml).not.toContain('相关链接');
    expect(enHtml).not.toContain('相关链接');
  });
  it('每条 article 带 faq.json 同套 id', () => {
    const ids = faq.sections.flatMap((s) => s.items.map((it) => it.id));
    expect(zhDoc.querySelectorAll('[data-faq-item][id]')).toHaveLength(ids.length);
    for (const id of ids) expect(zhDoc.querySelector(`article#${id}`)).not.toBeNull();
  });
});

describe('渲染子集(blocksToHtml)', () => {
  it('a/ul/ol/code/pre 各≥1 且 pre 带 translate="no"(zh 侧恰 2 枚)', () => {
    const main = zhDoc.querySelector('main')!;
    expect(main.querySelectorAll('article a').length).toBeGreaterThanOrEqual(1);
    expect(main.querySelectorAll('article ul').length).toBeGreaterThanOrEqual(1);
    expect(main.querySelectorAll('article ol').length).toBeGreaterThanOrEqual(1);
    expect(main.querySelectorAll('article code').length).toBeGreaterThanOrEqual(1);
    expect(main.querySelectorAll('pre[translate="no"]')).toHaveLength(2);
  });
  it('外链 rel 含 noopener', () => {
    const ext = [...zhDoc.querySelectorAll('article a[href^="https://"]')];
    expect(ext.length).toBeGreaterThan(0);
    for (const a of ext) expect(a.getAttribute('rel') ?? '').toContain('noopener');
  });
});

describe('禁问句闸在本页的适用面(终审 I10 裁决)', () => {
  it('页面框架文本(article 外可见文本)零「？」零「?」', () => {
    const main = zhDoc.querySelector('main')!.cloneNode(true) as Element;
    main.querySelectorAll('article, script, style').forEach((a) => a.remove());
    const text = main.textContent ?? '';
    expect(text).not.toContain('？');
    expect(text).not.toContain('?');
  });
});

describe('尾卡与 TOC(spec §2.4)', () => {
  it('尾卡正面陈述 + Issues/Discussions/QQ 群', () => {
    expect(zhHtml).toContain(zh.faqPage.tailTitle);
    expect(zhDoc.querySelector(`main a[href="${repoUrl}/issues"]`)).not.toBeNull();
    expect(zhDoc.querySelector(`main a[href="${repoUrl}/discussions"]`)).not.toBeNull();
    expect(zhHtml).toContain(qqGroup);
    expect(enHtml).toContain(en.faqPage.tailTitle);
  });
  it('TOC 链接均为页内 # 锚点且目标存在', () => {
    const toc = zhDoc.querySelector('[data-role="toc"]')!;
    const links = [...toc.querySelectorAll('a[href^="#"]')];
    expect(links).toHaveLength(8);
    for (const a of links) {
      expect(a.getAttribute('href')!.startsWith('#')).toBe(true);
      expect(zhDoc.querySelector(a.getAttribute('href')!)).not.toBeNull();
    }
  });
  it('尾行「更新于」直读 faq.json(内容管线 R4 腐烂可见化)', () => {
    expect(zhHtml).toContain(`${zh.faqPage.updatedPrefix} ${faq.updatedAt}`);
    expect(enHtml).toContain(`${en.faqPage.updatedPrefix} ${faq.updatedAt}`);
  });
});

describe('死链防御(Task 3 绝对化规则的产物侧 pin)', () => {
  it('docs/schools-list.md 渲为 /blob/main/ 前缀且零 href="docs/ 相对链', () => {
    expect(zhHtml).not.toContain('href="docs/');
    expect(zhHtml).toContain(`${repoUrl}/blob/main/docs/schools-list.md`);
  });
});

describe('页面骨架与双语镜像', () => {
  it('h1 = faqPage.heading;canonical/hreflang 指本页对', () => {
    expect(zhDoc.querySelector('main h1')?.textContent).toBe(zh.faqPage.heading);
    expect(enDoc.querySelector('main h1')?.textContent).toBe(en.faqPage.heading);
    expect(zhHtml).toContain('href="https://sleepy.lingion.eu.cc/faq/"');
    expect(zhHtml).toContain('href="https://sleepy.lingion.eu.cc/en/faq/"');
  });
  it('en 页节名 = faq.json en 序', () => {
    const secs = [...enDoc.querySelectorAll('[data-faq-section]')];
    expect(secs.map((s) => s.getAttribute('data-section'))).toEqual(faq.sections.map((s) => s.en));
  });
  it('工具页禁编排(spec §5):无 reveal 类', () => {
    expect(zhDoc.querySelectorAll('[data-reveal-group], .reveal').length).toBe(0);
  });
});
