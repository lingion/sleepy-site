import schoolsRaw from '../data/schools.grouped.json';
import snapshot from '../data/schools.snapshot.json';
import type { ProvinceMeta } from './geo';

export type SchoolStatus = 'supported' | 'grad_supported' | 'unverified' | 'grad_unverified' | 'pending' | 'grad_pending';
export interface SchoolRow {
  name: string;
  type: string;
  sortKeyFull: string;
  aliases: string[];
  catalogId: string;
  status: SchoolStatus;
  province: ProvinceMeta & { code: string };
}
export const schools = schoolsRaw as unknown as SchoolRow[];
export const catalogUpdatedAt = snapshot.releasedAt;
export const catalogRef = snapshot.ref;
export const catalogSourceSha = snapshot.sourceSha;
export const rowCount = schools.length;
export const provinceCount = new Set(schools.map(s => s.province.code)).size;
export const typeCount = new Set(schools.map(s => s.type).filter(Boolean)).size;
export const statusCounts = Object.fromEntries(
  (['supported', 'grad_supported', 'unverified', 'grad_unverified', 'pending', 'grad_pending'] as const)
    .map(status => [status, schools.filter(s => s.status === status).length]),
) as Record<SchoolStatus, number>;
export const configuredCount = statusCounts.supported + statusCounts.grad_supported;
export const unverifiedCount = statusCounts.unverified + statusCounts.grad_unverified;
export const pendingCount = statusCounts.pending + statusCounts.grad_pending;

export function provincesOrdered(): (ProvinceMeta & { code: string })[] {
  const map = new Map(schools.map(s => [s.province.code, s.province]));
  const rank = (code: string) => code === 'OTHER' ? 1 : code === 'UNKNOWN' ? 2 : 0;
  return [...map.values()].sort((a, b) => rank(a.code) - rank(b.code) || a.code.localeCompare(b.code));
}
export function typesOrdered(): string[] {
  return [...new Set(schools.map(s => s.type).filter(Boolean))].sort();
}
