import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import release from '../src/data/release.json';
import schools from '../src/data/schools.grouped.json';

// T6 七段主页静态闸(spec §3/§2.5/§6):
// dist/client/index.html 由 `npm run build` 产出 —— 测试消费构建产物,DOM 级机械化验收。
// 若文件缺失 = 未构建,直接红并提示(nightly CI 顺序: build → test)。

const HTML = (() => {
  try {
    return readFileSync(new URL('../dist/client/index.html', import.meta.url), 'utf8');
  } catch {
    throw new Error('dist/client/index.html 不存在——先跑 npm run build 再跑本测试(spec §6 产物级验收)');
  }
})();

const dom = new JSDOM(HTML);
const doc = dom.window.document;

describe('七段结构(spec §3)', () => {
  it('七个锚段依序齐备', () => {
    for (const id of ['hero', 'features', 'schools', 'gallery', 'download', 'trust']) {
      expect(doc.getElementById(id), `section #${id}`).not.toBeNull();
    }
    expect(doc.querySelector('footer')).not.toBeNull();
  });
  it('DOM 序 = 揭示序(不变量,§2.4/§8):reveal 元素 document order 即承诺序', () => {
    const reveals = [...doc.querySelectorAll('.reveal')];
    expect(reveals.length).toBeGreaterThan(0);
    // features 4 卡依 DOM 序带递增 --reveal-i
    const cards = [...doc.querySelectorAll('#features .reveal')];
    expect(cards.length).toBe(4);
    const idx = cards.map((c) => c.getAttribute('style') ?? '');
    expect(idx).toEqual(['--reveal-i: 0;', '--reveal-i: 1;', '--reveal-i: 2;', '--reveal-i: 3;']);
  });
});

describe('blob 机械化验收(spec §6):data-blob 计数 = 3,值 0/1/2 各一', () => {
  it('产物 DOM 里恰 3 个 [data-blob]', () => {
    const blobs = [...doc.querySelectorAll('[data-blob]')];
    expect(blobs.length).toBe(3);
    expect(blobs.map((b) => b.getAttribute('data-blob')).sort()).toEqual(['0', '1', '2']);
  });
  it('hero 底 #1 · 下载区上 #2 · footer 内 #3(位置契约)', () => {
    expect(doc.querySelector('#hero [data-blob="0"]')).not.toBeNull();
    expect(doc.querySelector('#download [data-blob="1"]')).not.toBeNull();
    expect(doc.querySelector('footer [data-blob="2"]')).not.toBeNull();
  });
});

describe('文案验收(spec §2.5 样例句逐句 + 红线)', () => {
  const text = doc.body?.textContent ?? '';
  const stripped = text.replace(/\s+/g, '');
  it('microcopy 契约逐句进产物', () => {
    expect(stripped).toContain('这所学校还没收录');
    expect(stripped).toContain('提个issue,很快就会补上;不方便开issue的话,群里留言也行。');
    expect(stripped).toContain('不确定就选Universal:适配全部架构。');
    expect(stripped).toContain('页面塌了,课表不会。');
    expect(stripped).toContain('一个人写的开源课表。没有广告,没有追踪,代码全公开。');
    expect(stripped).toContain('适配你学校的问题,开issue优先,群里@我也行。');
  });
  it('口语/自贬红线零出现(2026-10-20 用户修订:通吃/不吭声/说一声/喝可乐)', () => {
    for (const w of ['通吃', '不吭声', '说一声', '请我喝可乐', 'Buy me a cola']) {
      expect(HTML, w).not.toContain(w);
    }
  });
  it('slogan 单点常量落 hero(临时 A,§7.2 待签收)', () => {
    expect(stripped).toContain('构建无壳,自由自在');
  });
  it('红线词零出现', () => {
    for (const w of ['赋能', '极致', '匠心']) {
      expect(HTML).not.toContain(w);
    }
  });
  it('FAQ 外链钉死', () => {
    expect(HTML).toContain('https://github.com/lingion/sleepy/blob/main/FAQ.md');
  });
});

describe('教务段(spec §3③/§4.1)', () => {
  it('JS-off:全量分组静态可读(348 行全渲染)', () => {
    const rows = doc.querySelectorAll('#schools [data-school]');
    expect(rows.length).toBe(schools.length);
    expect(schools.length).toBe(348);
  });
  it('统计 chip 口径「348 条收录 · 33 协议」', () => {
    const text = (doc.getElementById('schools')?.textContent ?? '').replace(/\s+/g, '');
    expect(text).toContain('348条收录·33协议');
  });
  it('点击不跳转:校名行不是 <a>(§3③)', () => {
    for (const row of doc.querySelectorAll('#schools [data-school]')) {
      expect(row.tagName).not.toBe('A');
      expect(row.querySelector('a')).toBeNull();
    }
  });
});

describe('下载段(spec §3⑤/§4.2)', () => {
  it('latest 直链 + 四 ABI 行 + sha256 外链', () => {
    const dl = doc.getElementById('download');
    const html = dl?.innerHTML ?? '';
    expect(html).toContain('https://github.com/lingion/sleepy/releases/latest');
    for (const a of release.assets) {
      expect(html, `asset ${a.name}`).toContain(a.url);
    }
    expect(html).toContain(release.sha256sumsUrl);
    expect(doc.querySelector('#download [data-store-disabled]')).not.toBeNull();
  });
  it('Android 8.0+ minSdk 事实', () => {
    expect((doc.getElementById('download')?.textContent ?? '')).toContain('Android 8.0');
  });
});

describe('画廊段(spec §3④)', () => {
  it('13 图网格(页面 8 + 组件 5) + lightbox 岛骨架(aria-modal 容器预置)', () => {
    const figs = doc.querySelectorAll('#gallery [data-gallery-figure]');
    expect(figs.length).toBe(13);
    expect(doc.querySelector('#gallery [data-lightbox]')).not.toBeNull();
  });
  it('主题感知:每个缩略含浅/深两版截图', () => {
    const lights = doc.querySelectorAll('#gallery .shot__light');
    const darks = doc.querySelectorAll('#gallery .shot__dark');
    expect(lights.length).toBe(13);
    expect(darks.length).toBe(13);
  });
});

describe('a11y/SEO 基线', () => {
  it('h1 唯一 = slogan;lang=zh-CN', () => {
    expect(doc.querySelectorAll('h1').length).toBe(1);
    expect(doc.documentElement.lang).toBe('zh-CN');
  });
  it('设备框截图真机图带 alt,无 stock', () => {
    for (const img of doc.querySelectorAll('img')) {
      expect(img.getAttribute('alt'), `alt on ${img.src}`).not.toBeNull();
    }
  });
});
