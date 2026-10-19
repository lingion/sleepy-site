// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sleepy.lingion.eu.cc',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [cloudflare(), sitemap()],
});
