---
type: Governance Review
title: "Onboarding: sign-up to first steps, every actor"
timestamp: "2026-11-01"
scope: onboarding
evidence: [code read on main @ 9a65d10, neos_uxqa SELECTs, anonymous GETs on localhost:8000, pass 01/02 ledgers, neos-core member-lifecycle + re-entry-integration]
---

# Onboarding review (ironclad bar)

Path prefixes: `BE/` = `neos-operating-system/agent/src/neos_agent/`, `FE/` = `charting-the-course/client/src/`, `T/` = `neos-operating-system/agent/tests/`.

What the study database says today (SELECT only):

- `agreement_requirements` is empty, so no ecosystem has a membership gate. Every self sign-up and every join becomes `active` at once (`BE/api/auth.py:142-147`, `BE/api/ecosystems.py:373-378`). The consent gate runs only in tests.
- 34 of 45 member rows have no `member_onboarding` row. Only seeds create one (`scripts/seed_omnione.py`; no API path does).
- 32 of 45 member rows have no `member_status_transitions` row. Joining, sign-up and activation are never recorded.
- `qa_probe_tess` is `pending_consent` in Escherbridge with zero gate agreements and zero transitions. Nothing can move her out of that state (a dead end; see H4).
- There are 5 published entry quizzes (`is_entry_quiz`) and 0 `quiz_assignments`.
- 1 exited OmniOne member has 2 transitions (voluntary_exit, exit_complete) and cannot rejoin (H5).

## 1 Flow matrix

| Step | Model | API route | UI | Assistant tool | Status | Evidence |
|---|---|---|---|---|---|---|
| Anonymous visitor learns about an ecosystem before signing up | Ecosystem | `GET /orientation/ethos/:id` is `@authenticated` (401 anonymous, checked live) | `/about`, `/governance-model` public; `/ethos/:slug` is a ProtectedRoute | none | PARTIAL | `BE/api/orientation.py:38-40`, `FE/App.tsx:306-308` |
| Sign up (password, DID, OAuth) and placement | User, Member | `POST /auth/register`, `/auth/verify`, OAuth callback | Login register tab | none | PARTIAL | Placement is deterministic and gate-aware (`BE/api/auth.py:97-150`). The client never sends `ecosystem_id`, so an invite to ecosystem X lands in the default ecosystem (`FE/lib/api-client.ts:88-93`, `FE/contexts/AuthContext.tsx:150-157`). A private ecosystem id is accepted (`auth.py:101-104`). |
| Pending member: consent gate | Member.current_status, AgreementMemberConsent | `GET /auth/me` `pending_consents`; agreement detail/consent with the pending scope | `/welcome/consent` + route guard | MCP `attest_agreement_consent` only; no chat tool | PARTIAL | Reading and consenting work (`T/test_act_lifecycle.py:338`). An empty agreement list is a dead end (`FE/pages/ConsentGatePage.tsx:68-72`). Orientation is blocked while gated (`FE/lib/consent-gate.ts:21-27`). |
| Orientation journey (ethos, maps, progress) | JourneyMap, UserJourneyProgress, EthosUserAccess | `GET/POST /orientation/ethos/:id/progress`, journey-map CRUD | OrientationGate, OrientationJourney, OrientationComplete, ConsentGate | none | BROKEN (authority) | Progress is keyed on the right row (`orientation.py:320,373`; `T/test_be_journey_flows.py:132-200`). Journey-map writes have no authorization (`orientation.py:181-308`). |
| Steward greeting and approval | Member.current_status, MemberStatusTransition | `POST /members/:id/status` (free string) | none: `useTransitionMemberStatus` is unused (`FE/hooks/use-governance.ts:371-378`) | none | MISSING | `BE/api/members.py:631-676` |
| Onboarding ceremony (UAF sections) | MemberOnboarding | `GET/POST /onboarding/:member_id/ceremony`, `GET /onboarding` | `/onboarding`, `/onboarding/:id/ceremony` | none | BROKEN | No route creates the row, so the ceremony 404s for real newcomers (`onboarding.py:153-160`). A pending member cannot open their own ceremony: `get_scoped_or_404` is active-scope only (`onboarding.py:150,200`). Reaching 100% changes nothing (`onboarding.py:230-232`). |
| Pending -> active | Member | consent activation in `record_member_consent` | gate "check again" | MCP attest | PARTIAL | Activation works (`BE/api/agreements.py:728-734`) but writes no transition and tells no steward. |
| First steps (name, first advice, bell) | Member, next_steps | `PUT /profiles/me` (renames every row), `GET /me/next-steps` | Dashboard, MePage | `what_needs_me` | PARTIAL | The name sync works (api/AGENTS.md "Profile name"). There is no newcomer branch: the queue holds every advice and consent item (22 for a new account; `p2-gold-propose-share-signup-3` OPEN). Orientation is a static shortcut that ignores progress (`FE/pages/Dashboard.tsx:135-140`). |
| Join a second ecosystem | Member (per ecosystem) | `POST /ecosystems/:id/join` | EcosystemDetail/List "Request to begin orientation", join-first in OrientationGate/ConsentGate | none (no `join_ecosystem`) | PARTIAL | The new row and its progress are correct (`T/test_be_journey_flows.py:160-200`). Visibility is not checked (`ecosystems.py:347-349`). The copy misleads (M5). No transition is written. |
| Quizzes at onboarding | Quiz.is_entry_quiz, QuizAssignment, QuizResult | `POST /ecosystems/:id/quizzes/assign`, `/quiz-assignments` | AdminPanel tab only | none | MISSING | Nothing reads `is_entry_quiz` at join. Assignments are invisible to the member, and their status never changes. Results are keyed on the default row (`BE/api/quizzes.py:416-441`). |
| What stewards see for newcomers | Member | `GET /members?status=` | MemberList (no pending filter), OnboardingList (ceremony rows only) | none | MISSING | `FE/pages/governance/members/MemberList.tsx:15-20`; `BE/services/next_steps.py:809-870` has no member kind |
| Re-send invite | none | `POST /members/:id/resend-invite` | UserManagement icon | none | BROKEN (dishonest) | The route answers "Invite re-sent" with no delivery and no record (`members.py:708-728`). |
| Declined applicant | none | free-string status only | none | none | MISSING | No decline state and no decline route. The framework allows refusal only for a documented UAF incompatibility (member-lifecycle H, "Gate-keeping"). |
| Leave, then return | Member, ExitRecord.re_entry_eligible | join -> 409 | join toast "Already a member" | none | BROKEN | `ecosystems.py:354-357` with `guards.caller_in` (any status, `BE/api/guards.py:51-59`). `re_entry_eligible` is never read. The framework requires a path back (re-entry-integration E.1-7). |
| Two tabs and double submit | Member uq(ecosystem_id, user_id) | join, progress, ceremony | buttons disabled while pending | n/a | PARTIAL | A concurrent join hits an uncaught IntegrityError (500). A concurrent first progress save makes 2 rows (no unique index). A concurrent ceremony section write loses an update (JSON read-modify-write, no lock). |

