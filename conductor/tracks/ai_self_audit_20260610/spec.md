# Specification: AI Self-Audit & Anti-Capture Loop

This track is a *structural anti-capture mechanism*, not a replacement for human judgment and not a grant of unilateral authority to any single actor — AI included. The AI agent is one check among several in a layered defense: code-level safeguards, human oversight, community processes, and now an automated audit loop that surfaces anomalies for human resolution. The moment the AI audit system becomes the most powerful actor in the governance stack — overriding human decisions, silently adjusting thresholds, or marking its own findings as resolved — it has become the capture vector it was designed to detect. This track's architecture embeds that constraint at the data-model level: the AI can only *raise* findings, never *modify* governance state.

## Overview

Create an autonomous AI self-audit loop that continuously scans the NEOS platform for governance capture signals, spec-to-implementation drift, and procedural integrity violations. The system surfaces `SystemFinding` records for human review, generates `AuditEvidenceBundle` artifacts for investigation, and integrates with the existing safeguard-trigger pipeline — but never closes findings or alters governance state unilaterally.

## Background

NEOS defines four capture types (capital, charisma, emergency, ossification) and implements structural safeguards against each. However, there is currently no automated mechanism to verify that these safeguards are *working in practice*. Key risks that require continuous monitoring:

- **Capture detection gaps**: Emergency powers that were not auto-reverted after expiration, charisma-based influence accumulating without formal authority, capital concentration distorting resource allocation
- **Spec-to-implementation drift**: SKILL.md definitions diverging from their corresponding tool implementations, making governance processes execute differently than specified
- **Procedural integrity violations**: Exit requests with no portable record export generated, audit teams lacking verified independence, proposals advancing without proper consent phases
- **AI soft-authority creep**: AI recommendations becoming de facto decisions, AI-only workflows bypassing human confirmation steps, agent session data persisting beyond its intended lifecycle

The governance health audit skill (GHI) provides indicator definitions and scoring — this track builds the *automated detection layer* that feeds those indicators with real-time evidence.

## Decisions (Resolved)

1. **AI raises, humans resolve**: The AI self-audit loop can create `SystemFinding` records, attach evidence, and trigger notifications. It cannot mark findings as resolved, modify governance state, or override safeguard decisions. Resolution always requires human action.
2. **Phased rollout with hard gates**: Read-only scans first (Phase 1), then notifications (Phase 2), evidence bundles (Phase 3), safeguard-trigger integration (Phase 4). Each phase gates on verification of the prior phase's non-interference guarantees.
3. **SystemFinding as the core data model**: All audit outputs flow through a single `SystemFinding` model with typed finding categories, confidence scores, and resolution tracking. No ad-hoc alert channels.
4. **Drift detection is a first-class concern**: The spec-to-implementation drift scanner compares SKILL.md skill definitions against live tool registrations and execution traces. Mismatches generate findings with the exact diff.
5. **AI independence audit is mandatory**: Every audit cycle includes an independence check — verifying that the AI agent is not the sole actor in any governance decision path, that human confirmation gates exist, and that AI session data is not accumulating unchecked.
6. **False positive management via confidence tiers**: Every finding carries a confidence score (0.0–1.0). Low-confidence findings batch into digest summaries; high-confidence findings trigger immediate notifications. Corroboration from multiple scan types increases confidence.
7. **Evidence bundles are immutable and verifiable**: Generated evidence bundles include cryptographic hashes of source data, timestamps, and the scan configuration that produced them. They are append-only.

## Functional Requirements

### FR-1: Four-Capture-Type Detection Scans
**Description:** Implement automated scanners for all four capture types plus two procedural integrity checks — expired emergency non-revert and exit-without-export.
**Acceptance Criteria:**
- **Capital capture scan**: Detects resource allocation concentration above configurable thresholds, funding source dominance, and economic transaction patterns indicative of influence purchasing
- **Charisma capture scan**: Detects informal authority accumulation — member influence scores exceeding their formal role permissions, decisions repeatedly aligning with a single member's position, governance participation patterns skewed by personality rather than process
- **Emergency capture scan**: Detects emergency declarations that exceed their pre-authorized duration without reversion, emergency actions taken outside declared scope, and emergency authority that persists beyond post-emergency review completion
- **Ossification capture scan**: Detects proposal pipelines with stagnant items exceeding configurable age thresholds, domains with zero governance activity in N cycles, amendment processes that never complete
- **Expired-emergency non-revert scan**: Specialized scan cross-referencing `EmergencyDeclaration.end_time` against `PostEmergencyReview.completed_at` — flags declarations where the emergency window closed but no reversion review was conducted
- **Exit-without-export scan**: Cross-references `ExitProcess` records against `PortableRecord` generation — flags exit requests where no portable record was generated within the exit window
- Each scan produces structured findings with: finding_type, severity (info/warning/critical), confidence (0.0–1.0), source_data reference, and human-readable description
- Scans run on a configurable schedule (default: hourly for critical, daily for standard, weekly for trend analysis)

