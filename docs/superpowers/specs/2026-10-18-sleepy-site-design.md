# Sleepy 官网设计(spec v2)

日期:2026-10-18(v2 修订同日)· 状态:对抗审查修订稿,待复审
仓库:新独立仓库 `lingion/sleepy-site`(GPL-3.0,与主应用一致)
部署:Cloudflare Pages → `sleepy.lingion.eu.cc`(用户另一 CF 账号,zone `lingion.eu.cc`)

**v2 变更来源:** 对抗审查 cycle-1 判 v1 FAIL,17 项发现逐条复核全部成立(0 噪音)。核心病灶:个性/亲近两条标准在 v1 无任何设计决策支撑,大厂/震撼仅靠断言。本版逐条修复,映射见 §8。

## 0. 目标与非目标

**目标(主观四标准全部要有实体落点):** 大厂感 · 震撼×简洁 · 主人个性 · 用户亲近;严格 M3(Core)+ M3 动效 tokens;功能面 = 介绍 / 教务列表 / 下载 / 预览。

**非目标:**
- 不做 Web 版课表功能(在线版 sleepy.qdp.qzz.io 只做跳转)
- 不做 CMS;文案即代码——但「即代码」是存储机制,**不替代** §2.5 文案签收闸
- 商店徽标本轮为预留灰态
- **M3 Expressive 弹簧物理不在 Web 端支持范围**(material.io motion tokens 以 Android 首发;@material/web 维护模式——出处见 §9)。本 spec 的「MD 专用动画」= M3 Core 缓动/时长体系。此范围缩减记录为**用户可见决策**,不是脚注。

## 1. 技术栈(定案,不变)

Astro 5 + TypeScript · 手写 M3 token CSS(无 Tailwind/组件库)· Motion One(~5KB)· `@material/material-color-utilities@0.3.0`(**0.4.x ESM 无后缀导入 bug,Node22 require/import 双路实测皆炸,必须锁 0.3.0**)· `@astrojs/cloudflare` → CF Pages。

全站 JS 岛共 **3 处**(搜索框注水 / 主题开关 / lightbox),预算 ≤15KB gz——v1「唯一 island」表述失实,已改。

## 2. 设计系统

### 2.1 色彩(logo 抽色种子 `#9B87FE`)

构建期 `scripts/gen-tokens.mjs` 生成双方案,写 `src/tokens/theme.css`。**逐行标注生成来源**(v1 缺陷:手推 tone 值混充库输出,不可复现):

- **primary/on-*/container/inverse/outline 系角色** ← `themeFromSourceColor(seed).schemes.light|dark`(v0.3.0 直出,已复核一致):primary L `#604BBF` / D `#CABEFF`,primaryContainer L `#E6DEFF` / D `#4830A5`,inverseSurface L `#313033` / D `#E6E1E6`,outlineVariant L `#C9C4D0` / D `#48454E`。
- **surface 与 5 级 surfaceContainer\*** ← v0.3.0 schemes 早于 2025 角色体系、无 container 层级输出,故按 M3 tone 阶梯用 `palettes.neutral.tone(t)` 生成:light 底 t98、容器阶梯 t100/96/95/94/92;dark 底 t6、容器阶梯 t4/10/12/17/24。
- **完整角色集:** theme.css 一次性落全部标准 M3 role(secondary/onSecondary/secondaryContainer/onSecondaryContainer、tertiary 系、error 系、outline、outlineVariant、**scrim**、surfaceVariant/onSurfaceVariant、surface 系、primary 系、inverse 系),禁部分列举——v1 缺 secondary/scrim 而 §3 的 tonal-pill/chips/lightbox 正需要它们。

明暗策略:默认 `prefers-color-scheme`,app bar 手动开关(存 localStorage)。

### 2.2 形状 / 排版 / 栅格 / 边框

