// v5 /schools/ 产物闸(plan Task 4 Step 3)— dist/client/schools/index.html 级 DOM 验收
// JS-off 全量可读(1478 行在 HTML)+ details 折叠 + URL 深链首屏即过滤(applyInitialState 真断言)
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site } from '../src/i18n/ui';
import { applyInitialState, filterRows, parseUrlState } from '../src/lib/schools-island';
import { catalogUpdatedAt, schools } from '../src/lib/schools-view';
import { zh } from '../src/i18n/zh';
import { en } from '../src/i18n/en';

const load = (p: string): JSDOM => {
  try {
    return new JSDOM(readFileSync(new URL(p, import.meta.url), 'utf8'));
  } catch {
    throw new Error(`${p} 不存在——先跑 npm run build 再跑本测试(spec §6 产物级验收)`);
  }
};

const zhDom = load('../dist/client/schools/index.html');
const zhDoc = zhDom.window.document;
const zhHtml = zhDoc.documentElement.innerHTML;
const enDoc = load('../dist/client/en/schools/index.html').window.document;

describe('JS-off 全量静态渲染(spec §2.3)', () => {
  it('1478 行全在 HTML,details 31 组各带 summary 计数', () => {
    expect(zhDoc.querySelectorAll('[data-school]')).toHaveLength(schools.length);
    const groups = [...zhDoc.querySelectorAll<HTMLElement>('details[data-group]')];
    expect(groups).toHaveLength(31);
    for (const g of groups) {
      const rows = g.querySelectorAll('[data-school]').length;
      expect(g.querySelector('summary')!.textContent).toContain(String(rows));
    }
    const gd = groups.find((g) => g.dataset.group === 'GD')!;
    expect(gd.querySelector('summary')!.textContent).toContain('广东');
    expect(gd.querySelectorAll('[data-school]')).toHaveLength(92);
  });
  it('默认关组(JS-off 手机=一行一组可手开;桌面 open 由岛 JS 增强,产物不带)', () => {
    expect([...zhDoc.querySelectorAll<HTMLDetailsElement>('details[data-group]')].every((d) => !d.open)).toBe(true);
  });
  it('行 data-search = searchFace(name+aliases+sortKeyFull) 拼接面(终审 I7 等价性构造保证)', () => {
    const faces = [...zhDoc.querySelectorAll('[data-school]')].map((r) => r.getAttribute('data-search'));
    expect(faces).toHaveLength(schools.length);
    for (const f of faces) expect(f).toBe(f?.toLowerCase()); // normalize 产物恒含小写
  });
  it('en 路由镜像同数:1478 行 31 组', () => {
    expect(enDoc.querySelectorAll('[data-school]')).toHaveLength(schools.length);
    expect(enDoc.querySelectorAll('details[data-group]')).toHaveLength(31);
  });
});

describe('计数播报与输入件(spec §2.3 过滤结果播报)', () => {
  it('计数行 role=status + class 含 schools__stat tnum(§10 承接点)+ 初值全量', () => {
    const stat = zhDoc.querySelector('[role="status"]')!;
    expect(stat.classList.contains('schools__stat')).toBe(true);
    expect(stat.classList.contains('tnum')).toBe(true);
    expect(stat.getAttribute('data-shown-tpl')).toContain('{shown}');
    expect(stat.textContent).toContain(`1478`);
  });
  it('搜索框隐藏 label + placeholder 省略号结尾', () => {
    const input = zhDoc.querySelector('input[data-role="q"]')!;
    const label = input.closest('label')!;
    expect(label.querySelector('.visually-hidden')!.textContent).toBe('校名检索');
    expect(input.getAttribute('placeholder')).toBe('输入校名或拼音,如 jiaotong…');
  });
  it('autofocus 绝迹(spec §2.3 移动端慎用)', () => {
    expect(zhHtml).not.toMatch(/autofocus/);
  });
});

describe('渲染与交互件源码闸(dist CSS 外链 → 源码闸,page.index:137 先例)', () => {
  const src = readFileSync(new URL('../src/components/pages/SchoolsTool.astro', import.meta.url), 'utf8');
  it('组容器 content-visibility + contain-intrinsic-size 在组件 scoped CSS 内', () => {
    expect(src).toMatch(/content-visibility:\s*auto/);
    expect(src).toMatch(/contain-intrinsic-size/);
  });
  it('touch-action: manipulation(全局 CSS 无此规则,新页自带 — 终审 F2 同闸)', () => {
    expect(src).toMatch(/touch-action:\s*manipulation/);
  });
  it('桌面 70vh 段内滚动', () => {
    expect(src).toMatch(/max-block-size:\s*70vh/);
  });
});

