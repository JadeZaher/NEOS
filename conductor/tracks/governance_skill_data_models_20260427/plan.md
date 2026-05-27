# Implementation Plan: Governance Skill Data Models & Agent Support

## Overview

Four phases: (1) Core governance entities, (2) Skill-specific models, (3) Agent integration, (4) API completion. Each phase ends with verification and a commit. Creates the data foundation for all governance skills with agent-first design.

---

## Phase 1: Core Governance Entities

**Goal:** Create foundational data models that support multiple governance skills with proper relationships and agent session tracking.

### Tasks

- [ ] Task 1.1: Create base governance models with agent session support
  - Add `agent_session_id` UUID field to all governance models for workflow continuity
  - Create `skill_reference` field to track which governance skill created/modified data
  - Add `version` integer field with auto-increment trigger to key governance entities
  - Create `GovernanceEntity` base class with common audit fields

- [ ] Task 1.2: Enhance Member and Domain models for skill support
  - Add `governance_roles` JSON field to Member model (facilitator, steward, auditor, etc.)
  - Add `domain_type` enum to Domain model (circle, ethos, shur, working_group, committee)
  - Add `parent_domain_id` self-referential FK for domain nesting
  - Add `culture_code` JSON field and `culture_code_version` to Domain model

- [ ] Task 1.3: Create cross-skill relationship models
  - `EntityRelationship` model: generic relationships between governance entities
  - `SkillExecution` model: track skill execution instances and outcomes
  - `WorkflowState` model: generic workflow state management for skills
  - `AuditTrail` model: comprehensive audit logging for all governance changes

- [ ] Task 1.4: Add version control infrastructure
  - Create version control triggers for Agreement, Domain, Proposal models
  - Add `version_history` JSON field for change tracking
  - Create `Version` model for managing entity versions
  - Add API endpoints for version comparison and rollback

- [ ] Task 1.5: Write tests for core models and relationships
  - Test agent session tracking across models
  - Test version control functionality
  - Test cross-skill relationships
  - Test domain hierarchy and culture codes

- [ ] Verification: Core models support agent workflows, version control works, relationships established. Tests pass.

**Commit:** `conductor(data-models-core): agent session tracking, version control, domain hierarchy, culture codes`

---

## Phase 2: Skill-Specific Data Models

**Goal:** Create specialized data models for each governance skill area with structured JSON fields and workflow support.

### Tasks

- [ ] Task 2.1: Harm circle data models
  - `HarmCircle`: circle metadata, convener, timeline, safety flags
  - `HarmCircleParticipant`: roles (harmed, caused_harm, affected), consent status
  - `PreparationConversation`: private conversations, safety assessments
  - `HarmCircleRound`: round_type enum, content, facilitator notes
  - `RepairAgreement`: commitments, timelines, follow-up schedules

- [ ] Task 2.2: Governance audit data models
  - `GovernanceIndicator`: 8 indicators with thresholds and scoring methods
  - `AuditRequest`: co-signers, scope, timeline, independence verification
  - `AuditTeam`: appointed members, qualifications, conflicts
  - `IndicatorScore`: individual scores with evidence and trend analysis
  - `AuditReport`: compiled findings, recommendations, safeguard triggers

- [ ] Task 2.3: Emergency management data models
  - `EmergencyCriteria`: trigger conditions, severity levels, auto-actions
  - `PreAuthorization`: role authorities, time limits, oversight
  - `EmergencyDeclaration`: justification, authority activation, timeline
  - `EmergencyAction`: logged actions with approval tracking
  - `PostEmergencyReview`: recovery assessment, lessons learned

- [ ] Task 2.4: ACT test phase data models
  - `ProposalTest`: test duration, success criteria definitions
  - `SuccessCriterion`: metric, baseline, target, measurement method
  - `TestReport`: observations, midpoint findings, modifications
  - `TestOutcome`: success determination with evidence
  - Enhance Proposal model with test phase states

- [ ] Task 2.5: Economic coordination data models
  - `ResourceAllocation`: funding sources, decisions, tracking
  - `CommonsHealth`: resource indicators, monitoring data
  - `FundingPool`: governance, distribution rules, stewardship
  - `ParticipatoryAllocation`: proposals, voting, outcomes
  - `EconomicTransaction`: audit trails for all activities

- [ ] Task 2.6: Memory and precedent data models
  - `DecisionRecord`: structured documentation with context
  - `Precedent`: indexed decisions with semantic tags
  - `SemanticTag`: tagging system for governance entities
  - `PrecedentSearch`: queries, results, usage tracking
  - Enhance Agreement model with version control

- [ ] Task 2.7: Exit portability data models
  - `Commitment`: trackable commitments with unwinding procedures
  - `PortableRecord`: exportable governance history
  - `ExitProcess`: structured workflows with coordination
  - `ReEntryIntegration`: assessment and reintegration plans
  - `CommitmentUnwinding`: systematic resolution tracking

- [ ] Task 2.8: Generate Alembic migrations for all new models
  - Create migration files for all new tables and relationships
  - Add indexes for performance on frequently queried fields
  - Add constraints for data integrity
  - Test migrations on development database

