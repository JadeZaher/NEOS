# Specification: Human-in-the-Loop Approval Flow

## Overview

Add a structured human-in-the-loop (HITL) approval flow to the NEOS governance agent. When the agent needs a choice, approval, or agreement-question answer, it must present 2-4 concrete options and always include an `Other` option with a free-form text field. The frontend renders the options as clickable choices plus an `Other` text input, making the agent harness smoother, clearer, and less ambiguous.

## Background

The current chat flow is fully free-form. The agent asks open-ended questions, and the user must type answers. This creates several friction points:

- **Ambiguity**: The user may not know what kind of answer the agent wants.
- **Back-and-forth**: The agent often asks one question at a time, requiring many messages.
- **No explicit escape hatch**: The user cannot easily say "none of the above" or provide a free-form alternative.
- **Inconsistent approval UX**: Some governance flows (agreement creation, consent gates, ACT transitions) need explicit user approval without a clear UI for it.

A structured HITL approval flow solves these by making choices explicit and by always offering a free-form `Other` option.

## Decisions (Resolved)

1. **Structured options are the default for agreement questions**: Any time the agent asks about agreement type, scope, affected parties, consent, or approval, it offers multiple options plus `Other`.
2. **Free-form `Other` is always available**: The user can always bypass the provided options and type their own answer.
3. **Protocol-level `approval_request` event**: The backend emits a dedicated SSE event (`approval_request`) with a machine-readable payload. The React frontend renders the options.
4. **Backward compatible with free-form chat**: If the agent does not emit an `approval_request`, the chat continues as plain text.
5. **No new stateful conversation turn**: The first iteration uses the existing request/response cycle. The user's selection is sent as a normal message; the backend can enhance this later with a dedicated `approval_response` body field.
6. **Backend parses the agent's response for an `approval_request` block**: The agent includes a JSON block in its message; the backend extracts it, emits an SSE event, and removes the JSON from the visible text.
7. **Agent system prompt instructs option generation**: The prompt is updated to encourage the agent to produce options and an `Other` field for agreement questions and approval gates.

## Functional Requirements

### FR-1: Agent Prompt Encourages Options + Other
**Description**: Update the agent system prompt so that, when asking for a choice, approval, or agreement-question answer, the agent always provides 2-4 concrete options and an `Other` free-form option.
**Acceptance Criteria**:
- The system prompt contains explicit HITL instructions.
- The instructions include an example `approval_request` JSON block.
- The agent's behavior is observable for agreement questions, consent gates, and ACT transitions.
**Priority**: P0

### FR-2: Backend `approval_request` SSE Event
**Description**: The `api/chat.py` streaming endpoint parses the assistant message for an `approval_request` JSON block and emits a dedicated SSE event. The event payload contains the question, options, and an `allow_other` flag.
**Acceptance Criteria**:
- `approval_request` event is emitted when the assistant message contains a valid JSON block with `type: "approval_request"`.
- The JSON block is removed from the visible assistant text.
- If the JSON block is malformed, the original text is emitted unchanged and a warning is logged.
- The event is emitted in the JSON API (`/api/v1/chat/send`) and, for parity, in the legacy dashboard SSE (`/chat/message`).
**Priority**: P0

### FR-3: Frontend Renders Options + Other Field
**Description**: The React chat panel renders `approval_request` options as buttons and displays an `Other` text field when `allow_other` is true.
**Acceptance Criteria**:
- When an assistant message has an `approvalRequest` payload, the chat panel shows a choice card.
- Clicking an option sends that option as a user message.
- The `Other` field lets the user type free-form text and sends it as a user message prefixed with `Other:`.
- The chat panel visually distinguishes the HITL card from normal text.
**Priority**: P0

### FR-4: `request_human_input` Governance Tool (Optional First Slice)
**Description**: Add a `request_human_input` governance tool that the agent can call to explicitly request structured input. The tool returns a payload that the backend can use to emit an `approval_request` event.
**Acceptance Criteria**:
- `request_human_input` tool is registered in `governance_tools.py`.
- The tool returns a `requires_input: true` payload with `question`, `options`, and `allow_other`.
- The tool is documented in the system prompt.
**Priority**: P1

### FR-5: Integration Tests
**Description**: Add unit tests for parsing the `approval_request` JSON block and the `request_human_input` tool.
**Acceptance Criteria**:
- `parse_approval_request` function tests cover valid JSON, malformed JSON, missing `type`, and multiple code blocks.
- `request_human_input` tool tests cover valid options and `allow_other` default.
- Existing chat tests continue to pass.
**Priority**: P1

## Non-Functional Requirements

### NFR-1: Backward Compatibility
Existing free-form chat and all existing SSE events continue to work without changes.

### NFR-2: Accessibility
The HITL card uses semantic buttons and labels for screen readers.

### NFR-3: 10% Test Coverage
Lightweight tests focused on the HITL parser and the new tool.

### NFR-4: No Breaking Changes to API
`/api/v1/chat/send` continues to accept the same request body; `approval_request` is a new event type.

## Technical Considerations

- The `approval_request` JSON block should be embedded inside a Markdown code fence (```json) so the LLM produces it reliably and the parser can find it.
- The parser must be lenient: malformed JSON should not break the chat stream.
- The `use-chat.ts` hook must forward the `approval_request` event to the `ChatMessage` model.
- The `ChatPanel` component should render the HITL card inline with the assistant message.
- Future phases can introduce a dedicated `POST /api/v1/chat/respond` endpoint with an `approval_response` body for two-turn state management.

## Out of Scope

- Two-turn stateful pause-and-resume flow for this slice.
- Persisting HITL choices as separate database records.
- Email/SMS push notifications for pending approvals.
