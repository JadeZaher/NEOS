---
type: Craft Plan
title: Single sources of truth for NEOS user flows
description: Ranked refactors that remove the duplication behind pass-01 defects; lanes, file ownership and order.
timestamp: "2026-10-31"
source: architecture survey after pass 01-first-week (synthesis.md findings F01-F20)
---

# Craft plan: own the knowledge once

The seeds already exist and are under-used: `services/act_gates.py` (ACT gate
engine), `auth/ecosystem_scope.py` `EcosystemScope`, `apiFetch`/`ApiFetchError`,
`LoadingState`/`EmptyState`, `_domain_detail_payload` (`api/domains.py:178`).
Every surface re-derives the same shapes and the copies drift. Pass-01 defects
F01, F05, F07, F10, F17 and the F02 class trace to three drifts: hand-typed
query keys and invalidation lists, mutations with no shared feedback path, and
ACT/authorization rules encoded in many places. Each fix below is **one source
of truth plus a dependency map**.

## Frontend (charting-the-course/client/src)

| Id | Abstraction | Evidence (survey counts) | Removes |
|---|---|---|---|
| FE1 | `lib/query-keys.ts`: `keys.<entity>.{all,list,detail}` factory, `affects.<entity>` invalidation map, `ecosystemScoped` switch list | 243 inline `queryKey: [...]` in 36 files; shares/needs under 4 roots (`shares-needs`, `shares-needs-admin`, `ecosystem-shares-needs`, `discover`); dashboard queue never invalidated; `EcosystemContext.tsx:55-68` hand-lists 14 roots, misses 4 | stale UI after mutations (F05, F17, F01 queue) |
| FE2 | `hooks/use-api-mutation.ts`: `useApiMutation({ mutationFn, invalidates, success, error, silent })`, toasts on error unless silent, reads `ApiFetchError`; `announceActOutcome(data)` in `lib/proposal-vocab.ts` | 96 `useMutation`, the 58 in hooks have 0 `onError`; `AdminPanel.tsx` repeats invalidate+toast 21x; 44 `(err as Error).message`; consent/test handlers ignore `auto_transitions` (`ProposalDetail.tsx:313-323, 464-472`) | silent outcomes (F07, F10), FE half of F01 |
| FE3 | `components/QueryState.tsx`: loading -> error (`role=alert` + Retry) -> empty -> render-prop children | 77 `isLoading ?` branches / 61 files, 12+ "Failed to load" strings, `EmptyState` used in 2 files; order hand-fixed once in `OrientationJourney.tsx:167-187` | error shown as empty (F02, F16) |
| FE4 | `hooks/use-required-fields.ts` + `<FieldError>`: validate, focus first invalid, `aria-invalid`/`aria-describedby`, `role=alert` | 15 silent `if (!x.trim()) return;` guards (`ProposalDetail.tsx:462`, `OnboardingCeremony.tsx:129`, `DomainDetail.tsx:176,195`, `EcosystemDetail.tsx:171,190,228`) | F10, F07 for forms |
| FE5 | One permission source: delete `hooks/useRoleAccess.tsx` (duplicate of `usePermissions.tsx:38-49`, `RequirePermission` has 0 users); resource buttons read server `caller_can_*` | `DomainDetail.tsx:430,517-527` gates on global profile while the server decides per ecosystem | buttons that 403 / hidden steward work |

Do not: derive keys from URLs (delete the unused `getQueryFn` join and `apiRequest` in `lib/queryClient.ts:31-32`), wrap `useQuery`, adopt react-hook-form, build a `<Can>` DSL.

## Backend (neos-operating-system/agent/src/neos_agent)

