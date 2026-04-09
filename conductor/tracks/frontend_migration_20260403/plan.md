# Frontend Consolidation Plan: Remove Backend HTML Views, React-Only Frontend

**Track:** `frontend_migration_20260403`
**Created:** 2026-04-03  |  **Updated:** 2026-04-04
**Goal:** Make `charting-the-course` React app the sole frontend. Remove all Sanic HTML view blueprints, Jinja2 templates, and server-rendered auth/messaging routes.

---

## Current State Audit

### Backend HTML View Blueprints (registered in `main.py`)

All files under `neos-operating-system/agent/src/neos_agent/views/`:

| View Blueprint | URL Prefix | Routes | React Equivalent? |
|---|---|---|---|
| `dashboard_bp` | `/dashboard` | GET `/` (home) | YES - `Dashboard` at `/`, `/dashboard` |
| `agreements_bp` | `/dashboard/agreements` | list, detail, form, history, filter, create, update, status | YES - `AgreementList`, `AgreementDetail`, `AgreementForm`, `AgreementHistory` |
| `proposals_bp` | `/dashboard/proposals` | list, detail, form, filter, create, update, status, advice, consent | YES - `ProposalList`, `ProposalDetail`, `ProposalForm` |
| `members_bp` | `/dashboard/members` | list, detail, form, filter, create, update | YES - `MemberList`, `MemberDetail`, `MemberForm` |
| `domains_bp` | `/dashboard/domains` | list, detail, form, create, update | YES - `DomainList`, `DomainDetail`, `DomainForm` |
| `decisions_bp` | `/dashboard/decisions` | list, detail, filter | YES - `DecisionList`, `DecisionDetail` |
| `conflicts_bp` | `/dashboard/conflicts` | list, detail, form, filter, create, update | YES - `ConflictList`, `ConflictDetail`, `ConflictForm` |
| `onboarding_bp` | `/dashboard/onboarding` | list, ceremony | YES - `OnboardingList`, `OnboardingCeremony` |
| `ecosystems_bp` | `/ecosystems` | list, detail, form, create, update | YES - `EcosystemListPage`, `EcosystemDetailPage`, `EcosystemFormPage` |
| `chat_bp` | `/chat` | panel, send (SSE), shared | YES - `ChatPanel` at `/chat` |
| **`emergency_bp`** | `/dashboard/emergency` | dashboard, detail, declare, resolve | **NO - GAP** |
| **`exit_bp`** | `/dashboard/exit` | list, detail, form, filter, create, status transition | **NO - GAP** |
| **`safeguards_bp`** | `/dashboard/safeguards` | dashboard, audit list, audit detail, request audit | **NO - GAP** |

### Non-View Blueprints with HTML rendering (registered separately in `main.py`)

| Blueprint | URL Prefix | HTML Routes | React Equivalent? |
|---|---|---|---|
| `auth_bp` | `/auth` | GET `/login` (renders `auth/login.html`) | YES - `Login` at `/login` |
| `messaging_bp` | `/messaging` | GET `/` (renders `messaging/index.html`), conversation list/detail (HTML partials) | YES - `MessagingLayout` at `/messaging` |

### JSON API Blueprints (KEEP - these stay)

Registered at lines 116-148 of `main.py`:
- `health_bp`, `skills_bp`, `auth_api_bp`, `ecosystems_api_bp`, `dashboard_api_bp`
- `agreements_api_bp`, `proposals_api_bp`, `members_api_bp`, `domains_api_bp`
- `decisions_api_bp`, `onboarding_api_bp`, `conflicts_api_bp`
- `messaging_api_bp`, `courses_api_bp`, `quizzes_api_bp`, `chat_api_bp`

### Template Files (46 total)

