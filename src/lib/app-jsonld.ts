// SoftwareApplication 双语对等生成(SEO 极致批次 S3b)。
// 单一来源两主页共用——字段漂移=双语实体不对称,爬虫侧表现为两版本描述同一产品却值不同。
import { site, repoUrl } from '../i18n/ui';
import release from '../data/release.json';

export function softwareApplicationJsonLd(lang: 'zh' | 'en') {
  const universal = release.assets.find((a) => a.name.includes('universal'))!;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Sleepy',
    operatingSystem: 'Android',
    // Google 官方 SoftwareApp 必填/推荐面:applicationCategory 必为 22 枚举之一,
    // 课表应用归 EducationalApplication;offers 必填,免费应用显式 price=0
    // (缺 offers 时 Google 富结果解析直接判不合格)。
    applicationCategory: 'EducationalApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    dateModified: release.date,
    softwareVersion: release.tag,
    downloadUrl: universal.url,
    license: 'GPL-3.0',
    sameAs: repoUrl,
    image: `${site}/og/home-${lang}.png`,
  };
}
