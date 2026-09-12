# SederYom — Technical Spec

> Consolidated from the BRD + FRD. This is the single source of truth for
> implementation. Business rationale lives in the original BRD/FRD; this file
> contains only what's needed to build.

## 1. What it is
Bilingual (he/en) weekly event planner. Current week only (no future/past week
navigation — only archive). Google Calendar read-only sync. Push notifications
via Firebase (FCM), queued through RabbitMQ. Passwordless auth (email + 2FA OTP).

## 2. Stack
- **Frontend:** React 19 (Vite) — React Compiler, Actions, `useActionState`,
  `useTransition`, `useOptimistic`. Tailwind CSS (native `dark:` variant, no
  external design system). `@dnd-kit` for drag & drop. `react-i18next` for i18n.
- **Backend:** Node.js + Express, layered (routes → controllers → services → db).
- **Database:** Supabase (PostgreSQL + Row-Level Security).
- **Auth:** Supabase Auth, passwordless, 2FA OTP (email).
- **Validation:** Zod — shared schemas in `/shared`, inferred types both sides.
- **Queue:** RabbitMQ — `notification_reminders` queue, dedicated worker service.
- **Push:** Firebase Cloud Messaging (free tier). Push-only — no email/SMS, no
  in-app notification surface.
- **Calendar:** Google Calendar API, OAuth 2.0, read-only.

## 3. Data Models

### Event
```
id: UUID
dayOfWeek: number (0-6)
title: string (max 80)
description: string (max 200)
note: string (max 500)
start, end: HH:mm
allDay: bool
freq: "once" | "daily" | "weekly"
reminder: bool
mutedUntilArchive: bool    # default false; suppresses push for this event.
                           # Applies to timed events only — see below.
lead: "15m" | "30m" | "1h" | "1d" | "time"
leadTime: HH:mm            # used when lead === "time"
files: see EventFile below — not embedded; a normalized table, not a jsonb array
gcal: bool                 # true = read-only, from Google Calendar
```

### EventFile (table: `event_files`)
```
id: UUID
eventId: UUID | null       # FK -> events.id, ON DELETE CASCADE. Null = uploaded
                            # but not yet attached to a saved event (see upload flow below)
storagePath: string        # object key in Supabase Storage
filename: string
size: number (bytes)
mimeType: string
uploadedAt: timestamp
UNIQUE(eventId, filename, size)   # duplicate-prevention, enforced at the DB level
```

Files are stored in a normalized table (FK to `events`) rather than as
`jsonb` on the event row. Unlike `ArchivedDay.events` (an immutable
historical snapshot, where `jsonb` is the right fit — see §6, Archive), a live
event's files have their own lifecycle: uploaded, attached, replaced,
orphaned. A real table gives DB-enforced duplicate prevention, indexed
per-user storage-usage queries, and a straightforward orphan cleanup query —
none of which are efficient against a `jsonb` blob scanned per-event.

**Upload flow:** the file is uploaded to Storage as soon as the user picks
it in the form (`POST /files/upload`, `eventId: null`), not deferred to
event-save time — this keeps the form responsive. The upload response
returns a file `id`; `POST /events` / `PATCH /events/:id` accept a
`fileIds: string[]` field to attach those already-uploaded rows to the
event (sets `eventId`). If the form is abandoned before save, the row is
simply left with `eventId: null` — see the cleanup job below.

**On event delete:** `ON DELETE CASCADE` removes the `event_files` rows
automatically, but does **not** touch the Storage objects — the delete
service must fetch each file's `storagePath` before deleting the event and
remove the Storage objects explicitly as part of the same operation.

**Conditional rules — `freq`/`lead` depend on `allDay`** (enforce in the Zod
schema with a discriminated union, not just the base enums above):
- **Timed event** (`allDay: false`): `freq` ∈ `once | daily | weekly`. `lead`
  ∈ `15m | 30m | 1h | 1d | time` (full offset menu).
