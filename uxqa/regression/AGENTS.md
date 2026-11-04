---
type: Module Notes
title: NEOS UX study regression flows
description: Browser-only fixes from the UX passes, each guarded by a Playwright flow that fails when its fix is reverted.
---

# uxqa/regression - one flow per browser-only fix

## Member platform tutorial

`p9-member-tutorial.mjs` uses the pass-06 configured ecosystem/quiz/agreement fixture and a unique ordinary local signup. It refuses nonlocal origins, a database without the `neos_uxqa` sentinel, or enabled external delivery. Real visible quiz and consent forms establish first active membership; tutorial assertions never manufacture completion. It checks pending/deep-link noninterruption, dashboard auto-offer, keyboard focus and Escape, Back/Next, reload/resume/restart/finish, deliberate destination navigation, 320px layout, and owner isolation in one browser. Synthetic identity cookies are switched only in memory for that isolation probe, then restored. The tutorial portion must issue no API writes and leave membership/authority unchanged. Screenshots, trace, and `tutorial-regression.json` land in pass `09-member-tutorial` (or `UXQA_PASS`). The unique signup and genuine requirement records remain for study reset. Execute only in the coordinator's final integrated sweep.

A fix whose effect only shows in a browser (focus after a submit, a list refresh
clearing a badge, a confirmation before an irreversible act, which sidebar links
a member sees, a fallback for a video that cannot play) gets
`<defect-id>.mjs` here. Logic that can be pulled out pure goes to a
`client/src/lib/*.ts` helper with a node:test file instead (see
`charting-the-course/client/src/AGENTS.md` "Client tests"); the flow then guards
only what the helper cannot.

## Running

