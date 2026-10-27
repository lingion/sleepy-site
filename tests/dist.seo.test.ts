import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { site } from '../src/i18n/ui';
import release from '../src/data/release.json';

// v5 分发基建产物闸(spec §2.6/§8;Task 2 起步,Task 8 补齐 OG/robots/RSS/JSON-LD/404/sitemap 用例)。
// 消费 dist/client 全 8 路由 + robots/rss/sitemap/404 产物 —— 先跑 npm run build。
// 本文件 Task 2 落地四用例:多页化回归守卫(hreflang/语言链允许绿)+ 改造先红项(锚点绝对化/hasHero 方向锁)。

const read = (p: string) => {
  try {
    return readFileSync(new URL(p, import.meta.url), 'utf8');
  } catch {
    throw new Error(`${p} 不存在——先跑 npm run build 再跑本测试(spec §6 产物级验收)`);
  }
};

const zhDoc = new JSDOM(read('../dist/client/index.html')).window.document;
const enDoc = new JSDOM(read('../dist/client/en/index.html')).window.document;
const zhHead = zhDoc.querySelector('head')!;

describe('hreflang 多页化(Base 语义对,spec §2.6-2)', () => {
  it('zh 主页双指本页对:zh-CN→/ · en→/en/(Task 2 回归守卫,v4 值恰同)', () => {
    expect(zhHead.querySelector('link[hreflang="zh-CN"]')!.getAttribute('href')).toBe(site + '/');
    expect(zhHead.querySelector('link[hreflang="en"]')!.getAttribute('href')).toBe(site + '/en/');
    expect(zhHead.querySelector('link[hreflang="x-default"]')!.getAttribute('href')).toBe(site + '/');
  });
  it('en 主页双指本页对:zh-CN→/ · en→/en/', () => {
    const head = enDoc.querySelector('head')!;
    expect(head.querySelector('link[hreflang="zh-CN"]')!.getAttribute('href')).toBe(site + '/');
    expect(head.querySelector('link[hreflang="en"]')!.getAttribute('href')).toBe(site + '/en/');
  });
});

describe('AppBar 跨页锚点(spec §2.1 绝对路径不变量)', () => {
  it('zh 主页四 href = /#views · /schools/ · /faq/ · //#reminders', () => {
    for (const h of ['/#views', '/schools/', '/faq/', '/#reminders'])
      expect(zhDoc.querySelector(`#appbar a[href="${h}"]`), h).not.toBeNull();
  });
  it('en 主页四 href = /en/#views · /en/schools/ · /en/faq/ · /en/#reminders', () => {
    for (const h of ['/en/#views', '/en/schools/', '/en/faq/', '/en/#reminders'])
      expect(enDoc.querySelector(`#appbar a[href="${h}"]`), h).not.toBeNull();
  });
  it('裸 # 锚点绝迹 + 旧 #trust/#schools 锚点绝迹(负闸)', () => {
    const anchors = [...zhDoc.querySelectorAll('#appbar nav a')];
    for (const a of anchors) {
      expect(a.getAttribute('href')?.startsWith('#'), a.textContent ?? '').toBe(false);
      expect(a.getAttribute('href')).not.toBe('#trust');
      expect(a.getAttribute('href')).not.toBe('#schools');
    }
  });
  it('CTA 钮 href 站内 /download/(zh)与 /en/download/(en)', () => {
    expect(zhDoc.querySelector('#appbar [data-appbar-cta]')!.getAttribute('href')).toBe('/download/');
    expect(enDoc.querySelector('#appbar [data-appbar-cta]')!.getAttribute('href')).toBe('/en/download/');
  });
});

