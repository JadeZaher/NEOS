# Implementation Plan: AI Self-Audit & Anti-Capture Loop

## Overview

Four phases with hard gates: (1) Read-only scans into SystemFinding model, (2) Finding-driven notifications, (3) Evidence-bundle generation, (4) Integration with safeguard-trigger flow. Each phase ends with verification that AI write-immutability guarantees hold. Creates the automated detection layer that feeds governance health indicators with real-time evidence while never granting the AI agent authority to modify governance state.

---

## Phase 1: Read-Only Scans → SystemFinding Model

**Goal:** Implement the six automated scanners (four capture types + emergency non-revert + exit no-export), the SKILL.md drift detector, and the SystemFinding data model. All scanners are read-only; they produce findings but trigger no downstream actions.

### Tasks

- [ ] Task 1.1: Create SystemFinding and SystemFindingResolution data models
  - Define `SystemFinding` model with all fields: finding_type enum, severity enum, confidence float, status enum, source_data JSON, evidence_hash, resolution FK, notification fields
  - Define `SystemFindingResolution` model with resolution_type enum, resolved_by FK, resolution_note, governance_action_taken
  - Add constraint: `SystemFinding.status` transitions enforced at API layer (AI agent can only set `open` on creation, never modify status)
  - Create Alembic migration with indexes on finding_type, severity, status, confidence, created_at
  - Add `system_findings_weight` field to existing `GovernanceIndicator` model (default 0.0)
  - Write model tests: verify field constraints, resolution FK integrity, status transition enforcement

- [ ] Task 1.2: Build the four capture-type scanners
  - **Capital capture scanner**: Query resource allocation concentration, funding source dominance, transaction pattern analysis against configurable thresholds
  - **Charisma capture scanner**: Compute member influence scores from decision alignment patterns, cross-reference against formal role permissions, detect informal authority accumulation
  - **Emergency capture scanner**: Cross-reference EmergencyDeclaration duration against PostEmergencyReview completion, detect out-of-scope emergency actions, flag un-reverted emergency authority
  - **Ossification capture scanner**: Detect stagnant proposals (age > threshold), inactive domains (zero governance activity), stuck amendment processes
  - Each scanner outputs typed SystemFinding records with severity, confidence, and source_data references
  - Scanner configuration: threshold values, scan schedules, enabled/disabled flags per ecosystem — stored as JSON config, modifiable only by human-authenticated endpoints
  - Write scanner unit tests: mock governance data, verify correct finding_type, severity, and confidence assignment

- [ ] Task 1.3: Build the emergency-non-revert and exit-no-export integrity scanners
  - **Emergency non-revert scanner**: Query EmergencyDeclaration records where `end_time < NOW()` and no PostEmergencyReview exists with completed status; flag with severity based on time elapsed since expiry
  - **Exit no-export scanner**: Query ExitProcess records where `status = 'completed'` (member exited) but no PortableRecord exists with matching member_id and generation within exit window; flag with severity based on data loss risk
  - Both scanners produce findings with direct source entity references for human investigation
  - Write integration tests: create test data with expired emergencies and exits, verify scanner detection accuracy

- [ ] Task 1.4: Implement SKILL.md ↔ tool implementation drift detector
  - Build SKILL.md parser: extract skill name, required parameters, output schema, workflow steps, confirmation gates from structured markdown
  - Build implementation comparator: cross-reference parsed skill metadata against registered MCP tools, API endpoint signatures, agent routing tables
  - Drift categories: missing_tool, extra_tool, parameter_mismatch, missing_confirmation_gate, stale_skill_md
  - Each drift finding includes the specific SKILL.md section path, the mismatched implementation artifact reference, and a suggested resolution
  - Register git hook trigger: run drift scan on SKILL.md changes (pre-commit or post-merge)
  - Write parser tests with real NEOS SKILL.md files from neos-core/; write comparator tests with mock tool registrations

- [ ] Task 1.5: Create AI independence audit scanner
  - Verify human confirmation gates exist and are active across all governance skill execution paths
  - Detect AI-only workflows: governance actions with no corresponding human confirmation record
  - Monitor AI session data accumulation: flag AgentSession records exceeding configured retention with no cleanup
  - Compute AI influence ratio: agent-generated governance actions / total governance actions per domain per time window
  - Flag when ratio exceeds configurable threshold (default: 0.6 — 60% AI-driven actions trigger warning)
  - Write tests: simulate AI-dominated and human-balanced governance activity, verify correct flagging

