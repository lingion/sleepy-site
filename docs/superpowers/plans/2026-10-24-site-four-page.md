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
3. **URL 深链首屏失配**:直接打开 /schools/?p=GD&q=东软 时 JS 前 HTML 显示全量、JS 后若不读 URL 则态归零(分享链接点开=没过滤)→ Task 4 断言岛初始化即 parse URL 并 apply,jsdom 测试灌 location.search 验首屏命中。
4. **OG 爬虫相对路径**:og:image 若写 `/og/home-zh.png`,多数爬虫不解析相对 URL,分享态依旧无图 → Task 8 断言 head 里 og:image 值为 `https://` 前缀绝对 URL。
5. **FAQ 快照静默腐烂**:主仓 FAQ.md 改了、站没重跑 data,/faq/ 显示旧答案 → Task 6 页脚「更新于」直读 faq.json 内声明日期 + build-faq 条数闸,目检可发现(spec R4)。
6. **details 折叠与过滤互踩**:省份 chip 过滤后,折叠态的组 hidden 判定若只看组本身会露出空壳 summary → Task 4 断言 JS-off 全展开可读、JS-on 过滤后无可见空组。

---

## 文件结构(决策定死)

```
新建:
  src/pages/schools.astro          /schools/ 路由(zh)
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
  scripts/build-faq.mjs            FAQ.md → src/data/faq.json 解析器
  scripts/faq-en.md                en 译文(与 FAQ.md 同节同问数,人工维护)
  src/data/faq.json                构建产物(节/问/答 zh+en,入库)
  scripts/assert-release.mjs       本地构建新鲜度警告守卫
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
  src/components/sections/Download.astro   主页瘦身版复用为面板的父级改造 or 保留给 /download/
  src/components/sections/Reminders.astro  墙补第 5 卡(weekview)
  src/styles/global.css            .site-chip 升档 + color-scheme + .entry-card + content-visibility
  astro.config.mjs                 sitemap i18n 配置
  package.json                     依赖 @astrojs/rss;data 脚本链加 build-faq + assert-release
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

文案逐字取自 spec §4;占位模板键(count/ctaNote 类)统一 `{rows} {types} {shown} {total}` 命名,渲染端负责替换。禁在任何字符串写死 348/33。

- [ ] **Step 3: 跑 parity 闸 + 泄漏预检**

Run: `npx vitest run tests/i18n-parity.test.ts && node tools/i18n-leak-check.mjs`
Expected: 双绿(泄漏闸 FORBIDDEN 扫新键——「查找我的学校」无问号、「学校名录」四字形态安全;FAQ 页键无问句,豁免条只影响 /faq/ body,不触键树)

- [ ] **Step 4: Commit**

```bash
git add src/i18n/zh.ts src/i18n/en.ts tests/i18n-parity.test.ts
git commit -m "feat(i18n): v5 四页键树(homeSchoolCard/schoolsPage/downloadPage/faqPage)与锚点新值"
```

---

## Task 2: Base 布局多页化(hreflang 语义对 + OG 参数 + preloadHero 开关)+ AppBar/Footer 改造

**Files:**
- Modify: `src/layouts/Base.astro`、`src/components/AppBar.astro`、`src/components/Footer.astro`
- Test: `tests/page.index.test.ts`(AppBar 锚点断言按 §10 改写)、`tests/dist.seo.test.ts`(新建,先只放 hreflang/锚点两用例)

**Interfaces:**
- Consumes: Task 1 的 `zh.appbar.anchors` 新四键
- Produces(Base props 新签名,后续所有页面任务消费):

```ts
interface BaseProps {
  lang: 'zh' | 'en';
  title: string;
  description: string;
  path: string;          // 本页 zh 路径,如 '/schools/'
  mirror: string;        // 本页对侧路径,如 '/en/schools/'(旧 mirror 单页假设废弃)
  ogImage: string;       // 绝对 URL,如 site + '/og/schools-zh.png'
  ogImageAlt: string;
  preloadHero?: boolean; // 缺省 false;仅两主页传 true
  jsonLd?: object;       // 缺省不发;主页传 SoftwareApplication 对象
}
```

  - AppBar 新行为(锚点 href 规则定死,无悬念):锚点段项 = **同语言主页锚点**——zh 页 `/#views`、en 页 `/en/#views`(views/reminders 两项,zh/en 主页段 id 相同);页面项 = zh 页 `/schools/` 与 `/faq/`,en 页 `/en/schools/` 与 `/en/faq/`;label 取 `c.appbar.anchors` 四键。CTA 钮 href=`/download/`(en 页 `/en/download/`),`data-appbar-cta` 机制在 `#hero` 不存在的页面恒 `hide`。
  - Footer 新链单源:站内 `/download/ · /schools/ · /faq/` + 外链 repo + 语言 + build 行。

