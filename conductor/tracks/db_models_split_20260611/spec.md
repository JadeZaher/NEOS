# db_models_split_20260611 — Split `db/models.py` into per-model files

**Status**: Not started
**Priority**: P1 (blocking `codegen_v2_yaml_20260611`)
**Created**: 2026-06-11
**Driver**: Mechanical prerequisite for codegen v2's YAML model-path references; also reduces a 113 KB monolith into reviewable units

## Problem

`agent/src/neos_agent/db/models.py` is one file with every ORM model. 113 KB, ~2700 lines. Drawbacks:

- Concurrent edits in parallel streams cause merge churn (S2 wave-3 modified it; would have collided with any other model-touching stream)
- Drift detection in codegen v2 needs to reference "the file that defines this model" — currently every reference is to the same monolith, defeating granular drift signal
- Reviewers can't easily map "this PR touches Agreement, EmergencyState, ConflictRecord" to file boundaries
- Lazy/circular-import patterns are masked by the monolith (everything imports everything from the same module)

## Solution

Split into `agent/src/neos_agent/db/models/<model>.py` — one file per model class. Keep `models/__init__.py` re-exporting every model so existing import sites continue to work (`from neos_agent.db.models import EmergencyState` still resolves).

## Functional requirements

- **FR-1**: Inventory every model class in the current `models.py`. Probably 25-40 classes.
- **FR-2**: One file per model. Filename = snake_case of class name (`EmergencyState` → `emergency_state.py`).
- **FR-3**: Cross-model relationships (`relationship()`, `ForeignKey()`) work without circular imports — usually solved with `TYPE_CHECKING` guards + string-based `relationship("OtherModel")` references.
- **FR-4**: `__init__.py` re-exports every model. Existing call sites do not change.
- **FR-5**: `Base` (declarative base) lives in `models/__init__.py` or a `models/_base.py` — imported by every per-model file.
- **FR-6**: Migration `alembic` autogen still produces correct migrations. Verify by running `alembic revision --autogenerate` against an unchanged schema and confirming the diff is empty.

## Non-functional requirements

- **NFR-1**: Zero behavioral change. Every test that passed before passes after.
- **NFR-2**: Single commit if feasible (the diff will be huge — additions + deletion — but reverts cleanly as one unit).
- **NFR-3**: No model-level logic changes during the split. Refactor pass only. Any cleanup (e.g., extracting a mixin) is a follow-up commit.

## Verification criteria

- `pytest agent/tests/` passes 100% post-split (current baseline: 46/46 pass for emergency + governance_tools after wave-3 review)
- `alembic check` (or equivalent) passes
- `python -c "from neos_agent.db import models; print(len([x for x in dir(models) if x[0].isupper()]))"` returns the same count before/after
- Grep for `from neos_agent.db.models import` in the codebase — every result still resolves

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Circular imports between models with `relationship()` | Use string-based references: `relationship("EmergencyState")` instead of class refs. SQLAlchemy resolves at mapper-config time, not import time. |
| Alembic autogen detects spurious schema changes | Verify with a clean DB and a fresh `revision --autogenerate`; expect zero ops. If any detected, root-cause before commit. |
| Hidden import-time side effects (e.g., `EmergencyState.__table_args__` populated by a global) | Inspect the existing file for any `__init_subclass__`, module-level side-effects, or `Base.metadata` mutations outside class bodies. Carry forward to `models/_base.py` if present. |
| Heavy import-time cost from importing many small modules | Lazy-import where possible; `models/__init__.py` can be a thin re-export that doesn't eagerly load every submodule (use `__getattr__` or explicit re-exports). |

## Out of scope

- Refactoring models themselves (column types, relationship semantics, indices)
- Splitting migrations
- Moving non-model code that happens to live in `models.py` (e.g., constants) — handle in a separate cleanup commit if found

## Verification gate (definition of done)

- All existing pytest suites pass
- `alembic revision --autogenerate -m "verify-no-drift"` produces an empty migration
- Codegen v2 (in `codegen_v2_yaml_20260611`) can reference per-model file paths in YAML
