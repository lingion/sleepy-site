# Sleepy 官网 v5 四页架构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) — or, when the partner chose inline execution or no subagent tool exists, its "Fallback: no subagents" section — to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 v4 单页官网拆为主页/学校查找/下载中心/FAQ 四页(zh+en 共 8 路由),补齐 OG 分享图、hreflang 多页、robots、RSS、JSON-LD、自定义 404 分发基建,并修掉组件墙缺卡、chip 形态、手机台账三个既有缺口。

**Architecture:** Astro 静态输出,页面 = `src/pages/` 路由文件,文案 = i18n 键树(zh/en 同形),数据 = `src/data/` 构建快照;每页消费统一 Base 布局(hreflang/OG/preload 参数化);交互仍是无框架原生岛(URL 态 + details 折叠 + content-visibility);FAQ 内容由主仓 FAQ.md 经快照管线进 faq.json。

**Tech Stack:** Astro 7.4 + @astrojs/cloudflare + @astrojs/sitemap 3.7.4;新增依赖唯一 = @astrojs/rss(npm 4.0.19,dependencies);vitest 5 + jsdom 30 产物级断言;OG 图 = 本机 Google Chrome headless 离线渲染,零图像运行时依赖。

**Spec:** `docs/superpowers/specs/2026-10-24-site-four-page-design.md`(v5 设计文档,已含终审 F1-F3/I1-I8 修订与 §10 测试再基线清单;实现者必须先通读)

## Global Constraints

- 派生数字禁手写:348/33/29 一律从 `src/lib/schools-view.ts` 的 `rowCount/typeCount/provinceCount` 取值(v4 计数闸同规则)。
- 文案零设问 + 红线词(i18n-leak-check FORBIDDEN 清单)适用于 i18n 键树与页面自有文案;**/faq/ 页问句标题豁免**(FAQ.md 34 问全带「？」为主仓真值,spec §4 范围条款)。
- CTA 纪律 §11-6 多页化:任意视口 Filled ≤1;AppBar [下载]S 钮在非主页各页恒隐(visibility:hidden 保占位);工具页主按钮 = Elevated,彩色容器上禁 Filled 叠 tonal。
- 每个交互 hover 效果必须包 `@media (hover: hover) and (pointer: fine)`;动效必须给 `prefers-reduced-motion: reduce` 降档;焦点环 `:focus-visible` 全局保留。
- /schools/ 岛 JS ≤6KB(含 URL 态);无 JS 时四页内容全可读(details 原生可开、348 行在 HTML、FAQ 全展开直排)。
- 测试与实现同 commit,先红后绿(spec §10 再基线纪律:每条作废断言必须有去向,禁无去向删除)。
- 基线 207 条测试:未列入 §10 清单的既有断言零回归。
- commit 作者 `lingion <lingion@hrbeu.edu.cn>`,禁 Co-Authored-By 尾注,禁 Fixes:/Closes:/Resolves: #N(关联只写 `ref #N`);subject 形如 `feat(scope): 中文一句话`。
- 分支上开发,禁直接提交 main;push 与部署动作按 pr-lifecycle/release-sop 闸门(本地 commit 自主)。
- 文档与 commit 文案用朴素完整人类语言,禁表情符号与符号简写。

## Review Focus

规格没写、但真人用到才会暴露的失效类,每条在归属任务里有钉死测试:

1. **跨页锚点死链**:在 /faq/ 点 AppBar「功能」若 href 是裸 `#views` 会解析成 /faq/#views 零跳转 → Task 2 断言非主页上锚点项 href 以 `/#` 开头。
2. **EN 泄漏闸被新键击穿**:新锚点 label 裸「学校」会作 zh.ts 汉字叶子在 EN 页被 10 个含「学校」的真实校名子串命中 → Task 1 的泄漏闸检查随键树自动覆盖,计划写死四字形式。
3. **URL 深链首屏失配**:直接打开 /schools/?p=GD&q=东软 时 JS 前 HTML 显示全量、JS 后若不读 URL 则态归零(分享链接点开=没过滤)→ Task 4 `applyInitialState(doc, search)` 纯函数 + page.schools.test.ts 对 dist 整页 Document 灌深链串断言「可见行恰 1 = 广东东软学院」(终审 I9:真断言,非文字承诺)。
4. **OG 爬虫相对路径**:og:image 若写 `/og/home-zh.png`,多数爬虫不解析相对 URL,分享态依旧无图 → Task 8 断言 head 里 og:image 值为 `https://` 前缀绝对 URL。
5. **FAQ 快照静默腐烂**:主仓 FAQ.md 改了、站没重跑 data,/faq/ 显示旧答案 → Task 6 页脚「更新于」直读 faq.json 内声明日期 + build-faq 条数闸,目检可发现(spec R4)。
6. **details 折叠与过滤互踩**:省份 chip 过滤后,折叠态的组 hidden 判定若只看组本身会露出空壳 summary → Task 4 断言 JS-off 全展开可读、JS-on 过滤后无可见空组。

---

## 文件结构(决策定死)

```
新建:
  src/pages/schools.astro          /schools/ 路由(zh;Astro 默认 directory 格式 → dist/client/schools/index.html)
  src/pages/en/schools.astro       en 镜像(同构薄壳,注入 copy=en)
  src/pages/download.astro         /download/ 路由
  src/pages/en/download.astro
  src/pages/faq.astro              /faq/ 路由
  src/pages/en/faq.astro
  src/pages/404.astro              自定义 404(双语并列,单文件)
  src/pages/rss.xml.js             版本动态 feed 单路由
  src/components/sections/SchoolsCard.astro   主页入口卡(非岛,静态)
  src/components/pages/SchoolsTool.astro      /schools/ 工具主体(列表+岛脚本;zh/en 共用,props 注入文案)
  src/components/pages/DownloadPanel.astro    /download/ 出口主体(props 注入文案)
  src/components/pages/FaqBody.astro          FAQ 正文渲染器(消费 faq.json)
  scripts/fetch-faq.mjs            在线拉主仓 FAQ.md → 回写 fixtures/FAQ.md 快照(fetch-schools.mjs 同法,手动刷新用)
  scripts/build-faq.mjs            离线解析器:fixtures/FAQ.md + scripts/faq-en.md → src/data/faq.json(条数闸)
  scripts/faq-en.md                en 译文(与 FAQ.md 同节同问数,人工维护,仓内唯一真值)
  fixtures/FAQ.md                  FAQ.md 仓内快照(种子=主仓现值提交;离线构建唯一读取源)
  src/data/faq.json                构建产物(节/问/答 zh+en,入库)
  public/robots.txt                静态分发文件
  public/og/{home,schools,download,faq}-{zh,en}.png   8 枚 OG 图(作者工具产出)
  tools/make-og.mjs                OG 图离线渲染脚本(Chrome headless,非构建路径)
  tests/page.schools.test.ts       /schools/ 产物闸
  tests/page.download.test.ts      /download/ 产物闸
  tests/page.faq.test.ts           /faq/ 产物闸
  tests/page.404.test.ts           404 产物闸
  tests/dist.seo.test.ts           hreflang 矩阵+OG+JSON-LD+robots/RSS+preload 开关
  src/lib/schools-island.ts        三态过滤+URL 态(从 Schools.astro 抽出,新岛消费)

修改:
  src/i18n/zh.ts / en.ts           新键四组 schoolsPage/downloadPage/faqPage/homeSchoolCard + appbar.anchors 改造
  src/i18n/ui.ts                   faqUrl 语义变更(站内 /faq/ 优先,外链迁 downloadPage)
  src/layouts/Base.astro           mirror 语义对 + og props + preloadHero 开关 + RSS link
  src/components/AppBar.astro      锚点绝对化 + CTA 非主页恒隐 + 下载钮改链
  src/components/Footer.astro      六链瘦身为 下载/学校/问答/仓库/语言/build
  src/pages/index.astro            段序重排(删 Schools,插 SchoolsCard,Download 换出口段)
  src/pages/en/index.astro         同构重排
  src/components/sections/Download.astro   主页 Download 段原地瘦身 = 单出口段(Task 7);/download/ 面板 = 新建 DownloadPanel(Task 5),ABI 行样式自旧段迁移复制,两文件互不依赖(终审 I11 定死,禁 or 选项)
  src/components/sections/Reminders.astro  墙补第 5 卡(weekview)
  src/styles/global.css            .site-chip 升档 + color-scheme + .entry-card + content-visibility
  astro.config.mjs                 sitemap i18n 配置
  package.json                     依赖 @astrojs/rss;data 脚本链追加 build-faq(assert-release 已废除,见 Task 5 裁决)
  tests/page.index.test.ts         §10 再基线逐条处置
  tests/page.en.test.ts            §10 同批处置
```