**Flow tests today.** Backend tests run through the real blueprints. These are covered:

- Register placement and the gate (`T/test_uxqa_p1_arrival.py:169-286`, password, DID and OAuth).
- A pending newcomer reads an agreement, consents and becomes active (`T/test_act_lifecycle.py:338`).
- A pending newcomer is refused ACT writes in REST, MCP and chat (`T/test_uxqa_p2_act.py:214-264`).
- Join-first orientation and ethos consent, keyed per row (`T/test_be_journey_flows.py:160-201`).
- Ceremony consent actor table (`T/test_g_act_flows.py:583-602`).
- Status moves are mod-only (`T/test_member_roles.py:335-350`).

Client node:test covers `lib/consent-gate.test.ts` and `lib/ecosystem-join.test.ts`. The only onboarding regression flow is the orientation video (`uxqa/regression/p2-gold-advise-profile-orient-4.mjs`).

**No test** covers any of these consequential flows: journey-map write authority, ecosystem quiz assign/unassign authority, ethos-access and quiz-assignment admin across ecosystems, the join route itself (private ecosystem, an exited member re-joining, a concurrent join), status-move vocabulary and rank, the transition record on join and activation, the stuck-pending case, newcomer items in the queue, quiz results on the right row, and the double error on ConsentGate and Login.

## 2 Authority table (actor x action)

Actors:

- **Anon:** signed out.
- **Pending:** has a `pending_consent` row in this ecosystem.
- **Member:** an active `user`-tier member here.
- **Steward:** an active `mod+` member here.
- **Steward-B:** a steward of another ecosystem with no row here.
- **Founder-B:** anyone who ran `POST /ecosystems` and selected that ecosystem. Their row has `profile="co_creator"` (`BE/api/ecosystems.py:261`), which `helpers.require_admin` honours globally (`BE/api/helpers.py:27-34`).
- **Exited:** has an `exited` row here.

