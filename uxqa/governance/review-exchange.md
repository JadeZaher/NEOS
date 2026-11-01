---
type: Governance Review
title: Shares, needs and the collaborations they lead to (exchange review)
timestamp: "2026-11-01"
scope: shares-needs-collaborations
---

# Exchange review: shares, needs, collaborations

Owner (2026-11-01): "the onboarding and shares and needs management needs to be ironclad".
Review only. Path prefixes: `BE/` = `neos-operating-system/agent/src/neos_agent/`,
`FE/` = `charting-the-course/client/src/`, `T/` = `neos-operating-system/agent/tests/`,
`NC/` = `neos-operating-system/neos-core/`. Study DB = `neos_uxqa` (read-only SELECTs, 2026-11-01).
Anonymous GETs to `/api/v1/discover/shares-needs`, `/admin`, `/collaborations` on :8000 all return 401.

Verdict: posting works and an author can edit and withdraw a public post from Me. Everything
after posting is missing or unsafe: nobody can respond across ecosystems, the poster never
learns of interest, two of three visibilities do not do what they say, moderation is held by
anyone who has ever founded an ecosystem, and a collaboration can be approved for a whole
ecosystem by any member and never ended.

## 1. Flow matrix

| Step | Model | API route | UI | Assistant tool | Status | Evidence |
|---|---|---|---|---|---|---|
| Post a share/need | `SharesNeeds` | `POST /discover/shares-needs` | `SharesNeedsForm`; `DomainDetail` inline form | none | PARTIAL | create rules `BE/api/discover.py:709-837`; DomainDetail sends values the API rejects or misfiles (`FE/pages/governance/domains/DomainDetail.tsx:442-443,471`) |
| Choose visibility | `visibility` public/ecosystem/private | same | form select | none | BROKEN | Discover lists `public` only (`discover.py:265`); `private` shown to every ecosystem member (`BE/api/domains.py:608`, `BE/api/ecosystems.py:594`); "Domain Only" is a 400 (`discover.py:739-741`) |
| Discover (search, filters, empty) | — | `GET /discover/shares-needs` | `SharesNeedsList` | none | PARTIAL | q/type/category work (`discover.py:265-277`); cards show no author, domain or age (`FE/pages/discover/SharesNeedsList.tsx:178-186`); category drift hides rows (D11); error has no Retry (`SharesNeedsList.tsx:84-91`) |
| Open one post / deep link | — | none | none | none | MISSING | no `GET /shares-needs/:id`; no detail route in `FE/App.tsx:285-291` |
| Respond (message the poster, offer to meet) | `MemberDecision` (private note) | `POST /my-decisions` | "Use"/"Serve" (`SharesNeedsList.tsx:190-200`) | none | MISSING | note is "Only you can see" (`FE/components/governance/RecordDecisionDialog.tsx:108-111`); 403 for other ecosystems (`BE/api/my_decisions.py:216-225`); messaging picker cannot find a poster outside your ecosystems (`BE/api/messaging.py:622,632`) |
| Match ("met by X") | — | none | none | none | MISSING | status carries no counterpart, note or actor (`discover.py:672-674`) |
| Mark fulfilled / withdraw / reopen | `status` | `POST /shares-needs/:id/status` | Me: withdraw only; DomainDetail: fulfil/withdraw buttons to everyone; Admin: all | none | PARTIAL | any->any (`discover.py:660`); Me lists active public only (`BE/api/profiles.py:265-267`), so the author never sees a closed post again |
| Edit | row | `PUT /shares-needs/:id` | Me edit dialog (`FE/pages/Profile.tsx:114-290`); Admin | none | OK (author) | `discover.py:539-641` |
| Delete | row | `DELETE /shares-needs/:id` | DomainDetail (`confirm()`), Admin | none | PARTIAL | hard delete (`discover.py:703`); orphans `MemberDecision` titles (`my_decisions.py:81`) |
| Moderate (hide, archive, abuse) | — | `GET /shares-needs/admin` + the author routes | AdminPanel "shares-needs" tab | none | BROKEN | global profile check (`discover.py:356,477`; `BE/api/helpers.py:27-34`); no steward rule, no reason, no hide state |
| Stale posts | — | none | none | none | MISSING | no age shown, no check-in; framework flags pending requests at 60 days (`NC/layer-04-economic/resource-request/SKILL.md:81`) |
| Author exits | `Member.current_status` | exit completion | — | — | MISSING | `_mark_exited` leaves posts listed (`BE/api/exit.py:217-226`); list ignores author status (`discover.py:265-292`) |
| Match -> collaboration | `Collaboration.linked_shares_needs` | `POST /discover/collaborations` | `CollaborationForm` | none | MISSING | link never written (`discover.py:1143-1153`) nor returned (`discover.py:1061-1074`); target select is the caller's own domains only (`FE/pages/discover/CollaborationForm.tsx:29,140-142`) |
| Propose collaboration | `Collaboration` | same | `CollaborationForm` | none | PARTIAL | `discover.py:1077-1169`; proposer not recorded (no column, `BE/db/models/collaboration.py:49-61`) |
| Approve per ecosystem / activate | `CollaborationApproval` | `POST /collaborations/:id/activate` | "Activate collaboration" (`FE/pages/discover/CollaborationDetail.tsx:92-97`) | none | BROKEN | any active member approves for an ecosystem (`discover.py:865-871`); awaited side returned but never shown (`discover.py:936-937`); GET has no approvals |
| review_date | `review_date` | none writes it | shown as "—" | none | MISSING | only read at `discover.py:1072` |
| End (complete / dissolve) | `status` | none | badges and filters exist | none | MISSING | `completed`/`dissolved` unreachable (`CollaborationDetail.tsx:10-17`, `CollaborationsList.tsx:12-16`) |
| What poster / responder / other ecosystem see next | — | `GET /me/next-steps` | bell, dashboard queue | `what_needs_me` | MISSING | no share/need/collaboration kinds (`BE/services/next_steps.py:79,809`) |

