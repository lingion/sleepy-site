// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sleepy.lingion.eu.cc',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    cloudflare(),
    // spec §2.6-5:i18n 双语 alternate(v3.7.4 自带 404 排除,零额外代码)
    sitemap({
      i18n: {
        defaultLocale: 'zh',
        locales: { zh: 'zh-CN', en: 'en' },
      },
    }),
  ],
});
