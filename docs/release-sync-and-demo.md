Sleepy-site release synchronization and complete original web app embedding

The homepage embeds the existing complete sleepy-web site and its original UI. Both the iframe source and the separate “Open full web app” link use exactly `https://sleepy.is-my.app/preview/`. The URL has no query parameters or fragment, including no demo, embed or theme parameter. The iframe has no sandbox attribute. The host does not observe its own theme to rewrite the iframe URL or reload the web app.

The original web app controls its own UI, features, navigation, theme, browser storage and settings. sleepy-site does not modify sleepy-web or provide an isolated, reduced or demo-specific version. Chinese and English captions both identify the complete web app.

The existing Material palette remains the visual source: primary #604BBF, on-primary #FFFFFF, primary-container #E6DEFF, on-surface-variant #48454E. Inter Variable and the existing Chinese system font remain unchanged. The hero CSS remains unchanged.

Layout invariants:

The original hero visual contains the full web app. Introduction and download actions stay first in the DOM. Desktop keeps them on the left and the web app on the right. At widths of 840 pixels or less, they stack in that same order. The iframe retains full container width and `block-size: clamp(580px, 72vh, 760px)`. The mobile visual container retains `inline-size: min(100%, 420px)`.

Desktop:

```text
+-----------------------------------+-------------------------------+
| Introduction and download actions | Complete original web app     |
+-----------------------------------+-------------------------------+
```

Mobile:

```text
+-----------------------------------+
| Introduction and download actions |
+-----------------------------------+
| Complete original web app         |
+-----------------------------------+
```

The homepage has eight sections in total: hero, views, connect, schoolCard, reminders, gallery, trust, download. The seven sections after hero retain that order. Complete release notes remain on `/releases/` and `/en/releases/`, linked from desktop and mobile navigation and the footer. Release notes stay off the homepage.

Release synchronization remains unchanged. A published release triggers a complete, validated deployment using one release tag and immutable source commit. The existing release synchronization workflow, generated metadata, download surfaces and dedicated bilingual release pages remain in place.

Completion conditions:

1. Both homepages embed the complete original web app and open that same original URL in a new tab. Neither entry adds query parameters, sandbox restrictions or host theme rewriting.
2. Hero dimensions, visual position and all eight homepage sections retain the existing layout and order. Complete upstream bilingual notes and evidence anchors remain on the dedicated release pages.
3. Release synchronization and its validation continue to use one release tag and source commit. This change stays within sleepy-site and leaves sleepy-web and the Sleepy main repository untouched.

The built-page contracts in `tests/page.index.test.ts` and `tests/page.en.test.ts` lock the original URL, absence of query parameters and sandbox, absence of URL theme rewriting, complete web app copy and hero position. The existing release tests retain the dedicated pages and synchronized release metadata. Build before running the page tests so they inspect the current implementation.
