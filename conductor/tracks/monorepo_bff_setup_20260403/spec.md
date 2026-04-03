# Specification: Monorepo + BFF Setup

## Overview

Convert the NEOS root directory from two loosely co-located git repositories into a single monorepo with Backend For Frontend (BFF) architecture. The Python/Sanic backend (`neos-operating-system/agent/`) becomes the sole API layer, and the React frontend (`charting-the-course/`) consumes it exclusively via HTTP. Express backend, Drizzle ORM, and Supabase dependencies are removed from the frontend. Unified dev scripts, CORS/proxy configuration, and Railway deployment config are established at the root.

## Background

Currently, `neos-operating-system/` and `charting-the-course/` each contain their own `.git` directory. The root has a fresh `git init`. The frontend still carries Express server code, Drizzle ORM, Supabase client, and Neon serverless driver -- all slated for removal per `tech-stack.md`. The Sanic API already exposes `/api/v1/health` and `/api/v1/skills` and has CORS support via `sanic-ext`.

## Functional Requirements

### FR-1: Monorepo Consolidation
**Description:** Merge both subdirectory repositories into the root git history. Remove nested `.git` directories so there is exactly one repository.
**Acceptance Criteria:**
- Root `.git` is the only git directory in the tree.
- Full file history from both subdirectories is preserved (or an explicit clean-break commit documents the merge).
- `.gitignore` at root covers Python (`__pycache__`, `.venv`, `*.egg-info`), Node (`node_modules`, `dist`), environment files (`.env`), and IDE artifacts.
**Priority:** P0

### FR-2: Root-Level Dev Scripts
**Description:** Provide a root `package.json` (workspaces) and/or shell scripts so a developer can start both backend and frontend from the repo root.
**Acceptance Criteria:**
- `npm run dev` (or equivalent) at root starts both Sanic API (port 8000) and Vite dev server (port 5173) concurrently.
- `npm run dev:api` starts only the Sanic API.
- `npm run dev:frontend` starts only the Vite dev server.
- `npm run test` runs both backend (pytest) and frontend tests.
**Priority:** P0

### FR-3: Vite Proxy to Sanic API
**Description:** Configure Vite's dev server to proxy `/api` requests to the Sanic backend so the frontend can call the BFF without CORS issues during development.
**Acceptance Criteria:**
- `fetch("/api/v1/health")` from the React app in dev mode returns the Sanic health response.
- No CORS errors in the browser console during local development.
- Proxy only applies to paths starting with `/api`.
**Priority:** P0

### FR-4: BFF API Contract Definition
**Description:** Define an initial API contract (OpenAPI-style or typed schemas) for the BFF endpoints the React frontend will consume. This covers existing endpoints and stubs for the first endpoints the frontend needs (health, skills, auth status).
**Acceptance Criteria:**
- A `shared/api-types.ts` file defines TypeScript interfaces for all BFF response shapes.
- A `neos-operating-system/agent/src/neos_agent/api/schemas.py` file defines matching Pydantic models for API responses.
- Health endpoint response shape matches between Python and TypeScript definitions.
- Skills endpoint response shape matches between Python and TypeScript definitions.
**Priority:** P1

### FR-5: Frontend API Client
**Description:** Create a typed fetch wrapper in the frontend that calls the Sanic BFF and integrates with TanStack Query.
**Acceptance Criteria:**
- An `api-client.ts` module exports typed functions for each BFF endpoint.
- Functions return typed responses matching `shared/api-types.ts`.
- TanStack Query hooks exist for `useHealth()` and `useSkills()`.
- API base URL is configurable via Vite env variable (`VITE_API_URL`), defaulting to empty string (same-origin proxy).
**Priority:** P1

