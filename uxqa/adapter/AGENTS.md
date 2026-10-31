---
type: Module Notes
title: NEOS UX study adapter
description: Why the session adapter, guards, route shadow and stack launcher for the NEOS UX study are shaped the way they are.
---

# uxqa/adapter - the only NEOS-specific code in the study

| File | Role |
|---|---|
| `adapter.sh` | `guard` / `seed <personas> <out>` / `link` (refused). Exports the local `DATABASE_URL` so nothing it starts can reach Railway. |
| `seed.py` | Upserts qa-* users + members, resets gold state, mints `neos_session` cookies exactly like `POST /api/v1/auth/register`. |
| `verify-target.mjs` | Reads the `uxqa_environment` sentinel through the RUNNING server with a persona cookie. |
| `gen-routes.mjs` | Builds `uxqa/routes/` (Next-pages-shaped shadow tree) from wouter routes + the Sanic route table. |
| `stack.sh` | `api` / `web` / `status` for the isolated stack; run api/web as tracked background jobs. |

## Two guards, two failure modes

`agent/.env` points at the Railway Postgres, and pydantic-settings and Alembic
both let an exported `DATABASE_URL` win over `.env`. So the isolation is one
export, and the guards check it from both sides:

- `seed.py` `in_target_guard()` refuses unless **its own** `DATABASE_URL` is
  `127.0.0.1:5433/neos_uxqa`. A copied env or a forgotten export fails here
  before any import touches a database.
- `verify-target.mjs` proves the **running server** reads the same DB: the
  sentinel `AppSetting` row exists only in `neos_uxqa`, and a server on any
  other DB rejects the freshly minted session (401) or returns no sentinel.
  On failure the adapter deletes the sessions file, so lanes cannot start.

The plugin's own guard (`/api/v1/health` -> `status == healthy`, local host,
Railway hosts deny-listed) is the third, weakest layer.

## Sessions without passwords

`seed.py` writes an `AuthSession` row and signs its id with
`make_session_cookie(session_id, settings.SESSION_SECRET)`. The secret never
leaves the process, because the API and the adapter both read it from the same
`agent/.env`. Older sessions for the persona are expired rather than deleted:
`agent_tokens` reference auth sessions.

## Gold-state reset

Every seed resets what gold tasks create: display name/bio/headline,
`user_journey_progress`, `circle_memberships` (domain joins), active
`shares_needs` (set to withdrawn, not deleted, to keep collaboration FKs
intact) and proposals titled `... (uxqa gold)`. Without the reset, pass N's
success predicate would already be true from pass N-1's run.

## Route shadow

The plugin inventories file routers only; NEOS declares routes in
`charting-the-course/client/src/App.tsx` with wouter. `gen-routes.mjs` writes
one empty file per route into a Next-pages layout (`/a/:id/edit` ->
`a/[id]/edit.tsx`, APIs under `api/`), so the unmodified plugin matcher
measures page and API coverage. Re-run it when routes change (the loop's
`beforePass` hook does).
