---
type: Governance Review
layers: "1-3"
timestamp: "2026-10-31"
evidence: [pass 01 synthesis + ledger, pass 02 scenario]
---

# Governance completeness review: layers 1-3

Path prefixes: `BE/` = `neos-operating-system/agent/src/neos_agent/`, `FE/` = `charting-the-course/client/src/`. Line numbers are from the tree as read on 2026-10-31. Craft wave 1 lanes are editing several of these files, so lines may drift. Items already owned by a craft lane are marked *(in flight)*.

## 1 Coverage matrix

Status key: COMPLETE, PARTIAL (works but misses a framework step), MISSING (no flow), CONFUSING (a flow exists but its behaviour or copy misleads). No skill in layers 1-3 is COMPLETE.

| Skill | Model | API | UI | Agent (chat / MCP) | Status | Evidence |
|---|---|---|---|---|---|---|
| agreement-creation | Agreement, AgreementVersion, AgreementCeremony, AgreementMemberConsent | `POST /agreements`, `/status`, `/ceremonies`, `/consent` | `/agreements/new`, AgreementDetail | create_agreement_draft, update_agreement_status / create_agreement, record_agreement_ceremony, attest, transition | CONFUSING | Consent needs **every** participating member, pending ones included, to attest, with no object or stand-aside (`BE/services/agreement_consent.py:17,44-50`). A declared quorum cannot relax that (`BE/services/act_gates.py:356-358`). Agreement "advice" is a note any active member records (`BE/api/agreements.py:760-781`). |
| agreement-amendment | AmendmentRecord (nothing writes it) | none. Edits are allowed only in draft and advice, and the error tells people to "reopen governance", which has no route (`BE/api/agreements.py:529-532`) | AgreementHistory reads amendments | none | MISSING | An active agreement cannot be changed by any path. A ratified proposal never touches an agreement (`act_gates.py:240-330`). |
| agreement-registry | Agreement, AgreementVersion | `GET /agreements`, `/history`, `/rollback` | AgreementList, AgreementHistory | search_agreements, get_agreement / list_agreements | PARTIAL | Any member with active status can roll back (`agreements.py:1094-1097`). Ratified proposals never appear in the registry. Review dates are only logged (`BE/services/cron.py:33-55`). |
| agreement-review | ReviewRecord (nothing writes it) | `active -> under_review -> active/sunset` (`agreements.py:304-312`) | status select on AgreementDetail | update_agreement_status | PARTIAL | No review outcome or record is written, and nobody is told a review is due. |
| universal-agreement-field | AgreementRequirement, MemberOnboarding.section_consents | `POST /ecosystems/:id/join`, `POST /onboarding/:id/ceremony` | consent gate, OnboardingCeremony | MCP attest | CONFUSING | Two entry-consent models: six hard-coded sections not tied to the UAF text (`BE/api/onboarding.py:34-40`), and agreement attestations. Any member can record section consent for any other member (`onboarding.py:190-224`). |
| domain-mapping | Domain (+name), DomainElement | `POST/PUT /domains` (mod+) | DomainForm, DomainDetail | create_domain_draft, get_domain, list_domains | PARTIAL | A domain is created `active` with no consent round (`BE/api/domains.py:355-356`). |
| domain-review | none | none | none | none | MISSING | No model or route. |
| role-assignment | Domain.steward_id plus current_steward text, CircleMembership.role, Member.role tier | `PUT /domains`, `PUT /members/:id/role` | DomainForm, AdminPanel | check_authority, get_member_roles | CONFUSING | "Steward" means three things: mod+ for proposals (`BE/api/proposals.py:111`), admin/owner for agreement ceremonies (`agreements.py:630`), and steward_id for domains (`domains.py:100-103`). A co_creator or builder **profile** can grant any tier, owner included (`BE/api/members.py:549-555`). |
| role-transfer | same | `PUT /domains` | DomainForm | none | MISSING | A domain steward can rewrite their own steward_id (`BE/api/schemas/domains.py:73-82` with `domains.py:100-103`). No record is kept. |
| role-sunset | Domain.status | `PUT /domains` | DomainForm | none | MISSING | The steward can set the status on their own. No disposition step. |
| authority-boundary-negotiation | none | none | none | none | MISSING | No model or route. Defer it (§5). |
| member-lifecycle | Member.current_status, MemberStatusTransition | `POST /members/:id/status` (mod+, free string: `members.py:575-612`) | MemberDetail | get_active_members, create_exit_record | PARTIAL | No state machine and no inactivity detection. `last_governance_activity_date` is set only by agreement consent (`agreements.py:880,962`). |
| proposal-creation | Proposal | `POST/PUT /proposals` | ProposalForm | create_proposal / create_proposal | PARTIAL | Affected domain is free text (`FE/pages/governance/proposals/ProposalForm.tsx:236-237`), and there is no impacted-parties field. Decision types are consent/consensus/advice/autocratic (`:20-25`), which the engine ignores. Urgency is low..critical (`FE/lib/urgency.ts:3`), and no deadline is derived from it. An edit keeps v1.0 (ledger audit-29). |
| act-advice-phase | AdviceLog, AdviceEntry, AdviceNonRespondent | `POST /advice` (+new_round) | AdviceTab | record_advice / record_proposal_advice | CONFUSING | The first entry ends the phase (`act_gates.py:132-133,216-218`; ledger audit-5 OWNER), and the deadline is ignored. The proposer-response fields are never exposed or written (`proposals.py:207-218,801`). Any advisor can open a round (`proposals.py:781`, `FE/.../ProposalDetail.tsx:219-224`). |
| act-consent-phase | ConsentRecord, Participant, IntegrationRound, ObjectionAddressed | `POST /consent` | ConsentTab | record_consent_position / submit_proposal_consent | CONFUSING | The participant name comes from the request body (`BE/api/schemas/proposals.py:171-174`, `proposals.py:916`). There is no phase check and no de-duplication (`proposals.py:890-921`). Only `withdrawn` unblocks an objection (`act_gates.py:55-57`), and no route or UI ever sets it. The integration-round tables are unused. |
| consensus-check | ConsentRecord.quorum_* | gate only | ActGatesPanel, the "Quorum Met" badge | check_quorum | CONFUSING | There are three quorum truths (§2 C3). `quorum_met` is never written, so the badge always reads "No Quorum" (`proposals.py:906`, `ProposalDetail.tsx:384-385`). |
| act-test-phase | TestReport, TestSuccessCriterion | `POST /test` | TestTab | none / submit_test_report | CONFUSING | One `passed` report from any member ratifies (`act_gates.py:175-176`). The route has no role or phase check and records no reporter (`proposals.py:976-1031`). Criteria are typed at report time, not taken from the declared cases (`ProposalDetail.tsx:446-468`). `passed` renders red because the code compares `'pass'` (`:552`). No revert, extend or modify path (`proposals.py:69-75`). |
| proposal-resolution | ConsentRecord.escalation_level (unused) | none | none | none | MISSING | A stuck proposal can only be withdrawn. |

