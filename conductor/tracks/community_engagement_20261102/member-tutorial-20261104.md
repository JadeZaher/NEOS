---
type: Change Record
title: First ecosystem member tutorial
status: deployed-and-verified
---

## Member experience

After a member has an active ecosystem membership, Home offers a short popup walkthrough of the platform. Required joining quizzes and agreement consent remain separate. The walkthrough explains community scope, next steps, shared decisions, collaboration, resources, updates and the assistant, with deliberate links to the relevant screens. It does not navigate automatically or carry out actions on the member's behalf.

Back, Next, pause, resume, restart and completion make the tutorial optional and recoverable. A persistent Platform tour control in the authenticated header makes it discoverable after dismissal. Automatic opening is restricted to Home (`/` or `/dashboard`) so returning to a deep link or editing screen is not interrupted.

## Implementation decisions

Use the existing Radix Dialog and semantic UI tokens. A stable modal works on small screens and with keyboard navigation without a dependency on the position of collapsed sidebar items. The tutorial names where to find each feature. Existing route guidance remains the detailed reference for individual pages.

Versioned progress is stored per actual User.id in this browser. Completion or dismissal suppresses further automatic opening here; another browser can offer the tutorial again. This is an implementation choice for this release, not a claim of account-wide synchronization. No sensitive content, quiz completion, roles or membership rights are stored in tutorial progress. Storage failure must leave the platform usable and suppress repeated prompts during the running session.

Use the same active membership calculation as the joining gate. A pending, suspended, exited or memberless account does not qualify solely because it has a role or a membership record. Existing active members receive the introduction once in this browser as well, since no historical tutorial completion exists.

## Acceptance and evidence

- Independent adversarial review of eligibility, route permissions, state isolation, focus and mobile behavior before release.
- Unit contracts for versioned progress, owner isolation, eligibility and safe automatic opening.
- Actual local browser checks for a first-ecosystem entrant before and after configured requirements, and an active member's navigation, pause/resume/restart/completion/replay.
- Keyboard and mobile checks, including Escape, focus return and horizontal overflow.
- One integrated frontend test, TypeScript, build and contrast sweep after all changes are applied.

The integrated sweep passed: 176 frontend tests, TypeScript, production build and 34 semantic contrast pairs (minimum 5.51:1). The build retains the existing large-chunk warning. Independent source review corrected transient OAuth dashboard opening, same-path query navigation focus, and mobile scope visibility before this sweep.

The actual guarded browser regression `uxqa/regression/p9-member-tutorial.mjs` completed all ten checks. A new ordinary local account passed the real configured quiz and agreement consent before receiving the tutorial. Desktop and 320px mobile checks covered all eight steps, Back/Next, Escape, focus trapping/return, pause/resume/restart/completion/replay, deliberate links and same-browser account isolation. The selected ecosystem name remains visible in a two-row mobile header. Tutorial interactions made zero API mutations and preserved membership and authority. No external messages were sent.

The first browser attempt stopped at its initial guard because the synthetic Ines login had expired (401). Only that local test login was refreshed; no membership or onboarding evidence was reset. The browser-only retry passed. Evidence is in `uxqa/passes/09-member-tutorial/tutorial-regression.json` and the associated screenshots; command logs are retained privately under `.omc/research/tutorial-*20261104.log`.

Independent review approved release after inspecting the final source, test logs, browser report and desktop/mobile screenshots. Frontend commit `128308e781f8162c4e95d49c1fedc461f38fedc8` deployed successfully in Railway deployment `de162ab1-3430-4f5f-95a7-9b10819db0e0`. The live site at https://neos.primusneo.com serves `/assets/index-UYLMjzc8.js`, verified to contain the tutorial introduction, persistence copy and completion controls.

Read-only production browser checks passed at 1366px and 390px: anonymous community discovery remains usable, the dashboard preserves its sign-in return target, and no member tutorial appears for guests. Zero mutating production requests were made. Authenticated first-membership and tutorial behavior was exercised locally, not against production members. External notification delivery remains behind its existing credential/activation gate.