- [ ] **Step 1: 写失败的产物级测试(先只跑两主页,证明改造不破 v4)**

`tests/dist.seo.test.ts` 新建:

```ts
// 消费 dist/client/index.html 与 dist/client/en/index.html(build 后跑)
it('hreflang 双指本页对(zh 主页)', () => {
  expect(head.querySelector('link[hreflang="zh-CN"]').href).toBe(site + '/');
  expect(head.querySelector('link[hreflang="en"]').href).toBe(site + '/en/');
});
it('AppBar 锚点绝对化 + 新四 href', () => {
  for (const h of ['/#views', '/schools/', '/faq/', '/#reminders'])
    expect(doc.querySelector(`#appbar a[href="${h}"]`)).not.toBeNull();
});
it('非 hero 页 AppBar CTA 恒隐(缺省态断言源码)', () => {
  const src = readFileSync('src/components/AppBar.astro', 'utf8');
  expect(src).toMatch(/hasHero\s*\?\s*'show'\s*:\s*'hide'/); // 方向锁
});
```

Run: `npm run build && npx vitest run tests/dist.seo.test.ts` → Expected: FAIL(旧 hreflang 恒指 `/`,旧锚点裸 `#views`)

- [ ] **Step 2: 改 Base.astro**

hreflang 三链由 `path/mirror` 计算(恒指本页对);canonical 用 `site + path`;og 块加 `og:image`(绝对)/`og:image:alt`/`twitter:image`;hero preload 的 `await getImage(...)` 与 `<link rel=preload>` 都包进 `if (preloadHero)`;`<link rel="alternate" type="application/rss+xml">` 全站挂上(href 绝对)。

- [ ] **Step 3: 改 AppBar.astro + Footer.astro**

锚点数组按 lang 生成绝对 href;**同 commit 删 `trust` 锚点项与 zh.ts/en.ts 的 `appbar.anchors.trust` 键**(Task 1 保键防编译窗口,此刻引用与键一起清);CTA 逻辑:`document.getElementById('hero')` 存在才启用 IO,不存在直接 `data-appbar-cta="hide"`(markup 侧 JS-off 缺省态在非主页写死 hide、主页写死 show,由 Astro 按 `hasHero` prop 分支——两主页传 true)。Footer 链瘦身为 spec §2.1 五链。

- [ ] **Step 4: 按 §10 同步改写 page.index.test.ts:96-101 与 page.en.test.ts:63-67 锚点断言(同 commit 纪律)**

新四 href 断言替换旧 `#views/#schools/#reminders/#trust`。

- [ ] **Step 5: 全绿验证**

