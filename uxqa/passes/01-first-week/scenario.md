---
type: UX Pass Scenario
pass: "01-first-week"
scenario: "first-week"
timestamp: "2026-10-31"
---

# Scenario: A newcomer's first week in OmniOne

## Brief

A small wave of newcomers arrives at OmniOne in the same week. Some find NEOS
cold and sign themselves up, others were added by a steward and just signed in.
Over the week each one has to orient into the ecosystem's ethos, find their way
around the dashboard, join a domain they care about, give their first piece of
advice on a live proposal, and introduce themselves through their profile and a
share. A domain steward and a long-standing member watch for newcomers, answer
them in messaging, and move a proposal of their own forward.

## Focus

- Feature areas this pass must reach: `/login` (sign in, self sign-up, DID), `/dashboard`, `/discover` (ecosystems, shares + needs), `/ethos/:slug`, `/orientation/*`, `/proposals` + `/proposals/:id` (advice), `/domains` + `/domains/:id` (join), `/me` (profile, agent access), `/messaging`, the ecosystem picker, the route guide rail, the notification bell.
- Questions carried from setup (code-read hypotheses, confirm or kill with evidence):
  - `/login?redirect=` appears to be ignored: sign-in always lands on `/dashboard` (Login.tsx). Does a newcomer following a deep link lose their place?
  - Submitting empty advice appears to be a silent no-op (ProposalDetail.tsx advice form).
  - "Join this domain" is shown to members who already participate, and "Joined" is local state that resets on reload (DomainDetail.tsx).
  - After publishing a share the app returns to `/discover` on the Ecosystems tab, so the new share is not visible (SharesNeedsForm.tsx -> DiscoverHub.tsx).
  - The shares form's Domain select may label options by raw `domain_id` instead of a name.
  - Changing a proposal's status gives no confirmation or toast.
  - Setup smoke: the dashboard hero image 503s (`/api/v1/media/ecosystems/omnione.webp`, likely missing local media: check before filing), "All 1 ecosystems", and the sidebar brand still reads "CHARTING THE COURSE".

## Out of scope this pass

- Emergency declaration, exit, conflicts/harm circles, safeguards audits, compliance (pass 04).
- Admin panel, quiz management, journey-map authoring, user management (pass 05).
- Full ACT consent/test/ratify chain and agreement ceremonies (pass 02).
