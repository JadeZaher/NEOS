# Frontend Migration Spec: Sanic/Jinja2 to React

## Track ID
`frontend_migration_20260403`

## Summary
Migrate 46 Jinja2/Datastar templates from the Sanic-served governance dashboard to React components in `charting-the-course/client/`. Build JSON API endpoints on Sanic to serve as the BFF. Merge course/quiz data models into Sanic's SQLAlchemy schema. Keep HTML routes alive during transition (no deletion).

## Current State

### Backend (`neos-operating-system/agent/`)
- **37 SQLAlchemy models** across 10 sections (Core, Agreements, ACT Process, Memory, Sessions, Conflict, Emergency, Exit, Auth, Messaging)
- **11 view blueprints** serving HTML via Jinja2: dashboard, agreements, domains, members, proposals, decisions, conflicts, safeguards, emergency, exit, onboarding
- **3 standalone blueprints**: auth (DID challenge-response), chat (SSE streaming), messaging (WebSocket + REST)
- **2 JSON API endpoints**: `/api/v1/health`, `/api/v1/skills`
- **Rendering**: `_rendering.py` provides `render()`, `html_fragment()`, `EcosystemScope` scoping, pagination helpers
- **Auth middleware**: cookie-based sessions (`neos_session`), ecosystem multi-select via `neos_selected_ecosystems` cookie

### Frontend (`charting-the-course/client/`)
- **React 18 + TypeScript** with Vite, wouter routing, TanStack Query, shadcn/ui + Radix + Tailwind
- **21 pages**: Dashboard, Quiz*, Profile*, Admin*, Orientation*, JourneyMap*, Login
- **Supabase auth** (to be replaced with DID auth from Sanic)
- **Drizzle schema** with 15 tables: users, teams, courses, quizzes, quiz_results, quiz_progress, user_tags, user_badges, profile_tiles, user_privacy_settings, user_profile_data, sessions, team_members, quiz_assignments
- **Vite proxy**: `/api` -> `http://localhost:8000`

### BFF Architecture
- Vite dev proxy already routes `/api` to Sanic
- Pydantic schemas exist for health + skills responses
- CORS configured on Sanic

## Target State

### Backend
- New `/api/v1/` JSON endpoints for all governance entities (agreements, proposals, members, domains, decisions, conflicts, ecosystems, onboarding, messaging, chat)
- New SQLAlchemy models for course/quiz/badge data (migrated from Drizzle schema)
- DID auth endpoints return JSON (challenge, verify, session status)
- SSE chat endpoint unchanged (React uses EventSource)
- WebSocket messaging endpoint unchanged (React uses native WS)
- HTML routes remain untouched (parallel operation)

### Frontend
- 46 new React components replacing Jinja2 templates
- DID auth flow in React (replaces Supabase auth)
- TanStack Query hooks for all API calls
- EventSource hook for chat SSE
- WebSocket hook for messaging
- Ecosystem picker/scope in React state (context provider)
- Course/quiz pages retain existing functionality, data served by Sanic API
- shadcn/ui design system with NEOS color tokens

## Scope

### In Scope (46 templates)
- Auth (1): login
- Dashboard (2+2 partials): home, summary cards, activity feed
- Agreements (5): list, detail, form, history, list rows
- Proposals (6): list, detail, form, advice tab, consent tab, test tab
- Members (4): list, detail, form, onboarding checklist
- Domains (3): list, detail, form
- Decisions (3): list, detail, list rows
- Conflicts (4): list, detail, form, list rows
- Onboarding (2): list, ceremony (6-section UAF consent)
- Messaging (6): index, conversation list, conversation detail, message list, member picker, search
- Chat (2): panel, message (SSE streaming)
- Ecosystems (3): list, detail, form
- Base + Partials (5): layout/sidebar/nav, ecosystem picker, loading, notification, pagination

### Out of Scope (deferred)
- Safeguards templates (dashboard, audits, audit detail)
- Emergency templates (dashboard, detail)
- Exit templates (list, detail, form, list rows)
- Deletion of HTML routes
- Production deployment config changes

## Technical Decisions
1. **JSON API pattern**: `/api/v1/{entity}` for lists, `/api/v1/{entity}/{id}` for detail, standard REST verbs
2. **Pydantic response schemas**: One schema per entity, nested where needed
3. **Auth**: React stores session token, sends as cookie; API returns JSON
4. **Real-time**: SSE for chat (EventSource), WebSocket for messaging (native API)
5. **State management**: TanStack Query for server state, React Context for ecosystem scope + auth
6. **Routing**: wouter with nested layout routes
7. **Course migration**: SQLAlchemy models mirror Drizzle schema, Alembic migration, seed script
8. **Design system**: Map NEOS CSS custom properties to Tailwind CSS variables (already using shadcn pattern)

## Dependencies
- Depends on: `monorepo_bff_setup_20260403` (BFF proxy, monorepo structure)
- Blocked by: None additional beyond monorepo setup

## Risks
| Risk | Mitigation |
|------|------------|
| Auth flow complexity (DID + Ed25519 in browser) | Use existing `auth/did.py` logic, add JSON endpoints, test with existing keys |
| SSE/WS connection management | Build dedicated React hooks with reconnect logic |
| Data model drift (Drizzle vs SQLAlchemy) | Map 1:1 where possible, document deviations |
| Ecosystem scoping in React | Centralize in Context provider, mirror cookie-based approach |
| 46 components is a lot | Phase strictly, commit per phase, no cross-phase dependencies |
