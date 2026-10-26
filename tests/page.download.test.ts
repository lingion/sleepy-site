// v5 /download/ 产物闸(plan Task 5 Step 1)— dist/client/download/index.html 级 DOM 验收
// 出口归位(spec §2.4):四 ABI + 校验 + 安装 + 架构小表 + 在线体验 + 商店占位 + 更多链
// CTA 纪律(§11-6 / 终审 F3):main 域零 Filled、AppBar CTA hide 态、恰一主钮 = universal Elevated
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site } from '../src/i18n/ui';
import release from '../src/data/release.json';
import { zh } from '../src/i18n/zh';
import { en } from '../src/i18n/en';

const load = (p: string): JSDOM => {
  try {
    return new JSDOM(readFileSync(new URL(p, import.meta.url), 'utf8'));
  } catch {
    throw new Error(`${p} 不存在——先跑 npm run build 再跑本测试(spec §6 产物级验收)`);
  }
};

const zhDom = load('../dist/client/download/index.html');
const zhDoc = zhDom.window.document;
const zhHtml = zhDoc.documentElement.innerHTML;
const enDoc = load('../dist/client/en/download/index.html').window.document;
const enHtml = enDoc.documentElement.innerHTML;

describe('下载资产与外链(spec §2.4)', () => {
  it('四 ABI 下载 URL 全在', () => {
    for (const a of release.assets) expect(zhHtml).toContain(a.url);
  });
  it('sha256sumsUrl 在 + releases/latest 外链在', () => {
    expect(zhHtml).toContain(release.sha256sumsUrl);
    expect(zhDoc.querySelector('a[href$="releases/latest"]')).not.toBeNull();
  });
  it('minSdk 文案在(迁自 v4 M8)', () => {
    expect(zhHtml).toContain(zh.download.minSdk);
  });
  it('版本行渲染 = tag · minSdk · 日期 发布(tnum 行)', () => {
    expect(zhHtml).toContain(`${release.tag} · ${zh.download.minSdk} · ${release.date.slice(0, 10)} 发布`);
    expect(enHtml).toContain(`${release.tag} · ${en.download.minSdk} · released ${release.date.slice(0, 10)}`);
  });
  it('「在线体验提供完整功能,无需安装。」串 pin(迁自 page.index:170,spec §10)', () => {
    expect(zhHtml).toContain('在线体验提供完整功能,无需安装。');
    expect(enHtml).toContain(en.download.trial);
  });
});

describe('CTA 纪律(§11-6 多页化延伸 / 终审 F3)', () => {
  it('main 域零 .site-button--filled(AppBar hide 态类名保留 → 域限定)', () => {
    expect(zhDoc.querySelectorAll('main .site-button--filled').length).toBe(0);
    expect(enDoc.querySelectorAll('main .site-button--filled').length).toBe(0);
  });
  it('AppBar CTA 本页恒隐:hasHero 缺省 → data-appbar-cta=hide', () => {
    expect(zhDoc.querySelector('#appbar [data-appbar-cta]')?.getAttribute('data-appbar-cta')).toBe('hide');
  });
  it('恰一枚主钮 [data-dl-primary] 且指向 universal APK', () => {
    const primaries = zhDoc.querySelectorAll('[data-dl-primary]');
    expect(primaries).toHaveLength(1);
    const uni = release.assets.find((a) => a.name.includes('universal'))!;
    expect(primaries[0].getAttribute('href')).toBe(uni.url);
  });
  it('恰一行 [data-abi-row][data-rec] 且 = universal', () => {
    const rows = zhDoc.querySelectorAll('[data-abi-row]');
    expect(rows).toHaveLength(4);
    const recs = zhDoc.querySelectorAll('[data-abi-row][data-rec]');
    expect(recs).toHaveLength(1);
    expect(recs[0].getAttribute('data-abi')).toBe('universal');
  });
});

describe('信息区块(spec §2.4 六段)', () => {
  it('在线体验外链 rel 含 noopener', () => {
    const a = zhDoc.querySelector('[data-role="trial"]');
    expect(a?.getAttribute('rel')).toContain('noopener');
  });
  it('商店占位 disabled ×2', () => {
    expect(zhDoc.querySelectorAll('[data-store-disabled]')).toHaveLength(2);
  });
  it('「如何确认手机架构」标题 + 三行小表 + 检测提示在', () => {
    expect(zhHtml).toContain(zh.downloadPage.archTitle);
    const trs = zhDoc.querySelectorAll('[data-arch-table] tbody tr');
    expect(trs).toHaveLength(3);
    expect(zhHtml).toContain(zh.downloadPage.archNote);
  });
  it('安装步骤三行(正面陈述)在', () => {
    expect(zhHtml).toContain(zh.downloadPage.installTitle);
    for (const step of zh.downloadPage.installSteps) expect(zhHtml).toContain(step);
  });
  it('校验段:标题 + sha256sums 链 + 方法说明', () => {
    expect(zhHtml).toContain(zh.downloadPage.verifyTitle);
    expect(zhHtml).toContain(zh.downloadPage.verifyNote);
  });
  it('更多区四链(Releases/源码/赞助/Issues)在', () => {
    for (const key of ['releases', 'repo', 'sponsor', 'issues'] as const) {
      expect(zhHtml).toContain(zh.downloadPage.moreLinks[key]);
    }
  });
});

describe('页面骨架与双语镜像', () => {
  it('h1 = downloadPage.heading;canonical/hreflang 指对', () => {
    expect(zhDoc.querySelector('main h1')?.textContent).toBe(zh.downloadPage.heading);
    expect(zhDoc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${site}/download/`);
    expect(zhDoc.querySelector('link[hreflang="en"]')?.getAttribute('href')).toBe(`${site}/en/download/`);
    expect(enDoc.querySelector('link[hreflang="zh-CN"]')?.getAttribute('href')).toBe(`${site}/download/`);
  });
  it('工具页禁编排(spec §5):无 reveal 类', () => {
    expect(zhDoc.querySelectorAll('[data-reveal-group], .reveal').length).toBe(0);
  });
  it('en 页 h1 与推荐徽标镜像', () => {
    expect(enDoc.querySelector('main h1')?.textContent).toBe(en.downloadPage.heading);
    expect(enHtml).toContain(en.downloadPage.recommended);
  });
});
