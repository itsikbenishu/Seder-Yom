# Deploy

SederYom self-hosts with Docker Compose. Two things stay external and managed:

- **Supabase** — Postgres, Storage, and Auth.
- **Firebase** — Cloud Messaging (push).

`docker compose` builds and runs four app containers plus RabbitMQ and Redis:

| Service | Port | Notes |
|---|---|---|
| `client` | `8080` → 80 | nginx serving the built SPA; proxies `/api/v1` to `server` |
| `server` | `3000` | Express API (`tsx`, no build step) |
| `worker` | — | RabbitMQ consumer + daily cleanup cron |
| `rabbitmq` | `5672`, `15672` | management UI on 15672 (guest/guest) |
| `redis` | `6379` | present in compose; not currently used by app code |

## 1. Environment files

Three files, none committed (all `.env*` are gitignored except `.env.example`).

### `server/.env` — from `server/.env.example`
Supabase Postgres connection, `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`,
Google OAuth creds, and **`CORS_ORIGIN=http://localhost:8080`** (the client
origin). `RABBITMQ_URL` here is ignored under compose — the compose file points
the container at `amqp://guest:guest@rabbitmq:5672`.

### `worker/.env` — from `worker/.env.example`
Same Supabase Postgres block, `SUPABASE_*` for Storage cleanup, and
`FIREBASE_SERVICE_ACCOUNT_JSON` (the Admin SDK service-account JSON minified to
one line). `RABBITMQ_URL` is likewise overridden by compose.

### `.env` at the repo root — for `docker compose` build args
Vite inlines `VITE_*` at **build** time, so the client image needs them as build
args. Compose reads them from this file:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

Public web-app config (not secret); same Firebase project as the worker's
service account. Omit and push registration silently no-ops. `VITE_API_URL`
defaults to `/api/v1` and normally needs no override.

## 2. Database migration

Run once (and after any new migration in `server/drizzle/`), against the
Supabase database in `server/.env`:

```bash
docker compose run --rm server npm run db:migrate
```

## 3. Bring it up

```bash
docker compose up -d --build
```

- App: <http://localhost:8080>
- RabbitMQ UI: <http://localhost:15672> (guest / guest)
- Rebuild after code changes: `docker compose up -d --build`
- Logs: `docker compose logs -f server worker`

## 4. End-to-end smoke test

1. Open the app, sign in (email + 2FA OTP).
2. Settings → pick a notification channel → allow the browser prompt. A row
   should appear in `push_devices` (check via the Supabase table editor).
3. Create an event with a reminder a minute or two out.
4. `docker compose logs -f worker` should show `Reminder push sent`, and the
   OS notification should fire.
5. Revoke the notification permission (or delete the `push_devices` row) and
   create another reminder — the next send should log a prune, not an error.

## Not covered here

- No CI. Run `npm test` and `npm run check-types` before pushing.
- No managed-PaaS config (Fly/Render/etc.) — this is the self-host path only.
- `/healthz` and `/readyz` endpoints are not implemented yet, so compose has no
  app-level healthchecks (only RabbitMQ has one).