### FR-2: SKILL.md ↔ Tool Implementation Drift Detection
**Description:** Build a drift scanner that compares SKILL.md governance skill definitions against live tool registrations and execution traces.
**Acceptance Criteria:**
- Parser extracts structured skill metadata from SKILL.md files: skill name, required parameters, output schema, workflow steps, human confirmation gates
- Comparator cross-references extracted metadata against: registered MCP tools, API endpoint signatures, agent routing tables, and execution logs
- Drift categories: missing tool (SKILL.md specifies a tool with no implementation), extra tool (tool exists with no corresponding SKILL.md), parameter mismatch (signature differs), missing confirmation gate (SKILL.md requires human confirmation but tool executes without it), stale SKILL.md (tool changed but spec not updated)
- Each drift finding includes: the specific SKILL.md section, the mismatched implementation artifact, and a suggested resolution path
- Drift scan runs on every SKILL.md change (git hook trigger) and on a daily baseline schedule

### FR-3: SystemFinding Data Model
**Description:** Create the `SystemFinding` model as the canonical output of all audit scans with typed categories, confidence scoring, and resolution tracking.
**Acceptance Criteria:**
- `SystemFinding` model fields:
  - `id`: UUID primary key
  - `finding_type`: enum — capital_capture, charisma_capture, emergency_capture, ossification_capture, emergency_non_revert, exit_no_export, spec_drift, ai_independence, procedural_integrity, indicator_threshold_breach
  - `severity`: enum — info, warning, critical
  - `confidence`: float (0.0–1.0), indexed
  - `title`: string, human-readable summary
  - `description`: text, detailed finding narrative
  - `source_scan`: string, which scanner produced this finding
  - `source_data`: JSON, references to source records (e.g., emergency_declaration_id, domain_id)
  - `evidence_hash`: string, SHA-256 of source data at scan time
  - `status`: enum — open, acknowledged, in_review, resolved, dismissed, false_positive
  - `resolution_id`: FK to SystemFindingResolution (nullable)
  - `notified_at`: timestamp of first notification
  - `notified_channels`: JSON array of notification channels used
  - `created_at`, `updated_at`: standard timestamps
  - `agent_session_id`: FK to AgentSession (nullable — present when AI agent generated the finding)
  - `version`: integer, auto-increment on update
- API endpoints: create (scanner-only, write-restricted), list (filterable by type/severity/status/confidence), get by ID, batch create for bulk scan output
- Alembic migration with appropriate indexes on finding_type, severity, status, confidence, and created_at

### FR-4: SystemFindingResolution Data Model
**Description:** Create the `SystemFindingResolution` model to track human-driven resolution of audit findings.
**Acceptance Criteria:**
- `SystemFindingResolution` model fields:
  - `id`: UUID primary key
  - `finding_id`: FK to SystemFinding
  - `resolution_type`: enum — human_confirmed_valid, human_dismissed, auto_healed (drift resolved by code change), mitigated, accepted_risk
  - `resolved_by`: FK to Member (the human who resolved)
  - `resolution_note`: text, human-written explanation
  - `evidence_attachments`: JSON, references to supporting documents
  - `governance_action_taken`: text, what concrete action was taken
  - `created_at`: timestamp
  - `version`: integer
- Constraint: resolution can only be created by an authenticated human member, never by the AI agent
- API endpoint: create resolution (member-only), read resolution, list resolutions for a finding
- Audit trail: resolution creation is logged with the resolving member's identity and timestamp

### FR-5: AuditEvidenceBundle Data Model
**Description:** Create the `AuditEvidenceBundle` model for generating immutable, verifiable evidence packages that support findings.
**Acceptance Criteria:**
- `AuditEvidenceBundle` model fields:
  - `id`: UUID primary key
  - `finding_id`: FK to SystemFinding (nullable — bundles can exist independently for pre-investigation)
  - `bundle_type`: enum — scan_output, drift_diff, indicator_snapshot, timeline_reconstruction, member_activity
  - `source_entities`: JSON array of referenced entity types and IDs
  - `evidence_data`: JSON, the structured evidence
  - `evidence_hash`: string, SHA-256 of evidence_data
  - `scan_config`: JSON, the configuration that produced this bundle
  - `generated_by`: enum — ai_scanner, manual, scheduled_job
  - `expires_at`: timestamp (nullable — evidence can auto-expire for data retention compliance)
  - `created_at`: timestamp
- Bundles are append-only — once created, evidence_data is immutable
- API endpoints: create (scanner or member), get by ID (returns full evidence), list for finding, verify (recomputes hash and confirms integrity)
- Evidence bundles can be attached to AuditReport records for governance health audits

