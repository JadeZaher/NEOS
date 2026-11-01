---
type: Pass Verdict
pass: 03-cross-ecosystem-exchange
scenario: cross-ecosystem-exchange
status: CHANGES_REQUESTED
---

# Pass 03 verdict (changes requested)

## 1. Exit checks

Source: original `ux-report.json` exitChecks and `ledger.json`; current operator evaluation and deployment verification are in [deployment.md](deployment.md). Original gold journeys have not been rerun as a complete pass.

| Check | Target | Observed | Result |
|---|---|---|---|
| Gold success | at least 0.80 per gold task | gold-advise 1.00, gold-profile 1.00, gold-propose 1.00, gold-signup 1.00, gold-share 0.80, gold-orient 0 (1 run), gold-respond 0.17 (6 runs). Below target: gold-orient, gold-respond | not met |
| Friction per journey vs previous pass | no worse than 02-act-lifecycle plus 0.1 | 2.54 now, 3.01 in 02 (13.99 in 01) | met |
| New HIGH findings | 0 | Original pass: 3 HIGH ledger entries represented 2 distinct items: the response queue defect and a missing model key, plus a duplicate. The queue fix is deployed and the Pi key/Gemini configuration now works in the study and production. | historical finding count; per-entry ledger closure has not been reconciled |
| Route coverage | no target set | 34 of 78 page routes visited (0.436); 68 of 153 declared API routes hit | no target |
| Agent-eval pass rate | at least 0.80 | Gemini: 14/25 passed, 10 failed, 1 skipped; 0 state violations; all independent judge scores finalized | not met (0.56) |
| Review verdict | | final source reviews APPROVE; research exit checks remain unmet | source approved; pass changes requested |
| Coordinator re-run | all commands in section 2 green | backend 1,370 passed plus final follow-up 82; frontend 110 passed, final tsc/build 0; harness 20 passed; browser regression 13/13 | source checks green; see deployment record |

## 2. Claims to re-run

These are the fix lanes' and the integrator's reports, verbatim. The coordinator runs them once, at the end.

### Lane A (backend, fixes)

```
No pytest run, per the lane rule (coordinator's single end sweep). Commands run, all from C:/Users/atooz/Programming/NEOS/neos-operating-system/agent unless noted:
1) `C:/Python314/python.exe -m py_compile src/neos_agent/services/next_steps.py src/neos_agent/services/health.py src/neos_agent/services/exchange.py src/neos_agent/api/safeguards.py src/neos_agent/api/schemas/safeguards.py src/neos_agent/api/agreements.py tests/test_uxqa_p3_exchange.py tests/test_uxqa_p3_health.py tests/test_uxqa_p3_onboarding.py && echo COMPILED` -> `COMPILED`
2) `PYTHONPATH=src:. C:/Python314/python.exe -c "import tests.test_uxqa_p3_exchange, tests.test_uxqa_p3_health, tests.test_uxqa_p3_onboarding; ... sorted(items, key=ns._queue_order)"` -> `imported 2 3 2` (test functions per file; the exchange order test is parametrized x3), FIRST_TIER printed with all 9 actions, and the synthetic queue sorted to `['give_advice'(overdue), 'read_response', 'give_advice'(dated), 'start_orientation', 'take_entry_quiz']`
3) `PYTHONPATH=src C:/Python314/python.exe -c "<AuditDetail(completed_at=date, ecosystem_name) -> HealthSummary round-trip>"` -> `2026-11-01 Oasis` / `2026-11-01 Oasis`
4) `cd C:/Users/atooz/Programming/NEOS/charting-the-course && npm run check` (log: C:/Users/atooz/AppData/Local/Temp/claude/c--Users-atooz-Programming-NEOS/3ad5af5a-b7be-4508-9422-a10dec5ed11a/scratchpad/tsc-lane-a.log) -> exit=2, 3 `error TS` lines, 0 in my paths. All 3 are in client files lane B is editing right now (git status shows them modified): `GovernanceHealthAuditForm.tsx(106,101) TS18047 'lastSnapshot.current' is possibly 'null'` and `AuditDetail.tsx(144,52)/(145,49) TS2322 Property 'auditId' does not exist`.
New tests for the end sweep: `uv run pytest tests/test_uxqa_p3_exchange.py tests/test_uxqa_p3_health.py tests/test_uxqa_p3_onboarding.py` (7 tests, 9 cases with parametrization).
```

### Lane B (client, fixes)