```
templates/
  base.html                              -- shared layout (REMOVE)
  auth/login.html                        -- login page (REMOVE, React has Login)
  chat/panel.html, message.html          -- chat UI (REMOVE, React has ChatPanel)
  dashboard/home.html                    -- dashboard (REMOVE)
  dashboard/_activity_feed.html          -- partial (REMOVE)
  dashboard/_summary_cards.html          -- partial (REMOVE)
  dashboard/agreements/                  -- 5 files (REMOVE)
  dashboard/proposals/                   -- 6 files (REMOVE)
  dashboard/members/                     -- 4 files (REMOVE)
  dashboard/domains/                     -- 3 files (REMOVE)
  dashboard/decisions/                   -- 3 files (REMOVE)
  dashboard/onboarding/                  -- 2 files (REMOVE)
  dashboard/conflicts/                   -- 4 files (REMOVE)
  dashboard/emergency/                   -- 2 files (GAP - need React pages first)
  dashboard/exit/                        -- 4 files (GAP - need React pages first)
  dashboard/safeguards/                  -- 3 files (GAP - need React pages first)
  ecosystems/                            -- 3 files (REMOVE)
  messaging/                             -- 6 files (REMOVE)
  partials/                              -- 4 files (REMOVE)
```

### Missing JSON APIs (no `/api/v1/` equivalent exists)

| Domain | Needed Endpoints |
|---|---|
| Emergency | `GET /api/v1/emergency`, `GET /api/v1/emergency/:id`, `POST /api/v1/emergency/declare`, `POST /api/v1/emergency/:id/resolve` |
| Exit | `GET /api/v1/exit`, `GET /api/v1/exit/:id`, `POST /api/v1/exit`, `POST /api/v1/exit/:id/status` |
| Safeguards | `GET /api/v1/safeguards`, `GET /api/v1/safeguards/audits`, `GET /api/v1/safeguards/audits/:id`, `POST /api/v1/safeguards/audits` |

---

## Phase 0: Fill the Gaps (Emergency, Exit, Safeguards)

**Goal:** Before removing anything, build the React pages and JSON APIs for the three features that only exist as HTML views today.

### 0.1 Backend: Emergency JSON API
**File:** `neos-operating-system/agent/src/neos_agent/api/emergency.py` (NEW)

- [ ] **T0.1.1** Create `emergency_api_bp` with JSON endpoints
  - `GET /api/v1/emergency` -- current state + recent history (mirrors `emergency.py:dashboard`)
  - `GET /api/v1/emergency/<id>` -- detail
  - `POST /api/v1/emergency/declare` -- declare emergency (JSON body: `{ecosystem_id, declared_by, reason, auto_revert_days}`)
  - `POST /api/v1/emergency/<id>/resolve` -- resolve/close emergency
  - AC: Returns JSON. Reuses `EmergencyState` model. Ecosystem-scoped.

### 0.2 Backend: Exit JSON API
**File:** `neos-operating-system/agent/src/neos_agent/api/exit.py` (NEW)

- [ ] **T0.2.1** Create `exit_api_bp` with JSON endpoints
  - `GET /api/v1/exit` -- paginated list with filters (status, exit_type, search)
  - `GET /api/v1/exit/<id>` -- detail with unwinding tracker
  - `POST /api/v1/exit` -- initiate exit (JSON body: `{ecosystem_id, member_id, exit_type, reason}`)
  - `POST /api/v1/exit/<id>/status` -- transition status (JSON body: `{new_status}`)
  - AC: Returns JSON. Reuses `ExitRecord` model. Mirrors filter logic from `views/exit.py:_apply_filters`.

### 0.3 Backend: Safeguards JSON API
**File:** `neos-operating-system/agent/src/neos_agent/api/safeguards.py` (NEW)

- [ ] **T0.3.1** Create `safeguards_api_bp` with JSON endpoints
  - `GET /api/v1/safeguards` -- latest audit + recent audits + health metrics
  - `GET /api/v1/safeguards/audits` -- paginated audit list
  - `GET /api/v1/safeguards/audits/<id>` -- audit detail
  - `POST /api/v1/safeguards/audits` -- request new audit (JSON body: `{ecosystem_id, auditor}`)
  - AC: Returns JSON. Reuses `GovernanceHealthAudit` model.

### 0.4 Backend: Register new API blueprints
**File:** `neos-operating-system/agent/src/neos_agent/main.py`

- [ ] **T0.4.1** Import and register `emergency_api_bp`, `exit_api_bp`, `safeguards_api_bp` in the API section (lines 116-148)