- **All-day event** (`allDay: true`): `freq` ∈ `once | daily | weekly` — same
  set as timed events (a holiday or a one-off day off is the common case, not
  a daily repeat); form defaults to `once` when the user opens it for an
  all-day event. `lead` is always effectively `time` — a fixed clock-time
  picker (`leadTime`), with **no offset options** (15m/30m/1h/1d are not
  offered).

**Muting.** Two independent actions, both act on timed (non-all-day) events
only — all-day events have no mute control:
- **Mute a day** (Week view, per-day button; also available from Day view) —
  bulk-sets `mutedUntilArchive: true` on every currently-existing timed event
  for that `dayOfWeek`. `PATCH /events/mute-day/:dayOfWeek` (see §9) does this
  in one query, not a client-side loop over individual `PATCH` calls.
  `PATCH /events/unmute-day/:dayOfWeek` does the symmetric bulk-set to
  `false` — same shape, one `UPDATE ... WHERE dayOfWeek = ? AND userId = ?`
  query. Neither touches `event_files`/Storage — there's nothing to clean up
  for a status flip, unlike archiving or clearing a day.
- **Mute a single event** (Day view, per-event control) — sets
  `mutedUntilArchive: true` on that one event via the existing
  `PATCH /events/:id`.

The flag needs no separate "unmute on archive" step: archiving a day deletes
its event rows (§6), so any event created afterward for that `dayOfWeek`
starts fresh at the field's default (`false`).

The notification worker (§10) must check `mutedUntilArchive === false` before
sending a push — an event can be muted after its reminder job was already
enqueued, so the check happens at send time, not just at enqueue time.

**"Day muted" is a derived UI state, not a stored field.** The Week view's
per-day mute indicator/button state is computed, not read from a column: a
day shows as muted only when **every** currently-existing timed event for
that `dayOfWeek` has `mutedUntilArchive === true`. There is no day-level
mute flag in the schema — a separate `muted_days` table was considered and
rejected, precisely because it would have needed its own answer to what
happens to a newly-added event on an already-muted day; deriving the state
from existing events avoids that question entirely.

This has a direct, intended consequence: if a day is fully muted and the
user then adds a new (unmuted) event to it, that day **stops** showing as
muted — even though every previously-existing event on it keeps its own
`mutedUntilArchive: true`. The bulk "mute day" action, if pressed again
afterward, re-applies to all currently-existing timed events and brings the
day back to fully muted. Compute this client-side from the already-fetched
week events (`allMuted = timedEvents.every(e => e.mutedUntilArchive)`) —
no extra endpoint is needed to read it.

### ArchivedDay
```
dayOfWeek: number (0-6)
month: number (0-11)
day: number (1-31)
yr: number
sum: string                # 1-line summary, up to 3 event titles
count: number
events: Event[]
```

### UserPreferences
```
user_id: UUID
language: "he" | "en"      # default "he"
theme: "light" | "dark" | "system"   # default "system"
reminderEnabled: bool      # reserved; not currently surfaced in the Settings UI
channels: string[]         # "browser" | "mobile" — pick one, default "browser"
```
Account-level settings, keyed by `user_id` — persisted server-side, not
`localStorage`. Signing in on a different device/browser restores the same
values, same as the Google Calendar sync toggle: `language` and `theme` are
account configuration, not device state, so they belong alongside the
notification settings in the same table.

Before authentication (Login/2FA screens), there's no `user_id` yet to key
this on — `language` there falls back to browser language (or `he` if
undetected) and `theme` to `prefers-color-scheme`. Once signed in, the
stored `UserPreferences` values take over and apply everywhere, including
future sessions on other devices.

### PushDevice (table: `push_devices`)
```
token: string              # FCM registration token, primary key
user_id: UUID              # FK -> auth.users.id, ON DELETE CASCADE
platform: "browser" | "mobile"   # derived client-side from the user agent
userAgent: string | null
createdAt, lastSeenAt: timestamp
```
One row per registered device token. The client obtains the token via the
Firebase Messaging SDK after the user grants notification permission and
`POST`s it here; it's removed on sign-out. The notification worker (§10)
looks up a user's tokens filtered by the `channels` value in
`UserPreferences` (a single choice), so a user whose `platform` never
matches their chosen channel simply receives no push.

