---
type: UX Pass Scenario
pass: "03-cross-ecosystem-exchange"
scenario: "cross-ecosystem-exchange"
timestamp: "2026-11-01"
---

# Scenario: Joining, then sharing, needing and collaborating across ecosystems, kept healthy by stewards

## Brief

A newcomer signs up and is placed in OmniOne; another joins Plan Systems, where membership asks them to
consent to an agreement first, and finds their way through the consent gate and orientation; a member of
Escherbridge leaves and later returns. Once in, members post what they can share and what they need,
choose who can see it, and find each other's posts across ecosystems. Someone in another ecosystem answers
a need with a message, and the poster sees it waiting; the poster marks the need met, naming who helped,
or keeps it open. A share turns into a collaboration between two ecosystems: a steward on each side
approves it, it gets a review date, and later one side ends it with a reason. Stewards keep their
ecosystem healthy: they moderate a post that does not belong (hide with a reason, restore it), see
newcomers who are stuck, see agreements whose review is due and finish the review (keep in force with
findings, or sunset), and an independent member records and publishes a governance health audit from
the computed snapshot that every member can then read. Some members do the same moves through the
in-app assistant.

## Focus

- Feature areas this pass must reach: sign-up and placement (`/login`), the consent gate (`/welcome/consent`), orientation (`/orientation/*`), ecosystem join/leave/return (`/ecosystems`, `/ecosystems/:id`), members and the stewards' Newcomers page (`/members`, `/members/:id`, `/onboarding`), Discover (`/discover`: shares, needs, Respond, post detail `?post=`, collaborations list/detail/form), the domain page's posts, Me/Profile (own posts: edit, keep open, mark fulfilled, reopen, delete an unanswered post), messaging (the response conversation and its unread badge), the bell and dashboard queue, agreements (`/agreements`, review due, the review dialog, "Review overdue"), safeguards (`/safeguards`: snapshot, audit form, publish, results for members), the assistant for the same moves.
- What changed since pass 02 (wave C, 2026-11-01; verify with real personas, not assumptions):
  - Owner decisions: no steward approval of newcomers (consent to the membership agreement activates; stewards only see who is stuck); platform admin only from OmniOne's admins (founding an ecosystem makes you its admin there, nothing more); a steward per side approves a collaboration; moderators hide with a reason (restorable), only the author deletes, and only an unanswered post; the health auditor is not a steward of the audited ecosystem ("self-assessment" otherwise).
  - Onboarding: one placement path for sign-up, join and return; private ecosystems are not joinable; a gated newcomer can read orientation; one error per failure; stewards' member moves come from a fixed list with a confirm.
  - Exchange: one visibility rule (public / ecosystem / domain), Respond opens a conversation with the poster, the poster's queue shows it, posts still open at 90 days ask "Still open?", a duplicate open post is refused, exited members' posts are withdrawn.
  - Maintenance and health: one date rule (a due date passes when its day has ended everywhere), review-due items 14 days ahead for admins/owners, a review must end with findings and writes a record, rollback only before consent, a computed health snapshot, published audits visible to all members.
- Questions to confirm or kill with evidence:
  - Do people understand who can see a post before they publish (public / my ecosystem / my domain)? Does anyone pick the wrong one?
  - Do responders across ecosystems find Respond, and does the poster notice the reply (bell, unread badge, queue item)? Does "mark fulfilled, naming who helped" make sense?
  - Is a collaboration's approval state clear to both sides ("waiting for <ecosystem>'s steward")? Can the proposer tell why it is not active yet?
  - Does a newcomer in a gated ecosystem understand what they are consenting to, and that consenting is what lets them in? Does a stuck newcomer find "Check my membership"?
  - Do stewards see what needs maintenance without hunting, and is the review dialog's "keep in force / sunset" choice understandable? Does "Review overdue" alarm members ("is this agreement still valid?")?
  - Is the health snapshot readable by a non-expert member; is the difference between computed values and the auditor's ratings clear?
  - Carried from pass 02: the consent gate for pending newcomers (now exercised in a gated ecosystem); join-first orientation for members of another ecosystem; sign-up validation errors (taken username, short password).

## Cast notes (from pass 02 refinement)

- Keep Ines (keyboard only) and Kofi (screen reader + keyboard): Ines posts and manages a need; Kofi answers one across ecosystems. Rig fixes: Radix tablists use roving tabindex; Select listboxes need a short wait between ArrowDown and Enter.
- Keep Amara and Oren as stewards (moderation, collaboration approval, agreement review); add a steward of a second ecosystem so cross-ecosystem approval has two real sides.
- Re-power Joy (low literacy): the post form's visibility choice and the Respond dialog's copy as explicit steps; selectors checked against the accessibility tree.
- Re-power Rafi (patience 1): real double-press on Publish, Respond and Approve (duplicate and race handling are new).
- Add: a newcomer in a gated ecosystem (prebake gives Plan Systems a membership agreement requirement through the real API if none exists; a refusal is a defect); a sign-up persona who hits validation errors; a member who leaves Escherbridge and returns; an independent auditor (active non-steward member) for the health audit.
- Probe persona: authority tables through REST and the assistant for the owner decisions (founder of a fresh ecosystem cannot moderate or administer elsewhere; a steward of another ecosystem cannot hide or approve; responder cannot close someone else's need; steward of the audited ecosystem cannot record its audit). The probe uses throwaway, marker-tagged posts and collaborations only, never shared fixtures.
- Gold tasks: the six previous plus `gold-respond` (answer Escherbridge's "Rainwater harvesting help (uxqa gold)" need). Exploration runs never reuse gold task ids; exploration posts and collaborations are marker-tagged and withdrawn or ended afterwards.

## Agent evals

The AgentEval phase runs `uxqa/agent-evals` after the swarm. If the study API has no working model key (`uxqa/.secrets/stack.env`), it stops at the first turn with `aborted=OWNER_BLOCKED` and spends nothing; the pass continues without it.

## Out of scope this pass

- The ACT lifecycle beyond an agreement's review (pass 02), emergency, exit flows other than leave-and-return, conflicts (pass 04), quizzes and journey-map authoring (pass 05).
