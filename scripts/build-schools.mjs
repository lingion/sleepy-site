// Offline release snapshot transform. Never filters out pending entries.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildGeoIndex, classifyProvince, decodeProvinceByCatalogId } from '../src/lib/geo.ts';
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const geo = read('../src/data/geo-prefix.json');
const manual = read('../src/data/province-manual.json');
const schools = read('../fixtures/schools.json');
const snapshot = read('../src/data/schools.snapshot.json');
const idx = buildGeoIndex(geo);
const OTHER = { zh: '其它', en: 'Other' };
const UNKNOWN = { zh: '省份未知', en: 'Province unknown' };
const statuses = ['supported', 'grad_supported', 'unverified', 'grad_unverified', 'pending', 'grad_pending'];
const identities = new Set();
const statusCounts = Object.fromEntries(statuses.map(s => [s, 0]));
const grouped = schools.map(s => {
  if (!s.catalogId || identities.has(s.catalogId)) throw new Error(`Missing/duplicate catalogId: ${s.name}`);
  identities.add(s.catalogId);
  const status = s.status ?? 'supported';
  if (!statuses.includes(status)) throw new Error(`Unknown status: ${status}`);
  statusCounts[status]++;
  const code = s.sortKey === '*' ? 'OTHER' : manual[s.name]
    ?? snapshot.provinceBySchool?.[s.name]
    ?? classifyProvince(s.name, idx)?.code
    ?? decodeProvinceByCatalogId(s.catalogId, geo.provinces)
    ?? 'UNKNOWN';
  const meta = code === 'OTHER' ? OTHER : code === 'UNKNOWN' ? UNKNOWN : geo.provinces[code];
  if (!meta) throw new Error(`Unknown province code: ${code}`);
  // Whitelist public fields: keep identity/status, never ship academic endpoints.
  return { name: s.name, type: s.type, sortKey: s.sortKey, sortKeyFull: s.sortKeyFull,
    aliases: s.aliases ?? [], catalogId: s.catalogId, status, province: { code, ...meta } };
});
const typeCount = new Set(grouped.map(s => s.type).filter(Boolean)).size;
const configuredCount = statusCounts.supported + statusCounts.grad_supported;
const unverifiedCount = statusCounts.unverified + statusCounts.grad_unverified;
const pendingCount = statusCounts.pending + statusCounts.grad_pending;
writeFileSync(new URL('../src/data/schools.grouped.json', import.meta.url), JSON.stringify(grouped, null, 2) + '\n');
writeFileSync(new URL('../src/data/schools.snapshot.json', import.meta.url), JSON.stringify({ ...snapshot,
  rowCount: grouped.length, typeCount, configuredCount, unverifiedCount, pendingCount, statusCounts }, null, 2) + '\n');
console.log(`[build-schools] ${grouped.length} records, ${typeCount} nonempty protocols; configured ${configuredCount}, unverified ${unverifiedCount}, pending ${pendingCount}; unknown province ${grouped.filter(s => s.province.code === 'UNKNOWN').length}`);