## 2. Authority (actor x action)

Actors: Anon; Pend = pending newcomer; Mem = active member of the post's ecosystem (not author);
Auth = author; Other = active member of another ecosystem; DStw = domain steward; EStw = ecosystem
steward (mod+); Fndr = anyone holding `co_creator`/`builder` in ANY ecosystem (every ecosystem founder gets
`co_creator`, `BE/api/ecosystems.py:261`); Exit = exited author.

| Action | Anon | Pend | Mem | Auth | Other | DStw / EStw | Fndr (any ecosystem) | Exit | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Create | 401 OK | 403 OK (wrong words: no `CONSENT_PENDING`) | OK | — | 403 OK | OK (participation if agreements) | as member OK | 403 OK | `discover.py:776-805` |
| List public posts | 401 OK | read OK | OK | OK | OK | OK | OK | read OK | `discover.py:245-334` |
| See `ecosystem` post | — | — | GAP: only on domain page | GAP: same | hidden OK | GAP | GAP: admin list | — | `discover.py:265`; `domains.py:594-645` |
| See `private` post | — | — | GAP: sees it | OK | hidden OK | sees it | GAP: sees all networks' | — | `domains.py:608`; `ecosystems.py:594`; `discover.py:368` |
| Edit | 401 | 403 | 403 OK | OK | 403 OK | GAP: 403 (cannot moderate) | GAP BLOCKER: allowed anywhere, may move `ecosystem_id`/`domain_id` | non-active only OK | `discover.py:477-496,555-566,619-622` |
| Change status | 401 | 403 | 403 OK | OK, any->any | 403 OK | GAP: 403 | GAP BLOCKER | withdraw allowed OK | `discover.py:644-683` |
| Delete | 401 | 403 | 403 OK | OK (hard) | 403 OK | GAP: 403 | GAP BLOCKER (hard, no reason) | allowed | `discover.py:686-706` |
| Legacy post (no author) | — | — | — | — | — | GAP: 403 | only Fndr | — | `discover.py:480-484`; 16 active null-author rows in study DB |
| Moderation list | 401 | 403 | 403 | 403 | 403 | GAP: 403 | GAP BLOCKER: every ecosystem incl. private | 403 | `discover.py:342-358` |
| Respond | 401 | private note only | private note only | own post allowed (LOW) | GAP: 403 | note only | note only | — | `my_decisions.py:97-98,216-225` |
| Propose collaboration | 401 | 403 OK | OK (owner Q8) | — | target any domain, even a private ecosystem's | OK | as member | 403 OK | `discover.py:1118-1127` |
| Approve for an ecosystem | 401 | 403 | GAP: any member approves | — | approves for own side | OK | as member | 403 OK | `discover.py:865-871`; framework wants steward/circle authority (`NC/layer-05-inter-unit/cross-ethos-request/SKILL.md:35-38,49-50`) |
| Approve as a member of both | — | — | GAP: always target side | — | — | — | — | — | `ORDER BY ecosystem_id == source` puts target first (`discover.py:869`) |
| Same-ecosystem collaboration | — | — | GAP: proposer activates alone | — | — | — | — | — | one key in `domains_by_ecosystem` (`discover.py:861-864`); API allows source == target (no check, `discover.py:1095-1127`) |
| End collaboration | — | — | MISSING | — | MISSING | MISSING | MISSING | — | no route |
| Read proposed collaboration terms | 401 | GAP: all | GAP: all | — | GAP: all incl. private ecosystems' names | — | — | — | `discover.py:970-974,1040-1074` |