describe('AppBar CTA 缺省态 prop 化 + 语言链 mirror(源码方向锁)', () => {
  const src = read('../src/components/AppBar.astro');
  it('缺省态三元 hasHero ? show : hide(方向锁:反转即红)', () => {
    expect(src).toMatch(/hasHero\s*\?\s*['"]show['"]\s*:\s*['"]hide['"]/);
    expect(src).not.toMatch(/hasHero\s*\?\s*['"]hide['"]\s*:\s*['"]show['"]/);
  });
  it('语言链读 mirror,单页假设 ternary 绝迹', () => {
    // 正闸:.appbar__lang 的 href 属性消费 mirror prop
    expect(src).toMatch(/class="site-chip appbar__lang[^"]*"\s+href=\{mirror\}/);
    // 负闸:旧形态 = href 属性内直接写单页 ternary;prop 缺省值回退(planned「缺省回退单页值」)不算残留
    expect(src).not.toMatch(/href=\{lang === 'zh' \? '\/en\/' : '\/'\}/);
  });
  it('trust 锚点项与锚点键绝迹(AppBar 源码不再引 anchors.trust)', () => {
    expect(src).not.toMatch(/anchors\.trust/);
    expect(src).not.toContain('#trust');
  });
});

describe('en 主页语言链回归守卫(mirror 值不变,终审 I4)', () => {
  it('en 页 .appbar__lang href 仍为 /(改造前后同值,防透传断线)', () => {
    expect(enDoc.querySelector('.appbar__lang')!.getAttribute('href')).toBe('/');
  });
  it('zh 页 .appbar__lang href 仍为 /en/', () => {
    expect(zhDoc.querySelector('.appbar__lang')!.getAttribute('href')).toBe('/en/');
  });
});

// ===== Task 8:分发基建产物闸(spec §2.6 全 8 项) =====

const ROUTES: { slug: string; file: string; zh: string; en: string }[] = [
  { slug: 'home', file: '', zh: '/', en: '/en/' },
  { slug: 'schools', file: 'schools/', zh: '/schools/', en: '/en/schools/' },
  { slug: 'download', file: 'download/', zh: '/download/', en: '/en/download/' },
  { slug: 'faq', file: 'faq/', zh: '/faq/', en: '/en/faq/' },
]

// 路由产物定位:en 前缀仅看语言(zh home file='' → root;en home → en/)
const routeDoc = (file: string, lang: 'zh' | 'en') =>
  new JSDOM(read(`../dist/client/${lang === 'en' ? 'en/' : ''}${file}index.html`)).window.document

describe('hreflang 矩阵(spec §2.6-2:8 路由各双指本页对)', () => {
  for (const r of ROUTES) {
    for (const lang of ['zh', 'en'] as const) {
      it(`${r.slug} ${lang}:zh-CN/en 指本页对,x-default=/`, () => {
        const head = routeDoc(r.file, lang).querySelector('head')!
        expect(head.querySelector('link[hreflang="zh-CN"]')!.getAttribute('href')).toBe(site + r.zh)
        expect(head.querySelector('link[hreflang="en"]')!.getAttribute('href')).toBe(site + r.en)
        expect(head.querySelector('link[hreflang="x-default"]')!.getAttribute('href')).toBe(site + '/')
      })
    }
  }
})

describe('OG 分享图(spec §2.6-1:8 枚存在 + 各页绝对 URL 指本页对应图)', () => {
  for (const r of ROUTES) {
    for (const lang of ['zh', 'en'] as const) {
      it(`public/og/${r.slug}-${lang}.png 存在`, () => {
        expect(existsSync(new URL(`../public/og/${r.slug}-${lang}.png`, import.meta.url)), r.slug + '-' + lang).toBe(true)
      })
      it(`${r.slug} ${lang} og:image / twitter:image = 绝对 URL 指本页图`, () => {
        const head = routeDoc(r.file, lang).querySelector('head')!
        const expectOg = `${site}/og/${r.slug}-${lang}.png`
        expect(head.querySelector('meta[property="og:image"]')!.getAttribute('content')).toBe(expectOg)
        expect(head.querySelector('meta[name="twitter:image"]')!.getAttribute('content')).toBe(expectOg)
      })
    }
  }
})

// S3b/S3c 修订:页级图允许面 = zh/en 主页 SoftwareApplication + faq 双语 FAQPage
// (用户"SEO 极致"定令覆盖旧 D8 禁 FAQPage);schools/download 仍须零页级图。
describe('JSON-LD 页级图允许面(spec §2.6-3 + S3 系列修订)', () => {
  const pageLd = (doc: Document) =>
    [...doc.querySelectorAll('head script[type="application/ld+json"]')]
      .map((s) => JSON.parse(s.textContent!))
      .filter((x) => !x['@graph'])
  it('主页含且仅含一枚 SoftwareApplication,字段全', () => {
    const lds = pageLd(zhDoc)
    expect(lds.length).toBe(1)
    const ld = lds[0]
    const universal = release.assets.find((a) => a.name.includes('universal'))!
    expect(ld['@type']).toBe('SoftwareApplication')
    expect(ld.operatingSystem).toBe('Android')
    expect(ld.softwareVersion).toBe(release.tag)
    expect(ld.downloadUrl).toBe(universal.url)
    expect(ld.license).toContain('GPL')
  })
  it('schools/download 四路由零页级 ld+json(en 主页/faq 双语由 jsonld.pages 锁)', () => {
    for (const [file, lang] of [['schools/', 'zh'], ['schools/', 'en'], ['download/', 'zh'], ['download/', 'en']] as const) {
      expect(pageLd(routeDoc(file, lang)), `${file}-${lang}`).toEqual([])
    }
  })
})

describe('robots + RSS(spec §2.6-4/6)', () => {
  it('robots.txt:Allow 全开 + Sitemap 行指 /sitemap-index.xml,无 Host', () => {
    const txt = read('../dist/client/robots.txt')
    expect(txt).toMatch(/User-agent: \*\s*\nAllow: \//)
    expect(txt).toContain(`Sitemap: ${site}/sitemap-index.xml`)
    expect(txt).not.toMatch(/^Host:/m)
  })
  it('rss.xml ≥1 item,当前版条目:link 含 /download/,pubDate 存在', () => {
    const xml = read('../dist/client/rss.xml')
    const dom = new JSDOM(xml, { contentType: 'text/xml' })
    const items = [...dom.window.document.querySelectorAll('item')]
    expect(items.length).toBeGreaterThanOrEqual(1)
    expect(items[0].querySelector('link')!.textContent).toContain('/download/')
    expect(items[0].querySelector('title')!.textContent).toContain(release.tag)
    expect(items[0].querySelector('pubDate')!.textContent).toBeTruthy()
  })
  it('主页 head 挂 application/rss+xml alternate', () => {
    expect(zhHead.querySelector('link[type="application/rss+xml"]')!.getAttribute('href')).toBe(site + '/rss.xml')
  })
})

describe('sitemap i18n(spec §2.6-5:恰 8 路由 + 双语 alternate + 零 404)', () => {
  const xml = read('../dist/client/sitemap-0.xml')
  const dom = new JSDOM(xml, { contentType: 'text/xml' })
  it('恰 8 <loc> 且全路由齐,404 绝迹', () => {
    const locs = [...dom.window.document.querySelectorAll('url > loc')].map((n) => n.textContent)
    expect(locs.length).toBe(8)
    const all = [...ROUTES].flatMap((r) => [r.zh, r.en])
    for (const p of all) expect(locs, p).toContain(site + p)
    expect(xml).not.toContain('404')
  })
  it('每条恰含 zh-CN + en 两 alternate 互指本页对', () => {
    for (const url of dom.window.document.querySelectorAll('url')) {
      const alts = [...url.querySelectorAll('xhtml\\:link, link[rel="alternate"]')]
      expect(alts.length, url.querySelector('loc')!.textContent).toBe(2)
      const langs = alts.map((a) => a.getAttribute('hreflang')).sort()
      expect(langs).toEqual(['en', 'zh-CN'])
    }
  })
})

describe('非主页零 hero preload(spec §2.6-8 负闸)', () => {
  it('6 工具/FAQ 页 head 无 01-week preload(主页双页正闸已在 page.index)', () => {
    for (const r of ROUTES) {
      if (r.slug === 'home') continue
      for (const lang of ['zh', 'en'] as const)
        expect(routeDoc(r.file, lang).querySelector('head link[rel="preload"][as="image"]'), `${r.slug}-${lang}`).toBeNull()
    }
  })
})

describe('404 产物(spec §2.6-7)', () => {
  const doc404 = () => new JSDOM(read('../dist/client/404.html')).window.document
  it('四页链接齐备(/ · /schools/ · /download/ · /faq/)', () => {
    for (const h of ['/', '/schools/', '/download/', '/faq/'])
      expect(doc404().querySelector(`a[href="${h}"]`), h).not.toBeNull()
  })
  it('zh 主 en 尾双语行 + noindex', () => {
    const txt = doc404().body.textContent ?? ''
    expect(txt).toContain('这个路径不在名录里')
    expect(doc404().querySelector('meta[name="robots"][content*="noindex"]')).not.toBeNull()
  })
  it('404 页无 hero preload', () => {
    expect(doc404().querySelector('head link[rel="preload"][as="image"]')).toBeNull()
  })
})
