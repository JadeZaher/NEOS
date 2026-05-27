# Implementation Plan: Conflict Resolution UI & Harm Circles

## Overview

Four phases: (1) Enhanced conflict reporting, (2) Harm circle preparation, (3) 3-round facilitation, (4) Repair agreements & dashboard. Each phase ends with verification and a commit. Creates comprehensive UI for agent-guided conflict resolution.

---

## Phase 1: Enhanced Conflict Reporting

**Goal:** Create structured conflict reporting with agent guidance, safety considerations, and progressive disclosure.

### Tasks

- [ ] Task 1.1: Design conflict reporting wizard structure
  - Create step-by-step wizard component with progress indicator
  - Define 5-step process: incident description, parties involved, impact assessment, safety check, confirmation
  - Add agent guidance integration points
  - Implement draft saving and resume functionality

- [ ] Task 1.2: Build structured data collection forms
  - Incident description form with agent contextual help
  - Parties identification form with role clarification
  - Impact assessment form with guided questions
  - Safety flag integration with escalation options
  - Cross-ecosystem sharing configuration

- [ ] Task 1.3: Add safety and sensitivity features
  - Trauma-informed design elements
  - Optional anonymous reporting options
  - Safety resource integration
  - Cultural sensitivity considerations
  - Accessibility improvements for various user needs

- [ ] Task 1.4: Integrate agent guidance throughout
  - Agent chat bubbles for contextual help
  - Process recommendations based on conflict type
  - Data collection assistance and validation
  - Emotional support and reassurance messaging

- [ ] Task 1.5: Create conflict preview and confirmation
  - Structured preview of collected information
  - Agent review and suggestions
  - Final confirmation with consent options
  - Submission with progress tracking

- [ ] Task 1.6: Write tests for conflict reporting workflow
  - Test wizard navigation and state management
  - Test agent integration and guidance
  - Test safety features and accessibility
  - Test form validation and error handling

- [ ] Verification: Conflict reporting wizard functional, agent guidance integrated, safety features working, accessibility compliant, tests pass.

**Commit:** `conductor(conflict-reporting): enhanced reporting wizard, agent guidance, safety features, accessibility`

---

## Phase 2: Harm Circle Preparation Interface

**Goal:** Build UI for harm circle preparation conversations, safety assessments, and consent management.

### Tasks

- [ ] Task 2.1: Create preparation conversation interfaces
  - Private conversation forms for each party type (harmed, caused harm, affected)
  - Structured question sets for different participant roles
  - Agent facilitation support for conversation guidance
  - Conversation progress tracking and completion status

- [ ] Task 2.2: Build safety assessment components
  - Safety evaluation forms with clear criteria
  - Risk level indicators and mitigation options
  - Facilitator safety recommendations
  - Emergency escalation integration

- [ ] Task 2.3: Implement consent management
  - Participation consent forms with clear explanations
  - Withdrawal options at any stage
  - Consent tracking and audit trails
  - Agent support for consent discussions

- [ ] Task 2.4: Add facilitation planning tools
  - Circle design interface with participant arrangement
  - Time allocation and agenda planning
  - Ground rule definition and agreement
  - Alternative format options for accessibility

- [ ] Task 2.5: Create preparation progress dashboard
  - Overall preparation completion status
  - Individual participant readiness indicators
  - Agent recommendations and suggestions
  - Timeline and deadline management

- [ ] Task 2.6: Write tests for preparation interface
  - Test conversation flow and data collection
  - Test safety assessment functionality
  - Test consent management and tracking
  - Test facilitation planning tools

- [ ] Verification: Preparation interfaces functional, safety assessments working, consent properly managed, facilitation tools available, tests pass.

**Commit:** `conductor(harm-circle-prep): preparation conversations, safety assessments, consent management, facilitation planning`

---

## Phase 3: 3-Round Facilitation UI

**Goal:** Create structured interfaces for the three harm circle rounds with proper facilitation controls.

### Tasks

- [ ] Task 3.1: Build Round 1 interface ("What Happened")
  - Structured input forms for observations and experiences
  - Speaking order management and time tracking
  - Facilitator controls for process management
  - Real-time participant status indicators

- [ ] Task 3.2: Create Round 2 interface ("Impact & Needs")
  - Needs identification forms with agent guidance
  - Impact sharing with structured prompts
  - Safety monitoring and check-in options
  - Progress tracking within the round

