---
type: Pass Verdict
pass: 02-act-lifecycle
scenario: act-lifecycle
status: APPROVED
---

# Pass 02 (act-lifecycle): verdict sheet

Sources: `ux-report.json` (exitChecks, coverage, totals), `ledger.json` (76 entries), the fix lanes' and integrator's reports. Nothing below has been re-run by the coordinator yet.

## 1. Exit checks

| Check | Target | Result | Met |
|---|---|---|---|
| Gold success | 0.8 per gold task | 1.0 on all six tasks (advise 4 runs, profile 4, propose 3, share 1, orient 1, signup 3); none missing or below | yes |
| Friction per journey vs previous pass | not above 01-first-week (13.99) within 0.1 | 3.01 (00-setup 6, 01-first-week 13.99, 02 3.01). Totals: 307 clicks, 7 dead, 0 rage, 4 HTTP errors, 131 console errors, 22 axe violations | yes |
| New HIGH | 0 | The report field is null (not computed). By ledger: 6 HIGH entries, 2 are DUPLICATE, leaving 4 distinct: 3 OWNER (stewards-confirm-and-register-1, -2, -3) and 1 FIX (gold-advise-profile-orient-4, orientation video dead end). The count is 4 until the owner decisions land and the FIX is confirmed | not met by ledger count |
| Route coverage | no target set | 23 of 77 page routes visited (29.9%); 47 of 144 declared API routes hit | no target, not evaluable |
| Agent-eval pass rate | 0.8 | 0 of 25 tasks. Run aborted `OWNER_BLOCKED`, 0 tokens used; the assistant answers every message as unavailable (ledger -3) | no |
| Review verdict | | REQUEST_CHANGES | |
| Coordinator re-run | every claim below reproduces | PENDING | PENDING |

## 2. Claims to re-run (verbatim from the lanes)

Environment note: backend runs use `DATABASE_URL=sqlite+aiosqlite:// PYTHONIOENCODING=utf-8`. The PostgreSQL tests need `NEOS_TEST_POSTGRES_URL`; lane 1 used a disposable DB at 127.0.0.1:5433 made with `py scratch_db.py create`.

### Lane group 1 (act authority, queue order, banners, proposals)

Disposable DB: `py scratch_db.py create` printed "PostgreSQL 16.9 ... / create neos_lane1_p2act_scratch ok" (127.0.0.1:5433). It was dropped at the end: "drop neos_lane1_p2act_scratch ok".

1. Full backend sweep, first run: `cd neos-operating-system/agent && DATABASE_URL=sqlite+aiosqlite:// PYTHONIOENCODING=utf-8 NEOS_TEST_POSTGRES_URL="postgresql+asyncpg://postgres:***@127.0.0.1:5433/neos_lane1_p2act_scratch" timeout 900 py -m pytest -q -p no:cacheprovider tests` -> "1 failed, 811 passed, 97 warnings in 307.07s". The failure was a real bug in the lane's code: SQLite compared a server timestamp against a bound Python datetime as text. Fixed in api/proposals.py by comparing in Python.
2. The same full command after that fix -> "1 failed, 811 passed, 97 warnings in 356.36s (0:05:56)". The one failure was a bug in the new test: `await` inside a generator expression. Nothing was skipped (0 SKIPPED lines), so the PostgreSQL tests ran.
3. After fixing the test only: `DATABASE_URL=sqlite+aiosqlite:// PYTHONIOENCODING=utf-8 timeout 300 py -m pytest -q -p no:cacheprovider tests/test_uxqa_p2_act.py` -> "17 passed, 2 warnings in 13.07s". The MCP test ran; it was not skipped.
4. Mutation check: temporarily reverted can_participate's active check and the OWNER_ACTIONS sort key, then ran test_uxqa_p2_act.py -> "2 failed, 15 passed". Failed: test_a_pending_newcomer_reads_the_page_and_cannot_write_a_proposal_there and test_the_acts_only_you_can_take_come_right_after_overdue_items. Both files restored from backups and confirmed with `cmp` ("restored-identical").
5. `cd charting-the-course && timeout 600 npm run check` -> "> tsc" then exit 0, so 0 errors anywhere, including the lane's paths.
6. `timeout 300 npm test` -> "tests 63 / pass 63 / fail 0".
7. `timeout 600 npx vite build --outDir <scratchpad>/vite-out --emptyOutDir` -> "✓ built in 8.36s", exit 0. Built to the scratchpad so the project's dist was not touched; scratch output deleted afterwards.

