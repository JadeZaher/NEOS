---
type: Governance Extension Plan
title: Complete and clarify NEOS governance (G-wave)
timestamp: "2026-10-31"
sources: governance/review-core.md (layers 1-3), governance/review-extended.md (layers 4-10), agent-evals/review.md (assistant)
---

# G-wave: finish the flows people start, and say what happens next

Bar (owner): the smallest change that makes a flow complete and understandable,
highly usable, easy to drive through the assistant. No new subsystems: no
notification service, escalation engine, role-transfer workflow, proxy consent
or cron framework. Builds on the craft contracts (`policy`, `caller_in`,
`ApiError`, `get_scoped_or_404`, the ACT `Lifecycle` table, `useApiMutation`,
`QueryState`, `keys`).

## Owner decisions (2026-10-31)

| Question | Decision | Where it lives |
|---|---|---|
| When does advice end? | The proposer closes the advice phase; the advice deadline is a backstop that prompts the proposer (no automatic move) | ACT `Lifecycle` table |
| Test -> Ratified | A steward confirms the outcome; test reports are evidence, never self-certifying | `Lifecycle` + `policy` |
| Who declares an emergency | Any active member of the ecosystem, with a co-signer (second active member); bounded timer | `policy.can_declare_emergency` + emergency co-sign step |
| Who grants roles | Only roles below your own rank; only an owner grants owner; every grant is recorded | `policy.can_assign_role` |

Defaults chosen without asking (one-line changes, listed for the owner): quorum
comes from the governing agreement, else the engine default, and the assistant
reports the engine's number; Recovery (`half_open`) does not auto-close: at 30
days it shows "review overdue" to stewards; conflicts are triaged by a steward of
the ecosystem and harm reports are visible to the parties and triage stewards
only; a ratified proposal does not silently become an agreement: stewards get a
"Register as agreement" action, and the page stops claiming "now active" until
it is; audits default to a human auditor, AI analysis is optional.

## Rules for every G lane

