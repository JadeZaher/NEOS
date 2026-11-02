---
type: Verification Record
title: Coordinator source and runtime verification
status: VERIFIED
---

The coordinator ran one integrated sweep after the implementation/fix waves, collected every backend failure, applied one reconciled repair batch and reran the affected modules. Earlier failures remain recorded; the full backend suite was not silently relabeled as a new clean run.

| Check | Observed result |
|---|---|
| Full backend `pytest -q -p no:cacheprovider tests` | 1,505 passed, 9 failed, 1,319.88 seconds; SQLite fixtures plus the separate local PostgreSQL test database |
| Repaired backend batch | 233 passed, 129.60 seconds; all six originally failing modules plus policy and routing contracts |
| Frontend full unit run | 136 passed, 0 failed |
| Frontend typecheck | Initial TS2802 on iterator spread; corrected with `Array.from`; final exit0 |
| Affected link-helper tests | 10 passed after the compatibility fix |
| Final frontend production build | Exit0; existing large-chunk advisory retained |
| Offline evaluation harness | 35 passed, 0 failed |
| Browser sweep | 15/15 GREEN; no live model responses used |
| Final public-audit badge regression | GREEN after removing badges from unverified historical actors |
| Real memberless support-link probe | GREEN: correct draft/organization, no automatic private inspection, one explicit audited inspection, zero identified Member-only requests |

The repaired backend command covered `test_g_next.py`, `test_governance_care.py`, `test_node_admin_support.py`, `test_onboarding_boundaries.py`, `test_operator_state.py`, `test_profiles.py`, `test_api_contracts.py` and `test_operator_routing.py`.

## Backend failure reconciliation

- Public profile serialization now explicitly awaits the current global NodeAdmin assignment instead of touching an expired computed ORM property. Privacy, revocation, disabling and memberless badge coverage pass.
- Queue/status parity still compares every shared REST field exactly. Only the deliberate six-field proposal lifecycle metadata is additionally checked as tool context.
- Governance-care and session-revocation assertions now use the service's UTC basis. Runtime time handling was not switched to local time.
- Onboarding fixtures grant explicit NodeAdmin authority to the intended global operators. The tests prove organization profiles alone do not grant it and that a User's global assignment remains separate from leaving/rejoining an organization.
- The new confirmation test now removes actual steward authority before execution. Existing proposal-management rules are preserved: `api/policy.py` and its established permission matrix have no diff. The refused approval invokes no model, performs no write and consumes the pending confirmation.

## Runtime evidence

The historical full operator evaluation remains **23/26 PASS with one actual state violation**. Its seven refusal categories preserve all fourteen protected repetitions. The final C3-only follow-up independently passes **5/4/5**, creates only the faithful Oasis draft after choice, has zero state violations and uses zero generation tokens. It does not replace the full baseline.

The real memberless support follow-up uses exactly two natural UI calls: preparation and the server confirmation button. Actual draft readback and a public creation receipt establish the selected organization, actual User, draft status and public reason category. Failed earlier support journeys remain separate. The final receipt-link and query repair was verified without another model call.

Public summaries are in `browser-regressions.json`, `real-link-verification.json` and `capability-verification.json`. Raw logs/captures remain local and ignored. Staged source and report checks found no credential patterns; raw session/flow/trace paths are excluded. Whitespace checks recognize the repositories' existing CRLF convention.

Source verification does not establish UX convergence. The retained full-pass state violation, aggregate friction increase, reading-level finding, welcome-video/network uncertainty and incomplete human/accessibility validation remain explicit in the verdict.