- [ ] Task 1.6: Build scanner orchestration and scheduling infrastructure
  - Background job runner: register scanners as scheduled jobs with configurable intervals
  - Scan result aggregation: collect findings from all scanners in a scan cycle, deduplicate (same finding_type + same source_entities within cycle window)
  - Finding deduplication logic: hash-based comparison of finding signatures to prevent duplicate records
  - Scan cycle metadata: log scan start/end times, scanner-by-scanner status, finding counts, errors
  - Read-only API endpoint for AI agent: POST /api/system-findings (create only, status forced to 'open')
  - Write end-to-end tests: run full scan cycle on test data, verify all scanners produce output, verify deduplication, verify AI write constraints

- [ ] Verification: All six scanners produce correctly typed SystemFinding records on test data. Drift detector identifies intentional spec-implementation mismatches in test fixtures. AI agent can create findings but cannot modify status or create resolutions. Deduplication prevents duplicate findings within a scan cycle. All model tests pass.

**Commit:** `conductor(self-audit-phase1): SystemFinding model, six capture scanners, drift detector, AI independence audit, scan orchestration`

---

## Phase 2: Finding-Driven Notifications

**Goal:** Build the notification pipeline that delivers findings to human recipients with severity-based routing, batching, suppression, and escalation. No automated actions — notifications only.

### Tasks

- [ ] Task 2.1: Design notification routing engine
  - Routing rules engine: severity + confidence matrix determines notification channel and timing
  - Critical + high-confidence (≥0.7): immediate notification via all enabled channels
  - Warning + medium-confidence (0.4–0.69): batched into hourly digest
  - Info + any confidence: weekly summary digest only
  - Low-confidence (<0.4): never notified individually; tagged for trend reports only
  - Domain-to-recipient mapping: notifications routed to domain stewards + platform admins based on finding's source domain
  - Write routing engine tests: verify correct channel selection for all severity/confidence combinations

- [ ] Task 2.2: Build in-platform notification UI components
  - Notification center component: list of findings with severity badges, timestamps, and quick-acknowledge actions
  - Finding detail view: full finding description, source data references, resolution options, evidence bundle links
  - Batch acknowledgment: select multiple findings → acknowledge all in one action
  - Unread count badge on main navigation
  - Follow existing notification UI patterns from multi_ecosystem_collaboration PWA notification work
  - Write UI component tests: render states, acknowledgment flow, filter behavior

- [ ] Task 2.3: Implement email digest and PWA push notifications
  - Email digest template: summary of findings since last digest, grouped by severity and domain
  - Digest generation job: runs on configurable schedule (hourly for warning, weekly for info)
  - PWA push integration: critical findings trigger push notifications via existing service worker infrastructure
  - Notification state tracking: update SystemFinding.notified_at and SystemFinding.notified_channels on delivery
  - Write notification delivery tests: verify email generation, push payload format, state tracking

- [ ] Task 2.4: Add user notification preferences and suppression controls
  - Per-user notification preferences: toggle email/push/in-app per severity level
  - Per-domain suppression: users can suppress specific finding_types for specific domains (not globally)
  - Suppression UI: list of active suppressions with expiration and re-enable controls
  - Admin override: platform admins can configure mandatory notification types that bypass user suppression
  - Write preference tests: verify suppression rules, admin override behavior, expiration logic

- [ ] Task 2.5: Implement acknowledgment and escalation logic
  - Acknowledgment: marking a finding as `acknowledged` records the acknowledging member and timestamp
  - Escalation timer: findings in `open` status for >72 hours auto-escalate (bump severity tier in next notification cycle)
  - Escalation notification: escalated findings follow the higher-severity notification routing rules
  - Acknowledgment does NOT resolve the finding — it signals awareness, not closure
  - Write escalation tests: verify timer triggers, severity bump, notification routing change

- [ ] Task 2.6: Build notification audit and delivery tracking
  - Delivery log: record every notification attempt with channel, recipient, timestamp, and delivery status
  - Delivery failure handling: retry with exponential backoff for transient failures; alert admins for persistent failures
  - Notification analytics endpoint: delivery success rates, acknowledgment latency, escalation frequency per domain
  - Write tracking tests: verify delivery log completeness, retry behavior, analytics accuracy

