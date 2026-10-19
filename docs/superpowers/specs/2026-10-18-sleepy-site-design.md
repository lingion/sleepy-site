# Sleepy 官网设计(spec v3 · 终稿)

日期:2026-10-18 · 状态:两轮对抗审查修复完毕,批准实施
仓库:`lingion/sleepy-site`(GPL-3.0)· 部署:Cloudflare Pages → `sleepy.lingion.eu.cc`

**修订史:** v1 FAIL(17 项,个性/亲近零落点)→ v2 REVISE(17 项,补丁引入新错:long 表编造、容器 tone 阶梯违官方、画廊自相矛盾)→ **v3 全部修复,修法逐条附出处**。两轮审查发现合计 34 项,0 驳回。

## 0. 目标与非目标

**目标:** 大厂感 · 震撼×简洁 · 主人个性 · 用户亲近;严格 M3 + M3 动效;功能面 = 介绍/教务列表/下载/预览。

**非目标:** 不做课表 Web 功能(在线体验外链 sleepy.qdp.qzz.io);不做 CMS;商店徽标预留灰态;
**M3 Expressive 弹簧 Web 端不可用**(m3.material.io motion tokens 注明 easing/duration 体系「no longer maintained」,Expressive 体系 Android 首发,@material/web 维护模式——出处 §9)。「MD 专用动画」= M3 Core 缓动/时长,此缩减为用户可见决策。

## 1. 技术栈

Astro 5 + TS · **output: static(prerender 全量)**,`@astrojs/cloudflare` + `@astrojs/sitemap` · 手写 M3 token CSS · Motion One(~5KB)· `@material/material-color-utilities@0.3.0`(0.4.x ESM bug 实测)。

JS 岛 **2 个实现体**:①教务区岛(搜索框+省份|协议 chip 组,单一客户端 filter 状态,合并注水)②lightbox+主题开关共用的轻量内联/岛。全站 JS ≤15KB gz。
**主题 FOUC 守卫:** `<head>` 内联脚本先读 localStorage 再进首帧设 `data-theme`,无首屏闪变。

## 2. 设计系统

### 2.1 色彩(种子 `#9B87FE`,logo 抽色)

