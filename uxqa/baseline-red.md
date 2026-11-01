---
type: Reference
title: Known-red baseline
description: Test, typecheck and build results to compare a pass against; reds here are pre-existing, not regressions.
timestamp: "2026-11-01"
---

# Known-red baseline (2026-11-01, after governance wave B, `aa84a2b` / `183ec5a`)

| Command | Result |
|---|---|
| backend pytest (in-memory sqlite; PostgreSQL tests with `NEOS_TEST_POSTGRES_URL`) | `793 passed`, 0 failed |
| `npm run check` (tsc) | exit 0, 0 `error TS` |
| `npm test` | 60 pass, 0 fail |
| `npm run build` | exit 0 (chunk-size warning only) |

Pre-existing reds: **none**. Any failure in a pass is a regression to triage.

History: before pass 01 the backend had 2 known reds
(`tests/test_shared_ecosystem_serialization.py`, member and proposal detail);
they were fixed in `c0fdcec` (fixtures built from transient ORM rows).
