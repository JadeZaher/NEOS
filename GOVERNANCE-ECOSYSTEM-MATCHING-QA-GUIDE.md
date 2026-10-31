# NEOS Governance & Ecosystem Matching QA Guide

**Status:** Release and governance verification guide
**Companion:** [GOVERNANCE-ECOSYSTEM-MATCHING-UX-GUIDE.md](GOVERNANCE-ECOSYSTEM-MATCHING-UX-GUIDE.md)
**Scope:** Public discovery, matching profiles, affinity assessments, orientation handoff, consent, protected directory data, and governance safeguards.

## 1. Quality objective

The matching system is ready only when it helps a member make an informed, voluntary next-step decision **without becoming an unaccountable source of membership, authority, or social power**.

Quality is therefore more than a correct percentage. A release must show that it:

- uses current, explicit, versioned governance sources;
- shows reasons, uncertainty, and meaningful differences;
- protects consent and private data;
- preserves the UAF onboarding ceremony, ACT authority boundaries, pluralism, and exit rights; and
- remains usable, accessible, fast, and understandable under ordinary and adversarial conditions.

Existing broad coverage belongs in [QA-TEST-PLAN.md](QA-TEST-PLAN.md) and [QA-USERFLOWS-GUIDE.md](QA-USERFLOWS-GUIDE.md). This document adds release-blocking checks specific to governance-aware matching.

## 2. Release gates

Do not enable matching for a production ecosystem until every P0 item below passes in an integrated environment with production-like authorization, migrations, and data handling.

| Gate | Release evidence | Owner |
| --- | --- | --- |
| Governance source integrity | Current ratified UAF/charter/domain references, versions, status, review dates, and non-negotiable classifications are available through the matching profile. | Ecosystem steward + engineer |
| Algorithm governance | Matching taxonomy, weights, thresholds, and change process are published, versioned, and approved through the applicable ACT process. | Governance steward |
| Functional correctness | Formula, coverage, status routing, stale handling, corrections, and independent multi-ETHOS records pass automated tests. | Engineering |
| Privacy and authorization | Consent is granular; private matching and directory data are fail-closed; no cross-member or cross-ecosystem leakage occurs. | Security reviewer |
| Human usability | Usability participants can identify why a result appeared, its uncertainty, and how to decline or correct it. | UX research/design |
| Accessibility and resilience | Keyboard, screen reader, mobile, reduced-motion, loading, empty, and failure states pass. | QA |
| Safeguard stress tests | All seven NEOS stress scenarios pass with documented outcomes. | Independent verifier |

## 3. Test fixture set

Use deterministic fixtures. Never use production answers or real directory data in automated tests.

### Ecosystems

| Fixture | Description | Purpose |
| --- | --- | --- |
| `eco-current` | Ratified UAF v1.4, current review date, published matching profile, two active documented domains, all dimensions present. | Happy path and formula tests. |
| `eco-stale` | Same as `eco-current`, then UAF v1.5 or a domain amendment is ratified. | Stale result and source-version tests. |
| `eco-incomplete` | Missing ratified charter reference or one material matching dimension. | No invented score / coverage tests. |
| `eco-private` | Valid profile but non-public dossier/directory. | Authorization and visibility tests. |
| `eco-divergent` | Published non-negotiable commitment that a fixture member explicitly cannot support. | Discussion/entry-path routing. |
| `eco-multi` | A second autonomous ETHOS with distinct UAF, domains, lifecycle, and matching profile. | Isolation and pluralism tests. |

### Members

| Fixture | Description | Purpose |
| --- | --- | --- |
| `member-explorer` | Supplies only purpose and practical preferences. | Low coverage and no-pressure UX. |
| `member-promising` | Supports material commitments and has relevant domain interest. | Positive explainable assessment. |
| `member-discuss` | Marks one discussion-required commitment as needing discussion. | Tension presentation. |
| `member-divergent` | Explicitly cannot support a published non-negotiable. | No hidden arithmetic override. |
| `member-private` | Revokes matching and directory-discovery consent. | Revocation and deletion. |
| `member-multi` | Has independent records/answers for `eco-current` and `eco-multi`. | Cross-ETHOS separation. |
| `member-attacker` | Attempts client-supplied member IDs, cross-ecosystem IDs, stale tokens, and unauthorized API calls. | Authorization tests. |

