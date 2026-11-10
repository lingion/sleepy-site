import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { schools, rowCount, typeCount, configuredCount, unverifiedCount, statusCounts } from '../src/lib/schools-view';
const fixture = JSON.parse(readFileSync(new URL('../fixtures/schools.json', import.meta.url), 'utf8'));
const inUseFixture = fixture.filter(s => s.status !== 'pending' && s.status !== 'grad_pending');

describe('released Android in-use school directory', () => {
  it('filters out pending entries and retains all in-use identities without publishing academic URLs', () => {
    expect(rowCount).toBe(inUseFixture.length);
    expect(new Set(schools.map(s => s.catalogId)).size).toBe(inUseFixture.length);
    const byId = new Map(schools.map(s => [s.catalogId, s]));
    for (const source of inUseFixture) {
      const out = byId.get(source.catalogId);
      expect(out?.name).toBe(source.name);
      expect(out?.status).toBe(source.status ?? 'supported');
      expect(out?.type).toBe(source.type);
      expect(out).not.toHaveProperty('url');
      expect(out?.province.code).toBeTruthy();
    }
  });
  it('separates configuration from unverified entries and excludes pending placeholders', () => {
    const expected = Object.fromEntries(['supported', 'grad_supported', 'unverified', 'grad_unverified'].map(status => [status, inUseFixture.filter(s => (s.status ?? 'supported') === status).length]));
    expect(statusCounts).toEqual(expected);
    expect(configuredCount).toBe(expected.supported + expected.grad_supported);
    expect(unverifiedCount).toBe(expected.unverified + expected.grad_unverified);
    expect(configuredCount + unverifiedCount).toBe(rowCount);

  });
  it('counts only nonempty parser types from the in-use release source', () => {
    expect(typeCount).toBe(new Set(inUseFixture.map(s => s.type).filter(Boolean)).size);
    expect(typeCount).toBeGreaterThan(0);
  });
  it('pins source provenance rather than a moving main branch', () => {
    const p = JSON.parse(readFileSync(new URL('../src/data/schools.snapshot.json', import.meta.url), 'utf8'));
    const release = JSON.parse(readFileSync(new URL('../src/data/release.json', import.meta.url), 'utf8'));
    expect(p.ref).toBe(release.tag);
    expect(p.sourceSha).toBe(release.sourceSha);
    expect(p.sourcePath).toBe('app/src/main/assets/schools.json');
    expect(p.rowCount).toBe(rowCount);
    expect(p.statusCounts).toEqual(statusCounts);
  });
});
