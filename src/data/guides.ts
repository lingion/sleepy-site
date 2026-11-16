/** User-facing procedures checked against an immutable Android release, not moving main. */
export type GuideLang = 'zh' | 'en';
interface GuideSection {
  id: string;
  title: string;
  paragraphs?: string[];
  steps?: string[];
  items?: string[];
  table?: { headers: string[]; rows: string[][] };
}
interface GuideCopy {
  title: string;
  description: string;
  answer: string;
  sections: GuideSection[];
}
export interface Guide {
  slug: string;
  reviewDate: string;
  sourceVersion: string;
  copy: Record<GuideLang, GuideCopy>;
  sources: { href: string; label: Record<GuideLang, string> }[];
}
const source = 'https://github.com/lingion/sleepy/blob/3a7cbed352f4f8e1144e2e532840b9bea93b25d3/';
const kotlin = source + 'app/src/main/java/com/lingion/sleepy/';
export const guides: Guide[] = [
  {
    slug: 'wakeup-migration',
    reviewDate: '2026-11-16',
    sourceVersion: 'Android v1.0.65',
    copy: {
      zh: {
        title: '如何将 WakeUp 课程表导入 Sleepy',
        description: '将 WakeUp 的分享口令、分享文本或 JSON 文件导入 Sleepy，逐项核对学期、周次和作息时间，并处理口令失效问题。',
        answer: 'Sleepy Android v1.0.65 可以识别 WakeUp 在线分享口令，也可以解析支持的离线课表文本或 JSON 文件。先保存原始导出，在导入预览中核对课程，再确认保存。在线口令依赖网络及第三方分享服务。',
        sections: [
          { id: 'choose-format', title: '先选一种可用的导出方式', table: { headers: ['手上的内容', '如何导入', '需要留意'], rows: [
            ['WakeUp 在线分享口令', '在新建课表的导入入口粘贴完整口令。', '需要联网；口令失效或分享服务不可用时，需重新分享或改用离线文件。'],
            ['课表分享文本 / JSON', '粘贴文本，或使用“从文件导入”选择受支持的 JSON 文件。', '保留完整内容；只复制课程截图或网页链接不能替代课表数据。'],
            ['ICS 日历文件', '使用文件导入选择 ICS。', '日历交换格式与完整课表备份不同；导入后检查周次和节次映射。'],
          ] } },
          { id: 'import', title: '导入步骤', steps: [
            '在来源应用取得有效的课表分享口令、完整分享文本或 JSON 导出文件。先单独保存一份原始内容，迁移完成前保留原课表。',
            '打开 Sleepy 的新建课表 / 导入入口。文本或口令选择“粘贴课表文本”；本地文件选择“从文件导入”。具体入口名称可能随版本变化。',
            '粘贴完整内容或选择文件。识别到在线口令时，Sleepy 会联网获取对应课表；离线课表文件则进入本地解析流程。',
            '在预览中检查课程数量、名称、教师、教室、上课周次和节次。确认学期起始日期与作息时间表符合你的学校安排。',
            '确认导入并保存课表，然后打开实际周视图，分别查看当前周、单双周和含特殊调课的周。核对完成后再处理旧应用的数据。',
          ] },
          { id: 'verify', title: '迁移后重点核对什么', items: [
            '开学日期和当前教学周：日期偏差会让全部课程错周。',
            '单双周、连续周与间隔周：检查至少一个奇数周和一个偶数周。',
            '第一节课开始时间、每节时长与午间休息：课程节次正确不等于提醒时间正确。',
            '教室、教师、备注以及临时调课：不要只看第一周截图。',
            '桌面小组件与提醒：这些属于应用设置，不应假定会随第三方课表一起迁移。',
          ] },
          { id: 'troubleshooting', title: '口令失效或解析失败怎么办', paragraphs: [
            '在线口令报错时，先检查网络，再请分享者生成新的有效口令。第三方服务的有效期、登录要求或接口变化可能影响获取；Sleepy 不能保证旧口令永久可用。',
            '有离线 JSON 或完整分享文本时，可以改用文件导入或文本导入。不要反复改扩展名，也不要把截图当成 JSON。仍然失败时，记录来源版本、Sleepy 版本和错误提示；提交反馈前删除姓名、学号、账号等个人信息。',
          ] },
          { id: 'screenshot-import', title: '只有截图时，先转换再核对', steps: [
            '在导入页选择“AI 截图转换”，复制提供的提示词。',
            '自行选择支持识图的 AI，将提示词和课表截图发给它。发送前遮盖姓名、学号等不需要识别的信息，并确认你愿意让该服务处理截图。',
            '将 AI 生成的 sleepy-v1 文本复制回“粘贴课表文本”，在 Sleepy 中预览。逐项检查课程、日期、周次和节次时间，修正识别错误后再保存。',
          ], paragraphs: [
            '这个入口只复制提示词，不会替你上传截图，也不是 Sleepy 内置的图片识别服务。有原始课表文本或文件时，优先使用原始数据。',
          ] },
          { id: 'platforms', title: 'Android、iOS 与网页版本的区别', paragraphs: [
            '本文步骤以 Android v1.0.65 的已发布源码为依据。iOS 与网页独立发布，入口、导入格式和功能进度可能不同，请以所安装版本实际显示的功能为准。',
            '迁移到另一平台时，优先核对该版本支持的课表交换格式，并用一张课表试导入。不要把 Android 的全量备份文件等同于所有平台通用的课表文件。',
          ] },
        ],
      },
      en: {
        title: 'Import a WakeUp timetable into Sleepy',
        description: 'Move a WakeUp share code, timetable text or JSON file into Sleepy, verify semester dates and teaching weeks, and troubleshoot expired codes.',
        answer: 'Sleepy Android v1.0.65 recognizes WakeUp online share codes and supported offline timetable text or JSON files. Keep the original export, inspect the import preview, then save. Online codes require a network connection and an available third-party sharing service.',
        sections: [
          { id: 'choose-format', title: 'Choose an available export format', table: { headers: ['What you have', 'Import method', 'Check first'], rows: [
            ['WakeUp online share code', 'Paste the complete code in the new timetable import flow.', 'Requires network access. An expired code or unavailable sharing service requires a new share or offline export.'],
            ['Timetable share text / JSON', 'Paste the text or use file import for a supported JSON file.', 'Keep the complete data. A screenshot or page link does not replace timetable data.'],
            ['ICS calendar file', 'Choose the ICS file in file import.', 'Calendar exchange is different from a full app backup. Check teaching weeks and period mapping afterward.'],
          ] } },
          { id: 'import', title: 'Import step by step', steps: [
            'Get a valid share code, complete timetable share text or JSON export from the source app. Save an original copy and keep the old timetable until verification is complete.',
            'Open the new timetable / import entry in Sleepy. Choose the paste timetable text option for text or a code, or file import for a local file. Labels can vary by app version.',
            'Paste all of the content or select the file. Sleepy fetches timetable data online when it identifies an online code; supported offline timetable files use local parsing.',
            'Inspect the preview: course count, names, teachers, rooms, teaching weeks and periods. Check the semester start date and daily period times against your university schedule.',
            'Confirm and save the timetable. Open the actual week view and inspect the current week, odd and even weeks, and weeks with exceptions before removing anything from the old app.',
          ] },
          { id: 'verify', title: 'Verify the result', items: [
            'Semester start date and current teaching week: an incorrect date shifts every course.',
            'Odd, even, continuous and interval weeks: inspect at least one odd and one even week.',
            'First period start, period lengths and lunch breaks: correct period numbers do not guarantee correct reminder times.',
            'Rooms, teachers, notes and rescheduled classes: checking only week one is not enough.',
            'Widgets and reminders are app settings. Do not assume a third-party timetable export transfers them.',
          ] },
          { id: 'troubleshooting', title: 'If the code expires or parsing fails', paragraphs: [
            'For an online code error, check your connection and ask the sender to generate a fresh valid code. Expiry, login requirements or changes to the third-party service can affect retrieval. Sleepy cannot guarantee that an old code remains available.',
            'If you have offline JSON or complete share text, try file or text import instead. Renaming a file does not convert its format, and a screenshot is not JSON. When reporting a failure, include source and Sleepy versions and the error message; remove names, student numbers and account details first.',
          ] },
          { id: 'screenshot-import', title: 'Convert and check a screenshot', steps: [
            'Choose AI screenshot conversion on the import page and copy the provided prompt.',
            'Choose an AI that accepts images and send it the prompt with your timetable screenshot yourself. Remove names, student numbers and other unnecessary details first, and decide whether you want that service to process the image.',
            'Copy the generated sleepy-v1 text into the paste timetable text entry in Sleepy. Inspect every course, date, teaching week and period time in the preview, correct recognition errors and then save.',
          ], paragraphs: [
            'This entry only copies a prompt. It does not upload your screenshot or provide a built-in Sleepy image-recognition service. Prefer the original timetable text or export file when available.',
          ] },
          { id: 'platforms', title: 'Android, iOS and web releases', paragraphs: [
            'These steps are checked against the released Android v1.0.65 source. iOS and web versions ship independently, so entry points, supported formats and feature availability may differ. Check the version you actually use.',
            'For a move to another platform, first confirm its supported timetable exchange formats and test one timetable. An Android full backup is not automatically a universally compatible timetable file.',
          ] },
        ],
      },
    },
    sources: [
      { href: kotlin + 'ui/screen/imports/ImportSheet.kt', label: { zh: '导入入口与预览流程', en: 'Import entry and preview flow' } },
      { href: kotlin + 'data/jw/WakeUpShareClient.kt', label: { zh: 'WakeUp 在线分享口令识别与获取', en: 'WakeUp online share code detection and retrieval' } },
      { href: kotlin + 'data/parser/ScheduleParser.kt', label: { zh: '本地课表格式解析', en: 'Local timetable format parsing' } },
    ],
  },
  {
    slug: 'backup-restore',
    reviewDate: '2026-11-16',
    sourceVersion: 'Android v1.0.65',
    copy: {
      zh: {
        title: 'Sleepy 课表备份、恢复与 WebDAV 使用指南',
        description: '区分单张课表导出与 .sleepybackup 全量备份，了解合并和覆盖恢复的影响，以及 Android 手动 WebDAV 备份方法。',
        answer: 'Sleepy Android v1.0.65 可将课表、作息、偏好与小组件配置打包成 .sleepybackup，也可手动上传到自己的 HTTPS WebDAV 服务器。它是备份与恢复功能；每次上传由你主动发起，不是自动实时同步。',
        sections: [
          { id: 'formats', title: '分享课表与备份整个应用要分开选', table: { headers: ['目的', '选择', '范围'], rows: [
            ['换机、重装前保留完整配置', '.sleepybackup 全量备份', '包含课表、作息、偏好及小组件配置；使用兼容版本恢复。'],
            ['分享一张课表或迁移到支持的应用', '课表导出，如 JSON / Sleepy 课表文本', '具体格式以导出面板为准；不是完整应用备份。单张 .sleepy 文本与 .sleepybackup 不同。'],
            ['与日历应用交换课程', 'ICS', '用于日历交换；不包含完整的 Sleepy 偏好与小组件配置。'],
          ] } },
          { id: 'local-backup', title: '先创建一份本地备份', steps: [
            '打开“我的”中的“备份与恢复”入口。本文以 Android v1.0.65 为准；旧版本可能将迁移功能放在其他设置页面。',
            '选择“创建完整备份”，使用系统文件选择器保存生成的 .sleepybackup 文件。文件名通常包含导出时间，便于区分多个备份。',
            '确认保存成功，将文件复制到新设备、电脑或自己管理的存储位置。不要只把唯一备份留在即将清空的手机中。',
            '在旧设备仍可使用时进行一次兼容版本的恢复核对，再决定是否重装或清理旧数据。',
          ] },
          { id: 'restore', title: '恢复时，合并与覆盖有什么区别', paragraphs: [
            '先为当前设备再做一份独立备份。然后选择从备份恢复，打开 .sleepybackup 文件，读取成功后再选择合并或覆盖。',
          ], table: { headers: ['模式', '实际影响'], rows: [
            ['合并导入', '保留本机课表并追加备份中的课表，因此重复导入可能产生重复课表。备份中的同名偏好键仍可能替换本机值，不能理解成“所有设置原样保留”。'],
            ['覆盖导入', '用备份替换本机的课表与作息等数据库内容，并替换备份所包含的偏好文件。不要在没有保存当前数据时选择覆盖。'],
          ] }, items: [
            '恢复后检查课表数量、学期起始日期、作息与当前教学周。',
            '合并到已有课表的设备时，导入课表的默认课表及提醒状态会调整；重新检查默认课表、提醒和小组件显示。',
            '账号密码不应被当作全量备份的一部分；WebDAV 密码不会加入备份包。',
            '备份可保留已保存的学校身份，但恢复 .sleepybackup 不会授予“从教务更新”资格。不要只凭学校名称仍在，就假定恢复后的课表可以直达原学校更新。',
            '需要保留按日期切换的完整作息方案时，使用全量 .sleepybackup。普通 sleepy-v1、WakeUp、作息文件和 ICS 不能完整保留这套方案；恢复后仍需核对适用日期与年份。',
          ] },
          { id: 'webdav', title: '使用自己的 WebDAV 服务器', steps: [
            '在备份页面的“WebDAV 备份”中设置 HTTPS WebDAV 地址、备份目录，以及服务器所需的用户名与密码。备份目录相对于所填写的地址。',
            '选择“测试连接并保存”。测试时可能在你的账户下创建该目录，账户需要相应的访问与写入权限。',
            '需要保存当前状态时，主动选择“上传当前完整备份”，核对目标服务器和目录后确认上传。等待成功提示；每次需要新备份时再次手动上传。',
            '恢复时选择“从服务器选择备份恢复”，选中目标 .sleepybackup 文件，再按上面的合并 / 覆盖说明操作。',
          ], paragraphs: [
            'HTTPS 保护传输过程，但备份文件本身未加密，服务器管理员可能读取内容。请使用自己信任的服务器与账户。密码在本机使用 Android Keystore 加密保存，不会进入备份包。',
            '此功能不是后台自动同步，也不是多设备同时编辑的冲突合并。移除此设备上的 WebDAV 配置不会删除服务器备份；远端文件需自行管理。',
            '上传与下载的单个备份文件上限均为 100 MiB。文件超过限制时，请改用本地文件备份和传输；服务器也可能设置更低的请求大小限制。',
          ] },
          { id: 'platforms', title: '跨设备、跨平台恢复前核对版本', paragraphs: [
            '本文核验对象是 Android v1.0.65。iOS、网页和其他版本独立发布，不能仅凭相同扩展名就保证全部偏好、小组件或全量备份跨平台兼容。请核对目标版本说明，并保留原始备份。',
            '只需要迁移课程时，可使用目标版本明确支持的 JSON、课表文本或 ICS 等交换格式，先试一张课表。下载成功不等于恢复验证完成，仍应检查日期、周次、时间和提醒。',
          ] },
        ],
      },
      en: {
        title: 'Back up and restore Sleepy, including WebDAV',
        description: 'Choose between timetable exports and full .sleepybackup files, understand merge and overwrite restore modes, and use manual WebDAV backups on Android.',
        answer: 'Sleepy Android v1.0.65 packages timetables, period times, preferences and widget configuration in a .sleepybackup file. You can manually upload it to your own HTTPS WebDAV server. Each upload is initiated by you; this is backup and restore, not automatic real-time sync.',
        sections: [
          { id: 'formats', title: 'Choose a timetable export or a full backup', table: { headers: ['Purpose', 'Choose', 'Scope'], rows: [
            ['Move devices or prepare for reinstalling', 'A full .sleepybackup file', 'Timetables, period times, preferences and widget configuration; restore with a compatible version.'],
            ['Share one timetable or move it to a supported app', 'A timetable export such as JSON / Sleepy timetable text', 'Check available formats in the export panel. This is not a full app backup; a single .sleepy text file differs from .sleepybackup.'],
            ['Exchange courses with a calendar app', 'ICS', 'Calendar exchange does not include all Sleepy preferences or widget configuration.'],
          ] } },
          { id: 'local-backup', title: 'Create a local backup first', steps: [
            'Open Backup and restore under Mine. These instructions cover Android v1.0.65; older releases may put migration in another settings page.',
            'Choose Create complete backup and use the system file picker to save the generated .sleepybackup file. The filename normally includes the export time to distinguish backups.',
            'Confirm the save succeeded and copy the file to the new device, a computer or storage you manage. Do not keep your only copy on a phone you plan to erase.',
            'While the original device is still usable, verify a restore with a compatible release before reinstalling or clearing old data.',
          ] },
          { id: 'restore', title: 'Understand merge and overwrite before restoring', paragraphs: [
            'Make a separate backup of the current device first. Choose restore from backup, open the .sleepybackup file and wait until it is read successfully before choosing merge or overwrite.',
          ], table: { headers: ['Mode', 'Effect'], rows: [
            ['Merge', 'Keeps local timetables and appends incoming ones, so repeated imports can create duplicates. Matching preference keys from the backup can still replace local values; merge does not preserve every setting unchanged.'],
            ['Overwrite', 'Replaces local timetable and period database content with the backup and replaces preference files included in the backup. Save your current data before choosing this mode.'],
          ] }, items: [
            'After restoring, check timetable count, semester start date, period times and the current teaching week.',
            'When merging into a device with existing timetables, incoming default timetable and reminder states are adjusted. Recheck the selected default, reminders and widgets.',
            'Do not assume account credentials are part of a full backup. The WebDAV password is not included in the backup package.',
            'A backup can retain saved school identity, but restoring a .sleepybackup does not grant eligibility for Update from academic system. A retained school name alone does not mean the restored timetable can reopen that school for an update.',
            'Use a full .sleepybackup to retain a complete date-based period-time scheme. Ordinary sleepy-v1, WakeUp, period files and ICS do not preserve the complete scheme; check its applicable dates and years after restoring.',
          ] },
          { id: 'webdav', title: 'Use your own WebDAV server', steps: [
            'In WebDAV backup, enter the HTTPS WebDAV address, backup directory and any required username and password. The directory is relative to the address you enter.',
            'Choose test connection and save. Testing may create the directory under your account, which needs the appropriate access and write permissions.',
            'When you want to save the current state, choose upload current full backup, verify the target server and directory, and confirm. Wait for success and repeat manually whenever you need a new backup.',
            'To restore, choose a backup from the server, select the .sleepybackup file and follow the merge / overwrite guidance above.',
          ], paragraphs: [
            'HTTPS protects data in transit, but the backup file itself is not encrypted and the server administrator may read it. Use a server and account you trust. The password is encrypted locally with Android Keystore and is not added to the backup.',
            'This is not automatic background sync or conflict resolution for simultaneous editing on multiple devices. Removing WebDAV configuration from this device does not delete server backups; manage remote files separately.',
            'Each backup upload and download is limited to 100 MiB. Use local backup files and file transfer for larger archives. Your server may impose a lower request-size limit.',
          ] },
          { id: 'platforms', title: 'Check versions before a device or platform move', paragraphs: [
            'This guide was verified against Android v1.0.65. iOS, web and other versions ship independently. A matching extension alone does not guarantee cross-platform compatibility for every preference, widget or full backup. Check the target release and keep the original file.',
            'If you only need courses, use a format explicitly supported by the target release, such as JSON, timetable text or ICS, and test one timetable first. A successful download is not a verified restore: check dates, weeks, times and reminders afterward.',
          ] },
        ],
      },
    },
    sources: [
      { href: kotlin + 'ui/screen/mine/BackupScreen.kt', label: { zh: '备份页面、本地导出与手动 WebDAV 操作', en: 'Backup screen, local export and manual WebDAV operations' } },
      { href: kotlin + 'data/migration/MigrationBackup.kt', label: { zh: '全量备份格式与模块', en: 'Full backup format and modules' } },
      { href: kotlin + 'data/migration/MigrationDatabaseCodec.kt', label: { zh: '课表合并、覆盖与提醒状态', en: 'Timetable merge, overwrite and reminder states' } },
      { href: kotlin + 'data/migration/MigrationPrefsCodec.kt', label: { zh: '偏好设置合并与覆盖行为', en: 'Preference merge and overwrite behavior' } },
      { href: kotlin + 'data/backup/WebDavClient.kt', label: { zh: 'WebDAV 传输与文件大小限制', en: 'WebDAV transfers and file-size limits' } },
      { href: kotlin + 'data/entity/TimeTableEntity.kt', label: { zh: '学校来源与教务更新资格', en: 'School identity and academic-update eligibility' } },
      { href: source + 'app/src/main/res/values/strings.xml', label: { zh: 'WebDAV 传输、密码与备份隐私说明', en: 'WebDAV transport, password and backup privacy notices' } },
    ],
  },
];
export const guideIndexPath = (lang: GuideLang) => `${lang === 'en' ? '/en' : ''}/guides/`;
export const guidePath = (slug: string, lang: GuideLang) => `${guideIndexPath(lang)}${slug}/`;
