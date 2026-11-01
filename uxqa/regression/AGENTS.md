---
type: Module Notes
title: NEOS UX study regression flows
description: Browser-only fixes from the UX passes, each guarded by a Playwright flow that fails when its fix is reverted.
---

# uxqa/regression - one flow per browser-only fix

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

## Flows

| Flow | Guards |
|---|---|
| `p2-gold-advise-profile-orient-4` | An unplayable required video (its request answered 404) offers "I'll continue without the video" and Continue unlocks after it; nothing is saved. |
| `p2-stewards-confirm-and-register-13` | Opening a conversation refreshes the list after the read and its unread badge clears inside the 30 s poll. |
| `p2-gold-propose-share-signup-1` | A member edits a share's title and withdraws it (after a confirmation) on Me; it stays there marked Withdrawn, with Reopen (wave C). The fixture is deleted afterwards. |
| `c-respond-unread` | A member of another ecosystem answers the gold need from its detail and "Open the conversation" lands in the thread; a poster whose selection is another ecosystem sees the answer as 1 unread, and the bell's link opens it and clears. The gold need's author (MBR-EB-002) has no session, so `qa-new-priya` is the poster. |
| `p2-gold-propose-share-signup-2` | A townhall member sees "Manage Quizzes" but not "Manage Shares & Needs"; a builder sees it and the admin panel opens. |
| `p2-lending-rules-keyboard-1` | Enter on Submit Advice / Record my position / Submit report leaves focus on "You advised in this round" / "Your position" / "You filed a test report". |
| `p2-stewards-confirm-and-register-16` | Every "Close advice and move to consent" control opens a confirmation that names who acts and what was received; "Keep advice open" changes nothing. |
| `p2-stewards-confirm-and-register-15` | Navigating while the communications drawer is open closes it. |
| `p2-stewards-confirm-and-register-11` | In Los Angeles time, a decision dated `YYYY-MM-DD` shows that day on `/decisions` and the decision page. |

Each was checked red by reverting its fix in the working tree (Vite serves the
change) and green again once restored.
`c-respond-unread` and the wave-C rewrite of `p2-gold-propose-share-signup-1` were written in the
wave-C fix wave and not run yet: the study API serves the old code until the coordinator restarts it.
