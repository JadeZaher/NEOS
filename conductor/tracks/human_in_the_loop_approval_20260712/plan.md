# Implementation Plan: Human-in-the-Loop Approval Flow

## Overview

Three phases: (0) prompt + protocol, (1) backend event parsing, (2) frontend option rendering, (3) tests + integration. Each phase ends with verification. The goal is a smoother, cleaner agent harness for agreement questions and approval gates.

---

## Phase 0: Prompt & Protocol Design

**Goal:** Define the HITL instruction and the `approval_request` JSON schema.

### Tasks

- [x] Task 0.1: Create conductor track spec and plan (this document) under `conductor/tracks/human_in_the_loop_approval_20260712/`.
- [x] Task 0.2: Update `conductor/tracks.md` to list the new HITL approval track.
- [ ] Task 0.3: Add HITL instruction to `agent/src/neos_agent/agent/system_prompt.py`.
  - Instruct the agent to present 2-4 options and an `Other` free-form field for agreement/approval questions.
  - Provide an example `approval_request` JSON block with `question`, `options`, `allow_other`.
- [ ] Task 0.4: Create `agent/src/neos_agent/agent/hitl.py` with the `approval_request` parser and schema.
  - `parse_approval_request(text: str) -> tuple[str | None, dict | None]`
  - Returns `(cleaned_text, approval_request)`.
  - Approval request keys: `question`, `options` (list[str]), `allow_other` (bool).

- [ ] Task 0.5: Verify `parse_approval_request` can extract a valid `approval_request` JSON block and remove it from the text.

**Commit:** `conductor(hitl-prompt): add human-in-the-loop prompt and approval_request parser`

---

## Phase 1: Backend Event Support

**Goal:** Emit the `approval_request` SSE event from the chat endpoints.

### Tasks

- [ ] Task 1.1: Update `agent/src/neos_agent/api/chat.py`.
  - Import `parse_approval_request` from `hitl`.
  - After the assistant message is emitted, parse the content for `approval_request`.
  - If found, emit an `approval_request` SSE event with the parsed JSON and emit the cleaned text as `append`.
  - If not found, emit the full text as `append`.
- [ ] Task 1.2: Update `agent/src/neos_agent/views/chat.py` (legacy dashboard SSE) with the same parsing and event emission.
- [ ] Task 1.3: Add `request_human_input` governance tool in `agent/src/neos_agent/agent/governance_tools.py`.
  - Parameters: `question` (string), `options` (array of strings), `allow_other` (boolean, default true).
  - Returns `{"success": true, "data": {"requires_input": true, "question": ..., "options": ..., "allow_other": ...}}`.
- [ ] Task 1.4: Verify `/api/v1/chat/send` emits an `approval_request` event for a mocked assistant message containing the JSON block.

**Commit:** `conductor(hitl-backend): emit approval_request SSE and add request_human_input tool`

---

## Phase 2: Frontend Option Rendering

**Goal:** Render the options and `Other` free-form field in the React chat panel.

### Tasks

- [ ] Task 2.1: Update `charting-the-course/client/src/hooks/use-chat.ts`.
  - Add `approvalRequest` to `ChatMessage` interface.
  - Handle `approval_request` SSE event by attaching the payload to the current assistant message.
- [ ] Task 2.2: Update `charting-the-course/client/src/pages/chat/ChatPanel.tsx`.
  - Render an `ApprovalRequestCard` for assistant messages with `approvalRequest`.
  - Show each option as a button.
  - Show an `Other` textarea + submit button when `allow_other` is true.
  - Submitting an option or other text calls `sendMessage` with the selection.
- [ ] Task 2.3: Add `charting-the-course/client/src/components/chat/ApprovalRequestCard.tsx` if the UI is complex enough to warrant a separate component.
- [ ] Task 2.4: Verify the chat panel renders the choice card and sends a message when an option is selected.

**Commit:** `conductor(hitl-frontend): render approval options and Other field in chat`

---

## Phase 3: Tests & Integration

**Goal:** Verify everything works end-to-end without regressions.

### Tasks

- [ ] Task 3.1: Add `agent/tests/test_hitl.py`.
  - Test `parse_approval_request` with valid, malformed, and missing `type` inputs.
  - Test `request_human_input` tool.
- [ ] Task 3.2: Update `agent/tests/test_chat.py` if needed to assert `approval_request` event emission.
- [ ] Task 3.3: Run `pytest` in `neos-operating-system/agent`.
- [ ] Task 3.4: Run `npm run lint` and `npm run typecheck` (or equivalent) in `charting-the-course/client`.
- [ ] Task 3.5: Run the dev stack and manually test the chat flow.

**Commit:** `conductor(hitl-tests): add HITL parser tests and verify integration`

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 0 | 5 + verification | Prompt, protocol, parser |
| 1 | 4 + verification | Backend SSE event + tool |
| 2 | 4 + verification | Frontend option rendering |
| 3 | 5 + verification | Tests and integration |
| **Total** | **18 + 4 verifications** | |

## Dependencies

- Phase 1 depends on Phase 0 (parser + schema).
- Phase 2 depends on Phase 1 (`approval_request` SSE event).
- Phase 3 depends on Phase 1 and Phase 2.

## Critical Path

Phase 0 → Phase 1 → Phase 2 → Phase 3

## Quality Standards

- 10% test coverage for HITL code.
- No regressions in existing chat flows.
- Frontend passes `typecheck` and `lint`.
- Agent prompt observable in agreement/approval questions.
