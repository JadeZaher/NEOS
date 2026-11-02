---
type: UX Lane Report
title: Pass 06 constrained joining and subgroup UI evidence
status: completed-with-defects
---

All six instrumented sessions finished and contain `ux.json` and `trace.zip`. These are automated UI observations, not human research. App source, SQL, direct application API calls, hidden app state, interception, AI, environment changes and test/build commands were not used. Observed `/api/v1` request hosts before writes were localhost. The coordinator had already proved both environment guards.

## Outcomes

| Session directory under runs/ | Outcome | Evidence |
| --- | --- | --- |
| qa-new-kofi--gated-ecosystem-circles-team | COMPLETED | Normal Discover search for exact marked Shared tools dossier. Keyboard and accessibility tree only. Intentionally wrong quiz answer produced Failed 0/1; retry with taught answer produced Passed 1/1. Continue returned to dossier; separate required agreement was read and explicitly consented. Selected ecosystem, opened Domains and child circle, encountered legitimate inherited parent and target requirements, passed both through UI, joined child with Kofi participant row. Team still required its distinct quiz; passed then explicitly joined; final status You belong to this team. |
| qa-new-kofi--gated-membership-reentry | COMPLETED | Fresh session, keyboard normal navigation, scoped Members shows Kofi Active member / Complete in Shared tools. |
| qa-member-dara--open-ecosystem-mobile-zoom | COMPLETED | Normal mobile sidebar and Discover search. Exact Open learning dossier says No entry quiz is configured. You can join without taking one. Joined and selected scope; dashboard shows own ecosystem and Members 1. |
| qa-member-dara--open-membership-reentry | COMPLETED | Fresh session, same mobile constraint, own scoped Members row says Dara Active member / Complete. |
| qa-new-priya--completion-readiness-mobile | COMPLETED | 390 CSS pixels. Exact current Readiness checklist through Discover. Three native No answers remain valid, missing question 4 text and question 5 choice are named in alert. Entered actual expectation and 1-2 hours preference. Assessment Summary 5/5 retains false/false/false, returns exact original dossier, own scoped Active member / Complete verified. |
| qa-new-priya--agreement-before-quiz | COMPLETED with bounded UI recovery | Required agreement link fails before membership. Browser Back, Start entry quiz, Return without answering creates pending join context. Read actual agreement and consent before quiz submission; then pass quiz, Continue, participate, own Active member / Complete in Shared tools. Both completion orders reach active status. |

Kofi used Tab, Space, Enter and radio arrow keys. No pointer activation or API workaround is recorded. The intentionally failed quiz and early child/team join attempts are negative checks, not mistaken user behavior. Expected 409 gate refusals are counted as HTTP errors by the generic harness and should not be triaged as defects.

Dara used the harness's width=390 / zoom=2 model, which gives a 195 x 450 CSS viewport and deviceScaleFactor=2. This is viewport emulation, not native browser UI zoom. Locale fr-FR. The geometry and exact method are saved in flows/constrained-ui/dara-evidence.json.

## Defects for source triage

1. **Required prejoin agreement link fails (HIGH candidate).** Before joining, Shared tools visibly links its required v1.1 agreement. Opening it as Priya displays Failed to load agreement / Agreement not found; observed agreement and explanation GETs are 404. Starting the entry quiz creates pending membership; returning unanswered makes the same link readable. Users should be able to read the joining agreement through its visible requirement link before answering a quiz. Evidence: runs/qa-new-priya--agreement-before-quiz/ux.json and trace.zip; flows/constrained-ui/agreement-first-evidence.json. No source root cause inferred.
2. **Results back button has no accessible name.** Knowledge Quiz Results and nongraded Assessment Summary expose an empty button. Settled axe: button-name, critical, one node; target button[data-testid="button-back"]. Evidence: flows/constrained-ui/agreement-first-evidence.json and priya-evidence.json, corresponding traces. Kofi could use the separate named Continue / Return control, so completion is not evidence that the empty button is usable.
3. **Knowledge results progress bars lack names and values.** Settled axe: aria-progressbar-name, serious, two nodes. DOM roles have min/max but no aria-label/labelledby or aria-valuenow and data-state indeterminate, despite static 100% score and answered count. Evidence: flows/constrained-ui/agreement-first-evidence.json knowledgeAxe; Kofi failed-result scan in ux.json.
4. **Domain quiz results link has no name.** Child-domain quiz table exposes a second icon-only link beside Take, pointing to quiz/results. Axe link-name serious one node; tree shows link with no text. Observed DOM-link selector: a[href="/quiz/results/8071d6ea-f078-4bcc-a226-cf183f1ba24d"]. Evidence: Kofi main trace and ux.json domain scan. Source confirmation still required.
5. **Mobile/zoom reflow overflow.** At recorded 195 CSS viewport, mobile Sidebar dialog width=288, document scrollWidth=320; controls extend beyond viewport. It remained possible to navigate, join and select scope, but the constraint does not fit horizontally. Evidence: flows/constrained-ui/dara-evidence.json geometry and trace. Do not generalize this to an untested native browser zoom implementation.
6. **Nongraded summary copy contradicts mode.** Readiness intro correctly says no right-or-wrong preference answers; Assessment Summary nevertheless says Your result is graded and saved by the server. Native No is rendered as raw false three times. Behavior accepts these values and completes; this is confusing copy/formatting, not a grading or integrity failure. Evidence: flows/constrained-ui/priya-evidence.json result.

The aria-hidden-focus axe finding also reappeared after a 1.5-second wait on knowledge results: two tiny clipped aria-hidden=true tabindex=0 spans. Exact DOM is in agreement-first-evidence.json. These resemble framework focus guards and were absent in the final settled team scan. Treat as an accessibility triage question until actual tab behavior or source establishes harmful focus loss; do not blindly remove focus-trap guards.

## Harness and evidence limits

Initial Node REPL import failed because process was unavailable before any persona session was created. A persistent Node console then drove the real harness. Original commands, including failed attempts, are in flows/constrained-ui/live-recording.mjs; console.mjs is the input driver. Driver mistakes were an empty keyboard key on the searchbox, trying to Tab directly to the second roving radio (corrected with arrow navigation), and waiting for Quiz Results on a correctly named Assessment Summary (no repeat submission). A 30-second wait for Record My Consent on the initial agreement404 preserved the real failure. These are recorded in evidence JSON/steps and must not be reported as user errors or product timing failures.

The generic attempt counter remains zero because these were incrementally driven bounded UI sequences rather than automatic s.attempt retries. No subgoal was silently retried in a loop; the prejoin agreement failure had one explicit recovery. No screenshots were used as Kofi's perception; harness traces contain screenshots as artifacts. Network access denied console entries did not prevent these flows; they are environment/media noise unless independently reproduced.

## Research hypotheses

- Five actual keyboard/assistive-technology users should test locating and interpreting failed results, named return controls, inherited-versus-target requirements and recovery. Automated tree inspection cannot establish screen-reader announcements or human comprehension.
- Five newcomer sessions should compare agreement-first discovery with quiz-first entry and explain when membership is pending versus active. A recovered agent journey does not establish discoverability of starting a quiz merely to unlock agreement reading.
- Five mobile/zoom users should test scope selection and navigation using actual browser zoom, with viewport/zoom mechanism recorded. The current emulation identifies overflow but cannot establish native-browser equivalence.
- Five newcomers should explain whether false means No and whether a nongraded readiness summary is being judged. Keep the existing human-validation-plan.md and its deferred recruitment requirements.

No app fixes were made. The coordinator owns source confirmation, batched fixes, independent review and the final integrated test sweep.
