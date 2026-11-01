---
type: Governance Review
layers: "4-10"
timestamp: "2026-10-31"
evidence: [pass 01 synthesis + ledger, code read 2026-10-31]
---

# Governance completeness review: layers 4-10

Path prefixes: `BE/` = `neos-operating-system/agent/src/neos_agent/`, `FE/` = `charting-the-course/client/src/`. Craft wave-1 lanes are editing `governance_tools.py`, `exit.py` and `discover.py`, so line numbers may drift. *(in flight)* marks work a craft lane already owns.

**Headline.** Five finished components are never mounted: `CompleteRecoveryDialog`, `ConflictTriageModal`, `RepairCheckinModal`, `ExitDataExportCard` and `GovernanceHealthAuditForm` (`FE/components/governance/`). So Recovery, triage, repair follow-up, data export and audits can start but cannot finish in the UI. `notify_members` (`BE/services/notifications.py:49`) has no callers, so no state change in these layers reaches anyone.

## 1 Coverage matrix

Status key: COMPLETE, PARTIAL (works but misses a framework step), MISSING (no flow), CONFUSING (a flow exists but its behaviour or copy misleads). "Unmounted" = the component exists but no page renders it.

| Skill | Model | API | UI | Agent (chat / MCP) | Status | Evidence |
|---|---|---|---|---|---|---|
| resource-request | Proposal type `resource` | /proposals | ProposalForm | create_proposal | PARTIAL | No amount or pool fields (`FE/lib/proposal-vocab.ts:3`, `BE/agent/router.py:79`) |
| funding-pool-stewardship, participatory-allocation, access-economy-transition | none | none | none | none | MISSING | `agent/docs/GOVERNANCE_SKILL_PIPELINES.md:612-616` still marks economics ✅ |
| commons-monitoring | SharesNeeds `funding` | /discover | SharesNeedsList | none | MISSING | No flow or threshold tracking |
| cross-ethos-request | Collaboration, CollaborationApproval | /collaborations, /:id/activate | CollaborationDetail | none | CONFUSING | A click records only one side; GET does not return approvals (`BE/api/discover.py:857-958,1063-1100`); button text never changes (`FE/pages/discover/CollaborationDetail.tsx:92-95`) *(in flight: BE-Groups)* |
| federation-agreement | Collaboration.engagement_tier | same | same | none | PARTIAL | No end, review or amend route, so `dissolved` cannot be reached |
| inter-unit-liaison | none | none | none | none | MISSING | Deferred (`BE/agent/system_prompt.py:132`) |
| polycentric-conflict-navigation | ConflictCase.shared_ecosystem_ids | /conflicts | ConflictForm | create_conflict_case | PARTIAL | Same flow as an interpersonal conflict; no per-ecosystem representatives |
| shared-resource-stewardship | SharesNeeds `share` | /discover | SharesNeeds pages | none | MISSING | No steward or rotation |
| escalation-triage | ConflictCase tier, safety_flag, facilitator_id | PUT: any member, any field (`BE/api/conflicts.py:269-303`) | ConflictTriageModal unmounted | triage_conflict | CONFUSING | No UI changes status. Tool nulls fields it is not given (`BE/agent/governance_tools.py:1358-1359`) |
| nvc-dialogue, coaching-intervention, community-impact-assessment | tier label | none | none | tier label (`governance_tools.py:1365`) | MISSING | Fine as guidance-only (§5) |
| harm-circle | tier 3 | none | none | Router targets both create_agreement_draft and create_repair_agreement (`BE/agent/router.py:85,141`) | CONFUSING | |
| repair-agreement | RepairAgreementRecord (30/60/90) | POST/PUT /conflicts/:id/repair | RepairAgreementForm; RepairCheckinModal unmounted | create_repair_agreement | PARTIAL | Form never sets check-in dates (`FE/pages/governance/conflicts/RepairAgreementForm.tsx:61-71`); schema drops `completed_date` (`BE/api/schemas/conflicts.py:100-110`); anyone marks fulfilled |
| governance-health-audit | GovernanceHealthAudit | GET, POST /safeguards/audits; no update | Safeguards pages; form unmounted | create_safeguard_audit | CONFUSING | Drafts read "AI analysis pending" forever (`BE/api/safeguards.py:307-309`); default auditor is "AI Governance Agent" (`BE/api/schemas/safeguards.py:60`) |
| capture-pattern-recognition | capture_risk_indicators, ComplianceSummary | /compliance/generate | ComplianceDashboard | none | PARTIAL | Only an AI signal; no report flow |
| independent-monitoring, structural-diversity-maintenance | none | none | none | none | MISSING | |
| safeguard-trigger-design | triggered_safeguards JSON | none | display only (`SafeguardsDashboard.tsx:230`) | none | MISSING | Nothing evaluates triggers |
| emergency-criteria-design | criteria_met | REST ignores it (`BE/api/emergency.py:65-69`) | free-text reason | declare_emergency | MISSING | |
| pre-authorization-protocol | pre_authorized_roles | always `[]` (`emergency.py:216`) | copy claims pre-authorized actions (`FE/pages/governance/emergency/EmergencyDashboard.tsx:91-92`) | none | MISSING | The copy also misleads |
| crisis-coordination | actions_log | declare, resolve | Dashboard, Detail | declare_emergency, get_emergency_state | PARTIAL | Log not shown; no "emergency context" tagging; no extension |
| emergency-reversion | EmergencyState | /resolve, cron, /complete-recovery | Recovery labelled "Resolved" (`EmergencyDetail.tsx:52-53`); CompleteRecoveryDialog unmounted | no resolve tool | CONFUSING | Recovery can never close (next row). Legacy `/dashboard/emergency/:id/resolve` jumps from open straight to closed (`BE/views/emergency.py:188`) and is still registered (`BE/main.py:196`) |
| post-emergency-review | post_review_status | **nothing writes it**; only the gate at `emergency.py:311` reads it | none | none | MISSING | Blocks emergency-reversion |
| decision-record | DecisionRecord + dissent, tags | GET only (`BE/api/decisions.py:138,204`); ACT writes records (`BE/services/act_gates.py:278,478`) | DecisionList, DecisionDetail | create_decision_record / list_decision_artifacts | PARTIAL | Dissent is returned (`decisions.py:100-108`) but never shown; chat records go straight to `active` *(authz in flight)*; emergency, conflict and exit outcomes never create a record |
| precedent-search | same | `?q`, domain, layer | DecisionList filters | search_precedents | COMPLETE | |
| precedent-challenge | overruled_by, superseded_by | none | display only | none | MISSING | |
| semantic-tagging | DecisionSemanticTag | in GET | not shown | create_decision_record only | PARTIAL | |
| agreement-versioning | AgreementVersion | /history, /rollback | AgreementHistory | none | COMPLETE | |
| voluntary-exit | ExitRecord | POST /exit, /:id/status (free text) | ExitForm, List, Detail | create_exit_record | CONFUSING | `member_id` comes from the request body (`BE/api/exit.py:193`); anyone sets any status (`exit.py:244`); UI reads `member_name`, `reason`, `unwinding_tracker`, which the API never sends (`FE/pages/governance/exit/ExitDetail.tsx:95,154,178,189`) *(scope fix only in flight)* |
| commitment-unwinding | commitment_inventory, unwinding_status | created empty (`exit.py:198-199`), never updated | reads a missing key | none | MISSING | |
| portable-record | data_export_* | no route; the client "export" overwrites the exit status (`FE/lib/api-client.ts:499-501`) | ExitDataExportCard unmounted | none | MISSING | |
| re-entry-integration, ethos-dissolution | re_entry_eligible, Ecosystem.status | none | none | none | MISSING | |