## 4. Validation Rules
| Field | Rule | Error (He) | Error (En) |
|---|---|---|---|
| Email | valid format | כתובת דוא"ל לא תקינה | Invalid email address |
| 2FA code | exactly 6 digits | קוד חייב להיות 6 ספרות | Code must be 6 digits |
| Title | required, ≤80 chars | כותרת נדרשת | Title is required |
| Description | ≤200 chars | — | — |
| Note | ≤500 chars | — | — |
| start/end | start < end (unless allDay) | שעת סיום חייבת להיות אחרי שעת התחלה | End time must be after start time |
| File size | ≤10MB/file | גודל הקובץ חייב להיות פחות מ-10 MB | File size must be under 10 MB |
| File count | ≤5/event, ≤25MB total | מקסימום 5 קבצים לאירוע | Maximum 5 files per event |
| File dup | same name+size rejected | קובץ זה כבר קיים באירוע זה | This file already exists in this event |

Description/Note UI: clamp to 2 lines with "show more" **only** when combined
length > 80 chars. Titles never clamp — always full, wrapping.

Allowed file types: PNG, JPG, WebP, PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, CSV, TXT.

## 5. Screens (see design README for full layout detail)
1. **Login** — email entry
2. **2FA** — 6-digit code entry
3. **Week** (home) — 7-day grid, today highlighted, nearest event per day,
   per-day mute-all button (mutes all timed events for that day)
4. **Day** — full event list, drag-to-reschedule, per-event mute toggle on
   each timed event, ⋯ menu (mute-day/archive/clear/open archive)
5. **Archive** — searchable list, lazy-loaded (12/page in design, 50/page per API — see §9 note)
6. **Archive Day** — read-only day view
7. **Settings** — language, theme, Google sync, notification channel, sign
   out. The first four are all `UserPreferences` fields (or the Google sync
   toggle, stored separately) — account-level, not device-local; sign out is
   an action, not a stored setting.

Overlays:
- **Event form dialog** (create/edit) — fields differ for timed vs. all-day
  events; see §3 conditional rules.
- **Detail popup (all-day event)** — opened via an ⓘ info button on an
  all-day row (all-day rows show only icon + title in the day list itself).
  Shows description/note/attachments in full. Footer has Delete + Edit for
  local events only; Google-synced events show no footer.
- **Confirm dialog (generic)** — reused for archive/delete/clear/sign-out.

Attachments render as clickable download links (`<a download>`) wherever
shown — day list file chips and the detail popup's attachment rows alike.

## 6. Archive — Lazy Loading & Creating an Archived Day
**Reading (lazy load):**
- Backend page size: 50 days/request (`GET /archive?limit=50&offset=0&search=`)
- Response: `{ days: ArchivedDay[], total_count: number, has_more: bool }`
- Frontend caches loaded pages in React state — no refetch on scroll up/down
- Search filters client-side on cached results before hitting backend
- Index: `CREATE INDEX ON archived_days(user_id DESC, yr DESC, mon DESC, day DESC)`
- Target query time: < 50ms

**Creating an archived day** (triggered by the archive button on Week/Day):
`POST /archive/:dayOfWeek` copies that day's events into a new `ArchivedDay`
row (`sum`, `count`, and a full `events` snapshot), then deletes the original
rows from the active `events` table — copy-then-delete, not a soft-delete
flag. Both steps run inside a single DB transaction: if the delete fails, the
archive insert rolls back too, so the day is never left half-archived.

Keeping `events` limited to the current week (rather than flagging old rows
in place) keeps the hot path — `GET /events`, hit on every home-screen load —
fast regardless of how much archive history a user accumulates, and lets
`archived_days` be indexed/partitioned independently for scale.

