import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseFaq, assertPairing, assertSectionPairing, blocksToHtml, parseInline } from './build-faq.mjs';

// Task 3 数据管线闸(spec §5/§10):build-faq 纯离线 = 只读仓内快照 fixtures/FAQ.md + scripts/faq-en.md。
// 测试同读快照保确定性;vitest include 覆盖 scripts/**/*.test.mjs(fetch-release.test.mjs 同法),
// 本文件禁放 tests/(.mjs 不在 include,致命三裁决)。

const zhMd = readFileSync(new URL('../fixtures/FAQ.md', import.meta.url), 'utf8');
const enMd = readFileSync(new URL('./faq-en.md', import.meta.url), 'utf8');

describe('parseFaq 结构闸(快照实测现值)', () => {
  it('FAQ.md 解析 = 9 节剔除相关链接后 8 节 · 54 问 · 代码块 2 枚', () => {
    const secs = parseFaq(zhMd);
    const items = secs.flatMap((s) => s.items);
    expect(items.length).toBe(54);
    expect(secs.find((s) => s.zh === '相关链接')).toBeUndefined(); // 无问空节整节剔除(解析器规则,非点名)
    expect(secs.length).toBe(8);
    expect(items.filter((i) => i.a.zh.some((b) => b.type === 'pre')).length).toBe(2);
  });
  it('顶层 # 与 > 引言不进任何节;节标题逐字', () => {
    const secs = parseFaq(zhMd);
    expect(secs.map((s) => s.zh)).toEqual([
      '项目是什么',
      '安装与版本',
      '导入与导出',
      '课表、冲突与作息表',
      '小组件',
      '提醒',
      '主题与外观',
      '开发、测试与贡献',
    ]);
  });
  it('id slug = sec-{节序}-q-{问序} 连续(锚点稳定,T6 TOC 消费)', () => {
    const items = parseFaq(zhMd).flatMap((s) => s.items);
    expect(items[0].id).toBe('sec-1-q-1');
    expect(items[1].id).toBe('sec-1-q-2');
    expect(items[items.length - 1].id).toBe('sec-8-q-4');
  });
  it('渲染子集四类齐备:paragraph/list(ol+ul)/pre/行内 code+a', () => {
    const items = parseFaq(zhMd).flatMap((s) => s.items);
    const blocks = items.flatMap((i) => i.a.zh);
    expect(blocks.some((b) => b.type === 'paragraph')).toBe(true);
    expect(blocks.some((b) => b.type === 'list' && b.ordered)).toBe(true); // 小组件家族 1.-5.
    expect(blocks.some((b) => b.type === 'list' && !b.ordered)).toBe(true); // ABI 4 项 -
    expect(blocks.filter((b) => b.type === 'pre')).toHaveLength(2);
  });
});

describe('zh/en 配对闸', () => {
  it('zh/en 问数不一致即抛(build-faq 数量闸)', () => {
    const zhItems = parseFaq(zhMd).flatMap((s) => s.items);
    expect(() => assertPairing(zhItems, zhItems.slice(1))).toThrow(/条数不一致/);
  });
  it('仓内 faq-en.md 与快照现值恰配对(54=54,离线构建可复现)', () => {
    const zhItems = parseFaq(zhMd).flatMap((s) => s.items);
    const enItems = parseFaq(enMd).flatMap((s) => s.items);
    expect(() => assertPairing(zhItems, enItems)).not.toThrow();
  });
});

describe('released FAQ coverage', () => {
  it('preserves both iOS channels and regional availability without inferring Android parity', () => {
    for (const text of [zhMd, enMd]) {
      expect(text).toContain('https://testflight.apple.com/join/SxymmDzf');
      expect(text).toContain('https://apps.apple.com/app/id6827001840');
    }
    expect(zhMd).toContain('中国大陆区仍在审核中');
    expect(enMd).toContain('mainland China release is still under review');
    expect(zhMd).toContain('不能据 Android v1.0.64 推断');
    expect(enMd).toContain('does not establish complete feature parity');
    expect(zhMd).not.toContain('与 Android 版功能对齐');
  });
  it('checks per-section order and rejects redistribution with the same total', () => {
    const zh = parseFaq(zhMd, 'zh');
    const en = parseFaq(enMd, 'en');
    expect(() => assertSectionPairing(zh, en)).not.toThrow();
    expect(zh.map((s) => s.items.length)).toEqual([6, 5, 12, 9, 4, 8, 6, 4]);
    const wrong = structuredClone(en);
    wrong[1].items.push(wrong[0].items.pop());
    expect(() => assertSectionPairing(zh, wrong)).toThrow();
  });
  it('keeps complete bilingual reminder and write-capable console answers', () => {
    const zh = parseFaq(zhMd).flatMap((s) => s.items);
    const en = parseFaq(enMd, 'en').flatMap((s) => s.items);
    const index = zh.findIndex((q) => q.q.zh === '多张课表的提醒会刷屏吗？');
    expect(blocksToHtml(zh[index].a.zh)).toContain('合并为一条');
    expect(blocksToHtml(zh[index].a.zh)).toContain('首次手动切换会保存完整选择集合');
    expect(blocksToHtml(zh[index].a.zh)).toContain('[课表名]');
    expect(blocksToHtml(en[index].a.en)).toContain('one notification');
    const consoleIndex = zh.findIndex((q) => q.q.zh === '本机调试控制台是只读的吗？');
    expect(blocksToHtml(zh[consoleIndex].a.zh)).toContain('删除');
    expect(blocksToHtml(en[consoleIndex].a.en)).toContain('delete');
  });
});

