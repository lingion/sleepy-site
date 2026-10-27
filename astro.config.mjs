// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// https://astro.build/config

// lastmod 数据真源(读 JSON 而非 import:配置文件不产 HMR 依赖)。
// 页面按各自内容管线取驱动日期 —— 爬虫据此排重访优先级,全站同值 = 无信号。
const releaseDate = JSON.parse(readFileSync('./src/data/release.json', 'utf8')).date;
const faqDate = JSON.parse(readFileSync('./src/data/faq.json', 'utf8')).updatedAt;

/** @param {{ url: string }} item */
function withLastmod(item) {
  const path = new URL(item.url).pathname;
  const date = path.includes('/faq/') ? faqDate : releaseDate;
  return { ...item, lastmod: new Date(date).toISOString() };
}

export default defineConfig({
  site: 'https://sleepy.is-my.app',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    cloudflare(),
    // spec §2.6-5:i18n 双语 alternate(v3.7.4 自带 404 排除,零额外代码)
    // lastmod 精确化(SEO 极致批次):release 管线页 = release.date;FAQ 页 = faq.json updatedAt
    sitemap({
      i18n: {
        defaultLocale: 'zh',
        locales: { zh: 'zh-CN', en: 'en' },
      },
      serialize: withLastmod,
    }),
  ],
});
