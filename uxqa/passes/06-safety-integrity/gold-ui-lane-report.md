---
type: UX Lane Report
title: Pass 06 seven gold UI journeys
pass: 06-safety-integrity
status: completed-with-findings
---

All seven original `runGold` predicates returned COMPLETED in one run each. This is automated UI evidence, not study convergence or human usability evidence. Original time limits and failure records were retained. No application source, database, direct application API calls, assistant messages, model keys, deployment changes, reseeds or restarts were used in this lane.

| Task | Harness outcome | Seconds | Friction | Observable evidence |
|---|---|---:|---:|---|
| gold-signup | COMPLETED | 106 | 27 | Fresh account, graded entry quiz 3/3 (100%), nongraded readiness 5/5 with valid No answers, active-member return page and dashboard |
| gold-propose | COMPLETED | 29 | 14 | Fresh Shared tool library proposal, Advice stage banner; observed create and status POSTs |
| gold-advise | COMPLETED | 47 | 14 | Fresh advice on that new proposal, newly visible exact advice text, observed advice POST |
| gold-orient | COMPLETED | 59 | 27 | Journey route and Step 1 of 8 / Welcome to OmniOne, with unavailable-video notice and explicit fallback |
| gold-share | COMPLETED | 84 | 12 | Fresh workshop offer listed in Discover; Everyone on NEOS visibility, observed publish POST |
| gold-profile | COMPLETED | 28 | 11 | Gold Advisor changed to Rowan Uxqa-Gold, save confirmation; actual UI used PUT /api/v1/profiles/me |
| gold-respond | COMPLETED | 64 | 12 | Escherbridge public rainwater need; Message sent to Kenny and Open the conversation, observed respond POST |

Visible identity was checked before each authenticated task. Advisor tasks used actual Tab and Enter key events, ordinary tablist arrow navigation, typing and selection without pointer actions; all three harness logs record keyboardOnly=true and zero pointer clicks/workarounds. The newcomer perceived ARIA snapshots only; its saved screenshot was evidence only and never inspected. No actual human or screen-reader participation is claimed.

The request observer was installed through an in-memory Chromium launch wrapper before the harness created/navigated any page. It recorded only method, path, host and local status for application /api/v1 requests. All 163 observed application backend requests targeted localhost; nonlocal count was zero. Existing root guard/sentinel results were prerequisites supplied by the coordinator; this lane did not rerun them.

The successful signup followed both configured requirements and real server grading. Readiness accepted false values for unread agreements and an unknown steward. On return, the UI said no agreements were waiting and offered the dashboard link; no agreement consent was fabricated. No assistant call was used for quiz answers.

Observed friction and evidence limits:

- Orientation's three failed attempts and abandonment field are preserved despite the successful gold predicate. The driver incorrectly waited for an unobserved journey-title heading after the first Start Journey click had already succeeded; the two subsequent harness retries could not find the now-absent start button. This is automation contamination, not evidence that the user failed to start the journey. The resulting route and tree independently show the start succeeded. Do not remove the recorded friction or silently replace this run.
- The initial share publish exposed the inline alert “Choose the domain this belongs to.” The form had no required marker on Domain. The agent selected Regenerative Agriculture Circle and published on the second explicit submit. A saved screenshot preserves this validation feedback. The harness's validationErrors count remains zero because this was app-level feedback, not a native invalid event.
- An advisor navigation command could not Tab directly to the inactive Shares + needs tab. Recovery used standard arrow-key tablist behavior. This is an automation navigation assumption, not a demonstrated accessibility defect. The failed command is recorded in the steps/actions.
- Video playback did not succeed: the orientation tree reported “This video could not be loaded” and an explicit continue-without-video checkbox. No fallback completion or upstream-playback success was claimed; the gold task only required starting the journey.
- Console errors were network-access-denied resource failures. Signup's one HTTP error was the expected signed-out GET /api/v1/auth/me 401. These remain in raw metrics; their precise external resource cause was not diagnosed in this UI lane.

Axe found four rule categories, requiring coordinator triage rather than a blanket accessible claim:

| Rule | Impact reported by axe | Routes/evidence |
|---|---|---|
| button-name | critical | /me, graded quiz result, readiness result; one unnamed button per scan |
| aria-progressbar-name | serious | Orientation journey (one node), graded quiz result (two nodes) |
| aria-hidden-focus | serious | Proposal detail after mutations and /me after save; two nodes in affected scans |
| color-contrast | serious | Proposal list; one node |

Research hypotheses remain bounded: verify whether new users understand that nongraded readiness answers are not knowledge scores, whether required-Domain feedback is discovered before submit, and whether actual assistive-technology users can navigate quiz results and mutation announcements. Use the existing five-sessions-per-segment human validation plan. No human question is closed by these runs.

Automation handling notes: Node REPL import failed before a browser existed, so execution used a persisted Node stdin driver. An immediate signup ARIA snapshot accidentally emitted the ephemeral synthetic password generated for this disposable local account; subsequent perception redacted password fields and raw history was preserved privately. No existing credential, cookie or session secret was read or emitted. This is an automation handling issue, not an application defect. Raw traces/snapshots must not be published.

Evidence lives in gitignored `flows/gold-ui/driver.mjs`, task `.recorded.mjs` command arrays and `.actions.txt` histories, `flows/gold-ui/results.json`, and these run directories (each has ux.json and trace.zip):

- `runs/qa-visitor--gold-signup/` — new-account-dashboard.png
- `runs/qa-gold-member--gold-propose/` — proposal-open-for-advice.png
- `runs/qa-gold-advisor--gold-advise/` — fresh-advice-submitted.png
- `runs/qa-gold-newcomer--gold-orient/` — journey-started-evidence-not-perception.png
- `runs/qa-gold-member--gold-share/` — domain-required-feedback.png, public-share-listed.png
- `runs/qa-gold-advisor--gold-profile/` — profile-saved.png
- `runs/qa-gold-advisor--gold-respond/` — need-message-sent.png

This lane ran no tests, lint, typecheck or build suite and makes no claim about them.
