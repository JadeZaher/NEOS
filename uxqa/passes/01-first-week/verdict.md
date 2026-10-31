---
type: Pass Verdict
pass: 01-first-week
scenario: first-week
status: CHANGES_REQUESTED
---

# Pass 01-first-week: verdict record

## 1 Exit checks

Source: `uxqa/passes/01-first-week/ux-report.json` (`exitChecks`). 85 runs (76 UX runs, 9 probe runs). Outcomes: 15 COMPLETED, 59 PARTIAL, 2 BLOCKED.

| Check | Target | Measured | Result |
|---|---|---|---|
| Gold success | 0.8 per gold task | 6 of 7 gold tasks at 100%. `gold-advise-profile-orient-explore` is at 0% (1 run, 0 steps, 6 s). synthesis.md section 7 identifies it as an explore run filed under a gold name | not met, as reported by the harness |
| Friction per journey vs previous pass | within 10% of 00-setup | 00-setup 6, this pass 13.99 (+133%). 00-setup was a smoke pass, and this pass carries the ecosystem-image 503 noise (F16), so the comparison is not like for like | not met, as reported by the harness |
| New HIGH findings | 0 | `count` is null in ux-report.json (waiting on triage). `ledger.json` does not exist in the pass directory. synthesis.md section 6 proposes 8 HIGH bands (F01 to F08) | not computed |
| Route coverage | no target set | 23 of 76 page routes visited (30.3%). API: 47 of 134 declared endpoints hit | no target, informational |
| Review verdict | | REQUEST_CHANGES | recorded |
| Coordinator re-run | all commands in section 2 pass | backend `2 failed, 422 passed` (baseline pair only); tsc 0 errors; `npm test` 8/8; build ok | GREEN vs baseline |

## 2 Claims to re-run

These are the commands the fix lanes and the integrator reported, copied as reported. The coordinator runs them and records the output. Counts in the right-hand notes are what the lane claimed.

### Fix lane 1 (governance, authorship, domains)

Baseline taken before any edits, cwd `neos-operating-system/agent`:

```
C:/Python314/python.exe -m pytest tests/test_shared_ecosystem_serialization.py tests/test_member_roles.py tests/test_governance_tools.py -q --no-header -p no:cacheprovider
```
Reported: `2 failed, 46 passed`. The two failures are test_member_detail_exposes_shared_ecosystem_ids and test_proposal_detail_exposes_shared_ecosystem_ids. The SimpleNamespace fixtures lack 'role' and 'act_policy'.

```
C:/Python314/python.exe -m alembic heads
```
Reported: `n6a1d4f8b2c5 (head)`.

Sweep, backend:

```
C:/Python314/python.exe -m pytest tests -q -p no:cacheprovider --no-header -W ignore::DeprecationWarning
```
Reported: `2 failed, 405 passed, 24 warnings in 214.65s (0:03:34)`. The 2 failures are the baseline ones (AttributeError: no attribute 'role' at members.py:106, and 'act_policy' at proposals.py:288).

```
C:/Python314/python.exe -m pytest tests/test_uxqa_p1_governance.py -q -p no:cacheprovider
```
Reported: `22 passed in 16.96s`.

Sweep, client (cwd `charting-the-course`):

```
npm run check
npx vite build
```
Reported: `npm run check` (tsc, whole project) exit 0 with 0 'error TS' lines. `npx vite build` exit 0, `2139 modules transformed`, `built in 39.91s`.

Flows the lane says test_uxqa_p1_governance.py covers, through the real Sanic blueprints or MCP tool functions:
1. Create records the caller as author, and proposing on someone's behalf keeps the text but records the caller.
2. Withdraw table: another member 403, author 200, mod 200.
3. Edit: non-author 403, author 200.
4. Legacy proposal whose proposer text matches a member: that member 403, mod 200.
5. Blank advice ('', whitespace, missing) 400, nothing stored, status unchanged.
6. Self-advice 409. A spoofed advisor name is ignored. Another member's advice moves the proposal to consent and returns auto_transitions.
7. domain_display_name fallback table.
8. Domain create: user 403, mod 201 with name.
9. Domain edit: member 403, steward 200, mod 200.
10. Join, then detail and list show caller_is_participant. The steward sees caller_is_steward but is not a participant.
11. MCP parity: create sets author, non-author open and withdraw raise, self-advice raises, other member's advice advances, mod withdraw works.

Mocks: only the MCP auth and session edges (_caller and _db).

### Fix lane 2 (arrival)