describe('answer integrity', () => {
  it('preserves text before and after literal or malformed brackets', () => {
    for (const value of ['所有课表合并为一条通知，每条带「[课表名]」前缀。', 'prefix [unfinished suffix', 'prefix [label] tail']) {
      const inline = parseInline(value);
      expect(inline.map((part) => part.v ?? '').join('')).toBe(value);
    }
  });
  it('keeps brackets inside inline code as one code span', () => {
    const html = blocksToHtml([{ type: 'paragraph', inline: parseInline('Combined notifications use `[timetable]` prefixes.') }]);
    expect(html).toBe('<p>Combined notifications use <code>[timetable]</code> prefixes.</p>');
  });
});

describe('blocksToHtml 渲染规则(spec §5 终审 I11)', () => {
  it('相对仓库路径绝对化:sponsor.md → repoUrl/blob/main/(禁 /faq/sponsor.md 死链;样本随快照平移 schools-list→sponsor)', () => {
    // parseFaq 单语解析只填 a[lang],zh/en 各从各自源取(合并双语在 mergeDocs,归产物闸)
    const sp = parseFaq(zhMd).flatMap((s) => s.items).find((i) => i.id === 'sec-1-q-6');
    expect(blocksToHtml(sp.a.zh)).toContain('href="https://github.com/lingion/sleepy/blob/main/sponsor.md"');
    const spEn = parseFaq(enMd, 'en').flatMap((s) => s.items).find((i) => i.id === 'sec-1-q-6');
    expect(blocksToHtml(spEn.a.en)).toContain('href="https://github.com/lingion/sleepy/blob/main/sponsor.md"');
  });
  it('链接优先于行内 code:链接文字内嵌反引号无残渣(自造样本锁行为,2026-10-25 快照平移后无此天然形态)', () => {
    const inline = parseInline('见 [`docs/x.md`](docs/x.md) 收尾');
    expect(JSON.stringify(inline)).not.toContain('`');
    const html = blocksToHtml([{ type: 'paragraph', inline }]);
    expect(html).toMatch(/<a href="[^"]*blob\/main\/docs\/x\.md"><code>docs\/x\.md<\/code><\/a>/);
  });
  it('pre 带 translate="no"(机读命令不翻译);a 标签/ul/ol/code 各≥1', () => {
    const items = parseFaq(zhMd).flatMap((s) => s.items);
    const html = items.map((i) => blocksToHtml(i.a.zh)).join('');
    expect((html.match(/<pre translate="no">/g) ?? []).length).toBe(2);
    expect(html).toContain('<a href="https://github.com/lingion/sleepy/releases"');
    expect((html.match(/<ul>/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect((html.match(/<ol>/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect((html.match(/<code>/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
  it('bold **x** → <strong>:快照实测 widget 家族(sec-5-q-1)5 枚,零星号残渣', () => {
    const items = parseFaq(zhMd).flatMap((s) => s.items);
    const w = items.find((i) => i.id === 'sec-5-q-1');
    const html = blocksToHtml(w.a.zh);
    expect(html).toContain('<strong>Today</strong>');
    expect((html.match(/<strong>/g) ?? []).length).toBe(5);
    expect(html).not.toContain('**');
  });
  it('全量 zh/en 渲染输出零 ** 残渣(源快照仅纯文本 bold,无嵌套)', () => {
    for (const md of [zhMd, enMd]) {
      const html = parseFaq(md).flatMap((s) => s.items).map((i) => blocksToHtml(Object.values(i.a)[0])).join('');
      expect(html).not.toContain('**');
    }
  });
  it('文本转义:尖括号与 & 不进裸 HTML(快照内无 <,自造样本锁行为)', () => {
    const html = blocksToHtml([{ type: 'paragraph', inline: [{ t: 'text', v: 'a < b & c > d' }] }]);
    expect(html).toBe('<p>a &lt; b &amp; c &gt; d</p>');
  });
});
