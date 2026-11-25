# 官网正文复核：Android v1.0.65

核对日期：2026年11月16日。范围包括首页功能介绍、安装说明、双语 FAQ、迁移与备份指南，以及相关维护文档。本记录依据已发布源码和发布说明做内容复核，不代表本轮进行了学校账号登录或手机真机验证。

人工正文使用固定的已发布源码作为依据：Android [v1.0.65](https://github.com/lingion/sleepy/releases/tag/v1.0.65)，提交 `3a7cbed352f4f8e1144e2e532840b9bea93b25d3`。该 Release 发布时间为 `2026-11-15T18:56:37Z`，按官网中文展示使用的北京时间是2026年11月16日。iOS 独立发布，本次记录的 GitHub 源码基线为 [v1.0.64](https://github.com/lingion/sleepy-ios/releases/tag/v1.0.64)，提交 `aca60039609e992ef1561c17b6a148dc0e4215d6`；iOS 商店分发信息另于2026年11月25日核对：App Store 是当前唯一官方安装与更新渠道。源码基线日期不代表当前商店版本。

## 复核依据

下表链接固定到 Android 发布提交，避免未来 main 的开发状态改写本次结论。

| 内容 | 已确认的边界 | 固定源码依据 |
|---|---|---|
| 桌面小组件 | 已注册15个小组件入口，分为今日、双日、周列表、周视图和周网格五类。旧 README 的14个计数未沿用。 | [AndroidManifest.xml](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/AndroidManifest.xml)、[小组件配置](https://github.com/lingion/sleepy/tree/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/res/xml) |
| 截图转换 | 导入入口复制 sleepy-v1 转换提示词；用户自行选择 AI 并发送截图，再回到 Sleepy 预览和核对结果。该入口不自动上传图片。 | [ImportSheet.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/ui/screen/imports/ImportSheet.kt)、[提示词与界面文案](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/res/values/strings.xml) |
| WakeUp 迁移 | 在线分享口令需要网络和第三方服务；本地文本或文件走支持格式的解析流程。导入后仍需核对学期、周次与作息。 | [WakeUpShareClient.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/data/jw/WakeUpShareClient.kt)、[ScheduleParser.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/data/parser/ScheduleParser.kt) |
| 完整备份与恢复 | `.sleepybackup` 包含数据库、偏好和小组件模块；合并与覆盖行为不同。学校来源身份会保留，但备份不导出教务更新资格。 | [MigrationBackup.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/data/migration/MigrationBackup.kt)、[MigrationDatabaseCodec.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/data/migration/MigrationDatabaseCodec.kt)、[TimeTableEntity.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/data/entity/TimeTableEntity.kt) |
| 按日期切换作息 | 完整备份保存 `comboScheduleJson`。普通课表交换格式不能据此承诺保留完整日期方案；恢复后需检查适用日期和年份。 | [MigrationDatabaseCodec.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/data/migration/MigrationDatabaseCodec.kt)、[v1.0.65 发布说明](https://github.com/lingion/sleepy/releases/tag/v1.0.65) |
| WebDAV | 用户手动确认上传，使用 HTTPS；归档本身未加密，密码不加入备份。单个文件上传、下载均有100 MiB上限，服务器可能另有更低限制。 | [BackupScreen.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/ui/screen/mine/BackupScreen.kt)、[WebDavClient.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/data/backup/WebDavClient.kt) |
| 课表提醒 | “需要提醒的课表”折叠卡用于选择参与提醒的课表；提醒还受总开关、通知和精确闹钟等权限及设备后台状态影响。 | [ReminderScreen.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/ui/screen/mine/ReminderScreen.kt)、[TableReminderScreen.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/ui/screen/mine/TableReminderScreen.kt)、[提醒界面文案](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/res/values-zh-rCN/settings_reminders.xml) |
| Liquid Glass | Android 13及以上提供完整折射，Android 12使用模糊，旧系统回退；不再沿用旧版本崩溃状态。 | [LiquidGlassNavigationBar.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/ui/component/liquidglass/LiquidGlassNavigationBar.kt)、[GlassFilterBands.kt](https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/app/src/main/java/com/lingion/sleepy/ui/component/liquidglass/GlassFilterBands.kt) |

学校数量仍由 `schools.snapshot.json` 及其状态分组生成。“已配置”是目录状态，不代表所有学校当前联网验证成功，也不等于所列教务系统的所有部署都适配。

## 维护方式

`src/data/content-baseline.json` 记录首页人工正文的发布基线；FAQ 与指南保留自己的核对元数据。`src/data/product-release.json` 是自动更新的最新发布快照。更新版本号、APK 或学校目录时，不应顺带把未复核的人工内容标成“已核对新版”。

下一次刷新正文时，先对照新版本固定提交核查事实，再成对更新中英文、FAQ 生成数据和相关指南。iOS 安装入口统一指向 App Store，当前上架版本和系统要求以 Apple 商店页面为准。
