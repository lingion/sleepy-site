# Sleepy · Light Course Schedule FAQ (English)

> This FAQ states only facts verifiable in current code and public releases. Updated: 2026-10-25. Full page docs, import formats and adaptation records live in the [project Wiki](https://github.com/lingion/sleepy/wiki).

## What the project is

### What is the relationship between Sleepy and WakeUp Course Schedule?
None. Sleepy is an independent open-source Android project with its own repository and maintainer. The two are compatible at the data-format level only: Sleepy can import JSON and share-text exported by WakeUp, and can export WakeUp-compatible JSON.

### Is Sleepy free? Does it have ads or in-app purchases?
It is free under the GPL-3.0 license. There are no ads, subscriptions, in-app purchases or paid tiers. The public APK is downloaded from [GitHub Releases](https://github.com/lingion/sleepy/releases).

### Do I need to register an account?
No account, email, phone number or student ID is required. After opening the app you can build a schedule manually or import an existing one.

### Does it collect or upload data?
Schedules and settings are stored on the device. The project integrates no analytics or crash-reporting SDKs such as Firebase Analytics, Crashlytics, Sentry, Bugsnag, AppCenter or Bugly, and does not require a cloud login. Academic-affairs import visits the school site, holiday refresh downloads public date data, and version checks and downloads access GitHub or the project mirror; viewing and editing schedules work offline. The About page links the hosted privacy policy.

### Who maintains it? Where do I report problems?
The project is maintained by Lingion. Bugs, new-school adaptations and feature requests go to [GitHub Issues](https://github.com/lingion/sleepy/issues); discussion goes to [Discussions](https://github.com/lingion/sleepy/discussions). When reporting academic-affairs problems, never attach accounts, passwords, verification codes, cookies, tokens or personal schedules.

### How can I support the project?
The project accepts voluntary sponsorship; Alipay and WeChat QR codes are on the [sponsor page](sponsor.md). Sponsoring never unlocks features: Sleepy stays free with no paid tiers.

## Installation and versions

### Which Android version is supported?
Minimum Android 8.0 (API 26); target / compile SDK is 37. The release application id is `com.lingion.sleepy`, debug builds use `com.lingion.sleepy.debug`; their data is isolated.

### What is the current version?
The build version derives from Git tags; with no usable tag it falls back to release notes. Your installed version is shown under "About" in the app; public releases are authoritative on the [GitHub Releases](https://github.com/lingion/sleepy/releases) page.

### Which APK ABIs are provided?
Release builds provide separately:

- `arm64-v8a`: most modern phones
- `armeabi-v7a`: 32-bit ARM devices
- `x86_64`: common Android emulators
- `universal`: contains all ABIs above; pick it when the architecture is unknown

### Are there iOS, Windows or web versions?
The native app in this repository targets Android. There is a [separate online trial](https://sleepy.qdp.qzz.io); it does not imply the web and native Android feature sets are identical. Native platform support follows the project's published artifacts.

## Import and export

### What if my school is not on the list?
The school-picking page is a national school catalog with an explicit import status per school: a subset carries a routing protocol and imports directly, the rest are catalog registrations whose parsers are not wired yet and are marked as such in-app — "not adapted yet" and "no such school" are now different things. If your school is missing from the catalog, or shows as not adapted and you want to push adaptation forward: first search the full name or alias on the school-picking page, or enter the academic-affairs URL to try identification. If that still fails, open an [Issue](https://github.com/lingion/sleepy/issues/new?template=school_adaptation.yml) with the school adaptation template, providing the school's academic-affairs address, failing page and steps. Never submit login credentials or unredacted personal data.

### I imported successfully from a catalog school that isn't verified — does the maintainer know?
Importing from a catalog entry that has not been verified online pops a success report you can copy in one tap: app version, date, school name, catalog ID, protocol, course count. Nothing is uploaded and no network request is made; the report contains only school-side public facts. Paste it into an Issue or Discussion to confirm the protocol works.

### How does the academic-affairs import work? Are my credentials stored?
The app opens the school's login page in an on-device WebView, the user enters credentials there, and returned schedule pages or API data are parsed. Sleepy does not write academic-affairs credentials into the schedule database. Failure-triage material must also be redacted per the project's adaptation guide.

### Which import formats are supported?
The current parser supports:

- WakeUp share text (`【来自WakeUp课程表】`)
- WakeUp JSON
- iCalendar / ICS
- CSV
- HTML tables
- tab-separated plain text
- the native Sleepy `sleepy-v1` format

The parser detects the format from content; users never pick an internal protocol name first. Legacy WakeUp data formats remain compatible.

### What is `sleepy-v1`?
Sleepy's native plain-text exchange format, carrying a `chk` integrity field used to verify content on import and export. It is not a replacement requirement for the old WakeUp format: existing WakeUp JSON, share text and ICS still import.

### What can I export?
Schedules export as WakeUp-compatible JSON, ICS and `sleepy-v1`; both share entry points (export-page share text and the top-bar share sheet) emit `sleepy-v1` natively, so a shared timetable reads as plain text and the import round-trip is unchanged. On Android 10+ JSON/ICS are written to `Download/Sleepy/`; on Android 8–9 the app cache plus FileProvider sharing is used, and share text and sleepy-v1 go through the system share sheet. Timetables export as JSON or sleepy-v1. ICS files can be handed to the system calendar, Google Calendar or any iCalendar app.

### Can I export to the Xiaoai class table?
Yes. The export page offers "Export to Xiaoai class table": the timetable is generated and validated locally — week range, dates and time-schedule fields — then handed to the Xiaoai (Xiaomi assistant) class-table importer via deep link. The final import experience depends on the Xiaoai client receiving it.

### Can it write to the system calendar directly?
Yes. On the export page pick a writable calendar on the device and a date range, preview, then confirm; calendar read/write permission is requested only at this step. Rescheduled classes and calendar reminders apply. When the device has no Google account or any calendar account and the writable-calendar list is empty, Sleepy creates its own hidden local calendar on demand; incremental fingerprint upsert means re-exporting never wipes your manual edits in the calendar app. The experimental first-period alarm depends on calendar app and account support.

### How do I back up everything or move to a new device?
"General settings → Data migration" exports a `.sleepybackup` containing schedules, timetables, preferences and widget configuration. Restore offers merge or overwrite: merge keeps local schedules and appends, but same-name preference keys take the backup's values; overwrite replaces only the schedule and settings modules present in the package, keeping local values for preference files absent from it. A single schedule's JSON/ICS is not a full backup.

### Which permissions are required?
The school-picker location button requests foreground location on demand; enabling reminders requests notification permission, with pages offering exact-alarm, battery-optimization and do-not-disturb access entries; writing the system calendar requests calendar read/write; in-app update installation requires unknown-source install permission. Ordinary offline schedule viewing asks for none of these optional permissions.

## Schedules, conflicts and timetables

### Can I keep multiple schedules at once?
Yes. Each schedule is stored independently, with its own semester start date, maximum week count and period timetable.

### If two courses overlap in time, is one lost?
No data is deleted just because the interface shows one layer. The conflict layout keeps overlapping courses; tapping a covered area shows the others; manually adding a conflicting course displays weekday, period, weeks and the conflicting course details.

### What can undo revert?
The most recent schedule-data change; redo restores what was just undone. Switching the current schedule is not a data change and never counts as a course-edit record.

### Can period times be calculated automatically?
Yes. Timetables support per-period manual entry and derivation from the first period's start, per-class duration, period count and inter-class break template. Different schedules can bind different timetables. Importing an academic-affairs timetable always creates its time-schedule alongside it.

### Does the week view show dates?
Yes. With "show weekday" enabled, the week view prints the actual date (M/d) next to each course and in the day detail panel — no more counting back from the class week.

### How are long breaks rendered?
A long gap between classes renders as a thin floating band instead of a stretched empty row: row heights stay rigid, course cards next to a band keep full height, meal breaks are marked proportionally to time, and the header can hide the time row.

## Widgets

### Which widgets exist?
There are five widget families now:

1. **Today**: the day's course list
2. **TwoDay**: today and tomorrow in two columns
3. **WeekList**: a weekly course list
4. **WeekView**: a week-grid thumbnail
5. **WeekGrid**: the full period grid

They ship fixed-size variants per launcher; resources currently hold 13 widget configuration XMLs. Rendering uses synchronous `RemoteViews + Canvas`. Management lives on its own "Add or Manage Widgets" page: all variants in an add gallery, launcher previews re-rendered at true scale from the real widget faces, and the refresh button next to the widgets it refreshes.

### Why might widgets be blank on OPPO / OnePlus / ColorOS launchers?
Older versions used Glance's asynchronous SessionWorker, which some ColorOS launchers froze. Since v1.0.29 the main render path is synchronous RemoteViews + Canvas. If a widget still misses refreshes, check launcher permissions, battery limits and notification permission, and refresh the widget manually first.

### Widget colors differ from the app; what do I do?
Theme colors come from the app's theme settings; course colors follow the mode selected under Appearance → Course colors. After the app theme changes, the app broadcasts widget updates; if the launcher still shows old content, remove and re-add the widget, or check system limits on background and launcher components.

## Reminders

### How many minutes ahead can it remind?
Pre-class reminders accept 1 to 999 minutes, not just a few fixed options. Today summary, tomorrow summary and pre-class reminders are configured separately under "Mine → Reminders", and each schedule has its own switch.

### What is the relationship between the banner and Fluid Cloud reminder?
It is an either/or choice: banner is a plain dismissable notification and is naturally wearable-friendly; Fluid Cloud is a promoted live card, experimental, with display depending on system and vendor support. The two are mutually exclusive, and switching back to banner truly stops the cast service. The old pair of switches migrates losslessly.

### Will multiple schedules spam me with reminders?
No. Daily and tomorrow reminders merge all timetables into a single notification sorted by class time; when more than one table contributes, each entry carries a `[timetable]` prefix. Tapping it opens the unified daily agenda, which also accepts a date and jumps straight there.

### Where are the per-timetable reminder switches?
On their own page: Mine → Reminders → Table reminders. All tables and their switches in one list; you can preconfigure while the master switch is off.

### How do I set holidays, swapped rest days and class do-not-disturb?
Holidays and reschedule mappings are managed in general settings; each schedule stores its own reschedules. The reminders page configures date rules independently, and class-time auto do-not-disturb with resume-on-end can be enabled after granting system DND access. Fluid Cloud is experimental; its display depends on system and vendor support.

### Are reminders cloud push?
No. Reminders are scheduled on the device with AlarmManager, offering exact and inexact paths within what the Android version allows; after reboot or app update BootReceiver restores the schedule.

### Will I still get reminders after turning them off?
With the app's master reminder switch off, no new reminders are scheduled; each timetable's own switch can also be turned off individually. Android notification permission remains controlled by system settings; if notifications are intercepted by the system or vendor battery policy, restore the permission in system settings.

## Theme and appearance

### Are dark mode and system dynamic color supported?
"Mine → Appearance & theme" supports following the system, light and dark modes. Android 12+ can use Material You wallpaper-based dynamic color; devices without dynamic color use preset theme colors.

### Can I customize theme colors?
Yes. Custom themes can be created and edited: primary, secondary, tertiary accent and surface tint. Editing and saving the custom theme in use re-applies colors immediately — no need to tap another theme card first and tap back.

### How are course colors decided? Can they follow the theme?
Appearance → Course colors has three modes: Classic keeps the old stable golden-angle HSL scatter unchanged; Follow Theme places course hues on a safe arc of the current theme color, carving out the theme band and the complement band; Custom lets you drag a seed hue once and every course re-harmonizes around it. Hues persist per course group ID, so renaming a course or re-importing a timetable no longer reshuffles colors. The switches are rail-style segmented controls throughout.

### Does selecting a theme card change the card's size?
The selection indicator uses a fixed-size slot; selected and unselected states keep the same card layout size, with the selected state expressed through color hierarchy and a check mark.

## Development, testing and contribution

### How do I build?
JDK 17 is required. Linux / macOS:

```sh
git clone https://github.com/lingion/sleepy.git
cd sleepy
./gradlew assembleDebug
```

On Windows use `gradlew.bat assembleDebug`. The debug APK lands in `app/build/outputs/apk/debug/`; ABI-split builds generate one file per ABI.

### How do I run tests?

```sh
./gradlew testDebugUnitTest
```

Test sources are under `app/src/test/`, covering parsers, schedule data, conflict layout, week calculation, widget logic, theme contracts and import/export modules. Never put real local accounts, academic-affairs sessions or personal schedules into fixtures.

### How do I contribute?
Read `CONTRIBUTING.md` and the matching project SOP first, then submit one well-scoped change. New school adaptations must add protocol evidence, redacted fixtures and tests. Use the project-convention author email `lingion@hrbeu.edu.cn`, and commits carry no Claude attribution trailer.
