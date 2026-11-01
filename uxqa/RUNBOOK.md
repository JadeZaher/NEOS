---
type: UX Study Runbook
title: "NEOS UX study runbook"
description: Rolling state of the study - newest block first; one block per pass with its recorded verdict.
---

# UX study runbook

Newest block first. Each pass appends one block; nothing here is deleted.

## Between passes 01 and 02 - craft + governance - 2026-10-31 (in progress)

- Craft wave 0 (contracts) LANDED and PUSHED: backend `af47a92`, frontend `6f59976`, superproject `157cb97`. Sweep: tsc 0, npm test 33/33, build ok, pytest 481 passed.
- Craft wave 1 (7 lanes: FE-A/B/C, BE-ACT/Groups/Journey, cleanup) complete and swept green (tsc 0, npm test 38/38, pytest 559 passed, agent-eval unit 14/14); adversarial review REQUEST_CHANGES: H1 cross-ecosystem orientation start, M2 progress rows keyed on default member (production data migration), M1 legacy 'objection' rows, M3 chat agreement status gates, L2-L6. A fix lane is applying them; then sweep, commit per repo, push (deploys + runs the data migration on production), migrate neos_uxqa, restart the study API.
- Governance reviews written: [governance/review-core.md](governance/review-core.md), [governance/review-extended.md](governance/review-extended.md), [agent-evals/review.md](agent-evals/review.md). Extension plan with owner decisions and lanes: [governance/plan.md](governance/plan.md) (G-ACT, G-Safety, G-Care, G-Agent; then G-Next).
- OWNER decisions (2026-10-31): proposer closes advice (deadline backstop); a steward confirms Test->Ratified; emergencies: any active member with a co-signer, bounded timer; role grants only below your own rank, owner grants owner, recorded.
- Craft wave 1 LANDED and PUSHED (backend `5c8ef41`, frontend `05ba776`, superproject `c6bc357`; migration `o7c3e9a5d2f8` re-keys orientation/ethos rows on production). Study DB migrated, API restarted.
- Governance wave A (G-ACT, G-Safety, G-Care, G-Agent) built; sweep green incl. PostgreSQL migration tests (pytest 715 passed, tsc 0, npm test 53/53, single head `r6c1e8a4f2d7`). Adversarial review REQUEST_CHANGES: H1 proposal text editable after ratification + register copies live text; H2 legacy /dashboard/* write routes bypass every rule; H3 self-assigned builder profile -> self-owner; M1 legacy chat trusts confirmed + agreement evidence activates without confirmation; M2 emergency/register races; M3 legacy conflict statuses; M4 remaining name-based identity. Three fix lanes (ACT+roles; legacy views+races+migrations; assistant+MCP) running; revisions p8d4/q2a7/r6c1 are undeployed and may be amended. Then: sweep (with PostgreSQL), commit, push, migrate neos_uxqa, restart API, wave B (G-Next).
- Agent-eval wave built ([agent-evals/AGENTS.md](agent-evals/AGENTS.md), plugin AgentEval phase). BLOCKED on the assistant's model key: the owner puts `AI_API_KEY=...` (optionally `AI_PROVIDER=`) in `uxqa/.secrets/stack.env`; then restart the API and run the baseline `node uxqa/agent-evals/run.mjs 01-first-week` before G-wave changes land if possible.

## Pass 01-first-week - 2026-10-31 - CHANGES_REQUESTED

- `pass 01: gold 6/6, friction/journey 6 -> 13.99 (setup smoke -> first real baseline), new HIGH 3, coverage 23/76`
- Fix commits: frontend `7841c55`, `571607d`; backend `d02a6d1`, `2a30247` (29 ledger FIX entries verified FIXED). Migration `n6a1d4f8b2c5` (proposal author link, domain names) applied to `neos_uxqa`.
- Coordinator re-run: backend `2 failed, 422 passed` (baseline pair), tsc 0, `npm test` 8/8, build ok. Verdict: [passes/01-first-week/verdict.md](passes/01-first-week/verdict.md) §6.
- Open: `p1-coord-chat-tool-authz` (HIGH, five assistant tools without caller checks), `p1-coord-consent-gate-guard` (MEDIUM), `PB-BELL-STUB` (DEFER), `p1-expert-first-week-audit-5` (OWNER: should one piece of advice end the advice phase?).
- Environment fixed after the pass (backend `7ea3de7`, `ed872ff`, `c0fdcec`): fresh-DB `alembic upgrade head`, `seed_all` step 6, bundled media instead of 503, the two known-red serialization tests. Known-red baseline is now expected to be empty (confirm at the next sweep).
- Harness fixed: plugin triage agent can now write `ledger.json`; `ux-report` counts only declared gold ids; `stack.sh stop-api` (Git Bash leaves python.exe on :8000 when the api job is stopped); the frontend has a `npm test` node:test harness (study TESTS rule corrected).
- Next: craft phase ([craft/plan.md](craft/plan.md)), then pass 02.

## Loop plan - 2026-10-31

- Up to 5 lean passes (4 UX lanes + 2 gold + 1 probe, 4 lenses, 2 opus fix lanes), stopping once two consecutive passes meet the exit criteria.
- Scenario rotation: `01-first-week` (sign up, orient, first advice, steward greeting) -> `02-act-lifecycle` (propose -> advice -> consent -> test -> ratify; agreements, ceremonies, decision artifacts, gate inheritance) -> `03-cross-ecosystem-exchange` (discover, shares/needs, collaborations, messaging) -> `04-safety-integrity` (conflicts, emergency, safeguards, compliance, exit) -> `05-stewardship` (admin, members, domains, quizzes, journey maps). Gold tasks run every pass.
- Scenario and lens rotation live in one place: `ROTATION` in [adapter/pass-args.mjs](adapter/pass-args.mjs); `node uxqa/adapter/pass-args.mjs <N>` builds the pass args once `passes/<NN-slug>/scenario.md` exists.
- Between passes (coordinator): apply new Alembic revisions to `neos_uxqa`; if backend files changed, `stack.sh stop-api` then relaunch `stack.sh api` as a tracked job; `stack.sh status`, plugin guard + adapter guard, `node uxqa/adapter/gen-routes.mjs`.
- Craft phase (added 2026-10-31 at the owner's request): between passes, refactor toward single sources of truth per [craft/plan.md](craft/plan.md), in waves with disjoint file ownership, adversarial review, one sweep per wave.
- Governance completeness + agent evals (added 2026-10-31 at the owner's request: "extend where governance is confusing or incomplete; easy to use with the agent; include an agent eval wave"). Order before pass 02: wave-0 review fixes -> governance reviews (layers 1-3, 4-10, agent; `governance/`, `agent-evals/`) -> craft wave 1 (refactor) -> governance extension wave (built on the wave-0 contracts) + agent-eval harness -> pass 02 with an agent-eval phase. Bar for extensions: the smallest change that makes a flow complete and understandable; no new subsystems.
- Pushing (owner, 2026-10-31): push main after every green sweep, submodules first. A push deploys: backend via Railway (`alembic upgrade head` pre-deploy on production), frontend via `deploy-client.yml`.

## Study setup - 2026-10-31

- Stack: isolated local DB `neos_uxqa` on PG16 `127.0.0.1:5433` (NOTE: PG16 is on 5433, PG17 owns 5432), bootstrap = `Base.metadata.create_all` (with `neos_agent.db.course_models` imported) + `alembic stamp head` (m5f9c3e7a2b4) + `scripts.seed_all`. API `stack.sh api` (:8000), web `stack.sh web` (:5173). `alembic upgrade head` cannot build from an empty DB (an early revision alters `conflict_cases` before any revision creates it).
- Sign-up placement (pass-01 review fix): `stack.sh` exports `SIGNUP_DEFAULT_ECOSYSTEM_SLUG=omnione`, because the seed gives all four ecosystems one `created_at` and the old id tie-break placed newcomers in Oasis. Restart `stack.sh api` to pick it up. The Railway agent service needs the same variable (see `neos-operating-system/agent/src/neos_agent/api/AGENTS.md` "Sign-up placement and the consent gate").
- Seed defect (OWNER, pre-existing): `seed_all` step 6/6 `seed_conflicts_emergency` fails with duplicate key `repair_agreement_records_pkey`; steps 1-5 seeded (4 ecosystems, 12 members, 12 domains, 34 agreements, 36 proposals across all ACT stages, 20 decisions).
- Guard proven: `OK http://localhost:5173 status=healthy`
- Adapter guard: `OK server db=neos_uxqa` (sentinel read through the running server); in-target refusal proven: `REFUSED DATABASE_URL is not the isolated uxqa DB (caboose.proxy.rlwy.net:21261/railway)` exit 2.
- Adapter smoke: `SEEDED 5` (count verified: 5 handles, qa-visitor anonymous).
- ux-lib smoke: `COMPLETED`, ux.json + trace.zip + 2 shots; signed in as "Smoke Tester".
- ux-report: `coverage 2/76 pages, 7/134 apis`, `unmatchedPaths []`.
- Gold check: 6/6 gold tasks valid.
- Observed in smoke (for pass 1 to judge): `GET /api/v1/media/ecosystems/omnione.webp` 503 on the dashboard hero (probably missing local media, verify before filing); "All 1 ecosystems" pluralisation; sidebar brand still "CHARTING THE COURSE".
