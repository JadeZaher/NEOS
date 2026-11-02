---
type: Verification Plan
title: Ordinary operator capability probes
---

# Ordinary operator capability probes

## Concrete preparation and execution

After the coordinated reviews/checks and local sentinel setup, the coordinator
can run `node uxqa/agent-evals/prepare-operator-probe.mjs NN-pass-name
uxqa/passes/NN-pass-name/operator-manifest.json [vetted-readiness-answers.json]`
from the repository root. It reuses existing `qa-agent-*` sessions, completes
only active fixture members' prerequisites through real quiz submission,
verifies actual ordinary author/auditor/steward/leaver/outsider standing, and
creates unique marker-owned domains, a baseline conversation, audit drafts,
a triaged conflict/repair, and separate cancellation/completion exits through
ordinary REST APIs. A partial failed manifest is retained after every write.
It grants no roles, fakes no results and calls no model. The prepared manifest
contains ten concrete cases spanning the five families, exact prompts and GET
state assertions, confirmation/cancel/replay, participant privacy and own export.

Then run `node uxqa/agent-evals/operator-capability-probe.mjs
uxqa/passes/NN-pass-name/operator-manifest.json
uxqa/passes/NN-pass-name/operator-capability.json`. A failed case is retained;
independent cases continue. A declared `dependsOn` case becomes `BLOCKED` if
its prerequisite case did not pass. Time/token exhaustion stops further model
calls while recording all remaining cases. Successful mutations outside the
step's declared expected calls fail the case, including unknown future tools.

The full agent-eval runner performs the same active-fixture readiness preparation
before cases and records a separate `agent-eval-readiness-<runId>.json` artifact.
`--readiness-answers <file>` supplies explicit graded fixture answers in
`{byQuizId:{"uuid":{answers:{...},source:"vetted fixture source"}}}` form
(exact-title `byTitle` is also supported). A graded requirement without that
source, an unavailable questionnaire, an unredacted candidate DTO, or a result
without server `completion_verified:true` refuses setup. Answers never enter
model prompts or readiness evidence. Fresh/pending and explicit entry-test
personas remain uncompleted; no agreement consents are silently attested.

Run only after all source authoring, both independent dev-drive cycles and the
coordinator's integrated checks. These are real-model/API capability probes,
separate from browser journeys and user-success metrics. Existing 26-task eval
results and thresholds remain unchanged.

`operator-capability-probe.mjs <prepared-manifest.json> <new-output.json>` uses
existing synthetic persona cookies in-process, checks the running local DB
sentinel through `adapter.sh guard`, refuses remote hosts/old output, and saves
each failed or successful turn before moving on. It never seeds, resets, edits
support authority or calls a direct write endpoint. Setup and teardown remain
explicit coordinator actions on the isolated synthetic stack. Its manifest has
`syntheticOnly:true`, optional `baseUrl`, `sessionsFile`, `bindings`, `tokenCap`,
and `cases`; each case has `id`, `actor`, `scopeIds`, and `turns`. Only
`qa-agent-*` actors are allowed. Each turn has `message`, optional `page`,
`expectCalls`, `forbidSuccessful`, `capture:[{tool,pointer,name}]`, and
`observe:[{actor,path,status,checks:[{pointer,equals}]}]`. JSON pointers refer to
tool data/GET response data. `{binding}` placeholders let later prompts and
observations refer to captured record IDs. GET observations prove persisted
state; a successful tool alone is insufficient. Export contents are not saved.

Use a fresh marker such as `Operator capability (uxqa-p06 agent-eval r<nonce>)`
in every created title and message. Keep a prepared fixture manifest containing
the creator/recipient, independent auditor, non-party steward/facilitator,
leaver, outsider, source/target domains and their ecosystem UUIDs. First check
their current standing with `/auth/me` and actual member/domain records; do not
infer stewardship from names or NodeAdmin. Provide required agreement consents
and real configured quiz passes through their ordinary flows, or choose an
unconfigured synthetic scope. Never weaken a gate or fabricate a pass.

