# Sleepy 官网重构 v4 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) — or, when the partner chose inline execution or no subagent tool exists, its "Fallback: no subagents" section — to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 `docs/superpowers/specs/2026-10-23-sleepy-site-redesign-design.md` 把官网从六段同质重排为八段异构动线,截图换验收资产+无效区预裁,文案全站书面语重写,zh/en 双页同步。

**Architecture:** Astro 7 静态双页(zh `/` + en `/en/`),段组件各自持有样式与岛脚本,产物级 vitest(JSDOM 读 dist)为验收面;构建期 token(gen-tokens/motion.css)禁运行时取色;新增段 = Connect/Reminders/Views,重写 Hero/Gallery/Trust/Download/AppBar/Footer。

**Tech Stack:** Astro、vanilla 岛脚本(IO/scroll)、PIL(资产预处理)、vitest+jsdom、chrome-devtools MCP(视觉目检)。

**Spec:** `docs/superpowers/specs/2026-10-23-sleepy-site-redesign-design.md`(八段/裁决清单/§17 全部以它为准,本计划只补它没有的实施接口)

## Global Constraints

- 每个 commit:作者 `lingion <lingion@hrbeu.edu.cn>`,无 Co-Authored-By,无 Fixes/Closes/Resolves,verify 行只写真实输出;commit 前 `npm run build && npm run test` 全绿(禁止红绿窗口)。
- 禁 push / PR 合入 / 发布 —— 全归用户批准闸门。
- 禁新增运行时依赖;`motion/mini` 只许维持现有 lightbox 用法,禁扩散。
- 色/字/距一律消费 `--md-sys-*`/`--site-*` token;新 token 白名单=spec §11-11:`--site-band-bg:#313033`、`--site-band-fg:#F4EFF4`、`--site-section-gap-small:48px`;禁 extra-large-increased/primary-fixed。
- 文案:zh/en 同 commit 改写(R5);禁问号(半角/全角)、吗、呢、不慌、扫一眼、该出现时出现;slogan「构建无壳,自由自在」逐字保留(R3 豁免);禁红线词 赋能/极致/匠心;禁「通吃/不吭声/说一声/请我喝可乐/Buy me a cola」。
- 348/33 一律从 `schools.grouped.json` 派生(`typeCount` 现算),禁手写。
- reveal 不变量:DOM 序=揭示序;段内 `--reveal-i` 自 0 连续;触发一次即 unobserve。
- 视觉规格值全部取自 spec §5/§6 表格,实施不得改数值。

## Review Focus

- **旧锚点失效**:段 id 从 features→views/connect/reminders 改名,外部(App 内链接/搜索引擎)引用 `#features` 会 404 → Task 5 先 grep sleepy 仓确认引用面,兼容策略在那一步定死。
- **AppBar 钮与首屏 hero 钮同视口双 Filled**:静态「Filled 总数=2」会误报也漏报 → Task 6 用 IO 互隐(`data-appbar-cta`)钉死不变量。
- **裁图只裁无效区**:裁错带(切进内容)= 主体信息丢失且肉眼难全查 → Task 1 方差普查报告+逐张目检为验收门槛,产物断言尺寸。
- **无 JS/键盘/reduced-motion 三态**:FOUC 与 .js 门控被重构破坏 → Task 3/5/15 各有产物级断言与键盘走查步骤。
- **en 槽位溢出**:en 比 zh 长 1.3-1.6× → Task 14 双语 375px 截图目检。
- **深底带混排深浅截图**:M6 带恒暗但 Shot 默认主题翻转 → Task 10 带内强制 light 变体并断言。

---

## Task 0: 分支与基线确认

**Files:** 无(纯 git/命令)

- [ ] **Step 1:** `git -C ~/sleepy-site checkout -b feat/site-redesign-v4`
- [ ] **Step 2:** `npm run build && npm run test` → 期望:148+ 全绿(现状基线,输出记入后续 commit 对照)

## Task 1: 资产预处理(widget 新图入站 + 手机图预裁 + 尺寸闸)