## 2 Interaction confusions (safety-critical first)

**Emergency**
1. **Recovery looks like "System Normal".** The dashboard counts only `open` as active (`EmergencyDashboard.tsx:73`). During Recovery it offers Declare, which then fails with a raw 409.
2. **Recovery cannot end.** Nothing sets `post_review_status`, so complete-recovery always returns 409. Cron scans only `open` (`BE/services/cron.py:139`), so the 30-day Recovery deadline has no effect.
3. **"Auto-Revert At" changes meaning.** While open it is when emergency authority ends. In Recovery it is the ratification deadline (`emergency.py:261`), under the same label. The 14-day review deadline is never shown.
4. **The resolve dialog promises a "return to normal operations".** Resolving actually starts a 30-day Recovery (`EmergencyDetail.tsx:73-76`).
5. **Who decides is unclear, and nobody is told.** Any member can declare or resolve (`emergency.py:171-185`). The nav hides Emergency from non-stewards (`FE/components/AppSidebar.tsx:97`), and no notification fires.
6. **One ecosystem's emergency can hide another's.** `current` is the newest emergency across all selected ecosystems (`emergency.py:125-129`).
7. **The timer has no ceiling.** Defaults differ: 7 days in the UI (`EmergencyDashboard.tsx:27`), 30 in the API with no maximum (`emergency.py:69`), 30 fixed in chat. A 3650-day emergency is accepted.