### FR-6: Governance Health Indicator Integration
**Description:** Wire SystemFinding output into the existing GHI (Governance Health Indicator) scoring pipeline so that automated findings feed indicator scores.
**Acceptance Criteria:**
- Each of the 8 GHI indicators receives a `system_findings_weight` configuration — how much automated findings contribute to the indicator score
- Indicator score auto-adjustment: when new findings are created in an indicator's domain, the indicator score is recalculated within the scan cycle
- Threshold breach: if an indicator crosses its safeguard threshold due to automated findings, the safeguard trigger fires through the existing SafeguardTrigger pipeline
- Finding-to-indicator mapping is configurable per ecosystem: each ecosystem can define which finding_types map to which indicators
- AI independence indicator: a dedicated indicator tracks the ratio of AI-generated vs human-confirmed governance actions, flagging when AI influence exceeds configurable bounds

### FR-7: Notification & Escalation Pipeline
**Description:** Build a notification pipeline that delivers findings to appropriate human recipients based on severity, confidence, and domain context.
**Acceptance Criteria:**
- Notification channels: in-platform notification, email digest, PWA push (per existing notification infrastructure from multi_ecosystem_collaboration)
- Routing rules:
  - Critical + high-confidence: immediate notification to domain stewards + platform administrators
  - Warning + medium-confidence: batched into hourly digest
  - Info + any confidence: weekly summary digest only
  - Low-confidence findings (below 0.4): never notify individually; included only in trend reports
- Suppression: users can suppress notifications per finding_type per domain (not globally — prevents hiding critical signals)
- Escalation: findings unacknowledged for >72 hours escalate to next severity tier in notifications
- Notification state tracked in SystemFinding.notified_at and SystemFinding.notified_channels

### FR-8: Safeguard Trigger Integration
**Description:** Integrate SystemFinding output with the existing SafeguardTrigger pipeline so that automated findings can fire safeguard actions.
**Acceptance Criteria:**
- Finding-triggered safeguards: when a finding matches a configured trigger condition (e.g., "3+ critical emergency_capture findings in 24 hours"), the corresponding safeguard action fires
- Safeguard actions: notification escalation, domain activity freeze (temporary), mandatory audit request auto-generation, agent interaction restriction (reduce AI autonomy in affected domain)
- Trigger configuration per ecosystem: each ecosystem defines which findings trigger which safeguards, with human-only configuration (AI cannot modify trigger thresholds)
- Override protection: safeguard triggers fired by system findings cannot be dismissed by the AI agent; only human members with appropriate roles can acknowledge and dismiss
- Trigger audit trail: all safeguard firings linked back to the triggering findings with full traceability

## Non-Functional Requirements

### NFR-1: AI Write Immutability
The AI agent must never have database write access to SystemFinding.status, SystemFindingResolution, SafeguardTrigger configuration, or any governance state table. This is enforced at the API authorization layer — AI-authenticated requests are read-only for these endpoints. Violation attempts are logged and themselves generate SystemFinding records.

### NFR-2: Audit Independence Verification
Every audit scan cycle includes a self-check: is the AI agent operating with appropriate constraints? The independence verifier confirms that human confirmation gates exist and are active, that AI session data is not accumulating beyond configured retention, and that no single actor (human or AI) has accumulated findings-resolution authority.

### NFR-3: Scan Performance
Critical scans (emergency_capture, emergency_non_revert) complete within 30 seconds. Standard scans (capital, charisma, ossification) within 5 minutes. Drift scan within 2 minutes per 100 SKILL.md files. Scans must not block API request processing — they run as background jobs.

### NFR-4: Alert Fatigue Mitigation
The confidence-tier system, batching, and suppression rules are designed to keep the signal-to-noise ratio high. Target: no more than 3 critical notifications per domain per day under normal operation. False positive rate target: <15% of findings marked as false_positive after human review.

### NFR-5: Evidence Integrity
All evidence bundles include cryptographic hashes. Evidence hash verification is available via API. Tampered evidence is detectable and generates its own SystemFinding (finding_type: evidence_integrity_violation).

### NFR-6: Configurability Without AI Modification
Scan schedules, confidence thresholds, notification routing rules, and finding-to-indicator mappings are configurable per ecosystem — but only through human-authenticated configuration endpoints. The AI cannot adjust its own audit parameters.

## Technical Considerations

- Alembic migrations for SystemFinding, SystemFindingResolution, AuditEvidenceBundle models
- Background job infrastructure for scheduled scans (leveraging existing cron patterns from multi_ecosystem_collaboration)
- Read-only API key scope for AI agent audit endpoints
- PostgreSQL index strategy for efficient scan queries across large governance datasets
- SKILL.md parser must be resilient to markdown format variations — use the existing validation script patterns from neos-core/scripts/
- Drift detection relies on the MCP tool registration endpoint and API route introspection — must integrate with agent_skill_integration_20260427 tool catalog
- Evidence bundle storage: JSON in PostgreSQL JSONB columns with hash indexing for integrity verification
- Finding deduplication: scans must detect and suppress duplicate findings (same finding_type, same source entities, same scan cycle) to prevent notification spam
