export type DownloadSource = 'mirror' | 'github';
export const mirrorHost = 'gh.qdp.qzz.io';

/** Only release files from this project are eligible for the configured mirror. */
export function downloadUrl(official: string, source: DownloadSource): string {
  const url = new URL(official);
  if (source === 'mirror' && url.protocol === 'https:' && url.hostname === 'github.com'
    && !url.username && !url.password && url.pathname.startsWith('/lingion/sleepy/releases/download/')) {
    url.hostname = mirrorHost;
  }
  return url.href;
}

export function applyDownloadSource(panel: HTMLElement, source: DownloadSource): void {
  for (const link of panel.querySelectorAll<HTMLAnchorElement>('a[data-download-official]')) {
    link.href = downloadUrl(link.dataset.downloadOfficial!, source);
  }
  for (const radio of panel.querySelectorAll<HTMLInputElement>('input[name="download-source"]')) radio.checked = radio.value === source;
  const status = panel.querySelector<HTMLElement>('[data-download-status]');
  if (status) status.textContent = source === 'mirror' ? status.dataset.mirror! : status.dataset.github!;
  panel.dataset.source = source;
}
