# NEOS Development Workflow

## Methodology

Test-Driven Development (TDD) with Red-Green-Refactor cycle.

## Coverage Target

**10%** — Lightweight testing focused on critical paths and API contracts.

## Commit Strategy

**Once per phase** — Batch commits at phase boundaries, not per individual task.

## Git Notes

Enabled — use git notes for task-level metadata.

## Branch Strategy

- `main` — stable, deployable
- `feature/<track-id>` — feature branches per track
- Commit message format: `conductor(<scope>): <description>`

## Task Workflow

1. **Read** spec and plan for current task
2. **Write test** (red) — define expected behavior
3. **Implement** (green) — make the test pass
4. **Refactor** — clean up while tests stay green
5. **Mark task complete** in plan.md
6. **At phase boundary**: commit all phase work

## Phase Verification

At each phase boundary:
1. All phase tasks marked complete
2. Tests passing
3. Coverage meets target (10%)
4. Commit with `conductor(<phase>): <summary>`

## Definition of Done

- [ ] Feature works as specified
- [ ] Tests pass
- [ ] No regressions in existing functionality
- [ ] Code follows style guides
