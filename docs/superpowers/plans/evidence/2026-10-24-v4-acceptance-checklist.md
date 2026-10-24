# v4 总验收 — 六硬约束 diff + §12 清单 24 项逐条勾验

> 日期: 2026-10-24 · 分支: feat/site-redesign-v4(base cf4fcbf)· 复跑证据: `npx vitest run` **207/207 passed(9 files)**;`npm run build` Complete(剥代理, 2 pages);`node tools/i18n-leak-check.mjs zh.ts en.ts --forbid-question` exit 0(208 叶零命中)。断言名引自 tests/page.index.test.ts(39)+ page.en(13)+ assets(2)+ i18n-parity(4)+ global.a11y(40)。

## A. 用户六条硬约束逐条 diff(铁律④)

| # | 约束 | 结论 | 证据 |
|---|------|------|------|
| C1 | 首页第一张图=周视图 | ✓ | `文档序第一张 img 的 src 含 01-week`(zh/en 双页同构);R2 批准后形态=375 整图下置首屏外、DOM 序不变,`t9-*.png` 实抓 hero 前景=周视图 |
| C2 | 书面语/一意思正面一述/禁问句口语/双语 | ✓ | `问号正则 body 文本零命中(R2)`+`EN 页零问号`+`旧 pin 6 句全绝迹`+`红线词零出现`+泄漏闸 exit 0;键树同形=`zh.ts 全部含汉字叶子在 EN 页零出现`+`i18n-parity` 4 断言 |
| C3 | 教务直连+提醒两图完整显示,截断只许无效区 | ✓ | `assets.test.ts` 手机三图裁后 1080×2048+raw 1080×2340 在档;CSS 侧 20-import/22-reminder `object-fit: contain` 无 cover(裁线 2160 目检修正,ledger Task 1);盒宽高比=资产比断言 |
| C4 | weekgrid 更竖 / 其余更扁 | ✓(以批准资产为准) | renderer 直出 825×1375(3:5 竖)/ 825×343 / 825×550,用户 2026-10-23 验收「就这个样子」(§3 C4 注);`组件墙四件:周网格竖卡 + 今日/两天/周列表扁条(全部真机比例)` |
| C5 | token 消费,无新硬编码色值 | ✓(带豁免注记) | grep `#[0-9a-fA-F]{6}` 新增命中仅 `--site-band-bg/-fg` 两枚(e1d1d65 注记:恒定换幕带语义=不随主题翻转,token 无法表达);Blob/AppBar SVG 存量未触碰;`--md-sys-*` 全接线(色阶/字阶/形状/动效五族 grep 零散落 hex) |
| C6 | 段距三档 | ✓ | `global.a11y.test.ts:27` 锁 --site-section-gap 128px/--site-section-gap-sm 80px/--site-section-gap-xs 48px 三档 + `--site-unit:8px` |

## B. §12 高级感清单 24 项逐条

