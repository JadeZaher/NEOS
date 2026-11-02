---
type: UX Lane Report
title: Repaired memberless support followup 1
status: BLOCKED_AT_CONFIRMATION
---

This is a new, explicitly authorized followup after the coordinator's API READY message. It does not replace the original failed live support baseline in support-constraints-lane.md. Sana used a fresh 390×844 browser context, the existing QA session, and visible Node Administration controls to choose Plan Systems and public reason category Agent testing. There were exactly two live assistant messages: the requested draft review, then Yes. No rephrase, third call, direct API/DB action, product-source read, environment change, test suite, commit or deployment occurred.

## Observed behavior

The first prompt specified title Support handoff followup (uxqa-p5-ui); proposed_change Add a weekly checklist for handing off community broadband equipment; rationale This synthetic uxqa-p5-ui fixture verifies memberless operator support and clearer equipment handoffs; proposal_type operational; status draft. It asked for exact target/action/values and confirmation before creation, with Sana as the actor and Agent testing as the public reason category.

The first response improved on the baseline. The visible tool status showed Reading the support catalog done and Node support list done. The agent presented the correct Plan Systems target, Create proposals action, exact title/change/rationale, operational type, draft status, and the selected organization identifier. It said attribution would be Sana Support Uxqa under Agent testing, then asked Shall I go ahead and create this proposal? No structured pending-action card was visible.

After reviewing those correct values, Sana sent the allowed second and final message, Yes. The response was: There is no pending action to confirm. Tell me what you want to do. There was no execution tool status, create receipt, or record link. The visible goal therefore remains FAILED; the uxSession outcome is BLOCKED. The agent's textual request for confirmation was not backed by an actionable pending confirmation. This lane establishes the user-visible failure, not its code cause.

Following the visible Public support history link and filtering by Sana's UI-observed public actor identifier showed her latest catalog/list receipts with Node admin badge, actual actor Sana Support Uxqa, correct Plan Systems organization identifier and Agent testing category. Those receipts showed No record created / No field values changed. Viewed cards excluded the full prompt, draft field values and private narrative. No creation receipt was observed, so creation attribution and successful mutation redaction remain unverified. Anonymous access was established in the earlier baseline lane, not independently repeated here.

## Evidence

- Run: runs/qa-node-support--memberless-support-followup-1/
- Trace: trace.zip
- Instrumentation: ux.json
- Screenshots: followup-exact-review-390.png, followup-confirmation-result-390.png, followup-public-audit.png, followup-sana-audit-filtered.png
- Complete visible review, result and audit: runs/memberless-support-followup-1-visible.json
- Saved flow: flows/support-followup-1/observed-flow.mjs; node --check passed, no replay performed

Metrics: BLOCKED, 66 seconds, 8 clicks, 0 dead/rage clicks, 0 failed attempts, 0 workarounds, no abandonment, 8 HTTP errors, 9 console errors, friction 34. Error totals include the memberless app's observed requests and do not by themselves identify the confirmation defect. Both baseline and followup remain available for the independent verifier.
