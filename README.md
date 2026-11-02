# sleepy-site

<p align="center">
  <img src="https://img.shields.io/badge/Astro-7.x-orange?style=flat-square&logo=astro" alt="Astro">
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License">
</p>

[Sleepy](https://github.com/lingion/sleepy)(开源安卓课表 App)的官方双语网站。静态 Astro 站点,线上地址 [sleepy.is-my.app](https://sleepy.is-my.app)。

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

构建与部署走 GitHub Actions(`.github/workflows/deploy.yml`)：push main 自动发布到 Cloudflare Pages。nightly 刷新产品基线指定版本的 release 元数据，并从已审查的学校与 FAQ 快照重新生成页面；不会自动吸收 Android main 的未发布功能。学校与 FAQ 更新需要显式刷新、翻译和审查。仓库需配置 secrets:`CLOUDFLARE_API_TOKEN`(Pages Edit 权限)与 `CLOUDFLARE_ACCOUNT_ID`。站点域名写在 `astro.config.mjs` 的 `site` 与 `src/i18n/ui.ts` 的 canonical 两处,换域同改。

## 目录

- `src/` 页面组件与文案(中英双语在 `src/i18n/` 单点维护)
- `src/assets/screenshots/` 应用截图(浅/深主题双版)
- `src/data/` 构建期数据快照
- `docs/` 设计契约与实施计划
- `tests/` 产物级验收测试

## 产品事实与快照

当前产品基线由 `src/data/product-release.json` 记录 Android 发布 tag、源码 SHA、发布时间和审查日期。`schools.snapshot.json` 记录学校源快照及归组证据，普通页面构建不联网重取学校目录。4140 条目录分为已配置、未验证和待接入，数量不等于逐校在线验证。

中文 FAQ 在 `fixtures/FAQ.md`，英文在 `scripts/faq-en.md`，生成 `src/data/faq.json` 后同时用于页面、机器 JSON 和 FAQPage 结构化数据。中文主稿与 Android 仓库 `FAQ.md` 保持一致；翻译必须逐节逐问对应。

```sh
node scripts/fetch-release.mjs --tag v1.0.63
# 只有明确更新产品基线时才选其他 tag 或 latest。
node scripts/fetch-faq.mjs --source /path/to/reviewed/FAQ.md
node scripts/build-faq.mjs
node scripts/build-schools.mjs
node tools/make-og.mjs
npm run check
npm run build
npm test
```

FAQ 也可用 `--ref` 指定审核过的完整提交 SHA；不能省略来源而静默抓取 main。学校刷新参数见 `scripts/fetch-schools.mjs`。八张社交图片需在快照更新后显式重生成，单独执行 Astro build 不会更新图片内文字。

## 许可

GPL-3.0,与主仓 [lingion/sleepy](https://github.com/lingion/sleepy) 一致。