### 0.5 Frontend: Emergency Pages
**Files:** `charting-the-course/client/src/pages/governance/emergency/` (NEW)

- [ ] **T0.5.1** Create `EmergencyDashboard` page -- circuit breaker status, declaration form, history list
- [ ] **T0.5.2** Create `EmergencyDetail` page -- single emergency event detail, resolve action
- [ ] **T0.5.3** Add routes: `/emergency` and `/emergency/:id` to `App.tsx`
- [ ] **T0.5.4** Add "Emergency" to sidebar navigation

### 0.6 Frontend: Exit Pages
**Files:** `charting-the-course/client/src/pages/governance/exit/` (NEW)

- [ ] **T0.6.1** Create `ExitList` page -- paginated list with status/type filters
- [ ] **T0.6.2** Create `ExitDetail` page -- unwinding tracker, status transitions
- [ ] **T0.6.3** Create `ExitForm` page -- initiate exit process
- [ ] **T0.6.4** Add routes: `/exit`, `/exit/new`, `/exit/:id` to `App.tsx`

### 0.7 Frontend: Safeguards Pages
**Files:** `charting-the-course/client/src/pages/governance/safeguards/` (NEW)

- [ ] **T0.7.1** Create `SafeguardsDashboard` page -- health metrics, latest audit, recent audits
- [ ] **T0.7.2** Create `AuditList` page -- paginated audit history
- [ ] **T0.7.3** Create `AuditDetail` page -- capture risk indicators, findings, recommendations
- [ ] **T0.7.4** Add routes: `/safeguards`, `/safeguards/audits`, `/safeguards/audits/:id` to `App.tsx`

**Commit:** `feat(governance): add emergency, exit, safeguards JSON APIs and React pages`

---

## Phase 1: Remove Backend HTML View Blueprints (with React equivalents)

**Goal:** Delete all view blueprint Python files and stop registering them in `main.py`.

### 1.1 Remove `register_views()` call and view imports from `main.py`

**File:** `neos-operating-system/agent/src/neos_agent/main.py`

- [ ] **T1.1.1** Delete lines 151-152:
  ```python
  from neos_agent.views import register_views
  register_views(app)
  ```
  This removes registration of: `dashboard_bp`, `agreements_bp`, `domains_bp`, `members_bp`, `proposals_bp`, `decisions_bp`, `conflicts_bp`, `safeguards_bp`, `emergency_bp`, `exit_bp`, `onboarding_bp`

- [ ] **T1.1.2** Delete lines 155-156 (ecosystems view blueprint):
  ```python
  from neos_agent.views.ecosystems import ecosystems_bp
  app.blueprint(ecosystems_bp)
  ```

- [ ] **T1.1.3** Delete lines 159-160 (chat view blueprint):
  ```python
  from neos_agent.views.chat import chat_bp
  app.blueprint(chat_bp)
  ```

### 1.2 Remove HTML routes from `auth_bp`

**File:** `neos-operating-system/agent/src/neos_agent/auth/routes.py`

- [ ] **T1.2.1** Remove the `GET /auth/login` route (lines 31-35) that renders `auth/login.html`
  - The JSON auth endpoints (`POST /challenge`, `POST /verify`, `POST /logout`) stay -- they are used by the React app

### 1.3 Remove HTML routes from `messaging_bp`

**File:** `neos-operating-system/agent/src/neos_agent/messaging/routes.py`

- [ ] **T1.3.1** Remove `GET /messaging/` route (lines 61-91) that renders `messaging/index.html`
- [ ] **T1.3.2** Remove all HTML-rendering routes that use `render()` and return `html_response()`:
  - `GET /conversations` (returns HTML partial at line 94)
  - `GET /conversations/<id>` (returns HTML at line 324)
  - `GET /members` (returns HTML member picker at line 869)
  - `GET /search` (returns HTML search results at line 951)
  - **KEEP:** All routes that return JSON, all POST/PUT/DELETE endpoints, and the WebSocket endpoint (`/ws`) -- these are the API layer