- shape xs4/sm8/**md12 卡片**/lg16/xl28 · full=9999px(CTA pill、搜索框)
- typography 15 阶全量落 token;hero 用 Display 级(桌面 72/92 档起步,按 1040dp 列宽实际定)
- 4/8dp 栅格;内容列 1040dp;断点 600/840/1200/1600
- **交互控件描边用 `outline`,不用 `outlineVariant`**(实测 outlineVariant-on-surface 1.67:1,过不了 WCAG 1.4.11 非文本 3:1;outlineVariant 只留给分隔线)
- **app bar 滚动态 = M3 tonal elevation:`surface`→`surfaceContainer`,无投影**(v1 的「elevation2 双层阴影」是 M2 行为,违「严格 M3」,已纠)

### 2.3 动效(时长表修正,v1 把 medium2 标成 350ms)

```
short1–4  50/100/150/200ms     medium1–4  250/300/350/400ms
long1–4   550/650/750/1000ms
easing-emphasized              cubic-bezier(0.2,0,0,1)
easing-emphasized-decelerate   (0.05,0.7,0.1,1)
easing-emphasized-accelerate   (0.3,0,0.8,0.15)
```

配对:enter = **medium4 400ms** emphasized-decelerate;exit = **short4 200ms** emphasized-accelerate;in-place = **long2 500ms** emphasized。
滚动揭示 stagger **60ms = 站点级常量,非 M3 token,如实标注**。`prefers-reduced-motion` → 全 0ms 直出。

### 2.4 (预留位——无内容,勿删此行号,§2.5 编号连续)

### 2.5 艺术方向(承接「大厂」+「震撼×简洁」——v1 此处只有工具表,零艺术决策)

