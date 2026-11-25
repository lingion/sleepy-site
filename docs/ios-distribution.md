# iOS 安装入口

内容核对日期：2026年11月25日。本文记录 Sleepy iOS 的官方安装入口与官网展示规则。

Sleepy iOS 已在中国大陆区及其他地区的 App Store 上架。App Store 是唯一官方安装与更新渠道；官网首页、下载页、FAQ、机器索引和维护文档均统一指向同一应用页面：`https://apps.apple.com/app/id6827001840`。

首页下载区和下载页使用同一个 `IosDownload.astro` 组件。组件只展示 Apple 官方 App Store 徽章，不提供 TestFlight、公测邀请或其他 iOS 安装入口。中英文页面分别使用对应语言的 App Store 徽章和辅助文案。

```text
iOS
┌─────────────────┐
│ App Store 徽章  │
└─────────────────┘
Sleepy iOS 已在中国大陆区及其他地区上架，通过 App Store 安装与更新。
```

正式商店地址为 `https://apps.apple.com/app/id6827001840`。商店当前版本与最低系统要求以 App Store 页面为准；GitHub 源码标签不是已安装商店版本的证据。GitHub 仓库仅公开源码，不作为安装包分发渠道。

官网不保留 TestFlight 图标、邀请链接、备用安装按钮或地区回退说明。App Store 徽章保持 Apple 官方素材原始比例和40像素高度，点击高度至少48像素；窄屏空间不足时自然换行，不压缩徽章。链接保留可见焦点样式和安全的外链属性。

完成条件：四个中英文入口页面均只展示 App Store；FAQ、llms.txt、SEO 元数据和维护文档与当前分发状态一致；构建与自动化测试通过。

| 用户要求 | 实现行为 |
|---|---|
| iOS 仅保留 App Store | 首页、下载页和所有中英文入口均指向应用 ID 6827001840 |
| 移除 TestFlight | 删除邀请链接、专用图标、按钮、备用渠道文案和相关资源 |
| FAQ、llms.txt 和文档同步 | 更新双语 FAQ 真源、生成器、机器产物、README 与维护文档 |

Android、iOS 和网页版独立发布，不能由 Android 版本号推断 iOS 商店版功能。商店安装要求以 App Store 页面为准；源码开发状态与已发布应用版本分开记录。
