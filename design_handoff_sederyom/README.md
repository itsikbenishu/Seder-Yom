# Handoff: SederYom — bilingual day/week event manager

## Overview
SederYom (סֵדֶר יוֹם, "order of the day") is a bilingual (Hebrew RTL / English LTR) day-and-week
personal event planner with Google Calendar sync, per-event push reminders, an archive of past days,
and full new/edit-event flows. This package documents the design so it can be rebuilt in a real codebase.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype that shows the
intended look and behavior. They are **not production code to copy directly**. `SederYom.dc.html` is a
"Design Component" authored in a proprietary template runtime (`support.js`); the `{{ … }}` holes,
`<sc-if>`/`<sc-for>` tags and `class Component extends DCLogic` are runtime-specific and will not run in a
normal app.

Your task is to **recreate these designs in the target codebase's existing environment** (React, Vue,
Svelte, SwiftUI, etc.) using its established patterns, component library, i18n and state tooling. If no
environment exists yet, choose the most appropriate framework and implement there. Treat the HTML as the
source of truth for layout, spacing, color, copy and interaction — not as code to port line-by-line.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy and interactions are all present. Recreate the
UI pixel-accurately using the codebase's own primitives. All styling is Tailwind CSS utility classes
(loaded from the Tailwind CDN in the prototype) with `darkMode: 'class'`; the class names in the HTML map
directly to Tailwind tokens, so a Tailwind-based target can reuse them almost verbatim.

> Note on design systems: the project has two design systems (Classical, Nocturne) *nominally* bound, but
> by explicit product decision this prototype does **not** use them — it is plain Tailwind with a custom
> light/dark theme. Build against the Tailwind classes documented here, not those design systems.

## App shell / chrome
A top toolbar (prototype-only harness — **do not ship as-is**) carries four segmented toggles:
Desktop/Mobile (viewport preview), עברית/EN (language), Light/Dark (theme). In a real app, language and
theme belong in Settings (both already exist there); the viewport toggle is purely a preview device and
should be dropped — responsiveness comes from CSS breakpoints.

