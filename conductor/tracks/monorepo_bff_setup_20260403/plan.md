# Implementation Plan: Monorepo + BFF Setup

## Overview

Three phases: (1) dev tooling and proxy, (2) Pydantic schemas + auto-generated types + API client, (3) legacy cleanup + Railway config. Each phase ends with a verification checkpoint and a commit.

---

## Phase 1: Dev Tooling and Proxy

**Goal:** One command starts both services; Vite proxies API calls to Sanic.

### Tasks

- [x] Task 1.1: Create root `package.json` with scripts: `dev`, `dev:api`, `dev:frontend`, `generate:types`. Add `concurrently` as root dev dependency.

- [x] Task 1.2: Configure Vite proxy in `charting-the-course/vite.config.ts`. Add `server.proxy` entry: `/api` -> `http://localhost:8000`. Remove Replit-specific Vite plugins from `vite.config.ts` and `package.json`.

- [x] Task 1.3: Rename `charting-the-course/package.json` name field from `rest-express` to `neos-frontend`.

- [x] Task 1.4: Update Sanic CORS config to allow `http://localhost:5173` in development.

- [ ] Verification: Run `npm run dev` from root. Both processes start. Hit `http://localhost:5173/api/v1/health` through Vite proxy and get Sanic response. No CORS errors.

**Commit:** `conductor(dev-tooling): add root scripts, vite proxy, remove replit deps`

---

## Phase 2: BFF Contract — Pydantic Schemas, Auto-Gen Types, API Client

**Goal:** Typed API contract auto-generated from Pydantic; frontend has typed hooks.

### Tasks

- [x] Task 2.1: Create `neos-operating-system/agent/src/neos_agent/api/schemas.py` with Pydantic models: `HealthResponse`, `SkillItem`, `SkillsResponse`, `ApiError`. Refactor existing health/skills endpoints to use these models.

- [x] Task 2.2: Add type generation script. Create `scripts/generate_types.py` (stdlib only) that exports Pydantic models to TypeScript. Add `generate:types` npm script at root.

- [x] Task 2.3: Create `charting-the-course/client/src/lib/api-client.ts`. Export typed fetch functions (`fetchHealth()`, `fetchSkills()`).

- [x] Task 2.4: Create TanStack Query hooks in `charting-the-course/client/src/hooks/use-api.ts`: `useHealth()` and `useSkills(layer?: number)`.

- [ ] Verification: Pydantic models serialize correctly. Type generation script produces valid TypeScript. `tsc --noEmit` passes. API client functions are importable and typed.

**Commit:** `conductor(bff-contract): pydantic schemas, auto-gen types, api client`

---

## Phase 3: Legacy Cleanup and Railway Config

**Goal:** Remove Express/Supabase/Drizzle from frontend. Add Railway + Docker deployment config.

### Tasks

- [x] Task 3.1: Remove Express, Supabase, Drizzle, Neon, Passport deps from `package.json`. Remove associated npm scripts. Remove associated `@types/*` dev deps.

- [ ] Task 3.2: Fix broken imports in frontend code that referenced Express server, Drizzle schemas, or Supabase. Run `tsc --noEmit` and `vite build` to verify.

- [x] Task 3.3: Update frontend `package.json` scripts. Keep: `dev` (Vite), `build` (Vite build), `check` (tsc).

- [x] Task 3.4: Create Railway configs. API: `neos-operating-system/railway.toml`. Frontend: `charting-the-course/railway.toml`.

- [x] Task 3.5 (added): Create Dockerfiles for each sub-project (`neos-operating-system/Dockerfile`, `charting-the-course/Dockerfile`), `docker-compose.yml` at root, and `dev-docker.sh` wrapper script.

- [ ] Verification: `vite build` succeeds. No Express/Supabase/Drizzle refs remain in frontend. Railway configs and Dockerfiles are valid.

**Commit:** `conductor(cleanup): remove legacy deps, add railway + docker config`

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 4 + verification | Dev experience |
| 2 | 4 + verification | BFF contract |
| 3 | 5 + verification | Cleanup + deploy + Docker |
| **Total** | **13 + 3 verifications** | |