Google-synced events (`gcal: true`) are not included in the snapshot — they
remain live in Google Calendar and are re-fetched from there when an archived
day is viewed, rather than being duplicated into the archive.

> Note: design prototype uses a page size of 12 for its own demo pacing — build
> against the API contract above (50), not the prototype's demo constant.

## 7. Clearing a Day (bulk delete)
`DELETE /events/day/:dayOfWeek` — this is the "Clear" action in the Day
view's ⋯ menu (§5). Deletes every event for that `dayOfWeek` permanently
(unlike archiving — nothing is kept). Same transactional shape as archiving
a day (§6), applied to deletion instead of copy-then-delete:

1. **One indexed DB query** fetches all events (and their `event_files` rows'
   `storagePath`s) for that `dayOfWeek`, scoped to `user_id`
2. **Single transaction**: delete the `event_files` rows, then the `events`
   rows — all-or-nothing; if either delete fails, the whole operation rolls
   back, so a day is never left partially cleared
3. **Batched Storage cleanup**: the collected `storagePath`s are deleted from
   Supabase Storage as one batch call (not one request per file) — this
   happens after the DB transaction commits, since Storage isn't part of the
   Postgres transaction
4. **One network request from the client** — the whole clear action is a
   single `DELETE`, not a loop of per-event deletes

## 8. Orphan File Storage Cleanup (worker job)
A scheduled job (cron-style, not a RabbitMQ consumer — it's periodic
maintenance, not event-driven) run daily by the worker service:
```
DELETE FROM event_files
WHERE eventId IS NULL AND uploadedAt < NOW() - INTERVAL '24 hours'
RETURNING storagePath
```
For each returned `storagePath`, delete the corresponding object from
Supabase Storage. The 24h grace window avoids deleting a file the user is
still actively filling out a form for. This keeps Storage usage bounded to
files that are actually referenced by a saved event, rather than growing
indefinitely from abandoned uploads.

## 9. API (`/api/v1`)
```
POST   /auth/login                    { email }
POST   /auth/verify                   { email, code }
GET    /events                        current week, RLS-scoped
POST   /events                        create — enqueues reminder job if reminder=true
PATCH  /events/:id
PATCH  /events/mute-day/:dayOfWeek    bulk-mute all timed events for that day (one query)
PATCH  /events/unmute-day/:dayOfWeek  bulk-unmute — symmetric, one query, no Storage involved
DELETE /events/:id
DELETE /events/day/:dayOfWeek         clear a day — deletes all its events + files (transactional, batched, see §7)
GET    /archive?limit=50&offset=0&search=
POST   /archive/:dayOfWeek            archive a day — copies events, then deletes originals (transactional)
GET    /gcal/events                   read-only
POST   /files/upload                  upload a file, returns id; eventId set later via fileIds on events
POST   /preferences                   sets language/theme/reminderEnabled/channels (any subset)
GET    /preferences                   returns the caller's UserPreferences
POST   /devices                       { token, platform } — register/refresh an FCM device token
DELETE /devices                       { token } — remove a device token (called on sign-out)
```
All responses: `{ success: true, data }` or `{ success: false, error: { message, code } }`.

## 10. Notification Worker (RabbitMQ)
1. Event created with `reminder=true` → API publishes job to `notification_reminders`
2. Worker (separate Node.js service) consumes, re-fetches the event and checks
   `NOW >= reminderTime` **and** `mutedUntilArchive === false` and the event
   still exists — mute/delete after enqueue must still suppress the send
3. On due (and not muted): send push via FCM → mark `sent`, ack message
4. On failure: retry w/ exponential backoff (max 3) → then `failed` + DLQ

Job format:
```
{ eventId, userId, eventTitle, reminderTime, channels: ["browser"|"mobile"], status }
```

