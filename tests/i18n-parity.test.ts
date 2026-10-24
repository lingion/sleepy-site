import { describe, expect, it } from 'vitest';
import { zh } from '../src/i18n/zh';
import { en } from '../src/i18n/en';
import typesEn from '../src/data/types-en.json';
import schools from '../src/data/schools.grouped.json';

// T7 双语镜像闸(spec §4.1 EN 策略):en.ts 键树必须与 zh.ts 完全同形 ——
// 组件 props 全覆盖检查 = 加新文案忘了翻 = 这里红,而不是 EN 页漏中文。

function keyTree(obj: object, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...keyTree(v, path));
    else if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
      v.forEach((item, i) => out.push(...keyTree(item as object, `${path}[${i}]`)));
    } else out.push(path);
  }
  return out;
}

describe('en/zh 键树同形(组件 props 全覆盖)', () => {
  it('zh.ts 每个键在 en.ts 存在且反向亦然', () => {
    expect(keyTree(en).sort()).toEqual(keyTree(zh).sort());
  });
  it('v5 四组新键 zh/en 同形(键树闸)+ 锚点新值', () => {
    for (const g of ['homeSchoolCard', 'schoolsPage', 'downloadPage', 'faqPage'] as const) {
      expect(zh[g], `zh.${g}`).toBeDefined();
      expect(en[g], `en.${g}`).toBeDefined();
      expect(Object.keys(zh[g]).sort()).toEqual(Object.keys(en[g] as object).sort());
    }
    expect(zh.appbar.anchors.schools).toBe('学校名录');
    expect(zh.appbar.anchors.faq).toBe('常见问答');
  });
  it('数组长度一致(captions/beats 逐项对齐)', () => {
    expect(en.gallery.captions.length).toBe(zh.gallery.captions.length);
    expect(en.reminders.beats.length).toBe(zh.reminders.beats.length);
  });
});

describe('协议 EN 标签表(spec §4.1)', () => {
  it('数据里全部 33 协议都有 EN 标签', () => {
    const types = [...new Set(schools.map((s) => s.type))];
    for (const ty of types) expect(typesEn, `type ${ty}`).toHaveProperty(ty);
  });
  it('EN 标签不含中文(专有名词拉丁化)', () => {
    for (const [k, v] of Object.entries(typesEn)) {
      expect(v, k).toMatch(/^[\x20-\x7E]+$/);
    }
  });
});
