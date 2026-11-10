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
npm run dev -- --background # http://localhost:4321；使用 astro dev stop 停止
npm run build        # 产物 dist/(Cloudflare Pages 直接托管)
npm run check        # astro check 类型闸
npm run test         # vitest 测试
npm run tokens       # M3 token 生成 → src/tokens/
npm run data         # 教务数据管线(release 快照 + schools 分组)
```

## 部署

构建与部署走 GitHub Actions（`.github/workflows/deploy.yml`）。Sleepy 主仓库正式 Release 完成后发送 `upstream-release` 跨仓库事件，立即排队重建；push main、手动执行与 nightly 负责日常改版和补偿刷新。`npm run data` 仅解析一次最新正式 Release，再以其不可变源码 SHA 更新学校目录。版本信息、四份 APK 链接和 SHA-256、完整双语说明、RSS、`release.json`、`llms.txt` 与所有分享图在同一构建中生成、验证和部署，构建失败时线上保持上一份完整部署。部署前再次核对上游 Release，阻止旧构建覆盖新版本。FAQ 保留自己的人工核对日期，不自动冒充新版文档。

完整更新说明位于 `/releases/` 和 `/en/releases/`，不放在首页。首页主视觉原样嵌入 sleepy-web 完整原站，保留原 UI 和功能。iframe 与「单独打开完整网页版」均逐字使用 `https://sleepy.is-my.app/preview/`，不带查询参数，不设置 sandbox，也不通过官网主题重写 URL。网页版自行管理主题、导航、数据与设置，本站不提供隔离或精简演示版本，不修改 sleepy-web。首页共八段，Hero 后为七段，既有首图尺寸、位置、页面顺序与 Release 同步机制保持不变。嵌入契约见 `docs/release-sync-and-demo.md`。

主仓库工作流 `.github/workflows/sync-sleepy-site.yml` 同时监听正式 Release 工作流成功结束及手动发布、编辑事件。这样由 GITHUB_TOKEN 创建的 Release 也能触发同步。主仓库需要 `SLEEPY_SITE_DISPATCH_TOKEN`（可调用 `lingion/sleepy-site` repository dispatch）；本站需要 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。部署使用现有 sleepy-site Pages 项目。

## iOS 安装渠道

中国大陆以外的 [App Store](https://apps.apple.com/app/id6827001840) 均已上线，中国大陆区仍在审核中，可使用 [TestFlight](https://testflight.apple.com/join/SxymmDzf)。首页和下载页分别展示官方 App Store 徽章及 TestFlight 专用图标，使用共享组件和双语文案。正式商店、公测与 Android 独立发布，不能互相推断功能或版本号。布局、来源和渠道约束见 [iOS 安装入口](docs/ios-distribution.md)。

## 目录

- `src/` 页面组件与文案(中英双语在 `src/i18n/` 单点维护)
- `src/assets/screenshots/` 应用截图(浅/深主题双版)
- `src/data/` 构建期数据快照
- `docs/` 设计契约与实施计划
- `tests/` 产物级验收测试

## 产品事实与快照

当前产品基线由 `src/data/product-release.json` 记录 Android 发布 tag、源码 SHA、发布时间和审查日期。`schools.snapshot.json` 记录学校源快照及归组证据，普通页面构建不联网重取学校目录。原始目录分为已配置、未验证和待接入，官网仅展示前两类。总数、已配置和未验证数量均取快照字段，不等于逐校在线验证。

中文 FAQ 在 `fixtures/FAQ.md`，英文在 `scripts/faq-en.md`，生成 `src/data/faq.json` 后同时用于页面、机器 JSON 和 FAQPage 结构化数据。中文主稿与 Android 仓库 `FAQ.md` 保持一致；翻译必须逐节逐问对应。

```sh
node scripts/sync-data.mjs
# 将最新正式 Release 的不可变源码与资产作为同一份快照更新。
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
