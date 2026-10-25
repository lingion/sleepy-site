// FAQ 离线构建 — spec §5 内容管线(v5 四页 Task 3)
// 职责分工照 fetch-schools/build-schools 先例:本脚本纯离线 = 只读仓内快照,CI/本地行为确定;
// 网络刷新归 fetch-faq.mjs(手动)。
// 输入 = fixtures/FAQ.md(zh 真相源快照) + scripts/faq-en.md(人工译文,同节序同问序)
// 输出 = src/data/faq.json(FaqDoc:{updatedAt,sections[{zh,en,items[{id,q,a}]}]})
// 数量闸 = assertPairing:zh/en 条数不等 → catch → exit 1(spec §5 禁半边 FAQ)。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// repoUrl 与 src/i18n/ui.ts:6 同源(ui.ts 是 TS,Node 侧不可 import,值静态双写;漂移由产物闸兜)
const REPO_URL = 'https://github.com/lingion/sleepy';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function absolutize(href) {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  return `${REPO_URL}/blob/main/${href}`; // 相对仓库路径绝对化(FAQ.md:44 docs/schools-list.md → 死链防御)
}

// 行内解析次序定死(终审 I11):链接 [text](url) 优先于行内 code——
// FAQ.md:44 链接文字内嵌行内码,先码后链会留反引号残渣。
export function parseInline(src, out = []) {
  const flush = (txt) => {
    if (!txt) return;
    for (const p of txt.split(/(`[^`]+`)/)) {
      if (!p) continue;
      if (/^`[^`]+`$/.test(p)) out.push({ t: 'code', v: p.slice(1, -1) });
      else out.push({ t: 'text', v: p });
    }
  };
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('[', i);
    if (open === -1) {
      flush(src.slice(i));
      break;
    }
    const closeB = src.indexOf(']', open + 1);
    const closeP = closeB === -1 ? -1 : src.indexOf(')', closeB + 2);
    if (closeB === -1 || src[closeB + 1] !== '(' || closeP === -1) {
      flush(src.slice(open, open + 1)); // 不成对 = 普通字符
      i = open + 1;
      continue;
    }
    flush(src.slice(i, open));
    const inner = [];
    parseInline(src.slice(open + 1, closeB), inner); // 链接文字递归(可含 code)
    out.push({ t: 'link', href: absolutize(src.slice(closeB + 2, closeP).trim()), inline: inner });
    i = closeP + 1;
  }
  return out;
}

function renderInline(items) {
  return items
    .map((x) => {
      if (x.t === 'code') return `<code>${esc(x.v)}</code>`;
      if (x.t === 'link') return `<a href="${esc(x.href)}">${renderInline(x.inline)}</a>`;
      return esc(x.v);
    })
    .join('');
}

// FaqBlock[] → HTML 串(Task 6 FaqBody 消费;渲染子集 = 段落/链接/列表/行内 code/pre)
export function blocksToHtml(blocks) {
  return blocks
    .map((b) => {
      if (b.type === 'paragraph') return `<p>${renderInline(b.inline)}</p>`;
      if (b.type === 'pre') return `<pre translate="no"><code>${esc(b.text)}</code></pre>`;
      if (b.type === 'list') {
        const items = b.items.map((inline) => `<li>${renderInline(inline)}</li>`).join('');
        return b.ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
      }
      throw new Error(`未知 block 类型: ${b.type}`);
    })
    .join('');
}

