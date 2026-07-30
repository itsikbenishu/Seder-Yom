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
  version: 1.0.0
---

# SederYom - Technical Standards & Code Quality Skills

## 1. Clean Code & Modern TypeScript (2026)
* **Strict TypeScript:** `strict: true` and `noImplicitAny: true`. Do NOT use `any` under any circumstance; use `unknown`, generics, or explicit Zod-inferred types.
* **DRY & SRP:** Keep files under ~150–200 lines. Split aggressively when the threshold is reached. Extract business logic into dedicated Service Layer modules.
* **Modern Guard Clauses:** Prefer early returns over nested `if/else` checks for error handling and precondition verification.
* **Shared Workspace:** Shared types and Zod validation schemas must reside in the shared workspace (`/shared`).

## 2. Frontend Guidelines (React 19 + Vite + Tailwind v4)
* **Atomic UI Architecture:** Reusable UI primitives (e.g., `Button`, `Input`, `Modal`) reside in `client/src/components/ui/`. Every feature component must compose these base primitives rather than writing raw HTML tags.
* **Data Fetching (TanStack Query v5+):** Prohibit `useEffect` for data fetching. Use `useQuery` and `useMutation` exclusively. Use query key factories and handle optimistic updates properly.
* **Forms & Validation:** All forms use `react-hook-form` with `zodResolver`. Derive TypeScript types directly from schemas (`type FormInput = z.infer<typeof schema>`).
* **Drag & Drop:** Encapsulate `@dnd-kit` DnD state and event handlers inside custom hooks (e.g., `useScheduleDnd`).
* **Styling & RTL:** Use utility-first Tailwind classes merged via `cn()` (`clsx` + `tailwind-merge`). Zero hardcoded UI strings; use `t('namespace.key')`. Support dynamic RTL (Hebrew) and LTR (English) layouts.

## 3. Backend Guidelines (Express + Drizzle ORM)
* **Layered Architecture:**
  * **Routes:** Endpoint definitions + Zod request validation middlewares.
  * **Controllers:** Extract payload, invoke Service layer, return standardized response.
  * **Services:** Core business logic & RabbitMQ task publishing.
  * **Database Layer:** Drizzle ORM schemas, relations, and repository functions.
* **Database Indexing:** Always define explicit indexes in Drizzle schemas (`index()`) for foreign keys, filtered columns, and sort keys.
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
├── shared/                     # Shared Zod schemas & TypeScript types
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Reusable base UI primitives (Button, Modal, Input)
│   │   │   └── features/       # Domain-specific components (Schedule, Tasks)
│   │   ├── hooks/              # Custom hooks (useScheduleDnd, useAuth, etc.)
│   │   ├── services/           # API client & TanStack Query definitions
│   │   ├── i18n/               # Translation files (he.json, en.json)
│   │   ├── types/              # Frontend types
│   │   └── utils/              # Helper functions (cn, formatters)
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
        └── integrations/       # Google Calendar API, Email/Push services