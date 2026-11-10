import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { applyDownloadSource, downloadUrl } from './download-source';
import release from '../data/release.json';

describe('Download source selection', () => {
  it('routes every released APK and checksum through the chosen host without changing the file', () => {
    for (const official of [...release.assets.map(asset => asset.url), release.sha256sumsUrl]) {
      expect(downloadUrl(official, 'github')).toBe(official);
      const mirrored = new URL(downloadUrl(official, 'mirror'));
      expect(mirrored.host).toBe('gh.qdp.qzz.io');
      expect(mirrored.pathname).toBe(new URL(official).pathname);
      expect(mirrored.search).toBe(new URL(official).search);
    }
  });
  it('does not rewrite repository pages, unrelated hosts, HTTP URLs or credentials', () => {
    for (const original of ['https://github.com/lingion/sleepy/releases', 'https://github.com/other/project/releases/download/v1/app.apk', 'https://github.com.evil.invalid/lingion/sleepy/releases/download/v1/app.apk', 'http://github.com/lingion/sleepy/releases/download/v1/app.apk', 'https://user:secret@github.com/lingion/sleepy/releases/download/v1/app.apk']) {
      expect(downloadUrl(original, 'mirror')).toBe(original);
    }
  });
  it('switches all file links, selected radio and status together, and can switch back', () => {
    const official = [...release.assets.map(asset => asset.url), release.sha256sumsUrl];
    const doc = new JSDOM(`<section><input type="radio" name="download-source" value="mirror"><input type="radio" name="download-source" value="github"><p role="status" data-download-status data-mirror="Mirror" data-github="GitHub"></p>${official.map(url => `<a data-download-official="${url}" href="${url}">File</a>`).join('')}<a href="${release.url}">Release notes</a></section>`).window.document;
    const panel = doc.querySelector('section')!;
    for (const source of ['mirror', 'github'] as const) {
      applyDownloadSource(panel, source);
      expect([...panel.querySelectorAll('a[data-download-official]')].map(link => link.getAttribute('href'))).toEqual(official.map(url => downloadUrl(url, source)));
      expect(panel.querySelector<HTMLInputElement>('input:checked')?.value).toBe(source);
      expect(panel.querySelector('[role="status"]')?.textContent).toBe(source === 'mirror' ? 'Mirror' : 'GitHub');
      expect(panel.querySelector('a:last-child')?.getAttribute('href')).toBe(release.url);
    }
  });
});