Run: `npm run build && npx vitest run`
Expected: 207 + 新增全绿(此任务后 AppBar 类旧断言已迁,不允许残留红)

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Base.astro src/components/AppBar.astro src/components/Footer.astro tests/
git commit -m "feat(layout): Base 多页化(hreflang 语义对/OG 参数/preload 开关)+ AppBar 跨页锚点 + Footer 瘦身"
```

---

## Task 3: FAQ 数据管线(build-faq.mjs + faq-en.md + faq.json + 数量闸)

**Files:**
- Create: `scripts/build-faq.mjs`、`scripts/faq-en.md`、`fixtures/FAQ.md`(仓内快照)、`src/data/faq.json`
- Modify: `package.json`(`"data"` 追加 `&& node scripts/build-faq.mjs`)
- Test: `tests/build-faq.test.mjs`(vitest 已覆盖 scripts 级测试,fetch-release.test.mjs 同法)

**Interfaces:**
- Consumes: **FAQ.md 取数沿 fetch-schools.mjs 既有模式**(CI 没有主仓,禁读绝对本地路径):`RAW_URL = https://raw.githubusercontent.com/lingion/sleepy/main/FAQ.md`,fetch 失败 → 回落 `fixtures/FAQ.md` 仓内快照警告继续(:7-19 同构)。9 节 34 问,两枚 ```sh 代码块,顶层单 `#` 与 `>` 引言跳过。en 真值 = 仓内 `scripts/faq-en.md`(人工维护,不存在跨仓拉取)。
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
export function blocksToHtml(blocks: FaqBlock[]): string; // FaqBody 消费
```

- [ ] **Step 1: 写失败的解析测试**

```ts
// FAQ_SNAPSHOT = fixtures/FAQ.md(仓内快照;build-faq 在线取 latest、失败回落快照,测试直接读快照保确定性)
it('FAQ.md 解析 = 9 节剔除相关链接后 8 节 · 34 问 · 代码块 2 枚', () => {
  const secs = parseFaq(readFileSync(FAQ_SNAPSHOT, 'utf8'));
  const items = secs.flatMap(s => s.items);
  expect(items.length).toBe(34);
  expect(secs.find(s => s.zh === '相关链接')).toBeUndefined(); // 解析器整节剔除
  expect(items.filter(i => i.a.zh.some(b => b.type === 'pre')).length).toBe(2);
});
it('zh/en 问数不一致即抛(build-faq 数量闸)', () => {
  expect(() => assertPairing(zhItems, zhItems.slice(1))).toThrow(/条数不一致/);
});
```

Run: `npx vitest run tests/build-faq.test.mjs` → Expected: FAIL

- [ ] **Step 2: 实现 build-faq.mjs**

解析规则:`## ` 开节(「相关链接」跳过)、`### ` 开问、其到下个标题为答案体;答案体支持子集 = 段落、`[text](url)` 链接、`- `/`1. ` 列表、行内 `` ` `、围栏 ``` 块;`faq-en.md` 人工译文按同节序同问序对齐,条数不等 process.exit(1)。输出 faq.json 含 `updatedAt`(取 FAQ.md 首个日期样式或 git log 文件 mtime,写死用文件内声明)。

- [ ] **Step 3: 跑管线 + 全绿**

Run: `node scripts/build-faq.mjs && npx vitest run tests/build-faq.test.mjs`
Expected: faq.json 生成、测试绿(34 问、配对校验过)

- [ ] **Step 4: Commit(脚本+译文+产物同提,产物入库保离线构建)**

```bash
git add scripts/build-faq.mjs scripts/faq-en.md fixtures/FAQ.md src/data/faq.json package.json tests/build-faq.test.mjs
git commit -m "feat(faq): FAQ.md 快照管线(build-faq+en 译文+条数闸)"
```

---

## Task 4: /schools/ 学校查找页(SchoolsTool 组件 + 原生岛 URL 态 + details 折叠 + content-visibility)

**Files:**
- Create: `src/lib/schools-island.ts`、`src/components/pages/SchoolsTool.astro`、`src/pages/schools.astro`、`src/pages/en/schools.astro`、`tests/page.schools.test.ts`
- Test: `tests/page.schools.test.ts`、`src/lib/schools-island.test.ts`(岛纯函数单测)

**Interfaces:**
- Consumes: `search.ts` 的 `normalize(s: string): string` / `matchSchool(q, school): boolean`;`schools-view.ts` 的 `schools/provincesOrdered()/typesOrdered()/rowCount`;Task 1 `zh.schoolsPage`;Task 2 Base props(`path:'/schools/'`, `mirror:'/en/schools/'`, `preloadHero:false`)
- Produces:
  - `src/lib/schools-island.ts`:`parseUrlState(search: string): { q: string; province: string; type: string; expandAll: boolean }`、`writeUrlState(s): string`(空值不写参)、`filterRows(rows, s): SchoolRow[]`(内部用 normalize/matchSchool,删 norm 副本)——岛脚本 import,单测可灌
  - SchoolsTool.astro Props:`{ copy: typeof zh.schoolsPage, lang }`;DOM 契约:`[data-school]` 行带 `data-province`/`data-type`/`data-search`(normalize(name+aliases+sortKeyFull)),组容器 `<details data-group>` summary 文本「{省份} · {n}」,计数行 `role="status"`,搜索 label 隐藏文本,桌面 `max-block-size:70vh` 段内滚动 + 组 `content-visibility:auto; contain-intrinsic-size:auto 40px`(≤840px 折叠启用)

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

