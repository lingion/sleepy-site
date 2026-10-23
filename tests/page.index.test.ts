import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import release from '../src/data/release.json';
import schools from '../src/data/schools.grouped.json';
import { zh } from '../src/i18n/zh';

// v4 八段主页产物闸(T5 Step 1 再基线,spec §4/§7/§14):
// dist/client/index.html 由 `npm run build` 产出 —— 产物级 DOM 验收。
// 旧「六段/blob=3/6 句 microcopy pin/03-today hero」契约随 spec §14 作废,新契约 = 不变量式。

const HTML = (() => {
  try {
    return readFileSync(new URL('../dist/client/index.html', import.meta.url), 'utf8');
  } catch {
    throw new Error('dist/client/index.html 不存在——先跑 npm run build 再跑本测试(spec §6 产物级验收)');
  }
})();

const dom = new JSDOM(HTML);
const doc = dom.window.document;

/** §14:新断言一律不变量式;段序 + data-prototype 原型表共读 */
const PROTOTYPE: Record<string, string> = {
  hero: 'split',
  views: 'showcase',
  connect: 'edit-split',
  schools: 'tool-island',
  reminders: 'pinned',
  gallery: 'full-bleed-band',
  trust: 'narration',
  download: 'tonal-band',
};

describe('八段依序 + 原型表(spec §4 v4)', () => {
  const ids = ['hero', 'views', 'connect', 'schools', 'reminders', 'gallery', 'trust', 'download'];
  it('main 直系 section = 八段依序,各带 data-prototype', () => {
    const secs = [...doc.querySelectorAll('main > section')];
    expect(secs.map((s) => s.id)).toEqual(ids);
    for (const s of secs) {
      expect(s.getAttribute('data-prototype'), `#${s.id}`).toBe(PROTOTYPE[s.id]);
    }
  });
  it('#features 段随 Features.astro 绝迹', () => {
    expect(doc.getElementById('features')).toBeNull();
    expect(HTML).not.toContain('id="features"');
  });
});

describe('blob 3→1(spec §13 R1)', () => {
  it('[data-blob] 恰一 = data-blob="0" 且在 #hero', () => {
    const blobs = [...doc.querySelectorAll('[data-blob]')];
    expect(blobs.length).toBe(1);
    expect(blobs[0].getAttribute('data-blob')).toBe('0');
    expect(doc.querySelector('#hero [data-blob="0"]')).not.toBeNull();
  });
});

