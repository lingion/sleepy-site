/** Observe the complete same-origin app, without changing its UI or startup. */
export function attachTimetableLoading(win: Window, frame: HTMLIFrameElement, screen: HTMLElement): () => void {
  const panel = screen.querySelector<HTMLElement>('[data-timetable-loading]')!;
  const status = screen.querySelector<HTMLElement>('[data-loading-status]')!;
  const actions = screen.querySelector<HTMLElement>('[data-loading-actions]')!;
  const retry = screen.querySelector<HTMLButtonElement>('[data-loading-retry]')!;
  const view = screen.ownerDocument.defaultView!;
  let observer: MutationObserver | undefined;
  let slowTimer: number | undefined;
  let firstFrame = 0;
  let secondFrame = 0;
  let disposed = false;
  let ready = false;

  const stopObserving = () => {
    observer?.disconnect();
    observer = undefined;
    win.cancelAnimationFrame(firstFrame);
    win.cancelAnimationFrame(secondFrame);
    firstFrame = secondFrame = 0;
  };
  const setState = (state: 'loading' | 'slow' | 'error') => {
    screen.dataset.timetableState = state;
    status.textContent = status.dataset[state] ?? '';
    actions.hidden = state === 'loading';
  };
  const rendered = (doc: Document) => {
    const root = doc.getElementById('root');
    // A route fallback, a theme publication and the static shell are not ready.
    // Empty schedules, access forms and actual app errors remain usable pages.
    return !!root && (!!root.querySelector('[role="alert"], form') ||
      [...(root.querySelector('main')?.children ?? [])].some(el => el.getAttribute('role') !== 'status'));
  };
  const observeDocument = () => {
    stopObserving();
    let doc: Document | null;
    try { doc = frame.contentDocument; } catch { return; }
    if (!doc?.documentElement) return;
    const currentDocument = doc;
    const inspect = () => {
      if (disposed || ready || firstFrame || secondFrame || !rendered(currentDocument)) return;
      // Allow the committed page a rendering opportunity before revealing it.
      // This is a loader transition, not a visual performance measurement.
      firstFrame = win.requestAnimationFrame(() => {
        firstFrame = 0;
        secondFrame = win.requestAnimationFrame(() => {
          secondFrame = 0;
          if (disposed || frame.contentDocument !== currentDocument || !rendered(currentDocument)) return;
          ready = true;
          const restoreFocus = panel.contains(win.document.activeElement);
          stopObserving();
          win.clearTimeout(slowTimer);
          screen.dataset.timetableState = 'ready';
          panel.hidden = true;
          frame.removeAttribute('inert');
          frame.removeAttribute('aria-hidden');
          frame.setAttribute('aria-busy', 'false');
          // Preserve keyboard position when a retry completed under focus.
          if (restoreFocus) frame.focus();
        });
      });
    };
    observer = new view.MutationObserver(inspect);
    observer.observe(currentDocument.getElementById('root') ?? currentDocument.documentElement, { childList: true, subtree: true });
    inspect();
  };
  const start = () => {
    ready = false;
    panel.hidden = false;
    frame.setAttribute('inert', '');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('aria-busy', 'true');
    setState('loading');
    win.clearTimeout(slowTimer);
    // Stop the decorative motion and explain a long wait without failing it.
    slowTimer = win.setTimeout(() => { if (!disposed && !ready) setState('slow'); }, 5000);
    observeDocument();
  };
  const loaded = () => { if (!disposed && !ready) observeDocument(); };
  const failed = () => {
    if (disposed || ready) return;
    stopObserving();
    win.clearTimeout(slowTimer);
    setState('error');
  };
  const reload = () => {
    stopObserving();
    // Reload the same full app URL. Its own persisted data and preferences stay.
    frame.src = frame.src;
    start();
  };
  frame.addEventListener('load', loaded);
  frame.addEventListener('error', failed);
  retry.addEventListener('click', reload);
  start();
  return () => {
    disposed = true;
    stopObserving();
    win.clearTimeout(slowTimer);
    frame.removeEventListener('load', loaded);
    frame.removeEventListener('error', failed);
    retry.removeEventListener('click', reload);
  };
}