```
Commands run, with their result lines:
1. cd C:/Users/atooz/Programming/NEOS/charting-the-course && npm run check  ->  '> neos-frontend@1.0.0 check' / '> tsc' / exit=0, no diagnostics. Run after the last edit; the whole project, so every lane-B path is included.
2. npx tsc --noEmit -p . (earlier pass): one error in my file (GovernanceHealthAuditForm.tsx(106,101) TS18047 'lastSnapshot.current' is possibly 'null'), fixed. The re-run printed nothing.
3. Type check of the three edited test files (scratch tsconfig including conversation-title.test.ts, health.test.ts and nav-access.test.ts): the only error was client/src/lib/api-client.ts(6,30) TS2339 import.meta.env, caused by my scratch types override, not by the tests. The tests themselves type-check. The scratch config has been deleted.
4. Axe node capture, before (scratch axe-nodes.mjs as qa-gold-member, 1366 and 390 px, /dashboard, /discover, /discover?tab=shares-needs, /discover/collaborations/40304e62-..., each with and without a toast). With a toast: button-name x1 'button.right-2' (ToastClose), list x1 (toast viewport 'ol'), aria-hidden-focus x2 (Radix focus-proxy spans). On the collaboration page: definition-list x1 'dl', dlitem x6. Nothing without a toast on /dashboard or /discover.
5. Same capture, after: every page and width shows only 'aria-hidden-focus (serious) x2' (the Radix proxies) while a toast is up. button-name, list, definition-list and dlitem are gone.
6. Read-only UI probe (scratch probe-ui.mjs, qa-gold-member, 1366 px): 'post button {scroll:203,client:203} FITS'; 'manage quizzes links: 0'; 'first audience badge: Who can see it: Everyone on NEOS'; 'focus after opening a post link: {tag:H2, text:Repair partners for broadband days (uxqa-p3)}'; 'focus after closing it: {tag:A, text:Details, detail:3f0bb80d-...}'; 'unknown post dialog: This post is no longer available to you..., retry:false'.
7. Sign-up probe (scratch probe-login.mjs, a cookieless visitor, 409 refused so nothing written): {title:'Create Account', username:'qa_gold_member', invalid:'true', error:'That username is already taken. Choose another one.', focus:'reg-username', displayName:'Probe Person'}.
Not run, per the coordinator's single-end-sweep rule: npm test (node:test for conversation-title, health and nav-access) and the three new uxqa/regression flows.
```

### Integrator

```
git status in each of the three repos: the diffs touched only the declared files.

1. `cd neos-operating-system/agent && DATABASE_URL=sqlite+aiosqlite:// PYTHONIOENCODING=utf-8 py -m pytest -q -p no:cacheprovider tests` -> `1331 passed, 20 skipped, 1459 warnings in 792.29s`. The baseline was 793 passed; the count differs, but there were 0 failures.
2. `cd charting-the-course && npm run check` -> exit 0, no `error TS`.
3. `npm test` -> `tests 102 / pass 102 / fail 0`. The baseline was 60; the extra tests are new.
4. `npm run build` -> `built in 12.99s`, exit 0, chunk-size warning only.
5. Loop over `uxqa/regression/*.mjs`, result lines:
   - GREEN: p2-gold-advise-profile-orient-4, p2-gold-propose-share-signup-1, p2-stewards-confirm-and-register-11, p2-stewards-confirm-and-register-13, p2-stewards-confirm-and-register-15, p3-gold-signup-orient-3, p3-needs-across-ecosystems-4, p3-plain-words-and-joining-1.
   - RED, 'no session for qa-new-sol; re-run the adapter seed step': c-respond-unread, p2-lending-rules-keyboard-1, p2-stewards-confirm-and-register-16.
   - RED, 'a townhall member lost "Manage Quizzes"': p2-gold-propose-share-signup-2. This was expected, from the lane B nav change. I updated the assertion, and the re-run now fails only on 'a builder no longer sees "Manage Shares & Needs"'.
