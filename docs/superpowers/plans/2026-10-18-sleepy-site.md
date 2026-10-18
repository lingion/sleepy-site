# Sleepy 官网实施计划(spec v3 落地)

> **For agentic workers:** 逐任务执行:红测试 → 实现 → 绿 → commit。checkbox 跟踪。契约=spec v3 全文(`docs/superpowers/specs/2026-10-18-sleepy-site-design.md`),冲突时以 spec 为准。

**Goal:** 在 `lingion/sleepy-site` 建成 Astro 静态双语官网,部署 Cloudflare Pages `sleepy.lingion.eu.cc`,满足 spec §8 全部九行落点。

**Architecture:** Astro 5 static(prerender 全量)+ 手写 M3 token CSS(构建期脚本从种子 #9B87FE 生成)+ 纯函数数据层(vitest)+ 2 个渐进增强 JS 岛(教务搜索/lightbox+主题)。GitHub Actions 为构建部署 owner,CF Pages 纯托管。

**Tech Stack:** Astro 5 · TS · vitest · @material/material-color-utilities@0.3.0 · Motion One · @astrojs/cloudflare · @astrojs/sitemap · wrangler(deploy)· @fontsource-variable/inter

## Global Constraints
- 分支:`feat/site-implementation`(自 main `010ef88`),main 只收合并;每任务一 commit
- 作者 `lingion <lingion@hrbeu.edu.cn>`(GIT_* env);🚫Co-Authored-By;🚫Fixes/Closes/Resolves(只 `ref #N`);🚫emoji;中文 subject
- verify 行 = 真实执行命令与输出
- 全部 JS ≤15KB gz;Lighthouse 移动四项 ≥95;红线词(赋能/极致/匠心)全文零出现
- push 与部署需用户批准;CF 凭据到手前 deploy.yml 只落盘不启用
- 教务通路(sleepy 主仓 schools.json 本体)零改动——官网只读

---

### Task 1: 脚手架 + 质量闸

**Files:**
- Create: `package.json` `astro.config.mjs` `tsconfig.json` `vitest.config.ts` `.gitignore` `.npmrc`(registry=npmmirror)
- Create: `LICENSE`(GPL-3.0 全文,复制主仓) `README.md`(项目一句话+开发命令)
- Create: `src/pages/index.astro`(占位 hello,后续任务替换)

- [ ] Step 1: `npm create astro@latest . -- --template minimal --no-install --no-git --typescript strict` 后覆写 package.json scripts:`dev/ build: astro build / preview: astro preview / test: vitest run / check: astro check / tokens: node scripts/gen-tokens.mjs / data: node scripts/fetch-release.mjs && node scripts/build-schools.mjs`
- [ ] Step 2: 依赖:`astro@^5 @astrojs/cloudflare @astrojs/sitemap @astrojs/check typescript vitest @material/material-color-utilities@0.3.0 motion @fontsource-variable/inter wrangler --registry=https://registry.npmmirror.com`
- [ ] Step 3: astro.config.mjs:`output:'static'`(默认 prerender),site `https://sleepy.lingion.eu.cc`,integrations sitemap+cloudflare
- [ ] Step 4: `npm run build && npm run check && npm run test` 全绿(空测试也绿)
- [ ] Step 5: commit `chore(site): Astro5 脚手架 + 双语站点质量闸`

### Task 2: M3 token 生成器(§2.1/§2.3 → theme.css/motion.css)

**Files:**
- Create: `scripts/gen-tokens.mjs`
- Create: `src/tokens/theme.css` `src/tokens/motion.css`(生成物,入 git)
- Test: `scripts/gen-tokens.test.mjs`(vitest)

**Produces:** CSS 变量全集 `--md-sys-color-{role}`(`:root` light,`[data-theme=dark]` dark);`--md-sys-motion-easing-*` / `--md-sys-motion-duration-*`

**规格(逐条对 spec §2.1/§2.3):**
- schemes 直出:primary/secondary/tertiary/error 各 on-/container/on-container + outline/outlineVariant/inverse 三系/scrim/surfaceVariant/onSurfaceVariant/surface(=scheme.surface)
- **容器阶梯 = `palettes.neutralVariant.tone(t)`**:L 96/94/92/90 + lowest t100;D 10/12/17/22 + lowest t4;surfaceDim/Bright:L t87/t98,D t6/t24
- motion:easing 三支 + 官方时长 short1-4 50/100/150/200 · medium1-4 250/300/350/400 · long1-4 450/500/550/600 · extraLong1-4 700/800/900/1000 + `--site-stagger:60ms`(注非-M3)

- [ ] Step 1: 红测试:生成后断言 `--md-sys-color-primary: #604bbf`(L)/`#cabeff`(D)、`duration-long2: 500ms`、dark `surface-container-highest` 有值且 ≠ neutral t22(必须走 neutralVariant)、light 五档容器严格 = 100/96/94/92/90、scrim 存在
- [ ] Step 2: 写脚本跑通(0.3.0 无 surfaceContainer 角色→全部 tone 手生成,注释标明与 v2 差异)
- [ ] Step 3: `npm run tokens && npm run test` 绿;theme.css 顶部注释生成命令+种子(可复现)
- [ ] Step 4: commit `feat(site): M3 token 生成器(logo 种子 #9B87FE,容器走 neutralVariant)`

### Task 3: geo 数据管线(spec §4.1,本波最硬纯函数)

**Files:**
- Create: `src/data/geo-prefix.json`(31 省 + 主要城市 → {zh,en},人工整表)
- Create: `src/lib/geo.ts`:`buildGeoIndex(geo)` `classifyProvince(name, idx): {code,matched:'prefix'|'manual'} | null`
- Create: `scripts/build-schools.mjs`:读 schools.json 源 → 应用 geo + `src/data/province-manual.json`(人工补表)→ 产 `src/data/schools.grouped.json`(每条 +`province:{code,zh,en}`;`sortKey==='*'`→「其它」)→ **断言 ungrouped==0 否则 exit 1**
- Create: `scripts/fetch-schools.mjs`:raw.githubusercontent 拉主仓(网络失败用仓内快照+警告)
- Test: `src/lib/geo.test.ts`

**Interfaces:** Produces `schools.grouped.json`(字段 `name/sortKey/sortKeyFull/type/aliases/province`)供 T5 搜索与 T6 渲染。

- [ ] Step 1: 红测试:①最长前缀优先(「青岛科技大学」→山东,非「青」字头歧义);②城市>省(城市表含青岛时,青岛理工→matched='prefix' city);③「其它」桶含 `'*'` sortKey 两条;④348 条 100% 可判(用真实仓 schools.json 当 fixture,`fs` 直读主仓路径→CI 不可依赖,改为 fixture 拷贝进测试)
- [ ] Step 2: 整 geo-prefix 表(先城市后省,按最长匹配);跑 build-schools.mjs 迭代 `province-manual.json` 直至 exit 0;manual 表入仓(commit 前人工抽查 20 条:西北政法/安康学院/东北大学/电子科技大学…)
- [ ] Step 3: `npm run data && npm run test` 绿;33 type 计数断言
- [ ] Step 4: commit `feat(site): 教务数据管线:geo 分组 100% 覆盖不变量 + '*' 桶`

### Task 4: 搜索与 release 纯函数

**Files:**
- Create: `src/lib/search.ts`:`normalize(s)` `matchSchool(q, school)`(name 子串 or sortKeyFull 子串)
- Create: `scripts/fetch-release.mjs`:GitHub API latest(有 `GITHUB_TOKEN` 走认证);失败 **exit 1**(spec §4.2:下载腐烂不可装绿;本地无网络时用仓内 `src/data/release.json` 快照并打印 BUILD_META)
- Test: `src/lib/search.test.ts`

**Interfaces:** Produces `src/data/release.json` `{tag, date, assets:[{name,url,size}], sha256sumsUrl}` + 烘入 `BUILD_TIME`;`matchSchool` 供 T5 岛。

- [ ] Step 1: 红测试:①`jiaotong` 命中多校(西安交通/北京交通…真实 fixture);②大小写/全角归一;③release.json 缺 sha256sumsUrl → 校验器抛错
- [ ] Step 2: 实现;本地实跑 fetch(gh 可用)核 v1.0.61 五资产名
- [ ] Step 3: 绿 + commit `feat(site): 校名拼音搜索 + release 拉取 fail-on-stale`

### Task 5: 布局壳 + app bar + footer + blob(§2.2/§2.4)

**Files:**
- Create: `src/layouts/Base.astro`(head:FOUC 内联脚本、hreflang 双指、og/twitter meta、Inter 引入、theme.css+motion.css+global.css、`data-build` meta=tag+time)
- Create: `src/components/AppBar.astro`(sticky;滚动态=CSS `:scroll` 类 JS 切 `surface→surfaceContainer` 无阴影;zh|EN 链;明暗按钮 tooltip「晚课专用。」)
- Create: `src/components/Blob.astro`(props:`variant:0|1|2`→hue 0/+15/-15° stops 角 135/90/200;`data-blob`)
- Create: `src/components/Footer.astro`(inverse-surface + blob#3 + 链接组 + GPL/QQ)
- Create: `src/styles/global.css`(4/8dp 栅格工具类、15 阶 type、shape、reduced-motion 0ms、红线词零)
- Test: `src/tokens/global.a11y.test.ts`(CSS 文本 grep:scrim 32%、outline 用于控件)

- [ ] Step 1: 红测试(构建后 DOM):`data-blob` 计数=3 需 T6 页面就位——本任务先测 CSS/FOUC 脚本静态断言
- [ ] Step 2: Base+AppBar+Footer+Blob 实现;占位页渲染目检(npm run dev,截图)
- [ ] Step 3: commit `feat(site): 布局壳:FOUC 守卫/tonal app bar/blob motif(三档定值)`

### Task 6: 七段页面 zh(§3)

**Files:**
- Create: `src/pages/index.astro`(七段)
- Create: `src/components/sections/{Hero,Features,Schools,Gallery,Download,Trust}.astro`
- Create: `src/i18n/zh.ts`(全部文案常量,§2.5 样例句逐句;临时 slogan=A「构建无壳,自由自在」,单点可换)
- Create: `src/components/SchoolsFinder.svelte`?——**否**,禁框架:原生 `<script>` 渐进增强,服务端渲染全量分组,客户端做 filter(chip=filter chip 态:未选 outline 描边,已选 secondaryContainer)
- Gallery:8 图清单硬编码 T3/T4 产物;lightbox=vanilla+Motion One(scrim #000000 32%,aria-modal,焦点圈定/Esc/←→/归还)
- Download:release.json 驱动四 ABI 表 + sha256 外链 +「拿不准就 Universal,通吃。」+ 商店灰态 SVG 占位
- 图像:`src/assets/screenshots/`(从主仓 raw 拉 8 张 commit 入仓)

- [ ] Step 1: Hero(55/45、Display clamp ≤2 行、双 CTA、blob#1)+ Features 4 行(card=surfaceContainerLow,DOM 序=揭示序 IntersectionObserver 60ms stagger)
- [ ] Step 2: Schools 段(统计 chip「348 条收录 · 33 协议」口径)→ Download(footer meta 烘 tag)→ Trust(维护者叙事逐字进)→ blob 三位
- [ ] Step 3: 测试:`data-blob` DOM 计数=3、样例句 grep 全命中、红线词零命中、JS-off 全量分组可读(渲染层断言)
- [ ] Step 4: dev 截图逐段目检 ×3 迭代(对比度/留白/密度对 spec §2.4)→ commit `feat(site): 七段主页 zh(个性/亲近载体落地)`

### Task 7: en 镜像路由

**Files:**
- Create: `src/pages/en/index.astro`(复用全部组件,注入 `en.ts`)
- Create: `src/i18n/en.ts`(slogan EN 配对;协议 type EN 标签表进 `src/data/types-en.json`;省份 chip 用 geo-prefix.en;校名保中文)
- Modify: Base.astro lang 属性参数化

- [ ] Step 1: 测试:`/en/` hreflang 互指断言、EN 页搜索 `jiaotong` 数据侧可命中(纯函数)、EN 无中文文案泄漏(组件 props 全覆盖检查:遍历 zh.ts 键 = en.ts 键)
- [ ] Step 2: 实现 + 截图目检 → commit `feat(site): /en/ 双语镜像(中文校名+拼音检索策略)`

### Task 8: CI/CD(落盘不启用)

**Files:**
- Create: `.github/workflows/deploy.yml`:push main + `schedule: nightly`;npm ci → `data`(GITHUB_TOKEN 认证 API)→ tokens 校验 → astro build → `wrangler pages deploy dist --project-name sleepy-site`;secrets `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`(待用户)
- Modify: README(部署 runbook:CF 另一账号、secrets 设置、域名 `sleepy.lingion.eu.cc` CNAME→pages.dev 的指引)

- [ ] Step 1: workflow lint(`actionlint` 若可用,否则手工审 yaml + `gh api` dry 校验引用)
- [ ] Step 2: 本地 `wrangler pages dev dist` 冒烟(build 产物可静态服务)
- [ ] Step 3: commit `ci(site): Actions nightly+push 构建,wrangler 部署 CF Pages(待凭据)`

### Task 9: 性能/无障碍终检 + 文档收口

- [ ] Lighthouse(CI 或本地 chrome)四项 ≥95 移动;失败项修复循环(图像 srcset/字体子集/JS 体积 ≤15KB 实测 `du dist/_astro`)
- [ ] `npm run test/check/build` 全绿;`git diff --check` 干净
- [ ] README 收尾:四标准 × spec 落点表贴入;spec §7 开放项状态更新
- [ ] commit `chore(site): Lighthouse/无障碍达标收口`

### Checkpoint(全部完成后,请示用户)
- [ ] 交付报告:「用户原话 vs 实现行为」表(spec §8 为底)+ 每段截图 + Lighthouse 分数
- [ ] **批准后**:push 分支 → PR(main 合并不自动——squash 前 `git cherry` 判等)→ 用户提供 CF 凭据 → `gh secret set` → 首部署 → CF Pages 绑 `sleepy.lingion.eu.cc`(另一账号操作,CNAME 指引在 README)→ 正式域演练
- [ ] 主仓 release→deploy-hook(可选增强)单独请示

## Risks
| 风险 | 级 | 缓解 |
|---|---|---|
| province-manual 人工表错漏 | 中 | 100% 覆盖构建断言 + 抽查 20 条;错了只改数据不改逻辑 |
| 0.3.0 tone 与官方 dynamic 微差 | 低 | 以生成器输出为唯一真源,测试快照锁值;审读 M3 差异非发布阻塞 |
| wrangler 版本漂移 | 低 | 锁 devDependency,禁全局 npx 最新版 |
| slogan 未经签收 | 低 | 单点常量,T6 前随时一行换;交付报告标注「临时=A」 |