**Conflict**
8. **The form promises what nothing does.** It says "A conflict steward will be assigned within 48 hours" (`FE/pages/governance/conflicts/ConflictForm.tsx:214-219`). Nobody is assigned, and the case stays `reported`.
9. **The reporter is never recorded.** The API trusts a body `reporter_id` the UI never sends (`conflicts.py:243`), so reporters cannot find their case. `safety_flag` has no effect.
10. **Every member can read every harm report**, including the person reported (`conflicts.py:93-120`).
11. **The facilitator shows as a raw UUID** (`ConflictDetail.tsx:120`). Repair "next check-in" is always blank.

**Exit**
12. **Anyone can file, cancel or complete anyone's exit.** This violates Principle 3 ("exit requires permission") and voluntary-exit §G.
13. **"Cooling-off" implies a wait.** The skill requires no waiting period and caps handoff at 30 days. The target date is hidden, and nothing happens when it passes.
14. **The exit page is mostly blank.** Name, reason and unwinding are empty, "The member will be notified" is false (`ExitDetail.tsx:32,36`), and a completed exit leaves the member `active`.

**Audit, collaboration, memory**
15. **"Request Audit" computes nothing.** It promises to "compute a health score" (`SafeguardsDashboard.tsx:184`) but creates a permanent AI-pending draft. That contradicts the owner decision that everything works without AI.
16. **"Activate collaboration" only records your side**, with no "waiting on B".
17. **Chat-made precedents look ratified**, and dissent is invisible.

## 3 Ranked extensions (max 10)

No item needs a migration. Put every authority rule in `BE/api/policy.py` and resolve the caller with `caller_in` (`BE/api/guards.py:42`), so REST and chat share one rule.

**E1. An emergency Recovery you can see and finish.** Effort M; API, UI, cron.
- **Change:**
  - Add `POST /emergency/:id/review` taking `{outcome: scheduled|complete, summary}`. It sets `post_review_status` and logs the review. Return 403 if the caller declared or resolved the emergency, since emergency actors are excluded from the review.
  - Add computed `phase`, `review_due_at` (+14 days), `ratify_by` and a plain `next_step` to the detail.
  - In the UI, show an amber Recovery card, mount `CompleteRecoveryDialog` and a review form, render `actions_log`, and fix the copy.
  - Route the legacy resolve through the same transition.
- **OWNER:** at 30 days, auto-close (skill §J) or stay open and flag "review overdue" (step 10)?
- **Test:** A declares and resolves. complete-recovery returns 409 with `next_step`. A's review attempt returns 403. B's review, then complete-recovery, reaches closed. The legacy route cannot close an open emergency.