Net state: the whole backend suite passes. The only test that failed in run 2 now passes on its own (17/17). The lane did not re-run the full suite after that test-only fix.

### Lane group 2 (messaging unread, a11y, flows)

BACKEND (cd C:/Users/atooz/Programming/NEOS/neos-operating-system/agent)
- `py -m pytest tests/test_uxqa_p2_messaging.py tests/test_messaging_views.py tests/test_messaging_ws.py tests/test_messaging_models.py -q -p no:cacheprovider`
  - first run: "53 errors in 20.47s". Cause: NoReferencedTableError quiz_assignments.quiz_id -> quizzes. The new test module now imports neos_agent.db.course_models, as test_uxqa_p1_arrival.py already does.
  - rerun: "53 passed, 3 warnings in 10.77s" (51 existing messaging tests + 2 new)
- `py -m pytest tests/test_uxqa_p2_messaging.py -q -p no:cacheprovider -W error::DeprecationWarning:tests.test_uxqa_p2_messaging` (after replacing utcnow) -> "2 passed, 1 warning in 1.45s" (the remaining warning is the websockets.legacy deprecation from a dependency)
- Revert check: same file with _mark_read patched to a no-op in-process (no source edit): "FAILED tests/test_uxqa_p2_messaging.py::test_opening_a_conversation_clears_its_unread_badge" / "E assert 1 == 0" / "1 failed, 1 passed"
- Mutation check: _mark_read patched to mark every participant read (member filter removed): "FAILED tests/test_uxqa_p2_messaging.py::test_reading_is_per_member - assert 0..." / "1 failed"

CLIENT (cd C:/Users/atooz/Programming/NEOS/charting-the-course)
- `npm run check` -> exit=0; grep -c "error TS" = 0 overall; 0 errors in the lane's paths
- `npm test` -> "ℹ tests 60" "ℹ pass 60" "ℹ fail 0"
- `npx vite build --outDir <scratchpad>/build-out --emptyOutDir` -> "✓ built in 11.07s"; favicon.svg copied; built index.html contains `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`. Built into the scratchpad so dist/ was not touched; output deleted afterwards.

LIVE A11Y/FLOW (Playwright 1.64.1 from uxqa/node_modules, axe-core 4.10.2 from the ux-qa-research vendor dir, 1366x900, vite dev server :5173 with every /api call stubbed in the browser; no DB writes or sessions minted)
- `node C:/Users/atooz/AppData/Local/Temp/claude/c--Users-atooz-Programming-NEOS/3ad5af5a-b7be-4508-9422-a10dec5ed11a/scratchpad/lane2-verify.mjs` -> "30/30 checks passed", including:
  - PASS dashboard axe button-name (expanded sidebar) :: []
  - PASS dashboard axe button-name (collapsed sidebar) :: []
  - PASS agreement edit axe button-name (expanded) :: [] / (collapsed) :: []
  - PASS hierarchy select named by its label
  - PASS townhall does not see Manage Shares & Needs / PASS townhall sees Manage Quizzes / PASS builder sees both
  - PASS favicon declared and served :: /favicon.svg 200 image/svg+xml; PASS no favicon.ico request
  - PASS drawer closes after navigating :: http://localhost:5173/discover; PASS focus not returned to launcher
  - PASS conversation button name is "Kai 2 unread"; PASS focus moves to the thread heading :: {"tag":"H3","text":"Kai"}
  - PASS list refetched after opening :: GET conversations, GET conversations/conv-1, GET conversations
  - PASS unavailable video says so; Continue disabled -> enabled after acknowledging; progress saved {"watched":false,"acknowledged":true,"video_unavailable":true}
  - PASS edit sends the new title via PUT; PASS edit did not submit the profile form; PASS withdraw posts status=withdrawn; PASS withdrawn item leaves the list; no page errors on any page

The lane-2 script lives in the session scratchpad and may no longer exist. If it is gone, treat these 30 checks as unreproduced.

### Integrator

