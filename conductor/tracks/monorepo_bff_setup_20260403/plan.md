# Implementation Plan: Monorepo + BFF Setup

## Overview

Four phases: (1) consolidate into monorepo, (2) set up dev tooling and proxy, (3) define BFF contract and API client, (4) clean up legacy deps and add Railway config. Each phase ends with a verification checkpoint and a commit.

---

## Phase 1: Monorepo Consolidation

**Goal:** Single git repository with clean structure and working imports.

### Tasks

- [ ] Task: Remove nested `.git` directories from `neos-operating-system/` and `charting-the-course/`. Record a merge commit documenting the consolidation. (TDD: Write a test script that asserts no `.git` dirs exist below root; run it red; perform removal; run green.)

- [ ] Task: Create root `.gitignore` covering Python artifacts (`__pycache__/`, `*.egg-info/`, `.venv/`, `*.pyc`), Node artifacts (`node_modules/`, `dist/`), environment files (`.env`, `.env.local`), IDE files (`.vscode/`, `.idea/`), and OS files (`.DS_Store`, `Thumbs.db`). (TDD: Write test that parses `.gitignore` and asserts key patterns are present; implement the file.)

- [ ] Task: Rename `charting-the-course/package.json` name field from `rest-express` to `neos-frontend`. Verify `npm install` still works in that directory.

- [ ] Task: Verify all existing Python imports work. (TDD: Run `pytest neos-operating-system/agent/` from root and confirm existing tests pass. If `conftest.py` has path issues, fix them.)

- [ ] Verification: Root git repo tracks all files, no nested `.git`, Python tests pass, Node `npm install` succeeds. [checkpoint marker]

**Commit:** `conductor(monorepo): consolidate repos into single monorepo`

---

## Phase 2: Dev Tooling and Proxy

**Goal:** One command starts both services; Vite proxies API calls to Sanic.

### Tasks

- [ ] Task: Create root `package.json` with npm workspaces pointing to `charting-the-course/`. Add `concurrently` as a root dev dependency. Define scripts: `dev` (runs API + frontend), `dev:api` (Sanic only), `dev:frontend` (Vite only), `test` (pytest + any frontend tests). Use `cross-env` for Windows compatibility. (TDD: Write test that reads root `package.json` and asserts required scripts exist and `concurrently` is in devDependencies.)

- [ ] Task: Configure Vite proxy in `charting-the-course/vite.config.ts`. Add `server.proxy` entry: `/api` -> `http://localhost:8000`. (TDD: Write integration test -- start Sanic, start Vite, fetch `/api/v1/health` through Vite port, assert 200 with expected JSON shape. For unit scope: assert vite config contains proxy config.)

