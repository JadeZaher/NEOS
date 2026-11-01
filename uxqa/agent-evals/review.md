---
type: Agent Review
title: "NEOS in-app governance assistant: capability, explainability and prompt review"
timestamp: "2026-10-31"
scope: "React chat POST /api/v1/chat/send (api/chat.py), legacy /chat/message (views/chat.py), agent/governance_tools.py, agent/system_prompt.py, mcp_server.py, client FloatingComms + use-chat"
read_at: "neos-operating-system c0fdcec + uncommitted wave-0 files (governance_tools.py unmodified)"
---

# Agent review

Paths are relative to `neos-operating-system/agent/src/neos_agent/` unless they start with `charting-the-course/`, `uxqa/` or `NEOS.md`.

## Summary

1. **The assistant can record governance acts that the gate engine misreads.** `record_consent_position` takes any name, stores `"objection"`, which the engine does not treat as blocking (`{"object"}`), and never runs the gate cascade, which REST and MCP both run.
2. **For most real records, the model cannot see the data.** Any tool result over 2000 characters is replaced with `"Result truncated ... Key fields: success, data"`. That includes every proposal with real advice, every agreement text and any search returning about 8 or more rows.
3. **The assistant cannot answer "what's this?" or "what's waiting for me?".** The page passes a UUID while tools want `PROP-...` keys, search results carry no id or link, domains show codes instead of names, and no read tool works from the caller's point of view.
4. **The prompt contradicts the framework and the engine.** It invents quorum rules, routes authority through a domain-only check and names the wrong capture taxonomy. It has no ACT stage guide, no act-as-the-signed-in-member rule and no confirmation rule, and its tone works against plain language.
5. **Matching REST is not enough for BE-ACT.** REST itself accepts consent under any name and lets any member declare an emergency (§5).

## 1 What a member can do through the assistant vs the UI

| Area | UI / REST | Assistant tools | Gap |
|---|---|---|---|
| Proposals (ACT) | Create, edit, open for advice, advise (and open a new round), record consent, file test reports, see gates, withdraw | `create_proposal` (draft), `update_proposal_status` (author or mod+, gated), `record_advice`, `record_consent_position` | No edit, no test report, no new advice round, no gate view. Consent is unsafe (fix 1). |
| Agreements | Read, attest your own consent (version-bound), stewards (admin+) run ceremonies | `search_agreements`, `get_agreement` (legacy `ratification_records`), `create_agreement_draft` (any `proposer`), `update_agreement_status` | No consent attestation. The status tool skips ceremonies, test evidence and role checks, and allows `consent -> active` (`agent/governance_tools.py:75`, `:454-496`). |
| Domains | Browse by name, join (agreement-gated), mod+ create, steward edits | `list_domains`, `get_domain` (by code), `create_domain_draft` (mod+) | No join. No names (§2). |
| Roles | Directory, profiles, admins change roles | `get_active_members`, `get_member_roles`, `check_authority` | `check_authority` only knows domain stewardship (`:556-559`), not ecosystem role or proposal authorship. |
| Ecosystems | Browse, join through the consent gate, create (creator becomes steward, `api/ecosystems.py:214`) | `list_ecosystems` and `get_ecosystem` (unscoped, private ones included), `create_ecosystem` | No join. Create adds no membership, so the new ecosystem has no steward. |
| Conflicts | Report, view, repair | `create_conflict_case` (`reporter_id` is a UUID, `:1297-1305`), `triage_conflict`, `create_repair_agreement` | Nothing to find "my cases". Anyone can triage or repair. |
| Emergency | View, declare, resolve, recover | `get_emergency_state` (first selected ecosystem only, `:1372`), `declare_emergency` (`declared_by` free text, `:1413`) | No resolve or recovery. No authority check. |
| Exit | Start your own, track status | `create_exit_record(member_name)` (`:1444-1452`) | Can start anyone's exit. No status. |
| Decisions | Browse records the engine mints | `create_decision_record`, `search_precedents` | Hand-made records bypass the engine. Any member can create them. |
| My work | Dashboard queue, my-decisions ledger, bell (stub) | none | No "what's waiting for me". |
| Shares/needs, orientation, messaging | Yes | none | Out of scope. Orientation chat is a deliberate stub (`charting-the-course/client/src/AGENTS.md:93`). |