Record source and algorithm versions in every expected response fixture. A test must never rely on live dates, arbitrary ranking order, an external LLM, or a previous run’s database state.

## 4. Automated verification pyramid

| Layer | What to automate | Examples |
| --- | --- | --- |
| Unit | Pure scoring, coverage, status selection, version comparison, and permission-policy functions | Unknown data does not score zero; non-negotiable conflict overrides headline status; same snapshot produces same response. |
| API/service integration | Persistence, authorization, idempotency, migrations, response contracts, event/audit records | Session identity is authoritative; revocation removes future matching visibility; an amended UAF marks assessments outdated. |
| Component | Result card, explanation drawer, consent controls, source links, empty/error/loading states | Screen-reader text includes coverage; source details open by keyboard; protected data stays hidden on query error. |
| E2E | Discovery through orientation, correct recovery paths, cross-browser/mobile behavior | Browse without disclosure → voluntary fit check → explain result → choose orientation → complete governed onboarding. |
| Manual/independent | Usability, accessibility, governance audit, abuse simulation, stress scenarios | Participants explain a score in their own words; a non-leader checks no manual result override occurred. |

Run the full integrated test/lint/typecheck sweep once after all related changes are applied. Do not mark the release complete based only on unit tests.

## 5. P0 functional test cases

### 5.1 Source integrity and scope

| ID | Given / When / Then | Expected result |
| --- | --- | --- |
| MATCH-SRC-01 | Given `eco-current`, when its matching profile is fetched, then all material signals resolve to ratified agreement/domain sources. | Each source includes stable ID, title, version, status, scope, and review date. |
| MATCH-SRC-02 | Given `eco-incomplete`, when an assessment is requested, then a material source is missing or unratified. | Return `unavailable` or `more_to_learn` with the gap; never calculate a confident score from marketing text. |
| MATCH-SRC-03 | Given sources in one agreement field where a lower agreement conflicts with a higher one, when the result is displayed. | The higher-level agreement is identified as governing; no lower-level preference silently overrides it. This precedence never crosses autonomous ecosystems: cross-ecosystem conflicts require an inter-unit agreement. |
| MATCH-SRC-04 | Given a matching profile update, when the updater lacks the documented authority, then they submit it. | Request is denied and an audit event records the attempt. |
| MATCH-SRC-05 | Given two ecosystem profiles, when a member views each, then their UAFs conflict. | Both remain independently described; no system-global “correct value” or merged charter is implied. |
| MATCH-SRC-06 | Given a UAF whose annual review is overdue but which has not been amended or sunset, when it is used for matching. | It remains the current binding source, carries a visible `review overdue` warning, and triggers the documented review escalation rather than a fabricated replacement. |

### 5.2 Calculation, uncertainty, and explanation

| ID | Given / When / Then | Expected result |
| --- | --- | --- |
| MATCH-CALC-01 | Given an assessment input snapshot, when it is evaluated twice, then versions and answers are identical. | Dimension scores, fit estimate, coverage, reasons, and status are identical. |
| MATCH-CALC-02 | Given unknown optional answers, when an assessment is calculated, then some signals have no answer. | Unknown signals are excluded from both numerator and denominator; coverage decreases and no zero is implied. |
| MATCH-CALC-03 | Given only 55% weighted evidence, when a result is rendered. | No headline numerical estimate is displayed; the member sees missing evidence and an optional next step. |
| MATCH-CALC-04 | Given a member supports every comparable signal, when the fit is calculated. | Each documented dimension is 100; the weighted result is 100 with 100% coverage. |
| MATCH-CALC-05 | Given a known fixed fixture with partial scores, when the formula runs. | The result equals the published weighted formula within deterministic rounding rules. |
| MATCH-CALC-05A | Given one answer in an agreement dimension with many weighted unanswered signals, when coverage is calculated. | The dimension’s signal coverage is partial and the system cannot report the dimension or overall evidence as complete. |
| MATCH-CALC-06 | Given `member-divergent`, when they mark a published non-negotiable “cannot support.” | Status is `not_recommended_entry_path`; the exact source and answer appear, even if the arithmetic fit is high. |
| MATCH-CALC-07 | Given `member-discuss`, when a discussion-required commitment is unresolved. | Status is `discuss_before_deciding` and the result contains a visible conversation topic, not only a lower score. |
| MATCH-CALC-08 | Given `member-promising`, when a result is shown. | At most three plain-language supporting reasons appear, each traceable to a voluntary answer and source. |
| MATCH-CALC-09 | Given any displayed reason or tension, when the member opens it. | It names the dimension, answer, source agreement/domain and version, and a plain-language explanation of effect. |
| MATCH-CALC-10 | Given result order in discovery, when two estimates tie or no estimate exists. | Ordering uses an explicitly documented, stable neutral rule; a missing score does not sink an ecosystem invisibly. |
| MATCH-CALC-11 | Given an assessment POST is retried with the same authenticated member, source/version snapshot, answers, and idempotency key. | The API returns the original deterministic assessment rather than duplicate assessments or audit events. |

