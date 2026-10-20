// zh 文案单点(spec §2.5/§3)。slogan = 临时 A(§7.2 签收前单点可换)。
// 样例句逐句钉死,任何改写 = 测试红(global 文案闸)。
export const zh = {
  meta: {
    title: 'Sleepy — 开源课表,构建无壳,自由自在',
    description:
      '一个人写的开源 Android 课表。348 条教务直连,没有广告,没有追踪,代码全公开。',
  },
  hero: {
    slogan: '构建无壳,自由自在',
    sub: '开源 Android 课表:三视图、教务直连、提醒与桌面组件。课表是你的,数据留在你手机里。',
    ctaDownload: '下载 Android',
    ctaTrial: '在线体验',
    deviceCaption: '今日视图 · 真机截图',
  },
  features: {
    heading: '课表该有的样子',
    items: [
      {
        title: '三视图,一眼到底',
        body: '周视图看全局,网格视图看密度,今日视图看当下。学期走到哪、下节课在哪,抬头就有答案。',
        imgAlt: '周视图真机截图',
      },
      {
        title: '348 条教务直连',
        body: '选学校、登录,课表就下来了。教务系统改版,适配我来更新,课表不断档。',
        imgAlt: '教务导入面板真机截图',
      },
      {
        title: '提醒和组件,恰到好处',
        body: '课前提醒、今日安排、桌面小组件。该出现时出现,其余时间保持安静。',
        imgAlt: '课前提醒设置真机截图',
      },
      {
        title: '本地优先,换机不慌',
        body: '课表存在你手机里,不经过任何服务器。导出、导入、迁移,都是你自己的文件。',
        imgAlt: '桌面周视图组件截图',
      },
    ],
  },
  schools: {
    heading: '你学校在哪一档',
    sub: '全部收录按省份和教务系统分组。搜一下,你的学校在不在。',
    searchPlaceholder: '搜校名或拼音,比如 jiaotong',
    provinceLabel: '省份',
    typeLabel: '协议',
    statLine: (rows: number, types: number) => `${rows} 条收录 · ${types} 协议`,
    allLabel: '全部',
    emptyState: '这所学校还没收录——',
    emptyIssue: '提个 issue',
    emptyTail: ',或者进群告诉我,很快就会补上。',
    faqLink: '常见问答',
    jsOffNote: '禁用 JavaScript 时全量清单照常可读。',
  },
  gallery: {
    heading: '真机,无渲染图',
    sub: '8 张定稿截图,点开看大图。',
    captions: [
      '周视图',
      '网格视图',
      '今日视图',
      '主题选择',
      '课前提醒',
      '深色主题',
      '桌面组件 · 周网格',
      '导入预览',
    ],
    close: '关闭',
    prev: '上一张',
    next: '下一张',
    imageOf: (i: number, n: number) => `截图 ${i + 1} / ${n}`,
  },
  download: {
    heading: '下载 Sleepy',
    versionLine: (tag: string, date: string) => `${tag} · ${date} 发布`,
    universalNote: '不确定就选 Universal:适配全部架构。',
    recommended: '推荐',
    downloadAria: (abi: string, size: string) => `下载 ${abi}(${size})`,
    abiNotes: {
      'arm64-v8a': '近几年的手机',
      'armeabi-v7a': '老款设备',
      universal: '全架构通用',
      'x86_64': '模拟器',
    },
    minSdk: 'Android 8.0 起',
    shaLink: '校验所有文件的 sha256sums.txt',
    storeReserved: '商店上架准备中',
    storeBadgeCn: '应用商店',
    deviceCaption: '网格视图真机截图',
    trial: '不想安装 APK?在线体验功能完整。',
  },
  trust: {
    heading: '谁在做这个',
    story: '一个人写的开源课表。没有广告,没有追踪,代码全公开。',
    reachOut: '适配你学校的问题,群里 @ 我。',
    privacyHeading: '隐私是架构问题',
    privacyBody:
      '没有 Firebase,没有 Sentry,没有广告 SDK。课表数据只存在你手机,备份文件你自己保管。',
    licenseHeading: 'GPL-3.0',
    licenseBody:
      '源码全公开,可以审、可以改、可以自己发。仓库里每一个 commit 都能翻。',
    communityHeading: '社区',
    sponsorLink: '赞助 Sleepy',
    qqGroupLabel: 'QQ 群',
  },
} as const;

// 结构类型:键树 = 双语镜像闸(tsc 级),值拓宽成 string 让 en.ts 可标注
type Wide<T> = T extends (...args: infer A) => infer R
  ? (...a: A) => R
  : T extends object
    ? { -readonly [K in keyof T]: Wide<T[K]> }
    : string;
export type SiteCopy = Wide<typeof zh>;