- [ ] **Step 2: 实现 schools-island.ts(三函数,零 DOM)**

过滤逻辑从 Schools.astro:171-221 抽取:q 走 `matchSchool`(内含 normalize),p/t 精确等值;空 q 返回全量(matchSchool 空串 false 的语义在 filterRows 外层短路,保持与现岛一致)。

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
it('组容器 content-visibility 规则在页 scoped CSS 内', () => {
  expect(HTML).toMatch(/content-visibility:\s*auto/);
  expect(HTML).toMatch(/contain-intrinsic-size/);
});
it('touch-action: manipulation 挂交互件;autofocus 绝迹', () => {
  expect(HTML).not.toMatch(/autofocus/);
});
it('空态卡含 school_adaptation 深链 + 正面陈述', () => {
  expect(HTML).toContain('issues/new?template=school_adaptation.yml');
});
it('底行更新于日期 + 名录随适配更新 + 提交适配 CTA', …);
it('岛 JS 体积 ≤6KB(内联 script 长度)', () => {
  const scripts = [...doc.querySelectorAll('script:not([src])')].map(s => s.textContent).join('');
  expect(scripts.length).toBeLessThan(6144);
});
```

Run: `npm run build && npx vitest run tests/page.schools.test.ts` → FAIL(页面不存在)

- [ ] **Step 4: 实现 SchoolsTool.astro + 路由两枚 + 岛脚本**

岛脚本(页面内联)只做三件事:URL→state 初始化(首屏 apply 一次)、input/click 事件重过滤、点省份 chip 时 `open` 对应 details 并 scrollIntoView;「展开全部」Text 钮 toggle 所有 details 且**不写 URL**;popstate 回退重 apply。zh/en 路由各为薄壳:`<Base path mirror ogImage preloadHero={false} …><SchoolsTool copy={c.schoolsPage} lang=…/></Base>`。

- [ ] **Step 5: build + 全绿 + 手动深链验证**

Run: `npm run build && npx vitest run tests/page.schools.test.ts src/lib/schools-island.test.ts` → PASS
再 `npx wrangler pages dev dist/client` 打开 `/schools/?p=GD&t=nuit&q=东软` 目检首屏即 1 条。

- [ ] **Step 6: Commit**

```bash
git add src/lib/schools-island.ts src/lib/schools-island.test.ts src/components/pages/SchoolsTool.astro src/pages/schools.astro src/pages/en/schools.astro tests/page.schools.test.ts
git commit -m "feat(schools): 学校查找独立页(URL 态/details 折叠/content-visibility)"
```

---

## Task 5: /download/ 下载中心页(DownloadPanel)

**Files:**
- Create: `src/components/pages/DownloadPanel.astro`、`src/pages/download.astro`、`src/pages/en/download.astro`、`tests/page.download.test.ts`

**Interfaces:**
- Consumes: `release.json`;Task 1 `zh.downloadPage`;Task 2 Base props
- Produces: DOM 契约 `[data-dl-primary]`(universal 主钮,Elevated 档)、`[data-abi-row]`×4(universal 行 `data-rec`)、`[data-store-disabled]`×2、页内零 `.site-button--filled` 负闸。**新鲜度守卫不新建**:fetch-release.mjs 失败 exit 1 + CI/nightly 自动重跑已覆盖(spec §2.4 YAGNI 裁决,assert-release 废除)。

- [ ] **Step 1: 写失败测试**

`tests/page.download.test.ts`:四 ABI URL 全在 + sha256sumsUrl 在 + releases/latest 外链在 + minSdk 文案在(迁自 v4 M8);`doc.querySelectorAll('.site-button--filled').length === 0`;恰一 `[data-abi-row][data-rec]` 且 = universal;在线体验卡 `rel` 含 noopener;商店占位 disabled 在;「如何确认手机架构」三行小表在(spec §9 默认加)。
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
  expect(doc.querySelector('#相关链接, [data-faq-section]'))/* 节名断言 */;
  expect(HTML).not.toContain('相关链接');
});
it('渲染子集出 HTML:a 标签/ul/ol/code/pre 各≥1;pre 带 translate="no"', …);
it('本页豁免禁问句闸:问号只允许出现在 [data-faq-q] 内', () => {
  // body 文本剔除 data-faq-q/article 标题后零「？」——防正文混入问句
});
it('尾卡正面陈述 + Issues/Discussions/QQ 群三链', …);
it('TOC 链接 href 均为页内 #锚点且 target 存在', …);
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
- Modify: `src/pages/index.astro`、`src/pages/en/index.astro`、`src/components/sections/Download.astro`(瘦身版:主页与工具页共用组件的 props 分流,或直接主页只渲染 SchoolsCard+新出口段)、`src/styles/global.css`(.entry-card 样式)
- Test: `tests/page.index.test.ts`、`tests/page.en.test.ts`(§10 同 commit 改写)

**Interfaces:**
- Consumes: `rowCount/typeCount`;`zh.homeSchoolCard`;release.json universal URL;Task 4/5 页面路由
- Produces: 主页段序不变量 `hero→views→connect→schoolCard→reminders→gallery→trust→download`,schoolCard `data-prototype="entry-card"`、download 段 `data-prototype="tonal-band"` 保持;入口卡非岛(零 script)。

- [ ] **Step 1: 按 §10 改写两主页测试(先红)**

段序数组换七段+schoolCard;M4 块整体删除(去向已迁 page.schools.test.ts);M8 块改写为「恰一下载出口 = universal APK URL;其余三 ABI URL 与 sha 链、store 占位、releases/latest 全部绝迹于主页 HTML」负闸;文案 pin 改 §4 入口卡句;Filled=2 保持(AppBar S + hero XL),新增「download 段零 Filled」;「Android 8.0」pin 删除(迁 download 测试)。

- [ ] **Step 2: 实现 SchoolsCard + 主页瘦身出口段 + 路由接线**

入口卡:surface-container-low、左派生句(模板 `{rows}/{types}` 替换,禁手写)、右侧「搜索框样式入口按钮」(外观像 outlined field 的 `<a>`,href=`/schools/`,零 input);主钮链 universal APK 绝对 URL(release.json assets find name 含 universal)。

- [ ] **Step 3: build + 全量测试绿(此时 Schools.astro 旧组件删除,孤儿清理)**

Run: `npm run build && npx vitest run` → 全绿(§10 表全部有去向)

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/SchoolsCard.astro src/pages/index.astro src/pages/en/index.astro src/components/sections/Download.astro src/components/sections/Schools.astro tests/
git commit -m "feat(home): 主页四页化改造(台账离页/入口卡/下载单出口)与测试再基线"
```

