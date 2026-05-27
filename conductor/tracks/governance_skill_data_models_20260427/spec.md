# Specification: Governance Skill Data Models & Agent Support

## Overview

Create comprehensive data models and backend support for all NEOS governance skills. This track establishes the data foundation that enables the AI agent to execute sophisticated governance processes and provides the API contracts that UI components need for structured data collection and workflow management.

## Background

The NEOS operating system defines 54 governance skills across 10 layers, but the current data models only support basic CRUD operations. The AI agent needs structured data models that match the skill definitions to:

- Guide users through complex governance processes
- Store process artifacts in standardized formats
- Support agent-driven workflows with proper state management
- Enable cross-skill data sharing and precedent systems

## Decisions (Resolved)

1. **Skill-aligned data models**: Each data model directly corresponds to a governance skill's input/output requirements
2. **Agent-first design**: Data structures optimized for agent execution, with UI as secondary consumer
3. **Structured JSON fields**: Use JSON fields for flexible, skill-specific data while maintaining relational integrity
4. **Version control**: All governance entities support versioning for audit trails and precedent tracking
5. **Cross-skill references**: Models include foreign keys to enable skill interoperability
6. **Agent session support**: Models track agent involvement and session data for workflow continuity

## Functional Requirements

### FR-1: Harm Circle Data Models
**Description**: Create data models for harm circle execution including parties, preparation conversations, safety assessments, facilitation plans, and repair agreements.
**Acceptance Criteria:**
- `HarmCircle` model: circle metadata, convener, timeline, safety flags
- `HarmCircleParticipant` model: person harmed, person who caused harm, affected members, roles
- `HarmCircleRound` model: round type (what happened, impact, repair), content, facilitator notes
- `PreparationConversation` model: private conversations with each party
- `SafetyAssessment` model: participation safety evaluations
- `RepairAgreement` model: commitments, timelines, follow-up schedules
- API endpoints for all CRUD operations with agent session tracking

### FR-2: Governance Health Audit Data Models
**Description**: Create data models for governance health audits including indicator definitions, scoring workflows, and audit reports.
**Acceptance Criteria:**
- `GovernanceIndicator` model: 8 health indicators with definitions, thresholds, scoring methods
- `AuditRequest` model: audit initiation with co-signers, scope, timeline
- `AuditTeam` model: appointed auditors, independence verification
- `IndicatorScore` model: individual indicator scores with evidence and reasoning
- `AuditReport` model: compiled findings, recommendations, trend analysis
- `SafeguardTrigger` model: automated triggers based on indicator thresholds
- API endpoints supporting audit workflow state management

### FR-3: Emergency Management Data Models
**Description**: Create data models for emergency criteria, pre-authorization protocols, and emergency response workflows.
**Acceptance Criteria:**
- `EmergencyCriteria` model: trigger conditions, severity levels, automatic actions
- `PreAuthorization` model: role-based emergency authorities, time limits, oversight requirements
- `EmergencyDeclaration` model: declaration process, criteria justification, authority activation
- `EmergencyAction` model: logged actions during emergency with approval tracking
- `PostEmergencyReview` model: recovery assessment, authority reversion, lessons learned
- API endpoints with emergency state management and audit trails

### FR-4: ACT Test Phase Data Models
**Description**: Create data models for complete ACT process including test phase success criteria, reporting, and outcome tracking.
**Acceptance Criteria:**
- `ProposalTest` model: test duration, start/end dates, success criteria definitions
- `SuccessCriterion` model: metric, baseline, target, measurement method
- `TestReport` model: observations, midpoint findings, modifications, final outcome
- `TestOutcome` model: success/failure determination with evidence
- Enhanced `Proposal` model with test phase state management
- API endpoints supporting test workflow progression

### FR-5: Culture Code & Domain Hierarchy Data Models
**Description**: Enhance domain models with culture codes, hierarchy support, and structured elements.
**Acceptance Criteria:**
- Enhanced `Domain` model: domain_type enum, parent_domain_id, culture_code JSON, culture_code_version
- `DomainElement` model: structured components within domains
- `DomainMetric` model: measurable success indicators with targets
- `DomainMembership` model: member roles, capacity tracking, status management
- `CultureCode` model: versioned culture code templates and instances
- API endpoints for hierarchical domain operations and culture code management

### FR-6: Economic Coordination Data Models
**Description**: Create data models for resource allocation, commons monitoring, and funding coordination.
**Acceptance Criteria:**
- `ResourceAllocation` model: funding sources, allocation decisions, tracking
- `CommonsHealth` model: resource health indicators, monitoring data
- `FundingPool` model: pool governance, distribution rules, stewardship
- `ParticipatoryAllocation` model: allocation proposals, voting mechanisms
- `EconomicTransaction` model: all economic activities with audit trails
- API endpoints supporting economic coordination workflows

### FR-7: Memory & Precedent System Data Models
**Description**: Create data models for decision records, precedent tracking, and semantic search.
**Acceptance Criteria:**
- `DecisionRecord` model: structured decision documentation with context
- `Precedent` model: indexed decisions with semantic tags and search metadata
- `AgreementVersion` model: version control for all governance agreements
- `SemanticTag` model: tagging system for governance entities
- `PrecedentSearch` model: search queries and result tracking
- API endpoints supporting precedent-guided governance

### FR-8: Exit Portability Data Models
**Description**: Create data models for commitment unwinding, portable records, and re-entry integration.
**Acceptance Criteria:**
- `Commitment` model: trackable commitments with unwinding procedures
- `PortableRecord` model: exportable governance history and credentials
- `ExitProcess` model: structured exit workflows with stakeholder coordination
- `ReEntryIntegration` model: re-entry assessment and reintegration plans
- `CommitmentUnwinding` model: systematic commitment resolution tracking
- API endpoints supporting exit portability workflows

## Non-Functional Requirements

### NFR-1: Agent Session Tracking
All models must support agent session tracking for workflow continuity and audit trails.

### NFR-2: Skill Metadata
Each model includes skill reference fields to track which governance skills created or modified the data.

### NFR-3: Version Control
All governance entities support version control with automatic incrementing and change tracking.

### NFR-4: Cross-Skill References
Models include foreign key relationships to enable skill interoperability and data sharing.

### NFR-5: JSON Flexibility
Use JSON fields for skill-specific structured data while maintaining relational integrity for core relationships.

### NFR-6: Audit Trail
Complete audit trails for all governance data changes with agent attribution.

## Technical Considerations

- Alembic migrations for all new models and field additions
- JSON schema validation for structured skill data
- Agent session foreign keys for workflow tracking
- Version fields with automatic increment triggers
- Cross-skill foreign key relationships
- Comprehensive API documentation with skill context
- Test coverage for all new models and relationships