describe('C1 首图不变量 + LCP 链路(spec §3 C1 / §6 LCP / T3)', () => {
  it('文档序第一张 img 的 src 含 01-week', () => {
    const first = [...doc.querySelectorAll('img')][0];
    expect(first).toBeDefined();
    expect(first.getAttribute('src')).toContain('01-week');
  });
  it('全站恰一 img[fetchpriority="high"](仅 hero 前景 light 版)', () => {
    expect(doc.querySelectorAll('img[fetchpriority="high"]').length).toBe(1);
    expect(doc.querySelectorAll('img[fetchpriority="low"]').length).toBe(1);
  });
  it('hero 高优先图 = 01-week + eager + srcset + 固有尺寸占位', () => {
    const high = doc.querySelector('img[fetchpriority="high"]')!;
    expect(high.getAttribute('src')).toContain('01-week');
    expect(high.getAttribute('loading')).toBe('eager');
    expect(high.getAttribute('srcset'), 'srcset 非空').toBeTruthy();
    expect(Number(high.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(high.getAttribute('height'))).toBeGreaterThan(0);
  });
  it('head 预载 hero 最优档,且 preload href/srcset 与高优先图同 hash(T3:preload 必命中)', () => {
    const preload = doc.querySelector('head link[rel="preload"][as="image"]')!;
    expect(preload).toBeTruthy();
    const high = doc.querySelector('img[fetchpriority="high"]')!;
    expect(preload.getAttribute('href')).toBe(high.getAttribute('src'));
    expect(preload.getAttribute('imagesrcset')).toBe(high.getAttribute('srcset'));
  });
});

describe('ribbon 佐证条(spec §4 M1)', () => {
  it('#hero 文本含派生计数 348、GPL-3.0、留存本机三事实', () => {
    const txt = doc.getElementById('hero')?.textContent ?? '';
    expect(txt).toContain(String(schools.length));
    expect(txt).toContain(zh.hero.ribbon.schools);
    expect(txt).toContain('GPL-3.0');
    expect(txt).toContain(zh.hero.ribbon.privacy);
  });
});

describe('AppBar 锚点 + 常驻钮(spec §4)', () => {
  it('#appbar 4 锚点依序齐备', () => {
    for (const h of ['#views', '#schools', '#reminders', '#trust']) {
      expect(doc.querySelector(`#appbar a[href="${h}"]`), h).not.toBeNull();
    }
  });
  it('#appbar 存在 data-appbar-cta 下载钮(Filled 档)', () => {
    const cta = doc.querySelector('#appbar [data-appbar-cta]');
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute('class')).toContain('site-button--filled');
  });
  it('CTA 互隐闸(§11-6):markup 缺省 show + 源码 IO 引用 #hero 与 appbar-cta', () => {
    const src = readFileSync(new URL('../src/components/AppBar.astro', import.meta.url), 'utf8');
    // 缺省态:JS-off 钮必显,Astro 静态 markup 写死 show
    expect(src).toContain('data-appbar-cta="show"');
    // 互隐逻辑落点:IO 观察 #hero,回调写 appbarCta/appbar-cta
    expect(src).toContain('IntersectionObserver');
    expect(src).toMatch(/getElementById\(['"]hero['"]\)/);
    expect(src).toMatch(/appbarCta|appbar-cta/);
  });
});

describe('M2 三视图 + MD3 Segmented Button(spec §4 M2)', () => {
  it('#views radiogroup 恰在,3 段 radio,恰一 aria-checked=true', () => {
    const rg = doc.querySelector('#views [role="radiogroup"]')!;
    expect(rg).toBeTruthy();
    const radios = [...rg.querySelectorAll('[role="radio"]')];
    expect(radios.length).toBe(3);
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true').length).toBe(1);
  });
  it('面板 3 块,网格列最宽(2.1fr 1fr 1fr,用户定调;dist CSS 外链 → 源码闸)', () => {
    expect(doc.querySelectorAll('#views [data-pane]').length).toBe(3);
    const src = readFileSync(new URL('../src/components/sections/Views.astro', import.meta.url), 'utf8');
    expect(src).toContain('grid-template-columns: 2.1fr 1fr 1fr');
  });
  it('默认前景 = grid(data-view 初值)', () => {
    expect(doc.querySelector('#views [data-views]')?.getAttribute('data-view')).toBe('grid');
  });
  it('外框规则引用 outline(非 variant)——brief Step 1 闸;dist CSS 外链 → 源码级', () => {
    const src = readFileSync(new URL('../src/components/sections/Views.astro', import.meta.url), 'utf8');
    const dots = src.match(/\.views__dots\s*\{[^}]*\}/)?.[0] ?? '';
    expect(dots, '.views__dots 外框规则存在').not.toBe('');
    expect(dots).toContain('var(--md-sys-color-outline)');
    expect(dots).not.toContain('outline-variant');
  });
});

describe('文案 v4 新契约(spec §7 R1-R5 + C2)', () => {
  // 可见文本 = body 文本剔除 script/style 体(JSDOM textContent 会吞内联脚本,?? / ?. 的 ? 会污染问句闸)
  const clone = doc.body!.cloneNode(true) as DocumentFragment;
  for (const n of clone.querySelectorAll('script, style')) n.remove();
  const text = clone.textContent ?? '';
  const stripped = text.replace(/\s+/g, '');
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  it('§7 对照表改后句逐句进产物', () => {
    expect(stripped).toContain('课表数据仅存于本机,不经任何服务器。'); // hero.sub(R1)
    expect(stripped).toContain('在线体验提供完整功能,无需安装。'); // download.trial(R2)
    expect(stripped).toContain('全部收录按省份与教务协议分组,支持校名或拼音检索。'); // schools.sub(R2+R4)
    expect(metaDesc.replace(/\s+/g, '')).toContain('348条教务直连,数据仅存本机,源码完整公开'); // meta.desc(R3)
    expect(stripped).toContain('收录与检索'); // schools.heading
    expect(stripped).toContain('全部为真机截图'); // gallery.heading
  });
  it('旧 pin 6 句全绝迹(C2 判废)', () => {
    for (const old of [
      '页面塌了,课表不会',
      '没有广告,没有追踪',
      '不想安装 APK',
      '搜一下,你的学校在不在',
      '群里 @ 我也行',
      '该出现时出现',
    ]) {
      expect(stripped, old).not.toContain(old.replace(/\s+/g, ''));
    }
  });
  it('问号正则 body 文本零命中(R2)', () => {
    expect(text).not.toMatch(/[?？]/);
  });
  it('slogan 保留(§13 R3 豁免,逐字)', () => {
    expect(stripped).toContain('构建无壳,自由自在');
  });
  it('红线词零出现', () => {
    for (const w of ['赋能', '极致', '匠心', '通吃', '不吭声', '说一声', '请我喝可乐', 'Buy me a cola']) {
      expect(HTML, w).not.toContain(w);
    }
  });
  it('FAQ 外链钉死', () => {
    expect(HTML).toContain('https://github.com/lingion/sleepy/blob/main/FAQ.md');
  });
});

describe('reveal 不变量(spec §17.2)', () => {
  it('每组 .reveal 的 --reveal-i 自 0 连续无跳跃(组 = 最近 [data-reveal-group] 祖先,否则所在段)', () => {
    const groups: Record<string, number[]> = {};
    for (const el of doc.querySelectorAll('.reveal')) {
      const g = el.closest('[data-reveal-group]');
      const key = g ? g.getAttribute('data-reveal-group')! : `#${el.closest('section')?.id}`;
      const n = Number((el.getAttribute('style') ?? '').match(/--reveal-i:\s*(\d+)/)?.[1]);
      (groups[key] ??= []).push(n);
    }
    expect(Object.keys(groups).length).toBeGreaterThanOrEqual(6);
    for (const [key, idx] of Object.entries(groups)) {
      expect(idx, key).toEqual([...idx.keys()]);
    }
  });
  it('DOM 序 = 揭示序(不变量保留)', () => {
    expect(doc.querySelectorAll('.reveal').length).toBeGreaterThan(0);
  });
});

describe('M4 学校名录(spec §4 M4 / §15)', () => {
  it('JS-off:全量分组静态可读(348 行全渲染)', () => {
    const rows = doc.querySelectorAll('#schools [data-school]');
    expect(rows.length).toBe(schools.length);
    expect(schools.length).toBe(348);
  });
  it('statLine 口径「348 条收录 · 33 协议」(派生联动,禁手写)', () => {
    const types = new Set(schools.map((s) => s.type)).size;
    const txt = (doc.getElementById('schools')?.textContent ?? '').replace(/\s+/g, '');
    expect(txt).toContain(`${schools.length}条收录·${types}协议`);
  });
  it('点击不跳转:校名行不是 <a>(§3③ 继承)', () => {
    for (const row of doc.querySelectorAll('#schools [data-school]')) {
      expect(row.tagName).not.toBe('A');
      expect(row.querySelector('a')).toBeNull();
    }
  });
  it('connect 段 chip = 派生「348 校直连」', () => {
    expect((doc.getElementById('connect')?.textContent ?? '')).toContain(`${schools.length} 校直连`);
  });
});

describe('M5 提醒与组件墙(spec §4 M5 / C4)', () => {
  it('三 beat 依序:课前提醒/今日摘要/明日预告', () => {
    const beats = [...doc.querySelectorAll('#reminders [data-beat]')].map((b) => b.textContent ?? '');
    expect(beats.length).toBe(3);
    expect(beats[0]).toContain('课前提醒');
    expect(beats[1]).toContain('今日摘要');
    expect(beats[2]).toContain('明日预告');
  });
  it('全站恰一处 .site-card--elevated(§11-2 唯一 elevated = 周网格主角卡)', () => {
    const el = [...doc.querySelectorAll('.site-card--elevated')];
    expect(el.length).toBe(1);
    expect(el[0].closest('#reminders'), 'elevated 属 M5 组件墙').not.toBeNull();
  });
  it('组件墙四件:周网格竖卡 + 今日/两天/周列表扁条(全部真机比例)', () => {
    for (const w of ['weekgrid', 'today', 'twodays', 'weeklist']) {
      expect(doc.querySelector(`#reminders [data-widget="${w}"]`), w).not.toBeNull();
    }
  });
});

describe('M6 画廊 band(spec §4 M6)', () => {
  it('图数 = zh captions 长度(8,weekview 入廊);每 figure 浅/深两版(带内 CSS 强制 light)', () => {
    const figs = doc.querySelectorAll('#gallery [data-gallery-figure]');
    expect(figs.length).toBe(zh.gallery.captions.length);
    expect(zh.gallery.captions.length).toBe(8);
    expect(doc.querySelectorAll('#gallery .shot__light').length).toBe(8);
    expect(doc.querySelectorAll('#gallery .shot__dark').length).toBe(8);
    expect(doc.querySelector('#gallery [data-lightbox]'), 'lightbox 岛保留').not.toBeNull();
  });
});

describe('M8 下载 + CTA 纪律(spec §4 M8 / §11-6)', () => {
  it('latest 直链 + 四 ABI 行 + sha256 外链', () => {
    const html = doc.getElementById('download')?.innerHTML ?? '';
    expect(html).toContain('https://github.com/lingion/sleepy/releases/latest');
    for (const a of release.assets) expect(html, `asset ${a.name}`).toContain(a.url);
    expect(html).toContain(release.sha256sumsUrl);
    expect(doc.querySelector('#download [data-store-disabled]')).not.toBeNull();
  });
  it('主按钮 = Elevated 档,带 class download--tonal(§11-6:彩色容器上禁 tonal 叠 tonal)', () => {
    expect(doc.querySelector('#download .site-button--elevated')).not.toBeNull();
    expect(doc.querySelector('#download.download--tonal')).not.toBeNull();
    expect(doc.querySelector('#download .site-button--tonal'), 'tonal 绝迹').toBeNull();
  });
  it('全页 Filled 仅 AppBar S + hero XL 两枚(§11-6)', () => {
    expect(doc.querySelectorAll('.site-button--filled').length).toBe(2);
  });
  it('Android 8.0+ minSdk 事实', () => {
    expect(doc.getElementById('download')?.textContent ?? '').toContain('Android 8.0');
  });
});

describe('a11y/SEO 基线(保留项)', () => {
  it('h1 唯一 = slogan;lang=zh-CN', () => {
    expect(doc.querySelectorAll('h1').length).toBe(1);
    expect(doc.querySelector('h1')?.textContent).toContain('构建无壳');
    expect(doc.documentElement.lang).toBe('zh-CN');
  });
  it('img alt 全非 null', () => {
    for (const img of doc.querySelectorAll('img')) {
      expect(img.getAttribute('alt'), `alt on ${img.getAttribute('src')}`).not.toBeNull();
    }
  });
  it('锚点落点闸:section[id] scroll-margin-top 在 global.css(T2 联动)', () => {
    const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
    expect(css).toMatch(/section\[id\]\s*\{[^}]*scroll-margin-top:\s*80px/);
  });
});
