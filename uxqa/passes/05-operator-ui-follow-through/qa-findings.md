---
type: QA Findings
title: Pass 05 baseline and final safety fix wave
status: TRIAGE
---

All seven gold journeys completed on their first instrumented run. The new mocked NodeAdmin regression and corrected continuity regression passed. These successes do not replace the live failures below.

| Finding | Evidence | Confirmed cause / next check |
|---|---|---|
| HIGH: ordinary assistant guessed OmniOne for a new draft before the user selected Oasis, then created another draft in Oasis | `agent-evals/transcripts/C3-1.json`, including authoritative created-proposal readbacks | Prompt guidance did not enforce target choice. Add server-side prevention of guessed multi-organization creation; follow up with the same two-turn request and assert no first-turn write and exactly one final draft in Oasis. |
| HIGH: valid inspected support correction returns HTTP 500 | `flows/node-admin-capabilities.json`, unique probe proposal and audit IDs | Creation succeeded, update failed. Inspect async ORM refresh after expression-updated timestamps before serialization/private snapshots; recheck successful correction, stale-version refusal and audit rollback. |
| HIGH: memberless support assistant cannot reach a valid review/confirmation for an explicit draft request | `runs/qa-node-support--memberless-support-proposal/trace.zip`, `runs/memberless-support-visible-responses.json` | Complete 67-resource catalog is truncated by the generic tool-result budget; unconstrained resource/action strings invite guessing. Provide a compact complete index, targeted field schema and bounded canonical enums. Exact failed tool arguments were not retained by browser/history artifacts, so their specific values are unknown. |
| MEDIUM: failed support requests lose the selected organization/reason in public audit | `support-constraints-lane.md`; anonymous audit observations | Failure logging defaults to node-wide Technical support instead of selected Plan Systems / Agent testing. Preserve validated safe context without copying command bodies. |
| LOW: R1 correctly states two rounds required and one completed but fails the rigid wording expression | `agent-evals/transcripts/R1-1.json` | Expand bounded equivalent-wording checks with negative contracts. Preserve the original result and document corrected-harness follow-up separately. |
| MEDIUM: P1 remains above grade-8 reading heuristic | `agent-eval.json` | Record as repeated quality gap; evaluate factual correctness independently and retain human reading-comprehension validation. |
| LOW: deterministic driver confused visible reply with hidden live announcement, then failed to mock session detail URLs | retained continuity probe runs and `.omc/research/p5-continuity-regression*.log` | Scope reply assertions to visible message prose and use a route pattern covering both session lists and details. Corrected probe is GREEN; prior failed traces remain. |

Normal operator profile help now links `/me` and names the actual Profile, Display name and Save profile controls. The guided advice answer removed the false cutoff and names the proposer's closure authority; continued advice and no automatic progression remain implicit, while the visible overdue record corroborates them. The first hidden-composer observation failure after navigation is retained in the operator lane report.

No final source test sweep or production deployment has occurred for this change set. Batch these source fixes before the integrated check sweep. Preserve baseline measurements and label any affected follow-up as a separate run; this bounded study has not converged.
