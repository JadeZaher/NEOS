# exec_tool_integration_20260611 — Wire scratch exec_tool into the production agent registry

**Status**: Not started
**Priority**: P1
**Created**: 2026-06-11
**Driver**: Wave-3 S1 produced a complete, tested, security-reviewed sandboxed exec tool at `agent/scratch/exec_tool/`. It's not yet registered with the agent.

## Problem

The exec_tool deliverable (29/29 tests pass, 3 critical security bugs fixed in review) currently lives in `agent/scratch/`. It is:

- A complete async `exec_script(language, source, args, timeout_ms, allowed_imports) → ExecResult` entry point
- Sandboxed via subprocess + `_MINIMAL_ENV` (with `PYTHONPATH`/`VIRTUAL_ENV` correctly stripped post-review)
- Policy-gated: import allowlist, language allowlist, exec/eval detection, source size cap, output truncation, timeout enforcement, RLIMIT_AS/RLIMIT_CPU on Linux (now working post-review fix)
- Registered into `GOVERNANCE_TOOLS` via a decorator-based `registry.py` that **does not modify `governance_tools.py`**

But no production code path calls `exec_script` yet. The agent's `governance_tools.py` doesn't import it. The MCP tool surface doesn't expose it.

## Solution

Move from scratch to production at a deliberate pace with explicit security review gates.

## Functional requirements

- **FR-1**: Move `agent/scratch/exec_tool/` → `agent/src/neos_agent/tools/exec_tool/`. Update imports.
- **FR-2**: Call `register_exec_tool()` from agent startup so the tool appears in `GOVERNANCE_TOOLS` for the LLM router.
- **FR-3**: The agent's system prompt (or tool-selection logic) gets a description of when to invoke `exec_script` — needs to be **deliberately conservative**: this tool exists for cases where a one-off computation is needed (e.g., parse a CSV, compute a hash, transform a JSON shape) and adding a permanent governance tool is overkill. Not for production logic.
- **FR-4**: Tool execution metrics logged: `tool=exec_script language=X duration_ms=Y exit_code=Z policy_violation=W`. These feed into the AI self-audit track (`ai_self_audit_20260610`) as evidence for anti-capture signals.
- **FR-5**: Default policy hardened for production: deny JavaScript by default (already correct), allowed_imports limited to `math`, `dataclasses`, `json`, `collections`, `re`, `datetime`, `typing` (no `os`, `subprocess`, `socket`, `urllib`, `requests`, `pathlib` even in allowed_imports overrides).
- **FR-6**: The `complete_recovery` post-emergency review can optionally invoke `exec_script` to evaluate a reviewer-supplied predicate (e.g., "verify metric X is within bound Y"). Use case spec'd here, implementation deferred to a follow-up phase.

## Non-functional requirements

- **NFR-1**: Production deployment requires the L1 review fixes to be deployed (already in `596af40`). No regression of the 29 tests.
- **NFR-2**: Tool gets explicit security documentation in the agent's tool catalog. Operators understand this is **dual-use**: convenient for ad-hoc computation, risky if the LLM is compromised.
- **NFR-3**: Audit logging is on by default and cannot be silenced via config (mitigation against an attacker turning off observability).

## Verification criteria

- The agent can list `exec_script` in its tool registry at startup
- A simple invocation works end-to-end through the agent's normal tool-call path (not a unit test, an integration smoke test)
- Audit logs land in the same observability lane as other tool calls
- The 29 unit tests from S1 still pass after the move

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| LLM invokes `exec_script` for tasks better served by an existing tool | System prompt explicitly warns; tool description emphasizes "narrow ad-hoc use only"; metrics surface frequent-use patterns for prompt tuning |
| Resource exhaustion via repeated calls | Per-conversation rate limit (counted in tool-call middleware); not implemented yet — flag for follow-up |
| The policy hardening conflicts with a legitimate use case | Allowed_imports is per-call overrideable; the global default is conservative; specific use cases that need broader imports declare them at call site |

## Out of scope

- Docker / WASM sandbox upgrade (documented as residual risk in SECURITY.md; deferred)
- Resource limits on Windows (`resource` module Linux-only; Windows uses the timeout + output cap only, accept this limitation)
- Tool-call rate limiting (separate concern; track to be created)

## Phasing

- **Phase 1**: Move from scratch to production path. Wire to registry. Smoke-test through agent. Document in tool catalog.
- **Phase 2**: Audit-log integration with the AI self-audit observability lane.
- **Phase 3**: `complete_recovery` predicate evaluation use case.
- **Phase 4**: Rate limiting + per-tenant policy customization.

Phase 1 is the minimum viable integration. Phases 2-4 are independent follow-ups.
