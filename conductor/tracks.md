# NEOS Tracks

## Active

- [ ] **monorepo_bff_setup_20260403** — Monorepo + BFF Setup
  - Convert NEOS into a monorepo with BFF architecture. Consolidate git repos, set up dev tooling, define API contract, remove legacy Express/Supabase/Drizzle deps, add Railway config.
  - Spec: `conductor/tracks/monorepo_bff_setup_20260403/spec.md`
  - Plan: `conductor/tracks/monorepo_bff_setup_20260403/plan.md`
  - Priority: P0
  - Status: Not started

## Backlog

- [ ] **frontend_migration_20260403** — Frontend Migration: Sanic/Jinja2 to React
  - Migrate 46 Jinja2/Datastar templates to React components. Build JSON API endpoints on Sanic BFF. Merge course/quiz data models into SQLAlchemy. 8 phases: auth, dashboard, agreements+proposals, members+domains+decisions+onboarding, conflicts+ecosystems, messaging+chat, course migration, integration+cleanup.
  - Spec: `conductor/tracks/frontend_migration_20260403/spec.md`
  - Plan: `conductor/tracks/frontend_migration_20260403/plan.md`
  - Priority: P0
  - Status: Blocked (depends on monorepo_bff_setup_20260403)
  - Depends on: monorepo_bff_setup_20260403

- [ ] **supabase_removal_feature_migration_20260403** — Supabase Removal & Feature Migration (SUPERSEDED)
  - Superseded by frontend_migration_20260403 which covers the same scope with more detail.
  - Spec: `conductor/tracks/supabase_removal_feature_migration_20260403/spec.md`
  - Plan: `conductor/tracks/supabase_removal_feature_migration_20260403/plan.md`
  - Priority: P2
  - Status: Superseded by frontend_migration_20260403

## Completed

(none yet)