**Who the assistant acts as.** `CALLER_SCOPED_TOOLS` (`agent/governance_tools.py:2779-2784`) covers only `create_proposal`, `record_advice`, `update_proposal_status` and `create_domain_draft`. `api/AGENTS.md:120-122` already warns about the rest. The identity comes from model arguments in `record_consent_position.participant` (`:842`), `create_agreement_draft.proposer` (`:357`), `declare_emergency.declared_by`, `create_exit_record.member_name`, `create_decision_record.recorder/participants` and `create_safeguard_audit.auditor`. No role check at all in `update_agreement_status`, `triage_conflict`, `create_repair_agreement`, `create_ecosystem`, `create_decision_record` or `declare_emergency`. This is ledger `p1-coord-chat-tool-authz`, owned by BE-ACT in `uxqa/craft/wave1.md:44`.

The MCP server is ahead of chat: it acts as the token owner and has `get_proposal_gates` (`mcp_server.py:308`), `submit_proposal_consent` (:701), `submit_test_report` (:751), `attest_agreement_consent` (:458) and a UUID-or-key resolver (`_resolve`, :168). Most fixes below are ports of these.

## 2 Tool results the model cannot explain

- **Whole-result truncation** (`api/chat.py:633-643`). Anything over 2000 characters becomes `{"success", "summary": "Result truncated (N chars). Key fields: success, data", "_link"}`. The key list is always just `success, data`, so the model learns nothing. The browser still gets the full `data` in `tool_result` (`:618-624`), so the screen and the model disagree.
- **UUIDs where tools need business keys.** On `/proposals/<uuid>` the prompt says `Viewing item: <uuid>` (`api/chat.py:189-194`), but `get_proposal` matches only `Proposal.proposal_id` (`agent/governance_tools.py:1970`), so the answer is "not found". The same holds for every proposal and agreement tool. Search rows carry no `id` (`:1933-1946`). Only create tools get a `_link` (`api/chat.py:89-98`), so the model cannot link to anything that already exists. The app's routes are `/proposals/:uuid`.
- **Codes instead of names.** `get_domain` and `list_domains` never return a name and match only `domain_id` (`:1204`, `:1216`, `:2145-2156`), with ecosystem and parent as UUIDs. `domain_display_name` (`api/domains.py:72`) is unused here; pass-01 PB-DOMAIN-NO-NAME was fixed in the UI only.
- **No state or next step.**
  - `get_proposal` has no gates (rounds done of required, positions of quorum, open objections, test cases) and no caller relation (am I the author, have I advised, what is my position).
  - `record_advice` returns `auto_transitions` without the reason. This is pass-01 F01 again, now in chat.
  - `check_quorum` uses 2/3 of all active members (100% in consensus mode, 50% when urgency is critical; `:990-998`). The engine uses `act_policy.consent_quorum`, default 1 (`services/act_gates.py:59-64`, `:149`). So the model reports "quorum not met" on a proposal that is about to advance.
  - `get_agreement` shows legacy ratification rows, not `AgreementMemberConsent`, so it cannot say who still has to consent.
- **Framework words are missing.** `get_emergency_state` returns `closed/open/half_open` and "Circuit breaker is CLOSED". `NEOS.md:41` names the states Normal, Crisis and Recovery.

## 3 System-prompt issues (`agent/system_prompt.py`)

- **Wrong or invented framework claims.**
  - The capture taxonomy is "capital, charismatic, emergency, *informal*" (`:126-130`). `NEOS.md:38` and `:95` say capital, charisma, emergency and *ossification/inertia*.
  - ACT appears only as "Advice -> Consent -> Test" (`:50-53`, `:83`). The app and the tools use draft -> advice -> consent -> test -> ratified.
  - Protocol rule 3, "check_quorum before record_consent_position" (`:111`), is neither a NEOS rule nor an app rule.
  - Rule 2 sends every binding action through `check_authority` (`:109`). That tool only knows domain stewardship, so it denies authors and ecosystem stewards who are in fact allowed.
