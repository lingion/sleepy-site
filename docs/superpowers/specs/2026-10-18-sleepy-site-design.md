# Sleepy 官网设计(spec)

日期:2026-10-18 · 状态:已批准(口头),待 spec 复审
仓库:新独立仓库 `lingion/sleepy-site`(GPL-3.0,与主应用一致)
部署:Cloudflare Pages → `sleepy.lingion.eu.cc`(用户另一 CF 账号,zone `lingion.eu.cc`)

## 0. 目标与非目标

**目标:** Sleepy 的官方营销站——介绍、教务列表、下载、预览跳转;大厂风格;严格 Material Design 3(Core 规范)+ M3 专用动效 tokens。

**非目标:**
- 不做 Web 版课表功能(sleepy-web 已另有在线版 sleepy.qdp.qzz.io,官网只做跳转)
- 不做 CMS/后台编辑——文案即代码,Markdown/TS 常量
- 不做 SEO 军备竞赛:meta/hreflang/sitemap/OG 图到位即可
- 商店徽标本轮为**预留灰态**(上架后点亮)

## 1. 技术栈(定案)

| 层 | 选择 | 理由 |
|---|---|---|
| 框架 | Astro 5 + TypeScript | 零 JS 基线 + island 精准注水;content collections 承载双语;营销站不需要 SPA。大厂官网(Apple/Google/Vercel)皆静态预渲染 |
| 样式 | 手写 M3 token CSS(无 Tailwind、无组件库) | 个性=完全控场;mdui/material-web 整站套用=组件库气质,弃 |
| 动效 | Motion One(~5KB) | hero 入场、画廊 lightbox;其余用 CSS transition |
| 色彩 | `@material/material-color-utilities@0.3.0` 构建期生成 | **0.4.x 有 ESM 无后缀导入 bug,Node22 下 require/ESM 双路皆炸(已实测),必须锁 0.3.0** |
| 部署 | `@astrojs/cloudflare` adapter → CF Pages | 用户唯一硬条件「能挂 CF」 |

## 2. 设计系统

### 2.1 色彩种子(logo 抽色,已定)

`docs/logo.png`(432px)不透明像素 99.7% 落紫色渐变带;核心簇均值 **`#9B87FE`**。
构建期 `scripts/gen-tokens.mjs` 以该种子跑 `themeFromSourceColor`,产出固定 light/dark 双方案写入 `src/tokens/theme.css`(CSS custom properties,`color-scheme` + `[data-theme]` 切换)。

关键值(已生成验证):

```
role                  LIGHT      DARK
primary               #604BBF    #CABEFF
onPrimary             #FFFFFF    #31108F
primaryContainer      #E6DEFF    #4830A5
onPrimaryContainer    #1C0062    #E6DEFF
surface               #FFFBFF    #141316   (dark t6)
surfaceContainerLow   #F7F2F7    #1C1B1F   (t10)
surfaceContainer      #F4EFF4    #201F23   (t12)
surfaceContainerHigh  #F1ECF1    #2B292D   (t17)
surfaceContainerHighest #EBE7EC  #363438   (t22)
onSurface             #1C1B1F    #E6E1E6
surfaceVariant        #E6E0EC    #48454E
outlineVariant        #C9C4D0    #48454E
inverseSurface(footer) #313033   #E6E1E6
inverseOnSurface      #F4EFF4    #313033
```

明暗策略:默认跟随系统 `prefers-color-scheme`,app bar 提供手动切换(存 localStorage)。

### 2.2 形状 / 排版 / 栅格(M3 规范值)

- shape:xs4 / sm8 / **md12(卡片)** / lg16 / xl28(hero 设备框)· full=9999px(CTA pill、搜索框)
- typography 15 阶全量落 token;Display Large 57/64/-0.25 w400 用于 hero;站点展示字体沿用应用字体栈(Impact 系不进 Web,正文用 system-ui + `Noto Sans SC` 兜底中文)
- 4/8dp 栅格;内容列 max-width 1040dp(mega)/840dp(文本段);断点 600/840/1200/1600
- elevation level0–5 双层阴影规范值,app bar 滚动后升 level2

### 2.3 动效(只用 M3 Core 缓动/时长——Expressive 弹簧 Web 端不可用,已调研证实)

```
easing-emphasized          cubic-bezier(0.2, 0, 0, 1)
easing-emphasized-decelerate (0.05, 0.7, 0.1, 1)   ← 入场
easing-emphasized-accelerate (0.3, 0, 0.8, 0.15)   ← 退场
easing-standard-decelerate (0, 0, 0, 1)
easing-standard-accelerate (0.3, 0, 1, 1)
duration: short1 50ms … medium2 350ms … long2 500ms … extraLong4 1000ms
```

配对规则(官方):enter = emphasized-decelerate 400ms;exit = emphasized-accelerate 200ms;in-place = emphasized 500ms;滚动揭示 stagger 60ms/元素。
`prefers-reduced-motion: reduce` 下全部动画降级为 0ms 直接呈现。

## 3. 页面结构(单页,7 段)

