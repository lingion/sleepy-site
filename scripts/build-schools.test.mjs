import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { schools, rowCount, typeCount, configuredCount, unverifiedCount, pendingCount, statusCounts } from '../src/lib/schools-view';
const fixture = JSON.parse(readFileSync(new URL('../fixtures/schools.json', import.meta.url), 'utf8'));

describe('released Android v1.0.63 school directory', () => {
  it('retains all released identities and statuses without publishing academic URLs', () => {
    expect(rowCount).toBe(4140);
    expect(new Set(schools.map(s => s.catalogId)).size).toBe(fixture.length);
    const byId = new Map(schools.map(s => [s.catalogId, s]));
    for (const source of fixture) {
      const out = byId.get(source.catalogId);
      expect(out?.name).toBe(source.name);
      expect(out?.status).toBe(source.status ?? 'supported');
      expect(out?.type).toBe(source.type);
      expect(out).not.toHaveProperty('url');
      expect(out?.province.code).toBeTruthy();
    }
  });
  it('separates configuration from unverified and unavailable entries', () => {
    expect([configuredCount, unverifiedCount, pendingCount]).toEqual([352, 2528, 1260]);
    expect(statusCounts).toEqual({ supported: 350, grad_supported: 2, unverified: 2480, grad_unverified: 48, pending: 1007, grad_pending: 253 });
    expect(configuredCount + unverifiedCount + pendingCount).toBe(rowCount);
    expect(fixture.filter(s => s.status === undefined)).toHaveLength(348);
  });
  it('counts only nonempty parser types from the complete release source', () => {
    expect(typeCount).toBe(new Set(fixture.map(s => s.type).filter(Boolean)).size);
    expect(typeCount).toBe(48);
  });
  it('pins source provenance rather than a moving main branch', () => {
    const p = JSON.parse(readFileSync(new URL('../src/data/schools.snapshot.json', import.meta.url), 'utf8'));
    expect(p.ref).toBe('v1.0.63');
    expect(p.sourceSha).toBe('b16aa84d11c250acdf644cd8b7812ab27d03dc6a');
    expect(p.sourcePath).toBe('app/src/main/assets/schools.json');
    expect(p.rowCount).toBe(rowCount);
    expect(p.statusCounts).toEqual(statusCounts);
  });
});
