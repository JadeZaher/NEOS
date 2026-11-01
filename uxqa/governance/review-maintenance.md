---
type: Governance Review
title: Governance maintenance and governance health
timestamp: "2026-11-01"
scope: maintenance-and-health
evidence: [code read 2026-11-01, neos_uxqa study DB (SELECT only), neos-core layer-01 agreement-review, layer-02 role-sunset and domain-review, layer-07 README and skills]
---

# Maintenance and health: keeping governance current, and knowing whether it is healthy

Path prefixes: `BE/` = `neos-operating-system/agent/src/neos_agent/`, `FE/` = `charting-the-course/client/src/`, `NC/` = `neos-operating-system/neos-core/`, `T/` = `neos-operating-system/agent/tests/`. Study DB = `neos_uxqa` on 127.0.0.1:5433, read 2026-11-01.

**Headline.**
- The agreement review cycle can be started but not finished well. In the UI, "keep it in force" always fails, because the page never sends the evidence the server requires (D1). Nothing writes a review record or moves the review date (D3). No one is told a review is due (D4). Any active member can undo a review, or rewrite an agreement in force, through Rollback (D2).
- Health indicators are typed in, not computed. One self-appointed member rates them, and that member may be a steward of the ecosystem being audited (D5). Nothing acts on a bad rating (D11). Members cannot find the result in the nav (D9).
- Most of what is needed already exists and only needs wiring: the lifecycle table, `ReviewRecord`, `next_audit_due`, the indicator schema fields, the next-steps queue and banner, and the review intervals in the chat tool (§5 "Already built").

Study DB facts used below:
- 4 agreements are `under_review` with their review date 2 to 6 days past: AGR-OA-005, AGR-OA-006, AGR-EB-005, AGR-PS-006.
- `review_records` is 0, and so is `amendment_records`.
- 3 agreements registered from proposals on 2026-11-01 have no review date.
- All 4 published audits have `next_audit_due` NULL and no `measured_value`.
- OmniOne had 168 proposals from 11 authors in the last 90 days (7%).

## 0 Terms (checked against the framework; corrections in bold)

**Maintenance** is the framework's review cycles.
- Agreement review (`NC/layer-01-agreement/agreement-review/SKILL.md`):
  - E.3-5: a review ends in **renew** (with a new review date), **revise** (through an amendment) or **sunset** (with a 60-day notice), and always writes a review record.
  - G: a single participant cannot force a sunset.
  - I and J: a missed review never invalidates the agreement. It escalates and puts a **visible flag on the registry entry**.
- Domain review and role sunset (`NC/layer-02-authority/*`): an assignment carries a review date; a sunset needs a disposition plan, notice and consent.
- The brief's list is right. Add the registry flag, and note that sunset is final in code (`BE/services/act_gates.py:170,172`).

**Governance health** is Layer VII (`NC/layer-07-safeguard/README.md:18-48`). It has three separated stages:
1. Observation (independent-monitoring): raw data with no interpretation, published automatically.
2. Analysis (governance-health-audit): auditors who do not hold leadership in the audited scope rate the 8 GHIs, record trends, triggered safeguards and advisory recommendations, publish to all members, and schedule the next audit a quarter out (SKILL.md E.2-10, G, J).
3. Response: triggers and interventions installed through ACT.