```
┌ sticky app bar: logo+Sleepy · 锚点(功能/教务/预览/下载)· 中/EN · 明暗开关(滚动后 elevation2)
├ ① hero: Display Large「构建无壳,自由自在」+ 副题 + 双 CTA
│      [下载 APK filled-pill] [在线体验 tonal-pill → sleepy.qdp.qzz.io]
│      右侧设备框截图(01-schedule-week),emphasized-decelerate 400ms 入场
├ ② 功能 3×2 图文交替(M3 card md12,surface-container 分层,滚动揭示 60ms stagger)
│      课表三视图 / 教务直连 / 提醒与 Widget / 主题定制 / 导入导出迁移 / 隐私本地化
├ ③ 教务支持: 搜索框(full 圆角,唯一 island 注水区)+ 省份|协议 chip 组切换(用户定稿口径)
│      + 统计 chip「348 校 · 33 协议」;点击校名不跳转,纯展示;省份来源见 §7.1
├ ④ 预览画廊: 精选 ~10 张(docs/screenshots: 00/01/02/03/11/22/28/33/36/39 + widget-* 2 张)
│      设备框缩略网格 → lightbox(Motion One, zoom 自缩略位)
├ ⑤ 下载区: releases/latest 大按钮 + 四 ABI 直链表 + sha256sums.txt 链接
│      + Android 8.0+ 要求 + 商店徽标预留灰态
├ ⑥ 信任+社区: 无 Firebase/Sentry/广告 SDK、GPL-3.0、本地存储优先;GitHub/sponsor/QQ 群
└ ⑦ footer: inverse-surface 反色;链接组 + 版权
```

双语:zh 根路径 `/`,en 镜像 `/en/`;hreflang 互指;语言=内容集切换,非运行时开关。

## 4. 数据流

### 4.1 schools.json(教务列表)
构建期脚本从 `https://raw.githubusercontent.com/lingion/sleepy/main/app/src/main/assets/schools.json` 拉取(不在本仓放副本,免双仓同步);失败则用上次成功快照(仓内 `src/data/schools.json` 由脚本写入并 commit,作为兜底)。字段:`name/sortKeyFull/type/省份?`——**注意:现 schema 无省份字段**,省份分组需按校名启发式或补字段;协议分组直接用 `type`。→ 实施前确认(见 §7 开放项)。

### 4.2 Release 资产
下载链接走 GitHub REST `repos/lingion/sleepy/releases/latest` 稳定资产名(已实测核实):
`app-arm64-v8a-release.apk / app-armeabi-v7a-release.apk / app-x86_64-release.apk / app-universal-release.apk / sha256sums.txt`。
构建期拉 tag+时间戳烘进静态页;不做运行时 API(避免 CORS/配额)。

### 4.3 截图
构建期从 sleepy 仓 raw(main)拉取,本地缓存 commit 兜底;Astro `<Image>` 自动 srcset/AVIF。

## 5. 错误处理

- schools/releases/screenshots 三处构建期网络失败:警告 + 用仓内快照,不阻塞构建
- 在线体验链接不可达:不探测(跳转即外链)
- 搜索无结果:空态文案 + 「适配你的学校」CTA 指 FAQ 适配指引

## 6. 测试与验收

- `astro build` 过;Lighthouse CI:Perf/A11y/BestPractices/SEO 四项 ≥95(移动)
- 可访问性:WCAG AA 对比(scheme 自带 on-* 配对满足)、焦点环(M3 focus 可见态)、地标语义、alt 文本
- 双语路由/hreflang/sitemap 断言测试(vitest 跑纯函数:分组、拼音搜索、ABI 表)
- 动效:`prefers-reduced-motion` 手工核对 + 入场时序表逐段 diff
- 部署演练:CF Pages preview URL 全链路 + 正式域名 `sleepy.lingion.eu.cc`

## 7. 开放项(spec 复审时定)

1. **省份字段缺失**:schools.json 无 province——(a)按校名前缀启发式聚类,(b)教务列表只做字母/拼音分组+协议分组(砍省份),(c)给主仓 schools.json 补字段。**推荐 (b) 先行**,不阻塞官网,(c)留作主仓 issue。
2. **CF Token**:deploy CI 需**另一 CF 账号**的 `CLOUDFLARE_API_TOKEN` + `ACCOUNT_ID`,由用户粘贴 → `gh secret set`(不碰 Keychain;push/release 仍走 release-sop §6 批准闸)。
3. logo 是否配 SVG 版(现 docs/logo.png 83KB 位图;官网 favicon/hero 需矢量化重绘)——建议首版直接用 PNG + 缩图,SVG 重绘另立任务。

## 8. 铁律对照(设计规范四铁律)

- 布局条款全是不变量(sticky/滚动后 elevation/随内容递增的揭示次序),无静态快照式描述 ✓
- ASCII 布局图已附(§3)✓
- 顺序类(动画 stagger、双语路由)由 §6 时序断言锁 ✓
- 本 spec 各节均可回指用户原话:介绍(①②⑥)/教务列表(③)/下载链接(⑤)/预览跳转(①CTA+④)/大厂风格(§1 定案)/material design+md 专用动画(§2.3)/开源方案调研(§1 排除项)/CF 部署(§7.2)✓