**Files:**
- Create: `scripts/prep-shots.py`、`tests/assets.test.ts`、`src/assets/screenshots/*-raw.png`(6 份备份)
- Modify: `src/assets/screenshots/widget-*.png`(10 张覆盖)、`src/assets/screenshots/{01-week,20-import,22-reminder}-{light,dark}.png`(6 张裁切)

**Interfaces:**
- Produces: 裁后资产尺寸常量表 `PHOTO_CROP = { width:1080, height:1988 }`、`WIDGET_SIZES = {'weekgrid':[825,1375],'today':[825,343],'twodays':[825,343],'weeklist':[825,343],'weekview':[825,550]}`,供后续任务引用。

- [ ] **Step 1: 写失败测试 `tests/assets.test.ts`**(纯 node 读 PNG IHDR,无新依赖)

```ts
import { readFileSync } from 'node:fs';
const size = (p: string) => { const b = readFileSync(p); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
// 断言:widget-weekgrid-light/dark = [825,1375]; today/twodays/weeklist = [825,343]; weekview = [825,550]
// 断言:01-week/20-import/22-reminder light+dark = [1080,1988]; 对应 *-raw.png 存在且 = [1080,2340]
```

- [ ] **Step 2:** `npx vitest run tests/assets.test.ts` → FAIL(尺寸不符/文件缺失)
- [ ] **Step 3: 拷 widget 10 张**:`cp /tmp/widget-shots-2026-10-22/widget-*.png src/assets/screenshots/`(twoday→twodays 改名对齐站方命名)
- [ ] **Step 4: 备份+裁切脚本** `scripts/prep-shots.py`:对 6 张手机图先 `cp x.png x-raw.png`(raw 缺失才 cp),再 `im.crop((0,112,1080,2100))` 覆盖原路径;顶部带=状态栏(实测 y0-112 方差 11,112 起首行为空带 std 0.0),底部带=导航键(y2080-2100 内容方差 32.6 必保留,2100+ 裁除)。
- [ ] **Step 5: 目检门:** 生成三图 light+dark 的 25% 缩略拼图到 /tmp/site-crop-check/,Read 目检:顶部无状态栏图标残留、底部内容(导入支持格式列表/提醒摘要设置)完整。不合格→逐张调 y 参数重跑,禁盲批。
- [ ] **Step 6:** `npx vitest run tests/assets.test.ts && npm run build && npm run test` → 全绿
- [ ] **Step 7: Commit** `chore(assets): widget 新拍 10 图入站 + 手机三图无效区预裁(带 raw 备份)` verify 行带实测尺寸与测试数。

## Task 2: 全局 token 与 global.css 契约更新

**Files:**
- Modify: `src/styles/global.css`(:root 变量区、reveal 区、新增规则)
- Modify: `src/tokens/global.a11y.test.ts`(增契约,改 blob 期望留待 Task 12)
- Modify: `src/components/sections/Features.astro`(若 grep 命中硬编码 transition-duration → 引 motion token)

**Interfaces:**
- Produces: `--site-band-bg/-fg`、`--site-section-gap-small: 48px`、`section[id]{scroll-margin-top:80px}`、`.appbar__cta[data-appbar-cta='hide']{display:none}`、`@media (hover:hover) and (pointer:fine)` 包裹的卡 hover 基类(若现有 hover 未闸)。