**E2. Declaring has a named authority and a bounded clock.** Effort S; API, agent.
- **Change:**
  - Add `can_declare_emergency`, defaulting to steward, for REST declare and resolve and for chat *(chat side in flight: p1-coord-chat-tool-authz)*.
  - Set `declared_by` from the caller.
  - Use `auto_revert_days: Field(30, ge=1, le=30)` and require a reason.
  - Make chat write naive-UTC timestamps. It passes a timezone-aware `now` today (`governance_tools.py:1412` vs `emergency.py:38-40`); verify on asyncpg.
- **OWNER:** may members with co-signers declare? What is the maximum duration?
- **Test:** a user-role member is refused through REST and chat. A steward's 365-day request gets 400. `declared_by` equals the steward's name.

**E3. Every member can see an emergency is on.** Effort S-M; API, UI.
- **Change:** the dashboard summary carries the emergency for each ecosystem. One layout banner shows while it is open or in Recovery. The Emergency page becomes readable by all members (only Declare stays gated). `current` becomes per ecosystem. No push notifications.
- **Test:** B is open and A closed more recently. A member of both sees B's banner; a member of A only sees none.

**C1. Conflicts get an owner, a next step and privacy.** Effort M; API, UI.
- **Change:**
  - The server sets `reporter_id`.
  - PUT enforces the status table: reported, triaged, in progress, resolved, closed. Resolving requires a summary.
  - Add `can_triage_conflict`: a steward or the assigned facilitator, never a named party.
  - Mount `ConflictTriageModal` with a member picker.
  - The detail shows `next_step` (e.g. "Waiting for a steward to triage") in place of the 48-hour promise.
  - Only the reporter, facilitator and stewards can read the detail.
- **OWNER:** who triages, and is this the right confidentiality default?
- **Test:**
  - The reporter is set to the caller.
  - A non-steward status PUT returns 403.
  - A steward triages to tier 3.
  - An unrelated member's GET returns 404.
  - Resolving without a summary returns 400.

**X1. Exit is self-declared, bounded and readable.** Effort M; API, UI, agent.
- **Change:**
  - Create (REST and chat) forces `member_id` to the caller.
  - Status goes declared, then handoff, then completed. Only the leaver may cancel.
  - Completion writes a `MemberStatusTransition` to `exited`. That status is outside the participating set at `BE/services/agreement_consent.py:17`, so the leaver is no longer asked to consent.
  - The serializer adds `member_name` and `reason`.
  - The UI shows "Handoff ends <date> (max 30 days)" and drops the notification promise.
- **OWNER:**
  - Is steward-initiated removal a separate process?
  - Should an exit auto-complete at its deadline, with unresolved items queued?
- **Test:** B files for A and gets 403. A's filing shows name and deadline. A steward's cancel returns 403. After A completes, A is `exited` and no longer required to consent to new agreements.

**X2. A portable record that downloads.** Effort M; API, UI.
- **Change:** add `GET /exit/:id/portable-record`, owner-only. It returns JSON of the caller's own memberships, consents, proposals, advice, consent positions and decision participation. It sets `data_export_*` and never touches status. Repoint `requestExitDataExport` to it and mount `ExitDataExportCard`.
- **Test:** A's export includes A's proposals and excludes B's objection text. The exit status is unchanged. B's request for A's record returns 403.

**R1. Repair agreements get followed up.** Effort S; API, UI.
- **Change:** check-ins default to +30, +60 and +90 days. The server sets `completed_date` on `fulfilled`. Mount `RepairCheckinModal` and show the next check-in with an overdue badge. Marking fulfilled requires `confirmed_by_parties`, because the skill requires both parties to confirm.
- **Test:** dates are auto-set. Fulfilling without confirmation returns 400; with it, `completed_date` is set.

