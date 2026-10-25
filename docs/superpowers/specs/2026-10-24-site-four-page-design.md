# Sleepy 官网 v5 · 四页架构设计方案

**Verdict:** READY(待签收)
**Artifact:** docs/superpowers/specs/2026-10-24-site-four-page-design.md
**基线:** v4 单页(已上线 main `cad9f04`)。本文只描述 delta;v4 未提及者一律不动。

## 0. 意图与验收

- **业务结果**:把"被说服"(主页)与"来查东西"(学校/下载/FAQ)分开;营销叙事一条直线,工具页各归其位。
- **四页**:`/`(主页,下载段瘦身为单一出口)、`/schools/`(学校查找,独立工具页)、`/download/`(下载中心,承接 Footer 全部外溢链接)、`/faq/`(FAQ,内容源=主仓 FAQ.md 快照)。每页 zh 主 + `/en/` 镜像 = 8 路由,静态。
- **非目标**:不改品牌/色板/字阶/token 管线;不做搜索无结果的服务器端(纯静态);不做 wiki 搬运(仅 FAQ.md 范围)。
- **验收**:测试基线 = v4 的 207 条,按 §10 再基线清单逐条处置后全绿(未涉及断言零回归,禁无去向删除);新页面进 sitemap;hreflang 互指正确;JS-off 四页全内容可读;Lighthouse mobile a11y/perf ≥ v4 同段基线;每页每语言 OG 图存在且被 og:image(绝对 URL)引用;robots.txt/sitemap/RSS 三者线上可达;404 自定义页接管 CF 默认页。

## 1. 仓库事实(已核实,非假设)