The app renders inside a single full-height flex column: `bg-slate-50 dark:bg-slate-950`,
`text-slate-800 dark:text-slate-100`, font Inter. Direction is `dir="rtl"` in Hebrew, `dir="ltr"` in
English — use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start/end`) so mirroring is automatic.

## Screens / Views
There are **7 screens**, switched by a single `screen` state value: `login`, `twofa`, `week`, `day`,
`archive`, `archiveDay`, `settings`. Plus two overlays: the event form dialog and a generic confirm dialog.

### 1. Login (`login`)
- **Purpose**: enter email to receive a one-time code.
- **Layout**: centered column, `320px` max-width. App icon tile (`h-12 w-12 rounded-xl` accent-filled),
  app name (`text-2xl font-semibold`), tagline (`text-sm text-slate-500`), email input, full-width primary button.
- **Validation**: email must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid shows an error toast. Input capped 120 chars.

### 2. Two-factor (`twofa`)
- **Purpose**: enter the 6-digit code.
- **Layout**: same centered column. Title, "code sent to {email}" line, one centered code input
  (`text-xl tracking-[0.5em]`, `maxlength=6`, digits only via `replace(/\D/g,'')`), verify button.

### 3. Week (`week`) — home
- **Purpose**: see the whole week at a glance; open a day.
- **Header**: kicker + `weekTitle` (`text-2xl font-semibold`) on the start side; Settings and Archive
  icon-buttons on the end side.
- **Grid**: `weekGridClass` = 4 columns per row on desktop (`grid grid-cols-4 gap-3`), 1 column on mobile.
  7 day-cards.
- **Day card**: bordered surface (`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`,
  `rounded-xl`, `p-3.5`). Today's card uses the accent-soft background instead. Header row: day-of-week
  (`font-semibold text-[15px]`) + date number (muted), a "Today" accent tag if today, a muted amber
  "muted" chip if the day is muted. Body: nearest future event as `HH:MM · title`, or a muted "no events"
  line. Muted days render at `opacity-70`.
- **Interactions**: click a card → open Day. (Mute/archive live on the Day screen's ⋯ menu, not here.)

### 4. Day (`day`)
- **Purpose**: view/manage one day's events.
- **Header** (symmetrical): back-to-week icon button | ‹ prev-day (chevron) | centered day title (kicker
  day-of-week in accent + `text-xl font-semibold` date) | next-day chevron › | ⋯ menu button. Chevrons
  mirror in RTL via an inline `transform: scaleX(-1)` style (`backIconStyle`/`fwdIconStyle`).
- **⋯ menu**: dropdown with Mute/Unmute (toggles day; bell-off icon on the ⋯ button turns amber when
  muted), Archive day, Clear all events, Open archive. Each destructive item opens a confirm dialog.
- **Event list**: scrollable. Each event is a bordered row (`rowClass`): time column (start/end,
  `text-align` follows language), then title (`font-semibold text-[16px]`, always wraps fully —
  `break-words [overflow-wrap:anywhere]`, never clamped), optional "Next up" accent tag, description and
  note (clamped to 2 lines with a "show more"/"show less" toggle **only** when combined length > 80 chars),
  file chips, and metadata (Google-synced badge, reminder lead label). File chips are clickable links
  (`<a download>` to an object URL) that open/download the attachment and show its name. Google-synced
  events (`gcal: true`) are read-only: muted surface (`bg-slate-50 dark:bg-slate-800/40`), not draggable,
  no edit/delete. Local events are editable, deletable, and drag-to-reschedule.
- **All-day events** render separately, above the timed list, as **minimal single-line rows**: calendar
  icon + title (truncated, never wraps) + optional Google badge + an ⓘ info button. All other detail is
  hidden until the ⓘ button opens the **detail popup** (see Overlays). This keeps the day compact.
- **Footer**: full-width primary "+ Add event" button.
- **Empty day**: shows a muted empty state.

### 5. Archive (`archive`)
- **Purpose**: browse past archived days.
- **Header**: back icon, "Archive" title, search input (`ps-9` with a leading magnifier icon) that filters
  by day-of-week name and summary text.
- **List**: **lazy-loaded** — renders 12 records at a time; scrolling within ~160px of the bottom appends
  12 more, with a spinning "Loading more…" indicator while `archiveHasMore`. Page count resets to 12 on
  every entry into the archive and on every search keystroke. Each record is a clickable row: day-of-week
  kicker, full date with year, event-count, one-line summary of up to 3 event titles. Empty state:
  centered "No archived days found".
- **Data**: archive is live in state (`archAdded` prepended to seed `arch`), not static — archiving a day
  creates a record visible immediately.

### 6. Archive day (`archiveDay`)
- **Purpose**: read-only view of one archived day.
- **Layout**: like Day but no add/edit/delete/drag. Header back-to-archive icon, day title, an outlined
  "archived" tag. Events render as read-only rows.

### 7. Settings (`settings`)
- **Purpose**: preferences + sign out.
- **Sections** (each: `text-[11px] uppercase tracking-[0.08em]` label + a segmented control):
  - **Language**: עברית / English.
  - **Appearance**: Light / Dark.
  - **Google Calendar sync**: On / Off segmented control + a "reconnect" secondary button + a note.
  - **Notifications**: **Browser / Mobile** segmented control (push destination — one, not both). Note text:
    "Alerts are sent as push notifications (Firebase). Choose where to receive them — no alerts appear
    inside the app itself." Default: `browser`. (There is deliberately **no** email/SMS channel and **no**
    in-app notification.)
  - **Sign out**: secondary button → confirm dialog.
- Column is `max-w-[540px]`.

## Overlays

### Event form dialog (new / edit / all-day)
- Modal over `bg-slate-900/50 dark:bg-black/60` backdrop; click backdrop to close, click card stops propagation.
- Card has a flex header (title + ghost close button), a **scrollable body** (`overflow-auto`, custom
  themed thin scrollbar `.sy-scroll`), and a **sticky footer** so the save/cancel buttons stay visible.
- Fields: Title (span full width), All-day toggle, Start/End time (with `start < end` validation — invalid
  field turns red), Frequency segmented, Reminder On/Off + lead control, Description, Note (textarea),
  Attachments.
- **All-day vs timed differ**: for a **timed** event the frequency offers once/daily/weekly and the
  reminder is a lead-time select (`15m`/`30m`/`1h`/`1d`/same-day-at-hour). For an **all-day** event the
  frequency offers only **daily/weekly** (no "once") and the reminder is a **fixed clock-time picker**
  only (`<input type="time">`, no lead-time offset). Opening the form for an all-day event defaults its
  frequency to daily.
- **Field caps**: title ≤ 80 chars, description ≤ 200, note ≤ 500 (enforced via `slice()` **and** HTML
  `maxlength`).
- **Attachments**: up to **5 files**, **10 MB per file**, **25 MB total**. Allowed types: images
  (PNG/JPG/WebP), PDF, Office (DOC/DOCX, XLS/XLSX, PPT/PPTX, CSV, TXT). Duplicate (same name+size) blocked;
  rejected files (bad type/size) show an error. Files display as compact wrapping chips with a count badge;
  no internal scroll within the file list.

### Detail popup (all-day event)
Opened from an all-day row's ⓘ button. Centered modal card (`440px`, `max-h-86%`, scrollable body with
the themed `.sy-scroll`). Header: time/all-day kicker + title. Body: tag row (Google badge, reminder
lead, repeat frequency), Description section, Note section, and an **Attachments** list where each file
is a full-width clickable row (icon + name + human size) that opens/downloads it. Footer (local events
only): Delete (ghost, start-aligned) + Edit (secondary) — both close the popup; Edit opens the event form.
Google events show no footer.

### Confirm dialog (generic)
Reused for archive, delete-event, clear-all-events, and sign-out. Title + body explaining the consequence
+ Cancel / confirm. Destructive actions render the confirm button in a danger (rose) style. Toast on completion.

## Interactions & Behavior
- **Navigation**: all screen changes are `screen` state assignments; no router in the prototype (add one in production).
- **Prev/next day**: `(selDay ± 1) mod 7`.
- **Drag to reschedule**: local (non-Google) events are draggable to change time.
- **Toasts**: transient bottom messages, animated in via `@keyframes syToast` (opacity + 8px translateY).
- **Text clamping**: titles never clamp (always full, wrapping); description+note clamp to 2 lines
  (`line-clamp-2`) with a toggle only when combined length > 80.
- **Mute**: per-day; sets `opacity-70` on the week card and an amber bell-off indicator on the Day ⋯ button.
- **Archive lazy loading**: `archLimit` starts at 12, grows by 12 on near-bottom scroll; resets on
  archive-open and on search input.
- **Responsive**: week grid 4-up (desktop) vs 1-up (mobile); form grid collapses to single column on mobile.

## State Management
Key state fields (from the prototype's `this.state`):
- `screen` — active view (`login|twofa|week|day|archive|archiveDay|settings`).
- `lang` — `he|en`; drives `dir` and all copy.
- `mode` — `light|dark` (theme; toggles `.dark` class).
- `device` — `desktop|mobile` (**preview-only; drop in production**).
- `authed` — auth gate.
- `email`, `code` — login fields.
- `selDay` — 0–6 index of the open day.
- `muted` — `{ [dayIndex]: boolean }`.
- `search` — archive filter string.
- `gcal` — Google Calendar sync on/off.
- `notif` — `browser|mobile` push destination.
- `expanded` — `{ [eventId]: boolean }` for desc/note show-more.
- `archAdded` — array of archive records created this session (prepended to seed data).
- `archLimit` — archive lazy-load page size (starts 12).
- `events` — the event list; each event: `{id, day, start, end, titleHe, titleEn, allDay, gcal, freq,
  reminder, lead, descHe, descEn, note, files[]}`.
- `dialogOpen` / `confirm` / `dayMenu` — overlay/menu visibility.

**Data fetching (production)**: replace the seed arrays with API calls — week events, archive
(paginated/infinite-query to back the lazy list), Google Calendar sync, and Firebase push registration.

## Design Tokens
All values are Tailwind classes; hex values below are the corresponding Tailwind palette colors.

**Fonts**: Inter (400/500/600/700), fallback `ui-sans-serif, system-ui, sans-serif`.

**Ground / text**:
- Light: bg `slate-50` #f8fafc, surface `white` #ffffff, border `slate-200` #e2e8f0, text `slate-800` #1e293b, muted `slate-500` #64748b.
- Dark: bg `slate-950` #020617, surface `slate-900` #0f172a, border `slate-800` #1e293b, text `slate-100` #f1f5f9, muted `slate-400` #94a3b8.

**Accent** (tweakable enum, default `violet`; options `indigo | violet | emerald | rose`). Each accent role:
- `solid`: `bg-{c}-600 hover:bg-{c}-500` (used for primary buttons and the app icon tile).
- `text`: `text-{c}-600 dark:text-{c}-400` (kickers, "Next up").
- `soft`: `bg-{c}-50 dark:bg-{c}-500/10 border-{c}-300 dark:border-{c}-500/40` (today card, next-up row).
- `dot`, `tag`, `softText` variants for chips.
- Palette hexes — indigo 600 #4f46e5 / violet 600 #7c3aed / emerald 600 #059669 / rose 600 #e11d48.
- Danger uses the rose ramp regardless of accent.
- Muted-day chip: amber (`bg-amber-100 text-amber-700`).

**Typography scale**: page titles `text-2xl` (24px) semibold; screen titles `text-xl` (20px) semibold;
event title `text-[16px]`; body `text-sm` (14px); labels `text-xs` (12px); kickers/eyebrows `text-[10px]–[11px]`
uppercase with `tracking-[0.08em]–[0.12em]`.

**Spacing / radius / density**: density is a tweakable enum (`comfortable | compact`, default comfortable):
comfortable → `rounded-xl` + `p-3.5` + larger gaps; compact → `rounded-lg` + `p-2.5` + tighter gaps.
Buttons `rounded-lg px-3.5 py-2`; icon buttons `h-9 w-9`. Inputs `rounded-lg border px-3 py-2 text-sm`,
focus border darkens (no default blue ring).

**Segmented control**: `inline-flex gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800`; the active
option gets a raised white/slate chip.

**Scrollbar** (`.sy-scroll`): thin; thumb `#cbd5e1` (light) / `#334155` (dark), transparent track.

