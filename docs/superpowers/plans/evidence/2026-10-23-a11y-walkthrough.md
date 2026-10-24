# Task 9 走查证据 — reduced-motion / 键盘-only / JS-off 三态

> 日期:2026-10-24 · 站点:`npm run dev` @ localhost:4325 · 工具:Chrome 155 headless CDP(脚本存 `tmp-cdp/`,gitignore 外)
> 判定汇总:**三态全过,无回修项**。唯一非违例注记:①双影 elevated 运行时共 2 处(M5 主角卡 + M8 钮,均为既定裁决,见「elevated 抽查」);②M5 组件墙扁条卡 L1 静态影 vs「默认 filled」严格读法留你裁决(记录如下)。

## Step 1 — prefers-reduced-motion(Emulation.setEmulatedMedia 命中)

| 检查点 | 实测值 | spec 要求 | 结论 |
|---|---|---|---|
| `matchMedia reduce` | `true` | — | 模拟生效 |
| hero `.hero__slogan` | `opacity:1; transform:none; animation:fade 0.2s` | 纯 opacity 200ms 直现 | ✓ |
| reveal 元素(M2 三 pane) | `transform:none`,pane 态 opacity 由 data-view 控制(0/0.55/1) | 位移停,淡入保留 | ✓ |
| reveal 元素(#connect copy/figure) | `opacity:1; transform:none; transition 0.2s` | 200ms 淡入非跳变 | ✓ |
| 三视图切换器 | click 后 `data-view` 变更、pane `transform:none` | 位移归零仍可用 | ✓ |
| 卡 focus 态 | `.site-card--interactive` `transform:none` | hover/位移停 | ✓ |

截图:`t9-reduce-hero.png`、`t9-reduce-views.png`、`t9-reduce-connect.png`(同目录)。

## Step 2 — 键盘-only(Tab 全页 + 方向键 + 焦点圈定)

- Tab 走查 40 步:skip-link → brand → 4 锚点 → EN → 主题钮 → hero 两 CTA → views peek/dot… 全部 `outline: solid 2px`,**裸删 outline = 0**。
- views radiogroup:`role=radiogroup` 3 radio(网格/周/今日),**ArrowRight: 网格→周,`data-view` 同步 = week** ✓。
- lightbox(完整键序列 rawKeyDown+char):
  - `.gallery__open` 聚焦 + Enter → `hidden:false, count:"3 / 8"`,焦点入「关闭」钮 ✓
  - 开态连续 Tab:上一张→下一张→关闭→上一张→…(焦点圈定环绕,无逃逸)✓
  - ArrowRight → count "2/8→…"(切换)✓;Escape → `hidden:true` 且焦点复位 opener「今日视图」✓
  - scrim click 关 + 焦点归还 opener ✓
  - 注:此前探针用裸 `keyDown/keyUp` 未派发激活行为,CDP 完整事件序列下按钮 Enter 正常触发——非页面缺陷。
- Schools chip `aria-pressed` 存在且脚本单选切换(Schools.astro:41-49/213-216)。

## Step 3 — JS-off(`Emulation.setScriptExecutionDisabled`)

| 检查点 | 实测 | 结论 |
|---|---|---|
| hero 可见 | `.hero__slogan opacity = 1` | ✓ |
| schools 全列 | `#schools li = 348 行` | ✓ |
| reveal 不隐藏 | 36 个 `.reveal` 中 opacity:0 的 = **0** | ✓ |

截图:`t9-jsoff-hero.png`、`t9-jsoff-schools.png`(带顶)、`t9-jsoff-schools-mid.png`(第 170 行区,证中段亦全列可读)。

## 抽查注记(非缺陷,评审可复核)

1. **elevated 运行时枚举**:全页双影(2 层 box-shadow)元素恰 2 = `figure.site-card--elevated.reminders__card`(M5 主角卡,spec §5.3 唯一指定)+ `a.site-button--elevated.download__cta-xl`(M8 彩底上钮,spec §4-M8「Elevated 替代 tonal」+§12「每视口 1 枚 Filled 级」既定)。hero 截图容器为 1px 描边 + 单层影(P1 裁决),运行时确认。**两 elevated 分处相距 >2 屏的不同带,不共视口**,§12「仅 1 处 elevated」按 P1 裁决语义 = 卡档唯一。
2. **M5 组件墙扁条**:`.site-card` 静态影 `rgb(0 0 0/.05) 0 1px 2px`(L1,轻档,非双影 elevated)。目检:叠放模拟真实桌面排布需要浮起感,与「默认 filled」的严格读法有张力 → 留给你裁决是否改 filled(一行 CSS,不改结构)。
3. **光源一致**:两 elevated 影 y 偏移均 `0 1px`/`0 2px`(恒正)、x 恒 0 ✓;`dividerCount=0`(无装饰分隔线)✓。