- [ ] Verification: Critical findings trigger immediate notifications across configured channels. Low-confidence findings are suppressed from individual notification. Escalation fires after 72 hours of non-acknowledgment. Users can suppress notifications per finding_type per domain. AI agent cannot trigger notifications directly — only the scanner pipeline can. All notification preference and escalation tests pass.

**Commit:** `conductor(self-audit-phase2): notification routing engine, in-platform UI, email digests, PWA push, suppression controls, escalation logic`

---

## Phase 3: Evidence Bundle Generation

**Goal:** Create the AuditEvidenceBundle model and generation pipeline. Scanners produce verifiable, immutable evidence packages alongside findings. Evidence bundles support human investigation and can be attached to audit reports.

### Tasks

- [ ] Task 3.1: Create AuditEvidenceBundle data model
  - Define `AuditEvidenceBundle` model: bundle_type enum, source_entities JSON, evidence_data JSON, evidence_hash (SHA-256), scan_config JSON, generated_by enum, expires_at, created_at
  - Immutability constraint: evidence_data is append-only — update operations on existing bundles are rejected at API layer
  - Hash computation: evidence_hash computed server-side on bundle creation, verified on read
  - Create Alembic migration with index on finding_id, bundle_type, and created_at
  - Write model tests: verify immutability enforcement, hash computation accuracy, hash verification

- [ ] Task 3.2: Build evidence bundle generation for each scanner type
  - **Capture scan bundles**: snapshot of source entity data at scan time (resource allocations, member influence scores, emergency declarations, proposal pipelines)
  - **Drift scan bundles**: side-by-side diff of SKILL.md parsed spec vs implementation artifact, with line-level mismatch annotation
  - **Integrity scan bundles**: timeline reconstruction of the flagged event (emergency declaration → expiration → missing review; exit request → completion → missing export)
  - **AI independence bundles**: governance action log with AI-vs-human attribution, session data accumulation trace, confirmation gate activity log
  - Each bundle type includes scan configuration that produced it and source entity references
  - Write bundle generation tests: verify bundle completeness for each scanner type, verify hash consistency

- [ ] Task 3.3: Implement evidence hash verification API
  - `GET /api/evidence-bundles/:id/verify`: recomputes SHA-256 of stored evidence_data and compares to stored evidence_hash
  - Returns verification result (match/mismatch) with computed hash and stored hash
  - Verification audit log: each verification attempt is logged with timestamp and requesting member
  - Tamper detection: hash mismatch generates an automatic SystemFinding (finding_type: evidence_integrity_violation)
  - Write verification tests: valid bundles pass, tampered bundles fail and generate findings

- [ ] Task 3.4: Build evidence bundle attachment to audit reports
  - Extend `AuditReport` model: add `evidence_bundle_ids` JSON array field referencing AuditEvidenceBundle records
  - Bundle-to-report linking: when generating an audit report (manual or AI-assisted), evidence bundles for relevant findings are automatically attached
  - Report evidence view: audit report detail UI shows attached evidence bundles with inline preview and hash verification status
  - Write integration tests: verify bundle attachment, report rendering with evidence, hash verification in report context

- [ ] Task 3.5: Add evidence retention and expiration management
  - Configurable retention policy per bundle_type: scan_output (90 days), drift_diff (30 days or until drift is resolved), indicator_snapshot (365 days), timeline_reconstruction (90 days), member_activity (30 days)
  - Expiration job: background job that soft-deletes expired bundles (marks expired, retains hash for audit trail)
  - Retention policy configuration per ecosystem: stored in ecosystem settings, modifiable only by human-authenticated admin endpoints
  - Write retention tests: verify expiration job, policy configuration, hash preservation after expiration

- [ ] Task 3.6: Build evidence bundle management UI
  - Bundle list view: filterable by finding, bundle_type, date range, verification status
  - Bundle detail view: rendered evidence data, verification status badge, source entity deep links
  - Bundle download: export evidence bundle as JSON with embedded hash for offline verification
  - Hash verification trigger: manual "Verify Integrity" button recomputes and displays hash comparison
  - Write UI component tests: bundle rendering, filter behavior, download and verification flows

