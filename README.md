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

构建与部署 owner 是 GitHub Actions(`.github/workflows/deploy.yml`):push main + nightly → `astro build` → `wrangler pages deploy`。需要 secrets `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`(另一 CF 账号)。Cloudflare Pages 项目名 `sleepy-site`,域名 `sleepy.lingion.eu.cc` CNAME 至项目 pages.dev。

## 许可

GPL-3.0,与主仓 [lingion/sleepy](https://github.com/lingion/sleepy) 一致。
