---
type: Reference
title: Known-red baseline
description: Test, typecheck and build results before any UX study fix landed; reds here are pre-existing, not regressions.
timestamp: "2026-10-31"
---

# Known-red baseline (2026-10-31, before pass 01; user WIP present in 5 files)

| Command | Result |
|---|---|
| backend pytest (in-memory sqlite) | `2 failed, 373 passed, 23 warnings in 139.40s` |
| `npm run check` (tsc) | exit 0, 0 `error TS` |
| `npm run build` | exit 0, `built in 14.93s` (chunk-size warning only) |

Pre-existing reds:

- `tests/test_shared_ecosystem_serialization.py::test_member_detail_exposes_shared_ecosystem_ids`
- `tests/test_shared_ecosystem_serialization.py::test_proposal_detail_exposes_shared_ecosystem_ids`
