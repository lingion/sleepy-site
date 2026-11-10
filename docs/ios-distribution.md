# iOS 安装入口

核对日期：2026年11月10日。

首页下载区和下载页使用同一个 `IosDownload.astro` 组件。App Store 正式版面向中国大陆以外的商店；中国大陆区仍在审核，用户可通过 TestFlight 安装。两个入口始终保留，不按 IP 隐藏或自动选择。

顺序固定为 App Store 徽章、TestFlight 图标按钮、地区说明。窄屏空间不足时只换行，不压缩徽章、不拉伸图标。App Store 徽章保持原始比例和40像素高度，两个入口点击高度至少48像素，TestFlight 沿用 Material 圆角、主题颜色和可见焦点。

```text
iOS
┌─────────────────┐  ┌──────────────────────┐
│ App Store 徽章  │  │ TestFlight 图标与文字 │
└─────────────────┘  └──────────────────────┘
中国大陆以外商店已上线；中国大陆审核中，可用 TestFlight。
```

正式版地址为 `https://apps.apple.com/app/id6827001840`，让 Apple 处理商店地区。该地址和用户提供的德国区页面已核验为同一应用。公测地址为 `https://testflight.apple.com/join/SxymmDzf`。徽章只能指向正式商店，不用 App Store 徽章表示 TestFlight。

TestFlight 图标来自 Apple Inc. 的官方 TestFlight 商店应用（ID 899247664），通过 Apple iTunes Lookup API 获取原图，存为 `public/badges/testflight.jpg`。现有中英文 App Store SVG 徽章保持原样。Apple 的图标与徽章属于其品牌资产，不因本仓库 GPL 许可改变归属。

完成条件：四个中英文入口页面的渠道、图标和顺序正确；FAQ、机器索引和维护文档同步真实分发状态；类型检查、构建、测试和部署后页面验证通过。

用户要求与实现逐条对应：

| 用户要求 | 实现行为 |
|---|---|
| 除中国大陆外已上线 App Store | 正式商店徽章指向应用 ID 6827001840，并显示地区说明 |
| 国区审核中只能用 TestFlight | 保留独立公测链接，明确审核状态 |
| TestFlight 使用专用图标 | 使用 Apple 官方 TestFlight 图标及文字按钮 |
| FAQ、llms.txt 和文档纠错补全 | 同步双语 FAQ 真源、生成器、机器产物和相关仓库当前文档 |

Android、iOS 和网页版独立发布，不能由 Android 版本号推断 iOS 商店版功能或公测版功能。商店安装要求以 Apple 页面为准；源码开发状态与已发布应用版本分开记录。
