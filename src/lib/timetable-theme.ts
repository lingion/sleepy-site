/** Full-app palette bridge. The iframe keeps its own navigation, storage and preferences. */
export const THEME_TOKENS = [
  'primary', 'on-primary', 'primary-container', 'on-primary-container',
  'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
  'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
  'background', 'on-background', 'surface', 'on-surface', 'surface-bright', 'surface-variant', 'on-surface-variant',
  'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest',
  'outline', 'outline-variant', 'scrim', 'error', 'on-error', 'error-container', 'on-error-container',
] as const;
export interface TimetableTheme {
  type: 'sleepy:theme';
  version: 1;
  mode: 'light' | 'dark';
  palette: string;
  schemes: { light: Record<string, string>; dark: Record<string, string> };
}
export function readTimetableTheme(value: unknown): TimetableTheme | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as TimetableTheme;
  if (v.type !== 'sleepy:theme' || v.version !== 1 || !['light', 'dark'].includes(v.mode) ||
      typeof v.palette !== 'string' || v.palette.length > 100 || !v.schemes) return null;
  for (const mode of ['light', 'dark'] as const) {
    const scheme = v.schemes[mode];
    if (!scheme || !['primary', 'on-primary', 'background', 'surface'].every(k => k in scheme)) return null;
    if (!Object.entries(scheme).every(([key, color]) => THEME_TOKENS.includes(key as typeof THEME_TOKENS[number]) &&
        typeof color === 'string' && /^#[\da-f]{6}$/i.test(color))) return null;
  }
  return v;
}
export function applyTimetableTheme(win: Window, theme: TimetableTheme, mode = theme.mode): void {
  const root = win.document.documentElement;
  root.dataset.theme = mode;
  root.dataset.palette = theme.palette;
  for (const token of THEME_TOKENS) {
    const color = theme.schemes[mode][token];
    if (color) root.style.setProperty(`--md-sys-color-${token}`, color);
    else root.style.removeProperty(`--md-sys-color-${token}`);
  }
  win.document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute('content', theme.schemes[mode].background));
  try {
    win.localStorage.setItem('sleepy-theme', mode);
    win.localStorage.setItem('sleepy-timetable-theme', JSON.stringify({ ...theme, mode }));
  } catch { /* The live palette still works when storage is unavailable. */ }
}
export function attachTimetableTheme(win: Window, frame: HTMLIFrameElement): () => void {
  const origin = new URL(frame.src, win.location.href).origin;
  const request = () => frame.contentWindow?.postMessage({ type: 'sleepy:theme-request', version: 1 }, origin);
  const receive = (event: MessageEvent) => {
    if (event.source !== frame.contentWindow || event.origin !== origin) return;
    const theme = readTimetableTheme(event.data);
    if (theme) applyTimetableTheme(win, theme);
  };
  frame.addEventListener('load', request);
  win.addEventListener('message', receive);
  request();
  return () => { frame.removeEventListener('load', request); win.removeEventListener('message', receive); };
}
