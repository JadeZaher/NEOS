# Specification: Monorepo + BFF Setup

## Overview

Set up the NEOS root directory as a monorepo with Backend For Frontend (BFF) architecture. Each sub-project (`neos-operating-system/`, `charting-the-course/`) keeps its own `.git` directory. The Python/Sanic backend (`neos-operating-system/agent/`) becomes the sole API layer, and the React frontend (`charting-the-course/`) consumes it exclusively via HTTP. Express backend, Drizzle ORM, and Supabase dependencies are removed from the frontend. Unified dev scripts, CORS/proxy configuration, and Railway deployment config (2 services, 1 shared DB) are established at the root.

## Background

`neos-operating-system/` and `charting-the-course/` each contain their own `.git` directory and will continue to do so — this is a multi-repo monorepo layout. The root has its own `git init` for conductor/config files. The frontend still carries Express server code, Drizzle ORM, Supabase client, and Neon serverless driver — all slated for removal. The Sanic API already exposes `/api/v1/health` and `/api/v1/skills` and has CORS support via `sanic-ext`.

## Decisions (Resolved)

1. **Git structure:** Keep nested `.git` directories. Each sub-project maintains its own git history. Root git tracks only `conductor/` and config files.
2. **Railway deployment:** 2 separate services (API + frontend), 1 shared PostgreSQL database.
3. **Shared types:** Auto-generate TypeScript types from Pydantic models using `pydantic2ts` or `datamodel-code-generator`.

## Functional Requirements

### FR-1: Root Dev Scripts
**Description:** Provide root-level scripts so a developer can start both backend and frontend from the repo root.
**Acceptance Criteria:**
- `npm run dev` (or equivalent) at root starts both Sanic API (port 8000) and Vite dev server (port 5173) concurrently.
- `npm run dev:api` starts only the Sanic API.
- `npm run dev:frontend` starts only the Vite dev server.
**Priority:** P0

### FR-2: Vite Proxy to Sanic API
**Description:** Configure Vite's dev server to proxy `/api` requests to the Sanic backend so the frontend can call the BFF without CORS issues during development.
**Acceptance Criteria:**
- `fetch("/api/v1/health")` from the React app in dev mode returns the Sanic health response.
- No CORS errors in the browser console during local development.
- Proxy only applies to paths starting with `/api`.
**Priority:** P0

### FR-3: Pydantic Response Schemas + Type Auto-Generation
**Description:** Define Pydantic models for all BFF API responses and auto-generate TypeScript types from them.
**Acceptance Criteria:**
- `neos-operating-system/agent/src/neos_agent/api/schemas.py` defines Pydantic models for API responses.
- A script generates TypeScript interfaces from the Pydantic models into `charting-the-course/client/src/types/api.ts`.
- Generated types match the Pydantic model shapes exactly.
**Priority:** P0

### FR-4: Frontend API Client
**Description:** Create a typed fetch wrapper in the frontend that calls the Sanic BFF and integrates with TanStack Query.
**Acceptance Criteria:**
- An `api-client.ts` module exports typed functions for each BFF endpoint.
- Functions return typed responses matching the auto-generated types.
- TanStack Query hooks exist for `useHealth()` and `useSkills()`.
- API base URL is configurable via Vite env variable (`VITE_API_URL`), defaulting to empty string (same-origin proxy).
**Priority:** P1

### FR-5: Express/Supabase/Drizzle Removal
**Description:** Remove the Express server, Supabase client, Drizzle ORM, and Neon serverless driver from the frontend package.
**Acceptance Criteria:**
- `charting-the-course/server/` directory is deleted.
- Express, Supabase, Drizzle, Neon deps removed from `package.json`.
- Related npm scripts removed.
- The app still builds (`vite build`) without errors after removal.
**Priority:** P1

### FR-6: Railway Deployment Configuration
**Description:** Add Railway config for 2 services sharing 1 PostgreSQL database.
**Acceptance Criteria:**
- Each sub-project has its own `railway.toml` (or Railway project config).
- API service: builds and starts the Sanic app, connects to shared Railway PostgreSQL.
- Frontend service: builds Vite output, served as static site.
- Both services share the same `DATABASE_URL` environment variable.
**Priority:** P2

## Non-Functional Requirements

### NFR-1: No Breaking Imports
Existing Python import paths (`from neos_agent.xxx import yyy`) must continue to work unchanged.

### NFR-2: Windows Compatibility
Dev scripts must work on Windows 11. Use cross-platform tools (`concurrently`, `cross-env`) where needed.

## Technical Considerations

- The Sanic app currently serves its own Datastar-based HTML views. These coexist with the JSON API routes under `/api/v1/`. The React frontend only uses the JSON API.
- `charting-the-course/` has Replit-specific Vite plugins that should be removed.
- The frontend `package.json` is named `rest-express` — rename to `neos-frontend`.
- Python virtual environment management needs documenting but not automating in npm scripts.

## Out of Scope

- Migrating existing frontend pages to use the new API client (later track).
- Authentication flow between React frontend and Sanic (separate track).
- Database schema changes or migration work.
- CI/CD pipeline setup.
- Removing the Datastar views from the Sanic app.
