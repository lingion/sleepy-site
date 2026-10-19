declare global {
  interface Window {
    /** Base.astro 注入的主题持久化 toggle;AppBar/预览岛在 guard 后调用 */
    siteToggleTheme?: () => 'light' | 'dark';
  }
}

export {};