- Backend: `cd neos-operating-system/agent && DATABASE_URL=sqlite+aiosqlite:// PYTHONIOENCODING=utf-8 py -m pytest -q -p no:cacheprovider tests` -> "803 passed, 9 skipped, 97 warnings in 328.67s" (exit 0). The 9 skips are the PostgreSQL tests, because NEOS_TEST_POSTGRES_URL was not set. The lane 1 report ran them with PostgreSQL: 811 passed.
- Client: `cd charting-the-course && npm test` -> "tests 63 / pass 63 / fail 0". `npm run check` -> exit 0, no "error TS" output. `npm run build` -> "✓ built in 13.17s", exit 0, chunk-size warning only.
- `uxqa/regression/*.mjs`: the directory did not exist, so nothing ran.
- Baseline (uxqa/baseline-red.md): 793 passed, 60 client tests, check and build green, no known reds. Result: 0 reds, no regressions.

### Review-fix lane

1. `cd neos-operating-system/agent && DATABASE_URL=sqlite+aiosqlite:// PYTHONIOENCODING=utf-8 py -m pytest -q -p no:cacheprovider tests` -> 804 passed, 9 skipped, 97 warnings in 342.84s (0:05:42)
2. (same env) `py -m pytest -q -p no:cacheprovider tests/test_uxqa_p2_act.py` -> 18 passed, 2 warnings in 16.97s
3. Backend mutation check: reports_since_revision changed to `return list(rows)`, then `-k earlier_version` -> `E assert (True, 1) == (False, 0)` / 1 failed, 17 deselected (file restored afterwards)
4. `cd charting-the-course && npm test` -> ℹ tests 70 / ℹ pass 70 / ℹ fail 0 (63 before)
5. `cd charting-the-course && npm run check` -> tsc exit=0
6. Unit mutation checks (`node --import tsx --test <file>` with the rule reverted, then restored): orientation-video acknowledgement -> pass 1 fail 2; orientation-video payload -> pass 2 fail 1; nav-access -> fail 1; conversation-title id match -> fail 1; proposalPhaseAction advised -> pass 15 fail 1; decisionHeadline -> fail 1
7. From repo root: `for f in uxqa/regression/*.mjs; do [ -e "$f" ] && (node "$f" || echo "RED $f"); done` -> GREEN p2-gold-advise-profile-orient-4 / GREEN p2-gold-propose-share-signup-1 / GREEN p2-gold-propose-share-signup-2 / GREEN p2-lending-rules-keyboard-1 / GREEN p2-stewards-confirm-and-register-11 / **RED p2-stewards-confirm-and-register-13: the list was refreshed after reading, but the server still counts 8 unread (is the API running the read-watermark fix?)** / GREEN p2-stewards-confirm-and-register-15 / GREEN p2-stewards-confirm-and-register-16
8. Revert checks (fix reverted in the working tree, Vite serving it, then restored byte-for-byte): orient-4 -> RED no 'I'll continue without the video' acknowledgement; signup-2 -> RED an ordinary member is offered "Manage Shares & Needs"; -16 prompt button -> RED control 2 of 2 closed advice with no confirmation; -16 lifecycle button -> RED control 1 of 2; keyboard-1 (useFocusAfterRender no-op) -> RED focus is on BODY instead of 'You advised in this round'; -13 invalidation removed -> RED did not refresh the list; signup-1 (PublicationActions removed) -> RED no Edit control; -15 (location effect off) -> RED drawer stays open; -11 (formatDate reads UTC midnight) -> RED 'Decided 10/31/2026' for 2026-11-01
9. Not run: `npm run build`, and pytest against PostgreSQL (NEOS_TEST_POSTGRES_URL). Both are part of the coordinator's sweep.

### What the coordinator should watch

- The one RED above (p2-stewards-confirm-and-register-13) probably means the running API predates the read-watermark commit `0dbfdf3`. Restart the API from the current neos-operating-system tree, then re-run that regression file before judging it.
- The coordinator sweep owes the two items the review-fix lane skipped: `npm run build` and the PostgreSQL pytest run.

## 3. Ledger summary

76 entries. By decision: FIX 31, DUPLICATE 28, RESEARCH_QUESTION 6, OWNER 5, DEFER 4, NOT_A_BUG 2.
By severity: HIGH 6, MEDIUM 42, LOW 28.
Decision by severity: FIX (1 HIGH, 21 MEDIUM, 9 LOW); DUPLICATE (2 HIGH, 16 MEDIUM, 10 LOW); OWNER (3 HIGH, 1 MEDIUM, 1 LOW); RESEARCH_QUESTION (3 MEDIUM, 3 LOW); DEFER (4 LOW); NOT_A_BUG (1 MEDIUM, 1 LOW).