## 2 Interaction confusions

- **C1. "Did my advice just end the advice phase?"** (F01, audit-5 OWNER) The advisor's toast now explains the move (ledger arrival-and-welcome-8 FIXED). The proposer and the other advisors learn nothing. The Details rail still shows a future "Advice Deadline" for a phase that has already closed (`ProposalDetail.tsx:936-937`). The framework says the advice window closes at the deadline and that the *proposer* then decides to proceed (act-advice-phase E.6-8).
- **C2. Gate inheritance.** The panel says "Gates inherited from the governing agreement" but does not show the values (`FE/components/governance/ActGatesPanel.tsx:81-82`). The same `act_policy` means different things in the two places. AgreementForm always sends `consent_quorum: null` (`AgreementForm.tsx:118-123`). On the agreement, null means every member. On a proposal it governs, null means one position (`act_gates.py:149`). The governing agreement can be a draft (`proposals.py:347-356`). The label "Governing agreement" also reads as "the agreement this changes".
- **C3. Consent positions and objections.** The stepper promises "Objections improve the proposal" (`ACTStepper.tsx:26`), but nothing integrates one. A member who objects and later consents adds a second row, and the objection still blocks. One member can submit three times to reach a quorum of 3. Quorum has three answers: the form says "All positions" (`ProposalForm.tsx:308`), the engine uses 1, and the assistant says ⌈2/3⌉ of active members (`BE/agent/governance_tools.py:990-998`). A chat objection does not block (§4). Agreements have no objection at all, only attest and withdraw.
- **C4. Who decides?** Proposals are managed by mod+. Agreement ceremonies need admin or owner ("conducted by stewards (admin/owner)", `AgreementDetail.tsx:220-221`). Domains have a steward_id. MemberDetail hides the tier behind a developer note: "Per-ecosystem role tiers arrive with the role model (H4)" (`MemberDetail.tsx:147`). Pass-01 audit-6 and keyboard-week-13 found newcomers puzzled by management controls.
- **C5. Role vs profile.** In the framework, a profile (Co-creator, Builder, Collaborator, TownHall) is a participation category whose default is Builder (member-lifecycle E.9). In the code, a profile acts as admin (`BE/api/helpers.py:27-34`) and can mint owners.
- **C6. Domain stewardship and blocks.** A join attempt is refused with "stewardship roles require a separate governance action" (`domains.py:464`), and no such action exists. The 409 `required_agreements` reaches the user as a bare message with no links (`DomainDetail.tsx:123-131`). Pass 02's probe persona exercises exactly this path.
- **C7. Ratified is not registered.** The proposal page says "now active" (`ProposalDetail.tsx:701-707`, `ACTStepper.tsx:38`), but nothing appears in /agreements. "Your Decision", the member's personal note, sits next to the ecosystem decision record and is easy to mistake for it (`ProposalDetail.tsx:892-907`).
- **C8. What needs me?** The decision queue lists every proposal in advice or consent. That includes ones the viewer has already acted on or wrote. It leaves out test reports and agreements waiting for an attestation (`FE/pages/Dashboard.tsx:102-103,135-136`). Pass-01 found the bell is a stub (F04) and that /proposals had the highest revisit count.
- **C9. Test outcomes.** A passed report shows red. A failed report changes nothing, so the proposal sits in Test forever.