- [ ] **Step 1:** 在 global.a11y.test.ts 增失败断言:band 两变量、gap-small 48px、scroll-margin-top 存在、`prefers-reduced-motion` 规则含 `transition: opacity 200ms`(替代旧 0ms 直出,§6-12)
- [ ] **Step 2:** `npx vitest run src/tokens/global.a11y.test.ts` → FAIL
- [ ] **Step 3:** global.css 落地上述值:reveal 的 reduce 分支改 `transition: opacity 200ms ease; transform: none; opacity 由 data-revealed 控制`;段距 ≤600px 媒体档 `--site-section-gap: var(--site-section-gap-small)`;dark 节奏补丁 `:global([data-theme='dark']) .site-band{}` 发丝顶边规则(选择器随 Task 10 的 class 名对齐,先按 `#gallery` 落)。
- [ ] **Step 4:** `grep -n "transition-duration:\s*0s\|[0-9]\+ms" src/components/sections/Features.astro` → 命中即改 `var(--md-sys-motion-duration-*)`
- [ ] **Step 5:** 全绿(band 变量在 Task 10 前有唯一消费点即可;不得留无主变量——若 Step 3 变量暂无消费者,并入 Task 10 提交,本 Task 只落 gap/scroll-margin/reveal)
- [ ] **Step 6:** `npm run build && npm run test` 全绿 → Commit `feat(tokens): 段距三档+锚点偏移+reduced-motion 升档 200ms`

## Task 3: LCP 链路(Shot priority + preload)

**Files:**
- Modify: `src/components/Shot.astro`(新 prop `priority?: boolean`)
- Modify: `src/layouts/Base.astro`(`<link rel=preload>` 仅 zh/en hero 图;Astro Image 的 `image.metadata.src`)
- Modify: `tests/page.index.test.ts`(增断言段)

**Interfaces:**
- Produces: `Shot` props 新签名 `{light,dark,alt,widths?,sizes?,loading?,class?,priority?}`;priority=true → light img `fetchpriority="high" loading="eager"`,dark img `fetchpriority="low" loading="lazy"`。缺省行为不变(两版沿用 loading)。

- [ ] **Step 1:** 测试先行:dist HTML 断言 `doc.querySelectorAll('img[fetchpriority="high"]').length === 1`(当前 0 → FAIL)
- [ ] **Step 2:** Shot 实现 priority 分支;Base head 注入 hero 最优档 preload(imagesrcset)
- [ ] **Step 3:** `npm run build && npm run test` 全绿 → Commit `fix(lcp): Shot priority 入参 + hero 图 preload,隐藏版降载`

## Task 4: i18n 键树重写(spec §7 全量文案)

**Files:**
- Modify: `src/i18n/zh.ts`、`src/i18n/en.ts`(整文件重写)

**Interfaces:**
- Produces: 新键树(双文件同形,i18n-parity 闸保证):
  - `hero`: slogan(逐字保留「构建无壳,自由自在」/ en 现值保留)、sub、ctaDownload、ctaTrial、deviceCaption(改为周视图 caption)、ribbon:{schools:"348 条教务直连",license:"GPL-3.0 开源",privacy:"数据留存本机"}
  - `views`(替换 features 键):heading、panes{week,grid,today}、peek、groupLabel、captionSuffix(三视图总览一面板一主张,3 条)
  - `connect`:heading、body(直连因果一条)、chipLabel(「348 校直连」)
  - `schools`:保留现键,heading→「收录与检索」、sub→书面语(删「搜一下,你的学校在不在」),statLine 保留函数式
  - `reminders`:heading、beats[3]{title,body}(课前提醒/今日摘要/明日预告)、widgets:{heading,gridLabel,listLabel,todayLabel,twodaysLabel}
  - `gallery`:heading→「全部为真机截图」、sub、captions(数量随 Task 10 定)、close/prev/next/imageOf 保留
  - `trust`:heading、story(正面陈述,删「没有广告,没有追踪」排比)、privacyHeading/Body(改「课表数据仅存于本机,不经任何服务器」)、licenseHeading/Body、communityHeading、reachOut(删「群里 @ 我也行」口语→书面)、sponsorLink/qqGroupLabel 保留
  - `download`:heading、versionLine、universalNote(书面化)、recommended、abiNotes、minSdk、shaLink、storeReserved、deviceCaption、trial(→「在线体验提供完整功能,无需安装。」)
  - 新增 `appbar:{anchors:{views:'功能',connect:'教务',schools:'学校',reminders:'组件',trust:'信任'},ctaDownload}`(AppBar 锚点+常驻钮用)

