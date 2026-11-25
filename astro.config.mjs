// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// https://astro.build/config

// lastmod 数据真源(读 JSON 而非 import:配置文件不产 HMR 依赖)。
// 页面按各自内容管线取驱动日期 —— 爬虫据此排重访优先级,全站同值 = 无信号。
const releaseDate = JSON.parse(readFileSync('./src/data/release.json', 'utf8')).date;
const faq = JSON.parse(readFileSync('./src/data/faq.json', 'utf8'));
const faqDate = [faq.updatedAt, faq.distributionUpdatedAt].filter(Boolean).sort().at(-1);
const contentReviews = JSON.parse(readFileSync('./src/data/content-reviews.json', 'utf8'));
const releaseDrivenPaths = new Set(['/', '/download/', '/releases/', '/schools/']);

/** @param {{ url: string }} item */
function withLastmod(item) {
  const path = new URL(item.url).pathname.replace(/^\/en(?=\/)/, '');
  const pipelineDate = path === '/faq/' ? faqDate
    : releaseDrivenPaths.has(path) ? releaseDate : undefined;
  const date = [contentReviews[path], pipelineDate].filter(Boolean).sort().at(-1);
  return date ? { ...item, lastmod: new Date(date).toISOString() } : item;
}

export default defineConfig({
  site: 'https://sleepy.is-my.app',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    cloudflare(),
    // spec §2.6-5:i18n 双语 alternate(v3.7.4 自带 404 排除,零额外代码)
    // Use release dates only for release-driven pages; editorial reviews have their own dates.
    sitemap({
      i18n: {
        defaultLocale: 'zh',
        locales: { zh: 'zh-CN', en: 'en' },
      },
      serialize: withLastmod,
    }),
  ],
});