---

## Task 1: i18n 键树四组新键 + AppBar 锚点新值(先红:键树闸)

**Files:**
- Modify: `src/i18n/zh.ts`(appbar.anchors 改值 + 新增 4 组)、`src/i18n/en.ts`(同形)
- Test: `tests/i18n-parity.test.ts`(既有闸自动覆盖新键)、`tools/i18n-leak-check.mjs`(既有,跑一遍)

**Interfaces:**
- Consumes: 无(纯数据层)
- Produces:
  - `zh.appbar.anchors` = 五键同存:`{ views: '功能', schools: '学校名录', faq: '常见问答', reminders: '组件', trust: '信任' }`——**只加 `faq` 键**(schools 现值本就是「学校名录」不动);`trust` 键本任务**不删**(AppBar.astro:21 还在引用,删除放 Task 2 与引用改造同 commit,防编译窗口)。label 四字防泄漏,F3。
  - `zh.homeSchoolCard = { count: string /* '{rows} 所高校 · {types} 种教务协议,输入校名即可确认收录。' 模板,占位 {rows}/{types} */, cta: '查找我的学校' }`
  - `zh.schoolsPage = { heading: '收录与检索', sub: '名录按省份与教务协议分组,支持校名或拼音检索。', searchLabel, provinceLabel, typeLabel, expandAll: '展开全部', collapseAll: '收起全部', countShown: string /* '显示 {shown} / {total}' */, emptyTitle: '未收录的学校可在 GitHub 提交适配申请', emptyCta: '提交适配 →', footUpdated: '名录更新于', footNote: '名录随适配更新', provinceAria, typeAria }`
  - `zh.downloadPage = { heading: '下载 Sleepy', versionLine: string /* 'tag · minSdk · 日期' 模板 */, recommended: '推荐', universalNote: '不确定手机架构时选择 universal。', otherArchLink: '其他架构与校验 →', verifyTitle: '核对下载文件', verifyNote, installTitle: '安装步骤', installSteps: [3 条正面陈述], archTitle: '如何确认手机架构', archNote, trialTitle, moreTitle: '更多', moreLinks: { releases: '全部历史版本', repo: '源码仓库', sponsor: '赞助项目', issues: '反馈问题' }, storeReserved }`
  - `zh.faqPage = { heading: '常见问答', sub: '以下回答只覆盖当前发布物能核实的事实。', updatedPrefix: '内容更新于', tocLabel: '目录', tailTitle: '以上未覆盖的问题可在 GitHub Issues 反馈', tailIssues: 'GitHub Issues', tailDiscussions: 'Discussions', tailQq: string /* 含群号 */ }`
  - en.ts 全部同形镜像(结构类型 `as const` 派生,parity 闸锁同形)。

- [ ] **Step 1: 写失败的键树断言测试**

在 `tests/i18n-parity.test.ts` 追加用例:

```ts
it('v5 四组新键 zh/en 同形', () => {
  for (const g of ['homeSchoolCard', 'schoolsPage', 'downloadPage', 'faqPage'] as const) {
    expect(zh[g]).toBeDefined();
    expect(Object.keys(zh[g]).sort()).toEqual(Object.keys(en[g]).sort());
  }
  expect(zh.appbar.anchors.schools).toBe('学校名录');
  expect(zh.appbar.anchors.faq).toBe('常见问答');
});
```

Run: `npx vitest run tests/i18n-parity.test.ts` → Expected: FAIL(`zh.homeSchoolCard is undefined`)

- [ ] **Step 2: 落键(zh.ts + en.ts 四组 + appbar.anchors 改值)**

文案逐字取自 spec §4;占位模板键(count/versionLine/countShown 类)统一 `{rows} {types} {shown} {total} {tag} {minSdk} {date}` 命名,渲染端负责替换。禁在任何字符串写死 348/33。

- [ ] **Step 3: 跑 parity 闸 + 泄漏预检**

Run: `npx vitest run tests/i18n-parity.test.ts && node tools/i18n-leak-check.mjs src/i18n/zh.ts src/i18n/en.ts`
Expected: 双绿(泄漏闸 FORBIDDEN 扫新键——「查找我的学校」无问号、「学校名录」四字形态安全;FAQ 页键无问句,豁免条只影响 /faq/ body,不触键树。注:leak-check 少于两个路径参数即打印用法 exit 2——终审 I7 补全实参,CI 不跑此闸,手动跑即计划此条)

- [ ] **Step 4: Commit**

```bash
git add src/i18n/zh.ts src/i18n/en.ts tests/i18n-parity.test.ts
git commit -m "feat(i18n): v5 四页键树(homeSchoolCard/schoolsPage/downloadPage/faqPage)与锚点新值"
```

---

## Task 2: Base 布局多页化(hreflang 语义对 + OG 参数 + preloadHero 开关)+ AppBar/Footer 改造

**Files:**
- Modify: `src/layouts/Base.astro`、`src/components/AppBar.astro`、`src/components/Footer.astro`、`src/pages/index.astro` + `src/pages/en/index.astro`(补传 `path '/'` 与 `'/en/'`、`preloadHero={true}`、`hasHero={true}`——Base 改签名后两主页必须同 commit 接线,否则 page.index:77-82 preload 用例与 AppBar show-pin 即回归红;ogImage 不传走缺省)、`src/i18n/ui.ts`(faqUrl 改站内 `/faq/`)、`src/i18n/zh.ts` + `src/i18n/en.ts`(删 `appbar.anchors.trust` 键——实测现值五键仍存、AppBar.astro:21 仍引用,键与引用必须本 commit 同删,防 tsc 窗口)
- Test: `tests/page.index.test.ts`(锚点 :98 + CTA 缺省态 :110 show-pin 按 §10 改写)、`tests/page.en.test.ts`(:63-67 锚点、:69-71 语言链)、`src/tokens/global.a11y.test.ts`(:216-228 Footer 三 pin 随瘦身改写)、`tests/dist.seo.test.ts`(新建)
- Files 里含 `src/components/sections/Trust.astro`(仅 :38 `href={faqUrl}` 一处消费方随 ui.ts 语义改自动站内化,零文件改动;击穿面 page.index.test.ts:199-201「FAQ 外链钉死」用例同 commit 改写为站内 `/faq/` 断言,终审 F4)

