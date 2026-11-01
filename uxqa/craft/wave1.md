---
type: Craft Wave Brief
title: Craft wave 1 - migrate call sites onto the wave-0 contracts
timestamp: "2026-10-31"
---

# Wave 1 lanes

Contracts (wave 0) are documented in `charting-the-course/client/src/AGENTS.md`
"Shared data and feedback contracts" and
`neos-operating-system/agent/src/neos_agent/api/AGENTS.md` "Handler contracts".
Read the section for your side before editing.

## Rules for every lane

- Own only your listed files; other lanes edit other files concurrently. No git add/commit/stash/checkout/reset/push; the coordinator commits per lane and pushes main after each green sweep (a push deploys).
- Behaviour-preserving refactor plus the named fixes. Never degrade or remove a feature. Match surrounding idioms, full-word names, terse one-line comments, the why in the directory AGENTS.md.
- Frontend: one key, one response shape (if two call sites share a key they share one queryFn returning the API response untouched; reshape with `select`). Hooks keep their exported signatures. When a hook gains an error toast via `useApiMutation`, remove the now-duplicate page-level error toast in files YOU own and list consumers in other lanes' files in your report. Success toasts only where no consumer already shows one.
- Backend: migrate to `@authenticated`, `caller_in`, `policy.*`, `ApiError`/`get_scoped_or_404`, `parse_pagination`, `EcosystemScope.filter`. Any test app on a bare `Sanic(...)` that mounts a migrated blueprint must call `register_api_errors(app)`. `policy.py` is shared: append only, under a `# <your lane>` section header, never edit existing predicates.
- Tests model real flows through public seams (Sanic asgi client with the real blueprints; node:test on pure frontend logic) and go red if the change were reverted. No tautologies.
- Visibility: a detail load must match its list's visibility (a row shown in a list opens; a row not in the list 404s). Use `get_scoped_or_404`'s explicit scope parameters rather than widening or narrowing silently.
- Safety: never read agent/.env, never contact *.rlwy.net; backend tests only with `DATABASE_URL=sqlite+aiosqlite://`, the `py` launcher.
- Verify once at the end with targeted tests for your files plus typecheck (`npm run check`) for frontend lanes; the coordinator runs the full sweep. Report exact commands with result lines, files changed, and anything handed to wave 2.

## Frontend (charting-the-course/client/src)

**FE-A governance (opus).** Owns: `hooks/use-governance.ts`, `hooks/use-api.ts`, `contexts/EcosystemContext.tsx`, `lib/api-client.ts`, `types/api.ts`, `lib/proposal-vocab.ts`, `pages/governance/**` except `ProposalList.tsx` and `DomainList.tsx`, `components/governance/**`.
- Inline keys -> `keys.*`; mutations -> `useApiMutation` with `affects.*`; `EcosystemContext` refetches `ecosystemScoped` on switch (replacing its hand-listed roots; keep the active-ecosystem default the wave-0 fix added).
- Result types for `submitConsent` / `submitTestReport` carrying `auto_transitions` (like `AdviceSubmitResult`) and `announceActOutcome` on advice, consent and test (F01/F07 frontend half).
- `DomainDetail`: domain shares/needs via `useQuery(keys.sharesNeeds.forDomain(id))` instead of a `useEffect` fetch; its imperative try/toast/loadX blocks move into hooks.
- Call `refreshSession` after agreement consent and ecosystem join (they change `/auth/me`).

**FE-B flow states (sonnet).** Owns: `pages/Dashboard.tsx`, `pages/OrientationJourney.tsx`, `pages/OrientationComplete.tsx`, `pages/governance/proposals/ProposalList.tsx`, `pages/governance/domains/DomainList.tsx`, `pages/discover/DiscoverHub.tsx`, `pages/messaging/MessagingLayout.tsx` (check exact paths).
- Loading/error/empty -> `<QueryState>` (error before empty; Retry); inline keys in these files -> `keys.*`. Do not change mutation feedback in these files beyond keys.