- [ ] **T1.3.3** Alternatively, if the messaging routes are a mix of HTML and JSON in the same functions, refactor to return JSON only (check each route)

### 1.4 Delete view blueprint Python files

**Directory:** `neos-operating-system/agent/src/neos_agent/views/`

- [ ] **T1.4.1** Delete these files:
  - `__init__.py` (the `register_views` function)
  - `dashboard.py`
  - `agreements.py`
  - `proposals.py`
  - `members.py`
  - `domains.py`
  - `decisions.py`
  - `conflicts.py`
  - `onboarding.py`
  - `ecosystems.py`
  - `chat.py`
  - `emergency.py`
  - `exit.py`
  - `safeguards.py`

- [ ] **T1.4.2** **KEEP** `_rendering.py` for now -- check if it is imported by anything other than views. If only views import it, delete it too. If `auth/routes.py` or `messaging/routes.py` import `render()` from it, those imports need to be removed first (after their HTML routes are deleted).

**Commit:** `refactor(backend): remove all HTML view blueprints, React is sole frontend`

---

## Phase 2: Remove Jinja2 Template Files

**Goal:** Delete the entire templates directory.

**Directory:** `neos-operating-system/agent/src/neos_agent/templates/`

- [ ] **T2.1** Delete the entire `templates/` directory and all contents:
  - `base.html`
  - `auth/login.html`
  - `chat/panel.html`, `chat/message.html`
  - `dashboard/home.html`, `dashboard/_activity_feed.html`, `dashboard/_summary_cards.html`
  - `dashboard/agreements/` (5 files)
  - `dashboard/proposals/` (6 files)
  - `dashboard/members/` (4 files)
  - `dashboard/domains/` (3 files)
  - `dashboard/decisions/` (3 files)
  - `dashboard/onboarding/` (2 files)
  - `dashboard/conflicts/` (4 files)
  - `dashboard/emergency/` (2 files)
  - `dashboard/exit/` (4 files)
  - `dashboard/safeguards/` (3 files)
  - `ecosystems/` (3 files)
  - `messaging/` (6 files)
  - `partials/` (4 files)

- [ ] **T2.2** Remove Jinja2 dependency from `pyproject.toml` / `requirements.txt` if it was only used for templates (check if Jinja2 is used elsewhere)

**Commit:** `refactor(backend): remove all Jinja2 templates`

---

## Phase 3: Update `main.py` -- Auth Middleware and Routing

**Goal:** The auth middleware currently redirects unauthenticated users to `/auth/login` (an HTML page). With React as the sole frontend, unauthenticated API requests should return `401 JSON`, and the React app handles its own routing.

**File:** `neos-operating-system/agent/src/neos_agent/main.py`

### 3.1 Update auth middleware for API-only mode

- [ ] **T3.1.1** Change the auth middleware (lines 171-299) to return JSON 401 instead of `redirect("/auth/login")` for API routes:
  - If path starts with `/api/`: return `json({"error": "Unauthorized"}, status=401)`
  - For all other paths: either return 401 or serve the React SPA index.html (see T3.2.1)

- [ ] **T3.1.2** Remove the `EcosystemScope` import from `_rendering.py` in the middleware (line 175). Replace ecosystem scope tracking with a simpler approach that doesn't depend on the view rendering module:
  - The middleware currently sets `request.ctx.ecosystem_scope` using `EcosystemScope.from_ecosystems()` -- the JSON API endpoints may or may not use this. Check each API blueprint for `request.ctx.ecosystem_scope` usage.
  - If API blueprints use it, move `EcosystemScope` to a shared location (e.g., `neos_agent/auth/ecosystem_scope.py`)
  - If only views used it, remove the ecosystem scope setup from middleware entirely -- API endpoints likely read ecosystem IDs from query params directly

### 3.2 Update root and catch-all routes

- [ ] **T3.2.1** Replace the root route (lines 302-306) and catch-all (lines 309-312):
  - **Option A (SPA mode):** Serve the React app's `index.html` for all non-`/api/` routes. This requires building the React app and placing it in a static directory.
  - **Option B (Separate servers):** Remove root/catch-all entirely. React runs on its own dev server (Vite) or is served by a reverse proxy (nginx). Backend only serves `/api/` routes.
  - Recommended: **Option B** for development, **Option A** for production. For now, just remove the HTML redirects.