**Interfaces:**
- Consumes: Task 1 的 `zh.appbar.anchors`(五键现值,本任务消费四键并删 `trust` 键)
- Produces(Base props 新签名,后续所有页面任务消费;终审 I2/I3 写死):

```ts
interface BaseProps {
  lang: 'zh' | 'en';
  title: string;
  description: string;
  path: string;          // 本页 zh 路径,如 '/schools/'
  mirror: string;        // 本页对侧路径,如 '/en/schools/'(旧 mirror 单页假设废弃)
  ogImage?: string;      // 绝对 URL;缺省 = site + '/og/home-' + lang + '.png'(两主页不接线,Task 8 OG 产出后各路由再显式传;缺省值先保证 og:image 永不为空)
  ogImageAlt?: string;   // 缺省 = title
  preloadHero?: boolean; // 缺省 false;仅两主页传 true
  hasHero?: boolean;     // 缺省 false;两主页显式传 true(终审 I2:AppBar CTA 缺省态分支的输入,与 preloadHero 独立)
  jsonLd?: object;       // 缺省不发;主页传 SoftwareApplication 对象
  rssLink?: string;      // 缺省不发 RSS link(终审:Task 8 才建 /rss.xml 路由,本任务挂上=断链;Task 8 各路由传绝对 URL 接线)
}
```

  - Base 向 AppBar 传 `hasHero` 与 `mirror`(现值 Base:94 只传 lang/copy,两 prop 补齐;AppBar 语言链读 mirror,CTA 缺省态读 hasHero)。
  - AppBar 新行为(锚点 href 规则定死,无悬念):锚点段项 = **同语言主页锚点**——zh 页 `/#views`、en 页 `/en/#views`(views/reminders 两项,zh/en 主页段 id 相同);页面项 = zh 页 `/schools/` 与 `/faq/`,en 页 `/en/schools/` 与 `/en/faq/`;label 取 `c.appbar.anchors` 四键。CTA 钮 href=`/download/`(en 页 `/en/download/`),markup 缺省态 = `hasHero ? 'show' : 'hide'`(Astro 编译期分支,JS-off 即正确态;IO 运行时互隐仅在 hasHero 页启用)。
  - **语言切换链同时改造(终审 I4)**:AppBar `.appbar__lang` 现值 :15 硬编码 `lang==='zh' ? '/en/' : '/'` 的单页假设废弃——Base 把 `mirror` 透传 AppBar(或等价 prop),zh 页链 mirror,en 页链 mirror;两主页值不变(mirror 即 `/en/` 与 `/`),故既有 :69-71 用例仍绿(回归守卫)。
  - Footer 新链单源(spec §2.1 五链 + build 行):站内 `/download/ · /schools/ · /faq/` + 外链 repo + 语言 + build 行。**孤儿键处置(终审 F4)**:`t.dl/t.trial/t.qq/t.sponsor/t.faq/t.repo/t.community/t.app` 八键瘦身即零消费方——本 commit **不删**(Homepage 文案历史、删键需双文件同 commit 破 parity 闸无收益);键保留、引用清除,`{qqGroup}/{sponsorUrl}` 的直接 import 与 global.a11y.test.ts 三 pin 同步改(见 Step 4)。

- [ ] **Step 1: 写失败的产物级测试(先只跑两主页,证明改造不破 v4)**

`tests/dist.seo.test.ts` 新建(顶部公共 setup:读 `dist/client/index.html` 与 `dist/client/en/index.html` 各建 Document;`site` 从 `src/i18n/ui.ts` import;用例名即断言内容):

```ts
// 消费 dist/client/index.html 与 dist/client/en/index.html(build 后跑)
it('hreflang 双指本页对(zh 主页)', () => {
  expect(zhHead.querySelector('link[hreflang="zh-CN"]')!.getAttribute('href')).toBe(site + '/');
  expect(zhHead.querySelector('link[hreflang="en"]')!.getAttribute('href')).toBe(site + '/en/');
});
it('AppBar 锚点绝对化 + 新四 href(zh 主页)', () => {
  for (const h of ['/#views', '/schools/', '/faq/', '/#reminders'])
    expect(zhDoc.querySelector(`#appbar a[href="${h}"]`)).not.toBeNull();
});
it('en 主页语言链仍指 zh 主页(mirror 不变,回归守卫)', () => {
  expect(enDoc.querySelector('.appbar__lang')!.getAttribute('href')).toBe('/');
});
it('非 hero 页 AppBar CTA 恒隐(缺省态断言源码)', () => {
  const src = readFileSync('src/components/AppBar.astro', 'utf8');
  expect(src).toMatch(/hasHero\s*\?\s*'show'\s*:\s*'hide'/); // 方向锁
});
```

**预期红绿分明(终审 I1)**:hreflang 用例改造前即真(v4 的 `zh-CN→'/'、en→'/en/'` 恰好等于新值)——此用例定位为**多页化回归守卫**,本任务允许绿,不是先红;锚点 href 用例与 hasHero 方向锁用例必红(旧值裸 `#views`、无 hasHero 分支)。

Run: `npm run build && npx vitest run tests/dist.seo.test.ts` → Expected: 锚点/方向锁 FAIL,hreflang/语言链 PASS(守卫)

- [ ] **Step 2: 改 Base.astro**

hreflang 三链由 `path/mirror` 计算(恒指本页对);canonical 用 `site + path`;og 块加 `og:image`(绝对)/`og:image:alt`/`twitter:image`,值取 `ogImage ?? site + '/og/home-' + lang + '.png'`、alt 取 `ogImageAlt ?? title`;hero preload 的 `await getImage(...)` 与 `<link rel=preload>` 都包进 `if (preloadHero)`(注意:`getImage` 在模块顶层 await,收进分支要挪进 `{preloadHero && (...)}` 表达式内或以条件包裹,保证非主页不产生 widths 查询与 preload link);`<link rel="alternate" type="application/rss+xml">` **不挂**——Task 8 建 /rss.xml 路由前 href 即断链(终审裁决:RSS link 归 Task 8,Base 的 `rssLink` prop 此时已备好)。Base 调用 AppBar 传 `hasHero`。

- [ ] **Step 3: 改 AppBar.astro + Footer.astro**

锚点数组按 lang 生成绝对 href;语言链改读 Base 透传的 `mirror`(缺省回退单页值,两主页行为不变);**同 commit 删 `trust` 锚点项(:21)与 zh.ts/en.ts 的 `appbar.anchors.trust` 键**(键引用一起清,防编译窗口);CTA 逻辑:markup 缺省态 `data-appbar-cta={hasHero ? 'show' : 'hide'}`,IO 运行时互隐仅 `hasHero` 时启用(非主页无 `#hero`,脚本侧直接 return,缺省 hide 即终态)。Footer 链瘦身为 spec §2.1 五链 + build 行(站内三链 + repo 外链 + 语言 + build;`{qqGroup}/{sponsorUrl}` import 随 qq/sponsor 链移除,`{t.license}` span 保留)。ui.ts `faqUrl` 同 commit 改 `/faq/`(站内化,消费方 Footer/Trust 自动生效)。

- [ ] **Step 4: 按 §10 同步改写既有测试(同 commit 纪律)**

