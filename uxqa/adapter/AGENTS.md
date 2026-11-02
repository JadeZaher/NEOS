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
| `pass-args.mjs` | `node pass-args.mjs <N>` builds `passes/<NN-slug>/args.json` for the pass Workflow from `study.md`, the rotation table and the prior pass's ledger. |

## Explicit node support fixtures

`seed.node_admin` is an optional boolean fixture contract. `true` requests an explicit
assignment; `false` revokes an existing assignment; omission preserves the assignment.
It never follows from a member profile, ecosystem role, or home-ecosystem membership.
Pass 05 declares it for every signed-in persona: Oren and `qa-node-support` are assigned,
ordinary members and stewards are not. The original 16 personas and their natural
constraints remain; the seventeenth is a separate capability probe.

The coordinator must first bootstrap Oren explicitly on the isolated stack using
`NODE_ADMIN_BOOTSTRAP_USER_IDS` in ignored `uxqa/.secrets/stack.env` and restart the API.
For the current local DB Oren's User id is `ca1b32bc-d10c-4f43-9d6c-58d285af2f1d`.
This is a local fixture identity, not a production grant or an inference from co_creator.
The adapter refuses changes if the existing `qa_member_oren` User is not an active node
admin; it never bootstraps itself. After committing the synthetic users and their usable
sessions, it applies changed assignments through `services.node_admin.change_admin` with
the public reason category `Agent testing`. Grants run before revocations, and the service's
append-only audit, serialization, disabled-user, and last-usable-admin rules remain active.
Unchanged assignments produce no duplicate event. An explicit false also revokes a disabled
user's dormant assignment so later reactivation cannot silently restore fixture authority.

`seed.memberless: true` with `seed.memberships: []` creates only a User and an AuthSession;
it does not synthesize a Member or ecosystem participation. A fresh `qa-node-support`
fixture uses this shape and its explicit support assignment. If the handle already has a
Member row, reseeding refuses rather than deleting membership evidence. Empty memberships
without the explicit flag are refused. The memberless probe must use the node support UI
and an explicit support organization context, never claim ordinary governance participation.

Both `seed()` and the assignment helper recheck the exact `neos_uxqa` database guard. This
metadata is for local QA only and cannot authorize changes on Railway. No secrets or session
cookies are printed.

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

`seed.py --member-resets-only` (passed through by `adapter.sh seed <personas> <out> --member-resets-only`) skips the study-wide resets: the agent-eval runner seeds mid-pass and must not withdraw gold proposals. Its own fixtures are retired by the `retire_agent_eval_fixtures` study reset at the next normal seed (see `uxqa/agent-evals/AGENTS.md` §Seeding and Teardown).

`stack.sh` loads optional local-only overrides from `uxqa/.secrets/stack.env` (e.g. `AI_API_KEY`, `AI_PROVIDER` for the assistant) and then re-exports the study `DATABASE_URL`, so the overrides can never repoint the database.

The resets are a registry: `@member_reset` steps run per seeded persona with
its member ids, `@study_reset` steps run once per seed. **Adding a gold task
means adding one decorated step** that removes whatever its success predicate
looks for; `seed()` itself never changes. Profile fields are reset inside
`upsert_user` because they are identity, not task output.

## Pass args

`pass-args.mjs` is the only place the scenario rotation lives (`ROTATION`):
slug, name and the four lenses per pass, chosen so every lens recurs within
three passes and the safety pass gets trust-behavioural + frontline-worker.
It refuses to build args until `passes/<id>/scenario.md` exists, so a pass
cannot launch without its brief. `args.json` is derived (it embeds the prior
ledger) and gitignored.

## Route shadow

The plugin inventories file routers only; NEOS declares routes in
`charting-the-course/client/src/App.tsx` with wouter. `gen-routes.mjs` writes
one empty file per route into a Next-pages layout (`/a/:id/edit` ->
`a/[id]/edit.tsx`, APIs under `api/`), so the unmodified plugin matcher
measures page and API coverage. Re-run it when routes change (the loop's
`beforePass` hook does).