## 3 Ranked extensions

The first entry in each item is the smallest change. "Shared migration" means one Alembic revision adding three nullable FKs: `consent_participants.member_id`, `advice_entries.member_id` and `test_reports.reporter_member_id`.

1. **One position per person** (C3)
   - **Change:** Record consent as the caller, the same way advice already works, and ignore the body's `member_name`. Upsert the caller's position in the latest consent record, so the latest position wins and the older one stays as history by `round`. Refuse positions outside `consent`. The engine treats `object` and `objection` alike. The UI shows "Your position: Object. Change it".
   - **Touches:** model, API, UI, agent. **Migration:** shared. **Effort:** S.
   - **Flow test:** Ines objects and then consents. The gate shows 0 open objections and the proposal advances. A second consent from her leaves the position count unchanged. A body naming "Oren" is recorded as Ines.
2. **The assistant runs the same ACT rules** (§4)
   - **Change:** Chat `record_consent_position` delegates to the caller-scoped REST/MCP handler. Fix the `rec.round` crash in `get_proposal` and add gates. `check_quorum` returns the gate's numbers. `check_authority` and `get_member_roles` report the role tier via the real predicates. `update_agreement_status` uses the REST ceremony path, keeping the gates and the version.
   - **Touches:** agent. **Migration:** no. **Effort:** M. *(Authorization is in flight: BE-ACT `p1-coord-chat-tool-authz`. The vocabulary, the crash and the gate bypass are not named in that lane.)*
   - **Flow test:** An objection given through chat keeps the proposal in Consent. Chat `get_proposal` works on a proposal in consent. A non-steward's agreement move is refused, and the agreement version is unchanged.