- `tests/page.index.test.ts:98` 旧四锚点 `['#views','#schools','#reminders','#trust']` → 新四 href `['/#views','/schools/','/faq/','/#reminders']`;
- `tests/page.index.test.ts:110` `toContain('data-appbar-cta="show"')` show-pin → 改为 `toMatch(/hasHero\s*\?\s*'show'\s*:\s*'hide'/)` 三元正则(缺省态语义随 prop 化,字面串必红;与 dist.seo 方向锁同源,page.index 侧保留是因为它同时锁 IO 机制其余断言);
- `tests/page.index.test.ts:199-201` 「FAQ 外链钉死」→ 改写为站内断言 `toContain('href="/faq/"')`(ui.ts faqUrl 语义变更);
- `tests/page.en.test.ts:63-67` en 侧锚点断言 → en href `['/en/#views','/en/schools/','/en/faq/','/en/#reminders']`;
- `src/tokens/global.a11y.test.ts:216-228` Footer describe:`{t.license}` pin 保留;`{qqGroup}`/`{sponsorUrl}` 源码 pin 随链删除改写为「Footer 源码不含 qqGroup/sponsorUrl 引用」负闸;`ui` 源含 `1063407652`/`sponsor.md` pin 保留(ui.ts 键不删,仅 Footer 不再 import)。

- [ ] **Step 5: 全绿验证**

Run: `npm run build && npx vitest run`
Expected: 207 + 新增全绿(此任务后 AppBar/Footer 类旧断言已迁,不允许残留红)

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Base.astro src/components/AppBar.astro src/components/Footer.astro src/pages/index.astro src/pages/en/index.astro src/i18n/ui.ts src/i18n/zh.ts src/i18n/en.ts tests/ src/tokens/global.a11y.test.ts
git commit -m "feat(layout): Base 多页化(hreflang 语义对/OG 参数/preload 开关)+ AppBar 跨页锚点 + Footer 瘦身"
```

---

## Task 3: FAQ 数据管线(fetch-faq + build-faq + faq-en.md + faq.json + 数量闸)

**Files:**
- Create: `scripts/fetch-faq.mjs`、`scripts/build-faq.mjs`、`scripts/faq-en.md`、`fixtures/FAQ.md`(仓内快照,种子=主仓现值提交)、`src/data/faq.json`
- Modify: `package.json`(`"data"` 追加 `&& node scripts/build-faq.mjs`)
- Test: `scripts/build-faq.test.mjs`(vitest include 覆盖 `scripts/**/*.test.mjs`,fetch-release.test.mjs 同法;tests/ 下的 .mjs 不在 include 内,禁放)

**Interfaces:**
- Consumes: 职责分工照搬 fetch-schools/build-schools 先例(fetch-schools.mjs:7-24 回写快照、build-schools.mjs:3 只读快照离线构建)。**build-faq.mjs 纯离线** = 读 `fixtures/FAQ.md` + `scripts/faq-en.md` → 产 `src/data/faq.json`,CI/本地行为确定;**fetch-faq.mjs 手动刷新** = `RAW_URL = https://raw.githubusercontent.com/lingion/sleepy/main/FAQ.md`,成功回写快照(行数报告),失败 exit 0 警告保留旧快照(spec §5 内容类陈旧可接受)。9 节 34 问(实测现值:「相关链接」节 0 问;两枚 ```sh 代码块同落「开发、测试与贡献」节),顶层单 `#` 与 `>` 引言跳过。en 真值 = 仓内 `scripts/faq-en.md`(人工维护,不存在跨仓拉取)。
- Produces:

```ts
// src/data/faq.json
interface FaqSection { zh: string; en: string; items: FaqItem[] }
interface FaqItem {
  id: string;              // slug: 'sec-{n}-q-{m}'
  q: { zh: string; en: string };
  a: { zh: FaqBlock[]; en: FaqBlock[] };  // 渲染子集:段落/链接/列表/行内 code/pre
}
interface FaqDoc { updatedAt: string; sections: FaqSection[] }
// build-faq.mjs 导出纯函数供测试:
export function parseFaq(md: string): FaqSection[];
export function assertPairing(zhItems: FaqItem[], enItems: FaqItem[]): void; // 条数不等即 throw('条数不一致 …'),build-faq 主流程 catch 后 exit(1)
export function blocksToHtml(blocks: FaqBlock[]): string; // FaqBody 消费
```
两个脚本的 main 入口一律照 `scripts/fetch-release.mjs:47` 先例守卫:`if (import.meta.url === \`file://${process.argv[1]}\`)` 才执行拉取/写文件——vitest import 模块时零副作用(终审 I5,fetch-faq/build-faq 同规)。

- [ ] **Step 1: 写失败的解析测试**

```ts
// FAQ_SNAPSHOT = fixtures/FAQ.md(仓内快照;build-faq 只读快照,测试同读保确定性)
it('FAQ.md 解析 = 9 节剔除相关链接后 8 节 · 34 问 · 代码块 2 枚', () => {
  const secs = parseFaq(readFileSync(FAQ_SNAPSHOT, 'utf8'));
  const items = secs.flatMap(s => s.items);
  expect(items.length).toBe(34);
  expect(secs.find(s => s.zh === '相关链接')).toBeUndefined(); // 解析器整节剔除
  expect(items.filter(i => i.a.zh.some(b => b.type === 'pre')).length).toBe(2);
});
it('zh/en 问数不一致即抛(build-faq 数量闸)', () => {
  const zhItems = parseFaq(readFileSync(FAQ_SNAPSHOT, 'utf8')).flatMap(s => s.items);
  expect(() => assertPairing(zhItems, zhItems.slice(1))).toThrow(/条数不一致/);
});
```

Run: `npx vitest run scripts/build-faq.test.mjs` → Expected: FAIL

- [ ] **Step 2: 实现 build-faq.mjs**

解析规则:`## ` 开节(「相关链接」跳过)、`### ` 开问、其到下个标题为答案体;答案体支持子集 = 段落、`[text](url)` 链接、`- `/`1. ` 列表、行内 `` ` `、围栏 ``` 块;`faq-en.md` 人工译文按同节序同问序对齐,条数不等 process.exit(1)。输出 faq.json 含 `updatedAt`(取 FAQ.md 首个日期样式或 git log 文件 mtime,写死用文件内声明)。**行内解析次序定死(终审 I11)**:链接 `[text](url)` 优先于行内 code——否则 FAQ.md:44 的 `[`docs/schools-list.md`](docs/schools-list.md)`(链接文字内嵌行内码)按先码后链会留反引号残渣。**相对仓库路径绝对化**:href 非 `http`/`#` 起手的(实测 FAQ.md:44 即 `docs/schools-list.md`),一律拼 `repoUrl + /blob/main/ + path`(ui.ts repoUrl)再落 `<a href>`——直接渲进 /faq/ 会解析成 `/faq/docs/...` 死链(同段 issues 深链为绝对 URL,不受影响)。

- [ ] **Step 3: 跑管线 + 全绿**

Run: `node scripts/build-faq.mjs && npx vitest run scripts/build-faq.test.mjs`
Expected: faq.json 生成、测试绿(34 问、配对校验过)

- [ ] **Step 4: Commit(脚本+译文+产物同提,产物入库保离线构建)**

```bash
git add scripts/build-faq.mjs scripts/faq-en.md scripts/build-faq.test.mjs fixtures/FAQ.md src/data/faq.json package.json
git commit -m "feat(faq): FAQ.md 快照管线(build-faq+en 译文+条数闸)"
```

---

## Task 4: /schools/ 学校查找页(SchoolsTool 组件 + 原生岛 URL 态 + details 折叠 + content-visibility)