| Action (route) | Anon | Pending | Member | Steward | Steward-B | Founder-B | Exited | Check, or its absence |
|---|---|---|---|---|---|---|---|---|
| Sign up naming a private ecosystem (`POST /auth/register` `ecosystem_id`) | GAP: placed there | - | - | - | - | - | - | `auth.py:101-104` (no visibility check) |
| Join (`POST /ecosystems/:id/join`) | OK 401 | OK (another ecosystem) | OK 409 | OK 409 | GAP: private allowed | GAP: private allowed | GAP: 409 dead end | `ecosystems.py:347-357` (existence only; `caller_in` any status) |
| Consent to a gate agreement (`POST /agreements/:id/consent`) | OK 401 | OK | OK | OK | OK 404 | OK 404 | OK 404 | `agreements.py:821-850`, rule-5 scope `guards.py:76-86` |
| Save orientation progress (`POST /orientation/ethos/:id/progress`) | OK 401 | OK on the server; GAP: the client bounces them to the gate | OK | OK | OK 409 JOIN_REQUIRED | OK 409 | GAP: written on the exited row | `orientation.py:373-376` (`caller_in_or_join_required` any status); `FE/lib/consent-gate.ts:21-27` |
| Create, edit, deactivate or delete a journey map (`/orientation/ethos/:id/journey-maps`, `/orientation/journey-maps/:id`) | OK 401 | GAP: allowed | GAP: allowed | OK | GAP: allowed | GAP: allowed | GAP: allowed | `orientation.py:181-308`: `@authenticated` only; DELETE also deletes everyone's progress (`:285-289`) |
| Ethos participation consent, self (`POST /ethos/:id/access/consent`) | OK 401 | OK | OK | OK | OK 409 | OK 409 | GAP: accepted | `ethos_access.py:75-103` |
| List, grant or revoke ethos access (`/ethos/:id/access`) | OK 401 | OK 403 | OK 403 | GAP: refused unless co_creator/builder profile | OK 403 | GAP: allowed in any ecosystem, for any member id | OK 403 | `ethos_access.py:106-189` (`require_admin`; the target's ecosystem is not checked at `:140-142`; `granted_by` falls back to the default row at `:143`) |
| Record a ceremony section (`POST /onboarding/:id/ceremony`) | OK 401 | GAP: own ceremony is 404 (active scope) | OK own; 403 for others | OK (facilitates) | OK 404 | OK 404 | OK 404 | `onboarding.py:200-203`, `policy.can_record_onboarding_consent` `BE/api/policy.py:278-280` |
| List onboardings (`GET /onboarding`) | OK 401 | n/a | LOW: sees everyone's ceremony progress | OK | OK (own scope) | OK | n/a | `onboarding.py:94-108` (any member) |
| Change a member's status (`POST /members/:id/status`) | OK 401 | OK 404 | OK 403 | GAP: any string, any target (owner, self); `active` on a pending member skips the gate; `exited` skips the exit flow | OK 404 | OK 404 | OK 404 | `members.py:654-673`, schema `BE/api/schemas/members.py:104-107` (`status: str`) |
| Assign or unassign an ecosystem quiz (`POST /ecosystems/:id/quizzes/assign\|unassign`) | OK 401 | GAP: allowed | GAP: allowed | GAP: takes ANY quiz from any ecosystem | GAP: via own ecosystem, steals the quiz | GAP: same | GAP: allowed | `ecosystems.py:460-481,507-515` (`_ecosystem_as_member_or_error`: any row, any status; no `quiz.ecosystem_id` check) |
| Create or delete a quiz assignment (`/quiz-assignments`) | OK 401 | OK 403 | OK 403 | GAP: refused without the profile | OK 403 | GAP: any quiz, any member, any ecosystem | OK 403 | `quiz_assignments.py:102-167` (`require_admin`; `assigned_by=admin.id` is the default row, `:134`) |
| List quiz assignments | OK 401 | GAP: every ecosystem's (fail-open `if eco_ids:`) | GAP: any member's via `?member_id=` | OK | OK | OK | n/a | `quiz_assignments.py:82-91` |
| Re-send an invite | OK 401 | OK 403 | OK 403 | OK 403 (mod) | OK 404 | OK (profile) | OK 404 | `members.py:717-719`; the act itself is fake (`:722-728`) |

## 3 Defects, ranked

**BLOCKER**

- **B1. Anyone signed in can rewrite or delete any ecosystem's orientation.** The create, update, deactivate and delete journey-map routes check authentication only (`BE/api/orientation.py:181-308`). DELETE also removes every member's progress for that map (`:285-289`).
  - Observable: an Oasis newcomer, or a pending newcomer, empties OmniOne's Explorer path, and every newcomer then sees "This journey has no steps yet". The plan listed this item in craft wave 2 (`plan.md:93`). It is still open.
- **B2. Any member of any ecosystem can take any other ecosystem's onboarding quiz.** `assign_quiz_to_ecosystem` loads the quiz by id with no ecosystem check and sets `quiz.ecosystem_id` and `is_entry_quiz` (`BE/api/ecosystems.py:460-481`). The membership check accepts any row status (`:66-76`). Unassign detaches a quiz from its ecosystem (`:507-515`).
  - Observable: founding a throwaway ecosystem is enough to move OmniOne's "Community Onboarding" entry quiz out of OmniOne.

**HIGH**

- **H1. The steward status move is unconstrained.** `POST /members/:id/status` writes any string to any member of the ecosystem for any mod (`BE/api/members.py:654-673`; `status: str` at `BE/api/schemas/members.py:105`). It has no rank check (a mod can suspend the owner), no self check, and no vocabulary. Setting `active` skips the agreement gate, which the framework forbids ("No individual or body can fast-track ... skipping current-agreement consent", re-entry-integration G). Setting `exited` bypasses `api/exit.py`. A status longer than 50 characters is a 500 on PostgreSQL.
  - Its only UI hook is unused (`FE/hooks/use-governance.ts:371-378`), so stewards also have no legitimate approve or confirm control.
- **H2. Joining ignores visibility.** `POST /ecosystems/:id/join` and sign-up with `ecosystem_id` check only that the ecosystem exists (`ecosystems.py:347-349`, `auth.py:101-104`). The ecosystem detail route does hide private ecosystems (`ecosystems.py:182`).
  - Observable: with no membership agreement (the case for every ecosystem today), the caller is ACTIVE in a private ecosystem at once, with advice, consent and emergency rights.
- **H3. A founder's profile is a cross-ecosystem admin key.** `create_ecosystem` gives the founder `profile="co_creator"` (`ecosystems.py:261`). `require_admin` reads the profile on the default row, the selected one (`helpers.py:27-34`). Selecting the new ecosystem therefore unlocks the ethos-access list, grant and revoke for OmniOne (`ethos_access.py:106-189`; the target is any member id, `:140-142`) and quiz-assignment create and delete for any member anywhere (`quiz_assignments.py:102-167`).
  - The same root reaches `badges.py`, `teams.py`, `settings.py`, `ctc_handoff.py` and `discover.py` (hand-off).
  - The converse also holds: an owner by role, without the profile, is refused in their own ecosystem.
- **H4. Nobody is told a newcomer is waiting, and pending can be permanent.**
  - `next_steps.waiting_for` serves active callers only and has no member kind (`BE/services/next_steps.py:818-820`), so stewards never see newcomers, and a pending newcomer's `what_needs_me` is empty.
  - MemberList cannot filter `pending_consent` and shows the raw status (`FE/pages/governance/members/MemberList.tsx:15-20,87-88`).
  - A pending row whose gate is now empty (an agreement sunset, a requirement removed) stays pending. The gate page says "Ask a steward ... to confirm your membership" (`FE/pages/ConsentGatePage.tsx:68-72`), but no steward action exists (H1). Live case: `qa_probe_tess` in Escherbridge.
- **H5. A member who left cannot come back.** `caller_in` returns the exited row, so join answers 409 "Already a member" (`ecosystems.py:354-357`). The client treats 409 as joined and toasts "Already a member" (`FE/lib/ecosystem-join.ts:20-27,53`). `/auth/me` gives them no status for it (M8). `ExitRecord.re_entry_eligible` (`BE/db/models/exitrecord.py:57`) is never read.

**MEDIUM**

- **M1. A gated newcomer cannot orient.** `/orientation/*` is not in `READABLE_WHILE_GATED` (`FE/lib/consent-gate.ts:21-27`), but the ethos page's Begin and Open orientation links go there (`FE/pages/EthosDetail.tsx:184,208`). The newcomer bounces back to the gate, even though the framework's order is walkthrough first, then consent (member-lifecycle E.3-6). This is latent today and becomes HIGH the day any ecosystem configures a gate.
- **M2. The UAF ceremony is orphaned.**
  - No code creates `MemberOnboarding`. For 34 of 45 study rows the ceremony and `GET /members/:id/onboarding` return 404 "No onboarding record found" (`onboarding.py:159-160`, `members.py:690-691`).
  - Reaching 100% only sets `consent_date` (`onboarding.py:230-232`): no status change, no transition, no steward item.
  - `cooling_off_*` is never written. The page promises "Your facilitator will confirm the final onboarding once the cooling-off period has passed" (`FE/pages/governance/onboarding/OnboardingCeremony.tsx:310-315`), and no such action exists.
  - Two entry-consent models coexist (review-core C, row universal-agreement-field).
- **M3. Stand-aside counts as consent on the server but not in the UI.** The UI sends `{consented: true, position: "stand_aside"}` (`OnboardingCeremony.tsx:127`). `_calc_completion` counts any truthy `consented` (`onboarding.py:75-76`). The UI counts only `position === 'consent'` (`OnboardingCeremony.tsx:53-57`). The server reports 100% and stamps `consent_date` while the page says "5 of 6 sections consented".
- **M4. Membership moves leave no record.** Sign-up (`auth.py:136-150`), join (`ecosystems.py:362-378`), activation by consent (`agreements.py:728-734`) and the demotion on consent withdrawal (`agreements.py:895-902`) write no `MemberStatusTransition`. Withdrawing consent to a membership agreement silently demotes any member, owner included, to `pending_consent`, which removes their standing with no warning and no trace.
- **M5. The UI shows two errors for one failure.**
  - Ethos ConsentGate: the join inside `joinThen` toasts "Orientation request failed" (`FE/lib/ecosystem-join.ts:31`), and the consent mutation renders the same failure inline (`FE/components/discovery/ConsentGate.tsx:37-41,93-97`).
  - Login: every sign-in or sign-up failure toasts (`FE/pages/Login.tsx:193-198`, `:124-129`, `:148-153`) and also renders `authError` inline (`Login.tsx:638-640`, set at `FE/contexts/AuthContext.tsx:158-160`). It also uses `err.message`, not `apiErrorMessage`.
- **M6. The join copy misstates what happens.** "Request to begin orientation", then "Orientation requested" or "Requested" (`FE/pages/governance/ecosystems/EcosystemDetail.tsx:323-327`, `EcosystemList.tsx:57-63`), and the toast "Orientation requested" (`ecosystem-join.ts:50-55`). The click actually makes the caller a member, usually active at once.
- **M7. Quiz results land on the wrong row, and entry quizzes do nothing.** `submit_quiz` keys `QuizResult` on the default row (`BE/api/quizzes.py:416,441`), so an OmniOne entry quiz taken by someone whose default is Oasis shows on their Oasis member page (`members.py:325`). `is_entry_quiz` is never used at join. Assignments are admin-only, never shown to the member, and never marked done.
- **M8. `/auth/me` has no per-ecosystem membership status.** `ecosystems` carries only the ecosystem's own status (`auth.py:383-416`), so the client counts exited or declined memberships as active (`FE/lib/consent-gate.ts:31-35`, api/AGENTS.md wave-2 note). EcosystemDetail then shows "Member" and Edit to any row holder (`EcosystemDetail.tsx:98,315-322`), and join is never offered to a leaver.
- **M9. An invite to ecosystem X places the newcomer in the default ecosystem.** Register accepts `ecosystem_id` (`auth.py:575-578`), but the client never sends it (`FE/lib/api-client.ts:88-93`). Following an invite yields two memberships (default plus X) and the selection lens stays on the default (`p2-repair-bench-across-ecosystems-7`).

**LOW**

- **L1.** OnboardingList shows the member UUID, because it reads `member_name`/`display_name` while the API sends `member_display_name` (`OnboardingList.tsx:53` vs `onboarding.py:123`). The Ecosystem column is always "-" (no `ecosystem_id` in `OnboardingListItem`). The page uses no `QueryState`. The ceremony header reads "Member <uuid>" (`OnboardingCeremony.tsx:166`).
- **L2.** Re-send invite reports success and does nothing (`members.py:722-728`). UserManagement passes a user id to a member route (`FE/pages/UserManagement.tsx:155`).
- **L3.** Progress save does not validate `journey_map_id` (another ecosystem's map is accepted; a missing one hits a NOT NULL 500). `status` and `current_step` are free (`orientation.py:385-436`). A first save from two tabs makes two rows (`BE/db/models/userjourneyprogress.py:35-37`). `genplan-input` answers `received: true` and stores nothing (`orientation.py:452-462`).
- **L4.** Ceremony section writes are a JSON read-modify-write with no row lock (`onboarding.py:205-234`). `member_onboarding.member_id` has a non-unique index, so a duplicate row makes `scalar_one_or_none` a 500.
- **L5.** A concurrent join hits the uncaught `uq_member_ecosystem_user` and returns a 500 (`ecosystems.py:362-376`). The client toasts a failure although the membership exists.
- **L6.** Orientation reads ignore visibility. Ethos detail and journey maps of a private ecosystem open to any signed-in user (`orientation.py:38-61,154-178`). Ecosystem quiz results open to any row holder, any status (`ecosystems.py:529`).
- **L7.** ConsentGatePage says "You're an active member" to anyone with no pending gate, an exited-only user included (`ConsentGatePage.tsx:26-38`). Its mount refresh has no catch (`:12-24`).
- **L8.** `/quizzes` redirects to the ceremony list (`FE/App.tsx:250-253`), and MyQuizHistory's "browse quizzes" button lands there too (`FE/pages/MyQuizHistory.tsx:215`). `pages/QuizzesOnboardingHub.tsx` is dead code. The AdminPanel comment "no /api/v1/quiz-assignments route exists" is stale (`FE/pages/AdminPanel.tsx:533`). The admin "Create user" posts to `/members` without `ecosystem_id`, which is a 400 (`:536-547`). `/members/new` creates a second row for the caller, which is a unique-violation 500 (`members.py:459-504`).

## 4 Ranked changes (max 10)

Bar: no new subsystems. Every change builds on `caller_in`, `policy`, `ApiError`, `get_scoped_or_404`, `restrict_to_ecosystems`, `next_steps`, `useApiMutation`, `QueryState` and `keys`.

1. **Lock onboarding content to the ecosystem's stewards** (B1, B2, H3 for the onboarding routes, the list fail-open, L3 validation). Effort M.
   - Add `policy.can_manage_onboarding(member, ecosystem_id)`: `is_steward_in` with an active row.
   - Journey maps: create uses `caller_in(eco)`. Update and deactivate load the map, then check `caller_in(map.ecosystem_id)`; a global map (`ecosystem_id IS NULL`) is refused. DELETE answers 409 "Deactivate it instead" when progress rows exist.
   - Ecosystem quiz assign/unassign: steward here, and `quiz.ecosystem_id in (None, ecosystem_id)`.
   - Ethos access and quiz assignments: replace `require_admin` with `caller_in` plus the predicate. The target must be a member of that ecosystem (404 otherwise). `granted_by`/`assigned_by` = the caller's row. Lists use `restrict_to_ecosystems`, and a member sees only their own assignments.
   - Progress save: the map must belong to the ecosystem and be active; `status` must be in {`in_progress`, `complete`, `opted_out`}.
   - Touches BE `api/orientation.py`, `api/ecosystems.py` (quiz sections), `api/ethos_access.py`, `api/quiz_assignments.py`, `api/policy.py` (append). No FE change is needed (`useApiMutation` already renders the 403).
   - **Flow test:** `T/test_onboarding_authority.py`. One actor x route table (the seven actors of section 2) per write route. It asserts that OmniOne's journey step count and its quiz's `ecosystem_id` are unchanged after every refused call, and that Founder-B is refused on OmniOne's ethos access.
2. **One placement helper for sign-up, join and return** (H2, H5, M4 for placement, L5, the H4 stuck case). Effort M.
   - Add `place_member(session, *, user, ecosystem, display_name, trigger)`, extracted from `create_signup_member` and the join handler.
   - It refuses non-public ecosystems (404, owner Q3).
   - An existing row: active, 409. Pending with nothing missing: activate it ("gate cleared"). Exited: return it to `pending_consent`/`active` per the gate when the latest `ExitRecord.re_entry_eligible` allows (owner Q4).
   - A new row is created otherwise. Every outcome writes one `MemberStatusTransition` (`joined`, `signup`, `gate_cleared`, `re_entry`). IntegrityError becomes 409.
   - Activation and demotion in `agreements.py:728-734,895-902` call the same `record_transition`.
   - FE: `ConsentGatePage` turns an empty agreement list into a "Check my membership" button that calls join and heals the row.
   - Touches BE `api/auth.py`, `api/ecosystems.py` (join), `api/agreements.py` (two 3-line call sites), new `services/member_lifecycle.py`. FE `pages/ConsentGatePage.tsx`.
   - **Flow test:** an exited member rejoins and is pending, with a `re_entry` transition and the same row. A private ecosystem is 404 by sign-up and by join. Two concurrent joins leave one row (201 then 409). A pending row with an empty gate becomes active on join. Each placement writes exactly one transition.
3. **Steward moves on a membership come from a closed table** (H1, L2). Effort S-M.
   - Add `policy.MEMBER_MOVES` with active<->suspended, inactive->active and pending_consent->active (only when `missing_agreement_consents` is empty, else 409 with `required_agreements`).
   - Add `can_move_member(caller, target)`: an active steward here, not on self, and `role_rank(caller) > role_rank(target)`. Anything else is a 400 carrying `allowed`; `exited` points to the exit flow.
   - The member detail returns `caller_member_moves`. MemberDetail renders them with a confirm dialog. MemberList gets a "Waiting on consent" filter and `memberStatusLabel`.
   - Delete the fake resend-invite route and its button, or relabel it "Copy sign-up link".
   - Touches BE `api/members.py` (status and resend handlers only), `api/policy.py`. FE `pages/governance/members/MemberDetail.tsx`, `MemberList.tsx`, `pages/UserManagement.tsx`, new `hooks/use-onboarding.ts`.
   - **Flow test:** a mod suspending the owner is refused, a self move is refused, pending->active with a missing agreement is a 409 naming it, pending->active with a clear gate is 200 with the actor recorded, `exited` is a 400, and a 51-character status is a 400, not a 500.
4. **Newcomers in the queue, both directions** (H4, next step for every newcomer). Effort S-M. All items are derived from state in `services/next_steps.py`, appended under `# G-Onboard`:
   - **Pending caller:** `consent_to_join`, one item per missing gate agreement. `waiting_for` widens its row query to `pending_consent` for this kind only.
   - **Stewards:** `confirm_membership` for each pending member here whose gate is clear (the stuck case, acted on through change 3).
   - **New active member, first 30 days:** `start_orientation` while no complete progress exists in an ecosystem with an active journey; it clears on completion.
   - FE `lib/next-steps.ts` kind labels; the Dashboard shows these items first for a member under 30 days old (owner-action ordering already exists).
   - **Flow test:** Nia (pending) sees "Consent to UAF"; a steward of A sees "Confirm Tess" once her gate is empty and a steward of B does not; after the confirm both items are gone; Kofi (new) sees `start_orientation` until his progress is complete. `what_needs_me` returns the same items.
5. **The gate lets newcomers orient; join says what it does; one error per failure** (M1, M5, M6, L7). Effort S. Frontend only:
   - Gate and gate page: add `^/orientation/[^/]+(/journey|/complete)?$` to `READABLE_WHILE_GATED`; `ConsentGatePage` gets "Learn about <name> first" linking `/ethos/<id>`.
   - Join copy: "Join <name>". Toasts read "Joined <name>" and "One step left: consent to <name>'s agreements"; the error reads "Could not join <name>".
   - Errors: `joinEcosystemMutation` takes `silent` when used inside `joinThen`, and the caller renders the error inline. Login keeps only the inline `authError` and drops the catch toasts, using `apiErrorMessage`. The gate page shows no "You're an active member" without an active membership.
   - Touches FE `lib/consent-gate.ts`, `lib/ecosystem-join.ts`, `components/discovery/ConsentGate.tsx`, `pages/OrientationGate.tsx`, `pages/ConsentGatePage.tsx`, `pages/Login.tsx`, `contexts/AuthContext.tsx`, `pages/governance/ecosystems/EcosystemDetail.tsx`, `EcosystemList.tsx`.
   - **Flow test:** node:test: a gated member may open `/orientation/x/journey` but not `/dashboard`; the join toast copy per status; `silent` suppresses the toast. Regression `uxqa/regression/onboarding-consent-gate-one-error.mjs`: a failed join on ConsentGate shows exactly one error.
6. **One entry-consent model** (M2, M3, L1, L4; owner Q1). Effort S-M.
   - Default: the membership-agreement gate is the entry consent.
   - `/onboarding` becomes the steward's "Newcomers" list: pending members plus rows joined in the last 30 days, with gate agreements, orientation status and a message link, read with `QueryState` from `GET /members?status=` and a `joined_since` filter.
   - The ceremony page stays read-only for existing rows, without the cooling-off promise.
   - Fix the server count: only `position in (None, "consent")` with `consented` counts. Lock the row (`with_for_update`) on a section write.
   - Touches BE `api/onboarding.py`, `api/members.py` (list filter). FE `pages/governance/onboarding/*`, `lib/route-guides.ts`.
   - **Flow test:** a stand-aside leaves completion below 100 and `consent_date` unset; the newcomers list shows names and ecosystems for a steward and refuses an ordinary member.
7. **`/auth/me` reports each membership's status** (M8). Effort S.
   - `ecosystems[].membership_status` (and `role`). `activeEcosystemIds` uses it. EcosystemDetail and EcosystemList show "Member" only when active and Edit only for stewards (`caller_role`).
   - Build `existing_membership` on `guards.default_member` (api/AGENTS.md wave-2 note).
   - Touches BE `api/auth.py`. FE `lib/consent-gate.ts`, `types/api.ts` (append), EcosystemDetail and EcosystemList.
   - **Flow test:** node:test: an exited membership elsewhere is not active and join is offered; backend: `/auth/me` lists `exited` for the left ecosystem.
8. **An invite carries its ecosystem** (M9). Effort S.
   - Login reads `?ecosystem=<id>`, or derives it from a `redirect=/ethos/<id>`, through a pure `lib/signup-ecosystem.ts`, and `register` sends `ecosystem_id`. OAuth is left as-is (noted).
   - Touches FE `pages/Login.tsx`, `contexts/AuthContext.tsx`, `lib/api-client.ts` (append param).
   - **Flow test:** node:test for the parser. The backend side exists (`T/test_uxqa_p1_arrival.py:182`); add a case where a private ecosystem is a 404 (change 2).
9. **Entry quiz on the right row, visible to the newcomer** (M7, L8). Effort S.
   - `submit_quiz` keys on `caller_in(quiz.ecosystem_id)` when the quiz has one. A pass marks matching `QuizAssignment.status="completed"`.
   - A `take_entry_quiz` item (change 4's section) appears while a new member has no passing result for the ecosystem's published entry quiz.
   - `/quizzes` points to the quiz list, not the ceremony list; delete the dead `QuizzesOnboardingHub.tsx`.
   - Touches BE `api/quizzes.py` (submit only), `services/next_steps.py` (same section). FE `App.tsx` (one route), `lib/next-steps.ts`.
   - **Flow test:** a member whose default row is Oasis takes OmniOne's entry quiz; the result is on the OmniOne row, the item clears, and the assignment reads completed.
10. **Assistant parity for onboarding.** Effort M.
    - Chat `join_ecosystem` calls `place_member` and needs confirmation (it creates a membership). Chat `attest_agreement_consent` wraps `record_member_consent` as MCP does. `move_member` follows `MEMBER_MOVES` and needs confirmation. MCP `join_ecosystem` uses the same helper.
    - `what_needs_me` inherits change 4. The system prompt's "onboarding" page hint names these tools.
    - Touches BE `agent/governance_tools.py` (append `# G-Onboard`), `mcp_server.py` (append), `api/chat.py` (none expected).
    - **Flow test:** a parity script in the style of `T/test_uxqa_p1_mcp_parity.py`: a private join is refused on REST, MCP and chat; a pending newcomer attests through chat and is active with one transition; a steward confirms a stuck newcomer through chat and the same transition row results.

## 5 Owner questions

| # | Question | Recommended default | Cost to reverse |
|---|---|---|---|
| Q1 | Which consent is the entry consent: the membership-agreement gate or the six-section UAF ceremony? | The agreement gate, which already works end to end and is what activation reads. The ceremony becomes read-only history. Review-core already rejected an enforced section ceremony with cooling-off. | Low. No data is removed, and the ceremony page stays. Turning it back on means creating the row in `place_member` and gating activation on 100%. |
| Q2 | Does a steward approve newcomers? | No. The framework forbids gate-keeping outside UAF incompatibility (member-lifecycle H). Stewards are told (change 4) and confirm only the stuck case. | Medium: a new `awaiting_steward` state, a queue item and a move. |
| Q3 | How does anyone join a private ecosystem? | Not by self-service: join and sign-up answer 404. Invites are deferred until asked for. Until then a private ecosystem grows only through its founders' sign-ups with an explicit decision. | Low: one condition in `place_member`. |
| Q4 | Can a member who left return, and how? | Yes, when `re_entry_eligible`. The same row goes back to `pending_consent` (they re-consent to the current agreements, per the framework) or to `active` when no gate exists. History stays on the row, and a `re_entry` transition is recorded. No coordinator and no 30-day orientation timer. | Low. |
| Q5 | Is there a "declined" applicant? | No steward decline. A pending newcomer can withdraw their own request (leave), which is recorded. A documented UAF incompatibility goes through a conflict case. | Low-medium: adding `declined` later is one `MEMBER_MOVES` row plus copy. |
| Q6 | Withdrawing consent to a membership agreement: demote to pending, or not? | Keep the demotion (consent is the membership condition). Record it, and confirm first with copy naming what is lost ("You will stop taking part in X until you consent again; your steward role pauses"). | Low. |

## 6 Proposed lane: G-Onboard (one builder, opus)

**Owns (backend):**

- `api/onboarding.py` and `api/orientation.py`
- `api/ethos_access.py` and `api/quiz_assignments.py`
- `api/ecosystems.py`: join and the quiz assign/unassign/results handlers. Coordinate if a lane extracts the founding helper (`plan.md:93`).
- `api/members.py`: only the `member_status_transition`, `resend_invite`, `create_member` and list-filter handlers. Role grants stay with G-ACT's code.
- `api/auth.py`: `create_signup_member`, `pending_consent_gates`, `api_me`.
- `api/quizzes.py`: `submit_quiz` only.
- new `services/member_lifecycle.py`
- the two call sites in `api/agreements.py:728-734,895-902`, as call-site edits only
- `agent/governance_tools.py` and `mcp_server.py`: append under `# G-Onboard`
- new tests: `T/test_onboarding_authority.py`, `T/test_onboarding_flows.py`, `T/test_onboarding_parity.py`

**Owns (frontend):**

- `lib/consent-gate.ts` (+test) and `lib/ecosystem-join.ts` (+test)
- new `lib/signup-ecosystem.ts` (+test)
- `components/discovery/ConsentGate.tsx`
- `pages/ConsentGatePage.tsx`, `pages/OrientationGate.tsx`, `pages/Login.tsx`, `contexts/AuthContext.tsx`
- `pages/governance/onboarding/*`
- `pages/governance/members/MemberDetail.tsx` and `MemberList.tsx`
- `pages/governance/ecosystems/EcosystemDetail.tsx` and `EcosystemList.tsx`
- `pages/UserManagement.tsx` (the resend button only), `pages/Dashboard.tsx` (newcomer ordering only)
- delete `pages/QuizzesOnboardingHub.tsx`
- new `hooks/use-onboarding.ts`
- `uxqa/regression/onboarding-*.mjs`

**Shared, append-only under `# G-Onboard` / `// G-Onboard`:**

- `api/policy.py`: `can_manage_onboarding`, `MEMBER_MOVES`, `can_move_member`
- `services/next_steps.py`: `newcomer_items`, gate items, `take_entry_quiz`
- `client/src/lib/api-client.ts`, `client/src/types/api.ts`
- `client/src/lib/query-keys.ts`: a `newcomers` key; keep the invariants green
- `client/src/lib/next-steps.ts`: kind labels
- `client/src/App.tsx`: the `/quizzes` route line

No migration needed. Changes 2 and 3 reuse `member_status_transitions`, and status is `String(50)`.

**Hand-offs out of scope:** the `require_admin` profile root in `badges.py`, `teams.py`, `settings.py`, `ctc_handoff.py` and `discover.py` (H3's other half). Messaging and notifications keyed on the default row (`plan.md:93`).

## 7 Explicitly rejected (over-engineering)

- An invite-token or email-invite subsystem, or a notification service for arrivals. `next_steps` items and the newcomers list cover "who is waiting".
- A steward approval board or application review workflow. The framework forbids gate-keeping; see Q2.
- An enforced 48-hour cooling-off timer and a section-by-section ceremony engine. Review-core §5 already rejected them.
- A re-entry coordinator, a 30-day re-entry orientation timer, change-summary generation and portable-record verification at re-entry.
- Facilitator scheduling, mentor matching, and council consent for profile assignment.
- An inactivity-detection cron or dormant-prospect sweeps.
- A separate lifecycle-record table. `member_status_transitions` is the record.
- Unique-index migrations for progress and ceremony rows. A row lock on write is enough at study volume; revisit if duplicates appear.
