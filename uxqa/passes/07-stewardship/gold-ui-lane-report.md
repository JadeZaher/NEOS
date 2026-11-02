---
type: UX Lane Report
title: Pass 07 seven gold UI journeys
pass: 07-stewardship
status: completed-with-findings
---

All seven unchanged `runGold` predicates returned COMPLETED in one fresh run each. Every task stayed within its original time and attempt budgets, with zero failed attempts, recorded workarounds or abandonment. This is automated browser evidence, not human research or study convergence.

| Task | Harness outcome | Seconds | Friction | Observable evidence |
|---|---|---:|---:|---|
| gold-signup | COMPLETED | 45 | 17 | Fresh signup, real graded Community Onboarding 3/3 (100%), real nongraded Readiness 5/5 with No/Yes/No responses, active-member return page and dashboard |
| gold-propose | COMPLETED | 29 | 9 | Fresh Shared tool library proposal, actual Advice-stage banner and observed create/status POSTs |
| gold-advise | COMPLETED | 30 | 10 | Actual advice POST and freshly visible exact text containing `uxqa gold advice` and `pass07` on the newly created proposal |
| gold-orient | COMPLETED | 22 | 6 | Explorer path selected through ecosystem dossier; actual orientation progress POST and journey URL after Start Journey |
| gold-share | COMPLETED | 38 | 8 | Public workshop offer, required Domain visibly marked and selected before the first publish, observed create POST and newly listed title |
| gold-profile | COMPLETED | 24 | 7 | Gold Advisor changed to Rowan Uxqa-Gold, visible save confirmation and actual profile PUT |
| gold-respond | COMPLETED | 26 | 6 | Actual response POST to Escherbridge's public rainwater need, Message sent to Kenny and a concrete Open the conversation link |

Identity was checked in the visible UI before each authenticated task. The three Advisor tasks used actual Tab, Enter, ordinary tablist ArrowRight navigation and keyboard text entry. Their raw records have `keyboardOnly: true`, zero pointer clicks and zero workarounds. The newcomer perceived ARIA snapshots only and did not inspect its evidence screenshot. This latter constraint is recorded in the journey's steps; the harness's constraint-array vocabulary does not include an ARIA-only field. No screenshot or DOM-text perception was used for that journey.

The required share Domain is now visible before submit, and the lane selected it without causing the previous validation error. Native Radix tablist arrow navigation reached Shares + needs without the failed Tab-only assumption from pass 06. The orientation driver waited for the actual journey URL after Start Journey, preserving the existing predicate rather than guessing a heading after the task had already succeeded. The snapshot at that navigation was still loading, so this task establishes starting the journey only; it does not establish video playback or step completion.

Signup performed both entry submissions through visible choices and normal server grading. Readiness accepted No for unread agreements and an unknown steward. Its result displayed Assessment Summary, completion copy and Yes/No responses without marking those preferences as a pass. The return page said You're an active member and No ecosystem agreements are waiting for your consent. No agreement consent, passing result or participation state was fabricated by this lane.

The Chromium-context observer saw 153 application `/api/v1` requests, all on localhost, with zero nonlocal application requests. It recorded only method/path/host/local metadata, never request bodies, cookies or credentials. The initial Node process exited at EOF before browser launch; it produced no task run. The persistent terminal driver then ran the seven tasks. The generated synthetic signup password stayed in memory and was redacted before every ARIA perception; its value was never printed or written to command history.

The only axe rule reported in this lane was serious `aria-hidden-focus`, with two nodes per affected mutation scan: proposal creation, advice submission, profile save and the graded quiz result. The raw findings remain unchanged. This is the same rule/count pattern as the coordinator's previously investigated toast guards, but this lane did not independently inspect those nodes or run a toast keyboard probe. It therefore makes no zero-violation or screen-reader-usability claim. The previous `button-name`, `aria-progressbar-name` and `color-contrast` categories did not recur in these scans; this is bounded to the pages and states actually scanned.

All journeys retained console resource errors reporting `ERR_NETWORK_ACCESS_DENIED`; their precise external resource causes were not diagnosed here. Signup's single HTTP error was the expected signed-out `/api/v1/auth/me` 401 on `/login`. The successful task outcomes do not erase these raw error and friction metrics. Advisor advice has one measured rage-click burst from rapid keyboard activation; no repeated unsuccessful action or pointer burst occurred, and the raw metric is preserved.

Evidence is under ignored `flows/gold-ui/driver.mjs`, task `.actions.txt` histories, `flows/gold-ui/results.json`, and these fresh run directories, each containing `ux.json` and `trace.zip`:

- `runs/qa-visitor--gold-signup/` — new-account-dashboard.png
- `runs/qa-gold-member--gold-propose/` — proposal-open-for-advice.png
- `runs/qa-gold-advisor--gold-advise/` — fresh-advice-submitted.png
- `runs/qa-gold-newcomer--gold-orient/` — journey-started-evidence-not-perception.png
- `runs/qa-gold-member--gold-share/` — public-share-listed.png
- `runs/qa-gold-advisor--gold-profile/` — profile-saved.png
- `runs/qa-gold-advisor--gold-respond/` — need-message-sent.png

This lane used no application source, direct application API, SQL, model calls, mocks, reseeding, environment changes, restarts, deployment, test, typecheck or build commands. It did not modify pass 06 evidence. The coordinator owns integrated verification, the remaining pass 07 journeys and the final verdict.