**Files:**
- Create: `src/lib/schools-island.ts`、`src/lib/schools-island.test.ts`、`src/components/pages/SchoolsTool.astro`、`src/pages/schools.astro`、`src/pages/en/schools.astro`(flat 文件名 + directory 输出 → dist/client/schools/index.html,与文件结构一致)、`tests/page.schools.test.ts`
- 类名裁决(终审 I10):新组件沿用 `schools__*` 前缀(schools__stat/schools__row/schools__group…),CSS 走 SchoolsTool.astro scoped 样式,global.css 零新类——§10 新行「global.a11y :239/:246 改读 SchoolsTool.astro」才有一字不改的承接点。
- Modify: `src/lib/schools-view.ts`(SchoolRow + `aliases: string[]`)、`src/lib/search.ts`(SearchableSchool + `aliases?`、matchSchool 命中含 alias)、`src/lib/search.test.ts`(lixin 用例)

**Interfaces:**
- Consumes: `search.ts` 的 `normalize(s: string): string` / `matchSchool(q, school): boolean`(实测:search.ts 现零消费方——v4 岛自带 norm 副本过滤,本任务抽取即终结双轨);`schools-view.ts` 的 `schools/provincesOrdered()/typesOrdered()/rowCount`;Task 1 `zh.schoolsPage`;Task 2 Base props(`path:'/schools/'`, `mirror:'/en/schools/'`, `ogImage:site+'/og/schools-zh.png'`, `preloadHero` 缺省不传)
- **aliases 对齐裁决(本轮核实)**:`SchoolRow` 现类型无 `aliases` 而原始 JSON 348 行全有该字段(59 行非空,如「上海立信会计金融学院」= lixin——其 sortKeyFull 不含该串,纳入检索是真增益)。本任务:① `schools-view.ts` 的 `SchoolRow` 增 `aliases: string[]`(必填,JSON 全覆盖);② `search.ts` 的 `SearchableSchool` 增可选 `aliases?: string[]`,`matchSchool` 命中条件加 alias 子串;③ `search.test.ts` 补一条「lixin 命中上海立信」用例(同 commit)。
- **检索面单一语义裁决(终审 I7,自审定稿)**:全链一套表达式 = `searchFace(row) = normalize(row.name + row.aliases.join('') + row.sortKeyFull)`(search.ts 新导出,唯一实现点)。三处共用:① `matchSchool(q, row)` 改为 `normalize(q) !== '' && searchFace(row).includes(normalize(q))`(v4 的 name/sortKeyFull 逐字段判定被拼接面包含——实测 search.ts 现零消费方、search.test.ts 无字段序敏感用例,改造无回归面;lixin 新用例进同一 commit);② SchoolsTool 服务端渲染 `data-search={searchFace(s)}`(岛不内嵌 348 行 JSON——全量行对象序列化必爆 6KB 预算);③ `filterRows(rows, s)` 对 SchoolRow 同样走 matchSchool/searchFace。岛运行时只读 `dataset.search` 做 `includes(normalize(input))` = 同一表达式同一实现(等价性由构造保证,不靠测试兜底);schools-island.test.ts 仍加一条 pin:同一 q,filterRows 命中名集 = 对 dist 行 dataset.search 直判命中名集。v4 本地 norm 副本随旧组件删除。
- Produces:
  - `src/lib/schools-island.ts`:`parseUrlState(search: string): { q: string; province: string; type: string; expandAll: boolean }`(注:`focus=s` 不属 parseUrlState 四态——它是岛脚本首屏单独读 location.search 的一次性信号,读完 replaceState 剥除,永不进 filterRows 状态)、`writeUrlState(s): string`(空值不写参)、`filterRows(rows, s): SchoolRow[]`(内部用 normalize/matchSchool,删 norm 副本)、`applyInitialState(doc: Document, search: string): void`(纯 DOM 灌入可测:读 parseUrlState → 对 [data-school]/[data-group] 行写 hidden → 更新计数 role=status 文本——jsdom 直接调用,评审焦点 3 的真断言入口)
  - SchoolsTool.astro Props:`{ copy: typeof zh.schoolsPage, lang }`;DOM 契约:`[data-school]` 行带 `data-province`/`data-type`/`data-search`(normalize(name+aliases+sortKeyFull),仅作 DOM 呈现),组容器 `<details data-group>` summary 文本「{省份} · {n}」,计数行 `role="status"` 且 class 含 `schools__stat tnum`(§10 新行:global.a11y :246 markup tnum 闸 Task 7 后改读本组件,类名沿用即承接),搜索 label 隐藏文本,桌面 `max-block-size:70vh` 段内滚动 + 组 `content-visibility:auto; contain-intrinsic-size:auto 40px`(≤840px 折叠启用),交互件 `touch-action: manipulation`

- [ ] **Step 1: 写失败的岛纯函数测试**

```ts
// src/lib/schools-island.test.ts
it('parseUrlState 读三参 + 全展开开关不进 URL', () => {
  expect(parseUrlState('?p=GD&t=nuit&q=东软')).toEqual({ q:'东软', province:'GD', type:'nuit', expandAll:false });
  expect(parseUrlState('')).toEqual({ q:'', province:'', type:'', expandAll:false });
});
it('filterRows 深链首屏命中:GD+nuit+东软 = 广东东软学院 1 条', () => {
  const hit = filterRows(schools, parseUrlState('?p=GD&t=nuit&q=东软'));
  expect(hit.map(r => r.name)).toEqual(['广东东软学院']);
});
it('writeUrlState 空值省参(round-trip)', () => {
  expect(writeUrlState({ q:'', province:'GD', type:'', expandAll:false })).toBe('?p=GD');
});
```

Run: `npx vitest run src/lib/schools-island.test.ts` → FAIL

- [ ] **Step 2: 实现 schools-island.ts(纯函数三枚 + applyInitialState)**

纯函数:`parseUrlState/writeUrlState/filterRows`;`applyInitialState(doc, search)` = parse + filterRows 后对 doc 的 `[data-school]`/`[data-group]` 写 hidden 并更新 `[role="status"]` 计数文本(DOM 侧唯一入口,jsdom 可灌,页内岛脚本首屏调用同一函数)。过滤逻辑从 Schools.astro:171-221 抽取:q 走 `matchSchool`(内含 normalize,含 aliases),p/t 精确等值;空 q 短路返回全量。

- [ ] **Step 3: 写失败的页面产物测试**

`tests/page.schools.test.ts`(读 `dist/client/schools/index.html`,缺文件即报错提示先 build):

```ts
it('JS-off:348 行全在 HTML,details 29 组各带 summary 计数', () => {
  expect(doc.querySelectorAll('[data-school]').length).toBe(schools.length);
  expect(doc.querySelectorAll('details[data-group]').length).toBe(29);
  const gd = [...doc.querySelectorAll('summary')].find(s => s.textContent.includes('广东'));
  expect(gd.textContent).toContain('27');
});
it('计数行 role=status + 搜索框隐藏 label + placeholder 省略号结尾', …);
it('组容器 content-visibility 规则在组件源码 scoped CSS 内(dist CSS 外链 → 源码闸,page.index:137 先例)', () => {
  const src = readFileSync(new URL('../src/components/pages/SchoolsTool.astro', import.meta.url), 'utf8');
  expect(src).toMatch(/content-visibility:\s*auto/);
  expect(src).toMatch(/contain-intrinsic-size/);
  expect(src).toMatch(/touch-action:\s*manipulation/); // 实测全局 CSS 无此规则,新页必须自带(终审 F2 同闸)
});
it('autofocus 绝迹', () => { expect(HTML).not.toMatch(/autofocus/); });
it('首屏深链即过滤(评审焦点 3 真断言:对 dist 整页 Document 灌 search)', () => {
  applyInitialState(doc, '?p=GD&t=nuit&q=东软');
  const visible = [...doc.querySelectorAll('[data-school]')].filter(r => !r.hidden);
  expect(visible.length).toBe(1);
  expect(visible[0].textContent).toContain('广东东软学院');
});
it('空态卡含 school_adaptation 深链 + 正面陈述', () => {
  expect(HTML).toContain('issues/new?template=school_adaptation.yml');
});
it('底行更新于日期 + 名录随适配更新 + 提交适配 CTA', …);
it('岛 JS 体积 ≤6KB(保守上界:岛模块源长之和,Vite 最小化只会更小)', () => {
  const total = ['src/lib/schools-island.ts', 'src/lib/search.ts']
    .map((p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')).join('').length;
  expect(total).toBeLessThan(6144); // spec §2.3 预算;类型标注剥除后实际产物远小于源
});
```

