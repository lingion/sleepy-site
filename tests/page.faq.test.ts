// v5 /faq/ 产物闸(plan Task 6 Step 1)— dist/client/faq/index.html 级 DOM 验收
// 快照渲染(43 问 = faq.json = FAQ.md ### 计数;2026-10-25 v1.0.62 事实刷新 34→43,节名序零变动)、
// 8 节(「相关链接」无问剔除)、禁问句豁免面 = article 外框架文本、
// TOC 锚点全命中、相对仓库链绝对化死链防御(样本随快照平移 schools-list→sponsor;
// spec R4 目检可发现 = 尾卡「更新于」直读 faq.json)
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
  it('43 问 = faq.json items 总和 = FAQ.md ### 计数 = 页面 article 数', () => {
    const mdCount = (readFileSync(new URL('../fixtures/FAQ.md', import.meta.url), 'utf8').match(/^### /gm) ?? []).length;
    expect(mdCount).toBe(43);
    expect(faq.sections.reduce((n, s) => n + s.items.length, 0)).toBe(43);
    expect(zhDoc.querySelectorAll('[data-faq-item]')).toHaveLength(43);
    expect(enDoc.querySelectorAll('[data-faq-item]')).toHaveLength(43);
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
  it('TOC 首节静态高亮:aria-current 恰一挂首链,余链无(Task 10:JS-off 也有当前节指示)', () => {
    const links = [...zhDoc.querySelectorAll('[data-toc-link]')];
    expect(links[0].getAttribute('aria-current')).toBe('true');
    for (const a of links.slice(1)) expect(a.hasAttribute('aria-current'), `aria-current on ${a.getAttribute('href')}`).toBe(false);
    // 高亮面 = chip-check 显隐 CSS 驱动(禁 JS-only 才亮,global.css 闸)
    const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.site-chip\[aria-current='true'\]\s\.chip-check\s*\{\s*display:\s*block/);
  });
});

describe('死链防御(Task 3 绝对化规则的产物侧 pin)', () => {
  it('sponsor.md 相对链渲为 /blob/main/ 前缀且 article 内零相对 href(死链闸样本)', () => {
    // 只查 article 内容链:absolutize 的靶面。页壳站内导航(/en/faq/ 等根绝对路径)合法不查
    for (const doc of [zhDoc, enDoc]) {
      const bad = [...doc.querySelectorAll('article a')].filter(
        (a) => !/^(https?:|mailto:|#)/.test(a.getAttribute('href') ?? '')
      );
      expect(bad, `relative href in article: ${bad.map((a) => a.getAttribute('href')).join(', ')}`).toHaveLength(0);
    }
    expect(zhHtml).toContain(`${repoUrl}/blob/main/sponsor.md`);
    expect(enHtml).toContain(`${repoUrl}/blob/main/sponsor.md`);
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
  it('移动栅格轨道闸(缺陷批 2026-10-26:pre 长行撑破 1fr=auto 最小轨 → 全页横滚)', () => {
    // 根因:.faq-page__grid 移动默认无列约束,隐式轨 minmax(auto,1fr) 的 auto 最小
    // = min-content,FAQ 答案代码块 <pre> 长命令行把轨道撑到 453(视口 390)。
    // 修复 = 默认档显式 grid-template-columns: minmax(0, 1fr)(与桌面档既有
    // minmax(0,1fr) 同纪律,一条治 toc+body 两栏);禁回归为裸 1fr/auto。
    const src = readFileSync(new URL('../src/components/pages/FaqBody.astro', import.meta.url), 'utf8');
    expect(src).toMatch(/\.faq-page__grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
    expect(src).toMatch(/grid-template-columns:\s*232px minmax\(0, 1fr\)/);
    expect(src).toMatch(/\.faq__toc\s*\{[^}]*min-inline-size:\s*0/);
  });
  it('set:html 注入子树样式闸(缺陷批 2026-10-26:scoped 属性不附注入节点 → .faq__pre 静默失效)', () => {
    // Astro scoped CSS 给选择器末元素挂 cid,而答案子树由 set:html 注入、无 cid:
    // 以 .faq__pre/.faq__list 为末元素的规则整条不命中,overflow-x:auto 未生效,
    // pre 长命令行 overflow:visible 直接溢出文档(453 > 390)。
    // 修复 = 注入子树样式一律经 .faq__a :global(...) 挂载。
    const src = readFileSync(new URL('../src/components/pages/FaqBody.astro', import.meta.url), 'utf8');
    expect(src).toMatch(/\.faq__a\s+:global\(\.faq__pre\)/);
    expect(src).toMatch(/\.faq__a\s+:global\(\.faq__list\)/);
  });
});
