// v5 /schools/ 岛纯函数 — plan Task 4:URL 态 ⇄ 行集 ⇄ DOM 灌入,三处共用 searchFace 唯一语义(终审 I7)
// 体积闸(spec §2.3):本文件 + search.ts 源长之和 < 6144(page.schools.test.ts 钉死)
import { matchSchool, normalize } from './search';
import type { SchoolRow } from './schools-view';

export interface UrlState {
  q: string;
  province: string;
  type: string;
  expandAll: boolean;
}

/** focus=s 不属四态 — 岛首屏单独读 location.search 的一次性聚焦信号,读完 replaceState 剥除(plan Task 4) */
export function parseUrlState(search: string): UrlState {
  const p = new URLSearchParams(search);
  return { q: p.get('q') ?? '', province: p.get('p') ?? '', type: p.get('t') ?? '', expandAll: false };
}

/** 空值不写参;顺序定死 p→t→q;校名查询词保字面(无 &/# 字符,浏览器发送时自会编码) */
export function writeUrlState(s: UrlState): string {
  const parts: string[] = [];
  if (s.province) parts.push(`p=${s.province}`);
  if (s.type) parts.push(`t=${s.type}`);
  if (s.q) parts.push(`q=${s.q}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** q 走 matchSchool(searchFace 拼接面,含 aliases);p/t 精确等值;空 q 短路返回全量 */
export function filterRows(rows: SchoolRow[], s: UrlState): SchoolRow[] {
  return rows.filter(
    (r) =>
      (s.province === '' || r.province.code === s.province) &&
      (s.type === '' || r.type === s.type) &&
      (s.q === '' || matchSchool(s.q, r))
  );
}

/** 首屏/回退共用的 DOM 灌入:行 hidden → 组容器整组隐 → 空态卡 → 计数现算 → 搜索框回填
    运行时判定只读 dataset.search(SSR 以 searchFace 写入)—— 等价性由构造保证 */
export function applyInitialState(doc: Document, search: string): void {
  const s = parseUrlState(search);
  const nq = normalize(s.q);
  const rows = [...doc.querySelectorAll<HTMLElement>('[data-school]')];
  let shown = 0;
  for (const r of rows) {
    const hit =
      (nq === '' || (r.dataset.search ?? '').includes(nq)) &&
      (s.province === '' || r.dataset.province === s.province) &&
      (s.type === '' || r.dataset.type === s.type);
    r.hidden = !hit;
    if (hit) shown++;
  }
  for (const g of doc.querySelectorAll<HTMLElement>('details[data-group]')) {
    g.hidden = [...g.querySelectorAll<HTMLElement>('[data-school]')].every((r) => r.hidden);
  }
  const empty = doc.querySelector<HTMLElement>('[data-role="empty"]');
  if (empty) empty.hidden = shown > 0;
  const stat = doc.querySelector<HTMLElement>('[role="status"][data-shown-tpl]');
  if (stat) {
    stat.textContent = (stat.dataset.shownTpl ?? '')
      .replace('{shown}', String(shown))
      .replace('{total}', String(rows.length));
  }
  const input = doc.querySelector<HTMLInputElement>('input[data-role="q"]');
  if (input) input.value = s.q;
}