Run: `npm run build && npx vitest run tests/page.schools.test.ts` → FAIL(页面不存在)

- [ ] **Step 4: 实现 SchoolsTool.astro + 路由两枚 + 岛脚本**

岛脚本(页面内联)只做四件事:URL→state 初始化(首屏 apply 一次)、input/click 事件重过滤、点省份 chip 时 `open` 对应 details 并 scrollIntoView、**读 `focus=s` 参数**(主页入口卡落地链接 `/schools/?focus=s`,spec §2.2 终审 I2 裁决:首屏若 URL 含 `focus=s` 即对搜索 input 调一次 `focus()`,随后 `history.replaceState` 剥掉该参——瞬时视图态,同「展开全部」不入分享 URL;autofocus 仍绝迹,聚焦只由点击来源触发,移动端无来源不弹键盘);「展开全部」Text 钮 toggle 所有 details 且**不写 URL**;popstate 回退重 apply。zh/en 路由各为薄壳:`<Base lang path mirror ogImage={site+'/og/schools-'+lang+'.png'} ogImageAlt={…} …><SchoolsTool copy={c.schoolsPage} lang=…/></Base>`(preloadHero/hasHero 缺省不传)。

- [ ] **Step 5: build + 全绿 + 手动深链验证**

Run: `npm run build && npx vitest run tests/page.schools.test.ts src/lib/schools-island.test.ts` → PASS
再 `npx wrangler pages dev dist/client` 打开 `/schools/?p=GD&t=nuit&q=东软` 目检首屏即 1 条;打开 `/schools/?focus=s` 目检落地即聚焦搜索框且地址栏该参被 replaceState 剥除(终审 I2 行为的人工验收,纯函数不测它)。

- [ ] **Step 6: Commit**

```bash
git add src/lib/schools-island.ts src/lib/schools-island.test.ts src/lib/schools-view.ts src/lib/search.ts src/lib/search.test.ts src/components/pages/SchoolsTool.astro src/pages/schools.astro src/pages/en/schools.astro tests/page.schools.test.ts
git commit -m "feat(schools): 学校查找独立页(URL 态/details 折叠/content-visibility)"
```

---

## Task 5: /download/ 下载中心页(DownloadPanel)

**Files:**
- Create: `src/components/pages/DownloadPanel.astro`、`src/pages/download.astro`、`src/pages/en/download.astro`、`tests/page.download.test.ts`
- 注:本任务对 `Download.astro` 只读不删(行样式**复制**迁移,旧段本体 Task 7 处理)——故 `src/tokens/global.a11y.test.ts` :323-329 的 color-mix 源码闸此刻仍绿,其改读 DownloadPanel 的红灯时机在 Task 7(§10 新行去向=Task 7 同 commit)。

**Interfaces:**
- Consumes: `release.json`;Task 1 `zh.downloadPage`;Task 2 Base props
- Produces: DOM 契约 `[data-dl-primary]`(universal 主钮,Elevated 档)、`[data-abi-row]`×4(universal 行 `data-rec`)、`[data-store-disabled]`×2、**`main` 域零 `.site-button--filled` 负闸**(终审 F3:AppBar CTA 的 Filled 类在 hide 态仍保留——visibility:hidden 不剥类名,整页计数必红;域限定 `doc.querySelectorAll('main .site-button--filled')`)。**新鲜度守卫不新建**:fetch-release.mjs 失败 exit 1 + CI/nightly 自动重跑已覆盖(spec §2.4 YAGNI 裁决,assert-release 废除)。

- [ ] **Step 1: 写失败测试**

`tests/page.download.test.ts`:四 ABI URL 全在 + sha256sumsUrl 在 + releases/latest 外链在 + minSdk 文案在(迁自 v4 M8)+ 「在线体验提供完整功能,无需安装。」串 pin(迁自 page.index:170,spec §10);`doc.querySelectorAll('main .site-button--filled').length === 0`(F3:main 域限定,AppBar CTA hide 态类名保留);正断言 `#appbar [data-appbar-cta]` 属性值 = `hide`(F3:同时验 Task 2 的 hasHero 分支在本页生效);恰一 `[data-abi-row][data-rec]` 且 = universal;在线体验卡 `rel` 含 noopener;商店占位 disabled 在;「如何确认手机架构」三行小表在(spec §9 默认加)。
Run: `npm run build && npx vitest run tests/page.download.test.ts` → FAIL(页面不存在)

- [ ] **Step 2: 实现 DownloadPanel + 两路由**

行样式复用 v4 Download.astro 的 `abiOf/mb/notes/data-rec` 三件套(从旧段迁移,旧段本体 Task 7 处理);页内仅此一个 Elevated 主钮,AppBar CTA 本页恒隐(Task 2 已保证);primary-container tonal 底、零 reveal 编排、交互件仅 hover/press。

- [ ] **Step 3: build + 测试绿 + Commit**

```bash
git add src/components/pages/DownloadPanel.astro src/pages/download.astro src/pages/en/download.astro tests/page.download.test.ts
git commit -m "feat(download): 下载中心独立页(出口归位/CTA 纪律/架构引导小表)"
```

---

## Task 6: /faq/ 页(FaqBody 渲染器 + TOC + 34 问闸)

**Files:**
- Create: `src/components/pages/FaqBody.astro`、`src/pages/faq.astro`、`src/pages/en/faq.astro`、`tests/page.faq.test.ts`

**Interfaces:**
- Consumes: `src/data/faq.json`(Task 3 的 FaqDoc);`blocksToHtml`;Task 1 `zh.faqPage`;Task 2 Base props
- Produces: DOM 契约 `section[data-faq-section]`×8(「相关链接」剔除)、`article[data-faq-item]`×34(各带 `id`)、TOC 桌面 sticky 左栏 + 手机横滑 chip 条、`<pre translate="no">`×2。

- [ ] **Step 1: 写失败测试**