- Read this plan (owner decisions, your lane, the hand-offs), the review sections for your area, and the contracts: `charting-the-course/client/src/AGENTS.md`, `neos-operating-system/agent/src/neos_agent/api/AGENTS.md`, `agent/src/neos_agent/services/AGENTS.md`, `agent/alembic/AGENTS.md`.
- Own only your files. Shared files are append-only under a `# <lane>` / `// <lane>` section header: `api/policy.py` (G-ACT may also edit `can_assign_role`), `client/src/lib/api-client.ts`, `client/src/types/api.ts`, `client/src/lib/query-keys.ts` (add keys; keep the test invariants green). `hooks/use-governance.ts` belongs to G-ACT: other lanes put new hooks in their own hook file (`hooks/use-emergency.ts`, `hooks/use-exit.ts`, `hooks/use-care.ts`, ...) and switch their pages to them.
- Migrations: only your reserved revision (G-ACT `p8d4f1b6e3a9`, G-Safety `q2a7c5e9d1b3`, G-Care `r6c1e8a4f2d7`; already chained, single head). Inspect-before-alter; test on SQLite and a disposable PostgreSQL DB on 127.0.0.1:5433 that you create and drop.
- Build on the contracts (`policy`, `caller_in`, `ApiError`, `get_scoped_or_404`, the `Lifecycle` tables, `useApiMutation`, `QueryState`, `keys`). Plain-language copy; every new button has a state, an error and a confirmation; destructive or irreversible acts confirm.
- Tests model real flows through the real blueprints (actor x action tables for every authority rule; each owner decision has a test that goes red if flipped) and node:test for pure frontend logic. No tautologies.
- No git add/commit/stash/checkout/reset/push. Never read `agent/.env`; never contact `*.rlwy.net`; backend tests with `DATABASE_URL=sqlite+aiosqlite://` and the `py` launcher.
- Verify once at the end: your targeted backend tests, the migration test on PostgreSQL if you wrote one, `npm run check` and `npm test` in charting-the-course (errors in files you do not own are other lanes' in-flight work: report, never fix). Report exact commands with result lines, files changed, behaviour changes, and hand-offs.

## Lanes (wave A, parallel, disjoint files; each lane owns its backend AND its pages)

**G-ACT (opus)** - ACT integrity and the owner's ACT decisions.
Owns `api/proposals.py`, `services/act_gates.py`, `api/agreements.py`, `api/members.py` (role grants), `policy.py` (append), proposal/agreement/member pages and components, one Alembic revision.
- Consent: participant is always the authenticated caller; one position per member (changing your position replaces it); an objection can be withdrawn or resolved by its author; vocabulary normalized (`object`).
- Advice closes on the proposer's call; deadline passed -> proposer sees "Advice deadline passed: move to consent?" (UI + `allowed_next`).
- Send back for revision (consent -> advice/draft with a note).
- Test -> Ratified: steward confirmation step.
- One gate vocabulary across form, engine and assistant; quorum explained from the governing agreement.
- `update_agreement_status` runs the same gates; version bumps only when text changes.
- Role grants per the owner decision, recorded (smallest existing record type).
- Ratified proposals: "Register as agreement" for stewards (`amends_agreement_id` when amending).
- Migration: nullable member-id columns the review lists + `amends_agreement_id`, safe on create_all databases.

**G-Safety (opus)** - emergency and exit, the safety-critical flows.
Owns `api/emergency.py`, `views/emergency.py` (legacy open->closed route removed or redirected), `services/cron.py` (emergency part), `api/exit.py`, emergency and exit pages/components.
- Emergency: co-signed declaration (pending until a second active member co-signs), bounded timer, Recovery you can see ("Recovery: review due <date>") and finish (`CompleteRecoveryDialog`, writes `post_review_status`), all-member banner while open or in recovery; REST gets the same `policy.can_declare_emergency` as the assistant.
- Exit: only the leaver files and cancels their exit (stewards complete the unwinding); the exit page reads fields the API actually sends; data export never overwrites exit status; `ExitDataExportCard` wired to a portable-record endpoint.

**G-Care (sonnet)** - conflicts, repair, audits.
Owns `api/conflicts.py`, `api/safeguards.py`, `api/compliance.py`, conflict/safeguard/audit pages and components.
- Conflicts: reporter recorded; triage by an ecosystem steward through `ConflictTriageModal`; next step shown; harm reports visible to parties and triage stewards only; no unkept "within 48 hours" promise.
- Repair check-ins via `RepairCheckinModal`.
- Audits a human can finish via `GovernanceHealthAuditForm`; AI analysis optional, never blocking.

**G-Agent (opus)** - the assistant is easy and safe to use.
Owns `api/chat.py`, `agent/system_prompt*`, `agent/governance_tools.py`, `mcp_server.py`, chat UI components.
- Long tool results are shrunk (key fields kept), never replaced by a stub.
- Lookups take a UUID or a human key; results carry names (not codes) and links.
- Quorum and gates come from the engine; the assistant states the next step.
- Prompt rewrite: framework-correct, plain language, acts only as the signed-in member, refuses with a reason, confirms before irreversible acts (declare/co-sign emergency, exit, ratify, withdraw).
- Missing tools: `join_domain`, `submit_test_report`, emergency co-sign, read tools for conflicts/emergency/exit status.

## Hand-offs from craft wave 1 (assigned)

- G-ACT: switch the two owner decisions live in `PROPOSAL_LIFECYCLE` (`act_gates.py`: drop `automatic=True` on advice->consent; `steward_only=True` on test->ratified) together with their UI (proposer "Close advice" with the deadline prompt; steward "Confirm ratification") - the table test `test_owner_decisions_are_table_edits` shows the edits; a data migration normalizing stored consent rows `objection` -> `object` (old rows do not block today); REST advice gets a stage check; withdrawal only from non-terminal stages (today even ratified proposals can be withdrawn); `ConsentPositionRequest.member_name` dropped from the schema and the frontend form (ignored since wave 1); onboarding ceremony POST authorized (the member themselves or a steward via `caller_in` + `policy`); MCP agreement consent writes the alignment ledger like REST.
- G-Safety: `emergency.py` adopts `policy.can_declare_emergency(member, ecosystem_id)` and takes the declarer from the caller; the co-signer goes into that predicate's flow.
- G-Agent: chat `update_agreement_status` runs the agreement gates (review-core item 7); tools for test reports and agreement evidence; read tools' fail-open `if ecosystem_ids:` filters become `restrict_to_ecosystems`.
- G-Agent also: `agent/router.py` still routes a "consent -> active" skill pattern that can no longer happen.
- OWNER (data): proposals that moved past consent over a legacy `objection` row (normalized to `object` by `o7c3e9a5d2f8`) were not reopened; an audit query listing ratified proposals with `object` participants is the trigger to decide.
- G-Next (assistant parity): MCP `record_agreement_ceremony`, `attest_agreement_consent` and `transition_agreement` can still put an agreement in force without `confirm` (only `transition_proposal` requires it); reuse `governance_tools._evidence_puts_in_force` to apply the same bar. `api/AGENTS.md` chat-tools rows for `create_conflict_case` / `record_agreement_evidence` should say "needs confirmation (when it names parties / when it would put the agreement in force)".
- G-Next: reuse `api/emergency.describe()` and `api/exit.NEXT_STEP` for `/explain`, so the page and the assistant use the same words; assistant tools for emergency co-sign / end authority / review call `emergency.cosign` / `end_authority` / `record_review` on a row loaded FOR UPDATE.
- Craft wave 2 (app-wide): the API emits naive UTC datetimes without `Z`, so browsers render them as local time; fix once in the JSON serialization (aware UTC, `Z`) with a test, not per page. Concurrent emergency declarations in one ecosystem can both create a pending row (no row to lock): a partial unique index on (ecosystem_id) where state in active states. `client/src/AGENTS.md` "Client tests" list misses `lib/emergency-phase.ts` and `lib/exit-status.ts`.
- Craft wave 2 (unchanged list in `craft/wave1.md`) plus: notifications, messaging and onboarding rows still keyed on the default member row (same pattern as `o7c3e9a5d2f8`); chat sessions saved on the default row; the ConsentGate shows a failed join twice (toast + inline); founding helper extracted from `ecosystems.create_ecosystem` and reused by the chat tool; chat domain draft uses `can_create_domain`; domain/ecosystem quiz assign/unassign authorization; journey-map write routes scoped; ethos admin grant checks the member belongs to the ecosystem.

## Wave B (after wave A)

**G-Next (opus)** - one "what's waiting for me / what happens next" source.
`services/next_steps.py`: derived from state (no new tables), using the Lifecycle table and `policy`. Serves `GET /api/v1/me/next-steps` (the dashboard queue and the notification bell, replacing the hard-coded placeholder), `GET /api/v1/explain/<kind>/<id>` (a status banner on proposal, agreement, conflict, emergency and exit pages: state, what happens next, who decides, by when), and the assistant tools `what_needs_me` and `explain_status`. Same words in the UI and the assistant.

## Proof

- Flow tests per lane through the real blueprints (actor x action tables for every authority rule; the owner decisions each have a test that would go red if flipped).
- The agent-eval wave (`agent-evals/`) runs before wave A (baseline) and in pass 02; its must-refuse and act tasks map to these items.
- Pass 02 (act-lifecycle) exercises the ACT changes with real personas.