- [ ] **Step 1:** 按 spec §7 R1-R5 重写 zh.ts 全部叶子;对照表逐条过(§7 四组例必须逐字落位)
- [ ] **Step 2:** en.ts 全键同步镜像(en 串按槽位最长值自查)
- [ ] **Step 3:** `npx vitest run tests/i18n-parity.test.ts` → 键树同形 PASS
- [ ] **Step 4:** `grep -nP '[?？]|吗|呢|不慌|扫一眼|该出现时出现' src/i18n/zh.ts src/i18n/en.ts | grep -v "构建无壳"` → 期望:零命中(slogan 无问号,不在豁免 grep 也行——grep 结果若有命中逐一清零;en 的「For evening classes.」句读合规)
- [ ] **Step 5:** commit 挂起至 Task 5(文案与段组件同 commit,防红绿窗口)——**本任务不单独 commit**

## Task 5: 页面建筑重排(新段组件 ×8 + 两页重写)

**Files:**
- Create: `src/components/sections/Views.astro`(M2)、`Connect.astro`(M3)、`Reminders.astro`(M5)
- Modify: `Hero.astro`(M1 重写)、`Schools.astro`(M4:statLine 键换+岛样式+≤840 取消嵌套滚动)、`Gallery.astro`(M6 band)、`Trust.astro`(M7 1主2次)、`Download.astro`(M8 tonal 带)、`AppBar.astro`(锚点+常驻钮)、`src/pages/index.astro`、`src/pages/en/index.astro`、`src/components/sections/Features.astro`(**删除**,内容分流到 Views/Connect/Reminders)
- Modify: `tests/page.index.test.ts`、`tests/page.en.test.ts`(整段重写为新契约)

**Interfaces:**
- Produces: 段 id 与 data-prototype 契约(测试与新段共读):
  `#hero[split] → #views[showcase] → #connect[edit-split] → #schools[tool-island] → #reminders[pinned] → #gallery[full-bleed-band] → #trust[narration] → #download[tonal-band]`
- Views 迁移 Features 的 `data-views` 状态机+`.views__peek`+radiogroup 脚本,选择器改全局 `[data-views]`;Reminders 复用同一 `[data-views]` 契约不重造轮子(仅 reminder 主图非切换器)。
- AppBar:`appbar:{anchors…}` 4 枚 `site-chip` Text 锚点 + 下载钮 `site-button--filled` `data-appbar-cta`。
- 手机 hero(R2):`#hero` DOM 序 = copy → ribbon → **Shot(01-week 完整图)最后**,≤840px 自然落首屏之下;≥841px grid 55/45 图在右=首屏第一张。

- [ ] **Step 1:** 重写 `tests/page.index.test.ts` 新契约(先红):

```ts
// 八段依序 + data-prototype
const ids = ['hero','views','connect','schools','reminders','gallery','trust','download'];
main.querySelectorAll(':scope > section') → 依序 id 匹配且各带 data-prototype 值(上表)
// blob=1: [data-blob] 长度 1 且 data-blob="0" 在 #hero(原 3 处契约废)
// C1 不变量: [...doc.querySelectorAll('#hero img')][0] 不是第一——取全文档 img 文档序第一个 src 含 '01-week'
// ribbon: #hero 文本含 '348' 且含 'GPL-3.0'
// AppBar: #appbar a[href="#views"] 等 4 锚点存在;#appbar [data-appbar-cta] 存在
// 文案: 新 pin 句(§7 对照表改后句)逐句 contain; 旧 pin 6 句全 not.toContain; 问号正则 body textContent 零命中
// slogan: 含 '构建无壳,自由自在'(保留)
// 348/33: statLine 口径改 '348 条收录 · 33 协议'(从派生值断言,与 schools.length/typeCount 联动)
// gallery: 图数 = 新 captions 长度(=8,weekview 入廊);每 figure .shot__light+.shot__dark
// 下载: #download Elevated 档 class 'site-button--elevated' 存在且 primary-container 带 class 'download--tonal'
// h1 唯一 = slogan; img alt 全非 null(保留)
```

