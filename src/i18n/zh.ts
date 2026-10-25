// zh 文案单点 — v4 spec §7 五规则:R1 一意思正面说一次 / R2 禁一切问句 / R3 否定枚举改机制陈述 / R4 去口语 / R5 与 en 同形镜像。
// slogan「构建无壳,自由自在」逐字保留(§13 R3 品牌豁免已批;en 保留 §7.2 前现值「Built open. Feels free.」,签收前单点可换)。
// 数字纪律(§15):计数一律构建期派生传入(statLine/chipLabel/ribbon/meta),i18n 内禁手写现值;条数不当校数说(§4.1)。
// 泄漏闸(page.en.test walk zh 含汉字叶子 ⊄ EN 页):短叶子避真实校名子串 → AppBar 锚点用「教务直连/学校名录」而非裸「教务/学校」。
export const zh = {
  meta: {
    title: 'Sleepy — 开源课表,构建无壳,自由自在',
    // 计数派生闸(§15):条数不当校数说(§4.1),现值由页面层传入
    description: (rows: number) =>
      `${rows} 条教务直连,数据仅存本机,源码完整公开。一个人维护的开源 Android 课表。`,
  },
  hero: {
    slogan: '构建无壳,自由自在',
    sub: '开源 Android 课表:三视图、教务直连、桌面组件。课表数据仅存于本机,不经任何服务器。',
    ctaDownload: '下载 Android',
    ctaTrial: '在线体验',
    deviceCaption: '周视图应用截图',
    // ribbon = 不对称佐证条:派生大数字领头 + 单位短语,两事实跟随
    ribbon: { schools: '条教务直连', license: 'GPL-3.0 开源', privacy: '数据留存本机' },
  },
  views: {
    heading: '三视图,各得其所',
    // 一面板一主张(§4 M2):label=切换段名 title=面板题 lead=主张句
    panes: {
      grid: { label: '网格', title: '网格视图', lead: '一屏时间网格,课程位置与当日密度在同一视野内完成判读。' },
      week: { label: '周', title: '周视图', lead: '按天归组横向铺开,整周的空档与冲突一目了然。' },
      today: { label: '今日', title: '今日视图', lead: '只呈现当天课节,此刻之后的安排一屏读完。' },
    },
    peek: '切换到这个视图',
    groupLabel: '视图切换',
    captionSuffix: '视图截图',
  },
  connect: {
    heading: '教务直连',
    body: '选定学校登录,课表直接写入本机。教务系统改版,由维护者跟进适配,同步链路持续可用。',
    imageAlt: '教务导入应用截图',
    // 派生数字 chip(§4 M3:卡缘 assist-chip「N 条直连」;条数不当校数说,§4.1)
    chipLabel: (rows: number) => `${rows} 条直连`,
  },
  schools: {
    heading: '收录与检索',
    sub: '全部收录按省份与教务协议分组,支持校名或拼音检索。',
    searchPlaceholder: '输入校名或拼音,如 jiaotong',
    provinceLabel: '省份',
    typeLabel: '协议',
    statLine: (rows: number, types: number) => `${rows} 条收录 · ${types} 协议`,
    allLabel: '全部',
    emptyState: '这所学校尚未收录,',
    emptyIssue: '提交 issue',
    emptyTail: '即可进入补充队列;不便提交时,群内留言同样会被跟进。',
    faqLink: '常见问答',
    jsOffNote: '禁用 JavaScript 时全量清单照常可读。',
  },
  reminders: {
    heading: '提醒与组件',
    stripLead: '提醒由本机课表驱动,只在需要出现的时间点出现。',
    imageAlt: '课前提醒应用截图',
    beats: [
      { title: '课前提醒', body: '上课前按时发出通知,提前量按个人作息设定。' },
      { title: '今日摘要', body: '每日开始给出当天课节全貌,无需逐屏查看。' },
      { title: '明日预告', body: '晚间汇总次日课程,当天的晚间即可确定第二天的安排。' },
    ],
    widgets: {
      heading: '桌面组件',
      gridLabel: '周网格组件',
      listLabel: '周列表组件',
      todayLabel: '今日组件',
      twodaysLabel: '未来两天组件',
      weekviewLabel: '周视图组件',
    },
  },
  gallery: {
    heading: '全部为真机截图',
    sub: '每一张都来自线上版本,未用渲染图。点按任意一张查看大图。',
    captions: [
      '网格视图',
      '周视图',
      '今日视图',
      '课表管理',
      '外观与主题',
      '我的',
      '课前提醒',
      '组件 · 周视图',
    ],
    close: '关闭',
    prev: '上一张',
    next: '下一张',
    imageOf: (i: number, n: number) => `截图 ${i + 1} / ${n}`,
  },
  download: {
    heading: '下载 Sleepy',
    cta: '下载 Android',
    versionLine: (tag: string, date: string) => `${tag} · ${date} 发布`,
    universalNote: 'Universal 包适配全部架构,不确定设备时优先选择它。',
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
    deviceCaption: '网格视图应用截图',
    trial: '在线体验提供完整功能,无需安装。',
  },
  trust: {
    heading: '谁在做这个',
    story: 'Sleepy 由一个人设计与维护:功能以本地优先为前提实现,代码完整公开,接受审计与自行分发。',
    reachOut: '适配问题优先通过 GitHub issue 反馈;不便提交时,群内留言同样会被跟进。',
    privacyHeading: '隐私是架构问题',
    privacyBody: '课表数据仅存于本机,不经任何服务器;备份与迁移文件由你自己保管。',
    licenseHeading: 'GPL-3.0',
    licenseBody: '源码完整公开,可以审查、修改、自行发布;仓库中每一个 commit 均可查阅。',
    communityHeading: '社区',
    sponsorLink: '赞助 Sleepy',
    qqGroupLabel: 'QQ 群',
  },
  appbar: {
    // 锚点 = 跨页导航(spec §2.1 四枚:功能·学校名录·常见问答·组件);「学校名录/常见问答」为避校名子串泄漏的四字形式(§15 泄漏闸)
    anchors: {
      views: '功能',
      schools: '学校名录',
      faq: '常见问答',
      reminders: '组件',
    },
    ctaDownload: '下载',
    navLabel: '区块导航',
  },
  footer: {
    // app 用 'App'(纯拉丁):中文 '应用' 撞真实校名「广州应用科技学院」子串 = EN 泄漏闸红(§15)
    app: 'App',
    dl: '下载 Android',
    trial: '在线体验',
    repo: '源码仓库',
    community: '社区',
    qq: 'QQ 群',
    faq: '常见问答',
    sponsor: '赞助 Sleepy',
    license: 'GPL-3.0 开源',
    build: '构建',
    backToTop: '回到顶部',
    noJs: '禁用 JavaScript 时全量清单照常可读。',
  },
  // v5 四页键组(spec §4 文案 + 数字纪律:占位 {rows}/{types}/{shown}/{total}/{tag}/{minSdk}/{date} 由渲染端替换)
  homeSchoolCard: {
    // 计数派生闸(§15/§4.1):带协议条目数不当校数说(同录多入口、跨校区计数)
    count: '{rows} 条教务直连 · {types} 种协议,输入校名即可确认收录。',
    cta: '查找我的学校',
  },
  schoolsPage: {
    heading: '收录与检索',
    sub: '名录按省份与教务协议分组,支持校名或拼音检索。',
    searchLabel: '校名检索',
    placeholder: '输入校名或拼音,如 jiaotong…',
    provinceLabel: '省份',
    typeLabel: '协议',
    expandAll: '展开全部',
    collapseAll: '收起全部',
    countShown: '显示 {shown} / {total}',
    emptyTitle: '未收录的学校可在 GitHub 提交适配申请',
    emptyCta: '提交适配 →',
    footUpdated: '名录更新于',
    footNote: '名录随适配更新',
    provinceAria: '按省份筛选',
    typeAria: '按协议筛选',
  },
  downloadPage: {
    heading: '下载 Sleepy',
    versionLine: '{tag} · {minSdk} · {date} 发布',
    recommended: '推荐',
    universalNote: '不确定手机架构时选择 universal。',
    otherArchLink: '其他架构与校验 →',
    verifyTitle: '核对下载文件',
    verifyNote: '下载后可用 sha256sum 与 sha256sums.txt 比对,一致即文件完整。',
    installTitle: '安装步骤',
    installSteps: ['点击下载的 APK 文件即可开始安装。', '系统提示未知来源时,选择允许本来源安装。', '安装完成后打开应用,按引导导入课表数据。'],
    archTitle: '如何确认手机架构',
    archNote: '设置 → 关于手机 → 处理器可查看架构;确认不了就选 universal。',
    trialTitle: '在线体验',
    moreTitle: '更多',
    moreLinks: { releases: '全部历史版本', repo: '源码仓库', sponsor: '赞助项目', issues: '反馈问题' },
    storeReserved: '商店上架准备中',
  },
  faqPage: {
    heading: '常见问答',
    sub: '以下回答只覆盖当前发布物能核实的事实。',
    updatedPrefix: '内容更新于',
    tocLabel: '目录',
    tailTitle: '以上未覆盖的问题可在 GitHub Issues 反馈',
    tailIssues: 'GitHub Issues',
    tailDiscussions: 'Discussions',
    tailQq: 'QQ 群',
  },
  // v5 404 页(spec §2.6-7:正面陈述零致歉 + 四页链接 + zh 主 en 尾)
  notFound: {
    heading: '这个路径不在名录里',
    sub: '官网只有主页、学校查找、下载中心、常见问答四页,从下面任选一个继续。',
    home: '主页',
    schools: '学校查找',
    download: '下载中心',
    faq: '常见问答',
    enHint: 'This page is not in the catalog — ',
  },
} as const;

// 结构类型:键树 = 双语镜像闸(tsc 级),值拓宽成 string 让 en.ts 可标注
// 数组走 readonly:zh 的 as const 元组 → readonly 数组可直接赋值给 SiteCopy(Base 传 copy 用);
// en 的新鲜字面量(可变数组)→ readonly 目标同样可赋(可变→只读合法)
type Wide<T> = T extends (...args: infer A) => infer R
  ? (...a: A) => R
  : T extends readonly (infer E)[]
    ? readonly Wide<E>[]
    : T extends object
      ? { -readonly [K in keyof T]: Wide<T[K]> }
      : string;
export type SiteCopy = Wide<typeof zh>;