- [ ] **T3.2.2** Remove the root redirect to `/dashboard` and the `NotFound` catch-all redirect. API 404s should return `json({"error": "Not found"}, status=404)`.

### 3.3 Update public routes list

**File:** `neos-operating-system/agent/src/neos_agent/auth/middleware.py`

- [ ] **T3.3.1** Clean up `PUBLIC_PREFIXES` -- remove prefixes that were only for HTML views:
  - Remove `/ecosystems` (was for the public ecosystem directory HTML page; the API equivalent is at `/api/v1/ecosystems`)
  - Remove `/chat/shared/` if it was only for HTML shared chat links
  - Remove `/static/` if there are no more static assets to serve
  - Keep `/api/v1/health`, `/api/v1/auth/`, `/api/v1/skills`, `/auth/` (for the JSON auth endpoints)

**Commit:** `refactor(backend): update auth middleware for API-only mode, remove HTML redirects`

---

## Phase 4: Clean Up Frontend References

**Goal:** Remove any remaining Supabase, server-rendered, or legacy references in the React app.

**Directory:** `charting-the-course/client/src/`

- [ ] **T4.1** Search for and remove any Supabase imports/references:
  - `grep -r "supabase" --include="*.ts" --include="*.tsx"`
  - Remove `@supabase/supabase-js`, `@supabase/ssr` from `package.json` if present
  - Remove any Supabase client initialization files

- [ ] **T4.2** Search for and remove any Drizzle ORM references:
  - `grep -r "drizzle" --include="*.ts" --include="*.tsx"`
  - Remove `drizzle-orm`, `drizzle-kit` from `package.json` if present
  - Remove any `server/` directory with Express/Drizzle code

- [ ] **T4.3** Verify all API calls use the Sanic backend (`/api/v1/`):
  - `grep -r "fetch\|axios\|useQuery" --include="*.ts" --include="*.tsx"` and confirm endpoints point to `/api/v1/`

- [ ] **T4.4** Update Vite proxy config to ensure all API routes proxy to Sanic:
  - `/api` -> Sanic backend
  - `/auth` -> Sanic backend (for JSON auth endpoints)
  - `/messaging/ws` -> Sanic backend (WebSocket)
  - `/chat` -> Sanic backend (if SSE chat endpoint is not under `/api/`)

**Commit:** `refactor(frontend): remove Supabase/Drizzle references, verify API-only data flow`

---

## Phase 5: Verification -- Full Route Coverage Audit

**Goal:** Confirm every backend route that was removed has a working React equivalent.

### 5.1 Route Parity Checklist

- [ ] **T5.1.1** Verify these React routes work end-to-end (render + fetch data from JSON API):