- [ ] Task: Remove Replit-specific Vite plugins (`@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, `@replit/vite-plugin-runtime-error-modal`) from `vite.config.ts` and `package.json`. (TDD: Write test asserting no `@replit` imports in `vite.config.ts` and no `@replit` deps in `package.json`; remove them; confirm `vite build` still works.)

- [ ] Task: Update Sanic CORS config to explicitly allow `http://localhost:5173` in development. Ensure `config.py` `CORS_ORIGINS` default includes the Vite dev port. (TDD: Write test that creates app with default settings and asserts CORS origins include `http://localhost:5173`.)

- [ ] Verification: Run `npm run dev` from root. In a browser or curl, hit `http://localhost:5173/api/v1/health` and get the Sanic health response. No CORS errors. Both processes start and stop cleanly. [checkpoint marker]

**Commit:** `conductor(dev-tooling): add root scripts, vite proxy, remove replit deps`

---

## Phase 3: BFF Contract and API Client

**Goal:** Typed API contract shared between Python and TypeScript; frontend has typed hooks.

### Tasks

- [ ] Task: Create `shared/api-types.ts` with TypeScript interfaces: `HealthResponse` (`status`, `skills_loaded`, `skills_available`, `database`, `version`), `SkillItem` (`name`, `description`, `layer`, `version`, `depends_on`), `SkillsResponse` (`count`, `skills`), `ApiError` (`error`). (TDD: Write test importing these types and asserting they compile. Use `tsc --noEmit`.)

- [ ] Task: Create `neos-operating-system/agent/src/neos_agent/api/schemas.py` with Pydantic models: `HealthResponse`, `SkillItem`, `SkillsResponse`, `ApiError`. (TDD: Write `test_schemas.py` -- instantiate each model with valid data, assert serialization matches expected shape; instantiate with invalid data, assert validation error.)

- [ ] Task: Refactor `health.py` and `skills.py` to use the new Pydantic response models (serialize via `.model_dump()`). Ensure existing health and skills tests still pass. (TDD: Existing tests serve as the red/green check. Add assertion on response JSON matching Pydantic model shape.)

- [ ] Task: Create `charting-the-course/client/src/lib/api-client.ts`. Export `fetchHealth()` and `fetchSkills()` functions that call `/api/v1/health` and `/api/v1/skills`, parse responses as typed interfaces. Base URL from `import.meta.env.VITE_API_URL` or `""`. (TDD: Write test with msw or manual mock -- call `fetchHealth()`, assert return type matches `HealthResponse`.)

- [ ] Task: Create TanStack Query hooks in `charting-the-course/client/src/hooks/use-api.ts`: `useHealth()` and `useSkills(layer?: number)`. (TDD: Write test rendering hook with QueryClientProvider and mocked fetch, assert data shape on success.)

- [ ] Verification: Python schema tests pass. TypeScript compiles with `tsc --noEmit`. API client functions are importable and typed. [checkpoint marker]

**Commit:** `conductor(bff-contract): add shared types, pydantic schemas, api client`

---

## Phase 4: Legacy Cleanup and Railway Config

**Goal:** Remove Express/Supabase/Drizzle from frontend. Add Railway deployment config.

### Tasks

- [ ] Task: Delete `charting-the-course/server/` directory (if it exists or any Express server files). Remove all Express/Supabase/Drizzle/Neon dependencies from `charting-the-course/package.json`: `express`, `express-session`, `connect-pg-simple`, `drizzle-orm`, `drizzle-zod`, `drizzle-kit`, `@supabase/supabase-js`, `@neondatabase/serverless`, `supabase`, `passport`, `passport-local`, `memorystore`, `openid-client`. Remove associated npm scripts (`db:*`, `supabase:*`, `migrate:*`). Remove associated `@types/*` dev deps. (TDD: Write test that reads `package.json` and asserts none of the removed packages appear; write test asserting `server/` dir does not exist.)

- [ ] Task: Fix any broken imports in frontend code that referenced Express server or Drizzle schemas. Replace with stubs or remove dead code. (TDD: Run `tsc --noEmit` and `vite build` -- both must succeed with zero errors.)

- [ ] Task: Update frontend `package.json` scripts. Keep: `dev` (Vite only, called by root), `build` (Vite build), `check` (tsc). Remove: `start` (Express), `build` server bundle (esbuild of server). (TDD: Assert `package.json` scripts object has exactly the expected keys.)

- [ ] Task: Create `railway.toml` at repo root with two services. API service: build command `cd neos-operating-system/agent && pip install -e .`, start command `python -m neos_agent.main --port $PORT`, watch path `neos-operating-system/`. Frontend service: build command `cd charting-the-course && npm install && npm run build`, static output `charting-the-course/dist/public/`. (TDD: Write test that parses `railway.toml` and asserts service names and required fields exist.)

- [ ] Task: Create a root `README.md` section documenting: prerequisites (Python 3.12+, Node 20+), setup steps, dev commands, deployment. Keep it brief -- 30 lines max. (TDD: Assert file exists and contains key headings.)

- [ ] Verification: `npm run dev` from root still works. `vite build` produces output in `dist/public/`. No Express/Supabase/Drizzle refs remain. `railway.toml` is valid. [checkpoint marker]

**Commit:** `conductor(cleanup): remove legacy deps, add railway config`

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 4 + verification | Git consolidation |
| 2 | 4 + verification | Dev experience |
| 3 | 5 + verification | BFF contract |
| 4 | 5 + verification | Cleanup + deploy |
| **Total** | **18 + 4 verifications** | |