function parseBlocks(bodyLines) {
  const blocks = [];
  let para = [];
  let list = null; // {ordered, items:[[inline]]}
  let inFence = false;
  let fence = { lang: '', lines: [] };
  const closePara = () => {
    if (para.length) {
      blocks.push({ type: 'paragraph', inline: parseInline(para.join('\n')) });
      para = [];
    }
  };
  const closeList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };
  for (const line of bodyLines) {
    if (/^```/.test(line.trim())) {
      if (inFence) {
        blocks.push({ type: 'pre', lang: fence.lang, text: fence.lines.join('\n') });
        fence = [];
        inFence = false;
      } else {
        closePara();
        closeList();
        inFence = true;
        fence.lang = line.trim().slice(3).trim();
      }
      continue;
    }
    if (inFence) {
      fence.lines.push(line);
      continue;
    }
    const ul = line.match(/^[-*] (.*)$/);
    const ol = line.match(/^\d+\. (.*)$/);
    if (ul || ol) {
      closePara();
      const ordered = Boolean(ol);
      if (!list || list.ordered !== ordered) {
        closeList();
        list = { type: 'list', ordered, items: [] };
      }
      list.items.push(parseInline((ol ?? ul)[1]));
      continue;
    }
    if (line.trim() === '') {
      closePara();
      closeList();
      continue;
    }
    para.push(line);
  }
  closePara();
  closeList();
  if (inFence) fence.lines.length && blocks.push({ type: 'pre', lang: fence.lang, text: fence.lines.join('\n') }); // 未闭合围栏不吞内容
  return blocks;
}

// md → 节数组(lang 字段名:'zh'|'en';无问空节整节剔除——「相关链接」0 问由此规则消失,非点名)
export function parseFaq(md, lang = 'zh') {
  const sections = [];
  let sec = null;
  let q = null;
  let body = [];
  const closeQ = () => {
    if (q) {
      q.a[lang] = parseBlocks(body);
      sec.items.push(q);
      q = null;
      body = [];
    }
  };
  const closeSec = () => {
    closeQ();
    if (sec && sec.items.length) sections.push(sec);
    sec = null;
  };
  for (const line of md.split(/\r?\n/)) {
    if (/^# /.test(line) || /^>/.test(line)) continue; // 顶层标题与引言:不进节
    if (/^## /.test(line)) {
      closeSec();
      sec = { [lang]: line.slice(3).trim(), items: [] };
      continue;
    }
    if (/^### /.test(line)) {
      closeQ();
      q = { q: { [lang]: line.slice(4).trim() }, a: { zh: [], en: [] } };
      continue;
    }
    if (q) body.push(line);
    // 节标题与首问之间的裸内容(快照内无)自然丢弃
  }
  closeSec();
  // id slug 定稿:sec-{节序}-q-{问序},剔除空节后连续(锚点稳定,T6 TOC/深链消费)
  sections.forEach((s, si) => s.items.forEach((it, qi) => (it.id = `sec-${si + 1}-q-${qi + 1}`)));
  return sections;
}

// 数量闸:zh/en 条数不等即 throw(build 主流程 catch → exit 1)
export function assertPairing(zhItems, enItems) {
  if (zhItems.length !== enItems.length) {
    throw new Error(`条数不一致: zh ${zhItems.length} vs en ${enItems.length} — 禁半边 FAQ(spec §5)`);
  }
}

// zh 侧 + en 侧节数组 → 合并 FaqDoc(同节序同问序;assertPairing 已保证条数)
function mergeDocs(zhSecs, enSecs, updatedAt) {
  return {
    updatedAt,
    sections: zhSecs.map((zs, i) => ({
      zh: zs.zh,
      en: enSecs[i]?.en ?? zs.zh,
      items: zs.items.map((zi, j) => ({
        id: zi.id,
        q: { zh: zi.q.zh, en: enSecs[i]?.items[j]?.q.en ?? zi.q.zh },
        a: { zh: zi.a.zh, en: enSecs[i]?.items[j]?.a.en ?? zi.a.zh },
      })),
    })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ZH_MD = fileURLToPath(new URL('../fixtures/FAQ.md', import.meta.url));
  const EN_MD = fileURLToPath(new URL('./faq-en.md', import.meta.url));
  const OUT = fileURLToPath(new URL('../src/data/faq.json', import.meta.url));
  const zhMd = readFileSync(ZH_MD, 'utf8');
  const enMd = readFileSync(EN_MD, 'utf8');
  const zhSecs = parseFaq(zhMd, 'zh');
  const enSecs = parseFaq(enMd, 'en');
  try {
    assertPairing(zhSecs.flatMap((s) => s.items), enSecs.flatMap((s) => s.items));
  } catch (err) {
    console.error(`[build-faq] ${err.message}`);
    process.exit(1);
  }
  const updatedAt = zhMd.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? ''; // 文件内声明优先(终审:写死用文件内声明)
  const doc = mergeDocs(zhSecs, enSecs, updatedAt);
  writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(
    `[build-faq] faq.json: ${doc.sections.length} 节 · ${doc.sections.reduce((n, s) => n + s.items.length, 0)} 问 · updatedAt=${doc.updatedAt}`
  );
}