3. **Next step in plain words** (C1, C4, C6, C8)
   - **Change:** Add one helper, `act_next_step(record, caller)`, returning `{waiting_on, who_can_act, by_when, your_action, blocked_by[]}`, with objector names, missing cases and required agreements as links. Return it on proposal and agreement detail, on MCP `get_proposal_gates` and on chat `get_proposal`. The UI renders it in place of the generic "Your input is needed" banner. The proposer sees "Advice moved this to Consent on 31 Oct".
   - **Touches:** API, UI, agent. **Migration:** no. **Effort:** M.
   - **Flow test:** For a proposal in consent with one objection, the objector gets `your_action=change_position`, the proposer gets `blocked_by` naming the objection, and chat returns the same text.
4. **OWNER: advice closes on the proposer's call**
   - **Change:** Stop the automatic advice -> consent move. Enable the existing "Move to consent" button once the minimum rounds are met and, if a deadline is set, it has passed. Let the proposer mark each entry integrated, partly integrated or not integrated, with a one-line response. This is `PATCH /proposals/:id/advice/:entry_id`; the fields already exist.
   - **Owner decides:** whether advance is automatic or manual, and whether unanswered advice blocks consent (framework I: "cannot proceed").
   - **Touches:** API, UI, agent. **Migration:** no. **Effort:** M.
   - **Flow test:** Kofi advises and the proposal stays in Advice. Ines responds "partly integrated", moves it to Consent, and Kofi sees her response.
5. **Send back for revision** (C3, C9, audit-29)
   - **Change:** The proposer or a steward can move consent -> advice or test -> advice with a reason. The version bumps a minor step, a new advice round and consent record open, and earlier positions stay as history. Add a terminal `reverted` from test, with a revert note. After three send-backs, `next_step` says "needs facilitation". This is a flag only, not GAIA machinery.
   - **Touches:** API, UI, agent. **Migration:** no. **Effort:** M.
   - **Flow test:** After an objection, Ines revises. The proposal shows v1.1 in Advice and the old objection is history. A failed test followed by revert ends in Reverted.
6. **One gate vocabulary**
   - **Change:** Add one `consent_quorum_required()` used by the gate, the panel ("needs 3, 1 recorded"), the form placeholder and the assistant. A quorum declared on an agreement relaxes "all members". `consensus` forbids stand-aside and needs all positions to be consent. Remove the "autocratic" and "advice" decision types. A governing agreement must be `active`.
   - **Owner decides:** the default quorum, 1 or ⌈2/3 of active members⌉ as in the framework.
   - **Touches:** API, UI, agent. **Migration:** no. **Effort:** S.
   - **Flow test:** For an agreement with quorum 3, three attestations activate it. A proposal in consensus mode with a stand-aside stays in Consent. Choosing a draft governing agreement returns 400.
7. **Tests are reviewed, not self-certified**
   - **Change:** Record who filed each report. Anyone can report observations, but only a report from the proposer or a steward with outcome `passed`, or a manual "Ratify proposal", satisfies the test gate. Prefill the form with the declared cases, and fix the `pass`/`passed` badge.
   - **Owner decides:** whether test -> ratified stays automatic.
   - **Touches:** model, API, UI. **Migration:** shared. **Effort:** S.
   - **Flow test:** A newcomer's `passed` report leaves the proposal in Test. The proposer's report ratifies it and creates the decision record.
8. **Authority changes are governed and visible** (C4, C5, C6)
   - **Change:** A domain steward cannot change their own steward_id or status; only mod+ can. Each change mints a DecisionRecord (`source_skill` role-transfer or role-sunset) with a reason. `current_steward` is derived from steward_id. MemberDetail shows the tier in plain words ("Moderator: can manage proposals"). Onboarding section consent is accepted only from the member or a mod+ facilitator. Fix the copy of the join 403.
   - **Owner decides:** whether the profile bootstrap (`members.py:549-555`) applies only while an ecosystem has no owner.
   - **Touches:** API, UI. **Migration:** no. **Effort:** S-M.
   - **Flow test:** Amara, as steward, cannot hand off her domain. A moderator can, and the decision record lists it.