describe('首屏深链即过滤(评审焦点 3:对 dist 整页 Document 灌 search)', () => {
  const fresh = () => load('../dist/client/schools/index.html').window.document;
  it('GD+nuit+东软 → 可见 1 条', () => {
    const doc = fresh();
    applyInitialState(doc, '?p=GD&t=nuit&q=东软');
    const visible = [...doc.querySelectorAll('[data-school]')].filter((r) => !(r as HTMLElement).hidden);
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain('广东东软学院');
    expect(doc.querySelector('[role="status"]')!.textContent).toBe('显示 1 / 1478');
  });
  it('岛运行时直判 dataset.search 与 filterRows 命中名集一致(等价性 pin)', () => {
    const doc = fresh();
    const q = '东软';
    const viaRows = filterRows(schools, { ...parseUrlState(''), q }).map((r) => r.name).sort();
    const viaDom = [...doc.querySelectorAll('[data-school]')]
      .filter((r) => (r.getAttribute('data-search') ?? '').includes(q))
      .map((r) => r.textContent!.trim())
      .sort();
    expect(viaDom.length).toBeGreaterThan(0);
    for (const name of viaRows) expect(viaDom.some((t) => t.includes(name))).toBe(true);
  });
  it('零命中 → 空态卡现形', () => {
    const doc = fresh();
    applyInitialState(doc, '?q=zzzz不存在');
    expect((doc.querySelector('[data-role="empty"]') as HTMLElement).hidden).toBe(false);
    expect(doc.querySelector('[role="status"]')!.textContent).toBe('显示 0 / 1478');
  });
});

describe('空态与底行(spec §2.3)', () => {
  it('空态卡含 school_adaptation 深链 + 正面陈述', () => {
    expect(zhHtml).toContain('issues/new?template=school_adaptation.yml');
    expect(zhHtml).toContain('未收录的学校可在 GitHub 提交适配申请');
  });
  it('JS-off 搜索框隐藏闸(spec §8「搜索框隐藏态」):label 挂 js-only 门控', () => {
    // 门控面 = global.css `.js-only{visibility:hidden}` + `html.js .js-only{visible}`(FOUC 守卫首帧挂 .js)
    expect(zhHtml).toContain('class="schools__search js-only"');
    const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.js-only\s*\{[^}]*visibility:\s*hidden/);
    expect(css).toMatch(/html\.js\s+\.js-only\s*\{[^}]*visibility:\s*visible/);
  });
  it('hidden 属性闸:作者 display 不得压死 UA [hidden]{display:none}', () => {
    // 岛 JS 的 expand/collapse 互斥、空态显隐全靠 hidden 属性;.site-button inline-flex
    // 实证作者层恒胜 UA 层(收起钮挂 hidden 仍渲染)→ 全局 [hidden] 必须 !important 兜底
    const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\[hidden\]\s*\{[^}]*display:\s*none\s*!important/);
  });
  it('底行:更新于日期 + 名录随适配更新 + 提交适配 CTA', () => {
    expect(zhHtml).toContain(catalogUpdatedAt); // 2026-10-18,快照末次刷新日
    expect(zhHtml).toContain('名录随适配更新');
    expect(zhHtml).toContain('提交适配');
  });
});

describe('岛 JS 预算(spec §2.3 ≤6KB)', () => {
  it('岛模块源长之和 < 6144(Vite 最小化只会更小)', () => {
    const total = ['src/lib/schools-island.ts', 'src/lib/search.ts']
      .map((p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8'))
      .join('').length;
    expect(total).toBeLessThan(6144);
  });
});

describe('页面骨架', () => {
  it('页头「收录与检索」+ hreflang 指本页对 + canonical /schools/', () => {
    expect(zhDoc.querySelector('h1, .t-headline-large')!.textContent).toContain('收录与检索');
    expect(zhHtml).toContain(`href="${site}/schools/"`);
    expect(zhHtml).toContain(`href="${site}/en/schools/"`);
  });
  it('展开全部/收起全部 Text 钮存在(开关态永不入 URL — 无 data-* 同步 URL 的 href)', () => {
    expect(zhHtml).toContain('展开全部');
    expect(zhHtml).toContain('收起全部');
  });
  it('真实校名保留策略随台账进工具页(§10 去向:EN 页仍列真实校名)', () => {
    const enHtml = enDoc.documentElement.innerHTML;
    expect(enHtml).toContain(schools[0].name);
    expect(enHtml).toContain(schools[schools.length - 1].name);
  });
  it('en 页头 = schoolsPage.heading + sub(§10 去向:heading+sub pin 从主页测试迁来)', () => {
    const enHtml = enDoc.documentElement.innerHTML;
    expect(enHtml).toContain(en.schoolsPage.heading);
    expect(enHtml).toContain(en.schoolsPage.sub);
    expect(enHtml).not.toContain(zh.schoolsPage.heading);
  });
  it('派生计数句工具页页头第二次 pin(§10:198「入口卡与工具页各一次」,两数派生禁手写)', () => {
    const types = new Set(schools.map((s) => s.type)).size;
    expect(zhHtml.replace(/\s+/g, '')).toContain(`${schools.length}条教务直连·${types}种协议,输入校名即可确认收录。`);
  });
});