The sweep runs every top-level flow on the local study stack (API :8000, web
:5173, DB `neos_uxqa`): `for f in uxqa/regression/*.mjs; do node "$f" || echo "RED $f"; done`
from the repo root. Each prints `GREEN <defect-id>` or `RED <defect-id>: <what the
member would see>` and exits 0 or 1. A backend half (e.g. `-13`'s read watermark)
is only live once the coordinator restarts the API, so a flow can be red on a
stale API with its client half fixed; its message says which half failed.

## Shape of a flow

- `support/fixtures.mjs` (outside the sweep glob) wraps the plugin's `uxSession`
  in `regression(defectId, { pass }, run)`: probe-mode sessions per persona with
  OmniOne selected, task `regression-<defect-id>`, pass from `UXQA_PASS`, else the
  pass that filed the defect. `flow.red(reason)` fails it; any other throw is a
  flow error (also red). Every session is finished, so a trace lands in
  `passes/<pass>/runs/` (gitignored).
- Fixtures go through the REST API a real client calls, carry the `uxqa` marker,
  and are undone in `finally` (proposals withdrawn, shares withdrawn), so a flow
  can run on every sweep. The UI step under test is driven as the member would.
- Observable outcomes only: the heading that holds focus, the badge text, the
  dialog and the proposal's status. Where a race could make a reverted fix pass
  by luck, the flow pins the order the fix guarantees (`-13`: the list refreshes
  after the read) rather than waiting longer.
- Personas: non-gold `qa-new-*` / `qa-member-*` where a write is involved, so a
  flow never satisfies a gold task's predicate. `qa-gold-member` only reads.
- Each pass re-seeds its personas from its own `personas.json`, and may re-power
  one (pass 03 made Ines a collaborator, so she stopped being a platform admin)
  or retire one (pass 03 retired `qa-new-sol`: "no session for qa-new-sol";
  `qa-new-kofi`, OmniOne townhall in every pass, took over its three flows).
  A flow that needs a standing says so: `flow.as(handle, { requires: [what,
  (me, omniRow) => boolean] })` checks `/auth/me` (`is_node_admin`, the
  OmniOne row's `is_steward`) before any step, and a mismatch is a
  `flow error: fixture drift: ...`, not a product RED. Prefer the persona that
  has held the standing in every pass: `qa-member-oren` now requires an explicit
  `seed.node_admin: true` assignment (co_creator does not grant node authority);
  OmniOne steward `qa-steward-amara` remains a mod with `seed.node_admin: false`.
  Memberless `qa-node-support` is a separate pass-05 capability probe and should use a
  direct `uxSession` on `/admin`; `flow.as` intentionally selects a member ecosystem.

## Flows

| Flow | Guards |
|---|---|
| `p2-gold-advise-profile-orient-4` | An unplayable required video (its request answered 404) offers "I'll continue without the video" and Continue unlocks after it; nothing is saved. |
| `p2-stewards-confirm-and-register-13` | Opening a conversation refreshes the list after the read and its unread badge clears inside the 30 s poll. |
| `p2-gold-propose-share-signup-1` | A member edits a share's title and withdraws it (after a confirmation) on Me; it stays there marked Withdrawn, with Reopen (wave C). The fixture is deleted afterwards. |
| `c-respond-unread` | A member of another ecosystem answers the gold need from its detail and "Open the conversation" lands in the thread; a poster whose selection is another ecosystem sees the answer as 1 unread, and the bell's link opens it and clears. The gold need's author (MBR-EB-002) has no session, so `qa-new-priya` is the poster. |
| `p2-gold-propose-share-signup-2` | An ordinary member sees neither quiz management nor node support links; explicitly assigned `qa-member-oren` has `is_node_admin: true`, sees Node Administration, and opens it. Profiles alone are not authority. |
| `p3-collaboration-and-moderation-10` | The sidebar's "Manage Quizzes", the Dashboard's "Manage learning" and the `/quiz/manage` route agree: an ordinary member gets none and an Access Denied that names the rule; an OmniOne steward gets all three and the page. |
| `p2-lending-rules-keyboard-1` | Enter on Submit Advice / Record my position / Submit report leaves focus on "You advised in this round" / "Your position" / "You filed a test report". |
| `p2-stewards-confirm-and-register-16` | Every "Close advice and move to consent" control opens a confirmation that names who acts and what was received; "Keep advice open" changes nothing. |
| `p2-stewards-confirm-and-register-15` | Navigating while the communications drawer is open closes it. |
| `p2-stewards-confirm-and-register-11` | In Los Angeles time, a decision dated `YYYY-MM-DD` shows that day on `/decisions` and the decision page. |

Each was checked red by reverting its fix in the working tree (Vite serves the
change) and green again once restored.
`c-respond-unread` and the wave-C rewrite of `p2-gold-propose-share-signup-1` were written in the
wave-C fix wave and not run yet: the study API serves the old code until the coordinator restarts it.


## Platform completion

`p6-admin-authoring-and-entry-quiz.mjs` requires the coordinator's PREPARED `prebake.json` for `UXQA_PASS`, defaulting to pass 06. The memberless NodeAdmin lane checks task navigation, friendly unsaved quiz editing and the audited membership-role task without recording a support command. The ordinary entrant lane takes a real configured quiz using its visible choices, returns to the original ecosystem, proves that agreement consent is still required, and checks that an unpublished required quiz has no bypass. It leaves the ordinary synthetic entrant pending on the fixture agreement; the study seed owns reset. Every lane checks the running isolated database sentinel and records its own trace.


The cycle-1 extension to `p6-admin-authoring-and-entry-quiz.mjs` authors a synthetic journey through the memberless NodeAdmin UI: selected organization, named quiz search, explicit selection, review, save and actual public receipt. It checks the real actor and absence of the private journey title in that receipt. This replaces the earlier unsaved-only scope for that portion and intentionally leaves the new synthetic journey for study reset. The entrant lane reloads the exact result URL before following its preserved return target. Authored during the fix batch; execution is reserved for the coordinator's integrated sweep.

The runtime-correction extension also checks readable selected-quiz review and Browser Back restoring support scope/search without an automatic inspection. `p6-runtime-ui-recovery.mjs` consumes Ines's two already persisted real guide replies: reload restores the current required-step transcript and Continue eligibility, explicit New stays separate, and the panel can open that step's saved history without any model POST. It intentionally does not advance the step so the coordinator can independently verify the actual completion proof. Its Dara lane requires no existing membership in the gated ecosystem, explicitly requests pending enrollment, reads the agreement before any quiz submission, and leaves consent undecided. It refuses fixture drift rather than resetting state. Both probe lanes check the isolated running database sentinel. These authored regressions have not been executed by the correction author.

The same runtime script includes a separate toast-focus triage lane. An empty display name triggers local validation without saving a profile; real F8 and Tab/Shift+Tab events check that focus does not remain on a hidden or one-pixel proxy. The lane retains raw axe findings instead of suppressing them and restores the unsaved name. Passing this bounded keyboard check would support classifying the proxy finding; it would not establish screen-reader usability or eliminate the original automated violation.

The guide recovery lane also Tabs from the history selector into the named transcript log and uses PageDown to verify native scrolling when content overflows. This consumes existing saved content and sends no model request or journey completion.

## Community engagement

`p8-community-engagement.mjs` uses a new `08-community-engagement` result pass, existing non-gold synthetic `qa-member-ines` and `qa-steward-amara` sessions, localhost-only origin, and the `neos_uxqa` sentinel. Actual default member/ecosystem IDs are read from `/auth/me`; the two personas must share that default ecosystem. It refuses an externally enabled notification service. Run after the migration and updated API/UI are live, with the synthetic receiver's default ecosystem free of an existing follow.

Real local API fixture setup creates a two-person synthetic conversation and messages; this is explicitly probe evidence, not user-flow success. Browser actions verify missing-provider states, pacing persistence without a browser device, a named broad follow, an actual inbox read independent of next steps, a source-specific mute, mobile reflow, anonymous community preview and exact selected-community login return. It restores original preferences and deletes only follows it created. Synthetic conversation/message records remain for study reset. It performs no AI/provider calls, sends no real-world messages, and never modifies historical pass results.

`p8-community-signup.mjs` runs from the workspace root against the existing pass-06 `06-safety-integrity/prebake.json` gated community, published entry quiz and synthetic membership agreement. It uses Ines only for read-only environment checks, then creates a unique `uxqa_p8_*` account through the anonymous directory, chosen preview and password signup form. It verifies target-only pending membership, completes the real quiz through visible controls, proves the quiz does not bypass agreement consent, and records explicit consent to the synthetic agreement before checking active membership. New accounts, quiz submissions and consent records remain for study reset; no gold fixture is changed.

`p8-home-queue.mjs` uses Ines's existing queue with more than five items and makes no record writes. It checks five initial items, the full total, keyboard expansion/collapse, retained focus, exact ordered action links and activity placement. Both promoted harnesses require localhost, the `neos_uxqa` sentinel and external delivery disabled; they make no AI/provider calls or real-world sends. Run with `node uxqa/regression/p8-community-signup.mjs` or `node uxqa/regression/p8-home-queue.mjs`; `UXQA_PLUGIN_ROOT` can override the plugin location. Reports, screenshots and traces go to `08-community-engagement`. Their source versions passed actual browser execution; promotion changes only plugin-root configurability and is not a new execution claim.

The integrated-sweep transport-fixture refresh preserves the original regression assertions. Share editing locates the visible Title (required) field; the sidebar probe selects the first persistent Node Administration link. The memberless support mock includes representative Users/Ecosystems resources and explicitly opens Advanced resource browser, selects Proposals, then proposes for an organization. This follows the actual audited catalog UI rather than assuming the task landing page immediately exposes a proposal button. Deep-link inspection, confirmation-before-command, actual actor identity, no ordinary member requests, support/member session separation, revocation safeguards and public-audit privacy checks remain in that flow.
