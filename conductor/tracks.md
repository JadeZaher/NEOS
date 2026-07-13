# NEOS Tracks

## Active

- [ ] **multi_ecosystem_collaboration_20260425** — Multi-Ecosystem Collaboration & Platform Hardening
  - Data model (CircleMembership, Shares/Needs, Collaborations, Culture Code), AI independence (OpenRouter/LiteLLM), Jinja2 removal (React only), inter-unit discovery, "No Sultan" routing, conflict resolution refinement, PWA notifications, compliance summaries, version fingerprinting. 7 phases, 51 tasks.
  - Spec: `conductor/tracks/multi_ecosystem_collaboration_20260425/spec.md`
  - Plan: `conductor/tracks/multi_ecosystem_collaboration_20260425/plan.md`
  - Priority: P0
  - Status: Not started

- [ ] **monorepo_bff_setup_20260403** — Monorepo + BFF Setup
  - Convert NEOS into a monorepo with BFF architecture. Consolidate git repos, set up dev tooling, define API contract, remove legacy Express/Supabase/Drizzle deps, add Railway config.
  - Spec: `conductor/tracks/monorepo_bff_setup_20260403/spec.md`
  - Plan: `conductor/tracks/monorepo_bff_setup_20260403/plan.md`
  - Priority: P0
  - Status: Mostly complete (Phase 1-2 done, Phase 3 partial)

## Backlog

- [ ] **frontend_migration_20260403** — Frontend Migration: Sanic/Jinja2 to React (PARTIALLY SUPERSEDED)
  - Jinja2 removal now covered by multi_ecosystem_collaboration_20260425 Phase 3. Remaining scope: course migration, integration cleanup.
  - Spec: `conductor/tracks/frontend_migration_20260403/spec.md`
  - Plan: `conductor/tracks/frontend_migration_20260403/plan.md`
  - Priority: P1
  - Status: Partially superseded by multi_ecosystem_collaboration_20260425
  - Depends on: multi_ecosystem_collaboration_20260425

- [ ] **supabase_removal_feature_migration_20260403** — Supabase Removal & Feature Migration (SUPERSEDED)
  - Superseded by frontend_migration_20260403 which covers the same scope with more detail.
  - Spec: `conductor/tracks/supabase_removal_feature_migration_20260403/spec.md`
  - Plan: `conductor/tracks/supabase_removal_feature_migration_20260403/plan.md`
  - Priority: P2
  - Status: Superseded by frontend_migration_20260403

## New Tracks for Comprehensive Governance UI

- [ ] **governance_skill_data_models_20260427** — Governance Skill Data Models & Agent Support
  - Create data models for harm circles, governance audits, emergency management, ACT test phases, culture codes, economic coordination, precedent systems, and exit portability. Ensure all models support agent-guided workflows with structured data collection.
  - Spec: `conductor/tracks/governance_skill_data_models_20260427/spec.md`
  - Plan: `conductor/tracks/governance_skill_data_models_20260427/plan.md`
  - Priority: P0
  - Status: Not started
  - Depends on: multi_ecosystem_collaboration_20260425 (data model foundation)

- [ ] **conflict_resolution_ui_20260427** — Conflict Resolution UI & Harm Circles
  - Build comprehensive UI for harm circle process with structured data collection, preparation conversations, safety assessments, 3-round facilitation, and repair agreements. Support agent-guided conflict resolution workflows.
  - Spec: `conductor/tracks/conflict_resolution_ui_20260427/spec.md`
  - Plan: `conductor/tracks/conflict_resolution_ui_20260427/plan.md`
  - Priority: P0
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427

- [ ] **governance_audit_ui_20260427** — Governance Health Audit UI
  - Create UI for requesting audits, scoring governance health indicators, managing thresholds, conducting audit workflows, and publishing reports. Support agent-guided audit processes.
  - Spec: `conductor/tracks/governance_audit_ui_20260427/spec.md`
  - Plan: `conductor/tracks/governance_audit_ui_20260427/plan.md`
  - Priority: P1
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427

