---
type: UX Study Runbook
title: "NEOS UX study runbook"
description: Rolling state of the study - newest block first; one block per pass with its recorded verdict.
---

# UX study runbook

Newest block first. Each pass appends one block; nothing here is deleted.

## Loop plan - 2026-10-31

- Up to 5 lean passes (4 UX lanes + 2 gold + 1 probe, 4 lenses, 2 opus fix lanes), stopping once two consecutive passes meet the exit criteria.
- Scenario rotation: `01-first-week` (sign up, orient, first advice, steward greeting) -> `02-act-lifecycle` (propose -> advice -> consent -> test -> ratify; agreements, ceremonies, decision artifacts, gate inheritance) -> `03-cross-ecosystem-exchange` (discover, shares/needs, collaborations, messaging) -> `04-safety-integrity` (conflicts, emergency, safeguards, compliance, exit) -> `05-stewardship` (admin, members, domains, quizzes, journey maps). Gold tasks run every pass.
- Lens rotation (all 7 angles across the loop): p1 service-designer, accessibility, learning-designer, content-designer; p2 domain-expert, frontline-worker, trust-behavioural, service-designer; p3 accessibility, content-designer, learning-designer, domain-expert; then repeat.
- Between passes (coordinator): restart the API job if backend files changed (`stack.sh api`), `stack.sh status`, plugin guard + adapter guard, `node uxqa/adapter/gen-routes.mjs`.

## Study setup - 2026-10-31

- Stack: isolated local DB `neos_uxqa` on PG16 `127.0.0.1:5433` (NOTE: PG16 is on 5433, PG17 owns 5432), bootstrap = `Base.metadata.create_all` (with `neos_agent.db.course_models` imported) + `alembic stamp head` (m5f9c3e7a2b4) + `scripts.seed_all`. API `stack.sh api` (:8000), web `stack.sh web` (:5173). `alembic upgrade head` cannot build from an empty DB (an early revision alters `conflict_cases` before any revision creates it).
- Seed defect (OWNER, pre-existing): `seed_all` step 6/6 `seed_conflicts_emergency` fails with duplicate key `repair_agreement_records_pkey`; steps 1-5 seeded (4 ecosystems, 12 members, 12 domains, 34 agreements, 36 proposals across all ACT stages, 20 decisions).
- Guard proven: `OK http://localhost:5173 status=healthy`
- Adapter guard: `OK server db=neos_uxqa` (sentinel read through the running server); in-target refusal proven: `REFUSED DATABASE_URL is not the isolated uxqa DB (caboose.proxy.rlwy.net:21261/railway)` exit 2.
- Adapter smoke: `SEEDED 5` (count verified: 5 handles, qa-visitor anonymous).
- ux-lib smoke: `COMPLETED`, ux.json + trace.zip + 2 shots; signed in as "Smoke Tester".
- ux-report: `coverage 2/76 pages, 7/134 apis`, `unmatchedPaths []`.
- Gold check: 6/6 gold tasks valid.
- Observed in smoke (for pass 1 to judge): `GET /api/v1/media/ecosystems/omnione.webp` 503 on the dashboard hero (probably missing local media, verify before filing); "All 1 ecosystems" pluralisation; sidebar brand still "CHARTING THE COURSE".