Write rule today is "author or global profile admin", built on `request.ctx.member.profile`, which
`BE/api/AGENTS.md:427-433` already names as drift ("an admin check about a resource must read the profile of
`caller_in(..., resource.ecosystem_id)`"). There is no exchange predicate in `BE/api/policy.py`.

## 3. State machine: stored vs shown

| Record | Value | Set by | Who | Shown in UI | Gap |
|---|---|---|---|---|---|
| SharesNeeds.status | `active` | create default (`BE/db/models/sharesneeds.py:64`); reopen via `/status` with the publication gate (`discover.py:667-670`) | author, Fndr | Discover shows only active; Admin "Reactivate" | the author has no reopen anywhere (Me lists active public only, `profiles.py:265-267`) |
| | `fulfilled` | `/status` from any value (`discover.py:660`) | author, Fndr | DomainDetail tick to every profile with `canEditSharesNeeds` (`DomainDetail.tsx:509-513`); Admin | not on Me; records no counterpart, actor or note |
| | `withdrawn` | `/status` from any value | author, Fndr | Me, DomainDetail, Admin | no reason recorded |
| | `expired` | never | — | red tone `SharesNeedsList.tsx:25` | UI-only state |
| | (gone) | `DELETE` hard delete (`discover.py:703`) | author, Fndr | DomainDetail, Admin | no soft delete; `MemberDecision.subject_id` dangles |
| SharesNeeds.visibility | `public` / `ecosystem` / `private` | create, PUT (`discover.py:739-741,573-578`) | author | form selects | `ecosystem`: listed nowhere members browse (4 active needs in study DB); `private`: not private |
| | `domain` | never (400) | — | DomainDetail "Domain Only" (`DomainDetail.tsx:471`) | UI-only, always fails |
| SharesNeeds.category | free text <=100 | create/PUT (`discover.py:756-761,598-605`) | author | canonical list `FE/lib/sharesneeds-vocab.ts:3-13`; DomainDetail `skill`, `resource` | study DB: 8 `skill`, 4 `resource` rows never match the Skills/Resources filters |
| Collaboration.status | `proposed` | create (`discover.py:1152`) | any active source member | "Activate collaboration" to every viewer | no withdraw, decline or expiry |
| | `active` | activate once every ecosystem approved (`discover.py:926-928`) | any active member of each side | badge | 2 seeded `active` rows have 0 approval rows; page cannot say who approved |
| | `completed`, `dissolved` | never | — | badges, filters | unreachable |
| CollaborationApproval | row per ecosystem | activate (`discover.py:885-899`); stale rows deleted (`905-919`) | any active member | never | GET has no `approvals`/`awaiting` |
| Collaboration.review_date / linked_shares_needs / version_fingerprint | — | never written; `linked_shares_needs` and `version_fingerprint` not returned | — | "Review Date —", "Linked Shares & Needs" card never renders (`CollaborationDetail.tsx:192-213`) | dead fields |

A closed post does not accept responses (Discover hides it; `my_decisions.py:98` requires `active`),
but only because the one "response" is a private note.

## 4. Defects (ranked)

**BLOCKER**

- **D1. Every ecosystem founder is a network-wide moderator of shares and needs.** Root: `discover.py:477` and
  `helpers.require_admin` (`helpers.py:27-34`, used at `discover.py:356`) test `request.ctx.member.profile`;
  `create_ecosystem` makes the founder `co_creator` (`ecosystems.py:261`). Observable: sign up, create
  ecosystem "X", select it, then `GET /discover/shares-needs/admin` lists every ecosystem's posts including
  `private`, and PUT/status/DELETE succeed on any post anywhere; PUT may also rewrite `ecosystem_id`/`domain_id`
  (`discover.py:565-566`). `T/test_profiles.py:245-310` asserts "admins manage any publication", so it must flip.
- **D2. Nobody can respond to a post from another ecosystem, and the poster never learns of interest.** Root:
  the only card action records a private `MemberDecision` (`SharesNeedsList.tsx:190-200`,
  `RecordDecisionDialog.tsx:108-111`), refused 403 "Not a member of that ecosystem" for non-members
  (`my_decisions.py:225`); cards carry no author name (API sends only `author_member_id`, `discover.py:318`);
  the new-conversation picker only lists members of your own ecosystems (`messaging.py:622,632`).
  Observable: an Oasis member clicks "Serve" on an OmniOne need and gets an error; there is no way to find or
  message the poster. The cross-ecosystem exchange cannot complete.

**HIGH**

- **D3. Visibility does not do what it says.** (a) `ecosystem` posts are never in Discover (`discover.py:265`);
  the form still toasts "now available" and lands on a list without the post (`FE/pages/discover/SharesNeedsForm.tsx:93-94`).
  (b) `private` is shown to every member through the domain and ecosystem lists (`domains.py:608`,
  `ecosystems.py:594`) and counted on the Dashboard (`FE/pages/Dashboard.tsx:347-349`). (c) "Domain Only" is
  always a 400 (`DomainDetail.tsx:471` vs `discover.py:740`).
- **D4. Stewards cannot moderate their own ecosystem; moderation leaves no record.** Root: no steward branch
  (`discover.py:477-496`); status change and delete store no actor or reason (`discover.py:672-674,703`);
  legacy null-author posts (16 active in the study DB) are profile-admin-only (`discover.py:480-484`).
- **D5. Collaboration approval is not accountable.** Any active member approves for the whole ecosystem
  (`discover.py:865-871`); a member of both ecosystems can only ever approve the target side (`:869`);
  a same-ecosystem collaboration is activated by its proposer alone (`:861-864`, no source != target check
  at `:1095-1127`); who proposed is not stored (`collaboration.py:49-61`).
- **D6. A collaboration cannot end or be reviewed.** No end, withdraw or decline route; `review_date` never
  written; `completed`/`dissolved` unreachable (section 3). Proposed collaborations live forever.
- **D7. Nobody is told anything.** `next_steps` has no share/need/collaboration items (`next_steps.py:79,809`):
  the other ecosystem never learns a collaboration awaits it; the detail page discards `awaiting_ecosystem_id`
  (`discover.py:936-937` vs `CollaborationDetail.tsx:92-97`) and the button never changes (review-extended item 16, still open).
- **D8. No assistant parity.** No tool posts, finds, responds to or closes a share/need, or touches
  collaborations (`BE/agent/governance_tools.py`, `BE/mcp_server.py`: no matches), while the Discover page
  prompt tells the model to help with exactly that (`BE/agent/system_prompt.py:440`).
- **D9. A match cannot become a collaboration across ecosystems.** The target select offers only the caller's
  domains (`CollaborationForm.tsx:29,140-142`); nothing links the post (`discover.py:1143-1153`).

**MEDIUM**

- **D10. Author dead ends and UI that promises what the API refuses.** Status table is any->any (`discover.py:660`).
  Me lists only active public posts (`profiles.py:265-267`), so a fulfilled, withdrawn or `ecosystem` post
  vanishes from its author's view and can never be reopened by them. DomainDetail shows fulfil/withdraw/delete
  by global profile (`DomainDetail.tsx:509-522`; `FE/hooks/useRoleAccess.tsx:148-151`) on everyone's posts
  (server 403s non-authors, `discover.py:492-496`), and hides "Add" from members without a profile
  (`useRoleAccess.tsx:184-187`) although the API allows them.
- **D11. Category vocabulary drift.** DomainDetail sends `skill`/`resource` (`DomainDetail.tsx:442-443`); the
  canonical list is `skills`/`resources` (`sharesneeds-vocab.ts:3-13`); the server accepts any string
  (`discover.py:756-761`). Study DB: 12 rows outside the vocabulary.
- **D12. Exited authors' posts stay live.** `exit.py:217-226` does not touch them; Discover does not check the
  author (`discover.py:265-292`); nobody but a profile admin can close them.
- **D13. Stale posts.** No age on cards, no check-in, no review (framework: `resource-request/SKILL.md:81`).
- **D14. Collaboration reads leak.** Any signed-in user lists any status (`discover.py:970-974`) and reads terms
  and ecosystem names of collaborations involving private ecosystems (`:1040-1074`); propose accepts any
  target domain id (`:1122-1127`).
- **D15. Activation races.** The collaboration row is not locked (`discover.py:847`); `FOR UPDATE` on a missing
  approval row locks nothing (`:885-888`), so two first approvals from one ecosystem hit
  `uq_collaboration_approval_ecosystem` (IntegrityError, 500), and two sides approving at once each see one
  approval and leave it `proposed`.
- **D16. `propose_collaboration` input handling.** Non-dict body, non-string ids or tier raise 500 (only
  `ValueError` caught, `discover.py:1098-1104`, `.strip()` on non-strings); title length unchecked
  (String(255) -> DB error); description and terms unbounded; source == target accepted.

**LOW**

- **D17.** Activate's partial payload is written over the detail cache (`FE/hooks/use-discover.ts:51`): title and
  tier blank until the refetch.
- **D18. Accessibility.** DomainDetail icon buttons have only `title` (`DomainDetail.tsx:510,515,520`; contract
  `FE/AGENTS.md:41`); its inline Labels are not tied to controls (`:428-465`); every card's "Use"/"Serve" has the
  same name (`SharesNeedsList.tsx:192-199`); CollaborationForm errors not linked (`CollaborationForm.tsx:112,129,145`);
  the domain path row does not wrap at 390 px (`CollaborationDetail.tsx:101-114`); SharesNeedsForm hand-rolls
  validation instead of `useRequiredFields` (`SharesNeedsForm.tsx:46-67`).
- **D19. Copy.** `expired` tone for a state that never exists (`SharesNeedsList.tsx:25`); "Network-wide" fallback
  (`:182`); "All statuses" shows active only (`CollaborationsList.tsx:44` vs `discover.py:972-974`); Dashboard
  share/need counts include closed posts (`Dashboard.tsx:347-349`); `confirm()` deletes (`DomainDetail.tsx:211`,
  AdminPanel `:1781`).
- **D20.** The ecosystem list serves pending and exited rows every post incl. private/withdrawn
  (`ecosystems.py:71`, `caller_in` any status).
- **D21.** No duplicate guard on create (`discover.py:806-820`); only the client disables the button.
- **D22. Contract drift.** Hand-built JSON errors (`discover.py:475-496,501-536`); `admin_list` without
  `@authenticated` (`:342-343`); pending creator gets "You are not a member" instead of `CONSENT_PENDING`
  (`:777-778`; rule `BE/api/AGENTS.md:54-60`).
- **D23.** Admin PUT can move a non-active post to a mismatched or non-existent ecosystem/domain (gate only
  runs for `active`, `discover.py:565-566,619-622`; bad id -> FK 500).

## 5. Ranked changes (max 10)

Bar: no matching engine, marketplace, notification service or cron. Every rule is a `policy` predicate
fed a `caller_in` row; REST, MCP and chat call one service function (the `emergency.py` / `act_gates` shape).
One additive migration covers C1, C4 and C6 columns.

1. **C1. One exchange authority rule, per ecosystem, recorded (D1, D4, D10 server, D22, D23).** Effort M.
   `policy.can_manage_publication(member, record)`: the author (`member.id == record.author_member_id`), or
   `is_steward_in(member, record.ecosystem_id)`; legacy null author -> stewards only (same rule as proposals).
   Profile admins count only through `is_profile_admin(caller_in(..., record.ecosystem_id))`. A non-author's
   status change needs `reason` (400 `REASON_REQUIRED`). Columns `status_reason`, `status_changed_by_member_id`,
   `status_changed_at`. Moderation list = posts in ecosystems where the caller is a steward
   (`restrict_to_ecosystems`). Admin may not change `ecosystem_id`/`domain_id`. Payloads add `caller_can_manage`.
   Files: `BE/api/discover.py`, `BE/api/policy.py` (# EX), migration, `FE/pages/AdminPanel.tsx` (shares tab),
   `FE/pages/governance/domains/DomainDetail.tsx` (buttons by `caller_can_manage`). Test: actor x action table
   through the blueprint (author, member, steward there, steward elsewhere, founder of another ecosystem, exited
   author) x (edit, status, delete, moderation list); founder-elsewhere gets 404/403; flip `T/test_profiles.py:245-310`.
2. **C2. A recorded response that reaches the poster (D2, D7 part).** Effort M. `POST /discover/shares-needs/:id/respond
   {message}`: load with the visibility rule (404 outside it); 409 `OWN_POST`, `POST_CLOSED` (with status),
   `AUTHOR_INACTIVE`; 403 `CONSENT_PENDING` for a caller active nowhere. Find-or-create a DM between the
   responder's active row (the post's ecosystem if they have one, else their default active row) and the author's
   row, tagged `ConversationLink(entity_type="share_need", entity_id=post.id)`, then append the message.
   Idempotent per (post, responder): a second call reuses the linked conversation. List adds `author_name`,
   domain `display_name`, `created_at` age, `caller_is_author`, `caller_has_responded`. Card: "Offer help" (need) /
   "Ask for this" (share) with a required message (`useRequiredFields`), then a link to the conversation; the
   private note moves behind "Track privately". Files: `discover.py` (or `BE/services/exchange.py`),
   `FE/pages/discover/SharesNeedsList.tsx`, new `FE/pages/discover/RespondDialog.tsx`. Test: an Oasis member
   responds to an OmniOne need -> 201; the author's `GET /messaging/conversations` lists it with unread 1; a repeat
   reuses it; withdrawn post 409; own post 409; outsider on an `ecosystem` post 404.
3. **C3. Visibility that means what it says, plus a detail read (D3, D20).** Effort S-M. One predicate
   `visible_publications(stmt, caller)`: `public` = any signed-in member; `ecosystem` = active members there;
   third value per owner Q4. Discover, domain list, ecosystem list and the new `GET /discover/shares-needs/:id`
   all use it (`get_scoped_or_404`-style: invisible = 404). Ecosystem list requires an active row. Form: one line
   of help per option, toast says where it is listed, DomainDetail uses the API values. Test: visibility x actor table
   (same-ecosystem member, other-ecosystem member, domain participant, pending) -> listed / 404.
4. **C4. A status table and the author's own controls (D10, D12).** Effort M. `PUBLICATION_MOVES`:
   active -> fulfilled | withdrawn; fulfilled -> active; withdrawn -> active; moderator `removed` -> active
   (steward). 409 with `allowed`. `fulfilled` takes optional `fulfilled_by_member_id` (must be a responder from C2)
   and `note`; column `fulfilled_by_member_id`. `GET /profiles/me` lists the author's posts in every status and
   visibility (public profile unchanged) with Mark fulfilled / Withdraw / Reopen / Edit from `allowed_next`.
   Exit completion withdraws the leaver's open posts in the same transaction (reason "author left";
   `exit.py:_mark_exited`). Test: author fulfils naming a responder -> stored and shown; reopen works; a move
   outside the table 409; exit completion leaves no active post by the leaver.
