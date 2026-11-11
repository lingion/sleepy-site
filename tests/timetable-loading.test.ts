import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachTimetableLoading } from '../src/lib/timetable-loading';
import { zh } from '../src/i18n/zh';
import { en } from '../src/i18n/en';

const documents: JSDOM[] = [];
function setup() {
  const dom = new JSDOM(`<div data-phone-screen data-timetable-state="loading">
    <iframe src="about:blank"></iframe><div data-timetable-loading>
    <p role="status" data-loading-status data-loading="Loading…" data-slow="Still loading" data-error="Could not load">Loading…</p>
    <div data-loading-actions hidden><button data-loading-retry>Retry</button></div></div></div>`, {
    url: 'https://sleepy.is-my.app/', pretendToBeVisual: true,
  });
  documents.push(dom);
  const win = dom.window as unknown as Window & typeof globalThis;
  const screen = win.document.querySelector<HTMLElement>('[data-phone-screen]')!;
  const frame = screen.querySelector('iframe')!;
  const app = frame.contentDocument!;
  app.body.innerHTML = '<div id="root"></div>';
  const dispose = attachTimetableLoading(win, frame, screen);
  return { win, screen, frame, app, dispose, render: (html: string) => {
    const current = frame.contentDocument!;
    if (!current.getElementById('root')) current.body.innerHTML = '<div id="root"></div>';
    current.getElementById('root')!.innerHTML = html;
  } };
}
async function flush() {
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(50);
}
afterEach(() => {
  for (const dom of documents.splice(0)) dom.window.close();
  vi.useRealTimers();
});

describe('embedded timetable loading lifecycle', () => {
  it('ships a localized status and recovery controls inside the reserved phone frame', () => {
    for (const [route, copy] of [['', zh], ['en/', en]] as const) {
      const dom = new JSDOM(readFileSync(new URL(`../dist/client/${route}index.html`, import.meta.url), 'utf8'));
      documents.push(dom);
      const screen = dom.window.document.querySelector('[data-phone-screen]')!;
      const panel = screen.querySelector('[data-timetable-loading]')!;
      const status = panel.querySelector('[role="status"]')!;
      expect(status.textContent).toBe(copy.hero.demoLoading);
      expect(status.getAttribute('aria-live')).toBe('polite');
      expect(status.getAttribute('data-slow')).toBe(copy.hero.demoSlow);
      expect(panel.querySelector('button')!.textContent).toBe(copy.hero.demoRetry);
      expect(panel.querySelector('a')!.getAttribute('href')).toBe(screen.querySelector('iframe')!.getAttribute('src'));
      expect(screen.querySelector('iframe')!.getAttribute('aria-busy')).toBe('true');
      expect(screen.querySelector('iframe')!.hasAttribute('inert')).toBe(true);
    }
  });

  it('keeps loading after iframe load and a theme message until the app has rendered', async () => {
    vi.useFakeTimers();
    const { win, screen, frame, render, dispose } = setup();
    frame.dispatchEvent(new win.Event('load'));
    win.dispatchEvent(new win.MessageEvent('message', { data: { type: 'sleepy:theme' } }));
    await flush();
    expect(screen.dataset.timetableState).toBe('loading');
    expect(frame.hasAttribute('inert')).toBe(true);
    render('<p role="status">Loading route…</p>');
    await flush();
    expect(screen.dataset.timetableState).toBe('loading');
    render('<main><div>Timetable with its controls</div></main>');
    await flush();
    expect(screen.dataset.timetableState).toBe('ready');
    expect(screen.querySelector<HTMLElement>('[data-timetable-loading]')!.hidden).toBe(true);
    expect(frame.hasAttribute('inert')).toBe(false);
    expect(frame.getAttribute('aria-busy')).toBe('false');
    expect(frame.hasAttribute('aria-hidden')).toBe(false);
    dispose();
  });

  it('reveals a real empty timetable and the app’s own error or access gate', async () => {
    vi.useFakeTimers();
    for (const html of [
      '<main><div><button>Create a timetable</button></div></main>',
      '<main><div role="alert">Schedule could not load<button>Retry</button></div></main>',
      '<main><form><input aria-label="Access key"><button>Enter</button></form></main>',
      '<div role="alert">Route failed<button>Retry</button></div>',
    ]) {
      const { screen, render, dispose } = setup();
      render(html);
      await flush();
      expect(screen.dataset.timetableState).toBe('ready');
      dispose();
    }
  });

  it('offers retry for a slow load and can still become ready later', async () => {
    vi.useFakeTimers();
    const { screen, render, dispose } = setup();
    await vi.advanceTimersByTimeAsync(5000);
    expect(screen.dataset.timetableState).toBe('slow');
    expect(screen.querySelector('[role="status"]')!.textContent).toBe('Still loading');
    expect(screen.querySelector<HTMLElement>('[data-loading-actions]')!.hidden).toBe(false);
    render('<main><button>Open settings</button></main>');
    await flush();
    expect(screen.dataset.timetableState).toBe('ready');
    dispose();
    await vi.advanceTimersByTimeAsync(10000);
    expect(screen.dataset.timetableState).toBe('ready');
  });

  it('restarts loading on retry, then releases the frame when content arrives', async () => {
    vi.useFakeTimers();
    const { win, screen, frame, render, dispose } = setup();
    frame.dispatchEvent(new win.Event('error'));
    expect(screen.dataset.timetableState).toBe('error');
    expect(screen.querySelector('[role="status"]')!.textContent).toBe('Could not load');
    screen.querySelector<HTMLButtonElement>('[data-loading-retry]')!.click();
    expect(screen.dataset.timetableState).toBe('loading');
    expect(screen.querySelector<HTMLElement>('[data-loading-actions]')!.hidden).toBe(true);
    render('<main><button>Next week</button></main>');
    frame.dispatchEvent(new win.Event('load'));
    await flush();
    expect(screen.dataset.timetableState).toBe('ready');
    dispose();
  });

  it('cancels a pending reveal when the document changes or the controller is disposed', async () => {
    vi.useFakeTimers();
    const { screen, render, dispose } = setup();
    render('<main><button>Next week</button></main>');
    await Promise.resolve();
    dispose();
    await flush();
    expect(screen.dataset.timetableState).toBe('loading');
    await vi.advanceTimersByTimeAsync(10000);
    expect(screen.dataset.timetableState).toBe('loading');
  });
});
