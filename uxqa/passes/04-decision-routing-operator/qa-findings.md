---
type: QA Findings
title: Pass 04 observed findings before the fix wave
status: TRIAGE
---

# Observed findings

- **Guided advice deadline contradiction (MEDIUM, product content):** the live operator desktop journey selected the correct advice skill, but its answer said no further advice is accepted after the deadline. An actual overdue proposal still allowed advice and stated that the proposer closes the stage. The canonical skill and runtime guidance need to agree; a final precedence reminder alone did not prevent the error.
- **Platform profile guidance lacks a concrete route (MEDIUM, content):** the live direct-help answer suggested generic avatar/name/sidebar navigation and did not provide a verified link. The UI lane is checking the actual visible path before a platform-context correction.
- **Unread badge breaks new deterministic regression locator (LOW, harness):** first run of `p4-agent-routing-continuity` stopped at the exact accessible name `Messaging`; the button's unread badge contributes a count. The locator now accepts the count. The failed trace is retained and the remaining regression steps were not covered by that first run.
- **Orientation copied-driver assumption (LOW, harness):** the gold lane retained a failed run that expected an old Begin control. The current visible chooser offers Start Journey. A corrected UI-only run is recorded separately; this is not a silently replaced success.

Positive observations so far: actual skill-to-platform route clearing, readable per-message labels, transcript/session/draft continuity across drawer close, tabs and SPA/Messaging navigation, agent availability on Messaging, focus return, 390px geometry, complete direct consent and exit facts, and visible success for signup/proposal/share/profile goals. Final outcomes and quantitative summaries remain pending the lane artifacts and later verification.
