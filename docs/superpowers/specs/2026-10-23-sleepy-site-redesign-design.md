# Sleepy 官网重构 v4 设计文档 — 八段异构动线 × MD3 骨骼级视觉规范

> 状态:**待批准**(批准后进入 writing-plans)
> 取代:`2026-10-18-sleepy-site-design.md`(其六段结构、cover 裁切、reduced-motion「0ms 直出」契约随本文废弃)
> 输入:Workflow 会商 8 份产出 — 提案 P1(页面建筑)/ P2(视觉动效)、评审 critique_goals / critique_feasibility、调研四路已落盘 `docs/research/*.json`(引用记 [ia-flow] [motion] [premium] [material-web];文中百分比论据均出自该四档,评审可及)
> 标注:**[我定]** = 冲突裁决/实施选择,已写死可审阅;**[待你批]** = 集中在 §13,不批不进实施。

---

## 1. 意图与病根

现站六段全是「左文右图一块板」。病根三条:**①结构原型单一**(无节奏);**②有 token 无体系**(M3 变量只当皮肤,页面建筑/间距/elevation/动效未消费其语义 →「像 AI 模板」[premium]);**③截图失真**(首图非周视图;20-import/22-reminder 被 `cover+max-block-size` 裁掉主体;小组件比例失真)。

目标:访客对软件 UI 建立直观印象 → 觉得「很有设计感」→ 诱发下载;传达**优雅轻便、隐私好、功能强大**;Material Design 从皮肤层推进到骨骼层。

## 2. 目标 / 非目标 / 反目标

**目标**
- G1 八段异构,相邻段结构原型不同
- G2 转化链 HOOK→OVERVIEW→DEEP DIVE→TRUST→CONVERSION,Download 居末
- G3 截图=产品本体:完整可读、屏幕本体、只裁无效区
- G4 动效克制:唯一重动效给 hero 编排,正文统一 reveal,零循环动画
- G5 全站文案重写为官方书面语,zh/en 同形镜像
- G6 明暗双主题、375–1600px、reduced-motion、JS-off 全成立
- G7 LCP/CLS 不退化,中端安卓帧率优先

**非目标**:app-shell 骨架(FAB/抽屉/bottom sheet/tabs)禁入 [material-web];运行时取色;动画库/新依赖(构建期 gen-tokens 管线与 vanilla 岛保留);第三语种。

**反目标(技术全过但长这样=失败)**:AI 模板脸六件套 — 紫渐变 blob 满天飞、全站统一圆角同投影、满屏居中三行 hero、小字号层级、设问文案、等权卡片墙 [premium];「每处都动」=炫技;「数字都在跳」=玩具感。

## 3. 六条硬约束 → 落点与验收(逐条)

| # | 用户口径 | 落点 | 产物级验收断言 |
|---|---|---|---|
| C1 | 首页第一张图=周视图 | §4 M1 | dist 中首页文档序第一个 img 元素 src 含 `01-week`(不变量断言,非快照);375px 首屏内周视图上沿可见(截图目检) |
| C2 | 官方书面语;一意思一正面述;禁设问/反问/正反重复/口语;中英双语 | §7 | 全部 zh/en 串过正则(半角?、全角?、吗、呢、不慌、扫一眼)零命中;键树同形闸续绿;交付附 zh/en 全键 diff 表(en 长度列) |
| C3 | 教务直连+提醒两图完整显示;截断只许无效区 | §5.4、§8 | 20-import/22-reminder 预处理后 contain 自然比例渲染,CSS 无 cover 于该两图;断言图列盒宽高比=裁后资产宽高比 ±2% |
| C4 | weekgrid 高×2 更竖;weeklist/today/twoday 高÷2 更扁 | §8 资产(**已解决**) | **已验收资产为准**:renderer 直出 825×1375 / 825×343 / 825×550(用户 2026-10-23 验收「就这个样子」;weekgrid 3:5 替代字面 ×2 算术,以批准资产为准);站内卡片容器=资产自然比例,禁二次裁拉 |
| C5 | Material Design 贯穿结构 | §4 每段容器语言、§5、§11 | 全部消费 `--md-sys-*` token;新增值(§11-7)入 token 表;硬编码色值零新增 |
| C6 | 响应式 375–1600 / reduced-motion / zh-en 同形 | §9、§6、§7 | §9 逐段五档剖面表全覆盖;reduced-motion 见 §6-12;键树闸 |

## 4. 页面建筑:八段异构动线(P1 为骨架,冲突处按裁决清单定案)

段序(自上而下):**AppBar → M1 Hero → M2 三视图总览 → M3 教务直连 → M4 学校名录 → M5 提醒与组件 → M6 截图长廊 → M7 信任 → M8 下载 → Footer**。

关键重排:Trust 移到 Download 之前、Download 全页居末 [ia-flow 六段弧:TRUST 10-15% → CONVERSION 8-10%]。现站 Download 夹在 Gallery 与 Trust 之间=论证未完先要行动,废弃。

相邻段原型轮换(治同质):split → showcase 面板行 → 编辑 split → 工具岛 → pinned 双列 → full-bleed 断章 → 单栏编辑 → tonal 转化带。全宽与容器交替:M2/M6/M8 全宽带,M4 容器岛。