**FE-C people, learning, discover (sonnet).** Owns: `hooks/use-discover.ts`, `hooks/useProfile.ts`, `hooks/use-courses.ts`, `hooks/useBadges.ts`, `hooks/useAchievements.ts`, `hooks/use-messaging.ts`, `hooks/useOrientation.ts`, and every page/component with inline keys or `useMutation` not owned by FE-A or FE-B (AdminPanel, QuizManagement, UserManagement, UserQuizHistory, Profile, PublicProfile, TakeQuiz, discover/* except DiscoverHub, messaging/* except MessagingLayout, non-governance components).
- Same migration; `useAchievements` and survey-style background mutations stay `silent`.
- `TakeQuiz` phantom keys (`my-quiz-results`, `profile-tiles`, `my-profile-data`) removed; `useBadgeDefinitions` gets its real fetch so it can share `keys.badges.list()` with AdminPanel.
- The ecosystem picker component (find it; not under governance/) marks pending-consent ecosystems as "Awaiting your consent" linking to the consent gate instead of offering them as a selectable scope (selecting one silently snaps back to the active default).

All FE lanes: pass whole query results to `QueryState`/`queryStatePhase` (`fetchStatus` is required; use the `idle` prop for search prompts); new mutation behaviour goes in `lib/api-mutation-options.ts` (tested), not the hook.

## Backend (neos-operating-system/agent/src/neos_agent)

**BE-ACT lifecycle + assistant authorization (opus).** Owns: `services/act_gates.py`, `api/proposals.py`, `api/agreements.py`, `mcp_server.py`, `agent/governance_tools.py`, and tests `test_uxqa_p1_governance.py`, `test_uxqa_p1_mcp_parity.py`, `test_agreement_consent.py`, `test_governance_tools.py` (+ new tests).
- BE3: `Lifecycle` table, `transition_proposal(session, proposal, *, to=None, caller) -> ActOutcome`, `ActOutcome.attach(payload)`, `_proposal_detail_payload`; replace the seven encodings; one `on_transition` hook point (no notifications feature). Keep proposal and agreement tables separate.
- Ledger `p1-coord-chat-tool-authz`: every state-changing assistant tool joins `CALLER_SCOPED_TOOLS` and calls the same `policy` predicate as its REST handler; parity table REST / MCP / chat for each ACT move and each of `create_decision_record`, `update_agreement_status`, `record_consent_position`, `create_ecosystem`, `declare_emergency`.
- Proposals list: `parse_pagination` (default 25, page >= 1) on purpose; note it.
- Keep the two steward meanings under separate names (`is_steward` mod+ any status; ceremony = active admin+).
- Agreement detail, history and consent (POST and DELETE) use `get_scoped_or_404(..., label="Agreement", ecosystem_ids=await reachable_ecosystem_ids(session, request, include_pending=True))` (a pending newcomer reads and consents from the consent gate). Every other agreement route uses the defaults; with `include_shared=True` shared agreements now open, matching the list (intended: say so in the commit). Writes still authorize with `caller_in` on `agreement.ecosystem_id`.
- Does not own `api/chat.py`; if a dispatch change is needed there, hand it to the coordinator.

**BE-Groups (sonnet).** Owns: `api/domains.py`, `api/discover.py`, `api/members.py`, `api/ecosystems.py` (+ their tests).
- `ecosystems.py` ~333 ("steward of any domain or the sole member") becomes a named predicate appended to `policy.py`; `members.py` role matrix -> `policy.can_assign_role`.

**BE-Journey (sonnet).** Owns: `api/orientation.py`, `api/ethos_access.py`, `api/messaging.py`, `api/onboarding.py`, `api/chat.py`, `api/exit.py` (+ their tests).
- `exit.py` detail and status scope by the selection with a fail-open `if eco_ids:` (an empty selection opens any ecosystem's exit record): move them to `get_scoped_or_404` (authorized ids) with a test that a memberless caller gets 404.
- Invariant to rely on: with a non-empty scope, `ctx.member` is inside it, and it follows the picker; anything keyed on `ctx.member.id` per ecosystem moves to `caller_in`.
- Every per-ecosystem decision uses `caller_in(session, request, ecosystem_id)`, not `ctx.member`; add the flow test: a user with Member rows in two ecosystems records journey progress against the right ecosystem's member.
- `chat.py` ~785 shared-chat privacy check reads `ctx.member`: resolve the caller in the conversation's ecosystem instead.

## Wave 2 (after wave 1 lands)

FE4 `useRequiredFields` in ProposalDetail (test report), OnboardingCeremony, DomainDetail, EcosystemDetail; FE5 delete `useRoleAccess`, resource buttons read server `caller_can_*`; mechanical BE sweep of the remaining handler files and the 11 `_escape_like` copies; `auth.existing_membership` reuses `guards.default_member` (adding its active-first ordering, so `/auth/me`'s member matches `ctx.member`); `helpers.require_admin` takes the resource's ecosystem and resolves the caller with `caller_in` (today it reads `profile` from the default row, so a creator's newer `co_creator` row is not consulted) - a signature change across every caller, so it runs alone. `/auth/me` returns membership status per ecosystem and builds `member` on `default_member`, so the client's `activeEcosystemIds` applies the server's rule exactly; `Login.tsx` reads the stashed destination without consuming it so a readable agreement link resumes before consent.