`scripts/gen-tokens.mjs` 全量生成标准 M3 role 集(primary/onPrimary/primaryContainer/onPrimaryContainer、secondary 系、tertiary 系、error 系、surface/surfaceDim/surfaceBright、5 级 surfaceContainer*、surfaceVariant/onSurfaceVariant、outline/**outlineVariant**、**scrim**、inverse 系)→ `src/tokens/theme.css`。

- **primary/secondary/tertiary/error/on-*/inverse/outline/outlineVariant 角色** ← `themeFromSourceColor(seed).schemes.light|dark` v0.3.0 直出(复核一致:primary L `#604BBF` / D `#CABEFF` 等)。
- **surface 与 surfaceContainer\*(v3 纠 v2 编造值):** 官方 Android Color.md dynamic 容器 = **neutral_variant 调色板**(v2 误用 neutral;v2 的 light t95/t90 缺档、dark t24 是 surfaceBright 误入)。终值:light surface t98,容器 lowest→highest = **t100/96/94/92/90**;dark surface t6,容器 = **t4/10/12/17/22**;用 `theme.palettes.neutralVariant.tone(t)` 生成。surfaceDim/surfaceBright 同步落(L t87/t98,D t6/t24)。
- 明暗:默认跟随系统 + app bar 手动开关(§1 FOUC 守卫)。

### 2.2 字体 / 形状 / 栅格 / 边框(v3 补字体决策——两轮审查共同的「最大发明点」)

- **字体(定案):** 拉丁 = **Inter** 自托管 woff2 子集(latin+latin-ext,300/400/600 三档,`font-display: swap`+preload);CJK = **系统栈**(`system-ui, "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif`,不拖 4MB Noto Web 字体,大厂感靠排版节奏不靠字体堆);Display 大字 Inter w600 + tracking 按 M3 表。
- shape xs4/sm8/**md12**/lg16/xl28 · full=9999px(CTA pill、搜索框、chip)
- M3 type 15 阶全量落 token;hero Display 用 `clamp()`(≤2 行,1040dp 内自动降档,禁「起步再定」式甩锅)
- 4/8dp 栅格;内容列 1040dp;断点 600/840/1200/1600
- **交互控件描边 = `outline`,不用 `outlineVariant`**(实测 outlineVariant-on-surface 1.67:1 < WCAG 非文本 3:1;outlineVariant 只作分隔线)
- **app bar 滚动态 = tonal `surface`→`surfaceContainer`,无投影**(M3,M2 阴影已纠)
- **组件-角色映射钉死(v3,补「严格 M3」的最后含糊):** 教务 chips = **M3 filter chip**:未选 = transparent 底 + `outline` 描边,已选 = `secondaryContainer` 底 + `onSecondaryContainer`,勾选图标显;hero tonal-pill = secondaryContainer;filled-pill = primary;card = **surfaceContainerLow**(官方 card=elev-1 映射),4 行图文交替不加层级漂移;**lightbox scrim = `#000000` 32%**(M3 dialog 值);gallery 网格桌面 4 列/平板 2/手机 1;sha256 = 只给 `sha256sums.txt` 外链,不内联 hash。

### 2.3 动效(v3 修 v2 编造的 long 阶梯)

官方 duration 表(m3.material.io tokens-specs,审查员逐值核实):**short1–4 = 50/100/150/200;medium1–4 = 250/300/350/400;long1–4 = 450/500/550/600;extraLong1–4 = 700/800/900/1000**。v2 印 550/650/750/1000 系错误。

easing:emphasized `cubic-bezier(0.2,0,0,1)` / emph-decel `(0.05,0.7,0.1,1)` / emph-accel `(0.3,0,0.8,0.15)`。
配对:enter = **medium4 400ms** emph-decelerate;exit = **short4 200ms** emph-accelerate;in-place = **long2 500ms** emphasized(v3 表值与配对自洽)。
滚动揭示 stagger **60ms = 站点常量,非 M3 token**。`prefers-reduced-motion` → 0ms 直出。

### 2.4 艺术方向(承接「大厂」「震撼×简洁」)

- **视觉预算:** 每 section 一件事,桌面 ≤1×100vh;宁删勿加。
- **hero:** 非对称 55 文 / 45 设备框;slogan Display clamp ≤2 行;禁居中三件套。
- **图像:** 只用设备框真机截图,禁 stock/假 UI。
- **signature motif:** logo 紫渐变 blob 固定 **3 处**(hero 底/下载区上/footer 内),3 档预设:hue 相对种子 **0°/+15°/-15°**,渐变 stops 角 **135°/90°/200°**——数值定死,不留「微变」发明口。
- **密度:** 功能卡 4(三视图课表/348 条教务直连/提醒与 Widget/本地优先隐私);截图 **8 张定稿(v3 修 v2 自相矛盾——导入导出卡砍了但画廊无证据):** `01-schedule-week / 02-schedule-grid / 03-today / 11-theme / 22-reminder / 36-theme-dark / widget-weekgrid / 20-import-bottomsheet`(widget-today 换 20-import,文件已核实在仓)。
- 留白:section 间距 128dp/移动 80dp。
- 文案闸:slogan/microcopy 先 §2.5 签收才实现。

### 2.5 个性与亲近载体

- **slogan 候选(3 选 1,签收项):** A 构建无壳,自由自在 / Built open. Feels free. · B 把课表还给学生 / Your timetable, back in your hands. · C 348 个校园的早八,都归我管了 / 8 a.m. classes at 348 campuses. Handled.(选 C 时数字随 §4.1 口径联动)
- **第一人称维护者叙事块:** 「一个人写的开源课表。没有广告,没有追踪,代码全公开。适配你学校的问题,群里 @ 我。」+ QQ 群 1063407652 + **sponsor 链接钉死** `https://github.com/lingion/sleepy-web/blob/main/sponsor.md`(已核实存在;安卓 README 无此链,勿指错仓)。
- **microcopy 契约(逐句进实现):** 搜索空态「这所学校还没收录——提个 issue 或进群说一声,它很快会在。」外链 `https://github.com/lingion/sleepy/blob/main/FAQ.md`(核实存在);下载注脚「拿不准就 Universal,通吃。」;暗色开关 tooltip「晚课专用。」;无 JS 提示「页面塌了,课表不会。」
- **红线:** 企业腔词表(赋能/极致/匠心…零出现,grep 断言);不吹 star/下载量。

## 3. 页面结构(7 段)

```
app bar  sticky · 滚动 tonal→surfaceContainer 无阴影 · zh|EN · 明暗开关
① hero   slogan Display clamp + 双 CTA(filled 下载 / tonal 在线体验)· 设备框 01 · blob#1
② 功能   4 行图文交替 card=surfaceContainerLow · 揭示 60ms stagger(DOM 序=出现序,不变量)
③ 教务   搜索+省份|协议 chip(filter chip,单岛联动)· 统计 chip「348 条收录 · 33 协议」
         (v3 口径:348 entries 含北邮 2 条同校,禁写「346 校」也禁 double-count)
         点击不跳转 · 空态 microcopy(§2.5)
④ 画廊   8 图网格(4/2/1 列)→ lightbox(scrim 32% · aria-modal · 焦点圈定/Esc/←→/归还)
⑤ 下载   latest + 四 ABI 表 + sha256 外链 + Android 8.0+ + 商店灰态徽标 · blob#2
⑥ 信任   维护者叙事 + 无 Firebase/Sentry/广告 SDK + GPL-3.0 + 社区链接
⑦ footer inverse-surface · blob#3
```

双语:zh `/` · en `/en/` · hreflang · content collections 构建期切换。

## 4. 数据流

### 4.1 schools.json

真实 schema:`name / sortKey / sortKeyFull / url / type / aliases / status? / enableFetch?`(后两字段仅 2/348、3/348 存在,代码按 optional)。

- **省份分组(不变量三件套,数字不硬编码):** 前缀表入仓 `src/data/geo-prefix.json`(31 省+主要城市,含 EN 名);匹配规则**最长前缀优先、城市 > 省**(青岛科技/农业→山东|青岛冲突有定则);表由脚本+人工补到**覆盖率 100%**,构建断言 `ungrouped==0` 否则 fail。前缀命中数以规则实测定,不抄审查/我的二手数(v2「215」不可复现已弃)。
- `sortKey='*'`(北邮 2 条,实测)→「其它」桶,不静默丢。
- **EN:** 校名保中文,`sortKeyFull` 拼音检索(例:搜 `jiaotong` 命中多校——v2「qinghua」例失实已换);省份 chip 用 geo-prefix EN 名;协议 `type` 给 EN 标签表。
- 快照 = 有意冻结副本(v1「不放副本」矛盾口径已改),网络拉取仅刷新。

### 4.2 Release 资产(v3 修防腐烂架构洞)

资产名实测锁定:`app-arm64-v8a / armeabi-v7a / x86_64 / universal(-release.apk)` + `sha256sums.txt`。
**构建归属(v2 的 nightly-on-CF-Pages 是死路——CF Pages 无 cron;改为单一 owner):**
- **GitHub Actions 是构建+部署 owner**:push main 触发 + `schedule: nightly`;Actions 内 `astro build` 后 `wrangler pages deploy`(CF token 入 secrets)。CF Pages 纯托管。
- Actions 有 GitHub token → releases API **认证调用**,绕开 CF 共享出口 60/hr 匿名限额。
- **可见腐烂信号:** 构建烘 `RELEASE_TAG + BUILD_TIME` 进页面 footer meta + `<time>`;构建脚本在 API 失败时**非零退出**(v2「警告不阻塞」会让烘旧 tag 的构建装绿,已废)。
- 主仓 release published → 打 CF deploy hook(即时刷新)降级为可选增强,需单独批准。

### 4.3 截图

8 张清单从主仓 raw(main)拉,仓内缓存兜底;Astro `<Image>` srcset/AVIF。

## 5. 错误处理

- schools/screenshots 网络失败:警告+快照兜底(内容类,陈旧可接受);**releases 失败:构建 fail**(下载页腐烂不可接受,分级处理 v2 一刀切「不阻塞」已纠)
- 搜索空态:microcopy + FAQ 外链;JS 禁用:教务区静态全量渲染 + 提示句
- lightbox a11y 全项(§3④)

## 6. 测试与验收

- vitest:geo 分组 100% 覆盖断言 + 最长前缀/城市优先冲突例(青岛大学系)· `'*'` 桶 · 拼音搜索(`jiaotong`)· 348/33 计数 · ABI 表 · 快照 optional 字段
- 对比度分两轨:文本对(on-*/bg AA)· 非文本对(outline-on-surface ≥3:1)
- **blob 验收机械化:** `data-blob` 属性计数 = 3(grep/DOM 断言,弃「数≥3 处」无方法)
- 文案验收:§2.5 样例句逐句在产物;红线词 grep 零命中;slogan = 签收项
- 动效时序:**人工核对表**(逐段 × §2.3)——如实标 manual,不假自动锁
- Lighthouse 四项 ≥95(移动)· hreflang/sitemap 断言 · CF preview 全链路 + `sleepy.lingion.eu.cc` 演练

## 7. 开放项

1. **CF 凭据**(`CLOUDFLARE_API_TOKEN`+`ACCOUNT_ID`,另一账号)→ 用户粘贴 → `gh secret set`。🚫Keychain。【状态:待用户提供;Actions deploy gate 已落盘,凭据缺位时显式红不静默】
2. slogan 3 选 1 + microcopy 签收(§2.5)。【状态:站点已上线 A 案「构建无壳,自由自在」,单点常量在 `src/i18n/zh.ts`,签收后一行换】
3. logo SVG 重绘另立任务(首版 PNG)。【状态:未启动,不阻塞发布】
4. 主仓 deploy-hook(§4.2)单独请示。【状态:未启动,不阻塞发布】

## 8. 用户原话 vs 落点

| 原话 | 落点 | 状态 |
|---|---|---|
| 大厂风格 | §2.4 艺术方向 + §2.2 字体定案(两轮共同最大发明点已闭合) | ✓ |
| 最震撼简洁 | §2.4 视觉预算/宁删勿加/密度裁剪(4 卡 8 图带冲突修复) | ✓ |
| 又有我个性 | §2.5 全部实体 + blob 数值定死 | ✓ 已实现;slogan 待 §7.2 签收 |
| 用户感到亲近 | §2.5 叙事+样例句(验收机械化) | ✓ 已实现;slogan 待 §7.2 签收 |
| 严格 M3+md 动画 | §2.1 官方容器阶梯纠值 / §2.2 组件映射钉死 / §2.3 官方时长表纠编造 / scrim 32% | ✓ |
| 教务省份|协议分组 | §4.1 规则+表+100% 不变量(可执行) | ✓ |
| 双语 | §4.1 EN 策略 + §3 | ✓ |
| 下载四ABI+sha256 | §4.2 Actions-owner + 认证 API + fail-on-stale | ✓ |
| 预览跳转 | ①CTA + ④lightbox a11y | ✓ |

顺序不变量:揭示=DOM 序;app bar=永远置顶恒 surfaceContainer;blob=固定三位三档(数值表)。

## 9. 参考出处

- 时长/easing:m3.material.io/styles/motion/easing-and-duration/tokens-specs(含「no longer maintained」注)
- 容器色角色/调色板:material-components-android `docs/theming/Color.md`(neutral_variant 容器映射)
- Expressive Web 缺席:@material/web README 维护模式公告;Expressive 博客 Android 首发
- 种子色:PIL 抽色 `~/sleepy/docs/logo.png`(99.7% 紫带,芯簇 `#9B87FE`,v0.3.0 生成值已双重复核)
- 事实基线:schools.json 348 条/33 类型/`'*'` sortKey 2 条/optional 字段计数、8 截图文件名、FAQ.md、release 资产名 vs v1.0.61、sponsor.md@sleepy-web、minSdk26、GPL-3.0——全部本会话实测