- [ ] **Step 2:** `npx vitest run tests/` → 新契约 FAIL,旧文案 pin 也红(预期:此步只确认测试可运行且精确命中上述断言名)
- [ ] **Step 3:** 实现 Hero(M1):display-large 400 字重 spec §5.1 值、55/45、01-week Shot(priority)、ribbon 不对称(348 display-small tabular 领头)、CTA Filled XL+Text、删除 hero__device 的 `max-block-size:560px object-fit:cover` 段(C3:完整显示,aspect-ratio 容器=1080/1988)
- [ ] **Step 4:** 实现 Views(M2):band container-low、面板行 grid `2.1fr 1fr 1fr` 桌面(网格面板最宽;用户定调),面板=filled 卡 container-lowest、标题 26px=t 系(用 t-headline-small 24 或 t-title-large 22——取 title-large,§5.1 卡题),切换器从 Features 整体迁入(脚本选择器 `document.querySelectorAll('[data-views]')`)、reveal 0..2
- [ ] **Step 5:** 实现 Connect(M3):split 文左图右、20-import 裁后图 contain+chip「348 校直连」、遮罩块显影 `<span class="connect__mask" aria-hidden>`(DOM 绝对定位同底色,`[data-revealed]` IO 驱动 translateY(100%→0) 600ms cubic-bezier(0.77,0,0.175,1);reduce 下 transform:none 直接可见)、reveal
- [ ] **Step 6:** 实现 Schools(M4):岛卡 `--md-sys-shape-corner-xl`、outlined field+双排 chip(保留)、`@media (max-width:840px){ .schools__list{max-block-size:none;overflow-y:visible} }`(取消嵌套滚动)、statLine 键已在 Task 4
- [ ] **Step 7:** 实现 Reminders(M5):桌面 grid `220px 1fr`——左列 `.reminders__strip`(压缩叙事条:reminder 缩略+一行,`position:sticky;top:80px;max-block-size:40vh`),右列=22-reminder 完整图+三 beat+组件墙;组件墙=weekgrid 竖卡(唯一 `site-card--elevated`)+today/twodays/weeklist 扁条叠放(全部自然比例 contain,零裁拉,§5.4);≤840px 取消 sticky+墙转横向 snap 滚动(`scroll-snap-type:x mandatory`,竖卡 max-block-size 280px)
- [ ] **Step 8:** Gallery(M6)改恒暗 band:class `band` `background:var(--site-band-bg);color:var(--site-band-fg)`,内部 Shot 强制 light 版(新增 prop `forceVariant?: 'light'`,band 内全 light——深底浅 UI 恒成立);filmstrip `display:flex;overflow-x:auto;scroll-snap`+错落=margin-top 交替 ±16px(叠压仅限装饰层:叠压由背景 ghost 层做,可点 figure 零遮挡,§4 M6);收编 weekview 入廊(captions 8→含组件共 9);lightbox 岛保留
- [ ] **Step 9:** Trust(M7):单栏叙事+隐私主卡(filled 宽)+GPL/社区行式列表;Download(M8):primary-container 带+`site-button--elevated`(global.css 新增该类:primary-container 底上 surface 底+elevation-1 影,on-surface 字)+ABI 行保留+右侧 02-grid 完整图;Footer:删 Blob variant=2(改 surface-container 深档底)、AppBar 加锚点+`data-appbar-cta` 钮(互隐逻辑 `#hero` IO:hero 在视口→hide)
- [ ] **Step 10:** `index.astro`/`en/index.astro` 重写段序 import;删 Features.astro
- [ ] **Step 11:** `npm run build && npm run test` → 全绿(含 Task 4 文案、i18n-parity、en 镜像新契约)
- [ ] **Step 12: 目检门:** dev 站起 `npm run dev`,chrome-devtools 在 1440/840/375 × light/dark 六剖面截 #hero/#views/#connect/#reminders/#gallery/#download:检查 C1 首图、裁后图完整、band 恒暗、组件墙比例、en 溢出。不合格回改,不 commit
- [ ] **Step 13: Commit(大,登记型可放宽 600 行闸):** `feat(site): 八段异构动线重排(Trust 前置/Download 居末/换幕恒暗带/组件墙新比例)` + Task 4 文案文件同 commit。body=根因段(同质板→原型轮换)+逐段一行;verify 行=build/test 真实数+六剖面目检通过