- FAQ.md:9 节(含「相关链接」)· 34 问,含两枚 ```sh 代码块;`faqUrl` 现为 GitHub 外链(ui.ts:7)。**34 问全部以「？」结尾**,与站点禁问句闸(i18n-leak-check FORBIDDEN `/\?|？/`)正面相撞,豁免条款见 §4。
- Footer 六链:releases/latest · 在线体验 · 仓库 · FAQ(外链) · 赞助 · Issues;另有回顶+build 行。
- 下载数据:release.json(tag/date/4 assets 带 size/sha256sumsUrl/builtAt,无 minSdk 字段——minSdk 文案在 i18n 键 `download.minSdk`='Android 8.0')。CI 的 build-deploy **每次都跑 `npm run data`**(deploy.yml:36)且有 nightly 定时刷新(cron 18:00 UTC = CST 02:00);本地 `npm run build` 不重跑。版本新鲜度由 CI 自动维护,assert-release 守卫只服务本地/离线构建(§2.4)。
- 学校数据:schools.grouped.json 348 条(province.code/type/sortKeyFull/aliases;GD=27 行);lib/schools-view 提供 rowCount=348/typeCount=33/provinceCount=29/provincesOrdered/typesOrdered。search.ts 现只有 normalize + matchSchool 两个纯函数(仅 q 一态);**三态过滤逻辑内联在 Schools.astro:171-221,且 :181 复制了一份 norm**——新页接线=抽取内联过滤复用 search.ts 并删 norm 副本(§2.3)。
- 组件资产:widget-weekview-{light,dark}.png 在档,Reminders 墙未 import(用户指出的缺口①)。
- `.site-chip` = 8px 圆角矩形描边(global.css:209-216),非 MD3 特征件(缺口②)。
- Schools 列表手机端 `max-block-size:none`(Schools.astro:138),348 行全摊开(缺口③)。
- en 页机制:src/pages/en/index.astro 镜像同构段序;新页沿此模式。
- Astro `output:'static'`,sitemap 集成已挂(新路由自动进);tests/i18n-parity 锁键树同形。
- 分发基建现状(canonical/hreflang 单页假设/og 无图/无 robots/无 404/无 RSS)已逐项核实,见 §2.6。

## 2. 页面建筑

### 2.1 路由与出口
```
/          主页(叙事+转化直线)
/schools/  工具:348 台账(叙事页只留 CTA 入口卡)
/download/ 出口中心:全部下载物 + Footer 迁来的六链
/faq/      帮助:FAQ.md 快照渲染
/en/*      四页各镜像
分发物(§2.6): /rss.xml · /sitemap-index.xml · /robots.txt · 404.html · /og/*.png ×8
AppBar 锚点(不变量写法,修复 v4 单页假设):锚点顺序恒为 功能 → 学校 → 问答 → 组件;href 一律**绝对路径形式**——锚点项 = `/#views`、`/#reminders`(在任意页面点击均回主页锚点),页面项 = `/schools/`、`/faq/`(zh)与 `/en/schools/`、`/en/faq/`(en 镜像);label 沿用四字防泄漏形式「功能/学校名录/常见问答/组件」(裸「学校」撞 EN 泄漏闸:zh.ts 含汉字叶子会在 EN 页被校名子串命中,10 个真实校名含「学校」)。[下载]S 钮 href 改 `/download/`。
Footer(全站,瘦身): 下载(/download) · 学校(/schools) · 问答(/faq) · 开源仓库(外链) · 语言 · build 行
```
主页原 #schools 段删除;AppBar「学校名录」锚点改页面链接 /schools/,hero 不加新出口(CTA 维持下载+体验两枚,v4 C1/LCP 与 Filled 计数不动),Schools 入口卡自带 CTA「查找我的学校」链 /schools/。

### 2.2 主页 `/`
- 段序:Hero → Views → Connect → **[新] Schools 入口卡** → Reminders(墙补第 5 种组件) → Gallery → Trust → **[瘦] Download 出口段**。
- Schools 入口卡(surface-container-low,非岛):左=「348 所高校 · 33 种教务协议,按省份与协议检索」(两数一律派生自 schools-view 的 rowCount/typeCount,禁手写——v4 计数闸同规则) + 两个数字(tnum);右=一枚搜索框样式的**入口按钮**(样式像搜索框但非 input,防误导;href=`/schools/?focus=s`——审计 I2 裁决:「点击跳 /schools/ 并聚焦真搜索框」由 /schools/ 岛读 `focus=s` 参数显式聚焦承接,与 §2.3「autofocus 默认关」不冲突:聚焦来自用户点击而非页面自动弹出);"你学校在哪一档"式设问禁(沿用 v4 文案 R 规则)。禁内嵌筛选交互。
- Download 出口段(primary-container tonal 带不变):主按钮 [下载 Android] → **直接指向 release.json 的 universal APK**(主推) + 次行 Text 链「其他架构与校验 →」(/download/)+ 版本行 tag·日期(tnum)。原 ABI 行列表、sha 链、商店占位、体验链全部移出主页。
- 主页 scroll 高度从 8 段缩到 ~6.5 段(台账 348 行离页,省最大块)。

### 2.3 学校查找 `/schools/`
```
┌ AppBar(复用,锚点态:本页) ┐
│ 页头: 收录与检索           │ headline-large + body 一行说明(正面陈述)
│ ┌ 工具岛(桌面 sticky 顶栏) ┐│ search input(outlined text-field, autofocus 可选)+ 省份 chip 行 + 协议 chip 行
│ │ 结果计数: 显示 1 / 348     ││ 实时过滤(抽取 Schools.astro 内联三态过滤进本页岛,复用 search.ts 的 normalize/matchSchool,删 :181 norm 副本);无结果=空态卡:「未收录的学校可在 GitHub 提交适配申请 →」(带 school_adaptation.yml 模板深链,模板已在主仓 .github/ISSUE_TEMPLATE/ 核实存在)
│ └──────────────────────────┘│
│ 桌面: 全量列表段内滚动 70vh  │ 省份分组 h3 粘性小标题(sticky within list)
│ 手机: 省份组折叠             │ details/summary:「广东 · 27 ▸」一行一组(GD 实数 27),点开才展开;全展开开关(工具条右侧 Text 钮「展开全部」)
│ URL 状态: /schools/?p=GD&t=nuit&q=东软 │ 可分享可回退(纯前端 pushState,无框架;示例为真实命中:广东东软学院)
│ 底: 数据说明行(更新于 YYYY-MM-DD + 「名录随适配更新」+ 提交适配 CTA) │
└ Footer ┘
```
- 折叠实现:**markup 每省组 `<details>` 默认关**(JS-off 手机=一行一组可手开,满足缺口③原始诉求;收起组内容仍在 HTML,SEO 完整);JS 增强两条:>840px 视口即全组补 `open`(桌面直铺滚动,v4 交互不变),点省份 chip 时开对应组并 scrollIntoView(§8「全部组 details 可手开」断言以默认关态为验收态)。
- **大列表渲染闸(Web Interface Guidelines 合规通道)**:348 行不虚拟滚动(§7 决策不变),改省份组容器 `content-visibility: auto` + `contain-intrinsic-size`——规则给出的两选项之一,零 JS、JS-off 无损、SEO 完整保留。
- **过滤结果播报**:计数行 `role="status"` 已有(Schools.astro:33,新页照搬);搜索框 label 隐藏文本已有(v4 合规,新页沿用);placeholder 以 `…` 结尾(既有键改齐);**autofocus 默认关**(规则:移动端慎用,键盘弹出遮挡台账);交互件 `touch-action: manipulation`。
- URL 状态反射(§2.3 图示)本就是该规则的核心项:filters 进 query params 已满足;"展开全部"开关态**不进 URL**(瞬时视图态,分享价值零——签收可改)。
- LCP=页头文本,列表 `loading=lazy` 不适用(无图);JS 预算:本页岛 ≤6KB(比 v4 内嵌版更小,列表渲染已在 HTML)。
- 348 行全量静态渲染进 HTML(SEO:每校名可被搜索到),无分页;gzip 后增量 <30KB。

### 2.4 下载中心 `/download/`
```
│ 页头: 下载 Sleepy + 版本行(tag·minSdk·日期,tnum)+ [推荐]大按钮×1(universal) │
│ ABI 行列表(桌面表格感/手机行卡,复用 v4 Download 行样式):                      │
│   arm64-v8a  绝大多数新手机        4.4 MB  [↓]                                  │
│   armeabi-v7a 32 位老设备          4.4 MB  [↓]                                  │
│   x86_64     模拟器                4.4 MB  [↓]                                  │
│   universal  不确定架构时选它      4.5 MB  [↓] ★推荐标记                        │
│   (架构未知→universal 的正向引导文案;检测提示:「设置→关于手机→处理器」)      │
│ 校验: sha256sums.txt 链 + 「核对下载文件」一行方法说明                          │
│ 安装: 「允许未知来源安装」步骤三行(正面陈述)                                   │
│ 在线体验卡: 主应用外的浏览器体验 → sleepy.qdp.qzz.io(rel=noopener)             │
│ 商店: Google Play / 国内商店 —— 占位 disabled 态保留(现站即占位,如实呈现)      │
│ 更多: GitHub Releases(全部历史版本) · 源码仓库 · 赞助 · GitHub Issues           │← Footer 迁来的链接归位于此
└ Footer ┘
```
- 数据仍读 release.json 快照;版本行 = tag·日期(release.json 字段)+ minSdk(取 i18n 键 `download.minSdk`,release.json 无此字段)。**新鲜度守卫已由既有机制承担,不新增脚本(终审后 YAGNI 裁决)**:fetch-release.mjs 在线取 latest、失败即 exit 1「禁烘旧 tag 装绿」(:61-65),CI 每次部署与 nightly(cron 18:00 UTC = CST 02:00,deploy.yml:9-10、:36)都跑 `npm run data`——快照过期不可能静默进线上;`--offline` 模式自带警告(:52-53)。原方案的 assert-release.mjs 废除。
- 主页→本页唯一跳转,本页无内部叙事负担:纯出口页,primary-container 单 tonal 底,无 reveal 编排(工具页动效=仅 hover/press)。**CTA 纪律(§11-6 多页化延伸)**:本页主按钮 = **Elevated 档**(沿用 v4 Download 段答案,彩色容器上禁 Filled 叠 tonal),全页零 Filled;AppBar [下载]S 钮在非主页各页**恒隐**(visibility:hidden 保留占位,复用 v4 hide 态),消除「屏上恒见两枚 Filled」。

### 2.5 FAQ `/faq/`
```
│ 页头: 常见问答 + 一行(「回答只覆盖当前发布物能核实的事实」+ 更新日期)        │
│ 左栏(桌面 sticky): 8 节目录(实测 9 节剔除「相关链接」后 8),滚动高亮当前节 IO; 右栏: 问答正文 │
│ 手机: TOC 横滑胶囊条(复用新 chip 形状)粘在页头下,点条目即滚至锚点           │
│ 每问: <details>?—— 否。全展开直排(可搜索可分享,答案短,#锚点 每问一个)       │
│ 代码块: 编译/测试两段保留 <pre>(等宽,横滚)                                  │
│ 尾卡: 「以上未覆盖的问题可在 GitHub Issues 反馈」(正面陈述,禁设问) → Issues · Discussions · QQ 群 │
└ Footer ┘
```
- **渲染子集(写死,防实现各修各的)**:build-faq 输出结构化 JSON(节→问→答案),答案体支持 markdown 子集 = 链接(含 `issues/new?template=school_adaptation.yml` 深链)、无序/有序列表、行内 code、段落;其余按纯文本。FAQ.md 顶层单 `#` 总标题与 `>` 引言由解析器跳过(节 = `##`,问 = `###`)。「相关链接」节不渲染进页(已由 /download/ 与 Footer 承担)。
- **禁问句闸豁免(FAQ 页特有,§4 同条)**:FAQ.md 34 问标题全部以「？」结尾且不可改(主仓真值,改标题=跨仓改文案)。禁问句两道闸的适用范围因此明确为 i18n 键树与页面自有文案:tools/i18n-leak-check.mjs 扫 zh.ts/en.ts(faq.json 非键树,天然不扫),测试「问号正则 body 零命中」断言只挂主页/学校/下载/404 四页 body,**/faq/ 页豁免**(zh 与 en 镜像同)。en 版 faq-en.md 的问句保留「?」同受此豁免。
- **内容管线(单一真值,双向不断)**:FAQ.md(主仓)是真值 → `scripts/build-faq.mjs` 解析 `### 问`/`## 节` → `src/data/faq.json`;CI 不自动拉主仓(两仓耦合,见风险 R5),人工 `npm run data` 重跑;**FAQ.md 自身含中英双语?** 否,现仅中文 → **en 版**:faq.json 加 `en` 字段,译文放 scripts/faq-en.md(同仓),两处同步由 build-faq 校验条数一致(数量不等→构建失败,替代键树闸)。
- 页面 tonal:surface 底(纯内容页,与主页色阶带不连续——靠 AppBar+Footer 框架统一,非色彩)。

