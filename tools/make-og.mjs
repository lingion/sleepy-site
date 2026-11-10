#!/usr/bin/env node
// v5 OG 分享图生产器(spec §2.6-1,R7:文案冻结于 commit,§4 文案改版 = 同批重渲染 8 枚)
// 离线工具(作者机跑),绝不在构建链:HTML 模板 → 本机 Google Chrome headless 截图 → public/og/{slug}-{lang}.png
// 无运行期图像依赖(satori/sharp 已否——plan 裁决)。重跑幂等:同文案 = 同图。
// 文案真源 = src/i18n/{zh,en}.ts 的 meta + 各页 heading/sub(与站点同步改版)。
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = `${ROOT}/public/og`;
const TMP = `${ROOT}/.og-tmp`;
const CHROME = process.env.CHROME_BIN ?? (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
if (!existsSync(CHROME)) {
  console.error(`找不到 Chrome:${CHROME}\n设 CHROME_BIN 指向本机 Chrome 可执行文件。`);
  process.exit(1);
}

const readJson = (path) => JSON.parse(readFileSync(`${ROOT}/${path}`, 'utf8'));
const release = readJson('src/data/release.json');
const product = readJson('src/data/product-release.json');
const catalog = readJson('src/data/schools.snapshot.json');
if (release.tag !== product.tag || catalog.ref !== product.tag) throw new Error('Release and catalog snapshots must match the product release');
const version = `${release.tag} · ${product.publishedAt.slice(0, 10)} UTC`;
// Counts come from the website's catalog release snapshot.
const PAGES = {
  home: {
    zh: { eyebrow: 'Sleepy', title: '开源课表\n构建无壳,自由自在', sub: `${version} · ${catalog.rowCount} 所学校直连 · 本地优先` },
    en: { eyebrow: 'Sleepy', title: 'Open-source timetable\nBuilt open. Feels free.', sub: `${version} · ${catalog.rowCount} schools supported · local-first` },
  },
  schools: {
    // Verified breakdown: catalog.configuredCount configured, catalog.unverifiedCount unverified, catalog.pendingCount pending
    zh: { eyebrow: '学校查找', title: '收录与检索', sub: `收录 ${catalog.rowCount} 所高校教务直连 · 涵盖 ${catalog.typeCount} 种教务协议` },
    en: { eyebrow: 'School lookup', title: 'Coverage & search', sub: `${catalog.rowCount} universities supported · ${catalog.typeCount} academic protocols` },
  },
  download: {
    zh: { eyebrow: '下载中心', title: '下载 Sleepy', sub: `${version} · 通用 APK · 全架构与校验和` },
    en: { eyebrow: 'Download', title: 'Get Sleepy', sub: `${version} · universal APK · all ABIs and checksums` },
  },
  releases: {
    zh: { eyebrow: '更新说明', title: 'Sleepy 的新变化', sub: `${version} · 完整双语发布说明` },
    en: { eyebrow: 'Release notes', title: 'What changed in Sleepy', sub: `${version} · complete bilingual notes` },
  },
  faq: {
    zh: { eyebrow: '常见问答', title: '有疑问,先查这里', sub: '功能、导入、组件与隐私边界' },
    en: { eyebrow: 'FAQ', title: 'Questions, answered', sub: 'Features, imports, widgets and privacy' },
  },
};

// —— 1200×630 模板:品牌色 M3 deep-purple surface;左文右形(纯 CSS 渐变块,无外链资源)——
function pageHtml(slug, lang) {
  const c = PAGES[slug][lang];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{background:#0F0D15;color:#FDF8FF;font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;display:flex}
  .txt{flex:1;display:flex;flex-direction:column;justify-content:center;padding:80px 64px 80px 96px;z-index:2}
  .eyebrow{font-size:28px;letter-spacing:.06em;color:#D0BCFF;margin-bottom:28px;font-weight:600}
  h1{font-size:${slug === 'home' && lang === 'zh' ? 64 : 76}px;line-height:1.12;font-weight:700;white-space:pre-wrap}
  .sub{font-size:30px;line-height:1.5;color:#E6E0E9;margin-top:36px;max-width:640px}
  .art{width:460px;flex:none;position:relative}
  .art::before{content:"";position:absolute;inset:-140px -260px -140px -60px;
    background:radial-gradient(52% 52% at 62% 34%,hsl(293.82 46% 52% / .9),hsl(278.82 46% 40% / .55) 55%,transparent 72%);
    filter:blur(6px)}
  .art::after{content:"";position:absolute;inset:-120px -200px -160px -20px;
    background:radial-gradient(40% 40% at 40% 70%,hsl(308.82 46% 48% / .65),transparent 70%);
    filter:blur(8px)}
  .badge{position:absolute;right:72px;bottom:64px;z-index:2;font-size:24px;color:#0F0D15;background:#D0BCFF;border-radius:9999px;padding:10px 28px;font-weight:700}
  </style></head><body>
  <div class="txt"><div class="eyebrow">${c.eyebrow}</div><h1>${c.title}</h1><p class="sub">${c.sub}</p></div>
  <div class="art"></div><div class="badge">Android · GPL-3.0</div>
  </body></html>`;
}

mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });
for (const slug of Object.keys(PAGES)) {
  for (const lang of ['zh', 'en']) {
    const f = `${TMP}/${slug}-${lang}.html`;
    writeFileSync(f, pageHtml(slug, lang));
    execFileSync(CHROME, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
      `--screenshot=${OUT}/${slug}-${lang}.png`, '--window-size=1200,630', pathToFileURL(f).href,
    ], { stdio: ['ignore', 'ignore', 'pipe'], timeout: 30000 });
    console.log(`Rendered og/${slug}-${lang}.png`);
  }
}
rmSync(TMP, { recursive: true, force: true });
