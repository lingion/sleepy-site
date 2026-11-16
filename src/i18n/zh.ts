// zh 文案单点 — v4 spec §7 五规则:R1 一意思正面说一次 / R2 禁一切问句 / R3 否定枚举改机制陈述 / R4 去口语 / R5 与 en 同形镜像。
// slogan「构建无壳,自由自在」逐字保留(§13 R3 品牌豁免已批;en 保留 §7.2 前现值「Built open. Feels free.」,签收前单点可换)。
// 数字纪律(§15):计数一律构建期派生传入(statLine/chipLabel/ribbon/meta),i18n 内禁手写现值;条数不当校数说(§4.1)。
// 泄漏闸(page.en.test walk zh 含汉字叶子 ⊄ EN 页):短叶子避真实校名子串 → AppBar 锚点用「教务直连/学校名录」而非裸「教务/学校」。
export const zh = {
  meta: {
    title: 'Sleepy 轻课表 — 免费无广告的开源大学生课程表 | Android 与 iOS',
    // 计数派生闸(§15):条数不当校数说(§4.1),现值由页面层传入
    description: (rows: number) =>
      `Sleepy 轻课表是免费、无广告的开源大学生课程表，提供 Android 与 iOS 原生应用和网页体验。支持课程管理、课表导入与桌面小组件；学校目录收录 ${rows} 条，按状态查看适配情况。`,
  },
  iosDownload: {
    storeAlt: '在 App Store 下载',
    storeAria: '在 App Store 下载 Sleepy iOS 正式版',
    testFlightLabel: '通过 TestFlight 安装',
    testFlightAria: '通过 Apple TestFlight 安装 Sleepy iOS 公测版',
    note: 'App Store 可用性以你所在地区的商店页面为准；无法获取时，可查看 TestFlight 是否开放名额。',
  },
  hero: {
    slogan: '构建无壳,自由自在',
    sub: 'Sleepy 轻课表是一款免费、无广告的开源大学生课程表，提供 Android 与 iOS 原生应用。课表默认保存在本机，支持课程管理、课表导入与桌面小组件；各端功能与发布版本独立。',
    ctaDownload: '下载',
    ctaTrial: '在线体验',
    demoTitle: 'Sleepy 完整网页版',
    demoLoading: '正在加载课表…',
    demoSlow: '仍在加载，可稍候或重新加载。',
    demoError: '课表暂时未能加载，请重试。',
    demoRetry: '重新加载',
    demoHint: '完整网页版，保留原站界面与功能。',
    demoOpen: '单独打开完整网页版',
    deviceCaption: '周视图应用截图',
    // ribbon = 不对称佐证条:派生大数字领头 + 单位短语,两事实跟随
    ribbon: { schools: '条学校目录记录', license: '源码公开', privacy: '本地优先' },
  },
  views: {
    heading: '三视图,各得其所',
    // 一面板一主张(§4 M2):label=切换段名 title=面板题 lead=主张句
    panes: {
      grid: { label: '网格', title: '网格视图', lead: '在时间网格中查看课程位置与密度。Android 部分网格与刻度仍使用当前日作息，跨日期时间请核对课程详情。' },
      week: { label: '周', title: '周视图', lead: '按天查看整周课程。Android 新建教务导入可保留来源的日期作息，逐日课程详情按适用日期显示时间。' },
      today: { label: '今日', title: '今日视图', lead: '集中查看当天课程。Android 按来源日期规则选择作息，课程明确钟点优先；规则以导入的年份和区间为准。' },
    },
    peek: '切换到这个视图',
    groupLabel: '视图切换',
    captionSuffix: '视图截图',
  },
  released: {
    heading: 'Android 正式版功能与使用范围',
    version: 'Android {tag} · {date} 发布',
    source: '查看此版本源码',
    items: {
      editing: { title: '按日期选择作息', body: '新建教务导入可保留基础作息与日期区间规则，逐日课程详情、今日页、小组件和提醒按适用日期选择时间，课程明确钟点优先。规则受来源年份和区间限制；部分主课表网格、刻度与浮层仍用当前日作息。更新或追加已有课表不会替换日期规则，保留完整方案请使用全量备份。' },
      appearance: { title: '按系统能力呈现玻璃效果', body: '提供 Classic 与 Liquid Glass 外观。完整玻璃折射需要 Android 13 或更高版本，Android 12 使用模糊效果，更早系统使用回退效果。动态取色从 Android 12 起，主题图标从 Android 13 起；具体显示随设备与系统能力变化。' },
      exchange: { title: '本地备份与手动 WebDAV', body: '完整 .sleepybackup 保存课表、作息、偏好与小组件配置，可在本机恢复，也可由你确认后上传到自选 HTTPS WebDAV 服务器。每次上传需手动发起，恢复时选择合并或覆盖；上传与下载上限为 100 MiB。备份文件未加密，连接凭据不进入备份；这不是自动同步。' },
      widgets: { title: '独立添加两种 4×2 周网格', body: '竖向七天与横向三天周网格各自绑定课表、设置并预览，横向支持调整星期标签左右位置。原有完整网格尺寸继续保留；升级后需移除旧 4×2 实例，从新的竖向或横向入口重新添加。刷新时机仍受桌面与后台策略影响。' },
      privacy: { title: '用自选 AI 转换课表截图', body: '导入页可复制截图转换提示词。由你选择 AI 服务并发送提示词和截图，再将 sleepy-v1 回复粘贴回 Sleepy，核对预览后导入。这个入口负责复制提示词，不会替你上传截图；发送前请检查截图中的姓名、学号等信息。' },
      console: { title: '回到原学校更新课表', body: '通过应用内教务导入创建、且具有有效资格的课表，可直接打开保存的原学校登录入口，审阅差异后确认更新。手动、文件或文本导入与旧记录不会自动获得资格；恢复导出的全量备份、复制课表或仅保留学校身份也不授予资格。导入可用性仍取决于学校系统。' },
    },
  },
  connect: {
    heading: '教务直连',
    body: '先查目录状态，再用学校账号导入。Android 通过应用内教务流程创建、具备有效资格的课表，可从原学校入口审阅更新；文件或文本导入及恢复全量备份不会授予该资格。收录不保证导入成功，仍受学校改版、验证码与网络影响。',
    imageAlt: '教务导入应用截图',
    // 派生数字 chip(§4 M3:卡缘 assist-chip「N 条直连」;条数不当校数说,§4.1)
    chipLabel: (rows: number) => `${rows} 条目录记录`,
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
    emptyTail: '说明学校与导入问题，帮助维护者核对适配需求；也可通过社区反馈。',
    faqLink: '常见问答',
    jsOffNote: '禁用 JavaScript 时全量清单照常可读。',
  },
  reminders: {
    heading: '提醒与组件',
    stripLead: '按本机课表与设置安排提醒；实际送达时间受通知权限、系统省电与后台限制影响。',
    imageAlt: '课前提醒应用截图',
    beats: [
      { title: '课前提醒', body: '按课程时间与设置的提前量安排通知，请检查系统权限及后台设置。' },
      { title: '今日摘要', body: '按设置汇总当天课程，便于查看一天的安排。' },
      { title: '明日预告', body: '按设置汇总次日课程，提前了解第二天的安排。' },
    ],
    widgets: {
      heading: '桌面组件',
      note: 'Android 的竖向七天与横向三天 4×2 周网格独立绑定课表和设置；从旧版升级后，请移除旧 4×2 实例，再从新入口添加。刷新时机取决于桌面与后台限制，iOS 以独立版本说明为准。',
      gridLabel: '周网格组件',
      listLabel: '周列表组件',
      todayLabel: '今日组件',
      twodaysLabel: '未来两天组件',
      weekviewLabel: '周视图组件',
    },
  },
  gallery: {
    heading: '真机截图',
    sub: '点按查看 Android 界面大图。完整玻璃折射需要 Android 13 起，Android 12 使用模糊，更早系统使用回退效果。',
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
    cta: '下载',
    versionLine: (tag: string, date: string) => `${tag} · ${date} 发布`,
    universalNote: 'Universal 包包含本版本支持的架构,不确定应选哪种 ABI 时可使用。',
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
    trial: '在线体验无需安装，用于预览网页版课表。Android、iOS 与网页独立发布，导入格式、备份兼容性、小组件与系统提醒请按所选平台核对。',
  },
  trust: {
    heading: '谁在做这个',
    story: 'Sleepy 由 Lingion 发起和维护，社区贡献者共同完善功能、学校适配与界面。源码、提交记录和发布说明公开，可查看各项改动及贡献者。',
    reachOut: '适配问题可通过 GitHub issue 反馈，请附学校、应用版本与错误提示，删除账号等个人信息后再提交；也可通过社区交流。',
    privacyHeading: '隐私是架构问题',
    privacyBody: '课表默认保存在本机，无需注册 Sleepy 账号；教务导入可能需要学校账号。教务、WakeUp 在线口令、节假日与版本检查按功能联网。Android 的 WebDAV 备份由你确认后直接上传至自选服务器，归档未加密，连接凭据留在本机。Android 截图转换由你自行发送给自选 AI，使用前请核对该服务的数据政策。',
    licenseHeading: '源码与许可',
    licenseBody: 'Sleepy 自有代码采用 GPL-3.0；第三方组件遵循各自许可，包括有限制商业使用的源码可见组件。修改和分发前请查阅完整许可说明。',
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
      releases: '更新说明',
    },
    ctaDownload: '下载',
    navLabel: '区块导航',
  },
  footer: {
    privacy: '隐私政策',
    licenses: '开源许可与致谢',
    // app 用 'App'(纯拉丁):中文 '应用' 撞真实校名「广州应用科技学院」子串 = EN 泄漏闸红(§15)
    app: 'App',
    dl: '下载',
    trial: '在线体验',
    repo: '源码仓库',
    community: '社区',
    qq: 'QQ 群',
    faq: '常见问答',
    guides: '使用指南',
    sponsor: '赞助 Sleepy',
    license: '源码公开',
    build: '构建',
    backToTop: '回到顶部',
    noJs: '禁用 JavaScript 时全量清单照常可读。',
  },
  // v5 四页键组(spec §4 文案 + 数字纪律:占位 {rows}/{types}/{shown}/{total}/{tag}/{minSdk}/{date} 由渲染端替换)
  homeSchoolCard: {
    // 计数派生闸(§15/§4.1):带协议条目数不当校数说(同录多入口、跨校区计数)
    count: '{rows} 条目录记录 · {types} 种协议，输入校名查看已配置或未验证状态。',
    cta: '查找我的学校',
  },
  schoolsPage: {
    heading: '教务适配',
    sub: '搜索你的学校，查看教务直连与课表导入适配情况。',
    searchLabel: '校名检索',
    placeholder: '输入校名或拼音,如 jiaotong…',
    provinceLabel: '省份',
    typeLabel: '教务系统',
    expandAll: '展开全部',
    collapseAll: '收起全部',
    countShown: '找到 {matched} 所学校',
    emptyTitle: '未收录的学校可在 GitHub 提交适配申请',
    emptyCta: '申请学校适配',
    footUpdated: '名录更新于',
    footNote: '名录随适配更新',
    provinceAria: '按省份筛选',
    typeAria: '按协议筛选',
  },
  downloadPage: {
    heading: '下载 Sleepy',
    metaDescription: 'Sleepy 官方下载中心：支持项目镜像与 GitHub 原站下载 Android APK，提供 iOS App Store 正式版与 TestFlight 公测入口、文件校验与安装说明。',
    versionLine: '{tag} · {minSdk} · {date} 发布',
    recommended: '推荐',
    universalNote: '不确定手机架构时选择 universal。',
    otherArchLink: '其他架构与校验 →',
    verifyTitle: '核对下载文件',
    verifyNote: '下载后用 SHA-256 工具与官方 sha256sums.txt 中对应文件的摘要比对，确认文件与发布记录一致。',
    installTitle: '安装步骤',
    installSteps: ['点击下载的 APK 文件即可开始安装。', '系统提示未知来源时,选择允许本来源安装。', '安装完成后打开应用,按引导导入课表数据。'],
    archTitle: '如何确认手机架构',
    archNote: '可在设备规格或系统信息中查找 ABI；部分“关于手机”页面只列处理器型号。确认不了时选 universal。',
    trialTitle: '在线体验',
    moreTitle: '更多',
    moreLinks: { releases: '全部历史版本', repo: '源码仓库', sponsor: '赞助项目', issues: '反馈问题' },
    storeReserved: '商店上架准备中',
  },
  faqPage: {
    heading: '常见问答',
    sub: '查找安装、课表导入、小组件与隐私说明。功能问答保留各自的核对版本，最新变化见更新说明。',
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
    sub: '这个页面可能已移动。可以返回主页，或前往下载、学校查找与常见问答继续浏览。',
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