## Task 6: CTA 互隐实现(Review Focus #2)

**Files:**
- Modify: `src/components/AppBar.astro`(脚本 +15 行)、`tests/page.index.test.ts`(+断言)

- [ ] **Step 1:** 测试先红:`#appbar [data-appbar-cta]` 属性默认值断言 `data-appbar-cta="show"` + 存在 `#hero` IO 脚本引用 `appbar-cta`(grep 源码)
- [ ] **Step 2:** AppBar 脚本:`new IntersectionObserver(([e]) => cta.dataset.appbarCta = e.isIntersecting ? 'hide' : 'show').observe(document.getElementById('hero'))`
- [ ] **Step 3:** 全绿 → `feat(appbar): hero 在视口内常驻下载钮自动隐藏,任意视口 Filled≤1` 独立 commit

## Task 7: 视觉细节批(§12 清单中代码可闸项)

**Files:**
- Modify: `src/styles/global.css`、`src/tokens/global.a11y.test.ts`

- [ ] **Step 1:** 增契约断言(先红):`tabular-nums` 工具类存在 + Hero ribbon/schools statLine/download version 行源码含它;`(hover: hover)` 包裹 hover 位移;`box-shadow` 值 x 分量恒 0;`:focus-visible` 保留
- [ ] **Step 2:** 落地:`.tnum{font-variant-numeric:lining-nums tabular-nums}`,逐组件消费;hover 闸;统一阴影常量
- [ ] **Step 3:** 全绿 → commit `feat(tokens): tabular-nums/hover 闸/光源统一 三项细节闸`

## Task 8: 动效编排落地(spec §6 表逐行,与段组件同树)

**Files:**
- Modify: `src/components/sections/Hero.astro`(hero 一次性编排 animation)、`src/styles/global.css`(keyframes+duration 消费)、`src/components/sections/Reminders.astro`/其余段 reveal 复核

- [ ] **Step 1:** global.css 增 `@keyframes rise{from{opacity:0;transform:translateY(24px)}}` + `.hero__anim{animation:rise 500ms cubic-bezier(0.05,0.7,0.1,1) both}`;标题 delay 0/副标 100/CTA+ribbon 200;blob opacity 入场并入同编排;reduce 下 `.hero__anim{animation:fade 200ms ease}`(纯 opacity)
- [ ] **Step 2:** 断言(global.a11y.test.ts):`rise` keyframes 存在;`.hero__anim` 不含 JS 驱动;全站源码 grep `@keyframes` 仅 rise+fade 两个循环动画零(Review Focus:禁循环)
- [ ] **Step 3:** 复核 13 行编排表逐项:切换器 300ms token 化、press scale(0.97) 160ms、卡 hover translateY(-2px) 200ms、lightbox 曲线不变(现 motion/mini 已是 300/200 → 核对即可)
- [ ] **Step 4:** 全绿 → commit `feat(motion): hero 一次性编排 + 微交互三件套闸`

## Task 9: reduced-motion 键盘走查 + JS-off 三态验证

**Files:** 无新文件;`docs/superpowers/plans/evidence/2026-10-23-a11y-walkthrough.md`(Create,记录走查证据)

