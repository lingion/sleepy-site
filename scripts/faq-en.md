# Sleepy · Light Course Schedule FAQ (English)

> This page covers Android v1.0.63, released on 2026-11-01 UTC (2026-11-02 Beijing time). Content reviewed on 2026-11-02. Features are based on the [released source](https://github.com/lingion/sleepy/tree/v1.0.63) and that version's APK, excluding later changes on main. See the [project Wiki](https://github.com/lingion/sleepy/wiki) for more information.

## What the project is

### What is the relationship between Sleepy and WakeUp Course Schedule?
There is no affiliation. Sleepy is an independent open-source schedule project. The Android app supports some WakeUp data formats and can resolve its online share codes. This does not mean it is developed by the WakeUp team or can use all of WakeUp's services.

### Is Sleepy free? Does it have ads or in-app purchases?
It is free under the GPL-3.0 license, with no ads, subscriptions, in-app purchases or paid tiers. Download official APKs from [GitHub Releases](https://github.com/lingion/sleepy/releases).

### Do I need to register an account?
You do not need a Sleepy account or need to give Sleepy an email address or phone number. You can create schedules manually or import local files immediately. Direct academic-affairs import may still require a school account, student ID, password or verification code, entered on the school's login page. A school login is separate from a Sleepy account.

### Does it collect or upload data?
Schedules and settings are stored on your device. No project cloud account is required, and the app includes no analytics or crash-reporting SDKs such as Firebase Analytics, Crashlytics, Sentry, Bugsnag, AppCenter or Bugly. Ordinary schedule viewing and editing work offline.

Network operations include visiting school sites for academic-affairs import, contacting the third-party `api.wakeup.fun` service to resolve WakeUP share codes, refreshing holiday data, and checking versions or downloading updates through GitHub or the project mirror. When you use the system calendar, system sharing or manual export, where the data goes depends on the app and action you choose. Local storage does not mean every operation is offline. The About page links to the privacy policy.

### Who maintains it? Where do I report problems?
Lingion maintains the project. Report bugs, request school support or suggest features through [GitHub Issues](https://github.com/lingion/sleepy/issues); use [Discussions](https://github.com/lingion/sleepy/discussions) for discussion. Never post accounts, passwords, verification codes, cookies, tokens or unredacted personal schedules publicly.

### How can I support the project?
Voluntary sponsorship is welcome. Alipay and WeChat payment codes are on the [sponsor page](sponsor.md). Sponsorship does not unlock extra features; the app has no paid tiers.

## Installation and versions

### Which Android versions are supported?
The minimum is Android 8.0 (API 26); target and compile SDK are 37. The release package is `com.lingion.sleepy`, and the debug package in this source version is `com.lingion.sleepy.debug`. Their data is stored separately. Meeting the minimum system requirement does not mean every visual effect or vendor live notification works on older systems.

### What is the current version?
This page describes v1.0.63, with versionCode 10063. This release was published on 2026-11-01 UTC. Check the app's About page for your installed version. Download from the [v1.0.63 release page](https://github.com/lingion/sleepy/releases/tag/v1.0.63); later source commits and debug builds do not automatically count as features in this official release.

### Which APK ABIs are provided?
The official release provides four APK variants:

- `arm64-v8a`: most 64-bit ARM phones.
- `armeabi-v7a`: 32-bit ARM devices, also called V7A.
- `x86_64`: Android devices or emulators with this architecture.
- `universal`: a universal package to try if you are unsure of the architecture.

The release page provides `sha256sums.txt` to verify downloaded files. Do not treat PR CI test artifacts as official updates.

### Are there iOS, Windows or web versions?
The iOS app is maintained in the separate [lingion/sleepy-ios](https://github.com/lingion/sleepy-ios) repository. Consult its public documentation and [Releases](https://github.com/lingion/sleepy-ios/releases) for installation methods, minimum system requirements and available features. Android v1.0.63 does not establish full feature parity with iOS. There is also an [official website](https://sleepy.is-my.app) and an [online trial](https://sleepy.is-my.app/preview); the web preview does not provide every native app capability. There is no native Windows version yet.

### Which interface languages are supported?
Android v1.0.63 includes Simplified Chinese, Traditional Chinese, English, Japanese and Spanish. The website currently offers Chinese and English. These are separate language sets.

## Import and export

### What if my school is not on the list?
Search the full name or an alias on the school selection page, then try entering the academic-affairs URL for identification. A catalog listing does not mean a school is supported or that login is guaranteed to succeed. If the entry is missing, marked as pending support or fails to import, use the [school adaptation template](https://github.com/lingion/sleepy/issues/new?template=school_adaptation.yml) to provide the public academic-affairs address, failing page and steps. Do not submit login credentials or unredacted data.

### How many catalog entries are there, and which are configured?
The v1.0.63 catalog snapshot contains 4140 entries. After normalization under the app's status rules:

- The configured baseline is 352 entries: 350 `supported` and 2 `grad_supported`. Of these, 348 omit the status field and count as supported under compatibility rules; they are not another 348 entries.
- There are 2528 unverified entries: 2480 `unverified` and 48 `grad_unverified`. Entries with an available parser route can be tried after confirmation.
- There are 1260 entries awaiting integration: 1007 `pending` and 253 `grad_pending`. These cannot launch academic-affairs import directly.

These are catalog status counts, not a claim that every school has been individually verified online or is guaranteed to import. A valid entry point, parser and available school service are still needed. The Shiguang source covers 264 schools; that is a different measure from the 43 entries that ultimately use the `sg_asset` route. It does not mean all 264 have been tested live. See the [catalog documentation](docs/catalog/README.md) for configuration data and sources.

### I imported successfully from an unverified catalog school. How can I tell the maintainer?
After success, you can copy a report containing the version, date, school name, catalog ID, protocol and course count, then paste it into Issues or Discussions yourself. This reporting entry point does not automatically upload anything over the network. Before sharing, check for information you do not want to make public.

### How does academic-affairs import work? Are my credentials stored?
The app opens the school's login page in an on-device WebView or retrieves schedules using the relevant protocol. You enter your school credentials on the school's page. Sleepy does not write the academic-affairs password into the schedule database. The school login site may use WebView sessions or cookies; not writing to the schedule database does not mean the school page never retains a session. Redact any troubleshooting material.

### Which import formats are supported?
The app can identify these formats from their content:

- WakeUp offline share text (`【来自WakeUp课程表】`).
- WakeUp JSON.
- iCalendar / ICS.
- CSV.
- HTML tables.
- Tab-separated plain text.
- Sleepy's native `sleepy-v1`.

WakeUP online share codes are also supported. Online codes require a network connection and are separate from local file parsing.

### How do I import a WakeUP share code?
Enter the code, or share text containing it, in the import paste field. The app sends two POST requests to WakeUP's `api.wakeup.fun`, using `/pluto/app/antispam` and `/share_schedule/getv2`, then converts the shared schedule into local data.

Expired codes, invalid shares, network problems or changes to the service's protocol can cause failure. Do not post share codes in public issues. Ordinary manual editing, saved schedules and offline-format imports do not depend on this third-party service.

### What is `sleepy-v1`?
Sleepy's native plain-text exchange format includes a `chk` integrity field. It is readable directly and supports export/import round trips. It does not require replacing older WakeUp data: WakeUp JSON, offline share text and ICS can still be imported.

### What can I export?
Schedules can be exported as WakeUp-compatible JSON, ICS and `sleepy-v1`. Share text from the export page and the top-bar share panel uses native sleepy-v1, not WakeUp's URL-encoded share text. Period timetables can be exported as JSON or sleepy-v1.

On Android 10 and later, the relevant files are written to `Download/Sleepy/`. Android 8–9 uses the app cache and FileProvider sharing; text uses the system share sheet. ICS can be passed to the system calendar or an iCalendar-compatible app. Exporting one schedule is not a full backup.

### Can I export to Xiaoai's class timetable?
Yes. The export page offers "Export to Xiaoai class timetable". It generates and validates week, date and period-timetable fields locally, then passes them to Xiaoai's timetable importer through a deep link. Whether it is accepted and how it appears depend on the Xiaoai client installed on the device.

### Can it write directly to the system calendar?
Yes. On the export page, choose a writable calendar on the device and a date range, preview, then confirm. Calendar read/write permission is requested at this point. Export supports applying class reschedules and calendar reminders. If no writable calendar exists, the app can create its own hidden local calendar on demand; incremental fingerprints help avoid duplicate writes. Events edited in the calendar app have retention rules, but this is not two-way real-time synchronization. The experimental first-period alarm depends on calendar app and account support.

### How do I make a full backup or move to a new device?
Use "Data migration" in "General settings" to export a `.sleepybackup` containing schedules, period timetables, preferences and widget configuration. Restore offers merge or overwrite. Merge keeps local schedules and appends restored ones; preference keys with the same name take the backup's values. Overwrite replaces only the schedule and settings modules included in the backup, keeping local values for preference files absent from it. Keep the original backup safe before restoring. A single schedule's JSON or ICS file is not a full backup.

### Which permissions are required?
Common optional permissions include foreground location when you tap school location, notifications when enabling reminders, calendar read/write when exporting to the system calendar, and unknown-source installation when installing an update. Exact alarms, battery optimization and do-not-disturb access are configured through the relevant system settings. Background services and restoration after reboot also depend on system permissions and power-saving policies. Ordinary offline schedule viewing does not require granting all these permissions. This is not a complete list of Manifest permissions.

## Schedules, conflicts and period timetables

### Can I keep multiple schedules at once?
Yes. Schedules are stored independently, each with its own semester start date, maximum week count and period timetable. The schedule page offers a time grid and a week view grouped by day; the Today page brings together the day's courses. Wide landscape layouts can use two columns, while portrait tablets fall back to one.

### If two courses overlap, is one lost?
Overlapping courses remain in the data. The conflict layout stacks them and provides a way to view them. When adding a course manually, it lists the weekday, periods, weeks and conflicting courses. A course being visually covered does not mean it has been deleted.

### What can undo revert?
Undo and redo apply to schedule-data edits. The default history depth is 5 steps and can be changed in the lab section of "General settings". A value of 0 disables history; a negative value removes the step limit. A new edit clears the redo branch. Switching the current schedule does not count as a data-edit record.

History is held in process memory and is lost when the process ends. It is not a backup. Whether an operation can be undone depends on whether it is included in schedule history; this does not mean every change made through the system calendar, external apps or diagnostic console can be restored.

### How do I change just one class occurrence?
Use the single-occurrence adjustment entry point to change the course instance on a specific date or in a specific week, without changing the whole course's recurrence rule. Edit the recurring course if the change should apply across the semester. Check the applicable dates separately for single-occurrence adjustments and holiday reschedule mappings.

### Can I drag courses, move across weeks and add courses quickly?
Long-press a course capsule to drag it and adjust the course instance according to its grid drop position. Holding near the left or right week edge triggers a week turn every 500 milliseconds until you leave the edge or reach the week boundary. An empty cell can open a quick-add capsule with its weekday and periods prefilled.

This describes v1.0.63 behavior. Later fixes on main for drag white edges, scrolling and week turns on release are not automatically included in this official APK.

### Can period times be calculated automatically?
You can enter each period's start and end manually or calculate them from the first period's start, class duration, number of periods and break template. Different schedules can use different period timetables, and academic-affairs import handles the corresponding period times. The header also has a period start/end time alignment option to suit your display preference.

### What is the ghost marker on a time slider?
When adjusting a range or value, the ghost marker keeps the original value visible for comparison. It is not a second course or a second active interval. This reference is used in editors such as course periods and single-occurrence times. The new value you confirm is the one saved.

### Can the week view show dates?
Yes. With "Show weekday" enabled, the week view shows the actual date beside courses and in the day detail panel, so you do not have to work it out from the teaching week.

### How are long breaks displayed?
Long gaps use a thin floating band rather than stretching a whole row into a tall blank space. Course cards keep their corresponding row height, meal breaks are marked in proportion to time, and the header time row can be hidden.

## Widgets

### Which widgets are available?
v1.0.63 has five families and 13 widget configuration XML files:

1. **Today**: the day's course list.
2. **TwoDay**: today and tomorrow in two columns.
3. **WeekList**: a weekly course list.
4. **WeekView**: a week-view thumbnail.
5. **WeekGrid**: the full period grid.

Widgets use synchronous `RemoteViews + Canvas` rendering, with variants for different launcher sizes. The separate "Add or Manage Home Screen Widgets" page provides an add gallery, instance management and refresh. Large cards determine each gallery row's height; smaller cards are proportionally scaled and centered. Widgets under later development are not included in these 13 configurations.

### Why might widgets be blank on OPPO, OnePlus or ColorOS launchers?
The old asynchronous Glance SessionWorker could be frozen by some ColorOS launchers. The main renderer now uses synchronous RemoteViews and Canvas. If problems remain, try a manual refresh and check launcher permissions and power-saving limits. Changing the renderer does not guarantee that every launcher will allow updates without restrictions.

### What if widget colors differ from the app?
The app and widgets share their theme and course-color sources. Changing the theme triggers widget updates. If old content remains, refresh manually, check system restrictions and re-add the widget if necessary. Record its position and settings first; deleting and recreating it is not a lossless operation.

### Are vivo Atomic Island and home screen widgets the same thing?
No. v1.0.63's OriginOS home screen widgets use standard Android AppWidget and should not be advertised as certified native "atomic components". Atomic Island is a vendor live-card display for reminders. Whether it appears depends on the system version, permissions and vendor capabilities.

## Reminders

### How many minutes before class can it remind me?
Pre-class reminders support 1 to 999 minutes. Today summaries, tomorrow summaries and pre-class reminders each have their own master switch, and each schedule also has its own reminder switch.

### How do banner and Fluid Cloud pre-class reminders relate?
The two modes are mutually exclusive. Banner mode uses ordinary dismissible notifications; Fluid Cloud uses experimental live cards and depends on system and vendor support. Switching back to banner stops the Fluid Cloud delivery service. A running service does not mean the system has displayed the card.

### Is OPPO, OnePlus and realme Fluid Cloud integrated?
The Android 16 Live Updates channel is integrated, and the repository contains behavior records for RMX6688 / ColorOS 16. The dedicated Pantanal / Seedling SDK and UPK channels cannot yet be described as fully integrated. Use the test and end controls on the reminders page to check your device's behavior. Notification permission or a "delivering" status does not prove that the system has shown a capsule. Older systems, or notifications not granted promoted status, may show only an ordinary notification. See the [verification scope](docs/vendors/oppo-coloros-fluid-cloud.md).

### Will reminders from multiple schedules flood my notifications?
v1.0.63 combines daily summaries and tomorrow reminders from all schedules into one notification, sorted by class time. When multiple schedules contribute, each entry has a `[schedule name]` prefix. Tapping opens the unified daily agenda, which also supports opening a specified date directly. Later versions' schedule-selection behavior is outside this page's release scope.

### Where are the per-schedule reminder switches?
Open "Schedule reminders" from "Mine", then "Reminders". The list shows every schedule and its switch. You can configure them even when the master switch is off.

### How do I set holidays, swapped days and class-time do-not-disturb?
General settings manages holidays and reschedule mappings; each schedule stores its reschedules separately. Configure date rules on the reminders page. With system do-not-disturb access granted, the app can enable do-not-disturb during class and restore it afterward. Refreshing date data requires a network connection, and reminder display is also subject to the device's background policies.

### Are reminders cloud push notifications?
No. Reminders are scheduled locally with AlarmManager, using exact or inexact paths according to system capabilities. BootReceiver restores scheduling after a device reboot or app update. Notification permission, exact-alarm permission and power-saving policies can still affect delivery.

### Will I still receive reminders after turning them off?
Turning off the app's master switch stops it from actively scheduling new reminders. Each schedule's switch can also be turned off independently. Android still controls system notification permission. Notifications blocked by the system or vendor require attention in the corresponding settings.

## Theme and appearance

### Are dark mode and system dynamic color supported?
"Appearance & theme" under "Mine" supports system, light and dark modes. Android 12 and later can use Material You wallpaper-based dynamic colors; preset palettes are used when dynamic color is unavailable.

### Can I customize theme colors?
You can create and edit custom themes, setting primary, secondary, tertiary accent and surface tint colors. Editing and saving the custom theme currently in use reapplies its colors without switching to another theme and back.

### How are course colors chosen? Can they follow the theme?
Course colors have three modes: Classic, Follow Theme and Custom. Classic uses a stable golden-angle HSL distribution; Follow Theme arranges course colors around the theme color; Custom uses your chosen seed color. Hues are saved by course group, and the app and widgets share the same derivation rules. The golden-angle method is not used by every mode.

### Does selecting a theme card change its size?
The selection indicator occupies a fixed slot. Selected and unselected cards keep the same layout dimensions, with color and a check mark distinguishing their state.

### Which devices support liquid glass and Material 3 Expressive motion?
v1.0.63 introduces a liquid-glass bottom bar, Material 3 Expressive transitions and spring motion. The runtime shader path depends on graphics capabilities available on Android 13 (API 33) and later. System support affects the result.

The release still has known bottom-bar display limitations on some older devices. It cannot guarantee the same refraction, blur or a complete fallback on those devices. Later compatibility fixes on main must not be described as already fixed in v1.0.63. The API 33 requirement for graphics effects does not change the whole app's minimum version to Android 13.

### Are Android 13 themed icons supported?
The app includes a monochrome layer for themed icons on Android 13 and later. The launcher must also support and enable them. This is separate from in-app dynamic color, available from Android 12.

## Development, testing and contribution

### How do I build it?
You need JDK 17 and the corresponding Android toolchain. To reproduce the release described on this page, check out v1.0.63:

```sh
git clone https://github.com/lingion/sleepy.git
cd sleepy
git switch --detach v1.0.63
./gradlew assembleDebug
```

On Windows, use `gradlew.bat assembleDebug`. Output is in `app/build/outputs/apk/debug/`. Source on main, PRs and automated debug builds may include later changes. See the [build guide](docs/ci-automation.md) separately for current CI usage; it does not mean those changes are included in the official APK.

### How do I run tests?

```sh
./gradlew testDebugUnitTest
```

Tests are in `app/src/test/`, covering import parsing, data, conflicts, weeks, themes, widgets and other modules. Never put real credentials, sessions or personal schedules in test fixtures.

### Is the local debug console read-only?
No. This interface must be enabled explicitly. It listens on the loopback address `127.0.0.1:3737` and authenticates requests through `X-Sleepy-Token`. Once unlocked, it can query data and also create, modify or delete some schedules, courses, period timetables and preferences. Release builds impose additional restrictions on endpoints such as catalog overrides, mocks and triggers. Those restrictions do not make the whole interface read-only.

Use it only for local diagnosis. Do not expose it to the public internet or give its token to untrusted tools. Operations can modify data, so back up first. Resetting a session does not guarantee that changes to arbitrary real data will be undone. See the [console documentation](docs/agent-debug-console/AGENT-SKILL.md) for interface boundaries.

### How do I contribute?
Read the public [CONTRIBUTING.md](CONTRIBUTING.md) first and submit a clearly scoped change. School adaptations need public protocol evidence, redacted fixtures and tests. Bug reports should include the version, reproduction steps and any necessary redacted screenshots. Do not submit personal data.

## Related links

- Source: [github.com/lingion/sleepy](https://github.com/lingion/sleepy)
- Release: [v1.0.63](https://github.com/lingion/sleepy/releases/tag/v1.0.63)
- Wiki: [github.com/lingion/sleepy/wiki](https://github.com/lingion/sleepy/wiki)
- Issues: [github.com/lingion/sleepy/issues](https://github.com/lingion/sleepy/issues)
- License: [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html)
- Sponsorship: [sponsor.md](sponsor.md)
