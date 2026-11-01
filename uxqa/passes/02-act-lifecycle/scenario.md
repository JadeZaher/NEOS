---
type: UX Pass Scenario
pass: "02-act-lifecycle"
scenario: "act-lifecycle"
timestamp: "2026-10-31"
---

# Scenario: A proposal through advice, consent, test and ratification

## Brief

OmniOne is deciding how its shared tool library will work. A member drafts the
proposal and opens it for advice; newcomers and long-standing members advise;
the proposer decides when they have heard enough and closes advice; members
record consent positions (consent, stand aside, object with reasons) and one
objector later withdraws their objection after a revision; the proposal moves
into a test period with reports; a steward who did not write it confirms the
ratification; a steward registers it as an agreement. Along the way people
watch their bell and the status banner to know what is waiting for them, and
some members do the same steps through the in-app assistant.

## Focus

- Feature areas this pass must reach: `/proposals/new`, `/proposals/:id` (advice, close advice, consent positions, change/withdraw my position, send back for revision, test reports, confirm ratification, register as agreement, the status banner), `/agreements` + `/agreements/:id` (consent, ceremonies, "Propose a change"), `/decisions`, members' role card (grants below your own rank), the notification bell and dashboard queue, the in-app assistant for the same moves.
- What changed since pass 01 (deployed 2026-10-31; verify with real personas, not assumptions):
  - Owner decisions: the proposer closes advice (the bell prompts them once advice is in or the deadline passes; nothing moves by itself); a steward who did not write the proposal confirms Test -> Ratified ("Another steward needs to confirm this" for author-stewards); role grants only below your own rank.
  - One consent position per member, changeable; only its author can withdraw an objection; proposal text is locked once members decide; "Register as agreement" uses the ratified text.
  - The bell, the dashboard queue and a status banner on each proposal/agreement page say what is waiting for you, what happens next and who decides.
  - The assistant: acts only as you, asks for a yes in a later message before irreversible acts, answers with names and links.
- Questions to confirm or kill with evidence:
  - Do proposers notice they must close advice, and do they understand when it is the right time? Does anyone wait for an automatic move that never comes?
  - Do advisors and consenters understand stand aside vs object, and can an objector find how to withdraw after a revision?
  - Does the ratification hand-off to another steward feel clear or like a dead end in small ecosystems?
  - Does the bell match what people expect to see, and does it clear when they act?
  - Through the assistant: does the confirmation step feel safe or annoying; are names, links and next steps right?
  - Carried from pass 01: the consent gate for pending newcomers (stays on the gate but can read agreements); join-first orientation for members of another ecosystem.

## Cast notes (from pass 01 refinement)

- Keep Kofi (screen reader + keyboard) and Ines (keyboard only); Ines owns the proposal.
- Add a facilitator steward and a second steward (so ratification can be confirmed by someone who did not write it).
- Re-power Joy (low literacy): selectors checked against the accessibility tree before counting outcomes.
- Probe persona: authority tables for the owner decisions through REST and the assistant (author cannot ratify; self-assigned builder profile cannot grant owner; legacy /dashboard writes return 410).
- Exploration runs never reuse gold task ids; exploration drafts are marker-tagged and cleaned up.

## Agent evals

The AgentEval phase runs `uxqa/agent-evals` after the swarm. If the study API has no working model key (`uxqa/.secrets/stack.env`), it stops at the first turn with `aborted=OWNER_BLOCKED` and spends nothing; the pass continues without it.

## Out of scope this pass

- Emergency, exit, conflicts and safeguards flows (pass 04), beyond the bell items they produce.
- Admin, quizzes, journey-map authoring (pass 05).