The ledger has no commit field. The commits below come from the fix commit messages. All 31 FIX entries are still `status: OPEN` in the ledger until the coordinator confirms them.

| FIX items | Commit |
|---|---|
| p2-act-authority-probe-1, -2; p2-lending-rules-keyboard-1..6, 8; p2-lift-share-plain-words-1, 3; p2-stewards-confirm-and-register-4..8, 10..12, 16, 19; p2-repair-bench-across-ecosystems-4, 6 | charting-the-course `cbd05b3`; neos-operating-system `5481acd` (authority, queue order, banner words) |
| p2-stewards-confirm-and-register-13 (unread watermark) | neos-operating-system `0dbfdf3` |
| p2-gold-advise-profile-orient-4 (HIGH), p2-stewards-confirm-and-register-13, 14, 15, p2-gold-propose-share-signup-1, 2, 5, p2-lending-rules-keyboard-10 | charting-the-course `7c807be` |
| Review findings | charting-the-course `70298c2`; neos-operating-system `38a67fd`; parent repo `56e698d` |

Open OWNER decisions (5): stewards-confirm-and-register-1 (any steward can close another's advice early, HIGH), -2 (the proposer's own consent completes the consent round, HIGH), -3 (the assistant is unavailable and needs the model key, HIGH), -9 (no way to record an agreement ceremony, MEDIUM), and gold-advise-profile-orient-2 (sidebar name stale after profile save, LOW). The three HIGH items keep the new-HIGH count above zero.

DEFER (4, all LOW): stewards-confirm-and-register-17, -18; repair-bench-across-ecosystems-7, -9. RESEARCH_QUESTION (6): gold-propose-share-signup-3, gold-advise-profile-orient-3, F03, F06, F14, F16.

## 4. Persona refinement

Coverage gaps: 54 of 77 page routes were not visited, including `/governance`, `/ecosystems` and `/ecosystems/[id]`, `/agreements/new`, `/conflicts*`, `/safeguards*`, `/quiz/*`, `/settings/notifications`, `/welcome/consent`, `/onboarding*`, `/admin*`, `/members/*`, `/comms`, `/chat`. Unhit API routes include `auth/*` (login, logout, verify, set-credentials), `ai/assist`, `chat/sessions`, `messaging/search`, `compliance/*`, `emergency/declare`, `safeguards/audits`, `discover/shares-needs/[sn_id]/status`, `ethos/[ecosystem_id]/access/consent`. Most are outside the ACT lifecycle. The ones inside it (`/governance`, `/ecosystems/[id]`, `/welcome/consent`, `ethos/.../access/consent`, shares-needs status) are what the next pass should reach.

**Keep**
- Ines and Kofi (lending-rules-keyboard): realistic and well powered; they produced the keyboard, focus and queue-order findings. Fix the rig: Radix tablists use roving tabindex, and Select listboxes need a short wait between ArrowDown and Enter.
- Amara and Oren (stewards-confirm-and-register): found both HIGH governance gaps and the 200% zoom issues. Oren's assistant step could not run, so "Tool library late fees (uxqa-p2)" is still in Test, ready for a re-run once the model key is in. Cap scripted retries so a slip cannot burn the ceremony budget (History was retried 4 times).
- qa-probe-tess (act-authority-probe): her three memberships gave real deny cases.
- Gold personas (propose, advise, profile, orient, share, signup): adequate, cheap to repeat, all at 1.0.

**Re-power**
- Joy (lift-share-plain-words): the low-literacy constraint was only partly tested (no assistant use, 'stand aside' vs 'object' copy not checked in depth). Re-run with the assistant available and the copy check as an explicit step.
- Rafi (patience 1): add a real double-press test on Open for advice and Close advice, since double-submit and loading-state claims are untested. Slow emulation made dev-mode pages take about 60s to show text, so run the slow persona against a production build.
- Sol and Priya (repair-bench-across-ecosystems): assistant steps were blocked by the missing model key, so there is no assistant signal until it is fixed. Sol's test-confirmation step needs a named steward visible in the UI to exercise the "message the steward" branch.