---

## Task 8: 分发基建(OG 8 枚 + robots + RSS + JSON-LD + 404 + sitemap i18n)

**Files:**
- Create: `public/robots.txt`、`public/og/*.png` ×8、`tools/make-og.mjs`、`src/pages/404.astro`、`src/pages/rss.xml.js`、`tests/dist.seo.test.ts`(补全)
- Modify: `package.json`(+@astrojs/rss)、`astro.config.mjs`(sitemap i18n)、各页路由(ogImage/jsonLd props 接线)

**Interfaces:**
- Consumes: Task 2 Base props;release.json;site 常量
- Produces: 构建产物 `dist/client/{robots.txt, sitemap-index.xml, rss.xml, 404.html, og/*.png}`;`/` 页 `<script type="application/ld+json">` 恰一。

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

- [ ] **Step 3: robots.txt + astro.config sitemap i18n 配置(zh/en alternate 对)+ 404.astro(双语并列、四页链、Base preloadHero=false)**

- [ ] **Step 4: OG 生产(tools/make-og.mjs:模板 HTML→Chrome headless 截图 1200×630→public/og/;8 枚一次生成;wordmark+主张大字取 §4 句+右下真机截图元素)**

脚本是作者工具不进构建路径(注释写明,防实现者挂 build)。主张文案入图时点冻结(spec R7)。