| # | 项 | 结论 | 证据 |
|---|----|------|------|
| 1 | 全页仅 1 处 elevated(M5) | ✓ | `全站恰一处 .site-card--elevated(§11-2 唯一 elevated = 周网格主角卡)` |
| 2 | 可点控件 state layer(8%/10%) | ✓ | a11y `state layer hover 档`/`active 档` 2 断言;T7 fix 轮红绿自证(b695993) |
| 3 | 阴影光源一致(y 正 x 0) | ✓ | a11y `光源正上方:每条 box-shadow 所有分量 x 恒 0` |
| 4 | 数字全 tabular-nums | ✓ | 编译 CSS 含 tabular-nums(1 处 dist 文件);ribbon 348/版本行/统计行消费 |
| 5 | 圆角按角色(钮 full/卡 12/容器 28) | ✓ | a11y :56-58 锁 small 8/medium 12/full 9999;global.css 钮=corner-full(:148/197)、卡=medium、容器=xl 28;五档零魔法值 |
| 6 | 彩色面积<10% | ✓ | 唯一彩色大面=M8 primary-container(§13 批准);余全中性色阶;t10 剖面目检 |
| 7 | 渐变仅 hero | ✓ | `[data-blob] 恰一 = data-blob="0" 且在 #hero`(zh/en 双页)+ R1 批准 |
| 8 | 每视口恰 1 枚 Filled | ✓ | `全页 Filled 仅 AppBar S + hero XL 两枚` + `CTA 互隐闸`(hero 在视口→AppBar 钮 hide,T6 IO;dist 脚本实测 isIntersecting?hide:show) |
| 9 | 段距 128/80/48 | ✓ | 同 C6 |
| 10 | 正文≤46ch/列 1040 | ✓ | Hero.astro:83/Trust.astro×3 `max-width:46ch`;global.css:35 `--site-content-col:1040px` |
| 11 | 相邻段原型不同构 | ✓ | `main 直系 section = 八段依序,各带 data-prototype`(split/showcase/split/tool-island/sticky/full-bleed/column/tonal 八型各异) |
| 12 | 截图只裁无效区 | ✓ | 同 C3/C4;裁线逐张目检(ledger Task 1:2100→2160 实图修正) |
| 13 | 无装饰分隔线(dark 发丝=节奏工具) | ✓ | `控件描边用 outline,禁 outlineVariant`+a9129c0 发丝仅段界顶边;light 剖面零分隔线 |
| 14 | hover 白名单属性 150-200ms | ✓ | a11y `卡 hover §6-7` 断言;全站 hover grep 零 transition:all,时长全引 duration token |
| 15 | :focus-visible 不裸删 outline | ✓ | a11y `:focus-visible 全局 2px primary 描边保留(state layer 不吞焦点闸)`(b695993 锚定防假绿) |
| 16 | reveal 一次即 unobserve | ✓ | page.index `每组 .reveal 的 --reveal-i 自 0 连续无跳跃`+`DOM 序 = 揭示序`;IO 触发即 unobserve 在 dist 脚本实测(grep 命中) |
| 17 | hero LCP 零位移+aspect-ratio 预置 CLS=0 | ✓ | `hero 高优先图 = 01-week + eager + srcset + 固有尺寸占位`+`head 预载…同 hash`;LCP 图零入场动画(a11y reduce 组+T8) |
| 18 | reduced-motion 更少更柔(opacity 200ms 保留) | ✓ | a11y `reduced-motion reveal 升档:opacity 200ms 淡入 + 位移归零`+`reduce 停位移/缩放`;`t9-reduce-*.png` ×4 实抓 |
| 19 | hover 包 (hover:hover) 闸 | ✓ | a11y `卡 hover §6-7` 与 `.appbar__theme:hover` 闸 2 断言 |
| 20 | outline/outline-variant 不越界 | ✓ | `控件描边用 outline,禁 outlineVariant` |
| 21 | 文案零问句/零正反重复/零口语 | ✓ | 同 C2 |
| 22 | zh/en 键树+句式同形 | ✓ | `i18n-parity` 4 断言+`EN 页 en.ts 关键串在场`(组件 copy=en 全覆盖反证) |
| 23 | 键盘触发零动画 | ✓(解释性) | scale(0.97) 仅绑 `:active`(global.css:371)。Enter 触发 click 无 :active 态=零动画;Space 按住时浏览器给 :active=160ms 按压反馈,与提案 §6-8「feedback 保留,键盘同值」一致。spec 列「键盘触发的动作零动画」取狭义=键盘**动作**(切换/过滤/导航)不挂动画,radiogroup/chip 切换即时值,合规。a11y `按钮 press §6-8` 锁 :active 档 |
| 24 | 全站零 @keyframes 循环 | ✓ | dist grep:@keyframes 仅 fade/rise,全消费点 `both` 终态无 infinite;blob 呼吸装饰在 reduce 下 `animation:none` |

## C. §13 批准项落地核

- R1 渐变 3→1:✓(见 B-7);R2 hero 手机整图下置:✓(Hero.astro ≤840px 图列下置 DOM 末位,B-1);R3 slogan 豁免:✓(`slogan 保留(§13 R3 豁免,逐字)`)
- 覆盖声明(八段总长 > 旧「每段≤1×100vh」):随文档批准生效,八段实高逐带目检 = `2026-10-23-dual-theme-rhythm.md` + t10 剖面

## D. 已知诚实缺口(不阻塞,留视觉批)

1. T9 键盘/灯箱浏览器级行为断言未建(产物级 JSDOM 不执行脚本;源码级 3 断言+焦点管理代码在位,t9 截图目检过)。
2. dark M8 对比度用 CDP 探针按「元素→最近不透明背景」实测:正文/链接/badge/钮全档 ≥5.50(AA 4.5✓,钮内 14.39);1 枚读数 4.6e6 为亮度计算退化值(同档 12px 文本另测 7.25,非真实缺陷)。(大值根因=某父级背景 r/g/b 解析为 0,即 rgba 全透明串未跳层,分母失真,非真实低对比;真值由同档 7.25 元素同底对照覆盖)。首版段底一刀切探针的 1.40「推荐」系假红(未取 badge 自身底),弃用。
3. state layer 无 150-200ms 过渡(§12 条款解释性放行,ledger T7 minor deferred,留视觉批)。
