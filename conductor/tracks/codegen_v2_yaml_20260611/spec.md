# codegen_v2_yaml_20260611 — Codegen v2: YAML-driven skill → tool generation

**Status**: Not started
**Priority**: P1
**Created**: 2026-06-11
**Driver**: Wave-3 L3 codegen review surfaced fundamental brittleness in the v1 pipeline
**Depends on**: `db_models_split_20260611` (split models is a prerequisite for clean model references in YAML)

## Problem

The v1 codegen (`agent/scratch/codegen/`) extracts structured intent from unstructured SKILL.md prose. Every parser improvement during wave-3 was patching a heuristic failure mode:

- Type inference from natural-language descriptions (`proposer_identity` → `str` or `uuid`?)
- Optional-input detection from prose phrases
- Capture-vector regex sensitive to punctuation in SKILL.md text
- Drift detection that compares "parser's prose extraction" against "AST extraction of `governance_tools.py`" — both sides are reconstructions, so 888 drift findings include heavy noise (parameter naming divergence dominates)

Wave-3 shipped 13 generated stubs that didn't even `py_compile`. The v1 pipeline was deleted (the 13 stubs removed; parser/validator/generator improvements kept).

The user-surfaced fix is upstream: make the source-of-truth structured.

## Solution

Replace the prose-parsing pipeline with explicit declarative configuration:

1. Each SKILL.md gains a YAML/frontmatter header declaring:
   - `target_tool`: the tool name in `governance_tools.py` this skill maps to
   - `model`: relative path to the ORM model file the skill operates on (e.g., `db/models/emergency_state.py`)
   - `inputs`: explicit list of `{name, type, required, description}` — no inference
   - `output_shape`: explicit response schema
   - `dependencies`: skill ids this depends on
   - `layer`: NEOS layer number

2. The prose body remains for human reading and acceptance criteria. The codegen ignores it entirely.

3. Generator reads YAML → emits Python tool stub. No heuristics.

4. Drift detector v2 compares YAML to ORM model fields (both structured). When SKILL.md adds an input, drift fires if the ORM doesn't have a matching column. When the tool body in `governance_tools.py` references a field not in the model, drift fires.

## Functional requirements

- **FR-1**: YAML frontmatter schema definition. Pydantic or dataclass model that every SKILL.md header must validate against. Hard-fail if invalid (no silent tolerance).
- **FR-2**: Migrate the existing 13 wave-3 candidate skills to YAML frontmatter (the ones whose stubs we deleted): `agreement-creation`, `agreement-amendment`, `domain-mapping`, `domain-review`, `role-assignment`, `role-sunset`, `act-consent-phase`, `decision-record`, `escalation-triage`, `governance-health-audit`, `emergency-criteria-design`, `proposal-creation`, `voluntary-exit`.
- **FR-3**: Generator v2: reads YAML, emits Python that compiles AND imports cleanly. Verification gate is non-optional: `py_compile` + `python -c "from <generated_module> import *"` must both succeed.
- **FR-4**: Drift detector v2: YAML ↔ ORM model + YAML ↔ governance_tools.py ToolDef. Reports as structured findings (severity, category, file:line), not free-text noise.
- **FR-5**: Pre-commit hook (or CI gate) that rejects SKILL.md changes if YAML frontmatter is missing or invalid.

## Non-functional requirements

- **NFR-1**: Migration is incremental. The v1 pipeline must continue to work for un-migrated skills while v2 covers the migrated ones. Coexistence is non-optional during transition.
- **NFR-2**: The v2 generator should be ≤30% the size of the combined v1 parser + validator + generator (~1500 lines currently). Target: ≤500 lines.
- **NFR-3**: Adding a new skill in wave-5+ requires only: write SKILL.md (with frontmatter), run generator, commit. No code edits to the generator.

## Out of scope (defer to later)

- Migrating all 54 skills at once. Start with the 13 wave-3 candidates, prove the pattern, expand.
- Generating handler implementations (only stubs). Real logic still lives in `governance_tools.py` until further notice.
- Replacing `manifest.toml` (v2 generator should produce a compatible manifest entry).

## Verification criteria (definition of done for phase 1)

- 13 SKILL.md files have valid YAML frontmatter
- Generator v2 produces compiling Python for all 13
- Drift report on the 13-skill set produces ≤10 findings total (vs v1's 888) and all findings are actionable (i.e., point to a real divergence, not noise)
- The v1 codegen is preserved at the existing path; v2 lives at `agent/scratch/codegen_v2/` initially, promoted to `agent/src/neos_agent/codegen/` once stable
- Wave-4 retro documents the size/noise reduction quantitatively

## Open questions

- Should the YAML live as actual frontmatter (`---\n...\n---\n`) at the top of SKILL.md, or as a sidecar file (`SKILL.yaml`)? Frontmatter keeps single-source; sidecar is easier to validate with off-the-shelf tooling. Recommend frontmatter for the user-readable benefit unless tooling friction surfaces.
- Should the `model` field reference a Python file path or a fully-qualified import (`neos_agent.db.models.emergency_state`)? File path is robust to import-path refactors; import path is more idiomatic. Recommend file path for migration robustness.
