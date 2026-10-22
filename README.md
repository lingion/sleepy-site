# sleepy-site

<p align="center">
  <img src="https://img.shields.io/badge/Astro-5.x-orange?style=flat-square&logo=astro" alt="Astro">
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License">
</p>

[Sleepy](https://github.com/lingion/sleepy)(开源安卓课表 App)的官方双语网站。静态 Astro 站点,线上地址 [sleepy.lingion.eu.cc](https://sleepy.lingion.eu.cc)。

问题反馈和新建议请直接开 [Issues](https://github.com/lingion/sleepy-site/issues)。

## 开发

```sh
npm install          # registry 已锁 npmmirror(.npmrc)
npm run dev          # http://localhost:4321
npm run build        # 产物 dist/(Cloudflare Pages 直接托管)
npm run check        # astro check 类型闸
npm run test         # vitest 测试
npm run tokens       # M3 token 生成 → src/tokens/
npm run data         # 教务数据管线(release 快照 + schools 分组)
```

## 部署

构建与部署走 GitHub Actions(`.github/workflows/deploy.yml`):push main 自动发布到 Cloudflare Pages,nightly 刷新 release 与教务数据快照。仓库需配置 secrets:`CLOUDFLARE_API_TOKEN`(Pages Edit 权限)与 `CLOUDFLARE_ACCOUNT_ID`。站点域名写在 `astro.config.mjs` 的 `site` 与 `src/i18n/ui.ts` 的 canonical 两处,换域同改。

## 目录

- `src/` 页面组件与文案(中英双语在 `src/i18n/` 单点维护)
- `src/assets/screenshots/` 应用截图(浅/深主题双版)
- `src/data/` 构建期数据快照
- `docs/` 设计契约与实施计划
- `tests/` 产物级验收测试

## 许可

GPL-3.0,与主仓 [lingion/sleepy](https://github.com/lingion/sleepy) 一致。
