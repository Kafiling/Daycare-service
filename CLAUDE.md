# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start development server (http://localhost:3000)
bun build        # Production build
bun start        # Start production server
bun install      # Install dependencies
```

No test suite is configured. Manual testing is expected.

### Docker

```bash
docker compose up --build   # Build and run with Docker
```

Requires env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Local Supabase (optional)

```bash
supabase start   # Requires Docker — runs local Postgres + Auth
```

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Stack:** Next.js 15 (App Router) + Bun + Supabase (PostgreSQL) + TypeScript + Tailwind CSS 4

**UI libraries:** shadcn/ui (primary), Radix UI, Ant Design, Framer Motion, Recharts, Sonner

**Data fetching:** SWR for client-side caching; server actions and API routes for mutations

### Directory layout

```
app/
  (admin)/        Admin dashboard routes
  (login)/        Auth/login routes
  (main)/         Main app routes
    _actions/     Server actions (Next.js server-side mutations)
    patient/      Patient detail and management pages
    patient-create/
  api/            REST API routes
    v1/patients/
    admin/
    auth/
    forms/
  service/        Business logic — Supabase query functions called by server actions and API routes

components/
  ui/             shadcn/ui primitives
  patient/        Patient-specific components
  admin/          Admin-specific components
  question-types/ Form question type renderers

lib/
  timezone.ts     Bangkok (GMT+7) timezone utilities — important for all date operations
  question-types.ts  Form field type definitions

utils/supabase/
  client.ts       Browser-side Supabase client
  server.ts       Server-side Supabase client (uses cookies)
  middleware.ts   Auth session refresh middleware

supabase/
  migrations/     Versioned SQL migrations (format: YYYYMMDD*)
  functions/      Supabase Edge Functions (auto-assign-groups, manage-groups, export-data)
```

### Data layer

No ORM — the app uses the Supabase JS SDK directly. Query logic lives in `app/service/`. Key tables: `patients`, `patient_groups`, `forms`, and form submission tables.

Row Level Security (RLS) is enabled. Auth flows through Supabase Auth with SSR session handling via `@supabase/ssr`.

### Timezone

All dates must be handled in **Bangkok time (Asia/Bangkok, GMT+7)**. See `lib/timezone.ts` for helpers. This was a known production issue on Vercel — see `TIMEZONE_FIX.md` for context.

### Docker runtime config

The multi-stage Dockerfile uses Next.js standalone output. `docker-entrypoint.sh` injects runtime environment variables by replacing placeholders in the built JS files — this enables environment configuration at container start without rebuilding.
