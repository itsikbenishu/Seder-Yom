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
titleHe, titleEn: string (max 80)
descHe, descEn: string (max 200)
note: string (max 500)
start, end: HH:mm
allDay: bool
freq: "once" | "daily" | "weekly"
reminder: bool
lead: "15m" | "30m" | "1h" | "1d" | "time"
leadTime: HH:mm            # used when lead === "time"
files: File[]              # max 5, 10MB/file, 25MB total
gcal: bool                 # true = read-only, from Google Calendar
```

**Conditional rules — `freq`/`lead` depend on `allDay`** (enforce in the Zod
schema with a discriminated union, not just the base enums above):
- **Timed event** (`allDay: false`): `freq` ∈ `once | daily | weekly`. `lead`
  ∈ `15m | 30m | 1h | 1d | time` (full offset menu).
- **All-day event** (`allDay: true`): `freq` ∈ `daily | weekly` only — **no
  `once`**; form defaults to `daily` when the user opens it for an all-day
  event. `lead` is always effectively `time` — a fixed clock-time picker
  (`leadTime`), with **no offset options** (15m/30m/1h/1d are not offered).

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

### NotificationPreferences
```
user_id: UUID
reminderEnabled: bool
channels: string[]         # "browser" | "mobile" — pick one, default "browser"
```

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
3. **Week** (home) — 7-day grid, today highlighted, nearest event per day
4. **Day** — full event list, drag-to-reschedule, ⋯ menu (mute/archive/clear/open archive)
5. **Archive** — searchable list, lazy-loaded (12/page in design, 50/page per API — see §7 note)
6. **Archive Day** — read-only day view
7. **Settings** — language, theme, Google sync, notification channel, sign out

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

## 6. Archive — Lazy Loading
- Backend page size: 50 days/request (`GET /archive?limit=50&offset=0&search=`)
- Response: `{ days: ArchivedDay[], total_count: number, has_more: bool }`
- Frontend caches loaded pages in React state — no refetch on scroll up/down
- Search filters client-side on cached results before hitting backend
- Index: `CREATE INDEX ON archived_days(user_id DESC, yr DESC, mon DESC, day DESC)`
- Target query time: < 50ms

> Note: design prototype uses a page size of 12 for its own demo pacing — build
> against the API contract above (50), not the prototype's demo constant.

## 7. API (`/api/v1`)
```
POST   /auth/login                    { email }
POST   /auth/verify                   { email, code }
GET    /events                        current week, RLS-scoped
POST   /events                        create — enqueues reminder job if reminder=true
PATCH  /events/:id
DELETE /events/:id
GET    /archive?limit=50&offset=0&search=
GET    /gcal/events                   read-only
POST   /notifications/preferences
GET    /notifications/preferences
```
All responses: `{ success: true, data }` or `{ success: false, error: { message, code } }`.

## 8. Notification Worker (RabbitMQ)
1. Event created with `reminder=true` → API publishes job to `notification_reminders`
2. Worker (separate Node.js service) consumes, checks `NOW >= reminderTime`
3. On due: send push via FCM → mark `sent`, ack message
4. On failure: retry w/ exponential backoff (max 3) → then `failed` + DLQ

Job format:
```
{ eventId, userId, eventTitle, reminderTime, channels: ["browser"|"mobile"], status }
```

## 9. Localization
- UI: he/en, driven by `lang` state
- User-entered content: **not** localized (stored as-is)
- All system/error strings: localized both languages, required
- RTL: `dir="rtl"` (he) / `dir="ltr"` (en) — use logical CSS properties
  (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start/end`) so mirroring is automatic
- Directional icons (chevrons) must mirror in RTL

## 10. Non-Functional
- Page load < 2s
- Rate limit: 100 req/min/user
- JWT in httpOnly cookie, RLS on all Supabase tables, all inputs Zod-validated
- Responsive: mobile <640px (1 col) / tablet 640–1024px (3–4 col) / desktop >1024px (7-col week grid)

## 11. Design Reference
Full visual spec (tokens, per-screen layout, state shape, copy) lives in
`design_handoff_sederyom/README.md`. Read **only** that file — the accompanying
`.dc.html`/`support.js` in the same folder are a non-runnable prototype
reference and should not be read or ported line-by-line.
