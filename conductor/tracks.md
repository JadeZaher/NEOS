---
type: Track Index
---
# NEOS Tracks

## Active

- [x] **platform_completion_join_gates_20261102** — Completed audited gaps, configured onboarding quiz gates and clear NodeAdmin task navigation; deployed and independently verified on 2026-11-02.
  - Spec: `conductor/tracks/platform_completion_join_gates_20261102/spec.md`
  - Plan: `conductor/tracks/platform_completion_join_gates_20261102/plan.md`
  - Owner policy: entry quizzes are required only where configured; complete and verify ordinary-member, steward and NodeAdmin journeys.

- [~] **governance_matching_ux_enforcement_20260727** — Governance Matching UX Enforcement (collapse + hardening)
  - Two-mode IA (Explore | Ecosystem) collapse shipped + hostile-review sweep; Phase 2 hardening queued (receipts ledger, ceremony backend contracts, fit-check, role tiers). Binding guides: GOVERNANCE-ECOSYSTEM-MATCHING-UX/QA-GUIDE.md.
  - Spec: `conductor/tracks/governance_matching_ux_enforcement_20260727/spec.md`
  - Priority: P0
  - Status: Phase 1 + sweep complete (8 commits, tsc/build green); Phase 2 lanes queued
  - 2026-07-28: Route guidance directive shipped — floating `RouteGuidePanel` (right-edge collapsible rail, accordioned per-route steps grounded in the binding guides) + content map `client/src/lib/route-guides.ts` covering 18 route clusters (agreements, proposals, decisions, ecosystems, domains, members, onboarding, conflicts, exit, emergency, safeguards, compliance, discover, ethos, orientation, me, messaging, dashboard). Uncommitted on main; tsc + build green.
  - 2026-07-28: **ACT gates + decision artifacts shipped (Phase 2 ceremony contracts/receipts).** `act_policy` declared at the record level on proposals AND agreements (min advice rounds, consent required/quorum, declared test cases); central engine `services/act_gates.py` auto-advances status when conditions are met (wired into advice/consent/test submissions, agreement ceremonies + consent attestation; manual forward transitions 409 with gate payload). Completing ACT mints browsable decision artifacts: proposal ratified → `artifact_type="proposal"`; agreement activated → NEW `artifact_type="commitment"`, with members' positions as decision participants (the commitment records). New `POST /agreements/:id/ceremonies` (advice rounds + test evidence), decisions API `artifact_type` filter + source links, migration `j3c9e5f7a1b4` applied to Railway. UI: ActGatesPanel on proposal/agreement details, gate fieldsets on both forms, advice-round checkbox, agreement evidence card, decision artifact filter/badges/source links/commitments card. Reseeded Railway: 24 proposals across all 6 stages gate-consistent (engine-verified), 8 mid-flight agreements, 8 artifacts. Smoke-tested: full auto-advance chain both entity types + artifact minting. Notable: pre-existing unresolvable FK (`quiz_assignments.quiz_id`) silently breaks SQLAlchemy table-level insert ordering — flush before minting artifacts in seeds. tsc + build green; pushed to main.
  - 2026-07-28: **Governing-agreement gate inheritance.** `proposals.governing_agreement_id` (migration `k2f7a4c8e1b5`, applied): proposals with NULL `act_policy` inherit ACT gates from the linked same-ecosystem agreement (own declaration wins → linked agreement → defaults); `gates.policy_source` + effective/stored policy split in detail payloads; PUT explicit-null clears declaration or link. ProposalForm: governing-agreement picker + declare/override toggle; ProposalDetail: agreement link + panel source line; api/AGENTS.md documents the engine contract. Seed: draft/advice proposals now demonstrate inheritance (8/24), renumbered PROP-*-011+ to stop colliding with seed_omnione's 001-003 business ids. Verified: inheritance auto-advance smoke, 24/24 gate-consistent, tsc green.
  - 2026-07-28: **Compliance + audits unbroke.** `/compliance/latest|history` 500'd on serializer reading phantom `version_fingerprint` column (getattr guard now); `/safeguards/audits/:id` 404'd for members — now authorizes via `get_authorized_ecosystem_ids` (binding convention: DETAIL endpoints = membership scope, LIST endpoints = cookie selection); `/compliance/generate` AI call bounded (`asyncio.wait_for(45s)`) with structural fallback. Verified live: latest/history 200, audit detail 200 under excluding selection, generate 201.
  - 2026-07-28: **Skill routing bench shipped + run.** `conductor/benches/skill-routing-bench.md`: one subagent per governance skill (6 skills × 2 prompts). Results: guide-driven-ux-hardening, hermes-conductor, grilling-session, conductor-sync PASS 3/3; project-router + subagent-driven-development PASS with correct composition (grilling-session/kanban-orchestrator co-load by design). Gap found + fixed: roundtable added to project-router inventory/keyword table + grilling-session list (18 projects). Skills updated for ACT gates/inheritance/compliance conventions.
  - 2026-07-28: **MCP exposure for user agents (session-scoped).** `agent_tokens` (migration `l4e8b2d6f3a1`, applied): bearer tokens bound to the minting auth session — logout/expiry/revocation kills the agent; plaintext shown once, sha256 stored. `POST/GET/DELETE /api/v1/agent-tokens`. `neos_agent.mcp_server` (FastMCP streamable-HTTP, `mcp<2` pinned): 15 tools (agreements, proposals, artifacts) reusing the ACT engine; every tool re-resolves live membership; agreement transitions steward-only + evidence-required mirroring the UI. Verified end-to-end via real MCP client: full proposal chain to ratified + artifact, agreement chain to consent with gate blocking activation, steward refusal for plain members, revoked token refused. UI: /me "Agent access" tab (mint/list/revoke + connect snippet).
  - 2026-07-28: **NEW DIRECTIVE — user-owned decision substrate.** Decisions are a common substrate over agreements (active, user accepted), proposals (accepted/ratified), shares (use), needs (serve); individually owned, double as user tasks/todos with follow-up state; users edit ONLY their own decisions; members edit ONLY their own profile. Domain join: backend exists (`POST /domains/:id/participation`) — needs UI surface. Spec: `conductor/tracks/governance_matching_ux_enforcement_20260727/member-decisions-spec.md`. Lanes spawned (backend / frontend). May append.
  - **Overrides:** memory_precedent_ui_20260427 (decisions → transformation-receipts ledger); any alignment-score UI (→ fit-estimate explanation contract); immediate-join semantics (→ request-to-begin-orientation, ceremony-gated lifecycle); conductor(scope) feature-branch cadence for this stream (direct-on-main conventional commits, user-led)

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

- [~] **decision_routing_operator_qa_20261101** ? Typed decision routing and personal-operator QA/UI closure
  - Spec: `conductor/tracks/decision_routing_operator_qa_20261101/spec.md`
  - Plan: `conductor/tracks/decision_routing_operator_qa_20261101/plan.md`
  - Status: In progress; bounded passes 04 and 05; carries prior operator and gold-task gaps.

## Retros

- `conductor/retros/wave-3-2026-06-10.md` — Wave-3 (Emergency Half-Open + exec_tool + codegen pilot + UI parity) + the 4-lane code-review pass. Covers per-stream outcomes, the critical bugs surfaced in review (silent setrlimit failure, PYTHONPATH bypass, post-timeout deadlock, migration NoSuchTableError, setState-in-render), and methodology lessons (code-reviewer agent lacks Edit/Write; tests-pass ≠ production-works; verify artifacts not artifact-count).