### 5.3 Versioning and correction

| ID | Given / When / Then | Expected result |
| --- | --- | --- |
| MATCH-VERS-01 | Given a completed assessment, when UAF v1.5 is ratified. | Assessment becomes `outdated`, identifies UAF v1.4 → v1.5, and retains its original snapshot. |
| MATCH-VERS-02 | Given an outdated assessment, when a member opens it. | The old conclusion is not shown as current; the member can compare source changes and re-run voluntarily. |
| MATCH-VERS-03 | Given a matching weight/taxonomy update, when an old result is viewed. | Both algorithm version and change summary are available; historical results are not overwritten. |
| MATCH-VERS-04 | Given a member corrects an answer, when the result is recalculated. | A new assessment is created from the correction; the old snapshot persists for audit and the member sees what changed. |
| MATCH-VERS-05 | Given a dispute about a published source, when it is submitted. | The correction route distinguishes “my answer is wrong” from “the agreement/profile is wrong,” assigns the named process, and does not permit a silent admin edit. |

### 5.4 Authority, lifecycle, and consent

| ID | Given / When / Then | Expected result |
| --- | --- | --- |
| MATCH-AUTH-01 | Given any score/status, when the assessment completes. | No membership, lifecycle state, role, domain authority, quorum weight, or directory permission is created or modified. |
| MATCH-AUTH-02 | Given a member starts orientation after a promising result. | Orientation is a suggestion; the member can select another available journey or stop without penalty. |
| MATCH-AUTH-03 | Given a member proceeds to join. | The flow begins `prospective`/`onboarding`; it does not mark the member `active` or onboarding `complete` before UAF walkthrough, 48-hour reflection, and section-level consent. |
| MATCH-AUTH-04 | Given a facilitator or administrator attempts to override a result or waive a UAF conflict. | The API/UI has no unilateral override path; any applicable agreement amendment or compatibility process is explicitly surfaced. |
| MATCH-AUTH-05 | Given `member-multi`, when they assess two ETHOS. | Matching answers, results, lifecycle, and consent are independent; a result in one never creates status or access in the other. |
| MATCH-AUTH-06 | Given a participant records `stand_aside`, `object`, or `withdrawn` during the UAF ceremony. | The stored and displayed state is distinct from `consent`; `stand_aside` cannot substitute for individual UAF entry consent. It resolves to explicit consent, a documented incompatibility/objection process, or withdrawal before membership can advance. |
| MATCH-AUTH-07 | Given an authenticated member opens a direct management/onboarding URL outside their domain authority. | Server authorization denies the action; the UI explains the required delegated role/domain and does not rely only on hidden controls. |
| MATCH-AUTH-08 | Given an orientation/join request is retried, submitted twice, or resumed after a network failure. | It is idempotent and remains `prospective`/`onboarding`; it never creates duplicate records or an active/completed membership. |
| MATCH-AUTH-09 | Given an authenticated member visits a protected management route without the delegated role. | The client does not render management controls or permit the flow; the server remains the final authority and denies direct requests. |
| MATCH-AUTH-10 | Given a fit/orientation handoff completes. | No member profile is assigned by matching/orientation. The facilitator may propose a profile and the relevant council must consent before it is recorded. |
| MATCH-AUTH-11 | Given a participant attempts consent at 47:59, 48:00, and during the post-signature withdrawal window. | Server time—not browser time—enforces the 48-hour reflection threshold; consent at 48:00 is eligible, and withdrawal remains available through day 7 with an auditable lifecycle update. |
| MATCH-CONSENT-01 | Given a visitor who has not opted in, when they browse public dossiers. | They can browse without personal matching, directory, or contact disclosure. |
| MATCH-CONSENT-02 | Given a member accepts matching but not directory visibility, when a result is created. | The result remains private and the member does not appear in any participant recommendation/directory. |
| MATCH-CONSENT-03 | Given a member revokes matching or directory-discovery consent. | Future matching/directory processing stops immediately; UI and APIs reflect the revocation; existing audit data follows documented retention rules. |
| MATCH-CONSENT-04 | Given consent/access validation errors, when protected participant data is requested. | The response fails closed (no people/contact data), presents retry/support, and logs a non-sensitive operational event. |
| MATCH-CONSENT-05 | Given a consent or revocation request is retried after a timeout. | The final consent state is applied exactly once, the response is consistent, and no duplicate grant/revocation event changes access. |