### AppBar(常驻导航)
sticky 置顶;三段式:品牌标(左)/锚点文字链 功能·学校·组件·信任(Text 档,≤840px 隐藏)/右侧 [下载] Filled S 紧凑主按钮 + 语言 + 主题。滚动态 surface→surface-container tonal 升起,边界 outline-variant 发丝线,无投影,仅 background-color 过渡 150ms。高 64px。**新增配套**:`section[id]{scroll-margin-top:80px}`(锚点落点防 sticky 栏盖段标题,上线即现缺陷 [feasibility])。禁 FAB/抽屉 [material-web]。

### M1 Hero(HOOK,8-10% scroll,surface 底)
非对称 split 55/45。左=display-large 标题(clamp 36→57px,字重 400)+≤15 词副题(body-large,行宽≤46ch)+CTA 组:[下载 Android] Filled XL(全页唯一实心)+[在线体验] **Text 档** [裁决:P1 明令 Text 拉开重量差,P2 剖面画 Tonal — 取 P1]。右=01-week 周视图截图(C1):屏幕本体无设备框,预处理裁状态栏+导航键后按自然比例 contain 完整显示,容器写死 aspect-ratio 防 CLS,**直接绘制零动效**(LCP 保护,§6-3)。带底佐证 ribbon:**348 校教务直连 · GPL-3.0 开源 · 数据留存本机** — 不对称排版(大数字 348 用 display-small + tabular-nums 领头,两短语跟随),非等距三点分隔 [goals-minor:去 SaaS 模板腔]。桌面段高内容驱动(图列 38-42%,删「80vh」硬数 [feasibility]);手机 375px:文字+CTA+ribbon 在上,周视图**上半部预览裁切**入首屏、下沿自然出血,完整图留给 M2 面板 [裁决:保 C1 移动落地,弃 P1「50vh+截图下置」=首图被推出首屏违 C1;**[待你批 R2]**]。全页唯一渐变只许在此带内、同色相超低 alpha。