- [~] **emergency_management_ui_20260427** — Emergency Management UI
  - Build UI for defining emergency criteria, setting up pre-authorization protocols, declaring emergencies, managing emergency authority, and conducting post-emergency reviews.
  - Spec: `conductor/tracks/emergency_management_ui_20260427/spec.md`
  - Plan: `conductor/tracks/emergency_management_ui_20260427/plan.md`
  - Priority: P1
  - Status: Backend + initial UI partial. Wave-3 landed the open→half_open→closed state machine in the agent (migration 009, models, services/cron, api/emergency.py — all hardened in wave-3 review). Wave-3 also shipped the `CompleteRecoveryDialog` client component (S5). Remaining: full UI for declaring emergencies, defining criteria, managing pre-authorization, viewing post-emergency review status.
  - Depends on: governance_skill_data_models_20260427
  - Wave-3 retro: `conductor/retros/wave-3-2026-06-10.md`

- [ ] **act_complete_ui_20260427** — Complete ACT Process UI
  - Enhance proposal UI with complete ACT lifecycle including test phase success criteria, test report management, midpoint reviews, and outcome tracking.
  - Spec: `conductor/tracks/act_complete_ui_20260427/spec.md`
  - Plan: `conductor/tracks/act_complete_ui_20260427/plan.md`
  - Priority: P1
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427

- [ ] **domain_culture_ui_20260427** — Domain Culture Code & Hierarchy UI
  - Create UI for domain type management, culture code editing, domain nesting/hierarchy, culture code versioning, and domain element management.
  - Spec: `conductor/tracks/domain_culture_ui_20260427/spec.md`
  - Plan: `conductor/tracks/domain_culture_ui_20260427/plan.md`
  - Priority: P1
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427

- [ ] **economic_coordination_ui_20260427** — Economic Coordination UI
  - Build UI for resource allocation, commons monitoring, funding pool stewardship, participatory allocation, and economic coordination workflows.
  - Spec: `conductor/tracks/economic_coordination_ui_20260427/spec.md`
  - Plan: `conductor/tracks/economic_coordination_ui_20260427/plan.md`
  - Priority: P2
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427

- [ ] **memory_precedent_ui_20260427** — Memory & Precedent System UI
  - Create UI for decision records, precedent search, semantic tagging, agreement versioning, and precedent-guided governance.
  - Spec: `conductor/tracks/memory_precedent_ui_20260427/spec.md`
  - Plan: `conductor/tracks/memory_precedent_ui_20260427/plan.md`
  - Priority: P2
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427

- [ ] **exit_portability_ui_20260427** — Exit Portability UI
  - Build UI for commitment unwinding, portable record generation, re-entry integration, and exit portability workflows.
  - Spec: `conductor/tracks/exit_portability_ui_20260427/spec.md`
  - Plan: `conductor/tracks/exit_portability_ui_20260427/plan.md`
  - Priority: P2
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427

## Integration & Optimization Tracks

- [ ] **agent_skill_integration_20260427** — Agent Skill Integration & MCP Support
  - Integrate all governance skills with agent routing, create MCP tools for governance workflows, ensure agent can execute all skills with proper UI support.
  - Spec: `conductor/tracks/agent_skill_integration_20260427/spec.md`
  - Plan: `conductor/tracks/agent_skill_integration_20260427/plan.md`
  - Priority: P0
  - Status: Not started
  - Depends on: All UI tracks complete

- [ ] **governance_workflow_optimization_20260427** — Governance Workflow Optimization
  - Optimize user workflows for readability, composability, and intelligent patterns. Add progressive disclosure, contextual help, and agent-guided experiences.
  - Spec: `conductor/tracks/governance_workflow_optimization_20260427/spec.md`
  - Plan: `conductor/tracks/governance_workflow_optimization_20260427/plan.md`
  - Priority: P1
  - Status: Not started
  - Depends on: All UI tracks complete

## System Integrity & Anti-Capture