**Correction:** the framework wants computed *data* and a human *rating*, not a computed score. So "computed or typed?" should end as: values computed by a read-only service (the monitor's role), statuses rated by a human auditor next to those values. `BE/api/compliance.py` is not a framework concept. It is an app summary that currently invents scores (D10).

## 1 Flow matrix

Status key: OK, PARTIAL (works but misses a framework step), MISSING (no flow), BROKEN (the flow exists and fails or bypasses a rule).

### Agreement review cycle

| Step | Model | API | UI | Assistant | Status | Evidence |
|---|---|---|---|---|---|---|
| Review date set when the agreement is made | `Agreement.review_date` | `POST /agreements`: optional, no default. Register-from-proposal: never set | AgreementForm date field | chat `create_agreement_draft` defaults by type | PARTIAL | `BE/api/agreements.py:506,786-792`; `BE/agent/governance_tools.py:128-134,621-622`; DB: AGR-60D61961, AGR-42A10BF8, AGR-E2B3A5DA |
| Someone is told it is due | - | `/explain/agreement` shows "Review date" with `overdue`; `/me/next-steps` has nothing | banner, only on the agreement page | `what_needs_me`: nothing | MISSING | `BE/services/next_steps.py:652-673,840-843,941-947`; `BE/services/cron.py:33-55` only logs |
| Start the review (active -> under_review) | AgreementCeremony | `POST /agreements/:id/status` | status Select | `update_agreement_status`; MCP `transition_agreement` | OK | `BE/services/act_gates.py:169`; `FE/pages/governance/agreements/AgreementDetail.tsx:144` |
| Affected members give input | - | none (ceremony evidence is accepted for advice and test only) | none | none | MISSING | `FE/.../AgreementDetail.tsx:72` |
| Renew (under_review -> active) | - | gate `test` plus evidence of 8+ characters | Select "Active" sends no evidence, so the server returns 400 | chat and MCP work | BROKEN (UI) | `BE/api/agreements.py:369`; `BE/services/act_gates.py:977-978`; `FE/.../AgreementDetail.tsx:55-58,145-148,284` |
| Next review date after renewal | `review_date` | never moved | banner keeps showing "(passed)" | - | BROKEN | `BE/services/act_gates.py:986-1004`; `BE/services/next_steps.py:946` |
| Revise (amend through a proposal) | `Proposal.amends_agreement_id`, AmendmentRecord | `/proposals?amends=`, register | "Propose a change" | `create_proposal` | OK | `BE/api/agreements.py:252,738-779`; `FE/.../AgreementDetail.tsx:124-131` |
| Sunset | `sunset_date` | under_review -> sunset: no reason, `sunset_date` untouched | Select, no confirmation | MCP asks for confirmation | PARTIAL | `FE/.../AgreementDetail.tsx:133-153`; `BE/services/act_gates.py:170,977`; `BE/mcp_server.py:545` |
| Archive after the sunset period | - | sunset -> archived | Select | MCP asks for confirmation | PARTIAL (nobody is told) | `BE/services/act_gates.py:172`; DB: AGR-OMNI-007 has been in sunset since 2026-10-21 |
| Review record written | ReviewRecord | read only (`/history`) | AgreementHistory renders reviews | - | MISSING (no writer) | `BE/api/agreements.py:928-970`; `FE/.../AgreementHistory.tsx:28,156`; DB: `review_records` = 0 |
| Missed-review flag in the registry | - | none | AgreementList has no flag | - | MISSING | `BE/api/agreements.py:140-157` |
| Rollback | AgreementVersion | any active member, on an agreement in force, can restore status, text and dates | History "Rollback to this version" | - | BROKEN (authority) | `BE/api/agreements.py:1018,1030-1062`; `FE/.../AgreementHistory.tsx:128` |

### Other upkeep

| Cycle | Model | API | UI | Assistant | Status | Evidence |
|---|---|---|---|---|---|---|
| Domain steward transfer | `Domain.steward_id` | `PUT /domains` by the domain steward or a mod+ | DomainForm | none | BROKEN: a domain steward can hand off their own domain, and no record is kept | `BE/api/domains.py:354-366`; `BE/api/schemas/domains.py:73-82`; `BE/api/policy.py:76-80` |
| Domain or role review schedule and sunset | `Domain.status` (free text) | `PUT /domains` | DomainForm | none | MISSING (no review-date column) | `BE/db/models/domain.py:38-53` |
| Collaboration review | `Collaboration.review_date` | read only | detail page | none | MISSING | `BE/api/discover.py:1072` |
| Decision-record (precedent) review | `DecisionRecord.review_date` | read only | detail page | - | MISSING (defer, review-extended L9) | `BE/api/decisions.py:96` |
| Advice past its deadline, proposer silent | `Proposal.advice_deadline` | `close_advice` items for the author, then stewards | queue, banner | `what_needs_me` | OK. With no deadline and an absent proposer, only withdrawal remains (owner decision) | `BE/services/next_steps.py:589-612`; `BE/api/policy.py:313-320` |
| Consent deadline passed; test with no report | `consent_deadline`, TestReport | the due date on `record_position` | - | - | PARTIAL: nothing changes once the date passes | `BE/services/next_steps.py:619-644` |
| Recovery overdue at 30 days | EmergencyState | `describe().review_overdue`; `record_review` item | banner, queue | `explain_status` | OK (owner default: no auto-close) | `BE/api/emergency.py:118-120`; `BE/services/next_steps.py:691-702`; `BE/services/cron.py:110-113` |
| Exit handoff target date | `target_completion_date` | steward item with a due date | queue | - | PARTIAL: passing the date changes nothing | `BE/services/next_steps.py:743-758` |
| Repair check-ins | RepairAgreementRecord | `repair_checkin` item | queue | - | OK | `BE/services/next_steps.py:728-739` |
| Pending members nobody greets | `Member.current_status` | none | none | none | MISSING | `BE/services/next_steps.py:809-870` has no member items; DB: 1 `pending_consent` |
| Old open shares and needs; inactive journey maps | `SharesNeeds.status`, `JourneyMap.is_active` | none | none | none | MISSING (rejected in §8) | - |

### Governance health audit cycle

| Step | Model | API | UI | Assistant | Status | Evidence |
|---|---|---|---|---|---|---|
| Audit due (quarterly; within 30 days of an emergency ending; mass exit) | `next_audit_due` | set to +90 days at publish, never read | "Next Audit Due" text | none | MISSING | `BE/api/safeguards.py:36,371`; SKILL.md C, J; DB: 4 of 4 audits NULL |
| Start (the caller is the auditor) | GovernanceHealthAudit | `POST /safeguards/audits` | "Record an audit" | `create_safeguard_audit` (a draft) | OK | `BE/api/safeguards.py:305-338`; `FE/pages/governance/safeguards/SafeguardsDashboard.tsx:149`; `BE/agent/governance_tools.py:2007-2068` |
| Indicator data | `indicator_scores[].measured_value` | nothing computes it | the form asks for a status only | none | MISSING | `FE/components/governance/safeguards/GovernanceHealthAuditForm.tsx:81-86`; `BE/api/schemas/safeguards.py:10-17` |
| Rate, write findings and recommendations | same | `PUT /audits/:id` | form | - | OK | `BE/api/safeguards.py:341-355` |
| Publish, which sets the score | `overall_health_score` | `POST /:id/publish` (mean of the ratings) | "Publish audit" with confirmation | the assistant cannot publish (by design) | OK | `BE/api/safeguards.py:114-117,358-374`; `GovernanceHealthAuditForm.tsx:193-221` |
| The auditor is asked to finish a draft | - | `finish_audit` item | queue | `what_needs_me` | OK | `BE/services/next_steps.py:761-767` |
| Members see the result | - | detail: active members; summary: the selected ecosystems | Safeguards is steward-only in the nav; no dashboard line | no read tool | PARTIAL | `BE/api/safeguards.py:163-174,257-283`; `FE/components/AppSidebar.tsx:100` |
| Something acts on a bad indicator | `triggered_safeguards` | no writer (not in the create or update schema) | display only | none | MISSING | `BE/api/schemas/safeguards.py:61-78`; `SafeguardsDashboard.tsx:212-236` |
| Status banner for an audit | - | `/explain` has no `audit` kind | none | `explain_status` has no audit | MISSING | `BE/services/next_steps.py:79` |
| Compliance summary | ComplianceSummary | generate (AI, or an invented fallback); latest and history fail open | ComplianceDashboard | none | BROKEN | `BE/api/compliance.py:74-104,174-198,232-233,266-267` |

### Flow tests today

Covered through the real blueprints:
- Audit draft -> publish -> score (`T/test_governance_care.py:362`).
- The audit auditor-only actor table (`:387`).
- An assistant audit is a human-owned draft (`T/test_g_agent_assistant.py:632`).
- `finish_audit` in the queue (`T/test_g_next.py:165-191`).
- Agreement ceremonies draft -> consent (`T/test_act_lifecycle.py:366`).
- The review moves exist in the lifecycle table (`:54`, table only).
- MCP asks for confirmation on under_review moves (`T/test_g_next_mcp.py:94-102`).
- Recovery as a steward's item (`T/test_g_next.py:446`).
- Repair check-ins due (`:286`).
- Date-only overdue on the advice deadline (`:229-241`).

Consequential flows with no test:
- Agreement review start, renew, sunset and archive through REST.
- Rollback, at all.
- Review due in the queue, on the banner or in the registry.
- The review date on registered agreements.
- A plain member reading a published audit.
- Health summary with two ecosystems selected.
- Compliance generate, latest and history scoping (no compliance test exists).
- The overdue boundary between bell and banner.

## 2 Authority table

Actors:

| Code | Who |
|---|---|
| M | active member (user tier) |
| DS | domain steward (`Domain.steward_id`, user tier) |
| S | ecosystem steward (mod) |
| A | admin or owner |
| Au | the member recording an audit |
| X | member of another ecosystem only |
| P | `pending_consent` newcomer |

"404" means the record is out of scope.

| Action | M | DS | S | A | Au | X | P | Rule | Framework |
|---|---|---|---|---|---|---|---|---|---|
| Start an agreement review | no | no | no | yes | - | 404 | no | `BE/api/policy.py:83-89`, `BE/api/agreements.py:359-360` | review body = current affected parties; any of them may request one (agreement-review C, E.1) |
| Renew, sunset, archive | no | no | no | yes | - | 404 | no | same | review body decides; no single member forces a sunset (G) |
| Change an in-force agreement's status, text or dates via Rollback | **yes** | yes | yes | yes | - | 404 | no | `BE/api/agreements.py:1018,1032` | no: changes go through amendment and ACT |
| Edit `review_date` | draft or advice only, any active member | same | same | same | - | 404 | no | `BE/api/agreements.py:547-551` | set at creation or at each review |
| Propose a change (the revise outcome) | yes | yes | yes | yes | - | 404 | refused at create | `BE/api/agreements.py:252`; `BE/services/AGENTS.md:164` | yes |
| Register the amendment | no | no | yes | yes | - | 404 | no | `BE/api/policy.py:273-275` | - |
| Start an audit and be its auditor | yes | yes | **yes** | **yes** | - | 403 | 403 | `BE/api/safeguards.py:319-321` | not leadership; at least 2 auditors; requester is not the auditor (E.1-2, G) |
| Edit or publish an audit | no | no | no | no | yes | 404 | 404 | `BE/api/policy.py:202-207`, `BE/api/safeguards.py:286-294` | audit team |
| Read a published audit | yes, by URL | yes | yes | yes | yes | 404 | 404 | `BE/api/safeguards.py:269-283` | every member in scope (E.9, F) |
| See Safeguards in the nav | **no** | no | yes | yes | no | - | - | `FE/components/AppSidebar.tsx:100` | every member |
| Generate compliance | yes (selection) | yes | yes | yes | - | - | 400 | `BE/api/compliance.py:70-76` | n/a |
| Read the latest compliance summary and history | yes | yes | yes | yes | - | yes, when they have no active row | **yes (fail-open)** | `BE/api/compliance.py:225-233,254-267` | n/a |
| Record the post-emergency review | yes, if not an emergency actor; the queue item goes to stewards only | same | yes | yes | - | 404 | no | `BE/api/policy.py:244-249`; `BE/services/next_steps.py:692` | - |
| Close Recovery | no | no | yes | yes | - | 404 | no | `BE/api/policy.py:252-254` | - |
| Close advice for an absent proposer | no | no | after the deadline | after the deadline | - | - | no | `BE/api/policy.py:313-320` | - |
| Change a domain's steward or status | no | **yes, their own** | yes | yes | - | 404 | no | `BE/api/policy.py:76-80`; `BE/api/domains.py:354` | the delegating body, with consent (role-sunset E.4) |

Note:
- Review moves use the "ceremony steward" (admin or owner). Registering an amendment uses mod+. The two names are kept apart on purpose (`BE/services/AGENTS.md:38-40`).
- Any review-due item must therefore go to `can_conduct_agreement_ceremony`, never to "steward", or mods will see items they cannot act on.

## 3 Defects ranked

**D1 BLOCKER: a review started in the UI can only end in sunset.**
- **Root cause:** under_review -> active is an evidenced ceremony. `active` is in `EVIDENCED_CEREMONIES` (`BE/services/act_gates.py:977-978`), checked at `BE/api/agreements.py:369`. But the page renders the evidence field only when `nextCeremony` is set, which covers draft through test only (`FE/.../AgreementDetail.tsx:69,284`). The Select then sends `evidence: undefined` (`:55-58,145-148`).
- **What you see:** an admin picks "Active" on an agreement under review and gets 400 "Documented evidence is required for the active ceremony", with no field to type it into. The only other option offered, Sunset, is final (`act_gates.py:170,172`). Four study agreements are in this state.

**D2 HIGH: Rollback lets any active member change an agreement in force.**
- **Root cause:** rollback checks only `is_active_member_in` (`BE/api/agreements.py:1018`). It may restore any status that is a manual move from the current one (`:1030-1035`), plus text, `review_date` and `sunset_date` (`:1045-1059`), and then bumps the version (`:1062`). Snapshots carry the pre-move status (`:304-310,379-383`).
- **What you see:**
  - A member rolls back an agreement under review to its pre-review snapshot. It is active again, with the old (past) review date, no ceremony and no evidence.
  - On an active agreement, old text comes back into force without a proposal. The version bump makes every member's consent stale, so everyone gets a re-consent item (`BE/services/next_steps.py:670-672`).
- No test covers rollback.

**D3 HIGH: a finished review leaves no record and no next date.**
- **Root cause:** nothing writes `ReviewRecord`. It is only read, at `BE/api/agreements.py:928-970`, and the generic `BE/db/crud/reviewrecord_crud.py` is unused. `_enter_agreement_stage` sets the status and a ceremony row only (`BE/services/act_gates.py:986-1004`).
- **What you see:** after "keep in force", History shows no review. The review date stays in the past, so the banner keeps "Review date ... (passed)" for good (`BE/services/next_steps.py:941-947`). GHI-07 cannot be measured.

**D4 HIGH: nobody is told a review is due.**
- **Root cause:** the queue loads agreements only for consent items (`BE/services/next_steps.py:652-673,840-843`). Cron only logs (`BE/services/cron.py:33-55`).
- **What you see:** 4 study agreements are 2 to 6 days overdue. No admin has a bell item, and the banner is visible only to someone who opens the page.

**D5 HIGH: health is typed in by one person, who may be leadership.**
- **Root cause:**
  - The form records a status per indicator and nothing else (`GovernanceHealthAuditForm.tsx:81-86`).
  - Nothing computes `measured_value`, even though `IndicatorScoreSchema` has it (`BE/api/schemas/safeguards.py:10-17`).
  - The score is the mean of the ratings (`BE/api/safeguards.py:114-117`) by a self-appointed auditor (`:319-331`). Any active member qualifies, stewards included (`BE/api/policy.py:202-207`).
  - The framework requires auditors who do not hold leadership, at least 2 of them, and data from the monitor (SKILL.md E.2-3, G).
- **What you see:** a steward can rate all 8 indicators healthy and publish 100/100 for their own ecosystem. Meanwhile OmniOne's authorship diversity is 7% (168 proposals, 11 authors, last 90 days), which is critical by GHI-01 (`NC/.../indicator-definitions.yaml:7-14`).

**D6 MEDIUM: sunset is one Select click, with no reason, no confirmation and no end date.**
- **Root cause:** `onValueChange` fires the move (`FE/.../AgreementDetail.tsx:133-153`). `sunset` is not an evidenced ceremony (`act_gates.py:977`). `sunset_date` is never set or read, only displayed and snapshotted. The framework gives a 60-day notice (agreement-review E.3).
- **What you see:** a mis-click ends the agreement for good, and nobody is asked to archive it later.

**D7 MEDIUM: agreements registered from ratified proposals never come due.**
- **Root cause:** no `review_date` is set at `BE/api/agreements.py:786-792`. REST create has no default (`:506`), while the chat tool defaults by type (`BE/agent/governance_tools.py:128-134,621-622`).
- **What you see:** the 3 agreements registered on 2026-11-01 have no review date.

**D8 MEDIUM: "overdue" disagrees between surfaces, and stored timestamps are not UTC on a non-UTC database.**
- **Root cause, overdue:**
  - The bell and the dashboard compute overdue in browser-local days (`FE/lib/next-steps.ts:45-47`; `FE/components/NotificationCenter.tsx:60`; `FE/pages/Dashboard.tsx:253`). This is documented as intended in `FE/pages/governance/AGENTS.md:239-243`.
  - The banner shows the server's `overdue` (`FE/components/governance/StatusBanner.tsx:37-39`). The server takes it from `Clock.today = date.today()`, which is server-local time and ignores `now` (`BE/services/next_steps.py:131-134`).
  - Authority uses `date.today()` too (`:218`). There are 36 `date.today()` calls in 13 backend files.
- **Root cause, timestamps:** `TimestampMixin` uses `server_default=now()` on a naive column (`BE/db/models/_base.py:102-107`). PostgreSQL writes that in the session TimeZone. The study DB runs in America/Denver, so `created_at` is 6 hours behind `attested_at` (Python UTC) in the same `agreement_member_consents` row.
- **What you see:**
  - For a 1 Nov due date and a member in UTC-8 at 17:00 local on 1 Nov, a UTC server's banner says "(passed)" while the bell says "Due today".
  - Adding `Z` to the JSON (craft wave 2) before pinning the database session to UTC would shift every `created_at` by the server's offset.

**D9 MEDIUM: members cannot find the published result.**
- **Root cause:** Safeguards and Compliance are steward-only in the nav (`FE/components/AppSidebar.tsx:100-101`). Yet any member may record an audit (`BE/api/safeguards.py:319-321`), and the page says so (`SafeguardsDashboard.tsx:166`). Publishing adds no dashboard line and no item.
- **Framework:** the report goes to every member and cannot be restricted to leadership (SKILL.md E.9, F).

**D10 MEDIUM: compliance invents scores and leaks across ecosystems.**
- **Root cause:**
  - The fallback invents scores (`BE/api/compliance.py:184-189`): `domain_health` is 100 if any domain exists, `process_adherence` is 100 if any proposal exists.
  - Generate mixes every selected ecosystem into `eco_ids[0]` (`:74-104,197-198`).
  - `/latest` and `/history` fail open on an empty scope (`if eco_ids:`, `:232-233,266-267`).
  - The legacy dashboard fails open the same way (`BE/views/safeguards.py:29-33`) and shows a draft as the latest audit (`:47-53`).
- **What you see:** a signed-in user whose only row is `pending_consent` has an empty scope. They read another ecosystem's latest summary, including its open case ids.

**D11 MEDIUM: nothing acts on a bad indicator or a missed audit.**
- **Root cause:**
  - `triggered_safeguards` has no writer; it is not in the create or update request (`BE/api/schemas/safeguards.py:61-78`).
  - `next_audit_due` is set (`BE/api/safeguards.py:371`) but nothing reads it to say an audit is due. All 4 published study audits have it NULL.
  - The post-emergency audit (SKILL.md C) is not derived anywhere.
- **What you see:** publishing a "critical" changes nothing for anyone, and nobody is reminded a quarter later.

**D12 LOW: the health summary mixes ecosystems and never goes stale.**
- **Root cause:** the newest published audit across all selected ecosystems is shown, unlabeled (`BE/api/safeguards.py:163-174`). The score card shows no age or due date (`SafeguardsDashboard.tsx:156-192`).
- **What you see:** a member of two ecosystems sees one score, from whichever was audited last.

**D13 LOW: date-only values go through `new Date(x)`.**
- **Where:** `AuditDetail.tsx:156,160,188,299`; `SafeguardsDashboard.tsx:271`; `AgreementHistory.tsx:32-33,108,157`. This breaks the contract in `FE/pages/governance/AGENTS.md:116-119`.
- **What you see:** "next audit due 30 Jan" shows 29 Jan anywhere west of UTC.

**D14 LOW: an assistant-drafted audit shows a health badge the model chose.**
- **Root cause:** the tool stores the model's `overall_health_score` on the draft (`BE/agent/governance_tools.py:2041-2061`), and the list builds its label from it (`BE/api/safeguards.py:76`).
- **Scope:** publishing replaces it (`:364-368`), so only drafts mislead.

**D15 LOW: a domain steward rewrites their own `steward_id` or status, with no record.**
- **Where:** `BE/api/domains.py:354-366`; `BE/api/policy.py:76-80`. Carried over from review-core item 8, still open.

**D16 LOW: the assistant cannot read health.**
- **Root cause:** there is no audit or health read tool, and `EXPLAIN_KINDS` excludes audit (`BE/services/next_steps.py:79`).

### Dates: one rule (checklist item 3)

**Today:** five places decide "overdue":
1. `Clock.past`, using server-local `today` (`BE/services/next_steps.py:131-142`).
2. `policy.advice_deadline_passed`, using the caller's `date.today()` (`BE/api/policy.py:308-310`; `BE/services/next_steps.py:218`).
3. Emergency `describe`, using naive-UTC instants (`BE/api/emergency.py:118-120`).
4. `conflicts.next_checkin(repair, today)`.
5. The client's `dueStatus`, using browser-local days, in the bell and the dashboard.

The banner renders (1) and the bell renders (5). That is the wave-B LOW in `uxqa/governance/plan.md:91`.

**Rule (one): the server decides, and the client only words it.**
- **Date-only due dates** (review, sunset, advice and consent deadlines, next audit, handoff, check-ins) belong to their calendar day everywhere.
  - A date passes only when that day has ended everywhere on Earth, at UTC-12 ("anywhere on Earth", AoE). In code: `passed(due) := due < (utc_now - 12h).date()`.
  - `Clock.at(now)` derives `today` that way, from the same `now`. Every predicate that asks "has the date passed?" takes `clock.today`: the queue, the banner, the registry flag, `can_close_advice`, and the check-ins.
- **Timestamps** are instants:
  - stored as naive UTC, with the asyncpg session pinned to `timezone=UTC` so `server_default=now()` is UTC too;
  - emitted with `Z`;
  - passed at that instant.
- **The client** renders the server's `overdue` boolean and formats dates with `parseDue` and `formatDate`. It never computes overdue itself. "Due today/tomorrow" uses the local calendar, but never says "overdue" unless the server does.
- **Why AoE:** a steward's power to close advice for a proposer, or any "overdue" wording, never fires while it is still the due date for someone. One constant reverts it to UTC midnight (owner question 2).

## 4 Health indicators

Framework indicators come from `NC/layer-07-safeguard/governance-health-audit/assets/indicator-definitions.yaml`. "Computable now" means from existing tables, read-only. `:e` is the ecosystem, and `[:from, :to)` is the audit period (default: the previous 90 days).

| Indicator | Data source | Computable now? | Query sketch |
|---|---|---|---|
| GHI-01 Proposal authorship diversity | `proposals.proposer_member_id`, legacy `proposer` text, `created_at` | YES | `count(distinct coalesce(proposer_member_id::text, lower(proposer))) * 100 / count(*) from proposals where ecosystem_id=:e and created_at in period`. Study DB: Oasis 22%, OmniOne 7% |
| GHI-02 Approval rate by author role | `proposals.status` (ratified vs ratified+withdrawn), `members.role` of the author (mod+ counts as leadership) | PARTIAL: uses today's role, not the role when the proposal was written; unlinked legacy authors are excluded; "n/a" if either group has fewer than 3 decided proposals | `group by m.role in ('mod','admin','owner')`; ratio = rate(non-leadership) / rate(leadership) |
| GHI-03 Resource concentration | no resource or allocation records (economic layer MISSING, review-extended §1) | NO: not computable yet | the auditor may rate it by hand or leave it unrated |
| GHI-04 Participation trend | member-linked `advice_entries.created_at`, `consent_participants.updated_at`, `test_reports.created_at`, `agreement_member_consents.attested_at` | YES (legacy rows with NULL member are skipped) | `p(period) = count(distinct member_id) / active members`; `(p(period) - p(prior)) / p(prior) * 100`, where the prior period has the same length |
| GHI-05 Leadership tenure | `members.role` mod+; `member_status_transitions` (`trigger='role_grant'`, `to_status='role:<tier>'`, `date`); `members.created_at` | PARTIAL: ecosystem roles only (domain stewardship has no history); grants are recorded only since 2026-10-31, so older holders fall back to `created_at`, which overstates tenure | for each current mod+: since = latest matching grant, else `created_at`; cycles = floor(days / 90); report the maximum and who |
| GHI-06 Objection integration rate | `consent_participants` (`position='object'`, `reason`); revision rounds (`act_gates.revision_round` read from `advice_logs.summary`, sent back from consent) | PARTIAL: changing an objection to consent, or withdrawing it, overwrites the row (`BE/services/act_gates.py:740,754`), so only objections still open, or followed by a send-back, are visible | integrated = objections whose proposal has a later revision round from consent; total = integrated + open objections + `withdrawn` rows with a reason (proxy). Study DB: 6 objections, 0 integrated |
| GHI-07 Review compliance | `agreements.review_date`; `agreement_ceremonies` with `stage='under_review'` (`completed_at`) now; `review_records.date` after C1 | YES (a proxy until C1) | due = agreements with `review_date` in the period; timely = an under_review ceremony (later a ReviewRecord) dated on or before `review_date`. Study DB: 0 of 6 |
| GHI-08 Cross-unit engagement | `collaborations` (source and target domain -> `domains.ecosystem_id`, `created_at`, `started_date`); proposals and agreements with `shared_ecosystem_ids` | YES | count per quarter of collaborations touching `:e` plus shared proposals and agreements created in the period |

Signals the owner listed, reported by the same snapshot under "Needs attention". They are not GHIs: each is a count plus links, and none has a status.

| Signal | Data | Query sketch |
|---|---|---|
| Reviews overdue | `agreements` in force | `review_date` passed (the rule in §3) |
| Stalled proposals | `proposals`, `advice_entries`, `test_reports` | advice past its deadline; advice with no deadline and no advice for 30 days; consent past its deadline; test with no report since the revision for 30 days |
| Role and authority concentration | `domains.steward_id`, `members.role` | share of domains held by the top steward; mod+ / active members |
| Open conflicts | `conflict_cases` | count; untriaged for more than 7 days; age of the oldest |
| Emergency use | `emergency_states` | declarations in the period; days open; Recovery overdue (`describe().review_overdue`) |
| Exits | `exit_records.completed_date`, `member_status_transitions` to `exited` | in the last 30 days / active members (the framework's 20% mass-exit trigger) |
| Pending members waiting | `members.current_status='pending_consent'` | `created_at` more than 14 days ago |

## 5 Ranked changes (smallest that puts maintenance and health in place)

**Already built: reuse it, don't rebuild it.**
- `AGREEMENT_LIFECYCLE` review, sunset and archive moves (`BE/services/act_gates.py:169-172`).
- `ReviewRecord` model, schema, history read and History rendering (`BE/api/agreements.py:928-970`; `FE/.../AgreementHistory.tsx:28,156`).
- Move labels "Start a review", "Keep it in force", "Start its sunset", "Archive it" (`BE/services/next_steps.py:105-108,932`).
- The agreement banner already shows `review_date` with `overdue` (`:941-947`).
- `Clock`, `_item`, `audit_items` and `OWNER_ACTIONS` in `next_steps`.
- Review intervals by type (`BE/agent/governance_tools.py:128-134`).
- `NEXT_AUDIT_AFTER_DAYS` and `next_audit_due` (`BE/api/safeguards.py:36,371`).
- `IndicatorScoreSchema.measured_value`, `prior_value`, `trend`, `notes`, and the pages that already render them (`SafeguardsDashboard.tsx:77-90`, `AuditDetail.tsx:203-224`).
- `emergency.describe` and `closed_at`.
- `parseDue` and `formatDue` in `lib/next-steps.ts`, and `formatDate` in `lib/utils.ts`.
- MCP confirmation for sunset and archive.

Do not extend the cron `_check_deadlines` and `_check_compliance_regen` jobs, which only log (`BE/services/cron.py:33-55,84-107`). Delete them.

### C1. Finish an agreement review with a record and a next date (M; fixes D1, D3, D6)

**Backend**
- In `api/agreements.transition_agreement`, when a manual move leaves `under_review`:
  - Require findings (evidence of at least 8 characters) for `sunset` too.
  - Write `ReviewRecord`:
    - `review_type`: `scheduled` if the review date has passed, else `requested`;
    - `trigger`, `date`, `agreement_version`;
    - `evaluation={"findings": ...}`;
    - `outcome`: `renewed` or `sunset`;
    - `next_review_date`.
  - On renew, set `review_date` to the body's `next_review_date` (must be later than today, else 400), or to `default_review_date(type, today)`.
  - On sunset, set `sunset_date = max(existing, today + 60)`.
- The status POST accepts `next_review_date`. The detail payload adds `default_next_review_date`.
- Move `_REVIEW_MONTHS` into `api/agreement_vocabulary.py` as `REVIEW_INTERVAL_MONTHS` plus `default_review_date()`. REST create and `register_ratified_proposal` (new agreements) default `review_date` with it, which fixes D7.
- MCP and chat inherit all of this through `transition_agreement`.

**Frontend**
- AgreementDetail draws the in-force moves as buttons from the banner's `your_moves`, replacing the raw Select.
- Each button opens a new `AgreementReviewDialog`:
  - findings, required;
  - next review date, prefilled;
  - for sunset, a confirmation: "Sunset is final: it ends on <date> and cannot be put back in force".
- "Propose a change" stays as the revise path.

**Flow test (`T/test_g_health.py`)**
1. Ari (admin) starts a review; Ada (member) gets 403.
2. Ari renews with no findings: 400. With findings: 200.
3. `/history.reviews[0]` is `renewed`, with the default `next_review_date`. The agreement's `review_date` has moved, and `/explain` shows `overdue` false.
4. Sunset: the ReviewRecord says `sunset`, and `sunset_date` is today + 60.

### C2. Rollback cannot change an agreement in force (S; fixes D2)

- `rollback_agreement` is allowed only where editing is (draft or advice, `BE/api/agreements.py:550`). It never restores `status`, `review_date` or `sunset_date`. On an agreement in force it returns 409: "An agreement in force changes through a proposal (Propose a change)".
- AgreementHistory hides the button outside draft and advice.
- **Flow test, actor table:**
  - Ada rolls back an agreement under review or active: 409; status and version unchanged.
  - On a draft: 200; status unchanged.

### C3. "Review due" in the queue, the banner and the registry (S-M; fixes D4)

**`next_steps` (appended):** `agreement_review_items` for `can_conduct_agreement_ceremony` callers:
- `start_review`: in force, from 14 days before `review_date`; due = `review_date`.
- `finish_review`: `under_review`. Add it to `OWNER_ACTIONS`.
- `archive_agreement`: `sunset` and `sunset_date` has passed.

**Other wiring:**
- `waiting_for` also loads in-force and sunset agreements, but only for callers who are admin or above there.
- `agreement_next_step` says "Its next review is due <date>", or "was due <date>; an admin or owner starts it".
- `_agreement_to_list_item` adds `review_overdue`, and AgreementList shows a "Review overdue" badge to everyone (the framework's visible flag).
- Delete `cron._check_deadlines`.

**Flow test**
1. Ari gets `start_review` 14 days ahead; it becomes overdue after the date.
2. Ada and Mo (mod) get nothing.
3. After the renewal the item is gone.
4. The list flags `review_overdue` for Ada.

### C4. One date rule (S-M; fixes D8, D13)

**Backend**
- New `services/dates.py`: `utc_now()`, `aoe_today(now)`, `date_passed(due, now)`.
- `Clock.at` and `Clock.past` use it.
- Callers that decide "passed" pass `clock.today` (`next_steps.py:218`; `act_gates` and `proposals` callers of `proposal_next_moves(today=...)`).
- Creation stamps use `utc_now().date()`.
- `db/session.create_db_engine` passes asyncpg `connect_args={"server_settings": {"timezone": "UTC"}}`. Check `SHOW timezone` on prod before the craft-wave-2 `Z` fix ships.

**Frontend**
- `dueStatus(due, overdue, now, format)` takes the server's flag; NotificationCenter and Dashboard pass `item.overdue`.
- Safeguards and History pages use `formatDate` and `parseDue`.

**Tests**
- Table test for `date_passed`. For due 2026-11-01:
  - 2026-11-02 11:59 UTC: not passed;
  - 12:00 UTC: passed.
- Flow test: a steward's close-advice on a 1 Nov deadline is refused at 2026-11-02 11:00 UTC and allowed at 12:00, with `utc_now` patched.
- `node:test`: a server `overdue: false` after local midnight never reads "Overdue".

### C5. Health snapshot: computed values, human ratings (M; fixes the data half of D5)

**Backend**
- New `services/health.py`: `health_snapshot(session, ecosystem_id, *, start, end, now) -> dict`. It is read-only and returns:
  - the §4 indicators: `{indicator_id, name, measured_value, unit, computable, basis, band}`, where `band` is the framework threshold, for reference only;
  - "Needs attention" links.
- `GET /api/v1/safeguards/snapshot?ecosystem_id=&from=&to=`: `caller_in` plus `is_active_member_in`, else 404.
- Publish freezes the values into `indicator_scores` for the audit's period (default: the previous 90 days): `measured_value`, `prior_value` (from the previous published audit), `trend` and the `basis` note. The status stays the auditor's.
- Publish needs every computable indicator rated (owner question 7).

**Frontend**
- The form shows each value and band beside the rating.
- A new `hooks/use-health.ts`.

**Optional hand-off to G-Agent:** a chat tool `get_governance_health` that calls the snapshot.

**Flow test**
1. With 4 proposals by 2 authors in the period, `GHI-01 = 50`.
2. Olu (another ecosystem) gets 404.
3. Ben publishes. The detail shows `measured_value` 50 with Ben's status.
4. A proposal added after publishing does not change the published report.

### C6. Audit authority per the framework (S; fixes the authority half of D5)

- Add `policy.can_record_audit(member, ecosystem_id)`: an active member who is not mod+ there (`AUDIT_EXCLUDES_STEWARDS`, owner question 1).
- REST and the chat tool use it.
- **Flow test, actor table for start:**

  | Actor | Result |
  |---|---|
  | Ben (user) | 201 |
  | Mo (mod) | 403 |
  | Ari (admin) | 403 |
  | Olu (other ecosystem) | 403 |
  | pending member | 403 |

### C7. Due audits and critical indicators become next steps (S-M; fixes D11)

**`next_steps` (appended)**
- `audit_due` for stewards (mod+), from 14 days before `audit_due_date(e)` = the earliest of:
  - the latest published audit's `next_audit_due`, or its `audit_date` + 90 days;
  - `closed_at` + 30 days of an emergency closed after that audit;
  - for an ecosystem never audited, its creation + 90 days.
- `respond_to_audit` for stewards when the latest published audit has a `critical` indicator. It clears when a newer audit is published, or when a proposal cites the audit.
- The "cites" link: `/proposals/new?responds_to_audit=<id>` stores the audit id in the existing `Proposal.related_proposals` JSON. This touches the proposals schema and create handler: a hand-off (§7).
- Add `audit` to `EXPLAIN_KINDS`: a banner on AuditDetail with state, critical count, next audit due, and the next step "stewards respond with a proposal; recommendations are advice".

**Flow test**
1. With no audit for 90 days, Mo gets `audit_due` and Ada does not.
2. Ben publishes an audit with GHI-01 critical. Mo gets `respond_to_audit`, which clears after a proposal created with `responds_to_audit`.
3. An emergency closed after the audit moves the due date to `closed_at` + 30.

### C8. Members see the published result (S; fixes D9, D12)

- AppSidebar shows Safeguards to members.
- `GET /safeguards` returns the latest published audit per ecosystem, labeled, with `audit_due`, `overdue` and `published_at`.
- The dashboard gets a "Governance health" line per ecosystem linking to `/safeguards`.
- The score card says "as of <date>" and "next audit overdue".
- **Flow test:**
  1. Ada (member) reads her ecosystem's published audit in the summary.
  2. A member of A and B sees two labeled entries.
  3. A draft is never counted.
  4. Olu sees nothing of A's.

### C9. Compliance stops inventing scores and leaking (S; fixes D10, D14)

- `/latest` and `/history` scope with `restrict_to_ecosystems` (fail closed).
- `/generate` takes `ecosystem_id`, checked against `get_authorized_ecosystem_ids`, and computes from that ecosystem only.
- The structural fallback reports the snapshot's "Needs attention" counts instead of invented 100s.
- `views/safeguards.py._apply_filters` fails closed and shows only published audits.
- The assistant's draft no longer stores `overall_health_score`.
- **Flow test:**
  1. A pending-only user gets 404 from `/compliance/latest`.
  2. A member of A and B generating for A stores only A's counts.

### C10. Changing a domain's steward or status is a steward's act, with a record (S; fixes D15, the start of role-sunset)

- In `PUT /domains`, changing `steward_id` or `status` needs `is_steward` (mod+) and a `reason`.
- Each change writes a DecisionRecord (`source_skill` `role-transfer` or `role-sunset`).
- Once these records exist, GHI-05 can cover domains.
- **Flow test:**
  1. Amara (domain steward, user) handing off her domain gets 403.
  2. Mo can do it, and the decision record lists it.

**Order:** C4 first, or with a single owner of `Clock`. Then C1+C2+C3 (agreements) and C5+C6+C7+C8 (health) can run as two parallel sub-lanes. C9 and C10 are independent.

## 6 Owner questions (only the genuinely ambiguous)

| # | Question | Recommended default | Reversal cost |
|---|---|---|---|
| 1 | May a steward (mod+) of the audited ecosystem record and publish its health audit? | No (framework G). If an ecosystem has no non-steward active member, allow a steward and label the audit "self-assessment". | One constant (`AUDIT_EXCLUDES_STEWARDS`) |
| 2 | When does a date-only due date pass: at the end of the day everywhere (AoE), or at UTC midnight? | AoE: no one is told "overdue", and no steward may close advice for a proposer, while it is still the due date somewhere. | One constant in `services/dates.py` |
| 3 | Who is told a review is coming, and when? | Admins and owners from 14 days before. After 30 days overdue, the registry flag is visible to all (framework I). Members otherwise use "Propose a change". | Two constants |
| 4 | Sunset notice and archive | `sunset_date` = today + 60 days (framework). Archiving becomes an admin's item after that date. | One constant |
| 5 | Which bad indicator asks stewards for a response? | `critical` only. Warnings show on the page without a queue item. | A one-element set |
| 6 | Stalled proposals and waiting pending members: queue items or counts? | Counts with links in the snapshot only. Revisit if a pass shows real stalls. | Add an item function later; no data change |
| 7 | Publishing an audit: one rated indicator (today) or every computable one? | Every computable indicator (7 of 8). GHI-03 may stay "not computable yet". | Drop one check |

## 7 Proposed lane file ownership (builder lane "G-Health")

**Owned, backend**
- `services/health.py` (new), `services/dates.py` (new)
- `api/safeguards.py`, `api/schemas/safeguards.py`, `api/compliance.py`, `views/safeguards.py`
- `api/agreements.py` (review outcome, rollback, review-date defaults; it was G-ACT's file in wave A), `api/schemas/agreements.py`, `api/agreement_vocabulary.py`
- `api/domains.py`, `api/schemas/domains.py`
- `db/session.py` (session timezone)
- `services/cron.py` (deleting `_check_deadlines` and `_check_compliance_regen` only; the emergency sweep stays G-Safety's)
- `T/test_g_health.py` (new)

**Owned, frontend**
- `pages/governance/safeguards/*`, `components/governance/safeguards/*`, `pages/compliance/ComplianceDashboard.tsx`
- `pages/governance/agreements/AgreementDetail.tsx`, `AgreementHistory.tsx`, `AgreementList.tsx`
- `components/governance/agreements/AgreementReviewDialog.tsx` (new)
- `hooks/use-health.ts` (new; agreement-review and audit mutations live here, not in G-ACT's `use-governance.ts`)
- `lib/health.ts` and `lib/health.test.ts` (new)
- `lib/next-steps.ts` and `next-steps.test.ts`, `components/NotificationCenter.tsx`, `pages/Dashboard.tsx` (only the due-date lines), `components/AppSidebar.tsx` (one tier)

**Shared, appended under a `# G-Health` / `// G-Health` header**
- `api/policy.py`: `can_record_audit`, `AUDIT_EXCLUDES_STEWARDS`.
- `services/next_steps.py`: `agreement_review_items`, `audit_due_items`, `_explain_audit`. These in-place edits must be listed in the lane report:
  - `Clock.at` and `Clock.past` (the date rule);
  - the agreement and audit queries in `waiting_for`;
  - `EXPLAIN_KINDS`, `_EXPLAINERS`, `OWNER_ACTIONS`.
- `client/src/lib/api-client.ts`: snapshot, review moves.
- `client/src/types/api.ts`: add `'audit'` to `ExplainKind`, plus the snapshot types.
- `client/src/lib/query-keys.ts`: `keys.health`, with the `affects.agreements` and `affects.audits` prefixes kept green.

**Hand-offs (other owners)**
- G-ACT:
  - `api/proposals.py` and `api/schemas/proposals.py`: `responds_to_audit` into `related_proposals`;
  - callers of `proposal_next_moves(today=...)` pass `clock.today`.
- G-Agent:
  - `agent/governance_tools.py` imports `REVIEW_INTERVAL_MONTHS`;
  - `update_agreement_status` passes `findings` and `next_review_date`;
  - `create_safeguard_audit` drops the score and uses `can_record_audit`;
  - optional `get_governance_health`.
- Craft wave 2: the JSON `Z` fix lands after the `db/session.py` UTC pin.

## 8 Explicitly rejected

- **A scheduler, or new cron jobs, for reviews or audits.** "Due" is derived in `next_steps` on each request. The two cron scans that only log are deleted, not extended.
- **A notification service, email or push.** The bell, the dashboard queue, the banner and the registry flag cover it (`notify_members` stays without callers).
- **A safeguard trigger registry or rules engine** (the starter triggers firing actions by themselves). A critical rating becomes a steward's next step, and the response goes through a proposal.
- **An independent-monitor role with terms and rotation.** The read-only snapshot is the raw-data report; no new role is created.
- **A computed health score, or AI capture scoring.** Statuses stay human (owner decision on AI independence); values are computed.
- **Two-auditor teams, 3-co-signer audit requests, a mass-exit auto-audit.** Defer: the snapshot reports exits, and C6 gives the auditor rule.
- **A review-body or member-input model for agreement reviews.** Findings text on the outcome plus "Propose a change" is enough.
- **Domain-review scheduling** (it needs a `Domain.review_date` column and assignment records). Defer until C10's records exist.
- **Collaboration review and decision-record review.** Defer to L5 and L9 (review-extended).
- **Expiry for shares and needs, and journey-map staleness.** Not governance upkeep; no one owns the act.
- **A per-ecosystem timezone column.** The AoE rule makes it unnecessary.
- **Re-using `db/crud/reviewrecord_crud.py`.** It is generic CRUD that bypasses the rules; write `ReviewRecord` only inside `transition_agreement`.