**Animation**: `syToast` keyframe (opacity 0→1, translateY 8px→0).

## Tweakable props (root component)
Declared for the prototype; expose as theming config in production:
- `accent`: enum `indigo|violet|emerald|rose` (default `violet`).
- `defaultMode`: enum `light|dark` (default `dark`).
- `density`: enum `comfortable|compact` (default `comfortable`).

## Assets
- **Icons**: inline hand-authored SVGs (stroke `currentColor`, `stroke-width` ~1.6–1.8) — sun, moon, gear,
  archive box, chevrons, search, bell/bell-off, close, sign-out, etc. In production substitute your icon
  library (e.g. Lucide/Phosphor) at matching sizes (14–16px in UI, 24px for the app tile).
- **Fonts**: Inter via Google Fonts.
- **No raster images** in the design.

## Files
- `SederYom.dc.html` — the full design (all 7 screens + overlays, all logic and copy). Read the template
  markup for exact structure and the `T()` method for all Hebrew/English strings.
- `support.js` — the prototype runtime (proprietary; **reference only**, do not ship).

## Localization
Every string exists in Hebrew and English inside the `T()` method (keyed getter returning `he ? '…' : '…'`).
Extract these into your i18n system. Remember RTL: use logical CSS properties and mirror directional icons
(chevrons) as the prototype does.

## Notifications (production intent)
Push only, via **Firebase Cloud Messaging**, to **browser or mobile** (user picks one). No email, no SMS,
and **no in-app notification surface** — the app never shows its own alert UI; it only registers the push
destination and sends reminders through FCM based on each event's reminder lead time.