- [ ] Task 3.3: Develop Round 3 interface ("Repair Actions")
  - Collaborative agreement building tools
  - Commitment definition forms
  - Consensus checking mechanisms
  - Action item assignment and tracking

- [ ] Task 3.4: Add facilitation control panel
  - Process management controls for facilitators
  - Safety monitoring dashboard
  - Time management and round transitions
  - Emergency intervention options

- [ ] Task 3.5: Implement real-time collaboration features
  - Live participant status updates
  - Shared document collaboration
  - Real-time agent facilitation support
  - Synchronous and asynchronous participation options

- [ ] Task 3.6: Create round transition and summary features
  - Round completion confirmation
  - Key insights summary generation
  - Transition guidance to next round
  - Participant feedback collection

- [ ] Task 3.7: Write tests for facilitation interface
  - Test round navigation and state management
  - Test facilitation controls and safety features
  - Test real-time collaboration functionality
  - Test agent integration during rounds

- [ ] Verification: All three rounds functional with proper controls, real-time features working, agent integration active, safety monitoring operational, tests pass.

**Commit:** `conductor(3-round-facilitation): Round 1-3 interfaces, facilitation controls, real-time collaboration, safety monitoring`

---

## Phase 4: Repair Agreements & Dashboard

**Goal:** Build repair agreement management and comprehensive conflict resolution dashboard.

### Tasks

- [ ] Task 4.1: Create repair agreement builder
  - Structured commitment definition forms
  - Timeline and accountability assignment
  - Follow-up schedule creation
  - Multi-party agreement workflow

- [ ] Task 4.2: Build agreement management interface
  - Agreement versioning and amendments
  - Progress tracking and compliance monitoring
  - Notification and reminder systems
  - Integration with broader governance system

- [ ] Task 4.3: Develop conflict resolution dashboard
  - Active conflicts overview with status indicators
  - Harm circle progress visualization
  - Repair agreement compliance tracking
  - Historical resolution data and analytics

- [ ] Task 4.4: Add agent integration components
  - Agent chat integration throughout interfaces
  - Process recommendations and suggestions
  - Automated workflow progression assistance
  - Agent-driven notifications and follow-ups

- [ ] Task 4.5: Create notification and reminder system
  - Conflict resolution milestone notifications
  - Repair agreement deadline reminders
  - Agent-initiated check-in prompts
  - Escalation and support notifications

- [ ] Task 4.6: Implement accessibility and mobile optimization
  - Full WCAG 2.1 AA compliance
  - Mobile-responsive design for all components
  - Touch-optimized interfaces for mobile devices
  - Offline capability for critical features

- [ ] Task 4.7: Write comprehensive tests
  - Test repair agreement workflows
  - Test dashboard functionality and analytics
  - Test agent integration components
  - Test accessibility and mobile features
  - Test notification and reminder systems

- [ ] Verification: Repair agreements fully functional, dashboard comprehensive, agent integration complete, accessibility compliant, mobile optimized, tests pass.

**Commit:** `conductor(repair-dashboard): repair agreements, conflict dashboard, agent integration, notifications, accessibility`

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 6 + verification | Enhanced conflict reporting with agent guidance |
| 2 | 6 + verification | Harm circle preparation and safety assessments |
| 3 | 7 + verification | 3-round facilitation with real-time features |
| 4 | 7 + verification | Repair agreements and comprehensive dashboard |
| **Total** | **26 + 4 verifications** | Complete conflict resolution UI system |

## Dependencies

- **Phase 1 must complete first** — establishes the foundation for all subsequent phases
- Phase 2 depends on Phase 1 for basic conflict data
- Phase 3 depends on Phase 2 for preparation data and participant information
- Phase 4 depends on Phase 3 for completed harm circle data
- All phases depend on governance_skill_data_models_20260427 for backend data structures

## Critical Path

Phase 1 → Phase 2 → Phase 3 → Phase 4

## Design Principles

- **Agent-first UX**: All interfaces designed around agent facilitation patterns
- **Safety-first**: Safety considerations integrated throughout all components
- **Progressive disclosure**: Complex processes revealed gradually to maintain user focus
- **Accessibility**: Full WCAG 2.1 AA compliance with mobile optimization
- **Privacy**: End-to-end encryption for sensitive conflict data
- **Performance**: Sub-second load times with offline capability for critical features