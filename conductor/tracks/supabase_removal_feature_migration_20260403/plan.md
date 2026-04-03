# Implementation Plan: Supabase Removal & Feature Migration

## Overview

6 phases, ordered by dependency. Phase 1 builds the API foundation. Phase 2 replaces auth. Phase 3 creates the API client and rewires hooks. Phase 4 builds governance UI components. Phase 5 removes dead code. Phase 6 is integration verification.

**Dependency:** Requires `monorepo_bff_20260403` to be complete before starting.

**Branch:** `feature/supabase_removal_feature_migration_20260403`

---

## Phase 1: Sanic JSON API Endpoints

Goal: Create the `/api/v1/` blueprint with JSON endpoints for all features currently served by Supabase Edge Functions and direct DB queries.

Tasks:
- [ ] Task: Create API blueprint structure with `/api/v1/` prefix, JSON envelope helper (`{"data": ..., "error": ...}`), and Pydantic request/response models for shared types (pagination, error). (TDD: Write test for envelope format and error responses, implement helpers, refactor)
- [ ] Task: Add `/api/v1/auth/me` endpoint that returns the current authenticated member's profile from the session cookie. (TDD: Write test for authenticated and unauthenticated responses, implement using existing auth middleware, refactor)
- [ ] Task: Add `/api/v1/dashboard/summary` and `/api/v1/dashboard/activity` endpoints returning JSON versions of the existing `_summary_counts` and `_recent_activity` helpers. (TDD: Write test with seeded data, implement endpoints, refactor)
- [ ] Task: Add `/api/v1/agreements` CRUD endpoints -- GET list (with filters, pagination), GET detail, POST create, PUT update, POST status transition, GET history. (TDD: Write test for list+filter+pagination, implement, refactor)
- [ ] Task: Add `/api/v1/members` endpoints -- GET list (paginated), GET detail, PUT update profile. (TDD: Write test for list and detail, implement, refactor)
- [ ] Task: Add `/api/v1/domains` endpoints -- GET list, GET detail. (TDD: Write test, implement, refactor)
- [ ] Task: Add `/api/v1/proposals` endpoints -- GET list (with status filter), GET detail, POST create. (TDD: Write test, implement, refactor)
- [ ] Task: Add `/api/v1/decisions` endpoints -- GET list, GET detail. (TDD: Write test, implement, refactor)
- [ ] Task: Add `/api/v1/chat` endpoint -- POST message (returns SSE stream), GET conversations, GET conversation messages. (TDD: Write test for non-streaming request/response contract, implement, refactor)
- [ ] Verification: Run `pytest` for all new API endpoints, confirm JSON responses match envelope format, verify auth middleware rejects unauthenticated requests. [checkpoint marker]

---

## Phase 2: Replace Supabase Auth with DID Auth

Goal: Replace `useSupabaseAuth`, `lib/supabase.ts`, and all Supabase auth imports with a new auth module that uses the Sanic DID challenge-response flow.

Tasks:
- [ ] Task: Create `client/src/lib/auth.ts` with functions: `requestChallenge(did)`, `verifyChallenge(did, challenge, signature)`, `logout()`, `getMe()`. All call Sanic `/auth/*` and `/api/v1/auth/me` endpoints. (TDD: Write test mocking fetch for each function, implement, refactor)
- [ ] Task: Create `client/src/lib/did.ts` with DID key pair generation, storage (localStorage), and signing using `@noble/ed25519`. (TDD: Write test for key generation and challenge signing, implement, refactor)
- [ ] Task: Create `client/src/hooks/useAuth.ts` replacing `useSupabaseAuth`. Exposes: user, isAuthenticated, isLoading, signIn, signOut. Uses TanStack Query for `/api/v1/auth/me`. (TDD: Write test for hook state transitions, implement, refactor)
- [ ] Task: Rewrite `client/src/pages/Login.tsx` to use DID auth flow -- generate or load key pair, request challenge, sign, verify. Remove all Supabase imports. (TDD: Write test for login form submission flow, implement, refactor)
- [ ] Task: Update `client/src/components/ProtectedRoute.tsx` and `App.tsx` to use `useAuth` instead of `useSupabaseAuth`. (TDD: Write test for redirect behavior, implement, refactor)
- [ ] Verification: Login with DID key, verify session cookie is set, confirm protected routes redirect unauthenticated users, confirm no Supabase auth imports remain. [checkpoint marker]

