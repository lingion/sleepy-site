# Task 10 证据 — 双主题节奏剖面(spec §17.1 交付物)

> 日期:2026-10-24 · 1440×fullPage 整页长截图 · 工具:Chrome headless CDP(`Page.captureScreenshot captureBeyondViewport`)
> 截图:`t10-rhythm-light-1440.png`(541KB,页面高 10835px)· `t10-rhythm-dark-1440.png`(1005KB,高 10836px)——**本目录入库,git 跟踪 PNG**(仓库存例:`src/assets/screenshots/*.png` 一直直接入库,无 LFS;单文件 ≤1MB,总增量 ~1.5MB,可接受)。

## 带底亮度阶梯实测(L = 0.299R+0.587G+0.114B,段首 scrollIntoView 后取 section 计算背景)

| 带 | light L | dark L(修后) | dark ΔL vs 前段 | 判读 |
|---|---|---|---|---|
| M1 hero | 252.1(surface) | 27.5 | — | 基准 |
| M2 views | 243.1(container-low) | **42.0**(container-high) | **+14.5** | ✓ 修前 27.5(ΔL 0.2,近不可见) |
| M3 connect | 252.1(surface) | 27.5 | -14.5 | ✓ 跳回清晰 |
| M4 schools 岛 | 237.9(container) | 31.8 | +4.3 | light 侧 island vs 带底 252.1→237.9=14.2 ✓;dark 岛 Δ4.3 靠岛描边+卡跳出(岛内 panel=container-lowest 25.4 vs 岛底 31.8=6.4 ✓) |
| M5 reminders | 252.1 | 27.5 | -4.3 | ✓(带底循环回 surface) |
| M6 gallery | **48.4 恒暗**(--site-band) | **48.4 恒暗** | +20.9 | ✓ 双主题同值(不翻转),两向步长都大 |
| M7 trust | 252.1 | 27.5 | -20.9 | ✓ |
| M8 download | 226.1(primary-container) | **61.5**(container-high 补丁已含发丝) | +34.0 | ✓ 全页最大跳变=转化断点 |
| Footer | 237.9 | 31.8 | -29.7 | ✓ |

light 侧相邻级差全部 ≥6(252.1↔243.1=9.0 最小,在 hero↔views;与 MD3 ladder Δ≈6 同级,判可辨);发丝线段界 hairlineCount=8(light 下不显示但 DOM 在位,dark 计算样式确认 8 处 1px outline-variant 可见)。

## 修前抓到的缺陷 + 修复(回 Task 5 修 → 即 M2 dark 节奏补丁缺失)

- **缺陷**:dark 下 M2 带底 surface-container-low(#1D1B20)与前后 surface(#1C1B1F)ΔL≈0.2,段界糊死——spec §17.1 明令「M2/M8 带改用 container-high 拉大步长」,实现只做了 M8。
- **修复**:`Views.astro` 新增 `:global([data-theme='dark']) .views-band { background: container-high; border-block-start: 1px solid outline-variant }`(仿 Download/Gallery 同口径);light 零变化(修前/修后 light ladder 逐项等值复核)。
- **回归**:新增源码闸断言(`tests/page.index.test.ts`「dark 节奏补丁」),RED→GREEN 走完;全量 `npx vitest run` = **9 files / 207 tests 全绿**;重建 dist 复测 ladder 数字如上表。

## 其他核对

- M6 带恒暗:`galleryBg = rgb(49,48,51)` 双主题一致 ✓;带内截图强制 light 变体(Shot forceVariant,§8 风险项)目检两张长图无主题错位 ✓。
- M8 dark 对比:底 #4830A5(48,48,165→实测 L61.5)文字 on-primary-container=rgb(230,222,255) 即 light 的 container 色做反转配对,dist 计算样式 = 文本 L≈226 → 对比度 (226+5)/(61.5+5)≈3.4 大字号 ✓;小字辅助行降用 on-surface-variant 档已避开彩底(实现期 T5 已处理,剖面复确认)。
- shadowed 元素双主题均 = [site-card(M5 主角 elevated), site-button(M8 elevated 钮)] 两处,光源 y 恒正 ✓。
- light 最小级差 hero→views ΔL=9:MD3 token 表既定值(#FDF8FF→#F7F1FD),非实现缺陷,目检长图带界清晰(渐变 blob 亦提供视觉断点)。

**结论:双主题节奏剖面合格,交付即本文件 + 两张 PNG。**
