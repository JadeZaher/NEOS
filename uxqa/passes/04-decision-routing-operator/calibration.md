---
type: QA Calibration
title: Typed decision routing calibration
---

# Decision routing calibration

Official guidance: https://openrouter.ai/skills/openrouter-decisions. API contract: https://github.com/OpenRouterTeam/skills/blob/main/skills/openrouter-decisions/references/decisions-api.md. Live catalog fetched on 2026-11-01.

The routing catalog is the 54 unmodified public skill definitions in JadeZaher/neos-operating-system. Probes sent synthetic prompts and public metadata only. The decision classifies context; it cannot authorize a tool action.

Selected pinned build: `typesafe/jev-1.14-20261014`. On the initial ten cases it matched 10/10, compared with 8/10 for `perplexity/pplx-decider-flash-v1.2-20261016`. The cheaper comparison misrouted ambiguous direct-help input. Twelve additional selected-model cases matched 12/12.

Measured summary:

```json
{
  "model": "typesafe/jev-1.14-20261014",
  "cases": 22,
  "passed": 22,
  "min_skill_presence": 0.78,
  "max_direct_presence": 0.23,
  "threshold": 0.5,
  "median_seconds": 0.5425,
  "total_cost_usd": 0.005167344,
  "workflow_skills_measured": 11
}
```

The 0.5 presence threshold separates all observed positives and negatives, so it remains unchanged. The skill choice is read only in the positive branch. Invalid/missing/outage results clear stale skills and use general guidance. Source tests cover malformed answers and explicit manual selection separately.

These are 22 synthetic routing cases, not proof of all 54 skills or live operator quality. Full raw distributions and case prompts are retained in routing-probes.json; actual UI journeys and operator evaluation are separate evidence.