5. **C5. Next steps for the exchange (D7, D13).** Effort M. Append to `services/next_steps.py` (# EX), computed from
   state: author "N people answered <title>" (linked conversations with unread for the author, link to the
   conversation); author "Still open? <title>" at `STALE_AFTER_DAYS` (90) since creation or last reopen;
   stewards of the awaited ecosystem "Approve collaboration <title>"; stewards of both sides "Review <title>"
   once `review_date` passes. Test (injected `Clock`): day 89 none, day 91 item; target steward sees approve item,
   plain member does not; item disappears after approval.
6. **C6. Collaboration approvals, end and review (D5, D6, D14, D15, D16, D17).** Effort M (prior plan L5).
   `policy.can_approve_collaboration(member, ecosystem_id)` (owner Q1 default: active steward there; same-ecosystem:
   a steward who did not propose it). Body `ecosystem_id` names the side (400 when ambiguous or not allowed).
   Lock the collaboration row `FOR UPDATE` first; refuse source == target domain; validate types and lengths.
   GET adds `approvals [{ecosystem_name, approved_by, approved_at}]`, `awaiting`, `caller_can_approve_for`,
   `caller_can_end`, `linked_publications`. `POST /collaborations/:id/end {outcome: completed|dissolved, reason}`
   (steward of either side; a proposed one ends as dissolved = withdraw/decline). Propose takes optional
   `review_date`; activation defaults it to start + 365 days. Columns `proposed_by_member_id`,
   `ended_by_member_id`, `end_reason`, `ended_at`. Reads: proposed collaborations visible to members of either
   side only. UI: "Approve for <ecosystem>", "Waiting on <ecosystem>", End dialog with reason; merge, not
   replace, in `use-discover.ts:51`. Test: A's steward approves -> "waiting on B"; plain member 403; B approves ->
   active with review_date; A ends with reason -> dissolved; concurrent approvals end active (threads on PG).
7. **C7. Turn a post into a collaboration (D9).** Effort S. Card action "Propose collaboration" ->
   `/discover/collaborations/new?from=<id>`: the form reads the post (C3 detail), fixes the target to the post's
   domain (read-only, names its ecosystem), source = caller's domains; API takes `linked_share_need_id`, checks it
   is active and visible, stores `linked_shares_needs`. Test: proposal from a visible OmniOne need stores the link
   and the detail returns it; a withdrawn or invisible post 409/404.
8. **C8. Validation and vocabulary (D11, D16, D21, D23).** Effort S. Server checks `category` against one list
   (mirrors `sharesneeds-vocab.ts`); data revision maps `skill`->`skills`, `resource`->`resources`, `''`->NULL;
   DomainDetail uses `SHARESNEEDS_CATEGORY_OPTIONS`. Duplicate guard: same author + type + title + domain while
   active -> 409 `DUPLICATE_POST` with `existing_id`. Test: one table-driven 400 test; duplicate 409; revision test.
9. **C9. Assistant parity (D8).** Effort M. Tools calling the same service functions: `find_shares_needs`
   (visibility rule), `publish_share_need` (caller row, same gates), `respond_to_share_need` (C2),
   `update_share_need_status` (C1 + C4; a steward's removal needs confirmation), `approve_collaboration` /
   `end_collaboration` (C6, confirmation for end). Add to `CALLER_SCOPED_TOOLS` and the `BE/api/AGENTS.md` table.
   Test: a parity script like `T/test_uxqa_p1_mcp_parity.py`: the same moves allowed and refused on REST and chat.
10. **C10. Front-end clean-up (D17-D19).** Effort S. `aria-label`s on icon buttons, Labels tied to controls,
    per-card accessible names ("Offer help: <title>"), drop `expired`, active-only Dashboard counts, list error
    through `QueryState` with Retry, "All statuses" sends `status=all` (server: all the caller may read), wrap the
    domain path, `AlertDialog` instead of `confirm()`. Test: node:test for a pure `FE/lib/exchange.ts` (status move
    labels, visibility copy); a uxqa regression flow for respond -> author sees unread.

## 6. Owner questions

| # | Question | Recommended default | Reversal cost |
|---|---|---|---|
| Q1 | Who approves a collaboration for an ecosystem? | An active steward (mod+) there; same-ecosystem: a steward who did not propose it (like ratification) | one predicate in `policy.py` |
| Q2 | Who may close someone else's post? | Only an ecosystem steward, with a recorded reason; responders never | one predicate |
| Q3 | Should posts expire? | No auto-expiry; at 90 days the author gets "Still open?"; cards show age | one constant |
| Q4 | What is the third visibility (API `private`, UI "Domain Only")? | `domain` = the domain's participants plus ecosystem stewards; retire `private` (0 rows in study DB) | enum value + one filter branch |
| Q5 | Moderation: hide or hard delete? | Hide (`removed`, reason, author and stewards still see it, a steward can restore); hard delete only by the author on a post nobody has answered | high if hard delete is chosen (data gone) |
| Q6 | Do exited members' open posts close automatically? | Yes, withdrawn with reason "author left" | one line |
| Q7 | Who may propose a collaboration (framework: outbound authorization)? | Any active member proposes; the source side counts as approved only when a source steward approves (auto-recorded if the proposer is one) | one predicate |
| Q8 | Should signed-out visitors see public posts? | No (today: 401 everywhere) | a public route; low |

## 7. Proposed lane file ownership (builder lane `EX`)

Owned outright:
- `BE/api/discover.py`; new `BE/services/exchange.py` (visibility predicate, `PUBLICATION_MOVES`, respond, approve/end);
  `BE/db/models/sharesneeds.py`, `collaboration.py`; one new alembic revision (+ data revision for categories);
  the shares-needs blocks only of `BE/api/domains.py:588-645` and `BE/api/ecosystems.py:579-640`;
  the publications query in `BE/api/profiles.py:259-300` (own-profile branch);
  new `T/test_exchange_flows.py`; the publication test in `T/test_profiles.py:245-310`.
- `FE/pages/discover/*` (new `RespondDialog.tsx`); `FE/hooks/use-discover.ts`; `FE/lib/sharesneeds-vocab.ts`;
  new `FE/lib/exchange.ts` + test; the shares-needs section of `FE/pages/governance/domains/DomainDetail.tsx`
  (handlers `:140-213`, card `:410-532`); `PublicationActions` in `FE/pages/Profile.tsx:114-290`; the shares tab of
  `FE/pages/AdminPanel.tsx` (`:338-354`, `:1584-1860`); `FE/pages/Dashboard.tsx:347-349`.
- New `uxqa/regression/<id>.mjs` for respond -> unread.

Append-only under `# EX` / `// EX`:
- `BE/api/policy.py` (`can_manage_publication`, `can_see_publication`, `can_approve_collaboration`, `can_end_collaboration`);
  `BE/services/next_steps.py` (share_need and collaboration items, `_KIND_ORDER` entries);
  `BE/api/exit.py` (one call in `_mark_exited`); `BE/agent/governance_tools.py` and `BE/mcp_server.py` (C9 tools);
  `FE/lib/api-client.ts`, `FE/types/api.ts`, `FE/lib/query-keys.ts` (`affects.sharesNeeds` += conversations, nextSteps;
  `affects.collaborations` += nextSteps); `BE/api/AGENTS.md` and `FE/AGENTS.md` new "Exchange" sections.

## 8. Explicitly rejected

- A matching engine or "suggested matches" (needs <-> shares scoring).
- Marketplace features: prices, bids, ratings, reputation, escrow.
- A notification service, email or push for responses: the bell (`next_steps`) and messaging unread are enough.
- A cron that expires posts or proposed collaborations: check-ins are computed from state.
- A new responses/comments table or threads on posts: `ConversationLink` + existing messaging.
- The full cross-ethos-request workflow (7-day acknowledgement timers, request ids, per-request ACT rounds) and
  shared-resource stewardship rotation / commons monitoring (review-extended MISSING rows): later, on top of C6.
- Member-filed abuse reports and a moderation queue: stewards remove with a reason (C1/C4); revisit at the first
  real abuse case.
- Pre-publication approval of posts, or routing posts through ACT.

## Tests today (checklist 9)

Covered: author-only manage helper as a unit test (`T/test_profiles.py:245-310`, asserts the D1 hole); profile
publications are active+public only (`T/test_profiles.py:~184-241`); admin stats (`T/test_profiles.py:70`);
ecosystem shares list 403/404 for outsiders (`T/test_groups_handlers.py:171-181`); junk pagination
(`T/test_groups_handlers.py:219-220`); Playwright edit+withdraw from Me and nav gating
(`uxqa/regression/p2-gold-propose-share-signup-1.mjs`, `-2.mjs`); client `discover-tabs.test.ts`.
No blueprint flow test for: create (participation and consent gates), Discover visibility, status moves, delete,
moderation list scope, any collaboration route (propose, approve, activate, race). No assistant or agent-eval
task for the exchange.
