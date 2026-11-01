---
type: Governance Extension Plan
title: "Wave C: ironclad onboarding, exchange, maintenance and health"
timestamp: "2026-11-01"
sources: governance/review-onboarding.md, governance/review-exchange.md, governance/review-maintenance.md
---

# Wave C: make onboarding, shares/needs and maintenance ironclad; put governance health in place

Owner (2026-11-01): "the maintenance and governance health work needs to be in place; the onboarding and shares
and needs management needs to be ironclad". Same bar as the G-wave (`plan.md`): the smallest change that makes a
flow complete, safe and understandable; no new subsystems (no matching engine, scheduler, rules engine,
notification service, invite system). Build on the contracts: `policy`, `caller_in`, `ApiError`,
`get_scoped_or_404`, `restrict_to_ecosystems`, `parse_pagination`, the `Lifecycle` tables, `services/next_steps`,
`useApiMutation`, `QueryState`, `keys`.

## Owner decisions (2026-11-01, asked)

| Question | Decision |
|---|---|
| Platform admin | A co_creator/builder profile counts platform-wide only on the caller's member row in the home ecosystem (`SIGNUP_DEFAULT_ECOSYSTEM_SLUG`, else slug `omnione`). Founding an ecosystem makes you its administrator there, nothing more. Everything about a resource reads the caller's row in that resource's ecosystem (`caller_in`). |
| Newcomers | No steward approval. Consenting to the membership agreement(s) is what makes a member active; the six-section ceremony becomes read-only history. Stewards see newcomers waiting and step in only when someone is stuck. |
| Exchange governance | A steward of each ecosystem approves a collaboration for their side (same-ecosystem: a steward who did not propose it). Moderators (stewards of the post's ecosystem) hide a post with a recorded reason, restorable; only the author hard-deletes, and only a post nobody has answered. |
| Health audit | The auditor is not a steward of the audited ecosystem; if the ecosystem has no other active member a steward may record it, labelled "self-assessment". |

## Defaults taken without asking (one constant each; listed for the owner)

- Onboarding: private ecosystems are not self-service (join and sign-up answer 404); a member who left returns when the latest `ExitRecord.re_entry_eligible` allows (same row, back to `pending_consent`, or `active` when no gate); no steward "decline" (a newcomer can withdraw their own request; incompatibility goes through a conflict case); withdrawing consent to a membership agreement still demotes to pending, with a confirm naming what is lost.
- Exchange: posts never auto-expire, the author gets "Still open?" at 90 days and cards show age; the third visibility is `domain` (the domain's participants plus the ecosystem's stewards; `private` retired); an exited member's open posts are withdrawn with reason "author left"; any active member proposes a collaboration (the source side counts as approved only when a source steward approves, auto-recorded when the proposer is one); signed-out visitors see no posts; moderation is per ecosystem (a platform admin is not a steward of other ecosystems).
- Maintenance and health: a date-only due date passes when that day has ended everywhere on Earth (UTC-12, "anywhere on earth"), computed by the server only; agreement review notices go to admins/owners from 14 days before, and the registry shows "Review overdue" to everyone after the date (overdue never invalidates an agreement); ending a review: renew writes a `ReviewRecord` with findings and the next review date (per-type default), sunset sets `sunset_date` = today + 60 days and archiving becomes an admin item after it; only `critical` indicators raise a steward queue item (warnings show on the page); stalled proposals and waiting newcomers appear as counts with links in the health snapshot, not queue items; publishing an audit freezes every computable indicator (GHI-03 may stay "not computable yet").

## Lanes (parallel, opus, disjoint files)

| Lane | Review | Scope |
|---|---|---|
| G-Authority | exchange D1, onboarding H3, this file | The platform-admin rule (decision 1); every `helpers.require_admin` call site reads it; per-ecosystem resources use `caller_in` + `policy` instead. |
| G-Onboard | `review-onboarding.md` §4 changes 1-10 | Steward-only onboarding content, `place_member`, closed member-move table, newcomer queue items, gate copy, assistant parity. |
| G-Exchange | `review-exchange.md` §5 C1-C10 | Per-ecosystem moderation with reasons, respond route, one visibility rule + detail read, status table + author controls, collaboration approvals/end/review date, next-step items, validation + category data fix, assistant parity, a11y/copy. |
| G-Maint | `review-maintenance.md` §5 C1-C10 | Review outcomes with `ReviewRecord`, rollback limits, review-due items, ONE date rule (+ DB session pinned to UTC), health snapshot service + endpoint, auditor independence, audit-due/critical items, members see results, compliance stops inventing scores and leaking, domain steward/status changes recorded. |

### File ownership

Owned outright (only the owner edits):

- **G-Authority:** `api/helpers.py` (`require_admin`), `main.py` (request middleware: compute the flag once per request), `api/settings.py`, `api/teams.py`, `api/badges.py`, `api/ctc_handoff.py`; in `api/members.py` ONLY the profile-grant handler (`PUT /members/:id/profile-grant`); FE: the admin-gating lines of `components/AppSidebar.tsx` and the route-level guard of `pages/AdminPanel.tsx`; tests `T/test_platform_admin.py`.
- **G-Onboard:** `api/onboarding.py`, `api/orientation.py`, `api/ethos_access.py`, `api/quiz_assignments.py`, `api/auth.py` (`create_signup_member`, `pending_consent_gates`, `api_me`), `api/quizzes.py` (`submit_quiz`), `api/ecosystems.py` (join, quiz assign/unassign/results handlers), `api/members.py` (status move, resend, create, list handlers), new `services/member_lifecycle.py`, the two call sites in `api/agreements.py` (activation/demotion, call-site edits only); FE per `review-onboarding.md` §6 (consent gate, orientation gate, Login, AuthContext, onboarding pages, MemberDetail/MemberList, EcosystemDetail/EcosystemList, UserManagement resend button, `hooks/use-onboarding.ts`, delete `QuizzesOnboardingHub.tsx` + its `App.tsx` route line); tests `T/test_onboarding_*.py`.
- **G-Exchange:** `api/discover.py`, new `services/exchange.py`, `db/models/sharesneeds.py`, `db/models/collaboration.py`, `db/models/collaborationapproval.py`, `api/messaging.py` (only the new respond hook-up, if the respond route needs a helper there), the shares-needs blocks of `api/domains.py` and `api/ecosystems.py`, the publications query in `api/profiles.py`, one call in `api/exit.py` `_mark_exited`; FE `pages/discover/*`, `hooks/use-discover.ts`, `lib/sharesneeds-vocab.ts`, new `lib/exchange.ts` (+test), the shares-needs section of `pages/governance/domains/DomainDetail.tsx`, `PublicationActions` in `pages/Profile.tsx`, the shares tab of `pages/AdminPanel.tsx`; tests `T/test_exchange_*.py` and the publication test in `T/test_profiles.py`.
- **G-Maint:** new `services/health.py`, new `services/dates.py`, `api/safeguards.py`, `api/schemas/safeguards.py`, `api/compliance.py`, `views/safeguards.py`, `api/agreements.py` (except G-Onboard's two call sites), `api/schemas/agreements.py`, `api/agreement_vocabulary.py`, `api/domains.py` (except the shares-needs block), `api/schemas/domains.py`, `db/session.py`, `services/cron.py` (delete only the log-only `_check_deadlines` / `_check_compliance_regen`), call sites of `proposal_next_moves(today=...)` in `api/proposals.py`; FE `pages/governance/safeguards/*`, `components/governance/safeguards/*`, `pages/compliance/ComplianceDashboard.tsx`, `pages/governance/agreements/AgreementDetail.tsx` / `AgreementHistory.tsx` / `AgreementList.tsx`, new `components/governance/agreements/AgreementReviewDialog.tsx`, new `hooks/use-health.ts`, new `lib/health.ts` (+test), `lib/next-steps.ts` (+test) and `components/NotificationCenter.tsx` (due/overdue rendering), the safeguards line of `components/AppSidebar.tsx`; tests `T/test_g_health.py`.

Shared, append-only under a `# <lane>` / `// <lane>` header (never edit another lane's section):

- `api/policy.py`, `client/src/lib/api-client.ts`, `client/src/types/api.ts`, `client/src/lib/query-keys.ts` (keep the invariants test green), `agent/governance_tools.py`, `mcp_server.py`, `api/AGENTS.md`, `client/src/AGENTS.md`, `services/AGENTS.md`.
- `services/next_steps.py`: add queue items ONLY through the registry the coordinator added: in your own section at the end of the file, `@item_source(("<kind>", <order>))` on `async def <name>(session, scope: QueueScope) -> list[dict]` (build items with `_item`). `waiting_for` calls every source; do not edit it. G-Maint alone may edit `Clock`, the agreement/audit queries and `EXPLAIN_KINDS` / `_EXPLAINERS` / `OWNER_ACTIONS` in place (list those edits in the report).
- `pages/Dashboard.tsx`: line-level edits only in your own feature's lines (G-Exchange shares lines, G-Onboard newcomer ordering, G-Maint due-date lines).
- In-place edits to existing assistant tools: G-Maint (`update_agreement_status` findings/next review date, `create_safeguard_audit` drops the score and uses the auditor rule). Everyone else appends.

Use the Edit tool for shared and block-split files (never rewrite a whole file another lane also edits) and re-read before editing.

Interfaces between lanes (code against these names):

- `request.ctx.platform_admin: bool`, set by G-Authority's middleware; read as `getattr(request.ctx, "platform_admin", False)`. G-Onboard returns it from `/auth/me` as `is_platform_admin` (and the client `AuthUser` type gains it).
- `services/dates.py` (G-Maint) owns the date rule; until it lands, other lanes compare dates through `QueueScope.clock` (`clock.past(...)`, `clock.today`), which G-Maint switches to the rule.

### Migrations (reserved, chained, single head)

`r6c1e8a4f2d7` -> `s3e8b1d7c4a2` (G-Exchange) -> `t5a9c2e6f1d8` (G-Onboard; may stay empty) -> `u7d2f4b8a3c6` (G-Maint). Fill only your own `upgrade()` / `downgrade()`; inspect before alter; data revisions per `alembic/AGENTS.md` "Data revisions" (SQLite and a disposable PostgreSQL DB on 127.0.0.1:5433 that you create and drop).

## Rules for every lane

- Read: this file, your review (all of it), `plan.md` (owner decisions), the contracts (`charting-the-course/client/src/AGENTS.md`, `neos-operating-system/agent/src/neos_agent/api/AGENTS.md`, `agent/src/neos_agent/services/AGENTS.md`, `agent/alembic/AGENTS.md`).
- Every authority rule: server-side, one predicate in `policy.py`, an actor x action table test through the real blueprints that would go red if the rule were flipped; each owner decision above has such a test.
- Plain-language copy; every new button has a state, an error (one per failure, not toast + inline) and a confirmation for destructive or irreversible acts; 390px and keyboard work.
- Tests model real flows through the real blueprints (`agent/tests/`), assert observable outcomes (responses, rows); node:test for pure frontend logic; no tautologies (skill `flow-tests`).
- No git add/commit/stash/checkout/reset/push. Never read `neos-operating-system/agent/.env`; never contact `*.rlwy.net`; never print `uxqa/.secrets/*`. Backend tests: `DATABASE_URL=sqlite+aiosqlite://` and `py` (never `python3`). Do not restart the study API on :8000 or touch the `neos_uxqa` database.
- Docs: one-line doc-comments in code; rationale in the directory `AGENTS.md` under your lane's section.
- Verify once at the end: your targeted backend tests, the migration test on PostgreSQL if you wrote a data revision, `npm run check` and `npm test` in `charting-the-course` (errors in files you do not own are another lane's in-flight work: report, never fix). Report exact commands with result lines, files changed, behaviour changes, in-place edits to shared files, and hand-offs.

## Deferred (named, not dropped)

- App-wide `Z` on API datetimes (craft wave 2): after G-Maint pins the DB session to UTC.
- Notifications and messaging rows keyed on the default member row (craft wave 2), except what the respond route needs.
- Invites into private ecosystems; resource-concentration indicator GHI-03 (no resource records).

## Fix wave (after the adversarial reviews, 2026-11-01)

Reviews: [wave-c-review-authority.md](wave-c-review-authority.md) and [wave-c-review-flows.md](wave-c-review-flows.md),
both REQUEST_CHANGES, no BLOCKER; HIGH A1-A3, F1-F3. Coordinator prep: one "steward of this ecosystem" outside the
ACT engine, `policy.can_administer_ecosystem` (active row there, mod+ or an admin profile ON that row, founders
included); `can_manage_onboarding`, `is_exchange_steward`, `can_record_audit` and `is_self_assessment` now use it
(A5/F8). The ACT engine keeps `is_steward` (mod+).

| Lane | Findings | Files (owned; block-split files say which block) |
|---|---|---|
| FX-Onboard | A1, A2, A3, A6, A8, A9, A11, A12, F4, F12, F15, F16 (REST pending-newcomer queue), sign-up and DID placement prefer the pinned home; FE admin/permission hooks, AuthContext single `isPlatformAdmin`, Newcomers nav for stewards, route-guides copy, dead onboarding hooks | `services/member_lifecycle.py`, `api/exit.py` (role/profile/consent on exit), `api/auth.py`, `auth/routes.py`, `api/quizzes.py`, `api/onboarding.py`, `api/orientation.py`, `api/ecosystems.py` (non-shares blocks), `api/members.py`, `api/profiles.py` (anonymous read), `api/domains.py` quiz assign/unassign block; FE `hooks/usePermissions.tsx`, `hooks/useRoleAccess.tsx`, `contexts/AuthContext.tsx`, `lib/nav-access.ts`, `lib/route-guides.ts`, onboarding pages, AppSidebar Newcomers item |
| FX-Maint | A4, F2, F5, F6, F7, F11, F13, F14, F17, F18, A5/F8 remainder (`services/health.py` independence count, audit audiences), act_gates date lines + under_review->active gate, domain form (steward/status with reason and record; `current_steward` text), KIND_LABELS/NextStepKind for newcomer/share_need/collaboration, `membershipWithdrawalWarning` in AgreementDetail, `governance_tools.py:2427` date, agreements copy | `services/act_gates.py`, `api/agreements.py`, `api/safeguards.py`, `services/health.py`, `api/compliance.py`, `api/conflicts.py` (dates), `api/domains.py` (domain update block), `services/next_steps.py` (G-Maint parts + `_explain_*`), `mcp_server.py` `transition_agreement`; FE agreements pages + `AgreementReviewDialog`, safeguards pages + audit form, DomainForm, `lib/next-steps.ts`, `NotificationCenter.tsx`, `RepairCheckinModal.tsx` |
| FX-Exchange | F1, F3, F9, F10, A10, A13, `?conversation=` in messaging, ModerationPanel at `/discover/moderation` for exchange stewards, EcosystemDetail shares block, dead `useDomainSharesNeeds`, chat display names + system-prompt hints for every wave-C tool, regression flows (`p2-gold-propose-share-signup-1.mjs` updated, a respond -> unread flow) | `services/exchange.py`, `api/discover.py`, `api/messaging.py`, `alembic/versions/s3e8b1d7c4a2_exchange_integrity.py` (undeployed: amend), `services/next_steps.py` G-Exchange section, `api/chat.py`, `agent/system_prompt.py`; FE `pages/discover/*`, messaging pages, `App.tsx` (one route line), AppSidebar Moderation item, EcosystemDetail shares block, `uxqa/regression/*` (written, not run) |

Same rules as the build lanes (shared files append-only or own section; Edit only; no git; one sweep at the end).
OWNER item A7 (production data): before or right after the deploy, list who will be a platform admin.