### 5.5 Privacy, security, and data minimization

| ID | Given / When / Then | Expected result |
| --- | --- | --- |
| MATCH-SEC-01 | Given `member-attacker`, when they submit another member’s ID in a profile, assessment, correction, export, or delete request. | Server derives identity from authenticated session and rejects the request; no data is read or written. |
| MATCH-SEC-02 | Given a member in `eco-current`, when they request `eco-private` matching or directory data without access. | Return only the permitted public metadata or a clear authorization response; never leak private answers, member names, or contact data. |
| MATCH-SEC-03 | Given an assessment export request. | Export contains only the requesting member’s profile/answers/results/audit data and records the source agreement versions. |
| MATCH-SEC-04 | Given a deletion request. | Personal matching profile and non-required derived data are removed or irreversibly de-identified; required governance records follow a documented minimum-retention rule and are explained before confirmation. |
| MATCH-SEC-05 | Given telemetry/logging in the fit check. | Logs omit answers, charter text, identifiers, and tokens unless a specific security event requires protected, access-controlled recording. |
| MATCH-SEC-06 | Given a feature flag or experiment. | No cohort receives undisclosed weights, hidden criteria, or a weaker privacy default. The experiment has an approved purpose, end date, and audit trail. |
| MATCH-SEC-07 | Given a matching-profile revocation/deletion and each retention deadline, when data-integrity jobs run. | Primary raw answers/results are erased or de-identified within 30 days; backups expire within 35 days; only the documented non-identifying metadata remains for its 24-month period; no free text or member identifier survives in that metadata. |

## 6. UI, content, and accessibility tests

### Core usability scripts

Test with at least a newcomer, an experienced governance participant, a person who chooses not to disclose, and a person whose first language is not the UI language. Ask them to complete these tasks without help:

1. Find two ecosystems that are possible to explore without answering personal questions.
2. Explain one ecosystem’s current UAF/charter status and where its source text is located.
3. Complete only two fit-check sections, then save and return later.
4. Explain what a displayed estimate does and does not mean.
5. Identify the biggest tension and its exact agreement source.
6. Start orientation without believing that membership has been granted.
7. Find and use “not now,” revoke directory visibility, export, and delete controls.

Pass only if participants can complete each task, accurately explain that matching does not decide admission/authority, and do not mistake a high score for consent.

### UI verification checklist

- [ ] Every card/result has a meaningful empty, loading, error, and insufficient-evidence state.
- [ ] A raw percentage never appears without “Fit estimate,” coverage, explanation, and source-version access.
- [ ] Color is not the only signal for promising/discuss/not-recommended states; screen-reader wording is equally clear.
- [ ] Keyboard focus order follows source summary → fit check → result → edit/next step; every control has a visible focus indicator and accessible name.
- [ ] All disclosure and consent actions use distinct, specific language; “I consent to participate” is not bundled with profile visibility or direct contact.
- [ ] All interactive targets meet the project’s 44px contract; desktop, 320px narrow view, zoomed text, and touch devices remain usable.
- [ ] Charts/compasses provide a text table of scores, coverage, sources, and tensions.
- [ ] Motion is cosmetic only and respects reduced-motion preferences; no countdown, scarcity, or scoring animation pressures consent.
- [ ] Error messages say what was not saved or shown, what remains private, and how to recover.

## 7. Governance and capture-resistance tests

### Policy / audit checks

- Verify the non-negotiable classifications, question set, signal weights, thresholds, and data retention policy have an agreement identifier, version, review date, decision record, and named domain owner.
- Verify a change is authorized through ACT or the documented amendment path, not an administrator-only database update.
- Verify the matching audit trail is append-only for source/result snapshots and visible to the member; a correction disposition includes rationale and authority.
- Verify aggregates used to improve matching cannot be used to rank people, grant governance power, or expose minority viewpoints.
- Verify domain competency/contribution signals do not automatically create roles or imply greater voice in consent/ACT processes.

