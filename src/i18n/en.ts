// en 文案单点(spec §4.1):键树与 zh.ts 严格同形 —— i18n-parity 测试闸。
// 策略:校名保中文 + 拼音检索,EN 页翻译的是「文案面」,不是数据面。
// slogan 暂用 A 案英译(§7.2 签收前单点可换)。
import type { SiteCopy } from './zh';

export const en: SiteCopy = {
  meta: {
    title: 'Sleepy — open-source timetable, built free',
    description:
      'An open-source Android timetable built by one person. 348 direct academic-system connections. No ads, no tracking, all code public.',
  },
  hero: {
    slogan: 'Built open. Feels free.',
    sub: 'An open-source Android timetable: three views, direct academic-system connections, reminders and home-screen widgets. The timetable is yours — the data stays on your phone.',
    ctaDownload: 'Download for Android',
    ctaTrial: 'Try it online',
    deviceCaption: 'Today view · app screenshot',
  },
  features: {
    heading: 'What a timetable should feel like',
    items: [
      {
        title: 'Three views, one glance',
        body: 'Week view for the big picture, grid view for density, today view for right now. Where the semester stands and what’s next — the answer is already on screen.',
        imgAlt: 'Week view app screenshot',
      },
      {
        title: '348 direct connections',
        body: 'Pick your school, sign in, the timetable comes down. When the system changes, I update the adapter — your timetable never skips a beat.',
        imgAlt: 'Academic import panel app screenshot',
      },
      {
        title: 'Reminders and widgets, in tune',
        body: 'Class-ahead reminders, today’s schedule, home-screen widgets. Present when it matters, quiet the rest of the day.',
        imgAlt: 'Class reminder settings screenshot',
      },
      {
        title: 'Local-first, worry-free upgrades',
        body: 'Your timetable lives on your phone and passes through no server. Export, import, migrate — all your own files.',
        imgAlt: 'Home-screen widgets overview screenshot',
      },
    ],
  },
  schools: {
    heading: 'Where your school stands',
    sub: 'Everything supported is grouped by province and academic system. Search it — see if your school is in.',
    searchPlaceholder: 'Search by name or pinyin, e.g. jiaotong',
    provinceLabel: 'Province',
    typeLabel: 'Protocol',
    statLine: (rows: number, types: number) => `${rows} entries · ${types} protocols`,
    allLabel: 'All',
    emptyState: 'This school isn’t supported yet — ',
    emptyIssue: 'open an issue',
    emptyTail: ', or tell me in the group — it will be added soon.',
    faqLink: 'FAQ',
    jsOffNote: 'With JavaScript disabled the full list stays readable.',
  },
  gallery: {
    heading: 'Real screenshots, no mockups',
    sub: '14 shipped screenshots: 9 app screens + 5 home-screen widgets. Tap to see them full size.',
    captions: [
      'Week view',
      'Grid view',
      'Today view',
      'Table manager',
      'Appearance & theme',
      'Class reminder',
      'Import preview',
      'Settings (Mine)',
      'Widgets overview',
      'Widget · week grid',
      'Widget · week view',
      'Widget · today',
      'Widget · next two days',
      'Widget · week list',
    ],
    close: 'Close',
    prev: 'Previous',
    next: 'Next',
    imageOf: (i: number, n: number) => `Screenshot ${i + 1} of ${n}`,
  },
  download: {
    heading: 'Download Sleepy',
    versionLine: (tag: string, date: string) => `${tag} · released ${date}`,
    universalNote: 'Not sure? Universal runs on every architecture.',
    recommended: 'Recommended',
    downloadAria: (abi: string, size: string) => `Download ${abi} (${size})`,
    abiNotes: {
      'arm64-v8a': 'Most phones today',
      'armeabi-v7a': 'Older devices',
      universal: 'All architectures',
      'x86_64': 'Emulators',
    },
    minSdk: 'Android 8.0 and up',
    shaLink: 'sha256sums.txt for every file',
    storeReserved: 'Store listing in the works',
    storeBadgeCn: 'App Market',
    deviceCaption: 'Grid view app screenshot',
    trial: 'Rather not install? The online trial is full-featured.',
  },
  trust: {
    heading: 'Who makes this',
    story: 'An open-source timetable built by one person. No ads, no tracking, all code public.',
    reachOut: 'Adapter issue at your school? @ me in the group.',
    privacyHeading: 'Privacy is an architecture question',
    privacyBody:
      'No Firebase, no Sentry, no ad SDK. Timetable data stays on your phone only; you keep the backup files yourself.',
    licenseHeading: 'GPL-3.0',
    licenseBody:
      'Full source is public — audit it, change it, ship your own. Every commit in the repo is open to read.',
    communityHeading: 'Community',
    sponsorLink: 'Sponsor Sleepy',
    qqGroupLabel: 'QQ group',
  },
} as const;