- [ ] Verification: All scanner types produce evidence bundles with correct hashes. Hash verification API correctly identifies tampered bundles and generates integrity-violation findings. Expired bundles are soft-deleted per retention policy. Evidence bundles attach to audit reports and render correctly in UI. All bundle tests pass.

**Commit:** `conductor(self-audit-phase3): evidence bundle model, per-scanner generation, hash verification, report attachment, retention management`

---

## Phase 4: Safeguard Trigger Integration

**Goal:** Wire SystemFinding output into the existing SafeguardTrigger pipeline. When findings cross configured thresholds, safeguard actions fire automatically. All trigger configuration is human-only. AI agent cannot modify or dismiss safeguard triggers.

### Tasks

- [ ] Task 4.1: Build finding-to-safeguard trigger mapping engine
  - Trigger configuration model: per-ecosystem rules mapping finding_type + severity + time-window thresholds to safeguard actions
  - Example rule: "3+ critical emergency_capture findings in 24 hours → fire domain_activity_freeze safeguard for affected domain"
  - Example rule: "1+ critical ai_independence finding → fire agent_restriction safeguard (reduce AI autonomy in affected domain)"
  - Configuration API: human-authenticated only; AI agent requests rejected with 403
  - Default trigger set: pre-configured sensible defaults that ecosystems can override
  - Write mapping engine tests: verify rule evaluation, threshold counting, action dispatch

- [ ] Task 4.2: Integrate with existing SafeguardTrigger pipeline
  - Extend `SafeguardTrigger` model: add `triggered_by_findings` JSON array field referencing SystemFinding IDs
  - Extend safeguard action types: add domain_activity_freeze, agent_restriction, mandatory_audit_request, notification_escalation
  - Trigger firing: when finding count crosses threshold, create SafeguardTrigger record with full traceability to triggering findings
  - Action execution: dispatch safeguard actions through existing safeguard action pipeline
  - Write integration tests: seed findings at threshold counts, verify trigger creation and action dispatch

- [ ] Task 4.3: Implement safeguard action handlers
  - **Domain activity freeze**: temporarily suspend proposal advancement and agreement modification in affected domain; admin-only unfreeze
  - **Agent restriction**: reduce AI agent autonomy level in affected domain — require human confirmation for all agent-suggested governance actions
  - **Mandatory audit request**: auto-generate AuditRequest for the affected domain with pre-populated scope based on finding patterns
  - **Notification escalation**: escalate notification routing for all findings in affected domain to immediate critical channel
  - All action handlers log execution with timestamps and actor attribution
  - Write action handler tests: verify domain state changes, agent autonomy reduction, audit request generation

- [ ] Task 4.4: Build trigger configuration management UI
  - Trigger rules editor: create/edit/delete trigger rules with condition builder (finding_type, severity, count, time_window) and action selector
  - Rule testing interface: "Test this rule" runs rule evaluation against current findings and shows whether it would fire
  - Active triggers dashboard: list of configured triggers with last-fired timestamp, fire count, and enabled/disabled toggle
  - Trigger history view: timeline of all trigger firings with linked findings and executed actions
  - Human-only access enforcement: UI components for trigger management are only rendered for human-authenticated sessions with admin role
  - Write UI tests: rule CRUD, test evaluation rendering, dashboard states, access control

- [ ] Task 4.5: Add GHI indicator auto-adjustment from system findings
  - Indicator score recalculation: when findings are created/updated in a domain, affected GHI indicators recompute their scores incorporating system_findings_weight
  - Weight configuration: per-ecosystem, per-indicator configuration of how heavily system findings influence the indicator score
  - Threshold breach: if indicator score crosses safeguard threshold due to system findings contribution, fire through existing SafeguardTrigger pipeline
  - AI influence indicator: dedicated indicator tracking AI-vs-human governance action ratio; auto-fires agent_restriction if AI influence exceeds configured maximum
  - Write integration tests: seed findings, verify indicator score changes, verify safeguard threshold breaches

