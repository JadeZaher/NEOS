---
type: UX Pass Scenario
pass: "02-act-lifecycle"
scenario: "act-lifecycle"
timestamp: "2026-10-31"
---

# Scenario: A proposal through advice, consent, test and ratification

## Brief

OmniOne is deciding how its shared tool library will work. A member drafts the
proposal and opens it for advice; a facilitator steward opens and closes the
rounds; newcomers and long-standing members give advice, then record consent
positions (consent, stand aside, object with reasons); the proposal moves into
a test period with reports, and is finally ratified into an agreement with a
decision record. Along the way a governing agreement's gates decide which
steps can be skipped, and people who are not stewards try moves they should not
be allowed to make, in the UI and through the in-app assistant.

## Focus

- Feature areas this pass must reach: `/proposals/new`, `/proposals/:id` (advice, consent positions, objections, test reports, status moves, gate panels, governing-agreement picker), `/agreements` + `/agreements/:id` (ratification, consent, review/sunset), `/decisions` + decision records, `/governance`, onboarding ceremonies where an agreement requires explicit consent, the notification bell, the in-app assistant (`/chat`) for the same moves.
- Re-test what pass 01 fixed (same personas where possible): proposal authorship and withdraw/edit rights, blank and self-advice rejection, domain names everywhere, join persistence, arrival ecosystem, messaging new-conversation, status toasts.
- Questions carried from pass 01 (confirm or kill with evidence):
  - OWNER `p1-expert-first-week-audit-5`: one piece of advice ends the advice phase before its deadline (auto-advance on first advice). Do advisors, proposers and facilitators understand what happened and when? Evidence for the owner's policy decision, not a fix.
  - `p1-coord-chat-tool-authz`: can a non-steward record a decision, change an agreement's status, record a consent position for someone else, create an ecosystem or declare an emergency through the assistant? (Probe lane only; the craft phase fixes this before the pass, so the expected result is denial with a clear reason.)
  - `p1-coord-consent-gate-guard`: a pending-consent member following a link lands on the consent gate and can still read the agreements they are asked to accept.
  - Consent and test outcomes: does the UI explain each automatic move (consent -> test, test -> ratified), not only advice -> consent?
  - `PB-BELL-STUB`: the bell is a placeholder. Record where people look for "my proposal moved" and what they expected.

## Cast notes (from pass 01 refinement)

- Keep Kofi (screen reader + keyboard) and Ines (keyboard only); Ines owns the proposal.
- Add a facilitator steward who opens and closes advice/consent rounds.
- Re-power Joy (low literacy): selectors checked against the accessibility tree before counting outcomes.
- Probe persona: seed an OmniOne domain with agreement gates (409 `required_agreements` path), a second disposable proposal, and an Escherbridge domain id for the 403 case.
- Exploration runs never reuse gold task ids; exploration drafts are marker-tagged and cleaned up.

## Out of scope this pass

- Emergency, exit, conflicts and safeguards flows beyond the assistant authorization probe (pass 04).
- Admin, quizzes, journey-map authoring (pass 05).
