---
type: UX Lane Report
title: Pass 04 gold UI lane
---

Seven goals completed through visible UI on the isolated local environment. All journeys finished through `runGold`, with screenshots, trace.zip and ux.json. No application source, direct API, database, assistant calls, product edits, commits, deployment, or test suite was used. The advisor used keyboard activation and typing with locator-assisted focus; this verifies no-pointer operation of the targeted controls, not natural Tab order.

## Results

Evidence paths below are relative to this pass's `runs/`. Each directory includes `ux.json`, `trace.zip`, and the named screenshot. Times include harness finalization.

| Goal | Outcome | Seconds / friction | Evidence directory / screenshot |
|---|---|---|---|
| Signup | COMPLETED first run; new account reached dashboard | 71 / 6 | `qa-visitor--gold-signup/create-account.png` |
| Propose and open advice | COMPLETED first run; real new proposal opened with Advice stage and proposer guidance | 77 / 2 | `qa-gold-member--gold-propose/open-proposal-for-advice.png` |
| Advise | COMPLETED corrected run; fresh advice submitted and visible in round, still Advice pending proposer decision | 55 / 2 | `qa-gold-advisor--gold-advise--run2/write-and-submit-advice.png` |
| Orientation | COMPLETED corrected run; actual journey Step 1 of 8, not quiz | 54 / 2 | `qa-gold-newcomer--gold-orient--run2/start-actual-journey.png` |
| Public share | COMPLETED first run; Discover listing visibly says EVERYONE ON NEOS | 53 / 2 | `qa-gold-member--gold-share/confirm-public-listing.png` |
| Profile | COMPLETED first run; saved display name appears in profile/sidebar | 53 / 2 | `qa-gold-advisor--gold-profile/save-display-name.png` |
| Cross-ecosystem response | COMPLETED corrected run; Escherbridge rainwater need, Offer help, typed message, sent to Kenny, Open the conversation visible | 47 / 2 | `qa-gold-advisor--gold-respond--run2/send-offer-of-help.png` |

Successful runs had zero failed attempts, zero workarounds, zero dead/rage clicks. Advisor runs had zero pointer clicks. No accessibility scan was run, so harness axeViolations=0 is not an accessibility approval.

## Preserved driver failures

Do not present these as an uninterrupted seven-of-seven first-run success. The first instrumented run of each goal below was BLOCKED, preserved in its unsuffixed directory, and explicitly reported to the coordinator before correction. Each old substep exhausted its three-attempt harness budget; one corrected driver journey followed. These extra driver attempts are a protocol deviation from a strict three-attempt total across all journeys and must not be hidden in aggregate reporting.

- `qa-gold-advisor--gold-advise`: 66s, friction18, three failed advice-form attempts after the old driver focused a noninteractive heading and Enter did not follow its enclosing link. Visible tree showed the proper `View proposal: Shared tool library (uxqa gold)` link. Corrected driver targeted that link. No advice was submitted in the failed run.
- `qa-gold-newcomer--gold-orient`: 46s, friction18, three failed attempts to find an old Begin link. The dashboard now opens Choose Your Journey directly, with Start Journey visible. Corrected driver used it. The failed run did not start an orientation journey.
- `qa-gold-advisor--gold-respond`: 52s, friction18, three failed attempts to find exact accessible name Offer help. The current accessible name includes the post title. Corrected driver used the named article and Offer help prefix. The failed run sent no message.

These are driver contract/focus failures, not established product defects or fixture failures. Their raw metrics remain in `gold-ui-results.json` and the run artifacts so the coordinator can classify trends honestly. The saved current driver is `flows/gold-ui/run.mjs`; each failure's original attempted locator is recorded in its ux.json and trace.

## Findings and next steps

1. Orientation welcome video failed to load after Start Journey. The page explicitly offers `I'll continue without the video` and `Confirm to continue`, so it did not prevent starting the journey. Evidence: `qa-gold-newcomer--gold-orient--run2/start-actual-journey.png`. Validate the content URL/provider and local network restrictions in a separate probe lane before treating this as a product source defect; this UI lane cannot establish the cause.
2. Every successful run recorded one initial `ERR_NETWORK_ACCESS_DENIED` console resource error. Signup also recorded anonymous `/auth/me` 401 before account creation. These did not block the journeys. Do not count the expected anonymous 401 as broken signup.
3. Keep current UI drivers aligned with title-qualified accessible names, semantic links and the direct journey chooser. Add a natural Tab traversal lane before making a full keyboard accessibility claim; this lane used focus assistance.
4. No product source gap was established. ACT advice remained in Advice after submission and correctly explained who closes it; public visibility and private response delivery were explicit and observable.

Machine detail: `gold-ui-results.json`. The machine report retains both failed original and successful corrected runs rather than replacing failed artifacts.
