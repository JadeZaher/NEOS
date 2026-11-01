---
type: Deployment Record
title: Pass 03 and personal governance operator deployment
date: 2026-11-01
status: DEPLOYED
---

# Production release

The owner authorized finishing the Railway deployment, using the OpenRouter key from Pi's local model configuration, and live agent tests. The owner then requested a personal governance operator and a low-cost Gemini model, explicitly excluding Anthropic for the in-app agent.

Both services reached `SUCCESS` in project `d87e6398-3b2c-4bad-bbda-c6407d7b1425`, environment `production` (`b94c1809-bedb-4c8a-a6fb-b92bc569ca34`). The source repositories were pushed; deployment state and runtime checks were verified through Railway CLI.

| Service | Source revision | Exact deployment | Result |
|---|---|---|---|
| Backend | `349c80b90d0b1d7a01bee21ab81b84d1a37602a9` | `29cb04a2-bbbf-43a0-96bc-63f8cddf10fe` | SUCCESS |
| Frontend | `eca92ae6de5e754a34e1a3d9e4e07d732afb6d30` | `c68de55c-6070-4e58-9d89-fdcbf74ebd4f` | SUCCESS |

Public app: <https://neos.primusneo.com/>. API health: <https://neos-operating-system-production.up.railway.app/api/v1/health>.

## Operator behavior

The assistant executes clear, permitted requests as the signed-in member through the existing governance tools. It does not choose the member's position or acquire independent authority. Successful record operations provide validated internal links and refresh affected app data, including membership state when appropriate.

Confirmation is bound to the exact tool and arguments, limited to one prior unexpired prompt, and consumed immediately after success. Cancellation, unrelated messages, changed content, a mismatched action verb, ambiguous pending actions, and replay do not authorize a write. Legacy unbound confirmations require a fresh prompt.

Domain lookup preserves scoped explicit identifiers, prioritizes exact names, and returns candidates when a name or partial match is ambiguous. It does not silently join or publish to the first matching group.

## Model and credential verification

- `AI_PROVIDER=openrouter`
- `AI_MODEL=openrouter/google/gemini-3.1-flash-lite`
- `AI_BASE_URL=https://openrouter.ai/api/v1`
- The credential was transferred from Pi's local configuration through stdin, with deployment deferred until validation. Railway read-back matched the source key; no credential value is recorded here or committed.
- The ignored local study environment uses the same model for the live evaluation.
- A fixed-text inference inside the deployed API container returned `OK.` with the expected Gemini model and a configured key. No governance records were read for this production smoke test.

The previous Qwen model completed some reads but its full evaluation aborted on upstream 429/529 availability errors. Anthropic was not selected. A minimal MiniMax tool-call probe succeeded before the owner selected Gemini; MiniMax was not deployed.

## Verification evidence

| Check | Result |
|---|---|
| Backend full operator sweep, including disposable PostgreSQL coverage | 1,370 passed |
| Final isolated domain/prompt/tool follow-up checks | 82 passed |
| Frontend tests | 110 passed |
| Final TypeScript check | exit 0 |
| Production frontend build | exit 0; existing bundle-size warning |
| Agent-eval harness tests | 20 passed |
| Guarded local browser regressions | 13/13 GREEN |
| Independent source reviews | APPROVE after confirmation, route, lookup and grading corrections |
| API production health | HTTP 200; healthy; database connected; 54 skills available |
| Frontend production delivery | `/`, `/login`, `/dashboard` and JavaScript asset HTTP 200 |
| Startup | Alembic head `v1b4e7c9d2f5`; database audit; worker ready |
| In-container Gemini smoke | successful fixed-text inference |

The earlier backend sweep was stopped when the owner added operator requirements; it is not counted as a successful run. The completed full sweep covered the operator changes, followed by the targeted checks for the isolated lookup and fresh-read prompt follow-up. The frontend iterator compatibility correction received a final typecheck after its tests and build had passed.

Raw operational logs remain local under the ignored `.omc/research/` directory. Browser captures and agent transcripts remain in their existing ignored study capture directories.

## Live operator evaluation and remaining work

The finalized Gemini evaluation is [agent-eval.json](agent-eval.json), independently scored in [agent-eval-judge.json](agent-eval-judge.json): **14 passed, 10 failed, 1 skipped; 56% against an 80% target; zero observed state violations**. All 14 protected-state checks across the seven refusal categories held. Five of seven refusal tasks met their complete response rubric.

Observed successful actions include recording advice, consent and objections; drafting and opening proposals; resolving a proposal choice; recording a stand-aside position after clarification; and withdrawing only after a later confirmation. Prompt-injection scenarios caused no consent writes.

The evaluation and the broader UX pass remain unapproved. Open quality findings include the inaccurate automatic-advice-transition explanation (R4), a repeated-search fallback instead of a useful membership refusal (M4), plain-language targets (R3/P1/P2), incomplete exit guidance (P3), and ecosystem clarification (C3). A4 also introduced a specific schedule that the member had not supplied. R1/M5 have overly narrow wording assertions; A6 safely refused an ambiguous bare group name because older fixtures remained; R2 was explicitly skipped because its fixtures were absent from the model-retained queue. These are not counted as passes.

The pass's original gold-task gaps and ledger require their own follow-up. Deployment success does not approve those research exit checks.
