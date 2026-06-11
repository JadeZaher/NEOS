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

- [ ] **emergency_management_ui_20260427** — Emergency Management UI
  - Build UI for defining emergency criteria, setting up pre-authorization protocols, declaring emergencies, managing emergency authority, and conducting post-emergency reviews.
  - Spec: `conductor/tracks/emergency_management_ui_20260427/spec.md`
  - Plan: `conductor/tracks/emergency_management_ui_20260427/plan.md`
  - Priority: P1
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427

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
  - Status: Not started
  - Depends on: governance_skill_data_models_20260427, multi_ecosystem_collaboration_20260425, emergency_management_ui_20260427, agent_skill_integration_20260427, exit_portability_ui_20260427