| Domain | React Routes | JSON API |
|---|---|---|
| Auth | `/login` | `POST /api/v1/auth/challenge`, `POST /api/v1/auth/verify`, `GET /api/v1/auth/me` |
| Dashboard | `/`, `/dashboard` | `GET /api/v1/dashboard/summary` |
| Agreements | `/agreements`, `/agreements/:id`, `/agreements/new`, `/agreements/:id/edit`, `/agreements/:id/history` | `GET/POST /api/v1/agreements`, `GET/PUT /api/v1/agreements/:id` |
| Proposals | `/proposals`, `/proposals/:id`, `/proposals/new`, `/proposals/:id/edit` | `GET/POST /api/v1/proposals`, `GET/PUT /api/v1/proposals/:id` |
| Members | `/members`, `/members/:id`, `/members/new`, `/members/:id/edit` | `GET/POST /api/v1/members`, `GET/PUT /api/v1/members/:id` |
| Domains | `/domains`, `/domains/:id`, `/domains/new`, `/domains/:id/edit` | `GET/POST /api/v1/domains`, `GET/PUT /api/v1/domains/:id` |
| Decisions | `/decisions`, `/decisions/:id` | `GET /api/v1/decisions`, `GET /api/v1/decisions/:id` |
| Onboarding | `/onboarding`, `/onboarding/:memberId/ceremony` | `GET /api/v1/onboarding`, `GET/POST /api/v1/onboarding/:memberId/ceremony` |
| Conflicts | `/conflicts`, `/conflicts/:id`, `/conflicts/new` | `GET/POST /api/v1/conflicts`, `GET/PUT /api/v1/conflicts/:id` |
| Ecosystems | `/ecosystems`, `/ecosystems/:id`, `/ecosystems/new`, `/ecosystems/:id/edit` | `GET/POST /api/v1/ecosystems`, `GET/PUT /api/v1/ecosystems/:id` |
| Emergency | `/emergency`, `/emergency/:id` | `GET/POST /api/v1/emergency` (NEW from Phase 0) |
| Exit | `/exit`, `/exit/new`, `/exit/:id` | `GET/POST /api/v1/exit` (NEW from Phase 0) |
| Safeguards | `/safeguards`, `/safeguards/audits`, `/safeguards/audits/:id` | `GET/POST /api/v1/safeguards` (NEW from Phase 0) |
| Messaging | `/messaging` | `GET /api/v1/messaging/conversations`, WebSocket at `/messaging/ws` |
| Chat | `/chat` | `POST /chat/send` (SSE), `GET /api/v1/chat/sessions` |
| Quizzes | `/quizzes`, `/quiz/take/:id`, `/quiz/results/:id`, `/quiz/manage` | `GET/POST /api/v1/quizzes` |
| Profiles | `/profile`, `/users/:username` | `GET /api/v1/auth/me`, `GET /api/v1/members/:id` |

- [ ] **T5.1.2** Verify no broken links in the React sidebar navigation
- [ ] **T5.1.3** Verify the backend returns no HTML responses for any route (all responses are JSON or WebSocket/SSE)
- [ ] **T5.1.4** Test auth flow: login -> navigate -> logout -> redirect to login

**Commit:** `test(integration): verify full route coverage after HTML view removal`

---

## Summary

| Phase | What | Files Changed | Risk |
|---|---|---|---|
| **0** | Fill gaps: Emergency, Exit, Safeguards (API + React) | 3 new API files, ~9 new React page files, `main.py`, `App.tsx` | LOW -- new code only |
| **1** | Remove HTML view blueprints | `main.py`, 14 view `.py` files deleted, `auth/routes.py`, `messaging/routes.py` | MEDIUM -- must verify no API endpoints accidentally deleted |
| **2** | Remove Jinja2 templates | `templates/` directory deleted (46 files) | LOW -- dead code after Phase 1 |
| **3** | Update auth middleware for API-only | `main.py`, `auth/middleware.py` | MEDIUM -- auth behavior change |
| **4** | Clean up frontend | `charting-the-course` various files | LOW -- removing unused deps |
| **5** | Verification | No file changes, testing only | NONE |

### Key Risks

1. **`messaging/routes.py` mixes HTML and API logic** -- The messaging blueprint serves both HTML partials (for htmx) and JSON/WebSocket. The POST/PUT/DELETE/WebSocket routes may return JSON and must be preserved. Each route needs individual inspection before removal.
2. **`_rendering.py` EcosystemScope** is imported by the auth middleware in `main.py` (line 175). This dependency must be relocated before deleting the views module.
3. **`auth/routes.py`** has JSON endpoints (`/challenge`, `/verify`, `/logout`) that must stay even though the HTML login page is removed.

### Must NOT Do

- Delete any JSON API blueprints (everything under `neos_agent/api/`)
- Delete WebSocket or SSE endpoints
- Change database models or migrations
- Modify the React app's existing working pages (only add new ones in Phase 0)
- Deploy without running Phase 5 verification

### Definition of Done

1. Zero HTML responses from the backend (all routes return JSON, WebSocket, or SSE)
2. Zero Jinja2 template files in the repo
3. Zero view blueprint registrations in `main.py`
4. All 17 governance domains have working React pages
5. Auth middleware returns 401 JSON for unauthenticated API requests (no redirects)
6. No Supabase or Drizzle dependencies in the frontend
