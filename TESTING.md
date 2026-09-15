# Testing

## Running

```bash
npm test                 # every workspace (root delegates with --workspaces --if-present)
npm test -w shared       # one workspace
npm test -w worker
cd client && npx vitest   # watch mode while working on client
```

Each workspace has its own `vitest.config.ts` and a `"test": "vitest run"` script.
There is no CI yet - run `npm test` (and `npm run check-types`) before pushing.

## Framework

[Vitest](https://vitest.dev) 5, one config per workspace:

- `shared`, `server`, `worker` - `environment: "node"`.
- `client` - `environment: "jsdom"` with `@testing-library/react` +
  `@testing-library/jest-dom` (matchers loaded from `src/test/setup.ts`).

Vitest resolves the TypeScript sources directly, including the `.js` import
specifiers the codebase uses under `NodeNext` and the `@project/shared` workspace
alias, so tests import from source with no build step.

## Scope

This is a **starter suite on the critical paths**, not blanket coverage. It
targets pure logic and the few places with real bug history; anything needing a
live database, a real RabbitMQ, or a real Firebase project is left to the
end-to-end check in the deploy docs. New behaviour on these paths should land
with a test.

### `shared/` - Zod schemas and date helpers (no mocking)

| File | Covers |
|---|---|
| `schemas/event.schema.test.ts` | the `allDay` discriminated union (timed vs all-day `frequency` sets, forced `reminderMode: "time"`), the `superRefine` cross-rules (`end` after `start`, `reminder` needs `reminderMode`, `"time"` needs `reminderTime`), title bounds, and that `updateEventSchema` keeps the cross-rules on a partial payload |
| `schemas/userPreferences.schema.test.ts` | read schema fills every default from `{ user_id }`; write schema keeps omitted keys absent (deliberately **not** `.partial()` with defaults); `channels` is exactly one entry |
| `schemas/pushDevice.schema.test.ts` | register/unregister token validation and the `browser \| mobile` platform enum |
| `schemas/reminderJob.schema.test.ts` | job round-trips; rejects non-ISO `reminderTime` and unknown `status`; **documents** that `channels: []` passes the schema - which is why the worker repository guards it |
| `utils/weekDates.test.ts` | `dayOfWeek ↔ date` round-trips on JS's `getDay()` convention (0 = Sunday) and `currentWeekRange()` spans Sun 00:00:00.000 → Sat 23:59:59.999 |

### `worker/` - reminder delivery logic (mocked `firebase-admin`, `sql`, RabbitMQ channel)

| File | Covers |
|---|---|
| `integrations/firebase.test.ts` | no tokens → no send, no throw · all-success → no prune · `registration-token-not-registered` → that token pruned · **`invalid-argument` → not pruned** (regression: a bad payload must not wipe a user's tokens) · all-transient-failure → throws (so the consumer retries / DLQs) · partial success → no throw |
| `db/pushDevicesRepository.test.ts` | `findDeviceTokens(userId, [])` returns `[]` without touching `sql` (regression: an empty `channels` must not compile to `platform IN ()`) |
| `consumers/reminderConsumer.test.ts` | muted event → `ack` + skip · not-yet-due → rescheduled + `ack` · event gone → `ack` + skip · send failure under the retry cap → retry scheduled |

### `server/` - request contract and reminder timing

| File | Covers |
|---|---|
| `services/reminderTime.test.ts` | firing time for every `reminderMode` offset (`15m`/`30m`/`1h`/`1d`) and the all-day `"time"` clock-time case |
| `routes/middlewares/validate.middleware.test.ts` | invalid `body`/`params`/`query` → `ValidationError` carrying the schema's message; valid input is replaced with the parsed value on the request |
| `routes/pushDevices.routes.test.ts` | `supertest` with the service layer and `requireAuth` mocked - bad body → `400` in the `{ success: false, error: { code, message } }` envelope; good body → `{ success: true }` |

### `client/` - pure transforms and notification UI state

| File | Covers |
|---|---|
| `utils/userAgent.test.ts` | `isMobileUserAgent()` against representative desktop / mobile UA strings |
| `utils/buildWeekViewData.test.ts` | the events → week-view transform (grouping by `dayOfWeek`, derived "day muted" state) |
| `components/features/settings/NotificationsSection.test.tsx` | the right hint renders for each `permission` (`denied` / `unsupported`) and for a channel that can't reach the current device |

## Conventions

- **UUID literals** - Zod 4's `z.uuid()` enforces the version/variant nibbles, so
  fixtures use real v4-shaped values (`aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`), not
  `0000…0001`.
- **Mocking** - `vi.mock()` for module boundaries only (`firebase-admin`, the
  `postgres` client, the service layer under a route). No mock ever stands in for
  logic under test.
- **No network, no DB** - a test that would need a real Supabase / RabbitMQ /
  Firebase belongs in the manual end-to-end pass (`DEPLOY.md`), not here.

## Deliberately not covered

- Drizzle schema/migration correctness (exercised by `db:migrate` against a real DB).
- The Google Calendar OAuth flow and `@dnd-kit` drag interactions.
- Full-render screen tests and routing in `client`.
- Anything in `worker/src/jobs/orphanFileCleanup.ts` beyond its SQL being reviewed.