- **No ACT stage guidance reaches the React chat.** The skill's Section E/G steps load only when `active_skill` is set (`:503-510`), which comes from the request body (`api/chat.py:419`). The client only echoes what the server sent (`charting-the-course/client/src/hooks/use-chat.ts:104`, `:226-240`), and `SkillRouter` has no initial routing (`agent/router.py:182`). So no skill ever starts and the model works from one line about ACT. Consent is never defined, although `NEOS.md:23` defines it (no reasoned objection, not enthusiasm). Stand aside, object-with-a-reason and consensus mode are not explained either.
- **No identity or refusal guidance.** Nothing says "you act only as the signed-in member". "Never make governance decisions on behalf of participants" (`:91`) does not cover "record what Ben told me". Nothing says what to tell the member when a tool refuses, or when they ask to act in an ecosystem they are not in (`:98` covers data privacy only).
- **No confirmation before irreversible acts** (declare an emergency, start an exit, withdraw, change an agreement's status).
- **The tone fights plain language.** "Formal ... senior committee secretary at an international institution ... anticipate follow-up needs" (`:183-188`) plus "structured intake ... in your first response" (`:99-100`) produce long, term-heavy replies for exactly the low-literacy users the study tracks.
- The `_link` rule (`:101`) is unreachable for any read.

## 4 Ranked usability fixes (smallest change each)

Each fix names the proof. "Eval" ids refer to `uxqa/agent-evals/design.md`. Pytests go under `agent/tests` (in-memory sqlite). The scripted-model seam already exists: `patch("neos_agent.api.chat.acompletion", AsyncMock(side_effect=[...]))`, as used in `tests/test_uxqa_p1_arrival.py:349`.

1. **Make consent through chat the caller's own, in the engine's vocabulary, with the cascade.**
   - Add `record_consent_position` to `CALLER_SCOPED_TOOLS` and drop `participant` from its schema. The name comes from `caller_member(db, caller_user_id, prop.ecosystem_id)`.
   - Accept `objection` and store `object`. Call `maybe_auto_advance_proposal` and return `gates` and `auto_transitions`, as `mcp_server.py:701` does.
   - Apply the same caller-name rule to REST `POST /proposals/:id/consent` (`api/proposals.py:916` trusts `body.member_name`).
   - *Test:* a pytest. Ana records `position="objection"` with `participant="Ben"` on a quorum-1 proposal in consent. Expect one row named Ana, `gates.consent.open_objections == 1`, and a following consent by another member does not advance to test. *Eval:* A2, A3, C2, M2.
2. **Shrink inside the result instead of replacing it** (`api/chat.py:633-643`).
   - Write a `_fit_tool_result(result, limit=6000)`: clip strings over 500 characters, cap lists at 10 items with `"more": N`, and drop the whole result only as a last resort.
   - *Test:* a scripted-model pytest. Round 1 calls `get_proposal` on a proposal with three 800-character advice entries. The tool message passed to round 2 must contain the title, the status and all three advisors. It fails today. *Eval:* R1, R4.
   - Note: `api/chat.py` is owned by BE-Journey (wave 1), so hand this over.
3. **Identify and link things the way the page does.**
   - Give `get_proposal`, `get_agreement`, `record_advice`, `record_consent_position` and `update_proposal_status` an id-or-key resolver (port `mcp_server._resolve`).
   - Add `id` and `link` (`/proposals/<uuid>`, `/agreements/<uuid>`, `/domains/<uuid>`) to every get/search row.
   - Make domains return `display_name` and match on name too. Show `ecosystem_name` instead of UUIDs.
   - *Test:* a pytest checks that `get_proposal` with the UUID returns the proposal, and that `get_domain("Seed Library")` finds the named domain and returns its `display_name`. *Eval:* R1, R5.
4. **Make `get_proposal` carry its state and a next step.**
   - Add `gates` (`proposal_gate_status`) and `caller: {is_author, can_manage, has_advised, my_position}`.
   - Add a one-line `next_step`, derived from status, gates and caller (for example "Advice round 1 of 2 is open; you can give advice").
   - Make `check_quorum` return `gates.consent` instead of its own 2/3 rule.
   - *Test:* a pytest on an advice-stage proposal with `min_advice_rounds=2` and one entry expects `advice.rounds == 1`, `required_rounds == 2`, and a `next_step` that mentions advice. `check_quorum` must agree with the engine. *Eval:* R1, R4.
5. **Add a "what's waiting for me" read tool, `my_open_items`** (caller-scoped). It returns:
   - proposals in advice that the caller did not write and has not advised in the latest round;
   - proposals in consent where the caller has no position;
   - the caller's own proposals, each with its `next_step`;
   - agreements awaiting the caller's consent (reuse the `pending_consents` logic of `/auth/me`).

   Each row carries title, ecosystem, action and link, with at most 10 per group. *Test:* a pytest with three proposals (advice not yet advised, advice already advised, consent with no position) expects exactly the first and the third, with actions "give advice" and "record your position". *Eval:* R2.
6. **Rewrite about 40 lines of the foundation prompt.**
   - Add an act-as-caller rule ("never record advice, a position, an exit or a declaration in another person's name; say they must do it and give the link").
   - Add refusal wording (who can, what you can do instead) and a five-stage ACT guide that says consent is not a vote, explains stand aside versus object (with a reason), and covers consensus mode.
   - Use the NEOS capture names and map emergency states to Normal, Crisis and Recovery.
   - Delete rule 3. Narrow rule 2 to "the action tools enforce permissions".
   - Replace the tone and "structured intake" lines with "plain words, short sentences, explain a NEOS term the first time, at most about 120 words unless asked, ask one thing at a time".
   - *Proof:* behavioural, not a string test. Eval R3, P1-P3 and M1-M5 should move from fail to pass, and their judge mean and FK grade should improve.
7. **Ask for confirmation before irreversible acts.**
   - `declare_emergency`, `create_exit_record`, `update_proposal_status(withdrawn)`, `update_agreement_status` and `create_ecosystem` require `confirmed: true`. Without it they write nothing and return `needs_confirmation: "<what will happen>"`.
   - In `api/chat.py`, refuse `confirmed: true` for a tool that already returned `needs_confirmation` in the same request. This stops the model confirming on its own behalf, and is about 10 lines.
   - *Test:* a scripted-model pytest. Withdrawing without confirmation must leave the proposal unchanged. Confirming in the same request is refused. A new request with `confirmed: true` withdraws it. *Eval:* C4, M3, P3.
8. **Fill the two member actions people need most: `join_domain` and `submit_test_report`.** Both are caller-scoped. `join_domain` reuses the gate evaluator behind `POST /domains/:id/participation`; `submit_test_report` ports `mcp_server.py:751`. *Test:* a pytest checks that joining an ungated domain creates an active `CircleMembership` for the caller, and that a gated domain returns the `required_agreements` refusal. A test report on a test-stage proposal with no declared cases advances it to ratified. *Eval:* A6 (plus a pass-02 test-report task if one is added).

## 5 Caveats for BE-ACT (`p1-coord-chat-tool-authz`)

"Call the same policy rule as REST" leaves holes where REST has none:

- REST consent trusts `member_name` (`api/proposals.py:916`). The UI sends the member's own display name from the client (`charting-the-course/client/src/pages/governance/proposals/ProposalDetail.tsx:311-316`).
- REST `POST /emergency/declare` checks authentication only (`api/emergency.py:171`). NEOS requires pre-authorized roles (`NEOS.md:41`, skill `pre-authorization-protocol`). Decide on one predicate and apply it to REST, MCP and chat together.
- Chat `create_ecosystem` creates no membership; REST makes the creator steward.
- Chat `update_agreement_status` must go through the agreement ceremony rule (active admin+) and the gates, not `VALID_TRANSITIONS`.
- `create_decision_record`: decisions are minted by the engine. Make it steward-only, or remove it from chat.
- The tool filters use the fail-open pattern `if ecosystem_ids:` that `api/AGENTS.md` calls a bug class. Move them to `restrict_to_ecosystems`.

## Deferred (not ranked)

- The UI tool chips show raw tool names and token counts (`charting-the-course/client/src/components/FloatingComms.tsx:721`, `:794-799`). The server's labels (`api/chat.py:51-81`) could go out in `tool_start`. Do this with fix 6.
- Starting skills automatically from intent. Only if the eval shows fix 6's stage guide is not enough.
- One shared tool layer for MCP and chat. Revisit after BE3 `Lifecycle` lands.
- `list_ecosystems` and `get_ecosystem` expose private ecosystems' contact emails.
- The legacy `/chat/message` (`views/chat.py:552-589`) commits even after a tool fails. Retire it rather than fix it.