- [ ] **Step 1:** `npm run dev` + devtools 开 emulate prefers-reduced-motion:截图 hero(应 opacity 200ms 直现)、reveal 段(应 200ms 淡入非跳变)、切换器(位移归零仍可用)
- [ ] **Step 2:** 键盘-only:Tab 全页走一遍:锚点可聚焦、views radiogroup 方向键、chip aria-pressed、lightbox Esc/←→;无裸删 outline(断言已在 a11y 闸)
- [ ] **Step 3:** JS-off(`chrome-devtools` 关 JS):hero 可见、schools 348 行全列、reveal 元素 opacity 1(.js 门控)
- [ ] **Step 4:** 证据文档落 commit 前检查点;发现问题回 Task 5/8 修
- [ ] **Step 5:** 无代码改则不 commit(证据文件随 Task 12 总 commit)

## Task 10: 双主题节奏剖面图(spec §17.1 交付物)

**Files:** Create `docs/superpowers/plans/evidence/dual-theme-rhythm.md`(含 1440 light/dark 两张整页长截图引用路径)

- [ ] **Step 1:** dev 站 × data-theme light/dark,`take_screenshot fullPage`;核对 dark 下:发丝线段界可见、M6 带仍恒暗、M8 primary-container 对比(on-primary-container)
- [ ] **Step 2:** 不合格回 Task 2/5;合格则图入 evidence/(gitignore 排除 png 大文件则仅存路径+结论,遵仓库现状)
- [ ] **Step 3:** 随 Task 12 commit

## Task 11: 旧 spec 废弃标注

**Files:**
- Modify: `docs/superpowers/specs/2026-10-18-sleepy-site-design.md`(头部加一行 superseded 指向 v4)

- [ ] **Step 1:** 加 `> ⚠️ 2026-10-23 被 docs/superpowers/specs/2026-10-23-sleepy-site-redesign-design.md 取代(结构/裁切/reduced-motion 三节废弃)` 
- [ ] **Step 2:** 随 Task 12 commit

## Task 12: 总验收 + 推送闸门汇报

**Files:** Modify: 无(汇总)

- [ ] **Step 1:** `npm run build && npm run test` 全量绿;`npx vitest run` 输出测试总数记入汇报
- [ ] **Step 2:** 用户六条硬约束逐条 diff(铁律④):C1 dist 首个 img=01-week✓;C2 正则闸✓;C3 两图 contain 无 cover✓;C4 资产=验收尺寸✓;C5 token 消费无新硬编码色值(grep `#[0-9a-fA-F]{6}` 于新代码段,对照白名单)✓;C6 三档断言✓
- [ ] **Step 3:** spec §12 清单 23 项逐条打勾表(证据引用测试名/截图路径)
- [ ] **Step 4:** commit 全部收口后向用户汇报:分支 feat/site-redesign-v4 全量 commit 列表 + 「push/PR 等你批」——**禁止自行 push**

---

## Self-Review(计划完成后自查记录)

1. **Spec 覆盖**:§4 八段→T5;§5.1-5.4→T2/T5/T7;§6 编排表→T8/T2(reveal)+T5(遮罩块);§7→T4;§8 资产→T1;§9 响应式→T5 各 Step 内联;§12 清单→T7+T12;§14 测试再基线→T5 Step 1;§17.1 dark ladder→T2+T10;§17.2 reveal-i→T5 契约;§17.3 CTA 互隐→T6;§17.7 预处理→T1。**无遗漏。**
2. **外部锚点**:已 grep sleepy 仓 app 资源 = 无 `#features` 引用(仅站方自己),故不改写重定向,Review Focus #1 结案为「无外部引用,改名安全」。
3. **Step 粒度**:T5 Step 3-9 各为「一个组件」粒度,已偏大但保持组件边界;执行者按 Interfaces 契约落 DOM,测试先于实现(T5 Step 1)。
4. **类型一致**:Shot.forceVariant(Task 5 用)需补进 Task 3 的 Shot props?——修正:Task 3 Shot 新增 prop 清单以 T5 用到的为准:`priority`(T3)+`forceVariant`(T5);T3 只实现 priority,T5 改 Shot 加 forceVariant 并同步 T3 的断言不回归。
5. **比例**:计划 ≈ spec 的 70%,任务 13 个,粒度合适。
