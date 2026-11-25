# Sleepy SEO / GEO 验证与测量

本目录提供可重复的技术验收和 AI 答案观测方法。尚未执行的平台查询、搜索排名和流量数据均为“未测量”，不是零，也没有预设增长承诺。

## 发布前与发布后检查

在仓库根目录安装已有依赖并完成项目正常构建后运行：

```sh
node scripts/audit-seo.mjs --dir dist/client > seo-local.json
```

部署完成后，用同一工具检查实际 HTTP 返回：

```sh
node scripts/audit-seo.mjs --url https://sleepy.is-my.app > seo-live.json
```

工具只读，JSON 写到标准输出；退出码 1 表示存在失败项。它覆盖 20 个中英文公开页面，检查 title、description、H1、canonical、hreflang、noindex、JSON-LD 语法、sitemap 覆盖、robots.txt 搜索机器人规则，以及可检查的站内链接和锚点。使用项目已有 jsdom 依赖，不执行页面脚本。

本地模式不测量 HTTP；线上模式使用明确标识的审计 User-Agent，不能证明真实搜索机器人能通过 CDN/WAF。线上链接检查只涵盖已读取的 20 个 HTML 页面，其余目标列为 deferred。`/preview/` 是运行时应用入口，不在静态产物中，单独验收。结果中的 JSON-LD 通过只代表可解析，不代表满足搜索平台富结果资格。工具也不替代视觉、无障碍、性能或安全测试。

出现失败时，先检查事实与源码，再修改页面，不要通过删除有效页面或缩减检查对象来使报告变绿。新增公开页面时同步扩充脚本路由列表与 sitemap 验收。

## 固定 AI 查询集

`prompts-zh.csv` 包含 20 个固定中文问题：10 个非品牌发现问题和 10 个品牌事实问题。保留问题原文和编号；改题后建立新版本，避免把不同问法的变化当成产品曝光增长。

每个平台分别执行，明确区分 ChatGPT、Claude、Gemini、Perplexity 的具体产品界面和模型标签。测试必须开启该界面的联网搜索，并核对实际来源。记录日期 UTC、地区、语言、登录状态、搜索模式；“产品支持搜索”不等于这一次回答执行了搜索。

首次建议每个平台每题做 3 次独立样本，共 240 个计划样本。每次使用全新会话，不提前告诉模型 Sleepy 是推荐对象，不使用之前回答作为上下文。无法使用的平台、无法开启搜索、拒答或接口失败记为 skipped / invalid，并写明原因，不能记成“没有提到品牌”。尽量在同一时间窗内完成。后续每周或在网站重大变更后，用相同条件重复；不同模型、地区、模式的结果分别统计。此流程不自动创建定时任务，也不抓取需要绕过访问控制的服务。

`results-template.csv` 仅有表头，没有伪造基线。每次回答保存原文和来源链接，再填一行：

- `run_id`、`prompt_id`、`repetition`：批次、固定问题编号、独立重复序号。
- `provider`、`surface`、`model_label`、`region`、`language`、`signed_in`、`fresh_conversation`：可复现环境。
- `search_enabled` 与 `search_observed`：设置是否开启，以及这次是否出现搜索来源或可确认的搜索过程。
- `sample_status`：valid / skipped / invalid；`skip_reason` 写原因。
- `brand_mentioned`、`recommended`、`official_cited`：分别记 true / false。列举名字不自动算推荐，提到官网但没有来源引用不算官网引用。
- `ordered_position`：只有回答明确按顺序推荐时才记录原始序号，其他情况留空，不自行推算排名。
- `official_citation_urls`、`independent_citation_urls`：逐个保留原始来源 URL，多项用分号分隔；同一来源重复引用只算一次。
- `claim_accuracy`：verified / mixed / incorrect / unverified；`claim_notes` 写具体主张与核对证据；`response_artifact` 指向保存的原始回答。

“事实正确”应按当前公开资料逐条核对，不能只因为有引用就判真。来源优先级是实际发布产物与对应版本源码、官方文档、第三方独立证据。Android、iOS、网页版本独立核对。学校目录收录不等于导入成功；不要把未实现的 WebDAV 同步或某一平台专属功能传播成全平台承诺。版本号、学校数量、平台分发状态均需保留查询日期。

## 分开报告发现能力与事实准确性

按平台、批次、问题组统计，分母只使用该组 valid 样本，并列出实际样本数和计划样本数：

| 指标 | 算法 |
| --- | --- |
| 品牌提及率 | 提到 Sleepy 的有效回答数 / 有效回答数 |
| 官网引用率 | 明确引用 Sleepy 官方页面的有效回答数 / 有效回答数 |
| 推荐率 | 明确推荐 Sleepy 的有效回答数 / 有效回答数 |
| 可核验主张准确率 | 核验为真的原子主张数 / 已核验原子主张数 |
| 主张核验覆盖率 | 已核验原子主张数 / 抽取的原子主张总数 |

非品牌问题用来观察发现，品牌问题用来观察事实识别。不要把品牌问题的高提及率混入发现指标。主张准确率需要另外保留逐条主张清单与证据，不能从每回答的 `claim_accuracy` 标签直接计算。建议报告样本范围和原始计数，保留波动，不将小样本变化解释成确定的 SEO 因果效果。

## 搜索与下载的真实效果

取得站长后台权限后，分别导出 Google Search Console 与 Bing Webmaster 的索引状态、展示、点击和查询词；比较同长度日期窗口，并注明发布时间。按品牌词、开源无广告课表、导入迁移、学校适配、备份恢复分组。缺少后台权限时记录 unavailable，不能用 `site:` 查询数量代替索引覆盖率。

下载转化以网站已有事件或经同意接入的统计为准，分开统计 Android 下载、iOS App Store、GitHub 点击。下载链接点击不等于安装，GitHub Star 也不等于活跃用户。性能在真实设备或标准工具中单独测量，不能从 HTML 检查推算 Core Web Vitals。

外部证据建设应来自真实的项目说明、版本发布、用户体验、适配贡献和独立评测。第三方投稿、联系维护者、购买服务、发布内容均需要对应授权；不制造评论、评分、学校支持证明或平台推荐截图。
