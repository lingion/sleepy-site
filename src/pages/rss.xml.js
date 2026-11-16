// v5 分发基建 RSS(spec §2.6-6):版本发布源,single-route /rss.xml
// items = release.json 当前版一条(v0.9.0 不回填——feed 是「新版本」信号,不是 changelog 档案)
// 单 zh-CN feed 裁决(plan Task 8):发布说明双语并置一条正文,不做双 feed
import rss from '@astrojs/rss';
import { site } from '../i18n/ui';
import release from '../data/release.json';
import { rowCount } from '../lib/schools-view';
import { releaseDateLabel } from '../lib/release-date.mjs';

export async function GET(context) {
  const universal = release.assets.find((a) => a.name.includes('universal'));
  return rss({
    title: 'Sleepy 版本更新',
    description: 'Sleepy 开源课表 Android 客户端的版本发布源。',
    site: context.site,
    stylesheet: false,
    customData: '<language>zh-CN</language>',
    items: [
      {
        title: `Sleepy ${release.tag}`,
        pubDate: new Date(release.date),
        link: `${site}/releases/`,
        description: [
          `Sleepy ${release.tag} · ${releaseDateLabel(release.date, 'zh')} 发布。`,
          `通用 APK:${universal?.name ?? 'app-universal-release.apk'}。`,
          `校验和与全部架构见 sha256sums。${rowCount} 条学校目录记录，按状态核对适配；课表默认保存在本机，备份与分享由你主动发起。`,
        ].join(' '),
      },
    ],
  });
}
