---
type: UX Lane Report
title: Live memberless support, public audit, and constrained read navigation
status: BASELINE_SUPPORT_FAILED
---

The original live support task FAILED and its uxSession outcome is BLOCKED. Both allowed live assistant sends ended with visible tool errors and a generic unable-to-generate response. There was no review, confirmation request, Yes, success receipt, or verified proposal creation. This baseline must remain separate from any later repaired follow-up.

## Live memberless support failure

Sana Support Uxqa used the actual 390×844 interface: sidebar Node Administration, Support organization Plan Systems, Public reason category Agent testing, then Start agent support for Plan Systems. The drawer displayed Node support, the chosen organization identifier, Agent testing, and the warning that actions are public and member consent is never impersonated. It did not label this new support conversation with the private-visibility control visible in ordinary member history, so privacy was not established by this lane.

The first live prompt asked for a draft titled Support handoff checklist (uxqa-p5-ui), a weekly broadband-equipment handoff checklist, synthetic agent-testing rationale, attribution to Sana, and review/confirmation before creation. Visible statuses included Unknown support resource twice; catalog/list completions; Applying your confirmed support change didn't go through; Unsupported support command; and I wasn't able to generate a response for that. Please try rephrasing your question or try again in a moment. The “confirmed support change” wording appeared despite no confirmation having occurred.

The final budgeted send rephrased the same bounded request without quoted title text and again requested confirmation first. It also ended unable to generate a response, with repeated Unknown support resource statuses and Applying your confirmed support change didn't go through / Unknown support resource. The coordinator's stop-rephrase message arrived after this second send and response had already completed. No more AI messages were sent anywhere in the lane.

Evidence: `runs/qa-node-support--memberless-support-proposal/trace.zip`, `ux.json`, `memberless-support-review-390.png`, `memberless-support-final-response.png`; complete visible responses in `runs/memberless-support-visible-responses.json`. The root and verifier were notified as soon as the trace finished. The lane inferred no exact malformed tool arguments from these statuses.

## Operator and anonymous UI

Oren's desktop sidebar and Node Administration showed a Node admin badge. The Resources screen exposed support scope separately from normal ecosystem selection, a broad resource catalog, a required public-reason category, and support-session entry. Node admins listed both Oren Feldmann and Sana Support Uxqa with badges and grant timestamps. No grant, revoke, record inspection, archive, or restore was attempted.

Signed-out access to the UI-observed Public support history link worked. Public audit list and individual failed receipt showed actor identity, Node admin badge, outcome, resource, organization, changed field names, and public category; viewed entries did not expose the draft title, full prompt, narrative rationale, or private record bodies. The public roster linked both operator profiles. Sana's profile showed Node admin with Ecosystems 0, Domains 0 and No ecosystem memberships to display, consistent with the assigned memberless setup.

Audit-context gap: successful list/catalog receipts showed Plan Systems and Agent testing, whereas failed agent_support_request receipts from the same activity showed Organization Node-wide and Public reason category Technical support. An anonymous single-receipt page reproduced this mismatch. This visible inconsistency was escalated to the coordinator; backend cause was outside this UI-only lane.

Evidence: `runs/qa-member-oren--operator-admin-ui-inspection/trace.zip`, `two-node-admins-loaded.png`, `runs/oren-admin-ui.json`; `runs/anon--anonymous-public-support-audit/trace.zip`, `anonymous-public-audit.png`, `anonymous-failed-receipt.png`, `anonymous-support-public-profile.png`, and `runs/anonymous-audit-ui.json`.

## Constrained read navigation

Priya, 390×844, recovered her existing consent/exit conversation via Chat history. This is historical content from pass04, not a fresh pass05 model response. Required facts remained readable: consent not voting, no reasoned objection, stand aside; voluntary exit, no penalty, handoff, export. A new unsent draft and transcript survived expansion, minimization, closing/reopening, and Messaging navigation. Collapsed panel x16/y169.2, 358×590.8; expanded x16/y42.6, 358×717.4. Composer x28/y680, 286×68 and 44×44 close control stayed within the viewport. Zero sends.

Kofi acted only through natural Tab/Enter keyboard navigation, with the accessibility tree as perception. Safety & Integrity → Exit → Leave this ecosystem opened a read-only form explaining nobody can refuse departure, membership remains until steward confirmation, standard 30-day/urgent 7-day handoff, role/commitment handover, withdrawal, governance-record download, and effects on posts/conversations. He did not file an exit. Dashboard → marker-tagged Probe consent table (uxqa-p2) → Record Your Position exposed the inline Consent tab, explained distinct consent/stand-aside/object positions and reasoned objections, and showed a labeled Position combobox. He neither chose nor recorded a position. Zero sends, pointer actions, source/API shortcuts, workarounds, or exhausted attempts. This is read-navigation coverage, not new model-quality or orientation completion evidence.

Evidence: `runs/qa-new-priya--mobile-consent-exit-read-continuity/trace.zip`, `consent-exit-history-390.png`, `expanded-history-draft-390.png`, `messaging-history-draft-390.png`, `runs/priya-read-continuity-ui.json`; `runs/qa-new-kofi--keyboard-consent-exit-navigation/trace.zip`, `keyboard-exit-form-read-only.png`, `keyboard-consent-choices-no-submit.png`, `runs/kofi-read-navigation-ui.json`.

## Outcomes and limits

| Run | Outcome | Seconds | Clicks | Dead/rage | HTTP/console errors | Workarounds | Friction |
|---|---|---:|---:|---:|---:|---:|---:|
| Oren operator UI | COMPLETED | 31 | 2 | 0/0 | 0/1 | 0 | 2 |
| Sana support creation | BLOCKED, task FAILED | 127 | 5 | 0/0 | 18/19 | 0 | 74 |
| Anonymous audit | COMPLETED | 48 | 2 | 0/0 | 2/4 | 0 | 12 |
| Priya historical read/continuity | COMPLETED | 28 | 12 | 0/0 | 0/1 | 0 | 2 |
| Kofi keyboard read | COMPLETED | 80 | 6 | 0/0 | 0/1 | 0 | 2 |

Every run called finish and saved a trace. Three driver assumptions caused waits outside instrumented attempt() calls: support start label changed after organization selection, public audit heading was Public node support history, and Record Your Position opened an inline tab rather than a dialog. These are disclosed harness errors, not product failures; the saved observed flow preserves them and requires correction for a clean future replay. The flow passes node --check; no replay was performed because it would spend additional real model calls. No tests, commits, deployments, environment changes, source inspection, DB access, or direct API actions occurred. No live support creation success, revocation-during-confirmation, last-admin protection, ordinary-user authority denial, or completed participation is claimed.
