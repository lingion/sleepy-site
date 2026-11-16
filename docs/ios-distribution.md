# iOS 安装入口

内容核对日期：2026年11月16日。本文记录安装入口的展示规则，不记录所有商店的实时审核或可用状态。

首页下载区和下载页使用同一个 `IosDownload.astro` 组件。App Store 可用性以用户所在地区的商店页面为准；无法获取时，可查看 TestFlight 是否开放名额。两个入口始终保留，不按 IP 隐藏或自动选择，也不将曾经核对的某个地区状态推广到所有商店。

顺序固定为 App Store 徽章、TestFlight 图标按钮、地区说明。窄屏空间不足时只换行，不压缩徽章、不拉伸图标。App Store 徽章保持原始比例和40像素高度，两个入口点击高度至少48像素，TestFlight 沿用 Material 圆角、主题颜色和可见焦点。

```text
iOS
┌─────────────────┐  ┌──────────────────────┐
│ App Store 徽章  │  │ TestFlight 图标与文字 │
└─────────────────┘  └──────────────────────┘
请以所在地区的 App Store 页面为准；也可查看 TestFlight 是否开放名额。
```

正式版地址为 `https://apps.apple.com/app/id6827001840`，让 Apple 处理商店地区。公测地址为 `https://testflight.apple.com/join/SxymmDzf`。徽章只能指向正式商店，不用 App Store 徽章表示 TestFlight。商店版本、最低系统、审核地区和公测名额都以相应 Apple 页面为准；GitHub 源码标签不是商店已上架状态的证据。

TestFlight 图标来自 Apple Inc. 的官方 TestFlight 商店应用（ID 899247664），通过 Apple iTunes Lookup API 获取原图，存为 `public/badges/testflight.jpg`。现有中英文 App Store SVG 徽章保持原样。Apple 的图标与徽章属于其品牌资产，不因本仓库 GPL 许可改变归属。

完成条件：四个中英文入口页面的渠道、图标和顺序正确；FAQ、机器索引和维护文档同步真实分发状态；类型检查、构建、测试和部署后页面验证通过。

用户要求与实现逐条对应：

| 用户要求 | 实现行为 |
|---|---|
| 提供 App Store 正式版入口 | 正式商店徽章指向应用 ID 6827001840，可用性由所选商店页面确定 |
| 提供 TestFlight 公测入口 | 保留独立公测链接，名额和公测版本以实时页面为准 |
| TestFlight 使用专用图标 | 使用 Apple 官方 TestFlight 图标及文字按钮 |
| FAQ、llms.txt 和文档纠错补全 | 同步双语 FAQ 真源、生成器、机器产物和相关仓库当前文档 |

Android、iOS 和网页版独立发布，不能由 Android 版本号推断 iOS 商店版功能或公测版功能。商店安装要求以 Apple 页面为准；源码开发状态与已发布应用版本分开记录。