Baseline (uxqa/baseline-red.md): no pre-existing reds, so every red above is a triage item, but none of them traces to the lane diffs.
```

### Review-fix lane

```
Client (cwd C:/Users/atooz/Programming/NEOS/charting-the-course):
- `npm test` -> "ℹ tests 105 / ℹ pass 105 / ℹ fail 0"
- `npm run check` (tsc) -> exit 0, no output
- `npx tsc -p tsconfig.json --noEmit` (earlier) -> "tsc exit 0"
- `node --import tsx --test client/src/lib/nav-access.test.ts` (one early run of the harness) -> "ℹ tests 6 / ℹ pass 6 / ℹ fail 0"
Backend (cwd C:/Users/atooz/Programming/NEOS/neos-operating-system/agent, with `DATABASE_URL` exported to a non-existent local 5433 DB so nothing could reach Railway; the tests themselves use SQLite):
- `py -m pytest tests/test_uxqa_p3_health.py tests/test_g_health.py tests/test_act_lifecycle.py tests/test_g_act_flows.py -q -p no:cacheprovider` -> "114 passed, 2 skipped, 1 warning in 72.79s"
- `py -m pytest tests/test_g_next.py tests/test_onboarding_boundaries.py tests/test_onboarding_flows.py tests/test_uxqa_p1_mcp_parity.py tests/test_uxqa_p2_act.py -q -p no:cacheprovider` -> "137 passed, 387 warnings in 112.54s"
Regression (cwd C:/Users/atooz/Programming/NEOS, local study stack :5173/:8000, neos_uxqa):
- `node uxqa/regression/p2-gold-propose-share-signup-2.mjs` -> "GREEN p2-gold-propose-share-signup-2" (exit 0)
- `node uxqa/regression/p3-collaboration-and-moderation-10.mjs` -> "GREEN p3-collaboration-and-moderation-10" (exit 0)
- Red checks with each fix reverted in the working tree (then restored): with the route back on requiredPermission="canManageContent" -> "RED p3-collaboration-and-moderation-10: /quiz/manage admits an ordinary member, whose quiz writes the server refuses"; with the Dashboard action forced on -> "RED ...: an ordinary member is offered \"Manage learning\", whose quiz writes the server refuses"
- Drift check with a scratch script, `flow.as("qa-member-ines", { requires: platform admin })` -> "RED drift-check: flow error: Error: fixture drift: qa-member-ines is not a platform admin on this seed (is_platform_admin=false, OmniOne steward=false)..." (its run dir was deleted afterwards)
- Full sweep `for f in uxqa/regression/*.mjs; do node "$f"; done` -> 10 GREEN; RED c-respond-unread, p2-lending-rules-keyboard-1, p2-stewards-confirm-and-register-16 ("no session for qa-new-sol"). After switching those three to qa-new-kofi: "GREEN c-respond-unread", "GREEN p2-lending-rules-keyboard-1", "GREEN p2-stewards-confirm-and-register-16". Total 13/13 GREEN on the final code.
```

Notes for the coordinator: the integrator's full backend run (1331 passed) predates the review-fix lane, so re-run the whole sweep once on the final tree. The regression loop needs the local study stack (:5173 and :8000, database neos_uxqa) and a fresh adapter seed.

## 3. Ledger summary

74 entries in `ledger.json`.

| Decision | Count |
|---|---|
| FIX | 29 |
| DUPLICATE | 29 |
| RESEARCH_QUESTION | 9 |
| OWNER | 3 |
| DEFER | 3 |
| NOT_A_BUG | 1 |

| Severity | Count |
|---|---|
| HIGH | 3 |
| MEDIUM | 37 |
| LOW | 34 |

FIX by severity: 1 HIGH, 18 MEDIUM, 10 LOW. The one HIGH FIX is p3-needs-across-ecosystems-1: an answer to your post sits near the bottom of the bell and queue, and the Messaging link has no unread count (root cause in `_queue_order` in `next_steps.py`). The other HIGH entries are an OWNER item (assistant unavailable, no model key on the study stack) and a DUPLICATE of the first.

Status field: 71 entries are OPEN and 3 DEFERRED (the DEFER items). The ledger records no per-entry fix commit, so none of the 29 FIX entries is marked closed there. The commits that carry the fixes are `789bca5` (pass-03 regression flows for p3-gold-signup-orient-3, p3-needs-across-ecosystems-4, p3-plain-words-and-joining-1 and p3-collaboration-and-moderation-10, the quiz-nav assertion update, submodule pointers) and `b16a852` (review findings). The coordinator should reconcile FIX entries to commits after the re-run.

## 4. Persona refinement and coverage gaps

Coverage gaps: 44 of 78 page routes were not visited. Most are list or index pages (`/members`, `/decisions`, `/conflicts`, `/governance`, `/compliance`, `/emergency`, `/map`, `/chat`, `/explore`, `/profile`, `/quizzes`, `/comms`, `/admin`), the `/new` and `/edit` forms, and the orientation journey and ceremony pages. 85 of 153 declared API routes were not hit, among them auth (login, logout, verify, challenge), `emergency/declare`, `compliance/*`, `ai/assist`, `messaging/search` and the collaboration `activate` and `review` routes. This pass was centred on exchange, so the remaining gaps are mostly other scenarios' territory. The ones that belong to this scenario are the collaboration `activate` and `review` routes and the safeguards `abandon` route.

**Keep**
- qa-gold-member, qa-gold-advisor, qa-visitor: stable and well-powered. Sign-up worked first time every run. Rebuild the gold drivers from visible labels each pass, and add a step that closes the post modal after publishing.
- Tess (authority probe): her three memberships cover every deny case. Keep her for API authority checks.
- Priya (independent auditor): her habit of reading every prompt exposed the 1-rating "Yes, publish" trap. Keep.
- Ines (collaborator, keyboard-only): realistic as a non-steward member. Keep.
- Lena (390 px) and Amara (200% zoom): both worked. Keep, but replace the double-tap with a check that the Approve button disappears or disables after the first tap, because a double tap cannot be simulated reliably.
- Rafi and Mateo: their wording and sign-up checks were useful. Keep them.

**Re-power**
- Oren (steward, de-DE, patience 4): his locale was productive, but no OmniOne agreement in force fell due within 14 days, so the review dialog never ran. Prebake one OmniOne agreement due within the window through the real API with the pass marker. As an alternative, give the steward lane an Oasis or Plan Systems admin who owns the 2 overdue reviews.
- Dara: needs the Escherbridge ecosystem pre-selected, because the seeded session does not carry the ecosystem cookie. Her leave-and-return journey cannot be completed alone, since an exit needs a steward's confirmation. Add a steward step (or the Escherbridge admin persona) or drop steps 8-9.
- Tomas (stuck newcomer): one self-service press cleared his stuck state, so the Amara fallback was never exercised. Prebake a state that needs a human to resolve.
- qa-gold-newcomer: n=1 is fragile, because the driver spent its only run on the quiz. Use a goal-driven driver that tries the second queue item or the "Orientation" shortcut after a failure, and separate quiz from journey in the goal text.
- Mateo and Joy: both gave the assistant no questions. Run these once the assistant works.

**Add**
- A genuinely non-expert member (low literacy or text-only) to judge whether a published audit and the computed snapshot are understandable. Priya is an expert, so this was judged by proxy.
- A validation-error persona for sign-up (taken username, short password). The gold lane does not cover it.
- A persona in Plan Systems, to exercise the consent gate and join-first orientation. Both gold-orient personas start in OmniOne.
- A non-member for the authority probe (a `visibility=ecosystem` read by someone with no row, and the Plan Systems agreement stage). Tess cannot prove these, because the viewer is the user's whole membership set.
- A streaming-aware request helper for the harness. `request()` cannot read SSE, so a probe lane that must judge assistant replies cannot yet do so.

**Retire**
- No persona is retired. Reduce the repeats on qa-visitor sign-up from 3 to 1, because it added little signal. Gold-share and gold-propose run in about 12s, so a slower or low-literacy variant would be more informative than more repeats.

**Gold task definitions**
- gold-respond: its predicate "Message sent to" only fits the first answer, so repeat responders (runs 2 and 3) score PARTIAL although the reply is delivered. Accept the follow-up text in the conversation too, and use the UI labels "Offer help" (needs) and "Ask for this" (offers) in the brief instead of "Respond". Run indices do not line up with the brief's run numbers, so map them in the journey notes.

**Fixture resets before the next pass**
- Each Mateo run created a marker-tagged account and added a consent to the Plan Systems agreement, so the fixture consent count no longer matches the prebake value. Reset it.
- Prebake a non-Probe Plan Systems post, because "propose from his own offer to Plan Systems" is not possible in the product.
- Prebake a second overdue agreement in scope, so the sunset branch of the review is exercised (AGR-EB-005 belongs to Escherbridge).
- The assistant was unavailable (no model key on the study stack), so the assistant-answer, assistant-versus-page and agent-eval steps were untested. This is an OWNER item; set a key on the study stack or accept that these stay unmeasured.

## 5. Next scenario suggestion

Re-run this scenario's gaps before widening: the failing gold tasks (gold-respond, gold-orient), the review dialog, the sunset branch, and the assistant steps once a model key is set on the study stack. Then rotate to a scenario aimed at the unvisited governance and conflict routes (`/conflicts`, `/decisions`, `/emergency`, `/governance`, `/compliance`), for example a conflict-and-emergency scenario covering `conflicts/new`, repair agreements, `emergency/declare` and `complete-recovery`. Those routes hold most of the 44 unvisited pages and the unhit API routes.
