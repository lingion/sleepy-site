import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME_TOKENS, attachTimetableTheme, readTimetableTheme, applyTimetableTheme, type TimetableTheme } from '../src/lib/timetable-theme';
import webThemes from './fixtures/web-theme-snapshots-2e716653.json';

const colors = { primary: '#0061A4', 'on-primary': '#FFFFFF', background: '#FDFCFF', surface: '#FDFCFF' };
const snapshot = { type: 'sleepy:theme', version: 1, mode: 'light', palette: 'ocean', schemes: { light: colors, dark: { ...colors, primary: '#9ECAFF', background: '#1A1C1E' } } };
type Mode = TimetableTheme['mode'];
type SiteWindow = Window & typeof globalThis & { siteToggleTheme: () => Mode };
const modes: Mode[] = ['light', 'dark'];
const snapshots = webThemes.snapshots as TimetableTheme[];
const [ocean, spring] = snapshots;
const windows: JSDOM[] = [];

// Execute Base.astro's actual scripts, including its persisted-palette toggle.
// The inline script receives the same define:vars binding that Astro serializes.
const base = readFileSync(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8');
const scripts = [...base.matchAll(/<script\b(?![^>]*\/>)([^>]*)>([\s\S]*?)<\/script>/g)];
const firstPaint = scripts.find(([, attributes]) => attributes.includes('define:vars'))?.[2];
const siteScript = scripts.find(([, attributes]) => !attributes.trim())?.[2];
if (!firstPaint || !siteScript) throw new Error('Base.astro theme scripts were not found');
const siteJavaScript = transpileModule(siteScript, {
  compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
}).outputText;

function setup() {
  const dom = new JSDOM('<meta name="theme-color" media="(prefers-color-scheme: light)"><meta name="theme-color" media="(prefers-color-scheme: dark)"><iframe data-timetable-demo src="/preview/"></iframe>', {
    url: 'https://sleepy.is-my.app/', runScripts: 'outside-only',
  });
  windows.push(dom);
  const win = dom.window as unknown as SiteWindow;
  const frame = win.document.querySelector('iframe')!;
  Object.defineProperty(win, 'matchMedia', { value: () => ({ matches: false }) });
  return { win, frame };
}

function receive(win: SiteWindow, frame: HTMLIFrameElement, data: unknown) {
  win.dispatchEvent(new win.MessageEvent('message', { data, origin: win.location.origin, source: frame.contentWindow }));
}

function restoreFirstPaint(win: SiteWindow) {
  new win.Function('themeTokens', firstPaint!)(THEME_TOKENS);
}

function installSiteToggle(win: SiteWindow) {
  Object.defineProperty(win, 'IntersectionObserver', {
    value: class { observe() {} unobserve() {} disconnect() {} },
  });
  new win.Function('require', 'exports', siteJavaScript)((specifier: string) => {
    if (specifier !== '../lib/timetable-theme') throw new Error(`Unexpected Base.astro import: ${specifier}`);
    return { applyTimetableTheme, readTimetableTheme };
  }, {});
}

function expectPalette(win: SiteWindow, theme: TimetableTheme, mode: Mode) {
  const root = win.document.documentElement;
  expect(root.dataset.theme).toBe(mode);
  expect(root.dataset.palette).toBe(theme.palette);
  expect(theme.schemes[mode]['surface-bright']).toBe(mode === 'light' ? '#FEF7FF' : '#3B383E');
  for (const [token, color] of Object.entries(theme.schemes[mode])) {
    expect(root.style.getPropertyValue(`--md-sys-color-${token}`), `${theme.palette}/${mode}/${token}`).toBe(color);
  }
}

function expectSavedTheme(win: SiteWindow, theme: TimetableTheme, mode: Mode) {
  expect(win.localStorage.getItem('sleepy-theme')).toBe(mode);
  const stored = JSON.parse(win.localStorage.getItem('sleepy-timetable-theme')!);
  expect(stored).toEqual({ ...theme, mode });
  expect(readTimetableTheme(stored)).toEqual({ ...theme, mode });
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const dom of windows.splice(0)) dom.window.close();
});

describe('embedded app theme bridge', () => {
  it('accepts only supported modes and hex tokens', () => {
    expect(readTimetableTheme(snapshot)?.palette).toBe('ocean');
    expect(readTimetableTheme({ ...snapshot, mode: 'automatic' })).toBeNull();
    expect(readTimetableTheme({ ...snapshot, schemes: { light: { ...colors, primary: 'url(evil)' }, dark: colors } })).toBeNull();
  });
  it('requests the app palette on load and ignores unrelated sources/origins', () => {
    const { win, frame } = setup();
    const send = vi.spyOn(frame.contentWindow!, 'postMessage');
    const dispose = attachTimetableTheme(win, frame);
    frame.dispatchEvent(new win.Event('load'));
    expect(send).toHaveBeenCalledWith({ type: 'sleepy:theme-request', version: 1 }, win.location.origin);
    win.dispatchEvent(new win.MessageEvent('message', { data: snapshot, origin: 'https://bad.example', source: frame.contentWindow }));
    win.dispatchEvent(new win.MessageEvent('message', { data: snapshot, origin: win.location.origin, source: win }));
    expect(win.document.documentElement.style.getPropertyValue('--md-sys-color-primary')).toBe('');
    win.dispatchEvent(new win.MessageEvent('message', { data: snapshot, origin: win.location.origin, source: frame.contentWindow }));
    expect(win.document.documentElement.style.getPropertyValue('--md-sys-color-primary')).toBe('#0061A4');
    expect(win.localStorage.getItem('sleepy-theme')).toBe('light');
    expect(frame.getAttribute('src')).toBe('/preview/');
    dispose();
  });
  it('keeps the same palette when the site switches modes and persists it', () => {
    const { win } = setup();
    applyTimetableTheme(win, readTimetableTheme(snapshot)!, 'dark');
    expect(win.document.documentElement.dataset.theme).toBe('dark');
    expect(win.document.documentElement.style.getPropertyValue('--md-sys-color-primary')).toBe('#9ECAFF');
    expect(win.document.querySelector('meta')?.content).toBe('#1A1C1E');
    expect(JSON.parse(win.localStorage.getItem('sleepy-timetable-theme')!).mode).toBe('dark');
  });
});

