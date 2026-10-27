import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import release from '../src/data/release.json';
import schools from '../src/data/schools.grouped.json';
import { zh } from '../src/i18n/zh';

// v5 八段主页产物闸(plan Task 7 再基线,spec §2.2/§10):
// dist/client/index.html 由 `npm run build` 产出 —— 产物级 DOM 验收。
// 四页化:台账段(schools)离页 → schoolCard 入口卡;M8 下载段瘦身为单出口。§10 逐条去向注在块头。

const HTML = (() => {
  try {
    return readFileSync(new URL('../dist/client/index.html', import.meta.url), 'utf8');
  } catch {
    throw new Error('dist/client/index.html 不存在——先跑 npm run build 再跑本测试(spec §6 产物级验收)');
  }
})();

const dom = new JSDOM(HTML);
const doc = dom.window.document;

/** §14:新断言一律不变量式;段序 + data-prototype 原型表共读(§10:36-43 行:v4 删 schools 换 schoolCard,净数仍 8) */
const PROTOTYPE: Record<string, string> = {
  hero: 'split',
  views: 'showcase',
  connect: 'edit-split',
  schoolCard: 'entry-card',
  reminders: 'pinned',
  gallery: 'full-bleed-band',
  trust: 'narration',
  download: 'tonal-band',
};

