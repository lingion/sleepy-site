import { JSDOM } from 'jsdom';
import { describe, expect, it, vi } from 'vitest';
import { attachTimetableTheme, readTimetableTheme, applyTimetableTheme } from '../src/lib/timetable-theme';

const colors = { primary: '#0061A4', 'on-primary': '#FFFFFF', background: '#FDFCFF', surface: '#FDFCFF' };
const snapshot = { type: 'sleepy:theme', version: 1, mode: 'light', palette: 'ocean', schemes: { light: colors, dark: { ...colors, primary: '#9ECAFF', background: '#1A1C1E' } } };
function setup() {
  const dom = new JSDOM('<meta name="theme-color"><iframe data-timetable-demo src="/preview/"></iframe>', { url: 'https://sleepy.is-my.app/' });
  const win = dom.window as unknown as Window & typeof globalThis;
  const frame = win.document.querySelector('iframe')!;
  return { win, frame };
}
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