### M2 三视图总览(OVERVIEW,10-12%,surface-container-low 全宽带)
Stripe showcase 面板行 [ia-flow]:三块宽窄不一面板(网格视图最宽——用户定调绝大多数人用网格;大 tile 注视时间 2.6×)。**[裁决:面板并排为唯一呈现,切换器降级为「点面板即切换前景放大」的交互,不再同时声称两 UI 互斥形态 — goals-major#5①]** 复用现有 data-view CSS 状态机+radiogroup 键盘漫游(已实现,2026-10-23 增补),脚本选择器解耦为全局 `[data-views]` [feasibility]。**选择器视觉升级为 MD3 Segmented Button(M3 签名控件,2026-10-23 用户增补):描边药丸组 1px outline、段间发丝 outline-variant、选中段 secondary-container + check 图标 + on-secondary-container 字;radiogroup 语义不变,仅 dots 外观重铸。**每面板 26px 轻量小标题,一面板一主张。段标题 headline-medium 左置。

### M3 教务直连(DEEP DIVE 1,surface 底)
编辑式 split 文左图右。截图=20-import 预处理裁无效区后 contain 完整显示(C3),图列约 420px 宽、行高随图,文字列垂直居中。卡缘浮 assist-chip 标注「348 校直连」。文案一主张:选校登录即得课表、改版由维护者跟进(书面语)。显影动效=**遮罩块等效方案**(同底色 div translateY(100%→0) 纯 transform,合成线程)替代 clip-path 主线程重绘 [裁决:feasibility-major#5 — clip-path 600ms 对 ~2MP 图中端安卓掉帧;若实施实测帧率过关可换回 clip-path,不进默认]。全站唯一一次。

### M4 学校名录(PROOF 工具岛,surface-container 岛卡)
容器/全宽交替的「容器」拍。圆角用现有 **extra-large 28**(不引入 32 档,§11-7)[裁决:goals-minor token 越权]。保留现有交互:outlined text-field 搜索+省份/协议双排 filter chip+分组列表。**段内滚动改 60vh→桌面保留、≤840px 取消嵌套滚动改全量直出**(触屏嵌套滚动劫持整页)[goals-minor#12]。statLine 大字前置:**「348 条收录 · 33 种协议」**(2026-10-23 实测 schools.grouped.json=348 校/33 协议键;数字一律构建期从数据派生禁手写,「8 协议族」是 App 仓概念站方无映射 — goals-major#2 修正)。JS-off 全量可读、空态指 issue 继承。动线最强转化瞬间=访客亲手搜到自己学校。

### M5 提醒与组件(DEEP DIVE 2 + 生态,surface 底)
pinned 双列桌面:左列=22-reminder 预处理后完整显示+position:sticky;**[裁决:改「矮列钉高列」— sticky 元素高度必须 ≤ 视口内容区,裁后 reminder(约 663-833px 高)钉不住,故左列改 sticky 的压缩叙事条(提醒截图缩略+一行主张),完整图在右列滚动流首 — goals-major#5②]** 右列滚动:课前提醒/今日摘要/明日预告三 beat + 尾部组件墙。组件墙(C4 已解决):**已验收新资产直接作图** — weekgrid 825×1375 竖卡(全页唯一 elevated 主角卡 [裁决:elevated 归 hero 还是 M5 — 取 P1 给 M5 主角卡;hero 截图靠 1px 描边+背景带跳出即可,§5.3])、today/twoday/weeklist 825×343 扁条×3 叠放模拟桌面排布、weekview 825×550 可入 M6 长廊。≤840px:取消 sticky,图上文下;组件墙改横向 snap 滚动,竖卡定高 280px 封顶。

### M6 截图长廊(FULL-BLEED 断章)
**换幕带** [裁决:goals-major#7 + feasibility-critical#4 — inverse-surface 在 dark 主题是浅灰 #E6E1E6 非恒定深色,两案表述失实]:新增 token `--site-band-bg: #313033 / --site-band-fg: #F4EFF4`,**恒取 light 主题 inverse 实值、不随主题翻转**,带内 Shot 强制浅色版截图(深底配浅 UI 恒成立)。原型:横向 filmstrip,**叠压仅限装饰性背景层,可点缩略图完整可见**(叠压遮内容违 C3 精神)[goals-minor#10]。收编其余全部截图(manage/theme/mine/grid/today/weekview 等)。点击进 lightbox(现有岛 a11y 全项保留:焦点圈定/Esc/方向键/主题感知换图)。带内无按钮,仅 Text 链。

### M7 信任(TRUST,10-15%,surface 底)
安静编辑式:headline 段题+第一人称叙事单栏(行宽≤34ch)+**三块 outlined 卡(隐私=架构/GPL-3.0/社区)→ 改「1 主 2 次」非等权排**:隐私卡做宽主卡带一句机制陈述,开源/社区降为行式列表 [裁决:goals-minor#10① — 三等卡=图标网格模板脸变体,与 P1 自禁条款冲突]。1px outline-variant 发丝边、零投影。文案:每个意思正面陈述恰好一次(「课表数据仅存于本机,不经任何服务器」)。

### M8 下载(CONVERSION,8-10%,primary-container tonal 带)
全页唯一彩色大面,收拢全部论证。左=版本行(tag·日期·minSdk,tabular-nums)+ABI 下载行列表(保留现有行式:架构名+人话注+大小+图标,universal 推荐 badge)+sha256/商店占位/在线体验跟进链;右=网格视图截图完整显示。主按钮 [下载 Android] **Elevated 档**(官方定位:彩色容器上替代 tonal)[material-web];此处与 Hero 的 Filled XL 构成全页仅有的两枚 XL 级主按钮。全部转化元素普通 DOM(可爬/可键盘/可触摸)。对比度按 on-primary-container 配对逐主题验证;light 主题 container 偏浅时下载行文字重新校对比。

### Footer
保留现有结构;**删 primary-fixed 细色带提案**(fixed 色 P2 明令暂不引入且两案互斥)[goals-minor#11]。surface-container 底+发丝 outline-variant 顶边。锚点回顶+GitHub/FAQ/QQ。

---

## 5. 视觉规范(皮肤→骨骼)

### 5.1 排版:MD3 15 阶按角色消费,禁魔法字号
Hero H1=display-large(57/64,字重 400,clamp(36px,5vw,57px),tracking -0.25px;CJK 栈允许 500,禁 600+——高级感靠尺寸差与留白不靠加粗 [premium]);量化大数字(348)=display-small 36px + `font-variant-numeric: lining-nums tabular-nums`;段标题=headline-large 32px(≤840px 降 headline-medium 28);卡题=title-large 22;列表项题=title-medium 16/500;正文=body-large 16(主叙述)/body-medium 14(辅助),行宽≤46ch、内容列 1040px;图注=body-small 12 + on-surface-variant;按钮=label-large 14/500;eyebrow=label-medium 12 + tracking 0.5px(仅拉丁做 uppercase)。相邻级差≥1.33,禁插入 18/20 不可辨级。全站统计数/版本号/节次时间 tabular-nums,计数器列不跳动;十六进制串加 slashed-zero。

### 5.2 间距:8dp 双尺度
宏观段距:桌面 `--site-section-gap` 128 保留,≤840px 80 保留,**新增 ≤600px 档 48** [ia-flow 96/64/48 递减]。块内文距 24-32(标题→正文 16,正文→CTA 32)。hero 首段 padding-block 上 120 下 96。组件内距全 8 倍数,禁两个不可辨近似值。

### 5.3 色彩:一支强调色 + tonal 分区
彩色只允许 primary 一支,面积<10%,只出现在交互锚点(Filled 按钮/链接/选中 chip/进度)。层次靠中性色阶。分区色阶(桌面 light 主题):Hero surface → M2 container-low → M3 surface → M4 container(岛) → M5 surface → **M6 恒定换幕带(--site-band,见 §4)** → M7 surface → M8 primary-container。截图卡 container-lowest 跳出。卡三档按层级:默认 filled/需边界 outlined/全页唯一 elevated=M5 周网格主角卡。阴影:截图容器 1px outline-variant 描边 + hero 与 elevated 卡用 MD3 elevation 双层影(0 1px 2px rgb(0 0 0/.30), 0 2px 6px 2px rgb(0 0 0/.15)),光源统一正上方(y 恒正 x 恒 0)。禁装饰分隔线,段界=色阶跳+留白。**暗色节奏补丁** [goals-major#7:dark 主题相邻级差 ΔL≈2-4% 近不可见]:dark 下段界额外加 1px outline-variant 发丝顶边 + M2/M8 带改用 container-high 拉大步长;交付含双主题节奏剖面图。**blob 3→1 裁决:[待你批 R1]** — 推荐仅 hero 保留 blob#1,Download 带改 primary-container 平涂、Footer 改 surface-container 深档(签名渐变全站一次 [ia-flow]);备选=保留三处但非 hero 两处 alpha 减半。**配对红线**:primary 上必 on-primary;container 上必 **on-*-container** [裁决:goals-minor#11 — P2「container 上必 on-surface」表述与 M3 语义冲突,统一为 on-*-container];交互边=outline(3:1),装饰边/分隔=outline-variant,不互换(继承 global.css 红线)。

### 5.4 截图呈现=屏幕本体
弃设备框。裁切白名单(硬约束 C3 的执行定义):顶部状态栏带、底部安卓导航键带、组件下缘空白带;其余像素一律保留。手机竖图无效带实测口径:状态栏 y0-112、导航键 y2100-2340、安全内容带 y112-2100;**逐张目检定带,禁批处理估参** [feasibility-minor#12:该带实测成立;import 内容止于 y~2080、reminder 止于 y~2100]。嵌套圆角子<父。多屏层叠只许装饰层(§4 M6)。

---

## 6. 动画编排表(逐点定死;数值全部取自带 token,禁 fork 平行曲线)

总闸 [motion]:动效预算全页只花一次给 hero 编排;正文共用一条 reveal 语法;delight 仅首次档;用户在读的数据不为风格移动。

| # | 对象 | 触发 | 属性 | 时长 | 曲线 | 备注 |
|---|---|---|---|---|---|---|
| 1 | Hero 标题 | load 一次性 | translateY(24px)→0 + opacity | 500ms | emph-decel (0.05,0.7,0.1,1) | CSS animation(合成线程,加载期不掉帧) |
| 2 | 副标/CTA/ribbon | 同链 | 同 | 500ms | 同 | delay 100/200ms,全编排 ≤1.2s |
| 3 | hero 周视图(LCP) | — | **禁位移禁 opacity-from-0,直接绘制零 fade** | — | — | 容器 aspect-ratio 预置 CLS=0 [裁决:goals-minor#15 — P2 的 ≤100ms fade 亦取消,两案统一「直绘」] |
| 4 | 正文段 reveal | IO rootMargin -10%,命中即 unobserve | translateY(16px)+opacity | 400ms | emph-decel | stagger --reveal-i×60ms,段内≤6项;数值全盘沿用现站 |
| 5 | 三视图切换 | click | transform+opacity+filter | 300ms | (0.23,1,0.32,1) | reduce 下位移归零 |
| 6 | M3 显影(全站唯一重武器) | 首次入见 | 遮罩块 translateY(100%→0)(等效 clip-path) | 600ms | (0.77,0,0.175,1) | 一次性;帧率实测过关才可换真 clip-path |
| 7 | 卡 hover | (hover:hover)and(pointer:fine) | translateY(-2px)+阴影 L1→L2 | 200ms | emphasized (0.2,0,0,1) | 触屏不触发 |
| 8 | 按钮 press | :active | scale(0.97) | 160ms | (0.23,1,0.32,1) | 键盘触发的动作零动画 |
| 9 | AppBar 滚动态 | scrollY>8 | background-color 仅 | 150ms | emphasized | 数十/日档:只变色 |
| 10 | lightbox | click 开 | scrim opacity 200ms + 图 scale(0.96→1)+opacity 300ms | 300/200 | (0.2,0,0,1);关对称 emph-accel (0.3,0,0.8,0.15) | modal 偶尔档;reduce 仅 opacity |
| 11 | ~~blob 循环动画~~ | — | — | — | — | **删除** [裁决:feasibility-major#6 — 现站 Blob.astro 是静态层、全仓无 @keyframes,P2 基线虚构;blob 保持静态即合规;氛围感并入 #1 编排给 blob 一次 opacity 入场] |
| 12 | 语言/主题切换 | click | color 150ms 唯一 | 150ms | — | 禁花哨转场 |
| 13 | 348 数字 | — | **不做 count-up** | — | — | 功能闸门:用户在读的数据不为风格移动 |

**禁动清单(评审即否决)**:transition:all、scale(0)、ease-in 入场、滚动往复重放、非营销 >300ms、数据层 transform、裸 scroll listener 做 reveal、经父级 CSS 变量驱动子元素 transform。

**reduced-motion = 更少更柔非归零**:位移/缩放/视差/循环全停,reveal 保留 opacity 200ms ease 淡入(现站 0ms 直出升一档)[motion];**落地同步项** [裁决:feasibility-minor#9 — a11y 测试是松断言改不动,真冲突在组件]:Features.astro 切换器写死的 `transition-duration:0s` 改引 token;旧 spec §2.3「0ms 直出」契约文本随本文废弃;FOUC 的 .js 门控保留(无 JS=内容直出)。

**LCP 修复(两案共同盲点,feasibility-critical#2)**:Shot.astro 加 `priority` 入参 — LCP 版输出 `fetchpriority="high"`+eager,主题隐藏版 `fetchpriority="low"`+lazy;display:none 版浏览器可跳过;Base head 对 light 版最优 srcset 加 `<link rel=preload as=image imagesrcset>`。验收断言:dist 恰一 img 带 fetchpriority=high。01-week 720w 42KB 需补 2 倍图档与 webp 尺寸档,以裁后真实资产实测。

## 7. 文案策略(C2)

**改写规则五条** [P2§6 + premium 模板脸⑥]:
- R1 一个意思只正面说一次,正反同义两句删一句
- R2 禁一切问句形态(设问/反问/「…?」/「看看…不在」式间接问)
- R3 否定枚举改正面机制陈述(「没有广告,没有追踪」→「数据只存本机」这类机制句;确需禁令用「无 X」单次出现,不排比)
- R4 去口语(「不慌」「扫一眼就有答案」「该出现时出现」→书面陈述)
- R5 zh/en 同形镜像,改 zh 必同步 en(键树闸保结构)

**对照例(P2 给的四组 + slogan 裁决)**:
| 位置 | 原文 | 改后 | 规则 |
|---|---|---|---|
| hero.sub | 课表是你的,数据留在你手机里。 | 课表数据仅存于本机,不经任何服务器。 | R1 正反重复 |
| download.trial | 不想安装 APK?在线体验功能完整。 | 在线体验提供完整功能,无需安装。 | R2 设问 |
| schools.sub | 全部收录按省份和教务系统分组。搜一下,你的学校在不在。 | 全部收录按省份与教务协议分组,支持校名或拼音检索。 | R2+R4 |
| meta.description | 没有广告,没有追踪,代码全公开 | 348 条教务直连,数据仅存本机,源码完整公开。 | R3 |
| 段标题 | 你学校在哪一档 / 真实截图,无渲染图 | 收录与检索 / 全部为真机截图 | R2/R3 |
| hero.slogan | 构建无壳,自由自在 | **[待你批 R3]** 推荐「无需账号,装上即用。」(正面机制陈述);保留派=视为品牌 slogan 豁免 R2/R4,但须书面 | R2/R4 打击对象 |

槽位约定:每段一主张;槽位宽度按 **en 最长值** 定(en 实测比 zh 长 1.3-1.6×,双语验收第一个会暴露溢出)[feasibility-minor#11];新增 UI 串(AppBar 锚点名/beat 题/chip 标注)一律进 zh.ts+en.ts,禁组件内 ternary 硬编码(泄漏闸只 walk zh.ts)。版式回退顺序:超槽先删 ribbon 词数,不删截图。

## 8. 资产工作(C3/C4)

1. **小组件 10 张:已完成并验收** — sleepy 仓 `feat/widget-capture-ratios` 分支 commit `a0d4764a`(renderer 直出,未 push);落站时按 sleepy-site 现有 webp/png 双格式规范转换,尺寸 825×1375(weekgrid)/825×343(today/twoday/weeklist)/825×550(weekview)×light/dark。
2. **手机竖图三张预处理(不可逆,执行前原图入 git)**:01-week/20-import/22-reminder 各 light+dark 裁状态栏 y0-112、导航键 y2100-2340(逐张目检 ±微调,reminder 底带止于 y~2100);产物入 `src/assets/screenshots/`,原图保留改名 `*-raw.*` 跟踪一期,验收后删。
3. **weekview 完整图入 M6;hero 手机裁法**(R2 批准前不实施):首屏预览版=裁上半部(周网格+表头完整,列表卡以下出血),桌面 M2 用完整图。
4. 交付时更新 CAPTURE-MATRIX 口径注:新 10 张为 renderer 直出(非桌面实拍)。

## 9. 响应式逐段剖面(C6;五档 375/600/840/1200/1600)

| 段 | 375 | 600 | 840 | 1200 | 1600 |
|---|---|---|---|---|---|
| AppBar | 品牌+[下载]S+语言+主题(锚点隐) | 同左 | 同左(≤840 锚点隐) | 全展开 | 全展开,内容列 1040 居中 |
| M1 | 文+CTA+ribbon 上,周视图上半预览下置(edge-to-edge 钮) | 同左 | split 恢复 55/45 | split | split,图列≤42% |
| M2 | 三面板纵堆,网格卡首 | 纵堆 | 纵堆 | 面板行 3:1:1 宽窄 | 面板行,内容列 1040 |
| M3 | 图上(整幅)文下 | 图上文下 | split 文左图右 | split | split,图列 420 封顶 |
| M4 | 岛满幅,无段内滚动(全量直出) | 同左 | 岛 92vw | 岛 1040 内,桌面段内滚动 60vh | 同 1200 |
| M5 | 压缩叙事条+图上文下;组件墙横向 snap,竖卡定高 280 | 同左 | 同左 | pinned 双列 | 双列,列宽封顶 |
| M6 | filmstrip 横滚 snap | 横滚 | 横滚 | 横滚错落 | 横滚,轨道宽 1040 |
| M7 | 单栏+主卡+行式 2 项 | 同左 | 单栏 | 单栏+右挂主卡 | 行宽≤34ch |
| M8 | 钮 edge-to-edge,ABI 行全宽,截图置底 | 同左 | 单列堆叠 | 左右分栏 | 分栏 1040 内 |
| 段距 | 48 | 48 | 80 | 128 | 128 |

## 10. ASCII 布局图(桌面 1440 剖面,设计规范四铁律②)

```
┌── AppBar 64px ── surface→(scroll)container · 仅变色150ms ───────┐
│ Sleepy     功能·学校·组件·信任 (Text)   [下载]S Filled · EN · ☾ │
├─────────────────────────────────────────────────────────────────┤
│ M1 HOOK · surface                              ~9% scroll       │
│ ┌─文 55%──────────────┐ ┌─图 45%───────────┐                    │
│ │ display-L 57/400     │ │ ★01-week 周视图  │ 直绘零动效(LCP)   │
│ │ ≤15词副标 ≤46ch      │ │ 屏幕本体·XL28容器 │ 裁状态栏+导航键    │
│ │ [下载]FilledXL[体验]Text│ │ 1px描边·aspect钉 │ blob 全站唯一处   │
│ └─────────────────────┘ └──────────────────┘                    │
│ ribbon: **348** 校教务直连 · GPL-3.0 · 数据留存本机(不对称)     │
│ 编排: 标题0ms→副标100→CTA200 · 500ms emph-decel · Σ≤1.2s        │
├─ 色阶跳 ────────────────────────────────────────────────────────┤
│ M2 OVERVIEW · container-low 全宽 · showcase 面板行  ~11%        │
│  [ 网格视图 816px ][ 周 400px ][ 今日 400px ] 点选放大           │
├─ 色阶回 ────────────────────────────────────────────────────────┤
│ M3 DEEP DIVE1 · surface · 编辑 split                            │
│  文:直连因果          ▓遮罩块上滑显影(全站唯一×1)               │
│              [20-import 整幅 contain + chip「348校直连」]        │
├─────────────────────────────────────────────────────────────────┤
│ M4 PROOF · surface-container 岛(radius-xl28)· 容器拍            │
│  [搜索 outlined] [省份chip排][协议chip排] [清单 桌面60vh内滚]    │
│  statLine「348 条收录 · 34 种协议」tabular 大字   ★最强转化点    │
├─────────────────────────────────────────────────────────────────┤
│ M5 DEEP DIVE2 · surface · pinned 双列                           │
│  [左sticky:压缩叙事条]  [右滚:22-reminder整幅→三beat→组件墙]    │
│  组件墙: ┃weekgrid 825×1375 竖卡·全页唯一elevated┃              │
│          ▭today 825×343 ▭twoday ▭weeklist 扁条叠放              │
├─ 换幕带(恒暗 #313033 不随主题) ─────────────────────────────────┤
│ M6 GALLERY · filmstrip 横滚 · 缩略完整可见·装饰层才叠压          │
│  ◧manage ◨theme ◧mine ◨grid ◧today ◩weekview → lightbox        │
├─ 色阶回 ────────────────────────────────────────────────────────┤
│ M7 TRUST · surface · 单栏≤34ch + 隐私主卡(宽)+开源/社区行式     │
├─ tonal 反转 ────────────────────────────────────────────────────┤
│ M8 CONVERSION · primary-container 带(全页唯一彩色大面)          │
│  版本行tabular + ABI下载行(universal推荐badge) + [下载]ElevXL   │
│  sha256 / 商店 / 在线体验(Text链)   右:grid 截图整幅            │
├─────────────────────────────────────────────────────────────────┤
│ Footer · surface-container · 发丝顶边 · 回顶+GitHub/FAQ/QQ      │
└─────────────────────────────────────────────────────────────────┘
CTA: Filled 级=AppBar S + M1/M8 XL 两枚;中段 M2-M7 只许 Text 链
原型: split→面板行→编辑split→岛→pinned→full-bleed→单栏→tonal带
dark 节奏补丁: 段界加发丝线, M2/M8 用 container-high 拉步长
reduced-motion: 位移/缩放/显影停, opacity 200ms 保留
```

## 11. 冲突裁决清单(两案合并的承重决策,逐项定死)

1. **段序**:Trust 前置于 Download(P1)[§4]
2. **elevated 唯一一处**:M5 周网格主角卡(P1);hero 截图=描边+容器底,无影 [§5.3]
3. **clip-path 唯一重武器**:归 M3 导入图,且默认用遮罩块等效实现(P1 归属+feasibility 实现修正)[§6-6]
4. **hero 副 CTA**:Text 档(P1)[§4 M1]
5. **AppBar 锚点**:保留 4 枚 Text 锚点+scroll-margin-top(P1+feasibility)[§4]
6. **CTA 纪律**:P1 版 — Filled 级仅 AppBar S+M1+M8,M2-M7 只许 Text 链;P2「每3段复现」删除 [裁决:两案互斥取 P1,吸顶常驻钮已覆盖中段出口;验收断言=任意视口内 Filled ≤1]
7. **reduced-motion 语义**:opacity 200ms 保留(P2 方向)+同步改 Features.astro 0s 硬编码与旧 spec §2.3 文本(feasibility 修正)[§6]
8. **statLine 数字**:348 条收录·34 种协议(站点数据实测)[§4 M4]
9. **组件比例**:以已验收资产 825×1375/343/550 为准,字面 ×2/÷2 算术被批准资产覆盖 [§8-1]
10. **换幕带配色**:恒暗 --site-band token(P1 归属 M6 + feasibility 失实修正)[§4 M6]
11. **token 新增集**:`--site-band-bg/-fg`、`--site-section-gap-600:48px`(进 gen-tokens 下游 global.css,禁组件内硬编码);extra-large-increased 32 与 primary-fixed **不引入**
12. **LCP 口径**:直绘零动效(两案统一取严)[§6-3]
13. **blob 数**:待批 R1(推荐 3→1)
14. **slogan**:待批 R3
15. **M2 呈现**:面板并排为主、切换器降为面板内交互(消两 UI 互斥)[§4 M2]
16. **M5 sticky**:改「矮列钉高列」(消 >视口钉不住)[§4 M5]

## 12. 高级感细节清单(交付前逐条 diff)

□ 全页仅 1 处 elevated(M5) □ **所有可点控件(钮/chip/段钮/图标钮/链接 hover 区)hover/focus 叠 state layer(on-color 8% 遮罩,M3 交互指纹;触屏按压 10%)** □ 阴影光源一致(y 正 x 0) □ 数字全 tabular-nums □ 圆角按角色(钮 full/卡 12/容器 28) □ 彩色面积<10% □ 渐变仅 hero □ 每视口恰 1 枚 Filled(AppBar 常驻+首尾 XL;AppBar 钮与 hero 钮互隐实现) □ 段距 128/80/48 三档 □ 正文≤46ch/列 1040 □ 相邻段原型不同构 □ 截图只裁无效区 □ 无装饰分隔线(dark 发丝线为节奏工具,非分隔用途) □ hover 白名单属性 150-200ms □ :focus-visible 不裸删 outline □ reveal 一次即 unobserve □ hero LCP 零位移+aspect-ratio 预置 □ reduced-motion=更少更柔(位移/缩放/视差/循环全停,opacity 200ms 保留) □ hover 包 (hover:hover)闸 □ outline/outline-variant 不越界 □ 文案零问句/零正反重复/零口语 □ zh/en 键树+句式同形 □ 键盘触发零动画 □ 全站零 @keyframes 循环(仅 hero 一次性 animation)

## 13. 三项裁决已批准(全部外置)

- **R1 氛围渐变**:3→1(只留 hero 一处,Download/Footer 删除)
- **R2 hero 手机截**:整图下置首屏外,不裁预览
- **R3 slogan**:豁免保留,不动

(默认覆盖声明:八段总滚动长于现站六段,以调研弧深挖 40-50% 权重覆盖旧 spec「每段≤1×100vh 宁删勿加」——随文档批准即生效,有异议单独提。)

## 14. 测试契约再基线(feasibility-critical#1,同一变更单元)

现站 148 条产物级断言中约 15-20 条将随结构+文案重写打红:`page.index/page.en` 锚段 id 表、`#features .reveal` 恰 4 卡与 style 逐字等、blob 计数=3 与三处位置契约、6 句 microcopy 逐句 pin(含被 C2 判废的「没有广告,没有追踪」「不想安装 APK?」「搜一下,你的学校在不在」)、`global.a11y.test.ts` Footer blob#3 断言、Blob.astro 三档 hue/stops 逐字断言。

处理原则:**这些是有意的旧契约,不是噪音;禁止先改实现后补测试(红绿窗口)**。新断言一律写不变量式:段落原型表(段序+每段 data-prototype)、每视口 Filled 计数≤1、键树同形、裁后图完整可读(盒宽高比=资产比)、恰一 fetchpriority=high、hero 首 img src 含 01-week。文案 6 句 pin 与 slogan pin 随 §7 重写同步换。实施顺序=测试文件与实现同 commit,verify 行写真实跑绿输出。

## 15. 风险与上报口径

- M3 显影遮罩块方案在 iOS Safari 未实测;若同底色遮罩出现色带接缝,降级 opacity-only 400ms(曲线时长不变)。
- 预处理裁切不可逆:原图先入 git 再裁,逐张目检(§8-2)。
- dark 主题节奏补丁(发丝线+container-high)是 P1/P2 未验证的补偿设计,批准实施后目检双主题剖面截图验收。
- ribbon 大数字与 M4 statLine 的 348 必须同源(构建时从 schools.grouped.json 派生,禁两处手写)。
- Shot 组件 priority 改造影响全站 10+ 调用点,回归面=首页+en 双页产物断言。

## 16. 用户原话 vs 实现行为(交付固定节)

| 用户原话 | 本设计行为 | 状态 |
|---|---|---|
| 首页第一张图=周视图 | hero 右列 01-week 直绘;桌面文档序第一 | 已定 |
| 教务直连、提醒两张截图完整显示,只裁无效区 | contain 自然比例+状态栏/导航键预处理 | 已定 |
| 小组件按我要求的高度重新截图(×2/÷2) | 10 张已重拍并获验收「就这个样子」;入站替换 | 已完成待接入 |
| 文案全部重写书面语,一个意思正面说一次 | R1-R5+对照表+正则闸+双语 diff 表 | 已定(slogan 待批 R3) |
| Material Design 风格贯穿结构 | 15 阶排版/surface 分区/shape 阶梯/MD3 动效 token 全消费 | 已定 |
| 响应式+reduced-motion+中英镜像 | §9 五档剖面/§6-12 降级/§7 R5 | 已定 |
| 访客对 UI 建立直观印象、觉得有设计感→下载 | 首屏产品本体+八段异构+§12 清单 | 已定 |
| 大厂动线/高级感/动画自然而不炫技 | 四路调研落盘可审计+§6 编排表+禁动清单 | 已定 |

## 17. 补 builder-check 自动解答项(已写死,实施时无需再问)

### 17.1 dark theme surface ladder
light 主题 ladder 见 §5.3;dark 主题为镜像翻转(surface↔container 互换),但 **M6 换幕带固定用 --site-band 恒暗值不随主题翻转**(--site-band-bg: #313033 / --site-band-fg: #F4EFF4)。dark 下段界额外加 1px outline-variant 发丝顶边,M2/M8 带改用 container-high 拉大步长。--site-band-* 固定值入 `global.css`(非 gen-tokens 产出,避 token 表语义污染)。交付附双主题节奏剖面图(§10 ASCII 图补 dark 标注)。

### 17.2 --reveal-i stagger 分配
元素清单(全站 `.reveal`):M1 标题/副标/CTA 三组(0/1/2)、M3 导入图、M4 statLine、M5 压缩叙事条、M6 全段 filmstrip 卡(每张 0..N)、M7 标题、M8 版本行 + ABI 列表。规则:段内顺序=DOM 序,段间独立序号(即 M6 卡群从 0 开始)。M5 压缩叙事条 + 右列三 beat 分配独立序,不与左侧 sticky 同一段数。验收断言:页面 `querySelectorAll('.reveal')` 个数=预期;每组内 `--reveal-i` 连续无跳跃。

### 17.3 CTA Filled 计数语义
"任意视口内 Filled ≤1" 指同一时刻可见:AppBar Filled S 常驻算 1,滚入视口后 M1 Filled XL 才出现=此时视口 2 枚 → 需等 AppBar 离开视口或 M1 离开视口后才能再滚入 M8。验收断言=视口滚落测试:同一时刻 document.querySelectorAll('button[class*="filled"]') 个数≤1(已包含 AppBar)。桌面首屏=1(AppBar S 只有顶部小窗可见不填满视口不算)。

### 17.4 测试契约再基线分类
不变量断言(自动化):段落原型表(data-prototype 7→8 段)、blob 计数=1+Footer 0 条、段序(M1..M8 顺序)、01-week 首图不变量、fetchpriority=high 恰一、CTA 同视口≤1。视觉类(Playwright visual regression):hover 白名单属性、阴影光源一致(y 正 x 0)、§12 清单逐项。

### 17.5 M3 遮罩块实现
`<div class="m3__mask" style="transform: translateY(100%);transition: transform 600ms cubic-bezier(0.77,0,0.175,1);"></div>` 置于内容之上,JS 触发时改 `transform: translateY(0)`。同底色(div 取 `--md-sys-color-surface`),z-index: 1 内容在 z:0。fallback 代码路径:帧率实测不过关时删 JS 触发+mask 元素,内容 opacity 400ms 淡入替代。

### 17.6 M5 压缩叙事条
`max-block-size: 40vh`,sticky 在桌面 840+ 启用。内容=22-reminder 缩略图(高 160px 固定,object-fit:cover,横向 50% 占)+一行主张(body-small)。截图用与桌面完整图同源,不新增资产。

### 17.7 资产预处理实现
原文(sleepy 仓 `docs/screenshots/`):01-schedule-week.png/22-reminder.png/20-import-bottomsheet.png(各 1080×2340)。PIL 脚本:`crop_status_bar.py` — 裁掉顶部 112px+底部 240px(y0-112→y2100-2100→2340 预留 0),输出覆盖 sleepy-site `src/assets/screenshots/` 对应文件;原图备份为 `*-raw.png`。10 张 widget 新图从 `/tmp/widget-shots-2026-10-22/` 用 cwebp 转 webp/png 双格式+尺寸档后覆盖 `widget-*.png`。

### 17.8 R1/R2/R3 [待你批 → 已批准:全部外置]
- R1 氛围渐变:3→1(只留 hero 一处,Download/Footer 删除)
- R2 hero 手机截:整图下置首屏外,不裁预览
- R3 slogan「构建无壳,自由自在」:豁免保留,不动

