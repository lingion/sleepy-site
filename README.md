# sleepy-site

Sleepy(开源安卓课表)的官方双语网站。静态 Astro 站点,部署 Cloudflare Pages → `sleepy.lingion.eu.cc`。

设计契约见 `docs/superpowers/specs/`,实施计划见 `docs/superpowers/plans/`。

## 开发

```sh
npm install          # registry 已锁 npmmirror(.npmrc)
npm run dev          # http://localhost:4321
npm run build        # 产物 dist/(Cloudflare Pages 直接托管)
npm run check        # astro check 类型闸
npm run test         # vitest 纯函数测试
npm run tokens       # M3 token 生成(种子 #9B87FE → src/tokens/)
npm run data         # 教务数据管线(release 快照 + schools 分组)
```

## 部署

构建与部署 owner 是 GitHub Actions(`.github/workflows/deploy.yml`):push main + nightly(CST 02:00,刷 release/教务快照防腐烂)→ `npm run data`(GITHUB_TOKEN 认证 API)→ tokens 漂移闸 → check/build/test → `wrangler pages deploy dist/client`。

前置(按序,缺一 deploy gate 显式红不静默):

1. secrets(`gh secret set`,仓库 Settings 亦可):`CLOUDFLARE_API_TOKEN`(Token 模板 = **Cloudflare Pages: Edit**,**属 Sleepy 所在的另一个 CF 账号**)、`CLOUDFLARE_ACCOUNT_ID`(CF 后台右上角账号下拉可复制)。
2. CF Pages 建项目 `sleepy-site`(Production branch = main;构建命令留空,产物由 Actions 直传)。
3. 域名绑定:CF 后台该 Pages 项目 → Custom domains → 加 `sleepy.lingion.eu.cc`。若 DNS 在另一 CF 账号,手动建 CNAME 记录 → `<project>.pages.dev`(隧道证书 CF 自动签发)。站点 `astro.config.mjs` 的 `site` 与 `src/i18n/ui.ts` 的 canonical 已按此域写死,换域两处同改。

工作流已启用(2026-10-21):secrets 已配置,push main 即自动构建并部署到 `sleepy.lingion.eu.cc`。

## 验收状态(四标准 × spec 落点)

| 用户原话 | 落点 | 证据 |
|---|---|---|
| 大厂风格 | spec §2.4 艺术方向 + §2.2 字体定案(Inter 子集自托管 + CJK 系统栈) | 构建产物字体 preload;视觉六段目检 |
| 最震撼简洁 | spec §2.4 视觉预算/宁删勿加 | 单页 JS 3.8KB gz(预算 15KB);blob=3 DOM 断言 |
| 又有我个性 | spec §2.5 全部实体 + blob 数值定死 | 红线词 grep 零命中;`data-blob` 计数测试 |
| 用户感到亲近 | spec §2.5 叙事+样例句 | 样例句逐句在产物测试 |
| 严格 M3+动效 | §2.1 容器阶梯 / §2.3 时长表 / scrim 32% | tokens 生成器快照锁值 + CI 漂移闸 |
| 性能/无障碍 | Lighthouse 移动四项 ≥95 | 安静机 zh perf 98 / en 97;axe 双页 contrast 100(footer inverse 色对 color-mix 修复后) |

slogan 暂用 A 案「构建无壳,自由自在」(spec §7.2 签收前单点可换,`src/i18n/zh.ts`)。

## 许可

GPL-3.0,与主仓 [lingion/sleepy](https://github.com/lingion/sleepy) 一致。