- [ ] **Step 5: 各路由接 ogImage/ogImageAlt/jsonLd;build + dist.seo 全绿 + `wrangler pages dev` 手验 /no-such-path 返回自定义 404**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(seo): 分发基建(OG 8 枚/hreflang 矩阵/robots/RSS/JSON-LD/404/sitemap i18n)"
```

---

## Task 9: 三缺口修(chip 升档 + weekview 第 5 卡 + color-scheme/translate-no)

**Files:**
- Modify: `src/styles/global.css`(.site-chip corner-full + is-active secondary-container + leading check SVG 位 + `color-scheme: light dark` on html)、`src/components/sections/Reminders.astro`(第 5 卡)、`src/components/pages/FaqBody.astro`(TOC chip 条套新形)、`tests/page.index.test.ts`(组件墙五件断言)、`src/tokens/global.a11y.test.ts`
- Test: 追加断言——chip 规则含 `--md-sys-shape-corner-full`;`.site-chip.is-active` 含 secondary-container;hover 变体在 `(hover:hover)` 闸内;reduce 块含 chip transition 归零;`color-scheme` 在顶层 `<html>` 规则。

- [ ] **Step 1: 写失败断言**(global.a11y.test.ts + page.index.test.ts「五件 data-widget」含 weekview)→ FAIL
- [ ] **Step 2: 实现三修**(weekview 卡并入扁条列,墙=周网格竖卡 + today/twodays/weeklist/weekview 四扁条;`<pre>` 输出处加 `translate="no"` 已在 T6 落,此任务全站复查)
- [ ] **Step 3: build + 截图目检 chip 四态(default/hover/active/checked × light/dark)+ 全量绿**
- [ ] **Step 4: Commit** `fix(site): 特征 chip 升档 + 组件墙周视图卡 + color-scheme 声明`

---

## Task 10: 终验(全量闸 + 目检矩阵 + 验收清单核销)

**Files:** 无新文件;`docs/superpowers/checklists/`(如需要记录核销)

- [ ] **Step 1:** `npm run data && npm run build && npx vitest run && npx astro check` 全绿,记录真实输出
- [ ] **Step 2:** spec §8 验证清单 16 项逐条核销(每条给证据:测试名或产物路径)
- [ ] **Step 3:** 目检矩阵截图:8 路由 × light/dark × 1440/375(chrome-devtools MCP 或 `wrangler pages dev`),发现视觉缺陷回相应任务修
- [ ] **Step 4:** JS-off 验收:`wrangler pages dev` 下禁 JS 四页可读 + details 手开
- [ ] **Step 5:** Lighthouse mobile 四页 vs v4 基线对比(a11y/perf ≥ 同段),数字记录进 PR 描述
- [ ] **Step 6:** 提交收尾 + 按 pr-lifecycle 开 PR(~600 行上限若超,按任务边界拆两个 PR;push 前 `git log` 扫 Fixes/Closes/Resolves)

---

## Self-Review(计划作者核)

1. **Spec 覆盖**:§2.1 路由=T4-T8;§2.2 主页=T7;§2.3 schools=T4;§2.4 download=T5;§2.5 faq=T3+T6;§2.6 分发=T2(og/preload/hreflang)+T8(全量);§3 四缺口=T9(chip/weekview/color-scheme)+T6(translate-no)+T4(折叠);§4 文案=T1;§5 动效分散在各 UI 任务;§8 验收=T10;§10 再基线=T1/T2/T4/T5/T7/T8 各自同 commit。**无缺口**。
2. **步骤扫描**:每步单一动作;测试断言给足 spec 值(348/34/27/广东东软学院/6144B);实现体留给签名+测试可推导的部分,FAQ 解析器给了规则行而非代码。
3. **类型一致**:`parseUrlState/filterRows/writeUrlState` T4 定义、T10 复用无改名;BaseProps `path/mirror/ogImage/ogImageAlt/preloadHero/jsonLd` T2 定义、T4-T8 消费一致;`faqPage/downloadPage` 键名 T1 与 T5/T6 一致。
4. **Review Focus 6 条**:1→T2 Step1;2→T1 Step3;3→T4 Step1;4→T8 Step1;5→T3 Step2+T6 页脚断言;6→T4 Step3 空组断言(补充:`filterRows` 后组壳 `details` 全 hidden,断言「无可见空 summary」)。
5. **比例**:计划约 350 行对 200 行 spec,接口与测试占主体,无逐行转录。可执行。