---

## Phase 3: Rewire Frontend Hooks to API Client

Goal: Create a typed API client and migrate every hook from Supabase SDK calls to Sanic API calls.

Tasks:
- [ ] Task: Create `client/src/lib/api.ts` -- typed fetch wrapper with base URL config, cookie credentials, error parsing, and TypeScript generics for response types. (TDD: Write test for error handling and response parsing, implement, refactor)
- [ ] Task: Define TypeScript types in `client/src/types/api.ts` for all API entities: Member, Agreement, Domain, Proposal, Decision, DashboardSummary, ActivityItem, ChatMessage, Conversation. (TDD: Write type-check test ensuring types compile, implement, refactor)
- [ ] Task: Rewrite `useProfile.ts` to call `/api/v1/members/{id}` and `/api/v1/members/{id}` PUT. Remove `supabase.functions.invoke` calls. (TDD: Write test with mocked API responses, implement, refactor)
- [ ] Task: Rewrite `usePermissions.tsx` and `useRoleAccess.tsx` to call `/api/v1/auth/me` for role data instead of querying `user_roles`/`roles` tables via Supabase. (TDD: Write test, implement, refactor)
- [ ] Task: Rewrite `useEthos.ts` to call `/api/v1/ethos` endpoints. (TDD: Write test, implement, refactor)
- [ ] Task: Rewrite `useBadges.ts` to call `/api/v1/badges` endpoints. (TDD: Write test, implement, refactor)
- [ ] Task: Rewrite `useAchievements.ts` to call `/api/v1/achievements` endpoints. (TDD: Write test, implement, refactor)
- [ ] Task: Rewrite `useOrientation.ts` to call `/api/v1/orientation` endpoints. (TDD: Write test, implement, refactor)
- [ ] Task: Rewrite `client/src/lib/omnibot.ts` to call `/api/v1/chat` endpoint. (TDD: Write test, implement, refactor)
- [ ] Task: Update all page components that directly import from `@/lib/supabase` to use the new hooks or API client instead. Covers: Dashboard, AdminPanel, QuizManagement, QuizList, TakeQuiz, QuizResults, MyQuizHistory, UserQuizHistory, MapPage, JourneyMapEditor, JourneyMapList, OrientationJourney, OrientationComplete, EthosDetail, PublicProfile, Profile, UserManagement. (TDD: Write test confirming no Supabase imports in page files, implement, refactor)
- [ ] Verification: Run `grep -r "supabase" client/src/` and confirm zero results. Run `npm run build` and confirm no TypeScript errors. [checkpoint marker]

---

## Phase 4: Governance Dashboard React Components

Goal: Build React components for the governance features currently only in the Datastar dashboard.