## 11. Localization
- UI: he/en, driven by `lang` state
- User-entered content: **not** localized (stored as-is)
- All system/error strings: localized both languages, required
- RTL: `dir="rtl"` (he) / `dir="ltr"` (en) — use logical CSS properties
  (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start/end`) so mirroring is automatic
- Directional icons (chevrons) must mirror in RTL — applies to icon
  glyphs/SVGs; plain text arrow characters used as nav affordances are
  acceptable as-is and need no mirroring

## 12. Performance & Optimization
**Frontend:**
- React 19 Compiler handles memoization automatically — no manual `useMemo`/
  `useCallback` for this. Don't hand-roll memoization the compiler already covers.
- Route/screen-level code splitting with `React.lazy` + `<Suspense>` — each
  of the 8 screens (§5) loads as its own chunk, not one bundle.
- `useTransition` for navigation between screens (Week↔Day↔Archive) so the
  UI stays responsive during the transition.
- Optimistic UI for mute/archive/create actions (§3 Muting, §6 Archive) — the
  UI updates before the server confirms, via TanStack Query `onMutate` cache
  updates or `useOptimistic` (implementer's choice).
- Archive lazy-loading (§6): loaded pages cached in React state, no refetch
  on scroll up/down; search filters the client-side cache first.

**Backend:**
- DB indexing on every filtered/sorted path: `archived_days` composite index
  (§6), plus standard indexes on `events(user_id, dayOfWeek)` and
  `event_files(eventId)`.
- Rate limiting: 100 req/min/user.
- Archive query target: < 50ms (§6).
- Bulk day operations (mute-day/unmute-day §3, clear-day §7, archive-day §6)
  are each a single indexed query/transaction — never a client-side loop
  over per-item requests, which is what actually protects these paths at
  scale as event counts grow.

**Overall targets:** page load < 2s. JWT in httpOnly cookie, RLS on all
Supabase tables, all inputs Zod-validated. Responsive: mobile <640px (1 col)
/ tablet 640–1024px (3–4 col) / desktop >1024px (4-col week grid, matching
the design handoff).

## 13. Session Expiry & Re-authentication
Since the JWT lives in an httpOnly cookie, client-side JS can't read it or
proactively check its expiry — the only reliable signal that a session has
lapsed is the API rejecting a request. Unauthenticated visitors can still
browse the app shell — Week/Day/Archive/Settings render normally, just with
no data — so people get a taste of the app before being pushed to log in.
The Login screen only appears once they attempt something that actually
needs a session:

- Only **mutations** (`useMutation` — user-initiated actions: mute, create/
  edit/delete an event, archive/clear a day, update a setting, sign out,
  etc.) participate in the auth-redirect check, via the shared `QueryClient`'s
  global `MutationCache` `onError` handler. A failed background **query**
  (e.g. a screen's initial data fetch on mount) never triggers anything —
  that screen just renders with no data, same as it would for a genuinely
  empty account.
- Any mutation failing with **HTTP 401** and `code: "UNAUTHENTICATED"`
  triggers the same handler, regardless of which mutation or which screen
  made the call — except `POST /auth/login` and `POST /auth/verify`
  themselves, which also 401/`UNAUTHENTICATED` for "wrong credentials" (a
  bad email, a mistyped 2FA code), not "session gone", and are excluded.
- The handler clears any local auth/user state (the query cache) and sends
  the user to the **Login** screen (§5) — not straight to 2FA, since an
  expired/missing session means the client can no longer assume which email
  it was for.
- After a successful re-login, the user lands on **Week View** (home) —
  there's no deep-linking to preserve; every other screen is reachable from
  there in one or two taps, so returning to a specific prior screen isn't
  worth the extra state.
- This is the same mechanism whether it's a first-time visitor with no
  session yet, or a mid-session cookie expiry while the user is active — the
  first write action either kind of user attempts is what surfaces it, not
  a passive page load.

## 14. Design Reference
Full visual spec (tokens, per-screen layout, state shape, copy) lives in
`design_handoff_sederyom/README.md`. Read **only** that file — the accompanying
`.dc.html`/`support.js` in the same folder are a non-runnable prototype
reference and should not be read or ported line-by-line.