```
cd charting-the-course && npm run check
cd charting-the-course && npm run build
cd neos-operating-system/agent && PYTHONPATH=src <scratchpad venv>/python -m pytest tests/test_uxqa_p1_arrival.py -q -p no:cacheprovider -W ignore::DeprecationWarning
pytest tests/test_uxqa_p1_arrival.py tests/test_oauth.py tests/test_main.py tests/test_agreement_consent.py tests/test_chat.py
pytest tests -q -p no:cacheprovider -W ignore::DeprecationWarning --ignore=tests/test_uxqa_p1_governance.py
```
Reported:
- `npm run check`: tsc, exit 0, no diagnostics.
- `npm run build`: `2139 modules transformed`, `built in 18.53s`, exit 0.
- arrival file: `10 passed, 5 warnings in 26.17s`. The first run errored with NoReferencedTableError (quizzes). The lane fixed it by importing neos_agent.db.course_models, as main.init_db does.
- Mutation check: the same file run against a copy of src with the fixes reverted (unordered select(Ecosystem), no config lookup, no consent gate, no existing_membership reuse, old NotFound redirect, old 'Chat error: {exc}' text) gave `8 failed, 2 passed`. The 2 that passed were the requested-id test and the id-default case, which the lane then changed to THIRD_SPACE_ID. The mutated copy was not re-run after that change.
- Touched suites: 50 passed, but that run had the 8 fixture errors from the first step, since fixed.
- Full suite: `2 failed, 383 passed, 24 warnings in 172.10s`. Both failures are in test_shared_ecosystem_serialization (no 'role', no 'act_policy'). tests/test_uxqa_p1_governance.py was excluded because it failed to collect (`ModuleNotFoundError: No module named 'mcp'`). The mcp dependency is addressed in the review-fix step below (`uv lock`).

### Integrator

All three commands run from the repo root.

```
cd neos-operating-system/agent && DATABASE_URL=sqlite+aiosqlite:// PYTHONIOENCODING=utf-8 py -m pytest -q -p no:cacheprovider tests
cd charting-the-course && npm run check
npm run build
```
Reported: backend `2 failed, 405 passed, 28 warnings in 155.89s`. The two failures are the same two serialization tests, listed in baseline-red.md. Baseline had 373 passed, so +32 new tests. `uxqa/regression/` does not exist, so no regression scripts were run. tsc exit 0. Build `built in 12.48s`, exit 0, chunk-size warning only. Diff-scope check: `git status` in both submodules listed only files declared in the lane reports.

### Review-fix lane

Backend, cwd `neos-operating-system/agent`, Python 3.14 via `py`:

```
NEOS_TEST_POSTGRES_URL="postgresql+asyncpg://postgres:***@127.0.0.1:5433/neos_p1_migration_scratch" timeout 600 py -m pytest tests/test_uxqa_p1_arrival.py tests/test_uxqa_p1_governance.py tests/test_uxqa_p1_mcp_parity.py tests/test_uxqa_p1_migration.py tests/test_governance_tools.py tests/test_profiles.py tests/test_oauth.py -q -p no:cacheprovider
timeout 300 py -m pytest tests/test_uxqa_p1_governance.py -q -p no:cacheprovider
NEOS_TEST_POSTGRES_URL=...same... timeout 300 py -m pytest tests/test_uxqa_p1_migration.py tests/test_uxqa_p1_mcp_parity.py -v -p no:cacheprovider
timeout 900 py -m pytest tests -q -p no:cacheprovider
uv lock
```
Reported:
- First command: `2 failed, 103 passed, 23 warnings in 56.91s`. Both failures were in the lane's new chat-domain test, where the helper's `name` parameter clashed with the tool's `name=` argument (TypeError). The lane made the parameter positional-only.
- Governance file: `32 passed, 1 warning in 13.53s`.
- Migration and parity: test_backfill_links_only_unambiguous_authors_and_derives_domain_names, test_full_upgrade_backfills_on_postgres and test_mcp_tools_apply_authorship_rules PASSED, `3 passed in 3.08s`. The scratch DB on PG16 :5433 was created for the run and dropped afterwards.
- Full suite, once after the fix: `2 failed, 421 passed, 1 skipped, 32 warnings in 158.50s (0:02:38)`. The 2 failures are pre-existing (AttributeError 'role', members.py untouched; AttributeError 'act_policy', added by ef2e425). The skip is the PG migration test, because NEOS_TEST_POSTGRES_URL was unset for that run.
- `uv lock`: `Resolved 101 packages in 1.59s`, added mcp v1.30.0 plus cryptography, httpx-sse, pyjwt, python-multipart, pywin32, sse-starlette, uvicorn. `uv lock --check --offline` had passed before the change.

