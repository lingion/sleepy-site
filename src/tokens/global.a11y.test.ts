import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// T5 布局壳静态闸(spec §2.1/§2.2/§2.3/§2.4 可 grep 的部分):
// CSS/组件源码文本断言——DOM 级验收(data-blob 计数=3)在 T6 页面就位后测。

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const globalCss = read('../styles/global.css');
const base = read('../layouts/Base.astro');
const appBar = read('../components/AppBar.astro');
const blob = read('../components/Blob.astro');
const footer = read('../components/Footer.astro');
const ui = read('../i18n/ui.ts');

describe('global.css 设计契约(spec §2.2)', () => {
  it('控件描边用 outline,禁 outlineVariant(WCAG 非文本 1.67:1 教训)', () => {
    const controlRules = globalCss.match(/\.site-(chip|field|button|search)[^{]*\{[^}]*\}/g) ?? [];
    expect(controlRules.length).toBeGreaterThan(0);
    // 控件规则里 outlineVariant 绝迹
    for (const rule of controlRules) {
      expect(rule).not.toMatch(/outline-variant/);
    }
    // 实描边(非 none/transparent)必 = outline;受约束控件(outlined 按钮/field/chip)≥3
    let outlined = 0;
    for (const rule of controlRules) {
      if (/border:\s*[^nt\s][^;]*;/.test(rule)) {
        expect(rule).toMatch(/var\(--md-sys-color-outline\)/);
        outlined++;
      }
    }
    expect(outlined).toBeGreaterThanOrEqual(3);
    // outlineVariant 全文件仅 .site-divider 一处(连字符形式 = 变量引用)
    expect((globalCss.match(/--md-sys-color-outline-variant/g) ?? []).length).toBe(1);
    const dividerIdx = globalCss.indexOf('.site-divider');
    expect(dividerIdx).toBeGreaterThan(0);
    expect(globalCss.indexOf('--md-sys-color-outline-variant')).toBeGreaterThan(dividerIdx);
  });
  it('lightbox scrim = #000000 32%(M3 dialog 值,spec §2.2)', () => {
    expect(globalCss).toMatch(/--site-lightbox-scrim:\s*rgba\(0,\s*0,\s*0,\s*0\.32\)/);
  });
  it('15 阶 M3 type scale 全量', () => {
    for (const t of ['display-large', 'display-medium', 'display-small', 'headline-large', 'headline-medium', 'headline-small', 'title-large', 'title-medium', 'title-small', 'body-large', 'body-medium', 'body-small', 'label-large', 'label-medium', 'label-small']) {
      expect(globalCss).toContain(`--md-sys-typescale-${t}`);
    }
  });
  it('15 阶 token 值必含 family(font 简写缺 family 整条声明静默无效,v4 视觉闸教训)', () => {
    const decls = globalCss.match(/--md-sys-typescale-[a-z-]+:[^;]+;/g) ?? [];
    expect(decls.length).toBe(15);
    for (const d of decls) {
      expect(d, `token 缺 family → font: var() 消费方全部回退默认字体: ${d}`).toMatch(/var\(--site-font-stack\)/);
    }
    // 消费方禁再写「font: var(--token) / 数字」这类非法简写
    expect(globalCss).not.toMatch(/font:\s*var\(--md-sys-typescale-[a-z-]+\)\s*\//);
  });
  it('shape 六档 xs4/sm8/md12/lg16/xl28 + full9999', () => {
    expect(globalCss).toMatch(/--md-sys-shape-corner-small:\s*8px/);
    expect(globalCss).toMatch(/--md-sys-shape-corner-medium:\s*12px/);
    expect(globalCss).toMatch(/--md-sys-shape-corner-full:\s*9999px/);
  });
  it('CJK 系统栈(不拖 Noto Web 字体,spec §2.2 定案)', () => {
    expect(globalCss).toContain('PingFang SC');
    expect(globalCss).toContain('HarmonyOS Sans SC');
    expect(globalCss).toContain('Microsoft YaHei');
  });
  it('reduced-motion reveal 升档:opacity 200ms 淡入 + 位移归零(v4 spec §6,旧 §2.3「0ms 直出」契约随 v4 废弃)', () => {
    const reduceBlock = globalCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/);
    expect(reduceBlock, 'global.css 须有 reduce 块').not.toBeNull();
    expect(reduceBlock[0]).toMatch(/transition:\s*opacity 200ms ease/);
    expect(reduceBlock[0]).toMatch(/transform:\s*none/);
    // 旧「直出 opacity:1」必须绝迹:opacity 交由 data-revealed 控制
    expect(reduceBlock[0]).not.toMatch(/\.js \.reveal\s*\{[^}]*opacity:\s*1\s*[;}]/);
    expect(globalCss).toMatch(/\.js \.reveal\[data-revealed='true'\]\s*\{[^}]*opacity:\s*1/);
  });
  it('内容列 1040dp + section 间距 128/80(spec §2.2/§2.4)', () => {
    expect(globalCss).toContain('--site-content-col: 1040px');
    expect(globalCss).toContain('--site-section-gap: 128px');
    expect(globalCss).toContain('80px');
  });
  it('段距三档 128/80/48 + ≤600px 档切 gap-small(v4 spec §5.2/§9)', () => {
    expect(globalCss).toContain('--site-section-gap-narrow: 80px');
    expect(globalCss).toMatch(/--site-section-gap-small:\s*48px/);
    const narrow = globalCss.match(/@media \(max-width: 600px\)\s*\{\s*:root\s*\{[^}]*--site-section-gap:\s*var\(--site-section-gap-small\)/);
    expect(narrow, '≤600px 档必须切换 --site-section-gap 至 gap-small').not.toBeNull();
    // 档位次序:600 块在 840 块之后(级联后置才准 ≤600 覆盖 ≤840)
    expect(globalCss.indexOf('@media (max-width: 600px)')).toBeGreaterThan(
      globalCss.indexOf('@media (max-width: 840px)')
    );
  });
  it('锚点落点避 sticky AppBar:section[id]{scroll-margin-top:80px}(v4 spec §4)', () => {
    expect(globalCss).toMatch(/section\[id\]\s*\{[^}]*scroll-margin-top:\s*80px/);
  });
  it('换幕带变量 --site-band-bg/-fg 有唯一消费点(Gallery band,v4 §11-11:禁无主变量)', async () => {
    expect(globalCss).toMatch(/--site-band-bg:\s*#313033/);
    expect(globalCss).toMatch(/--site-band-fg:\s*#F4EFF4/);
    const gallery = read('../components/sections/Gallery.astro');
    expect(gallery).toContain('background: var(--site-band-bg)');
    expect(gallery).toContain('color: var(--site-band-fg)');
    const footerSrc = footer;
    expect(footerSrc, 'Footer 不引 band 变量(surface-container 档)').not.toContain('--site-band');
  });
  it('红线词零出现(赋能/极致/匠心,spec §2.5)', () => {
    for (const word of ['赋能', '极致', '匠心']) {
      expect(globalCss).not.toContain(word);
    }
  });
});

describe('Base.astro head 契约(spec §1/§3)', () => {
  it('FOUC 守卫 = <head> 内联脚本先读 localStorage 再进首帧', () => {
    expect(base).toContain('is:inline');
    expect(base).toContain('sleepy-theme');
    expect(base).toContain('data-theme');
    expect(base).toContain('prefers-color-scheme');
  });
  it('hreflang 双指 zh/en + x-default', () => {
    expect(base).toContain('hreflang="zh-CN"');
    expect(base).toContain('hreflang="en"');
    expect(base).toContain('hreflang="x-default"');
  });
  it('构建 meta:tag+builtAt 经 Base→Footer 落 data-build,可见腐烂信号(spec §4.2)', () => {
    expect(base).toContain('release.json');
    expect(base).toMatch(/build=/);
    expect(footer).toMatch(/data-build=/);
  });
  it('og + twitter 基础 meta', () => {
    expect(base).toContain('og:title');
    expect(base).toContain('twitter:card');
  });
});

describe('AppBar.astro(spec §2.2/§2.5)', () => {
  it('sticky 定位', () => {
    expect(appBar).toMatch(/position:\s*sticky/);
  });
  it('滚动态 tonal surface→surfaceContainer,无阴影', () => {
    expect(appBar).toContain('--md-sys-color-surface-container');
    expect(appBar).not.toMatch(/box-shadow/);
  });
  it('明暗按钮 tooltip「晚课专用。」逐字', () => {
    expect(appBar).toContain('晚课专用。');
  });
  it('zh|EN 语言切换', () => {
    expect(appBar).toContain('EN');
  });
});

describe('Task 8 微交互闸(v4 §6-5/7/8 编排行)', () => {
  it('--site-motion-standard 进 motion.css 双档 + reduce 归零(§6-5/8 定值曲线)', () => {
    const motion = readFileSync(new URL('./motion.css', import.meta.url), 'utf8');
    expect(motion).toContain('--site-motion-standard: cubic-bezier(0.23, 1, 0.32, 1)');
    // reduce 块不含此 token(它是曲线非时长,归零无意义)——但必须仍在两处被消费
  });

  it('卡 hover §6-7:(hover:hover) 闸内 translateY(-2px) + emphasized 200ms,.reveal 压不住(特异性/次序)', () => {
    const hoverBlocks = globalCss.match(/@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\n\}/g) ?? [];
    const cardHover = hoverBlocks.find((b) => b.includes('.site-card--interactive:is(:hover, :focus-visible)'));
    expect(cardHover, '卡 hover 位移必须包桌面闸(触屏不触发)').toBeDefined();
    expect(cardHover).toMatch(/transform:\s*translateY\(-2px\)/);
    // 后置锁:reveal 终态块(.js .reveal[data-revealed])必须在卡 hover 之前(同 (0,3,0) 后写者胜)
    const revealedIdx = globalCss.search(/\.js \.reveal\[data-revealed='true'\]/);
    const hoverIdx = globalCss.indexOf('.site-card--interactive:is(:hover');
    expect(revealedIdx).toBeGreaterThanOrEqual(0);
    expect(hoverIdx, '卡 hover 块必须后于 reveal 终态块,否则被 transform:none 压死').toBeGreaterThan(revealedIdx);
    // base transition:时长/曲线消费 token(short4=200ms + emphasized)
    expect(globalCss).toMatch(/\.site-card--interactive\s*\{[^}]*transition:[^}]*transform var\(--md-sys-motion-duration-short4\) var\(--md-sys-motion-easing-emphasized\)/);
  });

  it('按钮 press §6-8:scale(0.97) 160ms standard 曲线,禁 scale(0);transition 挂 base(松开回弹跟手)', () => {
    expect(globalCss).toMatch(/\.site-button:active\s*\{\s*transform:\s*scale\(0\.97\)/);
    expect(globalCss).not.toMatch(/scale\(\s*0\s*[,)]/);
    expect(globalCss).toMatch(/\.site-button\s*\{\s*transition:\s*transform 160ms var\(--site-motion-standard\)/);
  });

  it('reduce 停位移/缩放:卡 hover 与钮 press 在 reduce 块内 transform:none(§6 备注)', () => {
    const reduceBlock = globalCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g) ?? [];
    const all = reduceBlock.join('\n');
    expect(all).toMatch(/\.site-card--interactive:is\(:hover, :focus-visible\)/);
    expect(all).toMatch(/\.site-button:active/);
    expect(all).toMatch(/transform:\s*none/);
  });

  it('#5 三视图切换:pane markup 消费 site-card--interactive,scoped transition 并入 transform/box-shadow(防整条替换致瞬跳)', () => {
    const views = read('../components/sections/Views.astro');
    expect(views).toMatch(/class:list=\{\['views__pane', 'site-card--interactive'/);
    expect(views).toMatch(/transition:[^}]*transform var\(--md-sys-motion-duration-short4\)[^}]*box-shadow var\(--md-sys-motion-duration-short4\)/s);
    // 曲线收进 token:样式不得残留 cubic-bezier(0.23 硬编码(注释文字无 cubic-bezier 字样,不假中)
    expect(views).not.toMatch(/cubic-bezier\(0\.23/);
    expect(views).toMatch(/opacity var\(--md-sys-motion-duration-medium2\) var\(--site-motion-standard\)/);
  });

  it('#10 lightbox 编排:scrim 0.2s emphasized 开 + 图 0.3s scale(0.96→1),禁 lb 整层 0.4s 假动效;关对称 0.2s emph-accel', () => {
    const gallery = read('../components/sections/Gallery.astro');
    expect(gallery).toMatch(/animate\(scrim,\s*\{\s*opacity:\s*\[0,\s*1\]\s*\},\s*\{\s*duration:\s*0\.2,\s*ease:\s*\[0\.2, 0, 0, 1\]/);
    expect(gallery).toMatch(/animate\(img,\s*\{\s*opacity:\s*\[0,\s*1\],\s*scale:\s*\[0\.96,\s*1\]\s*\},\s*\{\s*duration:\s*0\.3,\s*ease:\s*\[0\.2, 0, 0, 1\]/);
    expect(gallery).toMatch(/animate\(lb,\s*\{\s*opacity:\s*0\s*\},\s*\{\s*duration:\s*RM\.matches \? 0 :\s*0\.2,\s*ease:\s*\[0\.3, 0, 0\.8, 0\.15\]/);
    expect(gallery).not.toMatch(/duration:\s*RM\.matches \? 0 :\s*0\.4/);
  });
});

describe('Blob.astro 三档定值(spec §2.4,数值定死)', () => {
  it('hue 0/+15/-15° 三档 + stops 角 135/90/200 成对', () => {
    expect(blob).toContain('293.82');
    expect(blob).toContain('308.82');
    expect(blob).toContain('278.82');
    expect(blob).toContain('135deg');
    expect(blob).toContain('90deg');
    expect(blob).toContain('200deg');
  });
  it('data-blob 属性(mechanical 验收锚,spec §6)', () => {
    expect(blob).toContain('data-blob');
  });
});

describe('Footer.astro(v4 §4/§13 R1 再基线)', () => {
  it('surface-container 深档底 + 零 blob(§13 R1:3→1 只留 hero;发丝顶边 = outline-variant)', () => {
    expect(footer).toContain('--md-sys-color-surface-container');
    expect(footer).not.toContain('Blob');
    expect(footer).not.toMatch(/variant=\{2\}|variant=2/);
  });
  it('GPL + QQ 群号 + sponsor 钉死链接(值在 ui.ts / footer 键树,spec §2.5 保留项)', async () => {
    const { zh: zhCopy } = await import('../i18n/zh');
    expect(footer).toContain('{t.license}');
    expect(zhCopy.footer.license).toContain('GPL');
    expect(ui).toContain('1063407652');
    expect(ui).toContain('https://github.com/lingion/sleepy/blob/main/sponsor.md');
    expect(footer).toContain('{qqGroup}');
    expect(footer).toContain('{sponsorUrl}');
  });
});

describe('Task 7 视觉细节闸(v4 §12 代码可闸项)', () => {
  it('.tnum 工具类存在 + Hero ribbon/Schools statLine/Download 版本行 markup class 消费', () => {
    // 定义:global.css 排版工具类区,值逐字 lining-nums tabular-nums
    expect(globalCss).toMatch(/\.tnum\s*\{[^}]*font-variant-numeric:\s*lining-nums tabular-nums/);
    // 消费 = markup class 属性的独立 token 含 tnum(实勘:三组件 scoped 样式早已含
    // tabular-nums 文本,查样式文本 = 假绿;Astro 编译加 :where(.astro-hash) 使 scoped
    // 样式正则脆断 —— 裁决 2:只查 markup)。token 化拆分防 hero__ribbon-num 子串假中
    const hero = read('../components/sections/Hero.astro');
    const schools = read('../components/sections/Schools.astro');
    const download = read('../components/sections/Download.astro');
    const classTokens = (src: string, el: string) =>
      [...src.matchAll(/class="([^"]*)"/g)]
        .map((m) => m[1].split(/\s+/))
        .find((cls) => cls.includes(el));
    expect(classTokens(hero, 'hero__ribbon'), 'Hero .hero__ribbon markup 缺 tnum').toContain('tnum');
    expect(classTokens(schools, 'schools__stat'), 'Schools .schools__stat markup 缺 tnum').toContain('tnum');
    expect(classTokens(download, 'download__version'), 'Download .download__version markup 缺 tnum').toContain('tnum');
  });
  it('.appbar__theme:hover 位移包 @media (hover: hover) 闸(触屏无粘滞 hover 态)', () => {
    // 闸后形态:media 开括号后首个选择器即 .appbar__theme:hover;
    // AppBar.astro 另有一枚 (hover: hover) 块(锚点链),紧接其后必须限定到 theme 才不算假绿
    expect(appBar).toMatch(/@media \(hover: hover\)[^{]*\{\s*\.appbar__theme:hover\s*\{/);
  });
  it('光源正上方:global.css 每条 box-shadow 所有分量 x 恒 0(v4 §5.3)', () => {
    const decls = globalCss.match(/box-shadow:\s*[^;]+;/g) ?? [];
    // 现三处:elevated 按钮 + elevated 卡 + 卡 hover L2(Task 8 抬上同形态);
    // 数量下限 2 = 闸不许被悄悄清空
    expect(decls.length).toBeGreaterThanOrEqual(2);
    for (const d of decls) {
      const value = d.replace(/^box-shadow:\s*/, '');
      for (const layer of value.split(',')) {
        const [x] = layer.trim().split(/\s+/);
        expect(x, `box-shadow x 分量必须 0(光源正上方): ${d}`).toBe('0');
      }
    }
  });
  // 逐块提取(不锚定「第一枚」):多枚 (hover:hover) 块时任一枚含全选择器即为绿
  const hoverBlocks = globalCss.match(/@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\n\}/g) ?? [];

  it('state layer hover 档:(hover:hover) 闸内 currentColor 8% 叠色,禁 @material/web(无 ripple,plan 定案)', () => {
    const layer = hoverBlocks.find((b) => b.includes('.site-button:hover'));
    expect(layer, 'global.css 须有 state layer hover 档,包 @media (hover: hover) and (pointer: fine)').toBeDefined();
    for (const sel of ['.site-button:hover', '.site-chip:hover', '.site-field:hover', '.views__dot:hover', '.appbar__theme:hover', 'a:hover']) {
      expect(layer, `state layer hover 档缺选择器 ${sel}`).toContain(sel);
    }
    // 反馈 = currentColor 混色叠色(禁裸 background 色变:叠色不吞控件既有语义底)
    expect(layer).toContain('background-color: color-mix(in srgb, currentColor 8%, transparent)');
    expect(globalCss).not.toContain('@material/web');
  });
  it('state layer active 档:顶层零缩进(不包 media query,触屏按压接管),currentColor 10%', () => {
    // 不变量=嵌套层级:本文件 @media 内规则一律缩进,故 \n 紧接选择器(零缩进)= 顶层。
    // 若 :active 被挪进 media 块(会带缩进)即红 —— 触屏按压反馈不可被桌面闸吞
    const active = globalCss.match(
      /^\.site-button:active,\s*\.site-chip:active,\s*\.site-field:active,\s*\.views__dot:active,\s*\.appbar__theme:active,\s*a:active\s*\{[^}]*background-color:\s*color-mix\(in srgb, currentColor 10%, transparent\)/m
    );
    expect(active, 'active 档须为顶层六选择器组 + currentColor 10% 混色(禁包 media)').not.toBeNull();
    // 次序:active 档在 hover 档之后(同特异性后置才准按压盖过悬停)
    const layer = hoverBlocks.find((b) => b.includes('.site-button:hover'));
    if (layer) {
      expect(globalCss.indexOf('.site-button:active')).toBeGreaterThan(
        globalCss.indexOf(layer) + layer.length
      );
    }
  });
  it(':focus-visible 全局 2px primary 描边保留(state layer 不吞焦点闸)', () => {
    // 锚定顶层裸 :focus-visible 块(评审 Important-2:旧未锚子串会被
    // .site-field:focus-visible 顶过 = 全局环删了也绿的假绿闸)。
    // m 标志下 ^\s*: 行首(吞缩进)后必须紧跟冒号 → 只有无前缀的
    // :focus-visible 选择器可满足;字段变体行首是「.」,结构上不可能顶替。
    const ring = /^\s*:focus-visible\s*\{/m.exec(globalCss);
    expect(ring, 'global.css 须保留顶层 :focus-visible 全局焦点环(全站不裸删 outline)').not.toBeNull();
    if (ring) {
      const body = globalCss.slice(ring.index + ring[0].length, globalCss.indexOf('}', ring.index));
      expect(body).toMatch(/outline:\s*2px solid var\(--md-sys-color-primary\)/);
      // offset 双条件:全局环 2px,字段变体 -1px —— 块体切片 + offset 不可互替
      expect(body).toMatch(/outline-offset:\s*2px/);
    }
  });
  it('具底 blend 防冲闸:变体/带底链接状态色混入原底,禁通用 transparent 档替底', () => {
    // 评审 carried minor + Important-1:通用 a:hover/a:active (0,1,1) 的
    // transparent 混色会替掉具底控件/带底链接的 scoped/类底 → 按压冲底。
    // 防线 = blend 规则混入各控件原 token 底;删任一 blend 即红。
    expect(globalCss).toMatch(
      /\.site-button--filled:is\(:hover, :active\)\s*\{[^}]*color-mix\(in srgb, currentColor 8%, var\(--md-sys-color-primary\)\)/
    );
    expect(globalCss).toMatch(
      /\.skip-link:is\(:hover, :active\)\s*\{[^}]*color-mix\(in srgb, currentColor 8%, var\(--md-sys-color-secondary-container\)\)/
    );
    expect(globalCss).toMatch(
      /\.skip-link:active\s*\{[^}]*color-mix\(in srgb, currentColor 10%, var\(--md-sys-color-secondary-container\)\)/
    );
    // scoped 侧(Download.astro):行 :active blend 混入行底 token(base 55% / data-rec 78%)
    const downloadSrc = read('../components/sections/Download.astro');
    expect(downloadSrc).toMatch(
      /\.download__row:active\s*\{[^}]*color-mix\(in srgb, currentColor 10%, color-mix\(in srgb, var\(--md-sys-color-surface\) 55%, var\(--md-sys-color-primary-container\)\)\)/
    );
    expect(downloadSrc).toMatch(
      /\.download__row\[data-rec\]:active\s*\{[^}]*color-mix\(in srgb, currentColor 10%, color-mix\(in srgb, var\(--md-sys-color-surface\) 78%/
    );
  });
});