- [ ] Task 2.9: Write comprehensive tests for skill models
  - Test all new models and relationships
  - Test JSON field validation and structure
  - Test workflow state transitions
  - Test cross-skill data sharing

- [ ] Verification: All skill-specific models created with proper relationships, JSON schemas validated, migrations successful, tests pass.

**Commit:** `conductor(data-models-skills): harm circles, audits, emergencies, ACT testing, economic, memory, exit models`

---

## Phase 3: Agent Integration & Workflow Support

**Goal:** Add agent-specific fields, workflow management, and skill execution tracking to all data models.

### Tasks

- [ ] Task 3.1: Add agent workflow fields to all models
  - `agent_guidance` JSON field for storing agent instructions and context
  - `workflow_state` enum for tracking process progression
  - `agent_session_data` JSON for maintaining agent context across interactions
  - `skill_execution_id` FK to SkillExecution model

- [ ] Task 3.2: Create skill execution tracking
  - `SkillExecution` model: execution instances, parameters, outcomes
  - `SkillStep` model: individual steps within skill execution
  - `AgentInteraction` model: user-agent conversation tracking
  - `WorkflowTransition` model: state change logging with agent attribution

- [ ] Task 3.3: Add agent-guided workflow infrastructure
  - `WorkflowTemplate` model: predefined workflows for skills
  - `UserTask` model: tasks assigned to users by agent
  - `AgentRecommendation` model: agent suggestions and reasoning
  - `WorkflowCompletion` model: completion tracking and validation

- [ ] Task 3.4: Create agent session management
  - `AgentSession` model: session state, user context, skill history
  - `SessionData` model: persistent data across agent interactions
  - `UserPreferences` model: user preferences for agent interactions
  - `SkillAvailability` model: which skills are available to which users

- [ ] Task 3.5: Add agent audit and analytics
  - `AgentPerformance` model: skill execution success rates
  - `UserEngagement` model: user interaction patterns with agent
  - `SkillUsage` model: which skills are used most frequently
  - `WorkflowAnalytics` model: workflow completion rates and bottlenecks

- [ ] Task 3.6: Write tests for agent integration
  - Test agent session management
  - Test workflow state transitions
  - Test skill execution tracking
  - Test agent-user interaction logging

- [ ] Verification: All models support agent workflows, session tracking works, skill execution is logged, tests pass.

**Commit:** `conductor(agent-integration): workflow support, session management, skill execution tracking, agent analytics`

---

## Phase 4: API Completion & Documentation

**Goal:** Create comprehensive API endpoints with proper documentation and error handling for all new data models.

### Tasks

- [ ] Task 4.1: Create CRUD APIs for all new models
  - RESTful endpoints for all governance models
  - Proper HTTP status codes and error responses
  - Input validation and sanitization
  - Rate limiting for governance operations

- [ ] Task 4.2: Add workflow-specific API endpoints
  - Skill execution endpoints with agent session support
  - Workflow transition APIs with state validation
  - Bulk operations for related governance entities
  - Search and filter endpoints for complex queries

- [ ] Task 4.3: Create agent-specific API endpoints
  - Agent session management endpoints
  - Skill recommendation APIs
  - Workflow guidance endpoints
  - User task management APIs

- [ ] Task 4.4: Add API documentation and examples
  - OpenAPI/Swagger documentation for all endpoints
  - Example requests and responses for each endpoint
  - Error code documentation with resolution steps
  - API versioning and deprecation notices

- [ ] Task 4.5: Implement API security and access control
  - Role-based access control for governance operations
  - API key management for agent access
  - Request logging and audit trails
  - Input validation and SQL injection protection

- [ ] Task 4.6: Create API integration tests
  - End-to-end API testing for all endpoints
  - Authentication and authorization testing
  - Error handling and edge case testing
  - Performance and load testing

- [ ] Verification: All APIs documented and functional, security implemented, integration tests pass, agent can access all required endpoints.

**Commit:** `conductor(api-completion): CRUD APIs, workflow endpoints, agent APIs, documentation, security, integration tests`

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 5 + verification | Core governance entities with agent support |
| 2 | 9 + verification | Skill-specific data models |
| 3 | 6 + verification | Agent integration and workflow management |
| 4 | 6 + verification | API completion and documentation |
| **Total** | **26 + 4 verifications** | Complete data foundation for governance skills |

## Dependencies

- **Phase 1 must complete first** — establishes the core entities that all other phases depend on
- Phase 2 (skill models) can run in parallel with Phase 3 (agent integration) after Phase 1
- Phase 4 (APIs) depends on both Phase 2 and Phase 3 completion
- All phases depend on the existing multi_ecosystem_collaboration_20260425 track for basic data model patterns

## Critical Path

Phase 1 → Phase 2 + Phase 3 (parallel) → Phase 4

## Quality Standards

- **Agent-first design**: All models optimized for agent execution patterns
- **Structured JSON**: Consistent JSON schemas for skill-specific data
- **Version control**: Automatic versioning for all governance entities
- **Audit trails**: Complete audit logging for compliance and debugging
- **Test coverage**: 90%+ test coverage for all new models and APIs
- **Documentation**: Comprehensive API docs with skill context and examples