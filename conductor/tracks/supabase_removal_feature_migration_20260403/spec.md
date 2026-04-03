# Specification: Supabase Removal & Feature Migration

## Overview

Strip all Supabase dependencies from the React frontend (charting-the-course/), replace direct database access and Supabase Edge Function calls with requests to the Sanic BFF API, migrate Express session handling to Sanic-based DID auth, and port key governance UI features from the Datastar+Jinja2 dashboard (neos-operating-system/agent/) to React components.

## Background

The charting-the-course/ frontend currently depends on:

- **@supabase/supabase-js** for authentication (email/password via Supabase Auth) and direct database queries (`.from('table')`)
- **Supabase Edge Functions** (~50 functions) for quiz, profile, ethos, orientation, journey maps, badges, achievements, settings, admin, and omnibot features
- **Drizzle ORM + drizzle-zod** for schema definitions and direct DB access from the frontend server layer
- **@neondatabase/serverless** as the Supabase-era PostgreSQL driver
- **express-session + connect-pg-simple** for Express-based session management

The Sanic backend (neos-operating-system/agent/) already has:

- DID-based challenge-response authentication with session cookies
- SQLAlchemy 2.0 async ORM with 37 governance tables
- Datastar+Jinja2 dashboard views for: dashboard, agreements, domains, members, proposals, decisions, conflicts, safeguards, emergency, exit, onboarding
- AI chat via Anthropic SDK
- Skill registry and graph

After track 1 (monorepo_bff_20260403), the Sanic API serves the React frontend. This track completes the decoupling by making the React app communicate exclusively through the Sanic API.

## Functional Requirements

### FR-1: Replace Supabase Auth with Sanic DID Auth

**Description:** Replace `useSupabaseAuth` hook and `lib/supabase.ts` auth helpers with a new `useAuth` hook that calls the existing Sanic `/auth/challenge`, `/auth/verify`, and `/auth/logout` endpoints. The React app must handle DID key generation client-side.

**Acceptance Criteria:**
- Login page uses DID challenge-response flow instead of email/password
- Session is maintained via `neos_session` httpOnly cookie (already set by Sanic)
- `useAuth` hook exposes: user, isAuthenticated, isLoading, signIn, signOut
- Auth state changes invalidate relevant TanStack Query caches
- No imports from `@supabase/supabase-js` remain in auth code

**Priority:** P0

### FR-2: Create Sanic JSON API Endpoints

**Description:** Add JSON API endpoints to the Sanic backend for every feature currently served by Supabase Edge Functions. These endpoints return JSON (not HTML) and are consumed by the React frontend via TanStack Query.

**Acceptance Criteria:**
- API blueprint at `/api/v1/` with sub-routes for each feature domain
- Endpoints for: profiles, quizzes, ethos, orientation, journey-maps, badges, achievements, settings, admin/users, omnibot/chat
- All endpoints require authenticated session (DID auth middleware)
- Responses use consistent JSON envelope: `{"data": ..., "error": null}` or `{"data": null, "error": "message"}`
- Pagination via `offset`/`limit` query params where applicable
- Input validation using Pydantic models

**Priority:** P0

### FR-3: Create React API Client

**Description:** Create a typed API client module (`client/src/lib/api.ts`) that wraps `fetch` for all Sanic API calls. Replace all `supabase.functions.invoke()` and `supabase.from()` calls in hooks with API client calls.

**Acceptance Criteria:**
- API client handles base URL, credentials (cookies), error parsing
- Each hook (useProfile, useEthos, useBadges, useAchievements, useOrientation, usePermissions, useRoleAccess) refactored to use API client
- TanStack Query patterns preserved (query keys, stale times, mutations)
- TypeScript types for all API request/response shapes
- No Supabase imports remain in any hook

**Priority:** P0

### FR-4: Remove Drizzle ORM and Direct DB Access

**Description:** Remove Drizzle ORM, drizzle-zod, and any schema/migration files from charting-the-course/. The frontend must not access the database directly.

**Acceptance Criteria:**
- `drizzle-orm`, `drizzle-zod`, `drizzle-kit` removed from package.json
- All `db/schema.ts`, `db/index.ts`, migration files removed
- No TypeScript files import from `drizzle-orm` or reference database connections
- Build succeeds without Drizzle dependencies

**Priority:** P1

### FR-5: Remove Unused Dependencies

**Description:** Remove all Supabase-era dependencies that are no longer needed.