- **视觉预算:** 每 section 只讲一件事,桌面 ≤1 个 100vh 屏;新增元素必须先砍同类(「宁删勿加」)。7 段高密度与「简洁」的矛盾在此裁决。
- **hero 构图:** 非对称 55 文 / 45 设备框;单行 Display 大字;禁居中三件套堆叠(模板味)。
- **图像单一策略:** 只用设备框真机截图;禁 stock 图、禁假 UI。
- **signature motif(个性+震撼同载体):** logo 紫渐变软 blob(径向渐变团)贯穿 ≥3 处(hero 底 / 下载区上 / footer 内)——全站唯一视觉主角,复用时相位/饱和度微变。
- **密度裁剪:** 功能卡 6→**4**(①三视图课表 ②348 校教务直连 ③提醒与 Widget ④本地优先隐私;主题定制/导入导出移入截图画廊,「show don't tell」)。截图 12→**8 张,精确清单**(已核实在仓):`01-schedule-week / 02-schedule-grid / 03-today / 11-theme / 22-reminder / 36-theme-dark / widget-weekgrid / widget-today`。
- **留白预算:** section 间距桌面 128dp / 移动 80dp。
- **文案闸:** slogan 与 microcopy 先在 §2.6 定稿、用户签收,才进实现。

### 2.6 个性与亲近载体(新增——v1 此两条标准落点为零,自查表连映射行都没有)

- **slogan 候选(3 选 1,用户签收;中英成对):**

  | # | 中文 | EN |
  |---|---|---|
  | A | 构建无壳,自由自在 | Built open. Feels free. |
  | B | 把课表还给学生 | Your timetable, back in your hands. |
  | C | 348 个校园的早八,都归我管了 | 8 a.m. classes at 348 campuses. Handled. |

- **第一人称维护者叙事块(§3⑥ 升级为主角区块,不再是链接行):** 「一个人写的开源课表。没有广告,没有追踪,代码全公开。适配你学校的问题,群里 @ 我。」3–4 句 + QQ 群 + sponsor 入口。单人开源身份 = 最强亲近资产,v1 把它埋了。
- **microcopy 口吻契约:** 第二人称、口语、校园梗克制。样例句定死进 spec,实现逐句引用:
  - 教务搜索空态:「这所学校还没收录——提个 issue 或进群说一声,它很快会在。」(外链指 `https://github.com/lingion/sleepy/blob/main/FAQ.md`,已核实存在——修 v1 悬空链接)
  - 下载区注脚:「拿不准就 Universal,通吃。」
  - 暗色开关 tooltip:「晚课专用。」
  - JS 禁用降级提示:「页面塌了,课表不会。」
- **个性红线:** 禁企业腔(「赋能/极致/匠心」类词零出现);禁假社区感(不吹 star/下载量)。

## 3. 页面结构(单页 7 段,密度按 §2.5 收缩)

```
app bar  sticky · 滚动 tonal 升 surfaceContainer(无阴影)· zh|EN · 明暗开关
① hero   slogan(§2.6)Display 大字 + 双 CTA[下载 filled-pill / 在线体验 tonal-pill]
         右侧设备框 01-schedule-week · blob motif · enter=medium4 400ms decelerate
② 功能   4 行图文交替(M3 card md12,surfaceContainer 分层,滚动揭示 60ms stagger)
③ 教务   搜索框(full 圆角,outline 描边)+ 省份|协议 chip 组(用户定稿口径,已决,见 §4.1)
         统计 chip「348 校 · 33 协议」;点击不跳转;空态 microcopy 见 §2.6
④ 画廊   8 张设备框网格 → lightbox(aria-modal,焦点圈定,Esc/←→,焦点归还)
⑤ 下载   latest 大按钮 + 四 ABI 表 + sha256sums + Android 8.0+ + 商店徽标灰态
⑥ 信任   维护者叙事块(§2.6)+ 无 Firebase/Sentry/广告 SDK、GPL-3.0、本地存储 + 社区链接
⑦ footer inverse-surface · blob motif 第三次复用
```

双语:zh 根 `/`,en 镜像 `/en/`,hreflang 互指,语言=content collections 构建期切换。

## 4. 数据流

### 4.1 schools.json(教务列表)

真实 schema 全列(v1 曾误列):`name / sortKey / sortKeyFull / url / type / aliases / status / enableFetch`。

- **省份分组(已决,保留用户口径):** 构建脚本产 `src/data/schools.grouped.json`——215/348 所按校名前缀(31 省 + 28 主要城市表)可判;剩余 133 所靠**人工校对映射表 `src/data/province-map.json` 一次性入仓**(含 EN 省名)。不变量:**覆盖率必须 100%,否则构建失败**。
- **边界:** `sortKey='*'` 两条(北邮 VPN/WebVPN,已实测)进「其它」桶,不静默丢。
- **EN 页策略(已决):** 校名保留中文(专有名词不机翻),`sortKeyFull` 拼音检索可搜「qinghua」类输入;省份 chip 用映射表 EN 名;协议类型给 EN 标签表。
- 快照表述修正:v1「不放副本」与「commit 快照」自相矛盾——本仓快照是**有意冻结副本**(构建可复现),网络拉取仅为刷新入口。

### 4.2 Release 资产

构建期拉 `repos/lingion/sleepy/releases/latest`,资产名已实测锁定:`app-arm64-v8a-release.apk / app-armeabi-v7a-release.apk / app-x86_64-release.apk / app-universal-release.apk / sha256sums.txt`。
**防腐烂(v1 无刷新机制,周更节奏下 CTA 会烘死旧 tag):** ①GitHub Actions `schedule: nightly` 重建自动烘最新 tag;②push main 触发;③可选增强(需单独批准):sleepy 主仓 release.yml 末尾调 CF Pages deploy hook,即时刷新。

### 4.3 截图

构建期从主仓 raw(main)拉 8 张清单,仓内缓存副本兜底;Astro `<Image>` srcset/AVIF。

## 5. 错误处理

- schools/releases/screenshots 网络失败:警告 + 仓内快照,不阻塞构建
- 搜索空结果:microcopy 句 + GitHub FAQ 外链(§2.6)
- lightbox 可访问性:aria-modal / 焦点圈定 / Esc 关 / 焦点归还 / ←→ 换图(§3④)
- JS 不可用:教务搜索降级为全量分组静态渲染 + 提示句(§2.6)

## 6. 测试与验收

- vitest 纯函数:省份覆盖 100% / `'*'` 桶 / 校名+拼音搜索 / 分组计数(348/33)/ ABI 表
- 对比度:**文本对**(on-*/text,scheme 配对天然 AA)与**非文本对**(outline-on-surface ≥3:1)分开断言——v1 一句「配对满足」对非文本是 overclaim,已拆
- 动效时序:**人工核对表**(逐 section × §2.3 配对),不假装自动锁(v1 §8 铁律③系假绿,如实降级)
- Lighthouse 四项 ≥95(移动);hreflang/sitemap 断言;CF Pages preview 全链路 + `sleepy.lingion.eu.cc` 正式域演练
- 主观标准验收(可机械化的部分):§2.6 样例句逐句出现在产物;blob motif ≥3 处;红线词全文零出现(grep 断言);slogan 命中签收项

## 7. 开放项(复审时定)

1. **CF Token:** deploy CI 需**另一 CF 账号**的 `CLOUDFLARE_API_TOKEN`+`ACCOUNT_ID`,用户粘贴 → `gh secret set`(🚫Keychain;push/release 走 release-sop §6 批准闸)。
2. logo SVG 矢量化重绘另立任务,首版 PNG+缩图。
3. 主仓 deploy-hook 一步 PR(§4.2③)是否做,单独请示。
4. **slogan 3 选 1 + 微文案样例句签收**(§2.6)——本 spec 复审的必答项。

## 8. 用户原话 vs 实现落点(v2)

| 用户原话 | 落点 | v1 判定 | v2 状态 |
|---|---|---|---|
| 大厂风格 | §2.5 艺术方向规则(构图/图像策略/留白预算) | 仅断言 | ✓ |
| 最震撼简洁 | §2.5 视觉预算+宁删勿加+6→4 卡/12→8 图 | 未处理 | ✓ |
| 又有我个性 | §2.6 slogan/第一人称/microcopy/红线 + blob motif | 缺失 | ✓ |
| 用户感到亲近 | §2.6 叙事块+样例句逐句进产物(§6 验收) | 素材无设计 | ✓ |
| 严格 M3+md 动画 | §2.1 逐行标源/§2.2 tonal 纠 M2/§2.3 值修正/stagger 标非-M3/§0 Expressive 缩减为可见决策 | 三处违规 | ✓ |
| 教务列表省份/协议分组 | §4.1 省份已决保留,映射表为交付物+100% 不变量 | 自相矛盾 | ✓ |
| 双语 | §4.1 EN 校名中文+拼音检索策略 | EN 不可用 | ✓ |
| 下载直链四ABI+sha256 | §4.2+防腐烂三通道 | 会腐烂 | ✓ |
| 预览跳转 | ①CTA+④画廊(lightbox a11y 补齐) | 缺 a11y | ✓ |

**顺序类条款不变量自查(v2 修正):** 滚动揭示次序 = 「DOM 顺序即出现次序,每次进入视口都触发」(不变量);app bar = 「永远置顶,滚动后恒为 surfaceContainer」;blob ≥3 处为「hero/下载/footer 各一」固定位,非快照计数。

## 9. 参考(§0/§2.3 断言出处)

- M3 motion tokens/easing 与时长:material.io/design/motion(standard/emphasized 缓动系,short/medium/long 1–4 命名)
- M3 Expressive Web 端缺席:@material/web maintenance mode 公告(repo README);material.io expressive 主题博客以 Android 首发
- surface tone 阶梯:M3 2025 color roles + `CorePalette/palettes.neutral.tone()` v0.3.0 实测值
- 种子色:python3 PIL 抽色 `~/sleepy/docs/logo.png`(99.7% 不透明像素落紫渐变带,芯簇均值 `#9B87FE`)
