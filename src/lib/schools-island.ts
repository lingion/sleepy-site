// v5 /schools/ 岛纯函数 — plan Task 4:URL 态 ⇄ 行集 ⇄ DOM 灌入,三处共用 searchFace 唯一语义(终审 I7)
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

/** 空值不写参;顺序定死 p→t→q;值编码以保留查询中的 &/# 字符 */
export function writeUrlState(s: UrlState): string {
  const parts: string[] = [];
  if (s.province) parts.push(`p=${encodeURIComponent(s.province)}`);
  if (s.type) parts.push(`t=${encodeURIComponent(s.type)}`);
  if (s.q) parts.push(`q=${encodeURIComponent(s.q)}`);
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
export const schoolPageSize = 24;

export function applyInitialState(doc: Document, search: string, limit = schoolPageSize): { matched: number; shown: number } {
  const s = parseUrlState(search);
  const nq = normalize(s.q);
  const rows = [...doc.querySelectorAll<HTMLElement>('[data-school]')];
  let shown = 0;
  let matched = 0;
  for (const r of rows) {
    const hit =
      (nq === '' || (r.dataset.search ?? '').includes(nq)) &&
      (s.province === '' || r.dataset.province === s.province) &&
      (s.type === '' || r.dataset.type === s.type);
    if (hit) matched++;
    const visible = hit && shown < limit;
    r.hidden = !visible;
    if (visible) shown++;
  }
  for (const g of doc.querySelectorAll<HTMLElement>('details[data-group]')) {
    g.hidden = [...g.querySelectorAll<HTMLElement>('[data-school]')].every((r) => r.hidden);
  }
  const empty = doc.querySelector<HTMLElement>('[data-role="empty"]');
  if (empty) empty.hidden = matched > 0;
  const stat = doc.querySelector<HTMLElement>('[role="status"][data-shown-tpl]');
  if (stat) {
    stat.textContent = (stat.dataset.shownTpl ?? '')
      .replace('{shown}', String(shown))
      .replace('{matched}', String(matched))
      .replace('{total}', String(rows.length));
  }
  const input = doc.querySelector<HTMLInputElement>('input[data-role="q"]');
  if (input) input.value = s.q;
  for (const [role, value] of [['province', s.province], ['type', s.type]]) {
    const select = doc.querySelector<HTMLSelectElement>(`select[data-role="${role}"]`);
    if (select) select.value = value;
  }
  const more = doc.querySelector<HTMLButtonElement>('[data-role="more"]');
  if (more) more.hidden = shown >= matched;
  const progress = doc.querySelector<HTMLElement>('[data-progress-tpl]');
  if (progress) {
    progress.textContent = (progress.dataset.progressTpl ?? '').replace('{shown}', String(shown)).replace('{matched}', String(matched));
    progress.hidden = matched === 0;
  }
  const reset = doc.querySelector<HTMLButtonElement>('[data-role="reset"]');
  if (reset) reset.hidden = !(s.q || s.province || s.type);
  return { matched, shown };
}
