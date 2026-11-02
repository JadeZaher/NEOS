---
type: UX Lane Report
title: Pass 05 gold UI lane
---

Status: COMPLETED. Seven of seven gold journeys completed on their first instrumented run, with no reruns. A coordinator-requested API reload occurred at a safe boundary after profile and before share; the remaining journeys resumed only after the coordinator re-proved health and the isolated database sentinel. No submission was interrupted.

The lane uses visible UI only, current accessible labels from pass 04, and `runGold` for every journey. One attempt per step, at most three steps per goal, no fresh reruns. The tasks run sequentially in order signup → propose → advise → profile → share → orient → respond. No application source, direct API calls, database access, model calls, suite execution, reset, reseed, or deployment.

Advisor controls use keyboard activation and typing with locator-assisted focus. Zero pointer clicks are checked, but natural Tab-order usability is outside this lane.

## Results

Evidence directory prefix: `uxqa/passes/05-operator-ui-follow-through/runs/`. Every finalized journey includes ux.json, trace.zip, and screenshots.

| Goal | Result | Seconds / friction | Evidence directory / screenshot |
|---|---|---|---|
| Signup | COMPLETED first run | 15 / 6 | `qa-visitor--gold-signup/create-account.png` |
| Propose and open advice | COMPLETED first run | 13 / 2 | `qa-gold-member--gold-propose/open-proposal-for-advice.png` |
| Give advice | COMPLETED first run; real advice submit observed | 12 / 2 | `qa-gold-advisor--gold-advise/write-and-submit-advice.png` |
| Profile rename | COMPLETED first run | 11 / 2 | `qa-gold-advisor--gold-profile/save-display-name.png` |
| Public share | COMPLETED first run; listing says EVERYONE ON NEOS | 17 / 2 | `qa-gold-member--gold-share/confirm-public-listing.png` |
| Actual orientation journey | COMPLETED first run; Step 1 of 8, not a quiz | 9 / 2 | `qa-gold-newcomer--gold-orient/start-actual-journey.png` |
| Cross-ecosystem response | COMPLETED first run; Message sent to Kenny and Open the conversation visible | 20 / 2 | `qa-gold-advisor--gold-respond/send-offer-of-help.png` |

Completed runs have zero failed attempts, workarounds, dead clicks, rage clicks, or validation errors. Advisor completed runs have zero pointer clicks. Harness axeViolations=0 is not an accessibility approval; no axe scan was run.

Signup's anonymous auth/me 401 precedes registration and does not block it. An initial denied-resource console error appears across runs and remains a local resource/network hypothesis, not a confirmed product source gap.

The orientation welcome video again could not load, with explicit continue-without-video controls. This did not prevent starting the actual journey. Evidence: `qa-gold-newcomer--gold-orient/start-actual-journey.png`. A separate content/network probe is needed before attributing this to application code.

Machine details: `gold-ui-results.json`. Runnable drivers: `flows/gold-ui/run.mjs` and sequential launcher `all.mjs`. A temporary PAUSE file gated new journeys before browser creation during the coordinator reload, then was removed after the ready signal.