| Id | Abstraction | Evidence | Removes |
|---|---|---|---|
| BE1 | `api/guards.py` `@authenticated` (auth only; handler reads `request.ctx.member`), `caller_in(session, request, ecosystem_id) -> Member \| None`; `api/policy.py` `is_steward`, `can_manage_proposal`, `can_edit_domain` over `ROLE_RANK` | 140 `member, err = require_auth(request)`; caller lookup copied as `_caller_member` (`proposals.py:87`), `_member_in_ecosystem` (`domains.py:89`), `helpers.py:50-56`, 31 inline; steward checks inline + a separate matrix `members.py:547-559` | inconsistent authz; **latent: `main.py:324-327` loads `request.ctx.member` with `.limit(1)` and no ORDER BY, then `orientation.py:350,400,445` and `ethos_access.py:64-96` use it per ecosystem** |
| BE2 | `api/errors.py` `ApiError(status, message, extra)` + `register_api_errors(app)`; `get_scoped_or_404(session, request, model, id, *, options, label)`; `parse_pagination(request, default=25, cap=100)`; fail-closed `EcosystemScope.filter` | 118 `status=404` in 28 files; 59 `if eco_ids:` fail-open checks; 46 unguarded `int(request.args.get(...))` (`?page=abc` -> 500); per_page drift 20 vs 25 | 500s on junk input, fail-open scoping |
| BE3 | Declarative ACT lifecycle in `services/act_gates.py`: `Lifecycle` table, `transition_proposal(session, proposal, *, to, caller) -> ActOutcome` (validate, gate, cascade, `on_transition` hook), `ActOutcome.attach(payload)`; `_proposal_detail_payload` mirroring domains | lifecycle encoded 7x (`proposals.py:69,643`, `act_gates.py:216-226`, `agreements.py:304`, `mcp_server.py:202,812-831` with different rules, `proposal-vocab.ts:33,43`); 14 `maybe_auto_advance_*` call sites; outcome attached by hand 4x | F01 hook point, API/MCP rule divergence |

Do not: raise Sanic `NotFound` (its handler `main.py:416-420` flattens messages and redirects non-API paths); build a repository/CRUD layer or a generic serializer factory; share the proposal and agreement tables (agreements have review/sunset); build notifications inside BE3.

## Lanes and order

1. **Wave 0, contracts** (new modules, no call-site migration): FE contracts (`query-keys.ts`, `use-api-mutation.ts`, `QueryState.tsx`, `use-required-fields.ts`, plus the consent-gate route guard for ledger `p1-coord-consent-gate-guard`: a pure `lib/consent-gate.ts` decision with a node:test, used by `AppLayout` in `App.tsx`) and BE contracts (`guards.py`, `policy.py`, `errors.py` + registration in `main.py`, `parse_pagination`, `EcosystemScope.filter`, `Lifecycle`/`ActOutcome` types, the `main.py` ORDER BY fix).
2. **Wave 1, migration, disjoint files in parallel:**
   - FE-A (FE1+FE2): `hooks/*`, `contexts/EcosystemContext.tsx`, `lib/proposal-vocab.ts`, `ProposalDetail.tsx`, `DomainDetail.tsx`, `Profile.tsx`, `AdminPanel.tsx`, `QuizManagement.tsx`, `UserManagement.tsx`, `UserQuizHistory.tsx`, remaining inline-key pages not owned by FE-B.
   - FE-B (FE3 + inline keys in its files): `Dashboard.tsx`, `OrientationJourney.tsx`, `OrientationComplete.tsx`, `ProposalList.tsx`, `DomainList.tsx`, `DiscoverHub.tsx`, `messaging/MessagingLayout.tsx`.
   - BE-ACT (BE3 + BE1/BE2 in its files): `api/proposals.py`, `api/agreements.py`, `mcp_server.py`, `services/act_gates.py`, `agent/governance_tools.py`. Owns ledger `p1-coord-chat-tool-authz`: every state-changing assistant tool (`create_decision_record`, `update_agreement_status`, `record_consent_position`, `create_ecosystem`, `declare_emergency`, and any other mutating tool) joins `CALLER_SCOPED_TOOLS` and calls the same `policy.py` rule as its REST handler; extend the API/MCP parity table to chat.
   - BE-Groups (BE1/BE2): `api/domains.py`, `api/discover.py`, `api/members.py`, `api/ecosystems.py`.
   - BE-Journey (BE1/BE2 + multi-ecosystem progress test): `api/orientation.py`, `api/ethos_access.py`, `api/messaging.py`, `api/onboarding.py`.
3. **Wave 2:** FE4 then FE5 (share `EcosystemDetail.tsx`, follow FE-A on `DomainDetail.tsx`); mechanical BE1/BE2 sweep of the remaining handler files (and the 11 `_escape_like` copies).

Tests: backend flows through the Sanic test client (actor -> status tables in `tests/test_uxqa_p1_governance.py`, API/MCP parity table for ACT moves, cross-ecosystem 404, `?page=abc` -> 400, two-ecosystem journey progress); frontend via `npm run check` and the uxqa gold + regression flows.

## Rejected

Route-guard table for `App.tsx` (cosmetic; F20 is a one-line `?redirect=` fix), messaging start abstraction (exists), generic serializer factory, notification bus (feature, F04), react-hook-form adoption, repository layer.
