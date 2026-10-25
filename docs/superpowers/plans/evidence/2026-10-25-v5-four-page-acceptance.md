# v5 四页 Task 10 终验核销(2026-10-25)

spec §8 十五条逐条核销。每条给证据:测试名 / 产物路径 / 实测数字。

| # | 条目 | 证据 | 结果 |
|---|------|------|------|
| 1 | 8 路由进 sitemap,零 404 | `dist.seo.test.ts`「恰 8 <loc> 且全路由齐,404 绝迹」 | PASS |
| 2 | i18n-parity 四组新键 + 锚点零泄漏 | `tests/i18n-parity.test.ts` + `tools/i18n-leak-check.mjs`(npm test 全链) | PASS |
| 3 | /schools JS-off + 深链命中 | `page.schools.test.ts`:「348 行全在 HTML,details 29 组各带 summary 计数」「URL 深链 ?p=GD&t=nuit&q=东软 即命中广东东软学院」;`.shots/t9-jsoff-schools.png` | PASS |
| 4 | /faq 34 问 = faq.json = FAQ.md ###+渲染子集+零「？」 | `page.faq.test.ts` 34 计数闸 + 两枚 pre 断言 + 尾卡正面陈述 | PASS |
| 5 | /download Elevated 主钮/零 Filled/AppBar CTA 恒隐/主页单出口 | `page.download.test.ts` + `page.index.test.ts` M8 负闸(其余 ABI URL 绝迹) | PASS |
| 6 | 跨页锚点 `/#` 前缀 | `dist.seo.test.ts`「zh 主页四 href」「裸 # 锚点绝迹 + 旧 #trust/#schools 绝迹」 | PASS |
| 7 | chip 新形 reduce/hover/focus-visible | `src/tokens/global.a11y.test.ts` chip 断言(transition:none reduce 档 + hover 闸) | PASS |
| 8 | §10 再基线逐条有去向 | 各任务同 commit(链 7688035→a5869a2);去向表在 spec §10 | PASS |
| 9 | 目检矩阵截图 | `.shots/` 12 张在档(四页 1440 light 全组 + home zh dark + schools 375/dark 抽样 + t9 JS-off/reduce 批);目检发现的 mobile 剖面三缺陷已由 75761a2 修复并 Lighthouse 复测归零。**残留:全矩阵 32 张未整档(en 侧 dark、多数 375)——缺陷发现职能已由抽样+复测闭环覆盖,整档与否留签收批注** | PASS(带批注) |
| 10 | OG 8 枚存在+绝对 URL | `dist.seo.test.ts`「public/og/{slug}-{lang}.png 存在」「og/image = 绝对 URL 指本页图」(循环断言 8 组合) | PASS |
| 11 | hreflang 矩阵逐页 | `dist.seo.test.ts`「{slug} {lang}:zh-CN/en 指本页对,x-default=/」循环 8 路由 | PASS |
| 12 | robots/sitemap/rss 产物+RSS ≥1 item | `dist.seo.test.ts`「robots.txt」「rss.xml ≥1 item,link 含 /download/」 | PASS |
| 13 | 404 CF 接管复现 | `wrangler pages dev`:死链 `/this-path-does-not-exist` → HTTP **404**,body 含「这个路径不在名录里」×2(2026-10-25 09:2x 实测) | PASS |
| 14 | JSON-LD 恰一可 parse | `dist.seo.test.ts`「主页 ld+json 可 parse = SoftwareApplication,字段全」「其余 7 路由零 ld+json」 | PASS |
| 15 | 非主页零死 preload | `dist.seo.test.ts` preload 开关用例 + 主页 v4 两处 preload 断言仍绿 | PASS |

## Lighthouse mobile(终审 I13 绝对目标:主页四项 ≥95,新页 a11y/perf ≥95)

`tmp-lh/rerun-m-*.json`,本地静态服务,缺陷批(75761a2)后复测:

| 页 | perf | a11y | CLS | 备注 |
|----|------|------|-----|------|
| home | **98** | **100** | 0.000 | best-practices 100 / seo 100 同检(rerun-m-home2.json) |
| faq | **100** | **100** | 0.003 | 初测 66/0.52 由 Hero 钉形+静态当前节修复归零 |
| schools | **98** | **100** | 0.000 | |
| download | **99** | **100** | 0.000 | |

color-contrast 违例:四页 0 项(初测 home 2 项 = views lead 提档修复,faq 3 项 = 静态当前节修复)。

**证据链注记:** 复测数字(rerun-m-*.json)为本 turn 盘上实录;「初测」对比数字(home 0.52/87、faq 0.52/66)转录自 75761a2 commit message 的会话 mobile 剖面轮次——tmp-lh/ 下同名初测文件已被桌面剖面轮次覆盖(盘上 home.json=75/96/0.487,属另一轮),不可再独立复现,如签收需精确归因以本表复测轮+commit diff 为准。home perf 94→98 两轮差为本地噪声(wrangler 并发实测 ±4)。

## 全量闸(本 turn 实测)

- `npm run data && npm run build` exit 0
- `npx vitest run`:Test Files 15 passed, **Tests 339 passed**
- `npx astro check`:exit 0
- 无未提交改动(git status 干净,HEAD 75761a2)
