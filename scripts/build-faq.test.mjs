import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseFaq, assertPairing, blocksToHtml } from './build-faq.mjs';

// Task 3 数据管线闸(spec §5/§10):build-faq 纯离线 = 只读仓内快照 fixtures/FAQ.md + scripts/faq-en.md。
// 测试同读快照保确定性;vitest include 覆盖 scripts/**/*.test.mjs(fetch-release.test.mjs 同法),
// 本文件禁放 tests/(.mjs 不在 include,致命三裁决)。

const zhMd = readFileSync(new URL('../fixtures/FAQ.md', import.meta.url), 'utf8');
const enMd = readFileSync(new URL('./faq-en.md', import.meta.url), 'utf8');

describe('parseFaq 结构闸(快照实测现值)', () => {
  it('FAQ.md 解析 = 9 节剔除相关链接后 8 节 · 34 问 · 代码块 2 枚', () => {
    const secs = parseFaq(zhMd);
    const items = secs.flatMap((s) => s.items);
    expect(items.length).toBe(34);
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
    expect(items[items.length - 1].id).toBe('sec-8-q-3');
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
  it('仓内 faq-en.md 与快照现值恰配对(34=34,离线构建可复现)', () => {
    const zhItems = parseFaq(zhMd).flatMap((s) => s.items);
    const enItems = parseFaq(enMd).flatMap((s) => s.items);
    expect(() => assertPairing(zhItems, enItems)).not.toThrow();
  });
});

describe('blocksToHtml 渲染规则(spec §5 终审 I11)', () => {
  it('相对仓库路径绝对化:docs/schools-list.md → repoUrl/blob/main/(禁 /faq/docs/ 死链)', () => {
    const items = parseFaq(zhMd).flatMap((s) => s.items);
    const dl = items.find((i) => i.q.zh.includes('不在名单'));
    const html = blocksToHtml(dl.a.zh);
    expect(html).toContain('href="https://github.com/lingion/sleepy/blob/main/docs/schools-list.md"');
    expect(html).not.toMatch(/href="docs\//);
  });
  it('链接优先于行内 code:链接文字内嵌反引号无残渣', () => {
    const items = parseFaq(zhMd).flatMap((s) => s.items);
    const dl = items.find((i) => i.q.zh.includes('不在名单'));
    const html = blocksToHtml(dl.a.zh);
    expect(html).not.toContain('`');
    expect(html).toMatch(/<a href="[^"]*blob\/main\/docs\/schools-list\.md"><code>docs\/schools-list\.md<\/code><\/a>/);
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
  it('文本转义:尖括号与 & 不进裸 HTML(快照内无 <,自造样本锁行为)', () => {
    const html = blocksToHtml([{ type: 'paragraph', inline: [{ t: 'text', v: 'a < b & c > d' }] }]);
    expect(html).toBe('<p>a &lt; b &amp; c &gt; d</p>');
  });
});