Client, cwd `charting-the-course`:

```
timeout 300 npm test
timeout 400 npx tsc -p tsconfig.json
```
(`npm test` = `node --import tsx --test "client/src/**/*.test.ts"`.) Reported: `tests 8 / pass 8 / fail 0`, and tsc no output, exit 0.

Note for the coordinator: the final full-suite run was in the review-fix lane, after the last code change. The integrator's run (405 passed) predates the review-fix changes. A fresh run on the final tree, with NEOS_TEST_POSTGRES_URL set so the migration test is not skipped, is the one that counts. The two serialization failures are in baseline-red.md and should reproduce unchanged.

## 3 Ledger summary

`ledger.json` is missing from `uxqa/passes/01-first-week/`, so decisions (FIX, WONTFIX, RESEARCH and so on) and fix commits cannot be read from it and are not stated here. The counts below come from the severity bands in `synthesis.md` section 6 and are proposed bands from synthesis, not triaged decisions.

| Band | Count | Findings |
|---|---|---|
| HIGH (critical) | 8 | F01 to F08 |
| MEDIUM (serious) | 9 | F09, F10, F11, F12, F13, F14, F15, F17, F19 (F19 lifted by the accessibility exception) |
| RESEARCH_QUESTION | 3 | F16, F18, F21 |
| LOW (minor) | 1 | F20 |
| Total | 21 | |

Triage hints from synthesis: F04, F06, F05, F10, F20, F17 and the status-toast part of F07 were the quickest to confirm as FIX. F01 is first a governance-policy question for the product owner. The fix lanes' reports touch authorship, withdraw and edit rules, blank-advice rejection, self-advice, domain display names, domain create and edit, participation visibility, arrival ecosystem ordering, a consent gate, and MCP parity. Mapping each to a finding ID and a commit hash needs the ledger. Open item: write `ledger.json` (or confirm where it lives) before the verdict can be filled.

## 4 Persona refinement and coverage gaps

Coverage gaps (ux-report.json): 53 of 76 page routes unvisited. 87 of 134 API endpoints unhit. Unvisited routes include all list pages (/agreements, /ecosystems, /governance, /conflicts, /decisions, /emergency, /compliance, /safeguards, /explore, /profile, /quizzes, /comms, /chat, /exit, /map, /about, /admin), every detail page (agreements, conflicts, decisions, emergency, members, exit), every "new" and "edit" form, /settings/notifications, /my-quiz-history, quiz take and results, and /onboarding/[memberId]/ceremony. Zoom, reflow and slow network were not tested (F18).

Persona decisions for pass 02:

- **Keep Kofi and Ines (keyboard and screen reader).** They produced the most distinct findings (F07, F08, F12, F17, F19) and their patience budgets (3 and 4) were adequate. Add a harness helper that returns the focused element's accessible name and one for roving-tab widgets, so the rig stops costing them retries. Let a persona choose their own domain instead of passing through a fixed story, because Ines's ArrowDown selection landed the offer on ops.
- **Keep Sol and Amara (arrival).** Workable. Give Amara a reason to use the bell that has a realistic path (F04 is now fixed in code, so a re-run can check it). Add an Amara-only run on the unvisited steward routes (/domains/new, /members/new, /admin/users) so steward tooling gets coverage. Not tested last time: the Ready to Join orientation path and server enforcement of the Edit button.
- **Re-power Joy and Rafi (plain words).** Joy's text-only constraint is realistic, but guessed link-name patterns caused most timeouts, so the run tested the selectors more than the product. Rafi was blocked on Joy's advice step. Re-run with selectors checked against the accessibility tree before counting Joy's join, advice and message outcomes (precondition P3 in synthesis). Patience 2 matched the persona and stays.
- **Re-power Priya (DID newcomer).** Anonymous seed plus DID sign-up put her in Oasis, which made every OmniOne-dependent goal unreachable. That is a real finding (F09) but gave almost no advice-flow signal. Next pass, either make "become an OmniOne member after DID sign-up" an explicit goal, or add a second DID newcomer with a pre-seeded OmniOne prospective membership so the advice flow runs end to end. Keep Oren (patience 4 was adequate).
- **Add a facilitator persona.** A steward who opens and closes advice rounds, to test whether anyone besides advisers controls the rounds.
- **Re-power the probe persona (Tess).** Add a seeded OmniOne domain with agreement gates (so the 409 required_agreements path can be tested), an Escherbridge domain id in the manifest (so the 403 case can be verified), and a second disposable proposal, because the status-change probe withdrew the only reserved one.
- **Gold personas (qa-gold-*)**: keep, but run each gold task at least 3 times so a median means something. qa-visitor ends signup with no ecosystem membership, so add a post-signup newcomer path that picks an ecosystem and starts orientation.
- **Gold task changes.** Rename or exclude the explore run filed under `gold-advise-profile-orient-explore`. Add a visible-text check to gold-orient (its URL-only predicate passes on the empty journey page, which both gold lanes reported). Tighten gold-advise (author can see the advice, stage change explained) and gold-signup (lands in the intended ecosystem). Add gold-join and gold-message.
- **Harness fixes.** Retries inside `attempt()` turn a lane script bug into apparent friction, so three lane-error abandonments in ux.json (open-omnione-dossier in -1, the first open-new-conversation try in -4, open-governance-model in -6) should be discounted. The runner needs an explicit pass option when UXQA_PASS is unset. Exploration scripts reused gold task ids and left 3 stray draft proposals under qa-gold-member, so exploration needs its own task-id namespace and cleanup. Use a viewport screenshot when a Radix menu is open, because fullPage closes it. One persona per journey session conflicts with two interleaved personas, so allow multiple sessions per journey or document the per-stage workaround.