### NEOS stress-test matrix

| Scenario | Matching-specific test | Pass condition |
| --- | --- | --- |
| Capital influx | A major donor receives a high private contribution score or asks for a higher ranking. | Donation/resource data is absent from inputs and no person can change one member’s weighting. |
| Emergency crisis | Emergency mode is declared while assessments are available. | UAF and consent protections remain active; no emergency flag auto-joins people, exposes directories, or waives matching privacy. |
| Charismatic capture | A popular founder’s informal interpretation conflicts with published charter text. | UI links the published version; informal copy cannot override or alter member results. |
| High conflict/polarization | Two member answers oppose a discussion-required commitment. | Results present exact differences and dialogue/orientation paths; no faction ranking, suppression, or automatic exclusion. |
| Large-scale replication | Simulate 5,000 members and many simultaneous assessments. | Isolated records stay correct, P95 service target is met, and explanations remain deterministic and available. |
| External legal pressure | A jurisdictional constraint affects an agreement or data request. | Jurisdiction-specific limitation is disclosed, scoped, and logged; the system does not silently rewrite the global UAF or expose data. |
| Sudden exit of 30% | Members revoke consent/leave in bulk. | Matching/export/exit controls remain available; departed members disappear from future discovery where required; no result or governance process depends on their continued presence. |

## 8. Non-functional targets and monitoring

Set final targets with production baselines, then test and monitor at least:

| Area | Initial release target | Evidence |
| --- | --- | --- |
| Determinism | Same versioned input returns the same result every time. | Automated fixture/property tests. |
| Performance | P95 dossier/profile load and assessment request under 2 seconds at anticipated pilot load. | Load test with database and authorization enabled. |
| Availability behavior | Protected data remains fail-closed during dependency failures. | Fault injection for database, auth, and consent-service timeouts. |
| Freshness | Matching profile and assessment API expose version/review/freshness state. | Contract and UI tests. |
| Auditability | 100% of profile/algorithm/source changes and assessments have required version metadata. | Scheduled data-integrity query. |
| Privacy operations | Revocation is reflected in future access immediately; export/delete requests complete within the published service level. | E2E and operational drill. |
| Accessibility | WCAG 2.1 AA checks pass and manual assistive-technology review finds no blocker. | Automated scan plus keyboard/screen-reader review. |

Monitor aggregate result coverage, correction/dispute rate, opt-out/revocation completion, explanation usefulness, time to next step, and onboarding completion. Segment only with voluntary, privacy-preserving, governance-approved aggregate data. A conversion increase is never sufficient evidence of a healthy matching system.

## 9. Pilot and launch protocol

1. **Pre-pilot review:** Validate source agreements, matching taxonomy, decision record, data map, retention policy, threat model, and test fixtures with the ecosystem’s authorized governance body.
2. **Closed pilot:** Invite a small, diverse volunteer group. Disable directory matching and automated outreach. Observe task completion and misunderstandings; interview people who stop or opt out.
3. **Independent verification:** A reviewer who did not author the matching logic checks the P0 evidence, access controls, versioning, and seven stress tests.
4. **ACT review:** Share aggregate outcomes, corrections, harms, and proposed changes with affected participants. Approve, revise, or sunset the pilot through the applicable process.
5. **Phased release:** Enable private fit estimates first; add orientation integration next; add participant discovery only after granular consent and a separate privacy/safety review.
6. **Ongoing review:** Review the algorithm and matching profile at least annually and whenever an agreement/domain change materially affects results. Trigger an earlier review on recurring corrections, privacy incidents, harm reports, or governance-health warnings.

## 10. Final sign-off checklist

- [ ] All P0 cases in sections 5–7 pass in the integrated environment.
- [ ] No existing join route can bypass prospective/onboarding status, UAF walkthrough, 48-hour reflection, section-by-section consent, or seven-day post-signature withdrawal window.
- [ ] Product, governance steward, security reviewer, accessibility reviewer, and independent verifier have reviewed evidence.
- [ ] Current known limitations, incomplete profiles, and non-goals are visible to pilot members.
- [ ] Rollback disables new assessment creation and directory recommendations without deleting member data or invalidating governance records.
- [ ] The applicable governance body has recorded the release decision and next review date.