**Acceptance Criteria:**
- Removed from package.json: `@supabase/supabase-js`, `supabase` (CLI), `@neondatabase/serverless`, `connect-pg-simple`, `express-session`, `@types/connect-pg-simple`, `@types/express-session`
- Supabase-related scripts removed from package.json (`db:migrate`, `db:seed`, `db:reset`, `supabase:start/stop/status`, `functions:deploy`, `migrate:supabase`)
- `charting-the-course/supabase/` directory removed entirely (Edge Functions, config)
- `charting-the-course/scripts/migrate-supabase.ts` removed
- Environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` removed from all config files
- `npm install` and `npm run build` succeed cleanly

**Priority:** P1

### FR-6: Migrate Governance Dashboard to React

**Description:** Port the core governance dashboard from Datastar+Jinja2 to React components, consuming the new JSON API endpoints.

**Acceptance Criteria:**
- Dashboard home page with summary cards (agreements, members, domains, proposals, decisions counts)
- Recent activity feed with real-time updates via SSE
- Agreement list with filtering (type, status, domain, search) and pagination
- Agreement detail view with status transitions and amendment history
- Member list and profile views
- Domain list and detail views
- All components use Tailwind CSS exclusively (no custom CSS)
- Components use shadcn/ui + Radix primitives

**Priority:** P1

### FR-7: Migrate AI Chat to React

**Description:** Port the AI governance chat from the Datastar dashboard to a React component, using the Sanic chat API endpoint.

**Acceptance Criteria:**
- Chat component with message history and input
- SSE streaming for AI responses
- Chat scoped to selected ecosystem
- Conversation persistence via API
- Accessible from dashboard sidebar

**Priority:** P2

## Non-Functional Requirements

### NFR-1: Performance

- API responses under 200ms for list endpoints (p95)
- React bundle size must not increase by more than 15% from added governance components
- SSE connections must reconnect automatically on disconnect

### NFR-2: Security

- No database credentials or connection strings in the frontend
- All API calls authenticated via httpOnly session cookie
- DID private keys stored only in browser (localStorage or IndexedDB), never sent to server
- CORS configured to allow only the frontend origin

### NFR-3: Backward Compatibility

- Existing Datastar dashboard continues to function (it is not being removed, only duplicated into React)
- No changes to existing SQLAlchemy models or Alembic migrations
- API endpoints do not break the Datastar dashboard's HTML routes

## User Stories

### US-1: Member Authentication

**As a** community member
**I want to** sign in using my DID key
**So that** I can access governance features without depending on Supabase Auth

**Given** a member has a DID key pair
**When** they visit the login page and authenticate
**Then** a session cookie is set and they are redirected to the dashboard

### US-2: Governance Overview

**As a** community member
**I want to** see a dashboard with governance summary counts
**So that** I can quickly understand the state of my ecosystem

**Given** the member is authenticated
**When** they navigate to the dashboard
**Then** they see counts for agreements, members, domains, proposals, and decisions

### US-3: Agreement Management

**As an** ecosystem architect
**I want to** create, edit, and manage agreement lifecycles
**So that** governance agreements are tracked and versioned

**Given** the user has appropriate permissions
**When** they create or modify an agreement
**Then** the changes are persisted via the Sanic API and reflected in the UI

### US-4: AI Governance Chat

**As a** community member
**I want to** ask the AI agent about governance processes
**So that** I can get guidance on using the 54 governance skills

**Given** the member is authenticated
**When** they open the chat and send a message
**Then** the AI responds with streamed text relevant to their ecosystem

## Technical Considerations

- The Sanic backend already has SQLAlchemy models for all 37 governance tables; new API endpoints query these directly
- DID auth uses Ed25519 key pairs; the React app needs a lightweight crypto library (e.g., `@noble/ed25519`) for client-side key management
- The existing Datastar views render HTML via Jinja2; new API endpoints share the same SQLAlchemy queries but return JSON
- SSE for real-time updates can reuse the Sanic SSE infrastructure already in place for the Datastar dashboard
- TanStack Query's `queryClient.invalidateQueries()` replaces Supabase's `onAuthStateChange` for cache management

## Out of Scope

- Removing the Datastar+Jinja2 dashboard (it continues to function alongside React)
- Migrating conflict resolution, emergency, exit, or safeguard views to React (future tracks)
- User registration flow redesign (DID key generation UX will be minimal/functional)
- Mobile-specific layouts
- Internationalization
- Migrating Supabase Edge Function business logic that has no equivalent in the governance model (quiz, orientation, journey-maps -- these get new Sanic endpoints but may have simplified data models initially)

## Open Questions

1. **Quiz data model:** The Supabase Edge Functions reference quiz tables not present in the current SQLAlchemy models. Should quiz/assessment tables be added to the governance schema, or deferred to a later track?
2. **DID key UX:** Should the login flow generate a new DID key pair for first-time users, or require them to bring an existing one?
3. **Feature parity threshold:** Which Supabase Edge Function features are critical for launch vs. deferrable? The spec assumes profiles, auth, dashboard, agreements, members, and domains are P0/P1; quiz, orientation, journey-maps, badges, achievements are P2.
4. **SSE vs. polling:** Should the React dashboard use SSE (matching Datastar) or is TanStack Query polling sufficient for the initial migration?