```ts
it('34 问 = faq.json = FAQ.md ### 计数;8 节(相关链接绝迹)', () => {
  expect(doc.querySelectorAll('[data-faq-item]').length).toBe(34);
  const secs = [...doc.querySelectorAll('[data-faq-section]')];
  expect(secs.length).toBe(8); // 终审 I9:FAQ.md 实测 9 个 ## 节,剔除「相关链接」恰 8——真断言,禁无 matcher 占位
  expect(secs.map(s => s.getAttribute('data-section'))).toEqual(['项目是什么','安装与版本','导入与导出','课表、冲突与作息表','小组件','提醒','主题与外观','开发、测试与贡献']);
  expect(HTML).not.toContain('相关链接');
});
it('渲染子集出 HTML:a 标签/ul/ol/code/pre 各≥1;pre 带 translate="no"', …);
it('禁问句闸在本页的适用面 = 页面框架文本(article 外)零「？」', () => {
  // 终审 I10 裁决:豁免单元 = 整个 article(q 标题与 a 答案体全豁免——FAQ.md 34 问全带「？」且 en 译文随原文句式,
  // 逐问粒度会因 faq-en.md 正文自然问句整页红)。断言主体 = TOC/页头/尾卡等 article 外文本剔除后零「？」与零「?」。
});
it('尾卡正面陈述 + Issues/Discussions/QQ 群三链', …);
it('TOC 链接 href 均为页内 #锚点且 target 存在', …);
it('相对仓库链接已绝对化:docs/schools-list.md 渲为 repoUrl/blob/main/ 前缀,FaqBody 零 /faq/docs/ 死链', () => {
  expect(HTML).not.toContain('href="docs/');
  expect(HTML).toContain('/blob/main/docs/schools-list.md'); // Task 3 解析规则的产物侧 pin
});
```

Run: `npm run build && npx vitest run tests/page.faq.test.ts` → FAIL

- [ ] **Step 2: 实现 FaqBody + 两路由**

FaqBody 按 lang 取 `q[lang]/a[lang]`,blocksToHtml 输出;TOC 高亮 = 原生 IO,color 150ms(spec §5);手机横滑条复用 Task 9 的 chip 形(先用现 .site-chip,升档统一在 T9 落)。

- [ ] **Step 3: 绿 + Commit**

```bash
git add src/components/pages/FaqBody.astro src/pages/faq.astro src/pages/en/faq.astro tests/page.faq.test.ts
git commit -m "feat(faq): FAQ 页(快照渲染/TOC/禁问句豁免断言)"
```

---

## Task 7: 主页改造(删 Schools 段 + 入口卡 + Download 瘦身为单出口)与 §10 再基线

**Files:**
- Create: `src/components/sections/SchoolsCard.astro`
- Modify: `src/pages/index.astro`、`src/pages/en/index.astro`、`src/components/sections/Download.astro`(瘦身版 = 主页只渲染单出口段,行样式迁 /download/ 面板已定死——终审 I1 删「或」句,与 Task 5「从旧段迁移复制」一致,无分支可选)、`src/styles/global.css`(.entry-card 样式)
- Test: `tests/page.index.test.ts`、`tests/page.en.test.ts`(§10 同 commit 改写)

**Interfaces:**
- Consumes: `rowCount/typeCount`;`zh.homeSchoolCard`;release.json universal URL;Task 4/5 页面路由
- Produces: 主页段序不变量 `hero→views→connect→schoolCard→reminders→gallery→trust→download`,schoolCard `data-prototype="entry-card"`、download 段 `data-prototype="tonal-band"` 保持;入口卡非岛(零 script)。

- [ ] **Step 1: 按 §10 改写两主页测试(先红)**

八段 ids 数组中 `schools` 换 `schoolCard`(终审 I3:净数仍 8,非七段——v4 删 schools 加 schoolCard 是替换)、PROTOTYPE 表 schoolCard=`entry-card`;M4 块整体删除(去向已迁 page.schools.test.ts);M8 块改写为「恰一下载出口 = universal APK URL;其余三 ABI URL 与 sha 链、store 占位、releases/latest 全部绝迹于主页 HTML」负闸;文案 pin 改 §4 入口卡句,同段新增入口钮 `href="/schools/?focus=s"` 精确断言(终审 I2:聚焦承接的合同侧 pin,行为侧验收在 T4 Step5 目检);Filled=2 保持(AppBar S + hero XL),新增「download 段零 Filled」;「Android 8.0」pin 删除(迁 download 测试);墙四件断言(:258-262)本任务不动(五件 = Task 9 同 commit,§10 新行)。

- [ ] **Step 2: 实现 SchoolsCard + 主页瘦身出口段 + 路由接线**

入口卡:surface-container-low、左派生句(模板 `{rows}/{types}` 替换,禁手写)、右侧「搜索框样式入口按钮」(外观像 outlined field 的 `<a>`,href=`/schools/?focus=s`(终审 I2:聚焦承接 = Task 4 岛读 focus=s,零 script),零 input);主钮链 universal APK 绝对 URL(release.json assets find name 含 universal)。

- [ ] **Step 3: build + 全量测试绿(此时 Schools.astro 旧组件删除,孤儿清理)**