### FR-6: Express/Supabase/Drizzle Removal
**Description:** Remove the Express server, Supabase client, Drizzle ORM, and Neon serverless driver from the frontend package.
**Acceptance Criteria:**
- `charting-the-course/server/` directory is deleted.
- `express`, `express-session`, `connect-pg-simple`, `drizzle-orm`, `drizzle-zod`, `drizzle-kit`, `@supabase/supabase-js`, `@neondatabase/serverless`, `supabase` CLI are removed from `package.json`.
- `db:push`, `db:migrate`, `db:seed`, `db:reset`, `supabase:*`, `migrate:supabase` scripts are removed from `package.json`.
- The app still builds (`vite build`) without errors after removal.
**Priority:** P1

### FR-7: Railway Deployment Configuration
**Description:** Add a `railway.toml` at the repo root that defines two services: the Sanic API and the React frontend (static build served by the API or a separate static service).
**Acceptance Criteria:**
- `railway.toml` exists at root with service definitions.
- API service builds and starts the Sanic app.
- Frontend service builds the Vite output and serves it (either via Sanic static file serving or a separate Caddy/nginx config).
- Environment variable references are documented.
**Priority:** P2

## Non-Functional Requirements

### NFR-1: Dev Startup Time
Starting both services via `npm run dev` should complete within 15 seconds on a modern machine.

### NFR-2: No Breaking Imports
Existing Python import paths (`from neos_agent.xxx import yyy`) must continue to work unchanged after monorepo consolidation.

### NFR-3: Windows Compatibility
Dev scripts must work on Windows 11 (the current development platform). Avoid Unix-only shell syntax in npm scripts; use cross-platform tools (`concurrently`, `cross-env`) where needed.

## User Stories

### US-1: Developer sets up local environment
**As** a developer cloning the repo for the first time,
**I want** to run a single setup command and then `npm run dev`,
**So that** both the API and frontend start and I can begin working immediately.

**Given** a fresh clone of the monorepo
**When** the developer runs `npm install` and `npm run dev`
**Then** the Vite dev server starts on port 5173, proxying API calls to Sanic on port 8000

### US-2: Frontend developer calls BFF endpoint
**As** a frontend developer,
**I want** typed API hooks that call the Sanic backend,
**So that** I get autocomplete and type safety when working with governance data.

**Given** the dev servers are running
**When** a React component calls `useHealth()`
**Then** it receives a typed `HealthResponse` object with `status`, `skills_loaded`, `database`, and `version` fields

### US-3: Deployer ships to Railway
**As** a deployer,
**I want** a single `railway.toml` that defines both services,
**So that** pushing to main deploys the full stack automatically.

**Given** the monorepo is connected to Railway
**When** a commit is pushed to `main`
**Then** Railway builds and deploys both the API and frontend services

## Technical Considerations

- The Sanic app currently serves its own Datastar-based HTML views. These will coexist with the new JSON API routes under `/api/v1/`. The React frontend only uses the JSON API.
- `charting-the-course/` has Replit-specific Vite plugins (`@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, `@replit/vite-plugin-runtime-error-modal`). These should be removed as the project is no longer on Replit.
- The frontend `package.json` is named `rest-express` -- rename to `neos-frontend`.
- Python virtual environment management (venv/uv) needs documenting but not automating in npm scripts.
- `concurrently` is the recommended tool for running parallel dev processes in npm scripts (cross-platform).

## Out of Scope

- Migrating existing frontend pages to use the new API client (that is a later track).
- Authentication flow between React frontend and Sanic (separate track).
- Database schema changes or migration work.
- CI/CD pipeline setup (GitHub Actions, etc.).
- Removing the Datastar views from the Sanic app.

## Open Questions

1. **Static serving strategy on Railway:** Should the Sanic API serve the Vite build output as static files (single service), or should the frontend be a separate Railway static service? Single service is simpler; separate gives independent scaling.
2. **Git history preservation:** Is a clean-break commit acceptable, or must `git filter-repo` / subtree merge preserve commit-by-commit history from both repos?
3. **Shared types format:** Should shared types live in a `shared/` top-level directory, or should the TypeScript types be auto-generated from Pydantic models?
