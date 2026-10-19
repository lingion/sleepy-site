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

本工作流当前**落盘未启用**:凭据未就位前 push 会红在 deploy gate(构建/测试闸照常全跑)。

## 许可

GPL-3.0,与主仓 [lingion/sleepy](https://github.com/lingion/sleepy) 一致。