9. **Ratification reaches the registry** (C7)
   - **Change:** Add a "Propose a change" button on active agreements that creates a draft proposal with `amends_agreement_id`. On ratification, write an AmendmentRecord and an AgreementVersion with the new text. Members re-attest automatically, because consent is stored per version. Until this ships, fix the "now active" copy.
   - **Owner decides:** whether proposals with no target register a new agreement, auto (`requires_explicit_consent=false`) or by steward one-click.
   - **Touches:** model, API, UI. **Migration:** `proposals.amends_agreement_id`. **Effort:** M.
   - **Flow test:** An amendment is ratified. /agreements shows v1.1, the history shows an amendment record, and a member's v1.0 consent shows as needing re-attestation.
10. **A "Needs me" queue** (C8, F04)
    - **Change:** Add `GET /proposals?needs_me=1`, covering proposals where the caller can act and has not yet, using the member ids from the shared migration. Add agreements awaiting the caller's attestation, and the caller's own proposals that changed since they last looked (a client-side last-seen check, not a notification system).
    - **Touches:** API, UI. **Migration:** shared. **Effort:** S-M.
    - **Flow test:** After Kofi advises, the proposal leaves his queue and stays in Ines's queue as "moved to Consent".

## 4 Agent gaps

**Possible in the UI but not through chat:** submit a test report; attest to or withdraw agreement consent; record an agreement advice round or ceremony under the REST rules; join a domain; edit a proposal or set its governing agreement and gates (chat `create_proposal` has no `governing_agreement_id` and overwrites `decision_type` with the consent mode, `governance_tools.py:686-692,714`). MCP covers most ACT moves but has no proposal detail with advice text, and no domain or member tools.

**Possible through the assistant but not in the UI:** `check_quorum`, `check_authority`, and a free-form `create_decision_record` that mints a record with no ACT process behind it. Its authorization is in flight; whether it should exist outside ACT is a policy question.

**Answers likely to mislead:**
- `get_proposal` reads `rec.round`, a column ConsentRecord does not have (`governance_tools.py:2013`). It will fail for any proposal that has a consent record, which means the assistant cannot read proposals at the stage where people ask most. No test covers it.
- `record_consent_position` stores `objection`, which does not block (`:853`, versus `act_gates.py:57`). It records for any named participant (`:926`) and never auto-advances.
- `check_quorum` says "need 11 of 16" while the engine advances on one position. The system prompt makes the assistant call it before every consent (`BE/agent/system_prompt.py:111`).
- `check_authority` and `get_member_roles` match by display name and current_steward text and ignore the role tiers that actually govern (`governance_tools.py:503-648`).
- `update_agreement_status` allows consent -> active, skips the gates, and bumps the version on transitions (`:72-80,92`). The version bump silently invalidates every member's attestation.
- `agent/docs/GOVERNANCE_SKILL_PIPELINES.md:139-185` describes `adopted` and `reverted` statuses and criteria fixed at the start of a test, none of which exist.

## 5 Explicitly rejected (over-engineering)

- **A notification system now:** §3.3, §3.10 and craft's `on_transition` hook cover it. PB-BELL stays DEFERRED.
- **The six-level GAIA escalation engine:** a "needs facilitation" flag is enough until real stalls appear.
- **Impacted-party and deciding-body registries with reminders:** revisit if pass 02 shows selective consultation.
- **Separate role-assignment, transfer and sunset workflows** with overlap periods: use proposals plus decision records (§3.8).
- **Domain-review and boundary-negotiation modules:** use conflicts and proposals.
- **A section-by-section UAF ceremony with enforced cooling-off.**
- **Proxy or weighted consent.**
- **Snapshotting the governing policy into each proposal:** active agreements are not editable, so §3.6 suffices.
- **Test auto-extend and auto-revert timers, proposal rate limits, stall-archive cron jobs.**