Tasks:
- [ ] Task: Create `GovernanceDashboard` component with summary cards (agreements, members, domains, proposals, decisions counts) using TanStack Query against `/api/v1/dashboard/summary`. (TDD: Write test for card rendering with mocked data, implement with shadcn/ui Card, refactor)
- [ ] Task: Create `ActivityFeed` component showing recent governance activity from `/api/v1/dashboard/activity`. (TDD: Write test for feed rendering and empty state, implement, refactor)
- [ ] Task: Create `AgreementList` component with filter controls (type, status, domain, search) and pagination, calling `/api/v1/agreements`. (TDD: Write test for filter application and pagination, implement, refactor)
- [ ] Task: Create `AgreementDetail` component showing full agreement with status transition buttons and amendment history, calling `/api/v1/agreements/{id}` and `/api/v1/agreements/{id}/history`. (TDD: Write test for detail rendering and status transition mutation, implement, refactor)
- [ ] Task: Create `MemberList` and `MemberProfile` components calling `/api/v1/members`. (TDD: Write test, implement, refactor)
- [ ] Task: Create `DomainList` and `DomainDetail` components calling `/api/v1/domains`. (TDD: Write test, implement, refactor)
- [ ] Task: Create `ProposalList` and `ProposalDetail` components calling `/api/v1/proposals`. (TDD: Write test, implement, refactor)
- [ ] Task: Create `ChatPanel` component with message input, conversation history, and SSE streaming from `/api/v1/chat`. (TDD: Write test for message send and display, implement, refactor)
- [ ] Task: Add governance routes to wouter config in `App.tsx` -- `/governance`, `/governance/agreements`, `/governance/agreements/:id`, `/governance/members`, `/governance/domains`, `/governance/proposals`, `/governance/chat`. Update sidebar navigation. (TDD: Write test for route rendering, implement, refactor)
- [ ] Verification: Navigate through all governance pages, confirm data loads from API, confirm filters and pagination work, confirm chat sends and receives messages. [checkpoint marker]

---

## Phase 5: Remove Dead Dependencies

Goal: Remove all Supabase-era code, dependencies, and configuration.

Tasks:
- [ ] Task: Remove `charting-the-course/supabase/` directory entirely (Edge Functions, config, seed files). (TDD: Write test confirming directory does not exist post-removal, implement, refactor)
- [ ] Task: Remove `charting-the-course/scripts/migrate-supabase.ts` and update scripts in package.json -- remove `db:push`, `db:migrate`, `db:seed`, `db:reset`, `supabase:start/stop/status`, `functions:deploy`, `migrate:supabase`. (TDD: Write test confirming removed scripts are not in package.json, implement, refactor)
- [ ] Task: Remove dependencies from package.json: `@supabase/supabase-js`, `supabase`, `@neondatabase/serverless`, `connect-pg-simple`, `express-session`, `drizzle-orm`, `drizzle-zod`, `drizzle-kit`, `@types/connect-pg-simple`, `@types/express-session`. (TDD: Write test confirming packages absent from package.json, implement, refactor)
- [ ] Task: Remove `client/src/lib/supabase.ts`, `client/src/hooks/useSupabaseAuth.ts`, and any Drizzle schema/config files (`drizzle.config.ts`, `db/` directory if present). (TDD: Write test confirming files do not exist, implement, refactor)
- [ ] Task: Remove environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`, `.env.example`, and any deployment config. (TDD: Write test grepping for Supabase env vars, implement, refactor)
- [ ] Task: Run `npm install` to regenerate lock file, then `npm run build` to confirm clean compilation. Fix any remaining import errors. (TDD: Build must succeed with exit code 0, implement fixes, refactor)
- [ ] Verification: `npm run build` succeeds. `grep -ri "supabase\|drizzle\|neon.*serverless\|connect-pg-simple\|express-session" charting-the-course/` returns zero results (excluding node_modules). [checkpoint marker]

---

## Phase 6: Integration Verification

Goal: End-to-end validation that the full stack works without Supabase.

Tasks:
- [ ] Task: Write integration test: start Sanic server, build React app, verify login flow with DID auth, load dashboard, create an agreement via API, confirm it appears in the list. (TDD: Write test, implement any fixes needed, refactor)
- [ ] Task: Verify Datastar dashboard still functions at `/dashboard/` routes alongside the React app. (TDD: Write test hitting dashboard HTML endpoints, implement, refactor)
- [ ] Task: Run full test suite -- both `pytest` (backend) and frontend tests. Confirm 10% coverage target is met. (TDD: Check coverage output, add tests if below threshold, refactor)
- [ ] Verification: All tests green. Both dashboards accessible. No Supabase dependencies in codebase. Commit with `conductor(phase-6): integration verification complete`. [checkpoint marker]