Run: `npm run build && npx vitest run` → 全绿(§10 表全部有去向)
同 commit 改读两处源码闸(§10 新行):`src/tokens/global.a11y.test.ts` :239/:246 Schools.astro → SchoolsTool.astro(删段后 read 必抛)、:323-329 Download.astro color-mix → DownloadPanel.astro(行 blend 已绝迹于主页瘦身段)。

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/SchoolsCard.astro src/pages/index.astro src/pages/en/index.astro src/components/sections/Download.astro src/components/sections/Schools.astro src/tokens/global.a11y.test.ts tests/
git commit -m "feat(home): 主页四页化改造(台账离页/入口卡/下载单出口)与测试再基线"
```

---

## Task 8: 分发基建(OG 8 枚 + robots + RSS + JSON-LD + 404 + sitemap i18n)

**Files:**
- Create: `public/robots.txt`、`public/og/*.png` ×8、`tools/make-og.mjs`、`src/pages/404.astro`、`src/pages/rss.xml.js`、`tests/dist.seo.test.ts`(补全)
- Modify: `package.json`(+@astrojs/rss)、`astro.config.mjs`(sitemap i18n)、`src/layouts/Base.astro`(rssLink prop 接线:缺省不挂的 RSS alternate link 此时启用,绝对 href)、各页路由(ogImage/jsonLd props 接线)

**Interfaces:**
- Consumes: Task 2 Base props;release.json;site 常量
- Produces: 构建产物 `dist/client/{robots.txt, sitemap-index.xml, rss.xml, 404.html, og/*.png}`;`/` 页 `<script type="application/ld+json">` 恰一。

- [ ] **Step 0: site 基域决策项(用户签收闸,终审 I12——不得由实现者自行改配置)**

现状实测(2026-10-25):`astro.config.mjs:8` 与 `src/i18n/ui.ts:2` site = `https://sleepy.lingion.eu.cc`;eu.cc TCP 通而 TLS 握手被 reset(域后缀 SNI 污染形态,memory sleepy-cn-entry-and-gfw-sni),qzz.io 返回 200 且正服务本站。v5 把 OG/robots/RSS/canonical 全钉在 site 绝对基域上,受众=大陆学生。先跑一次只读枚举拿部署真值:`npx wrangler pages project list` + CF 域名列表(查 qzz.io 与 eu.cc 是双域绑同一 Pages 还是 redirect/alias,终审存疑二)。然后把「基域 = eu.cc 维持 / 改 qzz.io / 双域互指」作为决策项**提请用户签收**,签收前本任务其余步骤照旧推进(全部 URL 派生自 site 常量,签收值落地=单点改 ui.ts+astro.config 两行);签收改域属外部 DNS/CF 配置变更,归 release-sop §6 批准闸。

- [ ] **Step 1: 补全失败的 dist.seo.test.ts(追加)**

```ts
it('hreflang 矩阵:8 路由各双指本页对,x-default=/', () => { 遍历 8 html 断言 });
it('OG 8 枚:public/og 存在性 + 各页 og:image 绝对 URL 指向本页对应图 + twitter:image 同值', …);
it('JSON-LD 恰一于主页:可 parse,softwareVersion=release.tag,downloadUrl=universal URL,零 FAQPage', …);
it('robots.txt 含 Sitemap 行;rss.xml 解析 ≥1 item 且链接含 /download/', …);
it('sitemap 条目恰 8 路由零 404,每条含双语 alternate', …);
it('非主页 head 零 01-week preload;主页 preload=高优先图断言仍绿', …);
it('404.html 产物存在含四页链接与双语行', …);
```

- [ ] **Step 2: npm 装 @astrojs/rss(npmmirror 源),写 rss.xml.js 单路由(feed 条目取 release.json,link=/download/,description 含 ABI/sha/348 校事实行)**

- [ ] **Step 3: robots.txt + astro.config sitemap i18n 配置(终审 I5 写死形状,防 zod 撞墙:`i18n: { defaultLocale: 'zh', locales: { zh: 'zh-CN', en: 'en' } }`——locales 必须是对象而非数组,defaultLocale 须为其键,值匹配 `^[a-zA-Z-]+$`(实测 zh-CN 合法);无前缀 zh 页落 defaultLocale 由包自身判定)+ 404.astro(双语并列、四页链、Base preloadHero=false)**

- [ ] **Step 4: OG 生产(tools/make-og.mjs:模板 HTML→Chrome headless 截图 1200×630→public/og/;8 枚一次生成;wordmark+主张大字取 §4 句+右下真机截图元素)**

脚本是作者工具不进构建路径(注释写明,防实现者挂 build)。主张文案入图时点冻结(spec R7)。

- [ ] **Step 5: 各路由接 ogImage/ogImageAlt/jsonLd;build + dist.seo 全绿 + `npx wrangler pages dev dist/client` 手验 `curl -sI http://localhost:8788/no-such-path` 状态码=404 且 body=自定义页(终审存疑一:wrangler 本地模拟的接管等价性以本次实测状态码收口,非仅路由文件存在)**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(seo): 分发基建(OG 8 枚/hreflang 矩阵/robots/RSS/JSON-LD/404/sitemap i18n)"
```

---

## Task 9: 三缺口修(chip 升档 + weekview 第 5 卡 + color-scheme/translate-no)

**Files:**
- Modify: `src/styles/global.css`(.site-chip corner-full + is-active secondary-container + leading check SVG 位 + `color-scheme: light dark` on html)、`src/components/sections/Reminders.astro`(第 5 卡)、`src/components/pages/FaqBody.astro`(TOC chip 条套新形)、`tests/page.index.test.ts`(组件墙五件断言)、`src/tokens/global.a11y.test.ts`
- Test: 追加断言——`.site-chip` 规则含 `--md-sys-shape-corner-full`(现值 corner-small,今天红=真红);选中态断言写 `[aria-pressed='true']` 形态且含 leading check 显隐(新);hover 变体在 `(hover:hover)` 闸内;reduce 块含 chip transition 归零;`color-scheme` 在顶层 `<html>` 规则。**选择器真值(终审 I4 实测)**:选中态样式挂 `.site-chip[aria-pressed='true']`(global.css:219,secondary-container **已存在**——该子断言今天即绿,作回归守卫写,先红纪律由 corner-full/check 两枚新物断言承担);`.is-active` 类(Schools.astro JS 双写)在 CSS 零规则——禁新写 `.is-active` 样式(两套选择器并存必漂移);FAQ TOC 是链接非按钮,当前态用 `aria-current` 另断言。

- [ ] **Step 1: 写失败断言**(global.a11y.test.ts + page.index.test.ts「五件 data-widget」含 weekview)→ FAIL
- [ ] **Step 2: 实现三修**(weekview 卡并入扁条列,墙=周网格竖卡 + today/twodays/weeklist/weekview 四扁条;`<pre>` 输出处加 `translate="no"` 已在 T6 落,此任务全站复查)。**leading check 图标形态定死**:inline SVG(12px,CSS 类控制显隐),禁 box-shadow 造形——global.a11y.test.ts:254-266 的 box-shadow x=0 不变量只扫 global.css,inline SVG 不触闸(终审存疑三:实现后全量跑既有闸即闭环)
- [ ] **Step 3: build + 截图目检 chip 四态(default/hover/active/checked × light/dark)+ 全量绿**
- [ ] **Step 4: Commit** `fix(site): 特征 chip 升档 + 组件墙周视图卡 + color-scheme 声明`

---

## Task 10: 终验(全量闸 + 目检矩阵 + 验收清单核销)

**Files:** 无新文件;`docs/superpowers/checklists/`(如需要记录核销)

- [ ] **Step 1:** `npm run data && npm run build && npx vitest run && npx astro check` 全绿,记录真实输出
- [ ] **Step 2:** spec §8 验证清单 15 项逐条核销(实测复选框数=15,终审 I14;每条给证据:测试名或产物路径)
- [ ] **Step 3:** 目检矩阵截图:8 路由 × light/dark × 1440/375(chrome-devtools MCP 或 `wrangler pages dev`),发现视觉缺陷回相应任务修
- [ ] **Step 4:** JS-off 验收:`wrangler pages dev` 下禁 JS 四页可读 + details 手开
- [ ] **Step 5:** Lighthouse mobile 验收(终审 I13 裁决:仓库无 v4 分数记录,「≥ v4 同段基线」不可判定 → 改用绝对目标——沿用 v2 计划四项 ≥95:主页对四项目标全检,新四页对 a11y/perf ≥95;数字记录进 PR 证据文件,「同段」两解随签收批注)
- [ ] **Step 6:** 提交收尾 + 按 pr-lifecycle 开 PR(~600 行上限若超,按任务边界拆两个 PR;push 前 `git log` 扫 Fixes/Closes/Resolves)

---

## Self-Review(计划作者核)

1. **Spec 覆盖**:§2.1 路由=T4-T8;§2.2 主页=T7(入口卡 focus=s 由 T4 岛承接);§2.3 schools=T4;§2.4 download=T5;§2.5 faq=T3+T6;§2.6 分发=T2(og/preload/hreflang)+T8(全量,含 Step 0 site 基域决策项);§3 四缺口=T9(chip/weekview/color-scheme)+T6(translate-no)+T4(折叠);§4 文案=T1;§5 动效分散在各 UI 任务;§8 验收=T10(15 项);§10 再基线=T1/T2/T4/T5/T7/T8/T9 各自同 commit(含补入的三行源码闸去向:global.a11y :239/:246、:323-329、page.index :258-262)。**无缺口**。
2. **步骤扫描**:每步单一动作;测试断言给足 spec 值(348/34/27/8 节/广东东软学院/6144B);实现体留给签名+测试可推导的部分,FAQ 解析器给了规则行而非代码(链接先行内码、相对路径 blob/main 绝对化两条已写死)。
3. **类型一致**:`parseUrlState/filterRows/writeUrlState/applyInitialState` T4 定义、T10 复用无改名;BaseProps `path/mirror/ogImage?/ogImageAlt?/preloadHero?/hasHero?/jsonLd?/rssLink?` T2 定义、T4-T8 消费一致(ogImage 缺省主页图、rssLink 缺省不挂、Task 8 接线);`faqPage/downloadPage` 键名 T1 与 T5/T6 一致。
4. **Review Focus 6 条**:1→T2 Step1;2→T1 Step3;3→T4 Step1;4→T8 Step1;5→T3 Step2+T6 页脚断言;6→T4 Step3 空组断言(补充:`filterRows` 后组壳 `details` 全 hidden,断言「无可见空 summary」)。
5. **比例**:计划约 350 行对 200 行 spec,接口与测试占主体,无逐行转录。可执行。