describe('八段依序 + 原型表(spec §2.2 v5 段序)', () => {
  const ids = ['hero', 'views', 'connect', 'schoolCard', 'reminders', 'gallery', 'trust', 'download'];
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
  it('#schools 段随台账离页绝迹(§10 行 1 负闸;全量行与三态过滤岛不再进主页)', () => {
    expect(doc.getElementById('schools')).toBeNull();
    expect(HTML).not.toContain('id="schools"');
    expect(HTML).not.toContain('data-prototype="tool-island"');
    expect(doc.querySelectorAll('#schoolCard [data-school]').length).toBe(0);
    expect(doc.querySelector('#schoolCard input')).toBeNull();
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
  it('#hero 文本含派生计数与 GPL-3.0、留存本机三事实', () => {
    const txt = doc.getElementById('hero')?.textContent ?? '';
    expect(txt).toContain(String(schools.length));
    expect(txt).toContain(zh.hero.ribbon.schools);
    expect(txt).toContain('GPL-3.0');
    expect(txt).toContain(zh.hero.ribbon.privacy);
  });
  it('#hero 在线体验钮 href = 官网 preview 前缀(2026-10-27 体验链迁移)', () => {
    const trial = doc.querySelector('#hero a.site-button--text');
    expect(trial, 'hero 体验钮存在').not.toBeNull();
    expect(trial!.getAttribute('href')).toBe('https://sleepy.is-my.app/preview');
  });
});

describe('AppBar 锚点 + 常驻钮(spec §2.1 v5 跨页导航)', () => {
  it('#appbar 4 导航项依序齐备(绝对路径形式:锚点回主页,页面项指工具页)', () => {
    for (const h of ['/#views', '/schools/', '/faq/', '/#reminders']) {
      expect(doc.querySelector(`#appbar a[href="${h}"]`), h).not.toBeNull();
    }
    // 旧裸 # 锚点绝迹(F2:v4 单页假设修复)
    for (const old of ['#views', '#schools', '#reminders', '#trust']) {
      expect(doc.querySelector(`#appbar a[href="${old}"]`), old).toBeNull();
    }
  });
  it('#appbar 存在 data-appbar-cta 下载钮(Filled 档)', () => {
    const cta = doc.querySelector('#appbar [data-appbar-cta]');
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute('class')).toContain('site-button--filled');
  });
  it('CTA 互隐闸(§11-6):缺省态 prop 化 + 源码 IO 引用 #hero 与 appbar-cta', () => {
    const src = readFileSync(new URL('../src/components/AppBar.astro', import.meta.url), 'utf8');
    // 缺省态(§10 改写):字面 show 随 prop 化失效 → 三元方向锁(hasHero 页 show / 工具页 hide 终态);反转即红
    expect(src).toMatch(/hasHero\s*\?\s*['"]show['"]\s*:\s*['"]hide['"]/);
    // 互隐逻辑落点:IO 观察 #hero,脚本侧写 dataset.appbarCta
    // (原 /appbarCta|appbar-cta/ 无鉴别力——markup 恒含 appbar-cta,只锁脚本侧)
    expect(src).toContain('IntersectionObserver');
    expect(src).toMatch(/getElementById\(['"]hero['"]\)/);
    expect(src).toMatch(/dataset\.appbarCta\s*=/);
    // 方向锁:hero 相交 → hide(逐字锁简报 Step 2 三元)。`? 'show' : 'hide'` 反转即红;
    // 取反改写 `!x.isIntersecting ? 'hide'` 虽含正句子串,由下行负闸拦截
    expect(src).toMatch(/isIntersecting\s*\?\s*['"]hide['"]\s*:\s*['"]show['"]/);
    expect(src).not.toMatch(/!\s*[\w$]+\.isIntersecting\s*\?/);
    // 机制锁:hide 态 = visibility:hidden 保留占位(布局零跳动)。
    // display:none 负闸只约束 hide 规则本体——icon 主题切换/≤840px 锚点隐藏合法用 display:none,文件级禁串必红
    const hide = src.match(/\.appbar__cta\[data-appbar-cta=['"]hide['"]\]\s*\{[^}]*\}/)?.[0] ?? '';
    expect(hide, '.appbar__cta hide 规则存在').not.toBe('');
    expect(hide).toMatch(/visibility:\s*hidden/);
    expect(hide).not.toMatch(/display:\s*none/);
  });
  it('汉堡菜单闸(2026-10-25 用户报手机无页间导航):钮 + 面板 + 同源链接 + disclosure 脚本', () => {
    // 产物级:≤840px 锚点组 display:none 后,汉堡钮是手机唯一页间导航
    const btn = doc.querySelector('#appbar [data-appbar-menu]');
    expect(btn, '汉堡钮存在').not.toBeNull();
    expect(btn?.getAttribute('aria-expanded'), '缺省收合').toBe('false');
    expect(btn?.getAttribute('aria-controls'), 'aria-controls 指向面板').toBe('appbar-menu');
    // 面板:JS-off 可读性 = hidden 属性缺省收合,内容常驻 DOM(非脚本注入)
    const panel = doc.querySelector('#appbar-menu');
    expect(panel, '面板存在').not.toBeNull();
    expect(panel?.hasAttribute('hidden'), '面板缺省 hidden').toBe(true);
    // 链接 = 锚点组同源 href 不变量(4 导航项 + 下载),禁两套 URL 漂移
    const hrefs = [...panel!.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/#views', '/schools/', '/faq/', '/#reminders', '/download/']);
    // 源码锁:≤840px 媒体查询内钮接管显示(删了 CSS 显示规则 → 钮恒 display:none → 此锁红)
    const src = readFileSync(new URL('../src/components/AppBar.astro', import.meta.url), 'utf8');
    const mq = src.match(/@media\s*\(max-width:\s*840px\)\s*\{[\s\S]*?\n\s*\}/)?.[0] ?? '';
    expect(mq, '≤840px 媒体查询存在').not.toBe('');
    expect(mq).toMatch(/\.appbar__menu\s*\{\s*display:\s*inline-flex/);
    // disclosure 脚本三收合面:链接点击 / Escape / 升档回桌面(matchMedia change)
    expect(src).toMatch(/key\s*===\s*['"]Escape['"]/);
    expect(src).toMatch(/min-width:\s*841px/);
    expect(src).toMatch(/closest\(['"]a['"]\)/);
    // aria-label 随开合切换(打开 ⇄ 关闭),双语 prop 化
    expect(src).toMatch(/data-label-open/);
    expect(src).toMatch(/data-label-close/);
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
  it('面板 3 块同格叠放,主次状态机:焦点居中清晰,背景模糊退后(巡检缺陷3 2026-10-25)', () => {
    expect(doc.querySelectorAll('#views [data-pane]').length).toBe(3);
    const src = readFileSync(new URL('../src/components/sections/Views.astro', import.meta.url), 'utf8');
    // 用户原话:「三张一样大小的图片从上到下放/一样大小只是其他两个有阴影——
    // 这不是切换视图的样子,视图是有主次之分的,被聚焦的应在中间,剩下两个
    // 模糊或次层级放到背后」→ 等宽并列(旧 2.1fr 主三列)废除。
    // 锁 grid 声明本体(注释可如实提及旧值作历史,声明位禁复活)
    expect(src).not.toMatch(/grid-template-columns:[^;}]*2\.1fr/);
    // 结构前提:三面板同格叠放(单 cell 堆栈),舞台横向裁切
    expect(src).toMatch(/\.views__pane\s*\{[^}]*grid-area:\s*1\s*\/\s*1/);
    expect(src).toMatch(/\.views__panels\s*\{[^}]*overflow:\s*hidden/);
    // 环序不变量(圈序 grid→week→today 循环):右背景 = 下一枚,左背景 = 上一枚。
    // 锁方位分配本身(四铁律③),红绿验证:任一对调换/删除 = 该侧断言红
    const rightSel = (src.match(/([^{}]+)\{\s*--dir:\s*1;/s)?.[1] ?? '').replace(/\s+/g, ' ');
    for (const pair of [
      "data-view='grid'] .views__pane--week",
      "data-view='week'] .views__pane--today",
      "data-view='today'] .views__pane--grid",
    ]) {
      expect(rightSel, `右背景(--dir:1)缺 ${pair}`).toContain(pair);
    }
    const leftSel = (src.match(/([^{}]+)\{\s*--dir:\s*-1;/s)?.[1] ?? '').replace(/\s+/g, ' ');
    for (const pair of [
      "data-view='grid'] .views__pane--today",
      "data-view='week'] .views__pane--grid",
      "data-view='today'] .views__pane--week",
    ]) {
      expect(leftSel, `左背景(--dir:-1)缺 ${pair}`).toContain(pair);
    }
    // 背景档视觉语言:侧移(消费 --dir)+ 缩位 + 模糊 + 降透明(用户「模糊或
    // 次层级放到背后」= 四特征齐备才算主次,缺一即红)。
    // translate/scale 用 CSS Transforms L2 独立属性:与 .reveal / hover 的
    // transform 简写正交合成,零特异性战争
    const behindRule = src.match(/[^{}]+\{[^}]*translate:\s*calc\(var\(--dir\)[^}]*\}/s)?.[0] ?? '';
    expect(behindRule, '背景档规则存在').not.toBe('');
    expect(behindRule).toMatch(/scale:\s*0?\.\d+/);
    expect(behindRule).toContain('blur(');
    // 降透形态 = filter 函数链内 opacity(0.x)(禁裸 opacity 属性,会压死 .reveal
    // 入场闸)——断言随实现形态写:`opacity:` 或 `opacity(` 任一即算降透存在
    expect(behindRule).toMatch(/opacity[:(]\s*0?\.\d+/);
    // 焦点档:无侧移、无缩位、无模糊、前景层(清晰满位;从 behind 块独立可断言)。
    // 焦点档禁声明 opacity——自带 1 (0,4,1) 会闸死 .reveal 入场淡入 (0,2,0);
    // 回焦时 behind 规则脱钩,opacity 落回 reveal 终值 1(正交合成,四铁律)
    const focalRule = src.match(/\.views\[data-view='grid'\] \.views__pane--grid[^{]*\{([^}]*)\}/s)?.[1] ?? '';
    expect(focalRule, '焦点档规则存在').not.toBe('');
    expect(focalRule).toContain('translate: none');
    expect(focalRule).toContain('scale: 1');
    expect(focalRule).toContain('filter: none');
    expect(focalRule).not.toMatch(/opacity/);
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
  it('dark 节奏补丁(spec §17.1/T10 剖面实抓缺陷):带底 container-high 拉步长 + 段界发丝顶边', () => {
    const src = readFileSync(new URL('../src/components/sections/Views.astro', import.meta.url), 'utf8');
    const darkBand = src.match(/:global\(\[data-theme='dark'\]\)\s*\.views-band\s*\{[^}]*\}/)?.[0] ?? '';
    expect(darkBand, 'dark .views-band 规则存在').not.toBe('');
    expect(darkBand).toContain('var(--md-sys-color-surface-container-high)');
    expect(darkBand).toContain('border-block-start: 1px solid var(--md-sys-color-outline-variant)');
  });
});

describe('文案 v5 契约(spec §7 + §2.2 入口卡句)', () => {
  // 可见文本 = body 文本剔除 script/style 体(JSDOM textContent 会吞内联脚本,?? / ?. 的 ? 会污染问句闸)
  const clone = doc.body!.cloneNode(true) as DocumentFragment;
  for (const n of clone.querySelectorAll('script, style')) n.remove();
  const text = clone.textContent ?? '';
  const stripped = text.replace(/\s+/g, '');
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  it('§7 对照表改后句逐句进产物(trial/schools 两 pin 已随 §10 迁出主页)', () => {
    expect(stripped).toContain('课表数据仅存于本机,不经任何服务器。'); // hero.sub(R1)
    expect(metaDesc.replace(/\s+/g, '')).toContain(`${schools.length}条教务直连,数据仅存本机,源码完整公开`); // meta.desc(R3,派生)
    expect(stripped).toContain(zh.gallery.heading); // gallery.heading(派生 pin,v5 巡检批精简后禁再硬编码旧句)
  });
  it('入口卡派生句两数进产物(§10 行 4:statLine 派生 pin,禁手写;条数不当校数说 §4.1)', () => {
    const types = new Set(schools.map((s) => s.type)).size;
    expect(stripped).toContain(`${schools.length}条教务直连·${types}种协议,输入校名即可确认收录。`);
    expect(schools.length).toBe(1478);
  });
  it('入口钮 = /schools/?focus=s 精确 href + 卡内零 input(§2.2 终审 I2 合同侧 pin;行为侧 = Task 4 岛 + T4 目检)', () => {
    const card = doc.getElementById('schoolCard')!;
    const link = card.querySelector('a[href="/schools/?focus=s"]');
    expect(link, '入口钮 href').not.toBeNull();
    expect(link!.textContent).toContain(zh.homeSchoolCard.cta);
    expect(card.querySelector('input'), '入口卡非搜索框本体').toBeNull();
    expect(card.querySelector('script'), '入口卡非岛').toBeNull();
    expect(card.querySelectorAll('.site-button--filled').length, '入口钮非 Filled(§11-6 主页恰两枚)').toBe(0);
  });
  it('入口卡计数句 tnum(§10 行 19:两数字 tnum;§2.2 入口卡)', () => {
    const count = doc.querySelector('#schoolCard .schools-card__count')!;
    expect(count, '计数句存在').not.toBeNull();
    expect(count.getAttribute('class')!.split(/\s+/), 'tnum 类').toContain('tnum');
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
  it('FAQ 站内化(§10 改写:ui.ts faqUrl 随 /faq/ 页落地,消费方 Trust/Footer 自动生效)', () => {
    expect(HTML).toContain('href="/faq/"');
    expect(HTML).not.toContain('https://github.com/lingion/sleepy/blob/main/FAQ.md');
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

describe('connect 段(spec §10 行 4:段未动,chip 派生断言留主页;台账三断言迁 page.schools.test.ts)', () => {
  it('connect 段 chip = 派生「1478 条直连」', () => {
    expect((doc.getElementById('connect')?.textContent ?? '')).toContain(`${schools.length} 条直连`);
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
  it('组件墙五件:周网格竖卡 + 今日/两天/周列表/周视图扁条(全部真机比例,Task 9 缺口修)', () => {
    for (const w of ['weekgrid', 'today', 'twodays', 'weeklist', 'weekview']) {
      expect(doc.querySelector(`#reminders [data-widget="${w}"]`), w).not.toBeNull();
    }
  });
});

describe('M6 画廊 band(spec §4 M6)', () => {
  it('图数 = zh captions 长度(8,weekview 入廊);每 figure 浅/深两版随主题翻转(2026-10-25 巡检批废带内强制 light)', () => {
    const figs = doc.querySelectorAll('#gallery [data-gallery-figure]');
    expect(figs.length).toBe(zh.gallery.captions.length);
    expect(zh.gallery.captions.length).toBe(8);
    expect(doc.querySelectorAll('#gallery .shot__light').length).toBe(8);
    expect(doc.querySelectorAll('#gallery .shot__dark').length).toBe(8);
    expect(doc.querySelector('#gallery [data-lightbox]'), 'lightbox 岛保留').not.toBeNull();
  });
});

describe('M8 下载单出口 + CTA 纪律(spec §2.2 / §10 行 5-6)', () => {
  const universal = release.assets.find((a) => a.name.includes('universal'))!;
  it('恰一下载出口 = universal APK URL 进 #download 段', () => {
    const html = doc.getElementById('download')?.innerHTML ?? '';
    expect(html).toContain(universal.url);
    const links = [...(doc.getElementById('download')?.querySelectorAll('a[href$=".apk"]') ?? [])];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([universal.url]);
  });
  it('四 ABI 全 URL / sha 链 / store 占位 / releases/latest 直链 / trial 链绝迹(§10:ABI/sha/store 段内 + releases/latest 段级 — 主页其余钮受 §2.2 CTA 不动保护)', () => {
    const html = doc.getElementById('download')?.innerHTML ?? '';
    // §10 原文 = universal 之外「其余」ABI URL 绝迹;universal 是主钮 href(上条已 pin),不在负闸集
    for (const a of release.assets.filter((x) => !x.name.includes('universal'))) expect(html, `asset ${a.name}`).not.toContain(a.url);
    expect(html).not.toContain(release.sha256sumsUrl);
    expect(doc.querySelector('#download [data-store-disabled]')).toBeNull();
    expect(html).not.toContain('https://github.com/lingion/sleepy/releases/latest');
    expect(html).not.toContain('https://sleepy.qdp.qzz.io'); // onlineTrialUrl 随体验链迁出
  });
  it('次行 Text 链「其他架构与校验 →」指 /download/(新去向)', () => {
    const link = doc.querySelector('#download a[href="/download/"]');
    expect(link).not.toBeNull();
    expect(link!.textContent).toContain('其他架构与校验');
  });
  it('主钮 = Elevated 档链 universal,tonal 绝迹;段零 Filled(§10 行 6)', () => {
    expect(doc.querySelector('#download .site-button--elevated')).not.toBeNull();
    expect(doc.querySelector('#download.download--tonal')).not.toBeNull();
    expect(doc.querySelector('#download .site-button--tonal'), 'tonal 绝迹').toBeNull();
    expect(doc.querySelector('#download .site-button--filled'), 'download 段零 Filled').toBeNull();
    const primary = doc.querySelector('#download a.site-button--elevated')!;
    expect(primary.getAttribute('href')).toBe(universal.url);
  });
  it('全页 Filled 仅 AppBar S + hero XL 两枚(§11-6,瘦身不破)', () => {
    expect(doc.querySelectorAll('.site-button--filled').length).toBe(2);
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

describe('Task 10 mobile 剖面缺陷锁(Lighthouse home/schools 复测归零项)', () => {
  it('hero 图盒比例钉 img 本体(移动 CLS 0.41→0):aspect-ratio + 零 100% 高 + 零 display(块级化归 Shot)', () => {
    const src = readFileSync(new URL('../src/components/sections/Hero.astro', import.meta.url), 'utf8');
    const rule = src.match(/:global\(#hero \.hero__device img\)\s*\{([^}]*)\}/s)?.[1] ?? '';
    expect(rule, 'img 规则存在').not.toBe('');
    expect(rule).toContain('aspect-ratio: 1080 / 2048');
    expect(rule).toContain('block-size: auto');
    expect(rule).not.toContain('block-size: 100%');
    // 2026-10-25 双显事故:display 声明曾在此(1,1,1)压过 Shot 主题规则;块级化已迁 Shot
    expect(rule).not.toMatch(/display\s*:/);
  });
  it('pane lead = on-surface 不降级 variant(dim 叠色对比闸:三占二恒 ×.55)', () => {
    const src = readFileSync(new URL('../src/components/sections/Views.astro', import.meta.url), 'utf8');
    const rule = src.match(/\.views__pane-lead\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toContain('var(--md-sys-color-on-surface)');
    expect(rule).not.toContain('on-surface-variant');
  });
});

describe('Shot 流式窗口三件套兜底(CLS 0.4711 根因锁,2026-10-25 延迟注入取证)', () => {
  // 根因:Shot 显隐活在页面级 chunk,慢网分块落地有窗口期——chunk 缺席双显 1369→697,
  // 分块中间态双藏 26px(C 实验 t=1080 shift=0.4737)。旧双显 bug 掩盖塌陷(0.0151 假阴性)。
  // 修复:显式单显兜底进 Base 首包,首帧即正确;特异性夹档 (0,1,0)/(0,2,1) vs chunk (0,2,0)/(0,3,0)。
  const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ''); // 剥注释:根因注释含 .shot__dark{none} 等字面量,不剥正则先命中注释
  const pick = (sel: string) => css.match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

  it('兜底一:light 主题首帧 .shot__dark 藏(0,1,0 单类,压不过任何 chunk scoped 规则)', () => {
    expect(pick('.shot__dark')).toMatch(/display:\s*none/);
  });
  it('兜底二:dark 主题藏 light(0,2,1 压 chunk .shot__light{block} (0,2,0))', () => {
    expect(pick("html[data-theme='dark'] .shot__light")).toMatch(/display:\s*none/);
  });
  it('兜底三:dark 主题显 dark(0,2,1 压 chunk .shot__dark{none} (0,2,0),封双藏窗)', () => {
    expect(pick("html[data-theme='dark'] .shot__dark")).toMatch(/display:\s*block/);
  });
  it('夹档不变量:兜底选择器恒单 data-theme 属性面(特异性 ≤ (0,2,1),禁压 chunk 终态/gallery force-light (0,3,0))', () => {
    // 从真源码提取全部规则选择器,禁对硬编码常量匹配(那永远绿 = 零鉴别力)
    const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter((s) => s.includes('data-theme'));
    expect(selectors.length, 'data-theme 选择器存在').toBeGreaterThanOrEqual(2);
    for (const sel of selectors) {
      expect((sel.match(/\[data-theme/g) || []).length, sel).toBe(1); // 双属性 = (0,3,x) 即红
    }
  });
  it('FOUC 守卫 data-theme 属性面存在(兜底二/三的选择器依赖)', () => {
    expect(HTML).toMatch(/<script[^>]*>[\s\S]*data-theme[\s\S]*<\/script>/);
  });
  it('hero device ≤840px 显式定宽(CLS 0.4397 位移本体:fit-content 宽随未达图内容塌 26)', () => {
    const src = readFileSync(new URL('../src/components/sections/Hero.astro', import.meta.url), 'utf8');
    // 闭合锚 2 空格缩进(内层规则 4 空格):惰性 [\s\S]*? 遇 4 空格 } 不停,整段媒体查询收全
    const mq = src.match(/@media\s*\(max-width:\s*840px\)\s*\{([\s\S]*?)\n {2}\}/)?.[1] ?? '';
    const dev = mq.match(/\.hero__device\s*\{([^}]*)\}/)?.[1] ?? '';
    // min(100%,420) 定宽 = 容器宽恒确定,脱离图加载;max-inline-size 回退(内容驱动塌缩)即红
    expect(dev, '.hero__device ≤840px 规则存在').not.toBe('');
    expect(dev).toContain('inline-size: min(100%, 420px)');
    expect(dev).not.toMatch(/max-inline-size/);
  });
});