**A1. Health audits a human can finish.** Effort M; API, UI.
- **Change:** add `PUT /safeguards/audits/:id` and `POST /:id/publish`. The request asks for scope and period, and the auditor is the caller. Mount `GovernanceHealthAuditForm` with plain indicator guidance. The assistant may draft but never publish. The dashboard score uses published audits only.
- **OWNER:** exclude leadership of the audited body, as the skill does?
- **Test:** an auditor publishes and the score appears. A non-auditor's publish returns 403. A draft never sets the score.

**L9. Precedents you can trust.** Effort S; API, UI, agent.
- **Change:** chat records start `unverified` with recorder set to the caller. Add `POST /decisions/:id/verify` for a different member (the skill's 72-hour check). DecisionDetail shows dissent and tags.
- **OWNER:** should emergency, exit and conflict outcomes create records?
- **Test:** a chat record shows "unverified". The recorder's own verify returns 403. Another member's verify makes it `active`.

**L5. Collaboration approvals you can see and leave.** Effort S; API, UI. *(coordinate with BE-Groups)*
- **Change:** GET returns approvals and which ecosystem is awaited. The button reads "Approve for <ecosystem>" and is disabled once that side approves. Add `POST /collaborations/:id/end` for either side.
- **OWNER:** a steward rather than any member?
- **Test:** after A approves, the page shows "waiting on B". B approves and it becomes active. A ends it and it becomes dissolved.

## 4 Agent gaps

**UI only (the assistant cannot):**
- emergency: resolve, complete recovery, history
- conflicts: read a case, record repair check-ins
- exit: transitions, read
- audits: read
- compliance: generate
- discover

**Assistant only:** conflict triage (the modal is unmounted), scored audits, creating decision records, and `criteria_met`. **MCP:** nothing for layers 4-8 or 10; the only tool is `list_decision_artifacts` (`BE/mcp_server.py:327`).

**Unsafe or misleading behaviour:**
- **declare_emergency:** no caller check, a model-supplied `declared_by` that defaults to "system" (`governance_tools.py:1413`), and a fixed 30 days. "check_authority first" is prompt text only (`BE/agent/system_prompt.py:109`) *(in flight)*.
- **get_emergency_state:** reads the first ecosystem only (`governance_tools.py:1372`). In Recovery it presents the ratification deadline as `auto_revert_at` and never states the next step.
- **create_exit_record:** resolves any member by name (`governance_tools.py:1442-1453`).
- **triage_conflict:** anyone can triage.
- **create_decision_record:** mints `active` precedent.
- **create_safeguard_audit:** lets the AI author a health score.
- **Fix:**
  - Add read tools `get_conflict_case` and `get_exit_record`.
  - Make `get_emergency_state` per-ecosystem, returning `phase`, deadlines and `next_step`.
  - Give `declare_emergency` and `create_exit_record` a `confirm: true` step that previews the effect before acting.
  - Reuse the E2, C1 and X1 predicates.

## 5 Explicitly rejected (over-engineering)

- **Funding-pool treasury or budgeting engine.** Use proposal type `resource` until a real pool exists.
- **Access-economy stage tracker.** Nothing needs it yet.
- **NVC, coaching, harm-circle and impact-assessment models.** Triage notes plus a repair agreement are enough.
- **Emergency criteria and pre-authorization registries.** Record the criterion text and fix the copy instead.
- **Monitor rotation and trigger engine.** Published human audits come first.
- **AI capture scoring.** It conflicts with the AI-independence decision.
- **The pipeline engine in `GOVERNANCE_SKILL_PIPELINES.md`.** Correct the doc's ✅ claims instead.
- **Push notification infrastructure.** Banner and dashboard for now.
- **Portable-record verification hash.** Plain JSON first.
- **Liaison, dissolution and re-entry workflows.** Honour `re_entry_eligible` instead.
- **Vector precedent search.** `?q` plus filters suffice.