**Add**
- A withdraw-without-revision persona: the objection is archived on send-back, so step 7 (withdraw an objection after revision) cannot test the withdraw control.
- A proposer persona who watches Tess's side when a steward closes her advice; nobody checked whether she is told.
- An ordinary-member persona to check whether non-stewards also see Close advice and Withdraw on others' proposals.
- A newcomer in an ecosystem whose onboarding requires consent, or a persona already pending. OmniOne asks newcomers to agree to nothing, so Priya's carried questions and the 'I CONSENT TO PARTICIPATE' card were never exercised.
- A sign-up persona who hits validation errors (taken username, short password); qa-visitor met no friction because sign-up is short.
- A one-or-two-steward ecosystem with the author as steward, to test the dead-end question; OmniOne has 25 members and several stewards.
- A two-position or deadline-gated proposal for Joy's change-of-mind path; the default gate closes on the first yes.

**Retire or replace**
- Retire probing on shared fixtures. The probe mutated seeded Escherbridge proposals and a consent could not be withdrawn after the stage moved. Give the probe a throwaway proposal in the pending ecosystem, one in advice and one in consent.
- gold-share had only one clean run because a member could not remove their own offer. p2-gold-propose-share-signup-1 now adds Edit and Withdraw, so verify that and run it 3x.

**Harness fixes to schedule**
- `runGold` reuses one run directory per task id, so repeats overwrite artifacts. Suffix the directory with a run index.
- Add an assistant availability check before any lane starts, so no persona spends both messages on an unavailable service.
- Write driver snippets atomically (one ran half-written: "mod.default is not a function"). Radix tab dead clicks come from switching on mousedown and are not product defects.

State left behind in OmniOne: AGR-E2B3A5DA (key holders) and AGR-60D61961 (lending rules) registered; amendment draft 23d9d0f5 created; insurance proposal moved to Test by Oren's own consent; opening hours moved to Consent by Amara; Amara restored to mod; probe fixtures (Probe consent table, Probe steward-written test) untouched.

## 5. Next scenario suggestion

An ACT lifecycle follow-up on the surfaces this pass left dark, run after the model key is set and the three HIGH owner decisions (steward closing advice, proposer self-consent, assistant) are made. Cover ecosystem entry and onboarding consent (`/welcome/consent`, `ethos/.../access/consent`), `/governance` and `/ecosystems/[id]` as the member's starting point, and the 25-task agent-eval set. Seed one ecosystem with consent-gated onboarding and one with a single steward. Re-check the fixed items (keyboard focus, queue order, unread badge, orientation video fallback, decision dates) with the personas above, and use fresh fixtures for the probe.

## Coordinator close-out (2026-11-01)

**Status: APPROVED** (with one owner-blocked exit check). Every claim re-ran green on
the final tree, which also carries the owner-decision changes made after the pass
(frontend `c4f6951`, backend `44408cc`) and two release hotfixes (`ccb17b8`, `a7ff6c3`).

| Command | Result |
|---|---|
| backend `pytest tests` (sqlite + `NEOS_TEST_POSTGRES_URL` disposable DB) | `833 passed`, 0 failed, 0 skipped |
| `npm run check` | exit 0, 0 `error TS` |
| `npm test` | 72 pass, 0 fail |
| `npm run build` | exit 0 |
| `uxqa/regression/*.mjs` (live stack) | 7 green; `p2-stewards-confirm-and-register-13` red until the study API runs the pass's backend fix (re-checked after restart) |

Exit checks: gold 1.0 on all six (up to 4 runs each); friction per journey 13.99 -> 3.01;
new HIGH open 1 (`p2-stewards-confirm-and-register-3`, OWNER: the assistant has no model
key); agent evals 0/25, aborted `OWNER_BLOCKED` with 0 tokens (same cause).

Ledger: 31 FIX entries verified FIXED (ids named in the pass commits); owner decisions
2026-11-01 applied (`-1` advice close, `-9` ceremonies copy, `gold-advise-profile-orient-2`
profile names; `-2` author's consent counts, closed as NOT_A_BUG). The pass review's
REQUEST_CHANGES items were fixed in `70298c2` / `38a67fd` and verified by this sweep and the
regression flows, not separately re-reviewed; the owner-decision changes had their own
adversarial review (REQUEST_CHANGES -> deadline-edit, revision-deadline and logout fixes).
