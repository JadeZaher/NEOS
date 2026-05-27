# Specification: Conflict Resolution UI & Harm Circles

## Overview

Build comprehensive UI for conflict resolution and harm circle processes. Create structured data collection forms, preparation conversation workflows, safety assessment interfaces, 3-round facilitation UIs, and repair agreement management. Support agent-guided conflict resolution with proper workflow states and user guidance.

## Background

The NEOS conflict resolution skill defines a sophisticated harm circle process with structured rounds, safety assessments, and repair agreements. The current conflict UI only provides basic incident reporting. Users need guided workflows to participate effectively in agent-facilitated conflict resolution processes.

## Decisions (Resolved)

1. **Agent-guided workflow**: UI components designed around agent facilitation with contextual help and step-by-step guidance
2. **Progressive disclosure**: Complex processes revealed gradually to avoid overwhelming users
3. **Safety-first design**: Safety assessments and consent management integrated throughout the process
4. **Structured data collection**: Forms designed to collect the specific data structures agents need
5. **Visual process tracking**: Clear visualization of process stages and user progress
6. **Accessible design**: Support for various user needs and conflict resolution contexts

## Functional Requirements

### FR-1: Enhanced Conflict Reporting
**Description**: Create structured conflict reporting form with agent guidance and safety considerations.
**Acceptance Criteria:**
- Step-by-step conflict reporting wizard
- Agent contextual help throughout the process
- Safety flag integration with immediate escalation options
- Structured data collection for harm circle preparation
- Cross-ecosystem sharing options
- Progress tracking and draft saving

### FR-2: Harm Circle Preparation Interface
**Description**: Build UI for harm circle preparation conversations and safety assessments.
**Acceptance Criteria:**
- Private conversation interfaces for each party
- Safety assessment forms with clear criteria
- Agent-facilitated preparation guidance
- Consent management for participation
- Timeline and expectation setting
- Preparation progress tracking

### FR-3: 3-Round Facilitation UI
**Description**: Create structured interfaces for the three harm circle rounds with proper facilitation support.
**Acceptance Criteria:**
- Round 1: "What Happened" - structured input forms with observation/impact framing
- Round 2: "Impact & Needs" - needs identification with agent guidance
- Round 3: "Repair Actions" - collaborative agreement building
- Facilitator controls and process management
- Time allocation and speaking order management
- Safety monitoring throughout rounds

### FR-4: Repair Agreement Builder
**Description**: Build comprehensive repair agreement creation and management interface.
**Acceptance Criteria:**
- Structured commitment definition forms
- Timeline and accountability tracking
- Follow-up schedule management
- Agreement versioning and amendments
- Multi-party consent collection
- Integration with broader agreement registry

### FR-5: Conflict Resolution Dashboard
**Description**: Create dashboard for tracking conflict resolution progress and managing multiple conflicts.
**Acceptance Criteria:**
- Conflict status overview with visual indicators
- Active harm circle progress tracking
- Repair agreement compliance monitoring
- Agent recommendation integration
- Notification and reminder management
- Historical conflict resolution data

### FR-6: Agent Integration Components
**Description**: Build UI components that integrate with agent facilitation throughout the process.
**Acceptance Criteria:**
- Agent chat integration in conflict interfaces
- Contextual help and guidance bubbles
- Process recommendations and suggestions
- Automated data collection assistance
- Workflow state synchronization
- Agent-driven notifications and reminders

## Non-Functional Requirements

### NFR-1: Progressive Disclosure
Complex forms and processes revealed step-by-step to maintain user focus and reduce cognitive load.

### NFR-2: Safety & Sensitivity
All interfaces designed with trauma-informed principles and safety considerations.

### NFR-3: Accessibility
WCAG 2.1 AA compliance with support for screen readers, keyboard navigation, and various user needs.

### NFR-4: Mobile Responsiveness
Full functionality on mobile devices with touch-optimized interfaces.

### NFR-5: Performance
Sub-second load times for all conflict resolution interfaces.

### NFR-6: Privacy & Security
End-to-end encryption for sensitive conflict data with proper access controls.

## Technical Considerations

- React components with TypeScript for type safety
- Form state management with validation
- Real-time collaboration for multi-party processes
- Offline capability for critical conflict resolution steps
- Integration with agent chat system
- Progressive enhancement for older browsers
- Comprehensive error handling and user feedback