- [ ] Task 4.6: Implement override protection and audit trail for finding-triggered safeguards
  - Override protection: safeguard triggers fired by system findings require multi-party acknowledgment (minimum 2 human members with steward role)
  - Cannot be dismissed by the AI agent — API rejects AI-authenticated dismissal requests for these triggers
  - Full audit trail: trigger creation → action execution → acknowledgment → resolution, all linked back to triggering SystemFinding records
  - Trigger resolution reporting: generates report summarizing the trigger, actions taken, resolution, and timeline
  - Write protection tests: verify multi-party requirement, AI dismissal rejection, audit trail completeness

- [ ] Verification: Finding threshold breaches fire correct safeguard actions. Trigger configuration is human-only. AI agent cannot modify triggers or dismiss finding-triggered safeguards. GHI indicators adjust scores based on system findings. Override protection enforces multi-party acknowledgment. Full audit trail links triggers to findings to actions to resolution. All integration tests pass.

**Commit:** `conductor(self-audit-phase4): safeguard trigger integration, action handlers, trigger config UI, GHI indicator auto-adjustment, override protection`

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 6 + verification | SystemFinding model, six scanners, drift detector, AI independence audit, orchestration |
| 2 | 6 + verification | Notification routing, in-platform UI, email/PWA push, suppression, escalation |
| 3 | 6 + verification | Evidence bundle model, per-scanner generation, hash verification, retention management |
| 4 | 6 + verification | Safeguard trigger mapping, action handlers, trigger config UI, GHI integration, override protection |
| **Total** | **24 + 4 verifications** | Complete AI self-audit loop with structural anti-capture guarantees |

## Dependencies

- **Phase 1 must complete first** — establishes the SystemFinding model and scanners that all other phases consume
- Phase 2 (notifications) depends on Phase 1 for finding data
- Phase 3 (evidence bundles) depends on Phase 1 for finding data; can run in parallel with Phase 2
- Phase 4 (safeguard integration) depends on Phase 1 (findings), Phase 2 (notifications for escalation actions), and Phase 3 (evidence bundles for trigger context)
- **governance_skill_data_models_20260427**: SystemFinding model extends patterns established here; GHI indicator models (GovernanceIndicator, SafeguardTrigger, AuditReport) are prerequisites for Phases 1 and 4; EmergencyDeclaration and PostEmergencyReview models are prerequisites for the emergency-non-revert scanner
- **multi_ecosystem_collaboration_20260425**: Notification infrastructure (PWA push, cron jobs), AI independence patterns (OpenRouter/LiteLLM, AI-optional design), ComplianceSummary model for trend reports
- **emergency_management_ui_20260427**: Emergency Half-Open patch and PostEmergencyReview workflows are prerequisites for the emergency capture and non-revert scanners
- **agent_skill_integration_20260427**: MCP tool catalog and agent routing tables are prerequisites for the SKILL.md drift detector in Phase 1
- **exit_portability_ui_20260427**: ExitProcess and PortableRecord models are prerequisites for the exit-no-export scanner

## Critical Path

Phase 1 → Phase 2 + Phase 3 (parallel) → Phase 4

## Pattern Leverage

- **Background jobs**: Using cron patterns from multi_ecosystem_collaboration_20260425 for scanner scheduling
- **Notification infrastructure**: Extending PWA push and email digest patterns from multi_ecosystem_collaboration_20260425
- **React Query hooks**: Following existing use-governance.ts patterns for finding and evidence bundle data fetching
- **Form patterns**: Following existing validation and error handling for trigger configuration UI
- **Safeguard pipeline**: Extending existing SafeguardTrigger model and action dispatch from governance_skill_data_models_20260427
- **AI-optional design**: All components work without AI; AI accelerates but never replaces human decision

## Quality Standards

- **10% test coverage** focused on scanner accuracy, notification routing, evidence integrity, and safeguard trigger behavior
- **AI write immutability**: Enforced at API authorization layer with automated tests verifying AI agent cannot modify findings, resolutions, triggers, or governance state
- **False positive management**: Confidence scoring on every finding; <15% false positive rate target after human review
- **Alert fatigue prevention**: Batching, suppression, and confidence-tier routing keep signal-to-noise ratio high; target ≤3 critical notifications per domain per day
- **Evidence integrity**: Cryptographic hashes on all evidence bundles; tamper detection generates its own findings
- **Override protection**: Multi-party acknowledgment required for finding-triggered safeguards; AI dismissal rejected at API layer
- **Audit trail completeness**: Every scanner output, notification, evidence bundle, and safeguard action is fully traceable back to source data