### 2.6 分发基建(分享图 / SEO / sitemap / RSS / 404)
现状核实(非假设):canonical 已有(Base.astro:53);og:title/description/url/locale 已有;**twitter:card 声明了 summary_large_image 但全站无一张 og:image**(承诺了大图却给不出,分享态=纯文字卡,缺口);hreflang 三链已有但硬编码单页假设(zh-CN 恒指 `/`),多页化必改;无 robots.txt、无 404 路由、无 RSS;sitemap 集成已挂(@astrojs/sitemap ^3.7.4)默认全收;Base.astro 的 hero 图 preload 目前**无条件**发出(:16-27 顶层 await getImage + :69-75 link)——新页与 404 不带 hero,须加开关(见下第 8 条)。

1. **OG 分享图(每页每语言,8 枚)**:`public/og/{home|schools|download|faq}-{zh|en}.png`,1200×630 标准尺寸。版式全站一套模板:品牌紫 primary-container 底 + Sleepy wordmark + 页面主张大字(与 §4 文案同源)+ 右下角真机截图元素(复用已入库资产,零新摄影)。**实现路线=作者工具离线出图,一次性入仓**:HTML 模板(1200×630 定尺)→ 本机 Google Chrome headless(`--screenshot --window-size=1200,630`,已核实本机存在,rsvg-convert/imagemagick 均无)→ PNG 入 `public/og/`。零新增运行时依赖、构建即静态复制;否掉 satori/sharp 构建时生成(纯静态站加图像处理依赖=为一次性的事付持续成本)。Base.astro 补 `og:image`/`og:image:alt`/`twitter:image`,按页传入,**值必为绝对 URL**(site 前缀 + 路径;OG 爬虫不解析相对路径)。构建闸:8 枚文件存在性断言**读 public/og/**(新测试自持路径,assets.test.ts 现读 src/assets/screenshots/,路径约定不同,不复用其 read())。
2. **hreflang 多页改造**:Base props 的 `mirror` 升级为语义对——每页 hreflang zh-CN/en 各指**本页自身双语对**(不再恒 `/`),x-default 仍 `/`。这是四页化的既有缺陷修复项,不是新功能。
3. **SEO per-page**:title/description 走 Base props(机制已有),四页 × zh/en 各写独立 title 模板(「{页面名} · Sleepy」)/description(≤160 字符,派生数字同 §4);JSON-LD 只发一份=**SoftwareApplication**(homepage,字段全取可核实事实:name/operatingSystem=Android/softwareVersion=release.tag/URL downloadUrl=universal APK/license=GPL-3.0/sameAs=repoUrl/image=og home);**不发 FAQPage schema**(Google 2023 起对普通站点不再展示 FAQ 富结果,写了是死重——决策 D8);BreadcrumbList 不做(4 页站点,导航链价值为零)。
4. **robots.txt**:`public/robots.txt` 静态文件——`User-agent: * Allow: /` + `Sitemap: {site}/sitemap-index.xml`(Host 行不加,Bing 已弃用)。
5. **sitemap**:@astrojs/sitemap 默认已收 8 路由;补 `i18n` 配置项使每条 sitemap entry 带双语 alternate(与 hreflang 矩阵同构互证);404 与 `/en/404` 不进——**已核实包自身剔除**(v3.7.4 dist 硬编码排除 404 且覆盖 locale 前缀),零代码,勿加多余 filter。
6. **RSS**:`/rss.xml` = **版本动态 feed**(此站唯一时间序列内容=release;受众是周更节奏的跟随者)。实现=@astrojs/rss 官方包(npm 4.0.19,依赖 fast-xml-parser/piccolore/zod,与 astro 7.4.0 可共存)——**本方案唯一新增依赖,计 package.json dependencies(非 dev:运行时路由要用)+ npm ci 镜像策略照旧**;§7 决策表「拒绝图像运行时依赖」的成本口径同样适用于它:一次官方小包换手写 XML 转义风险,判定值得。`src/pages/rss.xml.js` 单路由,items=release.json 当前条目 1 条(title=v1.0.61,pubDate=release date,链接=/download/,正文含 ABI/sha/348 校事实行)。单 feed zh-CN 为主,version/tag 本身语言中性,双语双 feed 零增益——重开条件:出现博客/更新日志类叙事内容。HTML `<head>` 加 `<link rel="alternate" type="application/rss+xml">` 可发现性挂位。
7. **404**:`src/pages/404.astro`(Astro 静态出 404.html,CF Pages 自动接管,替代裸 CF 默认页——已核实 CF 官方文档:顶层 404.html 接管未命中路径)。内容=页头一行「这个路径不在名录里」(正面陈述,不道歉)+ 四页链接列表(复用 AppBar 锚点数据源)+ 中文为主一行英文尾句(404 无语言协商,双语并列);noindex 自动(非 sitemap 路由)。
8. **Base hero preload 开关**:Base.astro 现无条件为 01-week 图发 `<link rel=preload>`——工具页/FAQ/404 无此图,背着死 preload 违反 §0「Lighthouse ≥ v4 基线」。Base 加 prop `preloadHero?: boolean`(缺省 false,仅主页/`en` 主页传 true),getImage 调用同条件化(省每页一次构建期图像处理)。v4 主页 preload=高优先图断言(page.index/page.en)不受影响。

## 3. 三项缺口修(并入本方案)

1. **组件墙**:Reminders.astro import widget-weekview-{light,dark},墙成 5 卡(周视图卡并入扁条列,today/twodays/weeklist/weekview 四扁条,网格仍主角卡)。
2. **特征 chip**(全站 `.site-chip` 升档,设计意图表述,不援引 MD3 规范背书——MD3 suggestion chip 实为 8px 圆角,corner-full 胶囊形态是本站的主动选择):border-radius `corner-full`;选中态=secondary-container 填充 + leading check 小图标(SVG inline,12px);省份 chip leading 定位针、协议 chip leading 连接点、FAQ TOC 横滑条同套;hover 描边加深不爆炸;触屏无 hover 闸照旧。**消费现有 token,零新色值**。
3. **手机台账折叠**:随 /schools/ 独立页落地(§2.3),v4 内嵌 Schools 段删除。
4. **规则清单带出的 v4 小缺口顺带修**(零结构风险):global.css `<html>` 补 `color-scheme: light dark`(暗档滚动条/原生控件底色修正,theme-color meta 已有但 CSS 侧未声明);FAQ.md 代码块与新页 `<pre>` 区加 `translate="no"`(品牌词/命令防机翻污染)。

## 4. 文案(四页全 zh/en,零设问)

- 主页入口卡:「348 所高校 · 33 种教务协议,输入校名即可确认收录。」CTA「查找我的学校」(数字派生,同上)
- /schools/ 页头副:「名录按省份与教务协议分组,支持校名或拼音检索。」(v4 R2/R3 规则延续)
- /download/ 推荐行:「不确定手机架构时选择 universal。」
- /faq/ 页头:「以下回答只覆盖当前发布物能核实的事实。」尾卡:「以上未覆盖的问题可在 GitHub Issues 反馈。」
- **禁问句规则范围条款(新,防 FAQ 页自红)**:「零设问」约束 i18n 键树与页面自有文案;FAQ.md 的 34 个问句标题(全部带「？」)是主仓真值快照,不受此约束。i18n-leak-check 只扫 zh.ts/en.ts(faq.json 非键树),测试问号正则只挂主页/学校/下载/404 四页,/faq/(zh+en)豁免。
- en 镜像全部同形同条;落 zh.ts/en.ts 新键 `schoolsPage/downloadPage/faqPage/homeSchoolCard` 四组;键树闸(i18n-parity)自动覆盖新键;**新增锚点 label 用四字防泄漏形式**(裸「学校」会作 zh.ts 汉字叶子在 EN 页被 10 个含「学校」的真实校名子串命中,泄漏闸必红——现键值「学校名录」即此形态,沿用)。

## 5. 动效

- 四页共用 v4 的 reveal 语法(16px/400ms/emph-decel/60ms);**工具页(/schools /download /faq)禁编排**:仅 reveal 一次 + hover/press;主页 Hero 编排预算不变,clip-path 显影仍全站唯一(Connect 段)。
- /schools 折叠动画:details open 用 grid-template-rows 0fr→1fr 200ms(唯一容忍的非 transform 属性,reduce 档直切);/faq TOC 高亮 = color 150ms。

## 6. 风险与对策

| # | 风险 | 对策 |
|---|---|---|
| R1 | release.json 过期→下载中心陈旧 | 既有 fetch-release 在线取 latest、失败 exit 1(禁烘旧 tag 装绿)+ CI 每部署与 nightly 自动重跑 data(已核实 deploy.yml:9-10/36),过期无法静默上线;主页只链 universal,影响面小 |
| R2 | faq 双语条数脱钩 | build-faq 数量校验即构建失败 |
| R3 | /schools 348 行 HTML 体积 | gzip 实测 <30KB 增量,无 JS 渲染负担;若超标→改省份组内延迟填充(仅 JS-off 保真) |
| R4 | FAQ.md 更新忘重跑 | 页脚「更新于」直读 FAQ.md 内声明日期,差异目检可发现 |
| R5 | 跨仓耦合不自动 | 有意为之:两仓独立部署,自动拉取会引入 CI 密钥与顺序耦合 |
| R6 | hreflang/mirror 断链 | Base layout 已有机制,新页传入各自 mirror;测试新增断言(§2.6-2 同改造) |
| R7 | OG 图与文案漂移 | 图模板离线一次性排版,主张文案入库时点冻结;§4 文案改版=同批重渲 8 枚(assets.test 存在性闸防漏) |

## 7. 决策与取舍

| 决策 | 选定 | 否掉 | 理由 |
|---|---|---|---|
| FAQ 内容 | FAQ.md 快照管线 | 手抄进 i18n 键 | 单一真值;手抄双源必漂移 |
| FAQ 展开 | 全展开直排 | 问题级 accordion | 可搜索/可锚点/JS-off 可读;问短无需折叠 |
| /schools 渲染 | 全量静态 348 行 | 分页/虚拟滚动 | 348 行量级静态无压力;虚拟滚动毁 SEO+JS 预算 |
| 手机折叠 | 原生 details | 自建 accordion JS | 零成本 JS-off;增强只做定位展开 |
| 主页下载 | 单一 universal 钮 | 保留 4 ABI 行 | 决策疲劳 vs 少数场景;细节归 /download |
| 商店占位 | 保留 disabled 如实态 | 删掉 | 现状即占位;不造假也不丢未来接口 |
| URL 状态 | pushState 可分享 | 仅内存态 | 工具页核心价值:把"我学校=东软@GD"发给同学 |
| OG 图生产 | 预排版 PNG 入仓 | satori/sharp 构建时生成 | 8 枚一次性资产不值得引入图像运行时依赖;静态即最可靠 CDN 态 |
| FAQPage schema | 不发 | 按 FAQ 页标注发 schema | Google 2023 起对非权威站点停展 FAQ 富结果;死重代码零收益,页面本身已可被索引 |
| RSS 范围 | 单 feed=版本动态 | 双语双 feed / 更新日志频道 | 站唯一时序内容=release;version/tag 语言中性,双语无增量。重开:出现叙事性更新日志 |
| JSON-LD 铺法 | 仅 homepage 一份 SoftwareApplication | 每页铺 + BreadcrumbList | 4 页站无层级可言;转化证据集中在主页,其余页 canonical+OG 已足 |

## 8. 验证清单(实现后)

- [ ] 8 路由全构建进 sitemap;robots 自动覆盖;sitemap 条目恰 8 路由零 404(@astrojs/sitemap 自带剔除,断言产物即可)
- [ ] i18n-parity 含四组新键 zh=en 条数同形;新锚点 label 零 EN 泄漏(泄漏闸覆盖)
- [ ] /schools JS-off:搜索框隐藏态、全部组 details 可手开、348 行在 HTML;URL 深链 `/schools/?p=GD&t=nuit&q=东软` 加载即命中(真值:广东东软学院 1 条)
- [ ] /faq 渲染问答对数 = faq.json = FAQ.md `###` 计数(34,脚本断言);渲染子集验证:链接/列表/行内 code 出 HTML,两枚 pre 在位;尾卡文案正面陈述(零「？」)
- [ ] /download 主钮=Elevated 且页内零 Filled;AppBar CTA 在四工具页恒隐(visibility:hidden);主页瘦身段唯一钮指向 universal APK URL
- [ ] 跨页锚点:`/faq/` 与 `/schools/` 上 `/#views`、`/#reminders` 解析到主页锚点(断言 href 以 `/#` 开头,非裸 `#`)
- [ ] chip 新形:reduce 档/hover 闸/focus-visible ring 全在
- [ ] 测试再基线:§10 清单逐条处置,**每条作废/改写都有去向**,其余既有断言零回归
- [ ] 目检:四页 × zh/en × light/dark × 1440/375 截图
- [ ] 分发闸:8 枚 OG 图文件存在(public/og/)且各页 og:image/twitter:image 指向本页对应图(绝对 URL,测试断言)
- [ ] hreflang 矩阵逐页断言:8 路由各含 zh-CN/en 双指本页对(旧单页恒指 `/` 绝迹)
- [ ] `/robots.txt`、`/sitemap-index.xml`、`/rss.xml` 构建产物存在;RSS 可解析含 ≥1 item 且链接指 /download/
- [ ] 404:任意死链返回自定义 404.html(CF Pages 本地 `wrangler pages dev` 复现,非仅路由文件存在)
- [ ] JSON-LD:ld+json 恰一、可 JSON.parse、softwareVersion=release.tag、downloadUrl=universal 资产 URL
- [ ] 非主页零死 preload:`/schools/`、`/download/`、`/faq/`、404 的 head 不含 01-week preload;主页 preload 断言(v4 两处测试)仍绿

## 9. 留给实现者的自由度(我的默认,签收可改)

- /schools 桌面 sticky 工具岛高度与阴影档(默认 outlined 无影,filled 岛)
- FAQ 代码块语法高亮(默认无高亮,纯 pre)
- 下载页是否加「如何确认你的手机架构」三行小表(默认加,arm64=绝大多数 2020 后机型)
- AppBar 锚点四项文案微调空间(默认:功能/学校名录/常见问答/组件,顺序按 §2.1 不变量;改词须保持四字防泄漏形态,F3 教训)

## 10. 测试再基线清单(终审 F1 落规,与实现同 commit)

v4 spec 已立法「旧契约的删除是有意的,禁先改实现后补测试」。v5 删除/改造被测段,以下既有断言必红,逐条给去向——**TDD 顺序:每个任务先改测试(红)再改实现(绿),测试与实现同 commit**:

| 既有断言 | 处置 | 去向 |
|---|---|---|
| page.index.test.ts:36-43 八段 ids 数组 + PROTOTYPE 表 | 改写 | 八段依序(hero/views/connect/schoolCard/reminders/gallery/trust/download——v4 八段删 schools 换 schoolCard,净数仍 8,审计 I3:勿按「七段」写长度断言)+ 新入口卡原型 `entry-card`;同文件加「#schools 段绝迹」负闸 |
| page.index.test.ts:96-101 AppBar 4 锚点 `#views/#schools/#reminders/#trust` | 改写 | 新锚点集 `/#views · /schools/ · /faq/ · /#reminders` 四 href 精确断言(信任移 Footer;顺带修 F2) |
| page.index.test.ts:171-173 文案 pin「全部收录按省份…」+「收录与检索」(主页 body) | 迁移 | 两串随文案迁 tests/page.schools.test.ts(/schools/ 页头);主页 body 改 pin 入口卡新文案 §4 句 |
| page.index.test.ts:170 「在线体验提供完整功能,无需安装。」(download.trial,主页 body pin) | 迁移 | → page.download.test.ts(Task 5 在线体验卡文案 pin 同串);Task 7 主页瘦身段移除 trial 链后主页必红,随段迁 |
| page.index.test.ts:223-243 M4 整块(348 行/statLine/校名非链接/connect chip 派生) | 迁移拆分 | 348 行 + 非链接 + details 折叠 → page.schools.test.ts;statLine 派生串改 pin「{rowCount} 所高校 · {typeCount} 种教务协议」(入口卡与工具页各一次);connect chip 断言留主页测试(段未动) |
| page.index.test.ts:276-283 M8(4 ABI URL+sha+store 占位+releases/latest) | 迁移拆分 | 全部 → page.download.test.ts;主页测试改写为「恰一下载出口=universal APK URL,其余 ABI URL 绝迹于主页 HTML」负闸 |
| page.index.test.ts:284-290 elevated/tonal/Filled=2 | 改写 | 主页 Filled 计数重算:AppBar S(hero 相交时显)+ hero XL = 仍 2(瘦身段主钮改链 universal,**Elevated 档**,不破 §11-6);新增断言「download 段零 Filled」 |
| page.index.test.ts:293 'Android 8.0' | 迁移 | → page.download.test.ts(minSdk 文案随段迁) |
| page.en.test.ts:44-62 同构八段 + :63-67 AppBar 4 锚点 | 同步改写 | 与 zh 侧同批同 commit(en 镜像页测试同迁;新锚点集 en href 四枚 `/en/#views · /en/schools/ · /en/faq/ · /en/#reminders`) |
| page.en.test.ts:69-71 `.appbar__lang` href=`/` | 保留 | 语言链多页化后两主页 mirror 值不变(en 主页 mirror=`/`),用例作回归守卫,Task 2 须仍绿 |
| page.index.test.ts:104-127 CTA 互隐闸(show-pin :110 + IO 机制锁 + 方向锁 + 占位锁) | 改写 | :110 字面 `data-appbar-cta="show"` 随缺省态 prop 化失效 → 三元正则 `hasHero ? 'show' : 'hide'` 方向锁;IO 引用 #hero、`isIntersecting ? 'hide' : 'show'` 方向锁、hide 态 visibility:hidden 且禁 display:none 的占位锁三条原样保留(Task 2 同 commit) |
| page.index.test.ts:199-201 「FAQ 外链钉死」FAQ.md URL | 改写 | ui.ts `faqUrl` 站内化与之一体:断言改站内 `href="/faq/"`(Task 2 同 commit;消费方 Trust.astro:38 与 Footer:33 随 ui.ts 自动生效,两文件零引用改动) |
| page.index.test.ts:65-67 `img[fetchpriority]` high/low 各恰一 | 保留 | 计数闸作用于主页:Hero 段未动(全站 priority Shot 唯一消费方),改造后两主页仍恰一/恰一;新四页零 hero → 不设此闸;非主页「零 hero preload」由 dist.seo 用例覆盖 |
| page.en.test.ts:84-86 校名中文保留(schools[0].name 在 EN 页) | 迁移 | → page.schools.test.ts(真实校名保留策略随台账迁 /en/schools/;主页 EN 页删段后此串绝迹,Task 7 同 commit) |
| page.en.test.ts:88-96 en.ts 关键串 pin(en.schools.heading/en.download.trial 等) | 迁移拆分 | heading+sub → page.schools.test.ts(EN 页头);trial → page.download.test.ts(在线体验文案随段迁 EN);hero.slogan/gallery/trust 留主页测试(Task 7 同 commit) |
| src/tokens/global.a11y.test.ts:216-228 Footer describe 源码 pin(`{t.license}`/`{qqGroup}`/`{sponsorUrl}` + ui 源 `1063407652`/`sponsor.md`) | 改写 | Footer 瘦身同 commit(Task 2):license pin 保留;`{qqGroup}`/`{sponsorUrl}` 源码正 pin 翻为「Footer 源不含二者引用」负 pin;ui.ts 键 pin 全部保留(qqGroup/sponsorUrl 键不删,仍由 Trust.astro 消费) |
| 主页 footer 键组 `t.app/t.dl/t.trial/t.repo/t.community/t.qq/t.faq/t.sponsor` 八键 | 保留键清引用 | Task 2 Footer 瘦身即零消费方;删键需 zh/en 双文件同 commit 且无收益,键留、引用清(Task 2 同 commit 不删键) |
| page.index.test.ts:188-190 问号正则 body 零命中 | 保留 | 主页仍适用;新页测试同闸挂 schools/download/404,/faq 豁免(§4 范围条款) |
| src/tokens/global.a11y.test.ts:239 `read('../components/sections/Schools.astro')` + :246 `.schools__stat` markup 含 tnum | 迁移 | Task 7 删 Schools.astro 后 read 即抛 → 同 commit 改读 `src/components/pages/SchoolsTool.astro`,token 名换 `.schools__stat`(新页沿用)断言 tnum 仍在 markup;主页入口卡 tnum 断言 → page.index 的 schoolCard(§2.2 两数字 tnum) |
| src/tokens/global.a11y.test.ts:323-329 `read('../components/sections/Download.astro')` 两条 `.download__row:active` color-mix 正则 | 迁移 | 行样式随 Task 5 迁 DownloadPanel → 同 commit 改读 `src/components/pages/DownloadPanel.astro` 断言两正则(Task 7 主页 Download 段瘦身为单出口,`:active` 行 blend 绝迹于主页组件——I11 定死迁移路线,无分支可选) |
| page.index.test.ts:258-262 M5 组件墙四件 `[data-widget=weekgrid/today/twodays/weeklist]` | 改写 | 五件断言加 `weekview`(§3-1 第 5 卡);**去向 = Task 9 同 commit**(§10 前言「逐条给去向」自身要求,审计致命一之 7 补行) |

新增页测试文件(≥25 条,与 §0 验收呼应):page.schools.test.ts / page.download.test.ts / page.faq.test.ts / page.404.test.ts / dist.seo.test.ts(hreflang 矩阵+OG 8 枚+JSON-LD+robots/RSS 产物+preload 开关)。
