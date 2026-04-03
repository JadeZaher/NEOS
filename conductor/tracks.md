# NEOS Tracks

## Active

- [ ] **monorepo_bff_setup_20260403** — Monorepo + BFF Setup
  - Convert NEOS into a monorepo with BFF architecture. Consolidate git repos, set up dev tooling, define API contract, remove legacy Express/Supabase/Drizzle deps, add Railway config.
  - Spec: `conductor/tracks/monorepo_bff_setup_20260403/spec.md`
  - Plan: `conductor/tracks/monorepo_bff_setup_20260403/plan.md`
  - Priority: P0
  - Status: Not started

## Backlog

- [ ] **supabase_removal_feature_migration_20260403** — Supabase Removal & Feature Migration
  - Strip Supabase from React frontend, replace with Sanic BFF API calls. Migrate governance UI from Datastar dashboard to React. Remove Drizzle, Express sessions, unused deps.
  - Spec: `conductor/tracks/supabase_removal_feature_migration_20260403/spec.md`
  - Plan: `conductor/tracks/supabase_removal_feature_migration_20260403/plan.md`
  - Priority: P0
  - Status: Blocked (depends on monorepo_bff_setup_20260403)
  - Depends on: monorepo_bff_setup_20260403

## Completed

(none yet)