## 5 Next scenario suggestion

Run a second first-week pass (02-first-week-rerun) rather than a new scenario, after the coordinator re-run in section 2 passes. Reasons: coverage is 30%, the n=1 gold medians mean nothing yet, and the main fixes (authorship, withdraw, join persistence, domain names, arrival ecosystem) need to be exercised by the same personas that found them. Scope it to:

1. Re-test the fixed paths with Sol, Amara, Kofi, Ines and a corrected Joy lane.
2. Add the gold-join and gold-message tasks, 3 runs per gold task.
3. Add the steward and facilitator routes and a viewport and zoom check (F18).

After that, move to a second-month scenario (decisions, agreements, conflicts), which would cover most of the 53 unvisited routes.

## 6 Coordinator close-out (2026-10-31)

**Status: CHANGES_REQUESTED.** Every claimed command re-ran green against the
known-red baseline. Two items stay open and carry into the craft phase and pass 02.

Re-run on the final pass tree (frontend `571607d`, backend `2a30247`):

| Command | Result |
|---|---|
| backend `pytest tests` (sqlite, `NEOS_TEST_POSTGRES_URL` set to a disposable DB so the migration test runs) | `2 failed, 422 passed, 32 warnings in 192.06s`; the 2 are the baseline serialization pair |
| `npm run check` | exit 0, 0 `error TS` |
| `npm test` | `tests 8, pass 8, fail 0` |
| `npm run build` | exit 0, `built in 18.87s` |

Review follow-up: a separate verifier re-checked the 7 HIGH/MEDIUM review findings
against the final tree: 6 RESOLVED (chat bypass for the four touched tools, sign-up
placement, mcp collection, history attribution, domain names, backend revert tests),
1 PARTIAL (consent gate is a sign-in redirect only). Ledger entries added:

- `p1-coord-chat-tool-authz` (HIGH, FIX): five assistant tools (`create_decision_record`,
  `update_agreement_status`, `record_consent_position`, `create_ecosystem`,
  `declare_emergency`) change governance state with no caller check
  (`governance_tools.py:2779` `CALLER_SCOPED_TOOLS`). Pre-existing; craft lane BE-ACT.
- `p1-coord-consent-gate-guard` (MEDIUM, FIX): route guard for pending-consent members; craft wave 0.

Ledger: written by the coordinator from the triage result (the triage agent type was
read-only; plugin fixed to a writable agent). 105 entries; 29 FIX verified FIXED with
commits `charting-the-course@7841c55,571607d`, `neos-operating-system@d02a6d1,2a30247`.
Open new HIGH: 3 (`PB-BELL-STUB` DEFER, `p1-expert-first-week-audit-5` OWNER,
`p1-coord-chat-tool-authz`).

Exit checks after the ux-report gold fix (only declared gold ids count): gold 6/6 at
100% (n=1 each); friction 13.99 vs 6 (00-setup was one smoke run, so pass 01 is the
first real friction baseline); new HIGH 3; route coverage 23/76.

Not done by any agent, needs the owner: `SIGNUP_DEFAULT_ECOSYSTEM_SLUG=omnione` on the
Railway agent service (production config).