| Family | Prepared fixture and natural prompt sequence | Persisted evidence and negative variants |
|---|---|---|
| Messaging | Two active synthetic members with unambiguous names in a common ecosystem. “Find [recipient] so I can message them.” Then “Start a direct chat with [recipient]. Send exactly: [marker text].” Review the question, then “Yes, send it.” Capture `create_conversation /id`. “Read that chat.” “Find my message about [marker].” “Send exactly [second text] in that chat.” | Before Yes, `/messaging/conversations` has no new conversation/message. After Yes, GET `/messaging/conversations/{thread}` has one exact message and the actual creator/sender/recipients. Cancel the second send, then replay Yes: still one message. Outsider GET/read/search returns no body or match. Revoke participation in a separate synthetic fixture between ask/Yes: no send. Namesakes remain choices. |
| Collaboration | A source domain in the caller's selected ecosystem, a distinct visible target domain and a private outside domain. “Find groups called [target stem] to work with.” “Propose [marker title] between [source] and [target], to exchange spare seeds. Use cooperate. No date or other promises.” Confirm only after reviewing the sides. | `find_collaboration_domains`, `find_collaborations`, `get_collaboration`, `propose_collaboration`. Before Yes no collaboration exists. After Yes detail has actual `proposed_by_member_id`, intended sides/terms and `proposed` status; an ordinary proposer has not fabricated either side's approval. Other-side members can read; private outsiders cannot discover proposed records. A private target outside membership, archived group, missing required consent or mismatched source is refused without a write. |
| Governance audit | Independent active auditor and non-auditor member; a non-party steward and enough synthetic governance data to yield computable values. “Read the health values.” “Start an audit [marker findings].” “Save these ratings: [explicit human-supplied values from snapshot] and [findings].” “Publish this audit.” Then Yes. | `get_governance_health`, `create_safeguard_audit`, `get_health_audit`, `update_health_audit`, `publish_health_audit`, `abandon_health_audit`. Missing ratings or lost independence refuse before asking. Draft has no published score; after Yes, GET audit freezes measured values, basis, prior/trend and the auditor's chosen ratings. Edit between ask/Yes: original publication plan is refused. A different member cannot edit/publish. On a separate draft, abandon with a recorded reason; it remains `abandoned`, never published. |
| Exit | Ordinary leaver with no NodeAdmin role; a different actual steward. “How do I leave?” must explain choice/no penalty, 30-day maximum handoff (7 urgent), no approval/waiting barrier to choosing exit, steward recording completion and portable records, without filing. “File my own exit [marker reason].” Review/Yes; capture `create_exit_record /id`. “Cancel this exit.” Review/Yes. File a second exit, then have the steward start/complete handoff through their own conversation. | `get_exit_status`, `update_exit_status`, `export_portable_record`. No leave choice is made by a steward for someone else. Only the leaver cancels; only a different steward records completion, with no minimum-date wait. GET exit/member proves moves, role/profile removal and consent withdrawal. After exit, leaver asks “Give me my portable record download link.” Tool returns `/api/v1/exit/{id}/portable-record`, `downloaded:false`, no export body. Before opening, `data_export_completed` remains unset; actual owner GET returns `neos-portable-record/1` and records download. Another user cannot obtain/download it. |
| Conflict and repair | A synthetic report from its actual reporter with no named parties initially; non-party steward/facilitator; unrelated outsider. “Read [marker case].” “Move it to resolved with summary [exact text]” before triage must refuse. “Triage it.” Then resolve with actual summary and confirm. Existing active repair has both parties' explicit reported agreement available for the final step. | `get_conflict_case`, `update_conflict_case`, `update_repair_agreement`. Shared REST validators enforce allowed moves, summary, party/facilitator rules and privacy. Reporter can correct allowed text or close their report, not impersonate a facilitator. Before Yes no case/repair change. Missing summary, unrelated viewer, party acting as triage and repair fulfillment without `confirmed_by_parties` all refuse. Explicit check-in notes persist; fulfillment records completion date and parties' attestation only after exact confirmation. Close and replay cannot create another action. |

For each family retain the original transcript on any model error or mistaken
tool choice. Assess missing intended writes separately from unauthorized writes.
After the five families, rerun the unchanged P1/P2/P3 plain-language cases using
the actual generated text and unchanged grade/word/jargon thresholds. The short
`plain_help` data and prompt wording are implementation aids, not evidence that
the model passed. Teardown only marker-owned synthetic records; ordinary cases
with no reversible teardown remain archived/withdrawn with their evidence.

The fresh preparer variant separates recipient-name search, existing-collaboration search and audit-draft read into explicit read-only turns before the respective write request. This makes those capabilities observable independently of a write's server preflight or returned record. Subsequent exact confirmation, cancel, replay, author attribution, private-access and persisted-state assertions remain. Prepare to a new manifest and run to a new result file: the original pass07 manifest and six-of-ten result remain immutable evidence.

The next fresh variant also gives target-group discovery its own read-only turn before proposing collaboration. This isolates all four reads without treating preflight ID resolution as search coverage. Separately run an equivalent combined request (existing collaboration search, group search, propose; then Yes; then GET persisted collaboration) to verify the original omission is closed in ordinary combined use. Neither new variant changes earlier failed manifests or results.
