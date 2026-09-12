---
name: sederyom-code-standards
description: >
  Enforces core programming principles, Clean Code standards, React 19/Vite patterns,
  Express layered architecture, Drizzle ORM workflows, Zod validation, and security guidelines
  for the SederYom project. Use whenever writing, reviewing, or refactoring frontend,
  backend, or background worker code.
license: MIT
metadata:
  project: SederYom
  version: 1.1.0
---

# SederYom - Technical Standards & Code Quality Skills

## 0. Required Reading (in this order)
1. `SPEC.md` (project root) — functional/technical spec: data models, validation
   rules, API contract, screens list. This is the source of truth for *what* to build.
2. `design_handoff_sederyom/README.md` — visual spec: design tokens (colors,
   spacing, typography), per-screen layout, state shape, copy (he/en). This is
   the source of truth for *how it looks*.

   **Do NOT read** `design_handoff_sederyom/SederYom.dc.html` or
   `design_handoff_sederyom/support.js`. These are a non-runnable prototype
   (proprietary template runtime) kept for human reference only — reading them
   wastes context and they are not valid target-stack code. The README is
   self-contained and sufficient.

## 1. Clean Code & Modern TypeScript (2026)
* **Strict TypeScript:** `strict: true` and `noImplicitAny: true`. Do NOT use `any` under any circumstance; use `unknown`, generics, or explicit Zod-inferred types.
* **DRY & SRP:** Keep files under ~150–200 lines. Split aggressively when the threshold is reached. Extract business logic into dedicated Service Layer modules.
* **Modern Guard Clauses:** Prefer early returns over nested `if/else` checks for error handling and precondition verification.
* **Shared Workspace:** Shared types and Zod validation schemas must reside in the shared workspace (`/shared`), modeled per `SPEC.md` §3.

## 2. Frontend Guidelines (React 19 + Vite + Tailwind)
* **No external design system.** Do not use or reference the Nocturne/Classical
  design systems even if present anywhere in the repo history — the product
  decision is plain Tailwind with a native `dark:` variant theme, per the
  design README's "Design Tokens" section.
* **Atomic UI Architecture:** Reusable UI primitives (e.g., `Button`, `Input`, `Modal`, `SegmentedControl`) reside in `client/src/components/ui/`. Build these **first**, from the design README's token section, before building any screen. Every feature component must compose these base primitives rather than writing raw HTML tags or one-off styling.
* **Data Fetching (TanStack Query v5+):** Prohibit `useEffect` for data fetching. Use `useQuery` and `useMutation` exclusively. Use query key factories and handle optimistic updates properly (`onMutate` cache updates or `useOptimistic`, per SPEC.md §12).
* **Forms & Validation:** All forms use `react-hook-form` with `zodResolver`, against the shared schemas in `/shared`. Derive TypeScript types directly from schemas (`type FormInput = z.infer<typeof schema>`).
* **Drag & Drop:** Encapsulate `@dnd-kit` DnD state and event handlers inside custom hooks (e.g., `useScheduleDnd`). Google-synced events (`gcal: true`) are never draggable.
* **Styling & RTL:** Use utility-first Tailwind classes merged via `cn()` (`clsx` + `tailwind-merge`). Zero hardcoded UI strings; use `t('namespace.key')`. Use logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start/end`) for automatic RTL/LTR mirroring; mirror directional icons explicitly.

## 3. Backend Guidelines (Express + Drizzle ORM)
* **Layered Architecture:**
  * **Routes:** Endpoint definitions + Zod request validation middlewares, matching `SPEC.md` §7 API contract.
  * **Controllers:** Extract payload, invoke Service layer, return standardized response.
  * **Services:** Core business logic & RabbitMQ task publishing.
  * **Database Layer:** Drizzle ORM schemas, relations, and repository functions, matching `SPEC.md` §3 data models.
* **Database Indexing:** Always define explicit indexes in Drizzle schemas (`index()`) for foreign keys, filtered columns, and sort keys (see `SPEC.md` §6 for the archive index).
* **Unified API Response Schema:** A Global Error Handler catches all exceptions. Use a standardized JSON format:
  * Success: `{ "success": true, "data": ... }`
  * Error: `{ "success": false, "error": { "message": "...", "code": "..." } }`

## 4. Observability, Logging & Request Tracing
* **Structured Logging (Pino):** PROHIBIT `console.log` or `console.error` in production code. Use the `pino` logger instance for structured JSON logs (`logger.info()`, `logger.error()`).
* **Distributed Tracing:**
  * Express middleware generates or extracts a unique `x-correlation-id` header for every incoming HTTP request.
  * Attach `x-correlation-id` to RabbitMQ message headers when publishing jobs.
  * Notification Worker extracts `x-correlation-id` to inject into Worker Pino logs for end-to-end request tracing.
* **Readiness:** Expose `/healthz` (liveness) and `/readyz` (readiness checking Supabase DB & RabbitMQ availability).

## 5. Project Directory Structure
```text
/
├── docker-compose.yml
├── CLAUDE.md
├── SPEC.md                     # functional/technical spec (source of truth)
├── design_handoff_sederyom/    # design reference — read README.md ONLY (see §0)
│   ├── README.md
│   ├── SederYom.dc.html        # do not read — non-runnable prototype
│   └── support.js              # do not read — prototype runtime
├── shared/                     # Shared Zod schemas & TypeScript types
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Reusable base UI primitives (Button, Modal, Input) — build first
│   │   │   └── features/       # Domain-specific components (Week, Day, Archive, Settings)
│   │   ├── hooks/               # Custom hooks (useScheduleDnd, useAuth, etc.)
│   │   ├── services/            # API client & TanStack Query definitions
│   │   ├── i18n/                 # Translation files (he.json, en.json)
│   │   ├── types/                 # Frontend types
│   │   └── utils/                  # Helper functions (cn, formatters)
├── server/                     # Express Backend
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # Business logic & RabbitMQ producers
│   │   ├── routes/             # Express routes & middlewares
│   │   ├── db/                 # Drizzle schemas & migrations
│   │   └── config/             # Environment validation (env.ts)
└── worker/                     # Notification & Background Worker
    ├── src/
        ├── consumers/          # RabbitMQ event consumers
        └── integrations/       # Google Calendar API, Firebase push
```

## 6. Build Order (see SPEC.md for full detail)
1. `shared/` schemas → 2. `components/ui/` primitives → 3. Backend layers
   (db → routes → controllers → services → auth) → 4. Frontend screens, one at
   a time: Week → Day → Archive → Archive Day → Settings → Login/2FA → Event
   form dialog → 5. Worker + Google Calendar integration → 6. Tests + Docker + Deploy.

   When asked to build a screen, read only `SPEC.md` (relevant section) +
   the design README's matching screen section + the already-built `ui/`
   primitives — not the whole repo.
