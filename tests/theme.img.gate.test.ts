import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// 主题双图切换闸(2026-10-25 hero 双显事故定型,systematic-debugging):
// 事故根因 = Hero 的 :global(#hero .hero__device img){display:block} 带 id (1,1,1),
// 恒压过 Shot 的主题切换规则 .shot__dark[cid]{display:none} (0,2,0) 与
// [data-theme=dark] .shot__light[cid]{display:none} (0,3,0) → 浅/深色两枚 img 全显。
// 不变量:消费方 :global(...img...) 规则禁声明 display —— img 显隐归 Shot 自持,
// 块级化责任也归 Shot(.shot__light{display:block});消费方只许尺寸/圆角/object-fit。

function astroFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return astroFiles(p);
    return e.name.endsWith('.astro') ? [p] : [];
  });
}

const components = astroFiles(fileURLToPath(new URL('../src/components', import.meta.url)));

describe('消费方禁以 display 干预 Shot 双图显隐(事故根因闸)', () => {
  for (const file of components) {
    const src = readFileSync(file, 'utf8');
    // 匹配选择器含 img 的 :global 规则块(选择器内无嵌套括号,Hero 形态 = :global(#hero .hero__device img))
    const rules = src.match(/:global\([^)]*\bimg\b[^)]*\)\s*\{[^}]*\}/g) ?? [];
    for (const rule of rules) {
      it(`${file.replace(/.*\/src\//, 'src/')} 的 img 规则零 display: ${rule.slice(0, 48)}…`, () => {
        expect(rule).not.toMatch(/display\s*:/);
      });
    }
  }
});

describe('Shot 自持块级化(显隐责任的另一半)', () => {
  const shot = readFileSync(new URL('../src/components/Shot.astro', import.meta.url), 'utf8');

  it('.shot__light 显式 display:block(inline 基线缝隙归组件消除)', () => {
    expect(shot).toMatch(/\.shot__light\s*\{[^}]*display:\s*block/);
  });

  it('主题切换三规则仍在:默认暗藏/深主题浅藏/深主题暗显', () => {
    expect(shot).toMatch(/\.shot__dark\s*\{[^}]*display:\s*none/);
    expect(shot).toMatch(/:global\(\[data-theme='dark'\]\)\s*\.shot__light\s*\{[^}]*display:\s*none/);
    expect(shot).toMatch(/:global\(\[data-theme='dark'\]\)\s*\.shot__dark\s*\{[^}]*display:\s*block/);
  });
});