- [ ] **ai_self_audit_20260610** — AI Self-Audit & Anti-Capture Loop
  - Automated AI self-audit scanning for all four capture types, SKILL.md-to-implementation drift detection, expired-emergency non-revert and exit-without-export integrity checks, AI independence verification. AI raises findings into SystemFinding model; humans + structural code-level checks resolve. Phased rollout: read-only scans → notifications → evidence bundles → safeguard-trigger integration.
  - Spec: `conductor/tracks/ai_self_audit_20260610/spec.md`
  - Plan: `conductor/tracks/ai_self_audit_20260610/plan.md`
  - Priority: P0
  - Status: Not started (S4 of wave-3 deferred — spec + plan landed in commit `ba85910`, execution held to keep wave-3 commits atomic)
  - Depends on: governance_skill_data_models_20260427, multi_ecosystem_collaboration_20260425, emergency_management_ui_20260427, agent_skill_integration_20260427, exit_portability_ui_20260427

## Codegen & Tooling Infrastructure (Wave-4 surfaced)

- [ ] **db_models_split_20260611** — Split `db/models.py` into per-model files
  - Mechanical refactor: 113 KB monolith → one file per model class under `agent/src/neos_agent/db/models/`. Re-exports preserve every existing import site. Prerequisite for codegen v2's per-model YAML references; also reduces merge churn in multi-stream waves.
  - Spec: `conductor/tracks/db_models_split_20260611/spec.md`
  - Priority: P1 (blocks codegen_v2_yaml_20260611)
  - Status: Not started
  - Depends on: nothing (foundation)

- [ ] **codegen_v2_yaml_20260611** — Codegen v2: YAML-driven skill → tool generation
  - Replace the v1 prose-parsing pipeline (`agent/scratch/codegen/`) with explicit YAML frontmatter in SKILL.md declaring `target_tool`, `model` path, `inputs`, `output_shape`, `dependencies`, `layer`. Eliminates every parser heuristic the wave-3 review patched (type inference, optional-input detection, capture-vector regex). Drift detection becomes "compare YAML to ORM schema" — both sides structured, no AST walk needed. Target: v2 generator ≤500 lines (vs v1 ~1500); drift report on 13-skill set ≤10 actionable findings (vs v1's 888).
  - Spec: `conductor/tracks/codegen_v2_yaml_20260611/spec.md`
  - Priority: P1
  - Status: Not started
  - Depends on: db_models_split_20260611
  - Wave-3 retro: `conductor/retros/wave-3-2026-06-10.md` (L3 lane surfaced this)

- [ ] **exec_tool_integration_20260611** — Wire scratch exec_tool into production agent registry
  - Wave-3 S1 produced a complete, tested, security-reviewed sandboxed Python/Node exec tool at `agent/scratch/exec_tool/` (29/29 tests pass; 3 critical security bugs fixed in L1 review). Currently not registered with any agent code path. This track moves it to production (`agent/src/neos_agent/tools/exec_tool/`), wires `register_exec_tool()` at startup, hardens the default policy (no `os`/`subprocess`/`socket` even in allow-list overrides), and adds audit logging. Phase 1 is minimum viable integration; phases 2-4 cover observability, the `complete_recovery` predicate use case, and rate limiting.
  - Spec: `conductor/tracks/exec_tool_integration_20260611/spec.md`
  - Priority: P1
  - Status: Not started
  - Depends on: ai_self_audit_20260610 (for audit-log integration in Phase 2)
  - Wave-3 retro: `conductor/retros/wave-3-2026-06-10.md`

## Retros

- `conductor/retros/wave-3-2026-06-10.md` — Wave-3 (Emergency Half-Open + exec_tool + codegen pilot + UI parity) + the 4-lane code-review pass. Covers per-stream outcomes, the critical bugs surfaced in review (silent setrlimit failure, PYTHONPATH bypass, post-timeout deadlock, migration NoSuchTableError, setState-in-render), and methodology lessons (code-reviewer agent lacks Edit/Write; tests-pass ≠ production-works; verify artifacts not artifact-count).