describe('Web PR23 snapshots containing surface-bright', () => {
  for (const theme of snapshots) {
    it.each(modes)(`${theme.palette}: applies a real %s message to the DOM and storage`, mode => {
      const { win, frame } = setup();
      attachTimetableTheme(win, frame);
      receive(win, frame, { ...theme, mode });

      expectPalette(win, theme, mode);
      for (const meta of win.document.querySelectorAll('meta[name="theme-color"]')) {
        expect(meta.getAttribute('content')).toBe(theme.schemes[mode].background);
      }
      expectSavedTheme(win, theme, mode);
    });
  }

  it.each(modes)('preserves a received %s palette through site toggles, reload and a palette change', mode => {
    const { win, frame } = setup();
    attachTimetableTheme(win, frame);
    receive(win, frame, { ...ocean, mode });
    expectPalette(win, ocean, mode);
    installSiteToggle(win);

    const next = mode === 'light' ? 'dark' : 'light';
    expect(win.siteToggleTheme()).toBe(next);
    expectPalette(win, ocean, next);
    expectSavedTheme(win, ocean, next);
    for (const meta of win.document.querySelectorAll('meta[name="theme-color"]')) {
      expect(meta.getAttribute('content')).toBe(ocean.schemes[next].background);
    }

    const reloaded = setup();
    for (const key of ['sleepy-theme', 'sleepy-timetable-theme']) {
      reloaded.win.localStorage.setItem(key, win.localStorage.getItem(key)!);
    }
    restoreFirstPaint(reloaded.win);
    expect(reloaded.win.document.documentElement.classList.contains('js')).toBe(true);
    expectPalette(reloaded.win, ocean, next);
    expectSavedTheme(reloaded.win, ocean, next);

    installSiteToggle(reloaded.win);
    expect(reloaded.win.siteToggleTheme()).toBe(mode);
    expectPalette(reloaded.win, ocean, mode);
    expectSavedTheme(reloaded.win, ocean, mode);

    attachTimetableTheme(reloaded.win, reloaded.frame);
    receive(reloaded.win, reloaded.frame, { ...spring, mode });
    expectPalette(reloaded.win, spring, mode);
    expectSavedTheme(reloaded.win, spring, mode);
    expect(reloaded.win.siteToggleTheme()).toBe(next);
    expectPalette(reloaded.win, spring, next);
    expectSavedTheme(reloaded.win, spring, next);
  });

  it.each(modes)('restores the complete saved palette before first paint in site mode %s', mode => {
    const { win } = setup();
    // The site's mode takes precedence over the mode in the last Web snapshot.
    win.localStorage.setItem('sleepy-theme', mode);
    win.localStorage.setItem('sleepy-timetable-theme', JSON.stringify({ ...ocean, mode: mode === 'light' ? 'dark' : 'light' }));
    restoreFirstPaint(win);
    expectPalette(win, ocean, mode);
    expect(win.document.documentElement.classList.contains('js')).toBe(true);
  });

  for (const mode of modes) {
    it.each([
      ['unknown token', 'surface-ultra-bright', '#123456'],
      ['invalid existing color', 'primary', 'url(https://bad.example/color)'],
      ['invalid surface-bright color', 'surface-bright', '#GGGGGG'],
    ])(`rejects %s in the ${mode} scheme without changing the live or restored palette`, (_label, token, color) => {
      const invalid = structuredClone(ocean);
      invalid.schemes[mode][token] = color;
      expect(readTimetableTheme(invalid)).toBeNull();

      const { win, frame } = setup();
      attachTimetableTheme(win, frame);
      // A legacy message is a valid control even before the whitelist fix.
      receive(win, frame, snapshot);
      expect(win.document.documentElement.dataset.palette).toBe('ocean');
      const before = win.document.documentElement.outerHTML;
      const stored = win.localStorage.getItem('sleepy-timetable-theme');
      receive(win, frame, invalid);
      expect(win.document.documentElement.outerHTML).toBe(before);
      expect(win.localStorage.getItem('sleepy-theme')).toBe('light');
      expect(win.localStorage.getItem('sleepy-timetable-theme')).toBe(stored);

      const reloaded = setup();
      reloaded.win.localStorage.setItem('sleepy-theme', mode);
      reloaded.win.localStorage.setItem('sleepy-timetable-theme', JSON.stringify(invalid));
      restoreFirstPaint(reloaded.win);
      const root = reloaded.win.document.documentElement;
      expect(root.dataset.theme).toBe(mode);
      expect(root.dataset.palette).toBeUndefined();
      expect(root.style.length).toBe(0);
    });
  }
});
