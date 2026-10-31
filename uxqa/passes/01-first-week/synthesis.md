---
type: UX Synthesis
pass: 01-first-week
scenario: first-week
timestamp: "2026-10-31"
lenses: [service-designer, accessibility, learning-designer, content-designer]
lensesNotRun: [domain-expert, frontline-worker, trust-behavioural]
inputs:
  - ux-report.json
  - runs/*/ux.json
  - prebake.json
  - personas.json
rubric: C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0/reference/research-panel.md
---

# UX synthesis: pass 01, a newcomer's first week in OmniOne

Every finding here is a hypothesis for human validation. Triage may mark a finding FIX only once it is confirmed in code and backed by `ux.json` evidence. Everything else goes into the validation plan as a RESEARCH_QUESTION.

Paths are relative to `uxqa/passes/01-first-week/`. `F01` to `F21` are the merged finding IDs used throughout this document.

## 1 Summary

1. The two core first-week moments do not hold up. The orientation journey has no steps (F02), and a first piece of advice moves a proposal to Consent with no explanation and no notice to anyone (F01). All four lenses scored both 27/27.
2. The human loop the product depends on is missing. The bell is a placeholder that never fills (F04). New conversations cannot be started from Messaging, profiles or members, and nobody can reach someone in another ecosystem (F03). Links in messages are plain text (F12).
3. Group membership does not feel real. Domains are shown by generated codes because a domain has no name field (F06), and "Join this domain" comes back after a reload (F05).
4. Once error noise is removed, the heatmap points to the contact path, not the dashboard. Without errors, /messaging plus /users, /members and the plain-link workarounds add up to 80 friction points. More than 90% of the friction on /dashboard and /discover comes from errors, mostly ecosystem-image 503s.
5. The gold tasks hide all of this. Six of seven passed, and the one that "failed" is a mislabelled explore run. Their success checks stop before the step that breaks: gold-orient stops at the journey URL, gold-advise stops at submit, and gold-signup does not check which ecosystem the user ends up in.

## 2 Affinity map

Lens key: **SD** service designer, **A11y** accessibility, **LD** learning designer, **CD** content designer. Each lens's own score (impact x frequency x breadth) is shown so that disagreements stay visible. The synthesis score and the reason for it are in section 6.

### Theme A: Orientation and forming a mental model

| ID | Merged finding | Lenses (own score) | Key evidence |
|---|---|---|---|
| F02 | The Explorer journey dead-ends. It shows "Journey complete or no steps found" or "Journey Complete!" with zero steps, because `GET /api/v1/journey-maps/:id` returns 302 to /dashboard. This happened for newcomers and for a long-standing member (Oren). | SD 27, A11y 27, LD 27, CD 27 | `runs/qa-new-kofi--keyboard-and-screen-reader-week-10b-journey-diag/ux.json`, `runs/qa-new-priya--expert-first-week-audit-1/ux.json` (note), `runs/qa-member-oren--expert-first-week-audit-6/ux.json` (note), `runs/qa-new-kofi--keyboard-and-screen-reader-week-9-kofi-orientation/orientation.png` |
| F11 | Wayfinding labels mislead. "My solutions: Continue orientation and alignment" leads to /solutions, "about" lands on unrelated pages, and the ethos is reachable only through Discover. Internal terms such as Control room, Governance pulse and Decision queue are never defined. | LD 18, CD 18, SD (part of its orientation finding) | `runs/qa-new-joy--plain-words-week-1/01-dashboard.png`, `runs/qa-new-joy--plain-words-week-1/ux.json` (navigations: /dashboard to /solutions to /discover), `runs/qa-new-sol--arrival-and-welcome-2/ux.json` |
| F13 | The Guide rail does not guide. It holds two accordions and a link with no week plan, it stays open from page to page, and it covers Start Journey. For keyboard users the overlay hides the focused control. | LD 12, CD 12 (together with the broken images), A11y (part of its F02 score) | `runs/qa-new-priya--expert-first-week-audit-1/ux.json` (attempt `start-journey` failed 3 times, then succeeded after `close-guide-rail`) |
| F14 | The first screen is a steward's "control room" of governance metrics. It has no welcome and no next step for a newcomer. | LD 12 (only lens) | `runs/qa-new-joy--plain-words-week-1/01-dashboard.png` |

**Disagreement.** The gold-orient task passed in one try. Its run reached `/orientation/<id>/journey`, and its success check, "find orientation", stops at that URL. Meanwhile four personas (Kofi, Priya, Sol and Oren) found the journey empty. The gold pass therefore does not count against F02: it measures arriving at the route, not learning anything there. The same gold result, together with Priya opening the ethos in one try, is why the synthesis lowers F11 from the lenses' 18 to 12 (see section 6).

### Theme B: Arrival and the invitation hand-off

| ID | Merged finding | Lenses | Key evidence |
|---|---|---|---|
| F09 | Self sign-up places people in Oasis, a crypto platform, without asking. Sol and Priya came for OmniOne. Being placed in Oasis also has knock-on effects: Priya cannot see OmniOne proposals ("Proposal not found"), and nobody in OmniOne can message her. | SD 18, LD 12, CD 12 | `runs/qa-new-priya--expert-first-week-audit-1/ux.json` (note: "auto-placed in Oasis"), `runs/qa-new-priya--expert-first-week-audit-5/ux.json` (note), `runs/qa-new-sol--arrival-and-welcome-2/ux.json`, `runs/qa-visitor--gold-signup/ux.json` |
| F20 | A logged-out deep link to a proposal goes to the landing page `/`, not to a sign-in that remembers where the person was going. Sol reached the proposal only by typing `/login?redirect=` by hand. | CD 4, SD (bundled into F09 at 18) | `runs/qa-new-sol--arrival-and-welcome-6-sol-deeplink/ux.json` (navigations `/proposals/dd9e...` then `/`), `runs/qa-new-sol--arrival-and-welcome-7-sol-signin-after-link/ux.json` (workaround) |

**Disagreement.** SD treats F09 and F20 as one broken invite journey and scores it 18 with every segment affected. LD and CD score sign-up placement at 12 and limit it to self-sign-up segments. The synthesis keeps the two findings separate, because they need different fixes, and records SD's view as the upper bound.

### Theme C: Advice, the core ACT hand-off

| ID | Merged finding | Lenses | Key evidence |
|---|---|---|---|
| F01 | The first advice entry moves the proposal to Consent on its own. Nothing explains this to the advisor or the author, and the author is not told that advice arrived. The move happens before the 7.11.2026 advice deadline, because every fixture uses the default gate (min_advice_rounds 1). | SD 27, LD 27, A11y 18, CD 8 | `runs/qa-new-sol--arrival-and-welcome-9-sol-advice/ux.json`, `runs/qa-new-kofi--keyboard-and-screen-reader-week-16-kofi-advice/ux.json`, `runs/qa-member-ines--keyboard-and-screen-reader-week-24-ines-advice-reply/ux.json`, `runs/qa-member-oren--expert-first-week-audit-6/ux.json` (note), `prebake.json` notes |
| F10 | An empty advice submit does nothing and says nothing: no request, no message and no aria-invalid. The form gives only placeholder guidance, "Advice *" is not enforced, and one checkbox reads "Open a new advice round with this entry". | CD 18, A11y (part of its F07 score of 18), SD 12 | `runs/qa-new-kofi--keyboard-and-screen-reader-week-15-kofi-advice-empty/ux.json`, `runs/qa-new-priya--expert-first-week-audit-5/ux.json` (note: "empty Submit Advice = silent no-op (no POST, no message)") |
| F21 | Joy's text-only run could not find the advice box or the Share Advice button by role and name. | A11y 3, low confidence | `runs/qa-new-joy--plain-words-week-1/ux.json` (attempt "give first advice" failed twice) |

**Disagreement.** CD scores F01 at 8 because it reads the problem as missing words. SD and LD score it 27 because it breaks the service, and LD adds that it teaches the wrong model of ACT. The synthesis takes the service reading. A wording fix cannot help an author who is never told that anything happened.

A second question about F01 needs a domain expert, and no domain-expert lens ran. Advancing before the advice deadline may be the intended default policy rather than a defect. Either way, the user sees no explanation, which is the UX failure.

A third conflict concerns F21. Kofi submitted advice using `getByRole`, which contradicts Joy's result. Joy's lane used guessed selectors, so F21 stays a research question until her lane is re-run.

### Theme D: Feedback after actions (keyboard and screen reader)

| ID | Merged finding | Lenses | Key evidence |
|---|---|---|---|
| F07 | Results of async actions are not announced, and focus is lost. Changing status, submitting advice, joining a domain and publishing an offer produce no live-region message, and focus falls to BODY after each one. Sighted users fare only a little better: a status change shows a badge and a banner but no toast (Oren). | A11y 18, SD 4 (lifted to MEDIUM by the accessibility exception), CD 8 | `runs/qa-member-ines--keyboard-and-screen-reader-week-3b-advice-status/ux.json`, `runs/qa-new-kofi--keyboard-and-screen-reader-week-21-kofi-publish-offer/ux.json`, `runs/qa-member-oren--expert-first-week-audit-3/ux.json` (note: "status change POST 200 with no toast/confirmation") |
| F19 | Custom selects do not follow keyboard conventions. Enter does nothing on Change Status (only Space works), and the trigger goes blank afterwards. On the offer form, ArrowDown silently changed the Domain to "ops". Status options also appear as raw lowercase values ("advice", "withdrawn"). | A11y 6 (MEDIUM by exception), SD (part of F17) | `runs/qa-member-ines--keyboard-and-screen-reader-week-3b-advice-status/ux.json`, `runs/qa-new-kofi--keyboard-and-screen-reader-week-21-kofi-publish-offer/ux.json`, `runs/qa-member-oren--expert-first-week-audit-3/ux.json` |
| F08 | Icon-only buttons have no accessible name (axe `button-name`, critical) on 9 routes. These include the Messaging "+", the copy buttons on /me, and controls on the proposal pages. | A11y 18, CD (part of F03) | `ux-report.json` axeRules, `runs/qa-member-ines--keyboard-and-screen-reader-week-4b-diagnose-plus/ux.json` |

### Theme E: Groups and membership

| ID | Merged finding | Lenses | Key evidence |
|---|---|---|---|
| F06 | Domains are identified by codes (DOM-A4641B76, dom-omni-ops-001) in the list, the page heading and the offer form's Domain select. The setup code-read found that a domain cannot be given a name, so the name lives only at the start of its purpose text. | CD 27, LD 18, A11y 12, SD (part of its membership finding at 27) | `prebake.json` defect `PB-DOMAIN-NO-NAME`, `runs/qa-new-joy--plain-words-week-1/04-domains-list.png`, `runs/qa-steward-amara--prebake-4-look/garden-detail.png` |
| F05 | Joining does not stick. "Join this domain" comes back after a reload, the steward sees no participants, and the steward herself is offered Join on her own domain. | SD 27 (combined with F06), A11y 18, CD 18, LD 12 | `runs/qa-new-kofi--keyboard-and-screen-reader-week-13-kofi-join/ux.json`, `runs/qa-new-sol--arrival-and-welcome-8-sol-join-advice/ux.json`, `runs/qa-new-priya--expert-first-week-audit-1/ux.json` (note: "'Joined' resets on reload"), `runs/qa-steward-amara--arrival-and-welcome-10-amara-check/ux.json` |

**Disagreement.** The content designer asked whether real data would carry readable names. The prebake answers that it would not: the create form and the create request have no name field, and seeded domains look readable only because the seed sets `domain_id` directly. This makes F06 more certain, not less.

Joy's "selector failure" on `getByRole('link', {name: /food|grow|garden.../})` is also consistent with F06. If a card's accessible name is the code, a search by topic finds nothing. It is not only a harness fault.

### Theme F: Contact, messaging and notification (the human loop)

| ID | Merged finding | Lenses | Key evidence |
|---|---|---|---|
| F03 | There is no way to start a conversation with a chosen person. The Messaging "+" does nothing with keyboard or pointer: no request and no change on the page. Profiles and member cards have no Message action, and search only filters existing conversations. Members of another ecosystem cannot be reached at all, and Oren's run was BLOCKED. | SD 27, A11y 18, LD 12, CD 12 | `runs/qa-member-oren--expert-first-week-audit-4/ux.json` (BLOCKED, 4 workarounds including API calls), `runs/qa-member-ines--keyboard-and-screen-reader-week-4b-diagnose-plus/ux.json`, `runs/qa-new-priya--expert-first-week-audit-5/ux.json` (the URL had to be sent outside NEOS) |
| F12 | A proposal URL pasted into a message is plain text, not a link. Twice Kofi had to go back through the dashboard decision queue instead. | A11y 18, SD (part of F03), LD 12, CD 12 | `runs/qa-new-kofi--keyboard-and-screen-reader-week-15-kofi-advice-empty/ux.json` and `-16-kofi-advice/ux.json` (workarounds), `runs/qa-steward-amara--arrival-and-welcome-5-amara-reply/ux.json` |
| F04 | The notification bell is a hard-coded empty placeholder. Arrivals, messages, joins and advice never appear in it, although it promises "governance updates, proposal activity, and community alerts". | LD 27, SD 18, CD 18, A11y (part of F12) | `prebake.json` defect `PB-BELL-STUB` (setup code-read), `flows/expert-first-week-audit/j6-oren-review/01-bell.out.txt` (bell click makes no API calls), `runs/qa-member-ines--keyboard-and-screen-reader-week-23-ines-bell/ux.json` |

**Disagreement.** Amara's run 5 records the attempt "bell shows arrival" as `ok: true` on its second try, which contradicts F04. The flow (`flows/arrival-and-welcome/t4.mjs:8-9`) throws only when the panel text matches "No new notifications", so a panel that has not opened, with empty text, passes. Treat that attempt as a harness false positive. The code-read and Oren's bell output agree that the bell is empty.

Supporting signal: /proposals and /proposals/[id] have the highest revisit counts in the heatmap (9 and 8). That fits people polling for activity because nothing tells them about it.

### Theme G: Offers

| ID | Merged finding | Lenses | Key evidence |
|---|---|---|---|
| F17 | Publishing an offer returns to the Ecosystems tab, where the new offer is not shown. The Domain select lists codes, and one keystroke silently attached Kofi's offer to "ops". | SD 8, A11y (part of F19), LD/CD (part of F06) | `runs/qa-new-kofi--keyboard-and-screen-reader-week-21-kofi-publish-offer/ux.json`, `-22-find-offer-qa-new-kofi/ux.json`, `runs/qa-member-ines--keyboard-and-screen-reader-week-22b-find-offer-qa-member-ines/ux.json`. gold-share passed, but with the highest gold friction (38). |

### Theme H: Accessibility hygiene and coverage

| ID | Merged finding | Lenses | Key evidence |
|---|---|---|---|
| F15 | There are serious axe failures on the two main hubs: colour contrast on /proposals, plus aria-hidden-focus and an invalid list on /dashboard. | A11y 12 | `ux-report.json` axeRules |
| F18 | Zoom, reflow and slow network were barely tested. Only Amara ran at 200% zoom, Sol ran at 390px with no accessibility tasks, Rafi (slow network) never ran, and only 23 of 76 page routes were visited. | A11y 8 (low confidence) | `ux-report.json` coverage, `personas.json` |

### Theme I: How far the evidence can be trusted

| ID | Merged finding | Lenses | Key evidence |
|---|---|---|---|
| F16 | The friction scores for /dashboard, /discover, /login and / are almost all errors: ecosystem-image 503s (`/api/v1/media/ecosystems/*.webp`), 401s on `/auth/me` before sign-in, and 404s. | SD 9 (says this is a test-environment artefact), CD 12 (says the broken images and their alt text make the product look unfinished, which counts if it is real) | Aggregated `runs/*/ux.json` errors: /discover 64 console 503s, /dashboard 57 console 503s plus 57 http 503s, /login 20 401s |

**Disagreement.** SD and CD disagree about what the broken images mean. The scenario's setup smoke already flagged the omnione.webp 503 as "likely missing local media: check before filing". F16 therefore stays a research question about the environment, not a product finding.

### Evidence no lens claimed

Three lenses did not run: domain expert, frontline worker and trust/behavioural. The run notes record the issues below, which no lens raised. They are not scored. They go to triage and to the next pass's trust and domain lenses.

| Observation | Evidence | Lens that should own it |
|---|---|---|
| The agent-access page on /me shows the MCP endpoint as `http://localhost:5173:8100/mcp`, which has two ports. There is no scope choice ("acts with your authority"), revoking has no confirmation step, and a revoked token stays visible in the "Shown once" box until reload. | `runs/qa-new-priya--expert-first-week-audit-2/ux.json` (note) | Trust / behavioural |
| The assistant replied with a raw "Chat error: ..." string. | `runs/qa-new-priya--expert-first-week-audit-5/ux.json` (note) | Content, trust |
| The author is offered "Share Advice" on their own proposal. After an edit the version stays at v1.0. | `runs/qa-member-oren--expert-first-week-audit-3/ux.json` (note) | Domain expert |
| The picker reads "Your Ecosystems: OmniOne 16" with an unlabelled count, and the dashboard reads "ALL 1 ECOSYSTEMS". | `runs/qa-member-oren--expert-first-week-audit-6/ux.json` (note) | Content |
| Proposal authorship is a free-text field, and the status endpoint has no author check. | `prebake.json` notes | Triage / security (not a UX panel matter) |
| In de-DE, dates are consistent (31.10.2026 and 7.11.2026), but status labels are raw English lowercase. | `runs/qa-member-oren--expert-first-week-audit-3/ux.json` | Content (locale) |

## 3 Friction heatmap narrative

Friction weights per `friction-metrics.md`: 10 x abandon + 6 x workaround + 3 x rage + 2 x error + 2 x dead click + 1 x axe. The **behaviour** column takes errors out, so it shows only what people did. Errors on the top routes are mostly environment noise (F16).

| Route | Friction | Behaviour (errors removed) | What people were trying to do | What happened |
|---|---|---|---|---|
| /dashboard | 313 | 21 | Land after sign-in, find where to start, open a proposal from the decision queue, check the bell | 292 of the 313 points are errors: 57 http 503s on ecosystem images and 23 404s. The real friction is small. Sol abandoned "open proposal" on a 390px screen after three tries; it is unclear whether the queue link is hidden on mobile or the locator was wrong. Sol also had to type `/login?redirect=` by hand to get back to the proposal he was sent. The page has 3 axe issues. Newcomers found a metrics wall with no welcome (F14). |
| /discover | 296 | 20 | Find OmniOne, read its ethos, start orientation | 276 points are image 503s. Both abandonments here were partly caused by the harness: Priya's own note calls hers a locator error, and Joy's lane used guessed selectors. What remains is real: Discover is the only route to the ethos (F11). |
| /login | 116 | 0 | Sign in, sign up, use a DID | All of it is errors: 401s on `/auth/me` before sign-in, which are expected, and 404s. Sign-up itself worked. Its problem is where it puts people (F09). |
| / | 100 | 10 | Arrive from a shared proposal link | The logged-out deep link dropped Sol on the landing page, and the sign-in form was not where he expected it (F20). |
| /proposals/[id] | 75 | 19 | Open a proposal for advice, give advice, read advice | There were 6 dead clicks and 7 axe issues, and it has the second-highest revisit count (8). Status changes produced no confirmation (F07, F19), empty advice was silently ignored (F10), and the first advice moved the proposal to Consent unexplained (F01). Every agent got through, which is why this score understates F01. |
| /messaging | 62 | **38** | Start a conversation with a named person | **This is the highest-friction route once errors are removed.** All 7 dead clicks were on the "+". Oren was BLOCKED there, and Ines needed pointer diagnostics in a keyboard-only run (F03, F08). |
| /users/[username] | 18 | 18 | Message a person from their profile | Every point here is a workaround. With no Message action, Oren queried `/api/v1/messaging/members` directly (F03). |
| /members | 20 | 12 | Find a person to contact, or see who has arrived | 3 dead clicks and 1 workaround (a profile URL copied from somewhere else). The member list shows only the viewer's own ecosystem (F03, F09). |
| UNMATCHED:blank | 12 | 12 | Follow the proposal link a helper sent | 2 workarounds: the URL was plain text, so Kofi went back through the dashboard queue (F12). |
| /orientation/[ethos_slug]/journey | 20 | 10 | Begin the Explorer path | The journey had no steps. Oren abandoned "open governance model" here after 4 tries (F02). |
| /domains, /domains/[id] | 17, 4 | 3, 2 | Find the food group, join it, be seen | The scores are low because the failures make no noise. Codes stand in for names (F06), and the join state resets silently on reload (F05). Agents read the purpose text and carried on, but Joy did not. |

**Reading the heatmap.** The raw ranking would send a team to fix image hosting on /dashboard. The behaviour ranking sends them to person-to-person contact: /messaging, /users, /members and the plain-link workarounds add up to 80 behaviour points. The worst service failures (F01, F04, F05) barely register at all, because the agents routed around them without any error firing. The heatmap measures noise, not missing feedback.

## 4 Heuristic violations

The severity column gives the synthesis band from section 6.

| Heuristic (Nielsen) | Route | Evidence | Finding | Severity |
|---|---|---|---|---|
| 1 Visibility of system status | /proposals/[id] | Moves to Consent on the first advice, unexplained; nobody is told | F01 | critical |
| 1 Visibility of system status | header bell (all routes) | `PB-BELL-STUB`; bell click makes no request | F04 | critical |
| 1 Visibility of system status | /domains/[id] | Join resets on reload; steward sees no participants | F05 | critical |
| 1 Visibility of system status | /proposals/[id], /discover/shares-needs/new | No announcement; focus falls to BODY | F07 | critical |
| 2 Match between system and the real world | /domains, /domains/[id], offer form | Code DOM-A4641B76 used as the title; no name field | F06 | critical |
| 2 Match between system and the real world | /dashboard, sidebar | "My solutions: Continue orientation"; Control room jargon | F11, F14 | serious |
| 3 User control and freedom | /, /login, /dashboard | Placed in Oasis without being asked; deep link lost | F09, F20 | serious, minor |
| 4 Consistency and standards | /messaging | Dead "+"; conversations can start only from the drawer | F03 | critical |
| 4 Consistency and standards (WCAG 4.1.2) | 9 routes | axe `button-name` | F08 | critical |
| 5 Error prevention | /discover/shares-needs/new | ArrowDown silently picked "ops" | F17, F19 | serious, MEDIUM by exception |
| 7 Flexibility and efficiency of use | /messaging | Proposal URL shown as plain text | F12 | serious |
| 7 Flexibility and efficiency of use (WCAG 2.1.1) | /proposals/[id] | Enter does nothing on Change Status | F19 | MEDIUM (accessibility exception) |
| 8 Aesthetic and minimalist design | /dashboard | Governance metrics wall shown to a newcomer | F14 | serious |
| 8 Aesthetic and minimalist design (WCAG 1.4.3, 1.3.1) | /proposals, /dashboard | Contrast, aria-hidden-focus, list | F15 | serious |
| 9 Help users recognise, diagnose and recover from errors | /orientation/[ethos_slug]/journey | "Journey complete or no steps found" shown for a failed load | F02 | critical |
| 9 Help users recognise, diagnose and recover from errors | /proposals/[id] | Empty advice submit is silent | F10 | serious |
| 10 Help and documentation | Guide rail (all routes) | No week plan; covers Start Journey | F13 | serious |

## 5 JTBD gaps

| Job the user hired NEOS for | Who | Status this pass | Findings |
|---|---|---|---|
| Understand what this community is and how I take part | Newcomers | **Not done.** The journey is empty. The ethos page can be read, but only through Discover. | F02, F11, F13, F14 |
| Join the community I was invited to and land on what I was sent | Self-sign-up newcomers | **Not done.** People are placed in Oasis, and the deep link is lost. Sol got through only by typing a redirect URL. | F09, F20 |
| Get into a group about something I care about and be seen as a member | Newcomers, stewards | **Fragile.** The group can be found only by reading purpose text, the join does not stick after reload, and the steward cannot see the member. | F05, F06 |
| Give my first piece of advice and know it was received | Newcomers, advisors | **Fragile.** An empty submit is silent, nothing is announced, and the stage changes with no explanation. | F01, F07, F10, F21 |
| Open my proposal for advice and know when to act | Authors | **Only by polling.** No notification arrives. Advice is found by re-opening each proposal. | F01, F04, F07 |
| Ask a specific person for their view and point them to the thing | Members, stewards | **Only through a workaround.** The drawer works within one ecosystem. Across ecosystems contact is impossible in the UI. Links do not work. | F03, F12 |
| Welcome newcomers quickly | Stewards | **Only by polling /members.** The bell never shows arrivals. | F04, F05 |
| Offer my skill to the people who need it | Members | **Works, with a risk of misrouting.** The offer may be attached to the wrong group, and the user is not shown where it appears. | F17, F19 |
| Plan my first week | Newcomers | **Not done.** Nothing in the product offers a week plan. | F13 |

## 6 Findings ranked by severity

Score = impact x frequency x segmentBreadth. Bands: 18-27, or impact 3 on a gold-task path, is critical (HIGH). 8-17 is serious (MEDIUM). 1-7 is minor (LOW). An impact-3 barrier that affects only one segment still counts as at least MEDIUM (the accessibility exception). Where the synthesis score differs from the lenses' scores, the reason is given.

| Rank | ID | Finding | I x F x B | Score | Band / ledger | Confidence | Lens scores | Why this score |
|---|---|---|---|---|---|---|---|---|
| 1 | F01 | First advice moves the proposal to Consent, unexplained, and nobody is told | 3x3x3 | 27 | critical / HIGH (gold-advise path) | high | SD 27, LD 27, A11y 18, CD 8 | Seen in every advice journey (Sol, Kofi, Ines, Oren). Default gate confirmed in prebake. |
| 2 | F02 | Orientation journey dead-ends with misleading "complete" copy | 3x3x3 | 27 | critical / HIGH | high | all 27 | Four personas, including a member. First check that the 302 reproduces for a fresh user. |
| 3 | F03 | No way to start a conversation with a chosen person; other ecosystems unreachable | 3x2x3 | 18 | critical / HIGH, **BLOCKER** for contact across ecosystems (no in-UI workaround) | high | SD 27, A11y 18, LD 12, CD 12 | Frequency 2: within one ecosystem the drawer works. |
| 4 | F04 | Bell is a placeholder; arrivals, messages, joins and advice never appear | 3x3x2 | 18 | critical / HIGH | high (setup code-read and UI agree) | LD 27, SD 18, CD 18 | Breadth 2: visitors and readers who only browse have nothing to be notified about. |
| 5 | F06 | Domains shown by generated codes; a domain cannot be named | 3x3x2 | 18 | critical / HIGH | high | CD 27, LD 18, A11y 12 | Goal failure for low-literacy and screen-reader users; a detour for everyone else. |
| 6 | F05 | Join does not persist after reload; steward cannot see participants | 2x3x3 | 18 | critical / HIGH | high | SD 27, A11y 18, CD 18, LD 12 | Impact 2 until triage shows whether participation is stored at all (it rises to 27 if not). |
| 7 | F07 | Async outcomes not announced; focus lost to BODY | 3x3x2 | 18 | critical / HIGH | high | A11y 18, CD 8, SD 4 | Scored for keyboard and screen-reader segments. Sighted users get a badge or banner. |
| 8 | F08 | Icon-only buttons with no accessible name on 9 routes | 3x3x2 | 18 | critical / HIGH | high (axe) | A11y 18 | Affects screen-reader and voice-control users. Includes the "+" behind F03. |
| 9 | F09 | Self sign-up places users in Oasis without asking | 3x2x2 | 12 | serious / MEDIUM | medium | SD 18, LD 12, CD 12 | Steward-added newcomers are unaffected. Rises to 18 if every self sign-up lands in Oasis. |
| 10 | F10 | Empty advice submit is silent; form guidance is placeholder-only | 2x2x3 | 12 | serious / MEDIUM, at least MEDIUM for screen-reader users | high | CD 18, SD 12, A11y (part of F07) | Sighted users recover by typing something. Screen-reader users cannot tell what happened. |
| 11 | F11 | Wayfinding labels mislead; the ethos is reachable only through Discover | 2x2x3 | 12 | serious / MEDIUM | medium | LD 18, CD 18 | Frequency lowered from 3 to 2: gold-orient and Priya both found orientation in one try. |
| 12 | F12 | Proposal URLs in messages are plain text | 2x2x3 | 12 | serious / MEDIUM | high | A11y 18, LD 12, CD 12 | Seen in two hand-offs (Ines to Kofi, Amara to Sol). |
| 13 | F13 | Guide rail has no week plan and covers Start Journey | 2x2x3 | 12 | serious / MEDIUM | medium | LD 12, CD 12 | Priya was able to close it and continue. |
| 14 | F14 | First screen is a steward's control room with no newcomer cue | 2x3x2 | 12 | serious / MEDIUM | medium | LD 12 | Raised by one lens only, and part of its support (the /dashboard friction score) is error noise. |
| 15 | F15 | Serious axe failures on /dashboard and /proposals | 2x3x2 | 12 | serious / MEDIUM | medium | A11y 12 | Objective, but whether the elements are reachable is unconfirmed. |
| 16 | F16 | Ecosystem-image 503s dominate the heatmap; real or test environment? | 1x3x3 | 9 | serious / RESEARCH_QUESTION | medium | SD 9, CD 12 | It counts as a product issue only if real users see broken tiles. |
| 17 | F17 | Offer publishing ends on the wrong tab and can misroute to the wrong domain | 2x2x2 | 8 | serious / MEDIUM | medium | SD 8 | gold-share had the highest gold friction (38). |
| 18 | F18 | Zoom, reflow and slow network not tested; 23 of 76 routes visited | 2x2x2 | 8 | serious / RESEARCH_QUESTION | low | A11y 8 | A coverage gap, not a defect. |
| 19 | F19 | Custom selects break keyboard conventions; raw status labels | 3x2x1 | 6 | minor, lifted to **MEDIUM** by the accessibility exception | medium | A11y 6 | Impact 3 for keyboard-only users. |
| 20 | F20 | Logged-out deep link lands on / and the destination is lost | 2x1x2 | 4 | minor / LOW | low | CD 4, SD (part of F09 at 18) | Seen in one journey only. Compounds F09 for invited newcomers. |
| 21 | F21 | Advice box possibly not exposed by role or name | 3x1x1 | 3 | minor / RESEARCH_QUESTION (MEDIUM by the accessibility exception if confirmed) | low | A11y 3 | Contradicted by Kofi's run, and Joy's selectors were guessed. Re-run her lane first. |

Triage hints. F04 and F06 already have setup code-reads in `prebake.json`. F05, F10, F20, F17 and the status-toast part of F07 match the setup hypotheses listed in `scenario.md`. These are the quickest to confirm as FIX. F01's default gate is a governance-policy question for a product owner before it becomes a code question.

## 7 Gold tasks and trend

| Gold task | Runs | Success | Median clicks | Median seconds | Median friction | Note |
|---|---|---|---|---|---|---|
| gold-signup | 1 | 100% | 2 | 25 | 10 | Does not check which ecosystem the user lands in (F09) |
| gold-orient | 1 | 100% | 5 | 22 | 26 | Success stops at the `/journey` URL and does not check the steps (F02) |
| gold-advise | 1 | 100% | 4 | 24 | 10 | Stops at submit. Does not check that the author is told, or that the stage change is explained (F01) |
| gold-profile | 1 | 100% | 2 | 50 | 7 | Slowest gold task |
| gold-propose | 1 | 100% | 4 | 18 | 6 | |
| gold-share | 1 | 100% | 6 | 13 | 38 | Highest gold friction, consistent with F17 |
| gold-advise-profile-orient-explore | 1 | 0% | 1 | 6 | 2 | **Harness artefact.** The run's note is "explore", it has 0 steps, lasts 6 s, and hit a console 404 on proposal 52af2488. It is an explore run filed under a gold name. |

**Trend.** This is the first scenario pass, so there is no gold trend yet. Every gold task has n=1.

Mean friction per journey went from 6 (00-setup) to 13.99 (+133%), which fails the exit check's ±10% tolerance. The comparison is not like for like: 00-setup was a smoke pass, and this pass carries the image-503 noise (F16).

The exit check `goldSuccess` fails only because of the mislabelled run. `newHigh` waits on triage, and route coverage is 30% (23 of 76).

**Recommended before pass 02.**

- Rename or exclude the explore run, so `goldSuccess` measures gold tasks.
- Tighten the success checks:
  - gold-orient must reach journey step 1 content.
  - gold-advise must assert that the author can see the advice and that the stage change is explained.
  - gold-signup must land in the intended ecosystem.
- Add gold-join (membership survives a reload and the steward sees it) and gold-message (start a conversation with a named member from /messaging).
- Run each gold task at least 3 times, so a median means something.

## 8 Human validation plan

The rule is 5 human sessions per affected segment. One session runs several tasks, so the plan is organised by segment. Paired sessions (author with advisor, steward with newcomer) test the hand-offs, and each participant counts toward their own segment.

### Preconditions (no participants needed)

| # | Check | Settles |
|---|---|---|
| P1 | Reproduce `GET /api/v1/journey-maps/:id` returning 302 for a freshly signed-up user and for a steward-added member on a clean environment | Whether F02 is a product defect or an environment one |
| P2 | Load `/api/v1/media/ecosystems/*.webp` on a healthy environment | F16 |
| P3 | Re-run Joy's lane with selectors checked against the accessibility tree | F21, and Joy's evidence for F06 and F11 |
| P4 | Triage reads the domain-participation path: is a join stored and only forgotten by the UI? | F05's impact (2 or 3) |
| P5 | Product owner confirms whether moving to Consent after one advice entry, before the deadline, is the intended default | Whether F01 is about policy, explanation, or both |

### Sessions by segment

| Segment | Sessions | Each session must test | Kill criteria (the hypothesis is dead if ...) |
|---|---|---|---|
| Self-sign-up newcomers arriving from an OmniOne invite link to a specific proposal | 5 | F09, F20: sign up from the link, then say which community you are in and whether you reached the proposal. F02, F11: "find out what this place is about and start the introduction" (think-aloud). F14: explain each dashboard tile and name your first action. F13: find a plan for your first week. | F09: at least 4 of 5 name OmniOne. F20: they land on the proposal. F02: at least 4 of 5 reach step 1 and can paraphrase ACT. F11: the ethos or orientation is opened within 2 minutes without help. F14: at least 4 of 5 choose a sensible first action and explain "Advice" correctly. F13: a plan is produced using the rail. |
| Steward-added newcomers (signing in for the first time) | 5 | F02 and F11, as above. F06, F05: join the food-growing group from /domains, reload, and say whether you are a member. F01, F10 (paired with an author): give your first advice, including one accidental empty submit, then say what stage the proposal is in and why. | F06: the right card is picked by its title within 30 s. F05: membership is shown after the reload. F10: all of them recover without help. F01: they explain the stage and the reason unprompted. |
| Members / authors (paired with an advisor) | 5 | F01, F04: open your proposal for advice, carry on with normal work while the advisor responds, and report when and how you found out. F07: change status and say what happened. F03, F12: message a named person, including one in another ecosystem, and send them a proposal link. F17: post an offer to a named group and say where it appears. | F01, F04: the advice and the stage change are found within a minute without prompting, or reliably through the decision queue. F03: most start a conversation from the page within 2 minutes. F12: the recipient reaches the proposal in one activation. F17: the offer lands on the right group and can be found. |
| Stewards (paired with a newcomer) | 5 | F04, F05: a newcomer joins your domain and messages you during the session. How do you find out, and can you see them as a participant? F06: create a domain and find it again by name. F03: start a conversation with the newcomer. A 3-day diary study is optional, to count missed arrivals. | F04: every arrival is noticed without scanning /members. F05: the steward sees the new participant. F06: the domain can be named and found by that name. |
| Screen-reader users (NVDA and VoiceOver, about half each) | 5 | F08: every control on /messaging, /me and /proposals/[id] can be named and operated. F07: change status and submit empty, then real, advice, and say what was announced and where focus went. F19: change status and choose a domain with a standard keyboard. F21: find the advice box by role. F02, F06: start the journey and find the food group. | F08: no unnamed control is met. F07: results are reported without sighted help and focus lands sensibly. F19: Enter and arrow keys behave in the standard way and the value is announced. F21: the advice box is reachable by name. |
| Keyboard-only users (sighted) | 5 | F03: start a conversation with the "+". F13: Start Journey with the Guide rail open. F19: the Change Status and Domain selects. F07: where focus goes after each async action. | F03: "+" works with Enter or Space. F13: the rail never hides the focused control. F19: there are no silent value changes. |
| Low-literacy newcomers | 5 | F06: "join the food-growing group" without being prompted to read descriptions. F11: 5-second label test ("where would you tap to learn what this place is about?"). F02: press Begin and say what the message means. F10, F01: give advice and say what happens next. | F06: at least 4 of 5 pick the right card from its title alone. F11: most choose the right target. F02: they describe a retry path rather than "I'm done" or "it's broken". |
| Mobile, 390px | 5 | F09, F20: the invite-link journey on a phone. F01: open a proposal from the dashboard queue (Sol's abandonment, to rule the locator in or out). F05: join and reload. | The proposal opens from the queue at 390px. The kill criteria for F09, F20 and F05 are as above. |
| Low vision, 200% zoom and 320px reflow | 5 | F18: member journeys at 200% zoom and at 320px. F15: contrast on /proposals, and a dashboard tab-through. F13: whether the rail obscures content when zoomed. | No content or functions lost on reflow. Flagged contrast is at least 4.5:1 or the elements are decorative. |
| Slow network (Rafi's segment, never run) | 5 | F18: send a message, submit advice and join, all on a throttled connection. Watch for duplicate submits caused by missing feedback (F07, F05). | No timeout loses a message, and no duplicate submit occurs. |
| German-speaking members (de-DE) | 5 | Locale quality of status labels, dates and the advice form. F01: the stage-change explanation, read in German. | Labels are localised and the stage change is understood. |

That makes 55 sessions in total. If the budget is tighter, run the first five segments first (25 sessions). They cover every finding in the critical band.

## 9 Limits of this evidence

Agents are not users. They are patient and literate, they are never distracted, they read every word on the page, and some of them could read source or call the API. Several workarounds in this pass did exactly that.

| Bias or limit | Effect | Findings affected |
|---|---|---|
| Agents read descriptions and purpose text in full | Understates label problems; real scanning users fail faster | F06, F11, F14 (likely worse for people) |
| Agents route around silent failures; there is no error, so there is no friction | The worst service failures score low on the heatmap | F01, F04, F05 (understated by the heatmap) |
| Agents can use the API or typed URLs | Turns blocking failures into "workarounds" | F03, F20 (for real users they are probably abandonments) |
| Agents never get bored or confused | Silent no-ops cost an agent one retry; a person may give up | F07, F10 |
| Lane locators were wrong in some runs (Priya's dossier, Joy's whole lane, possibly Sol's dashboard queue and sign-in) | Inflates abandonments on /discover and /dashboard | F11, F21, part of F14 and F20 |
| A harness check passed an empty bell panel | One false "bell works" signal | F04 (overruled by the code-read) |
| Many runs are fragments of one journey (Kofi has 18 runs, Ines 17 and Sol 18, 11 of them explore runs), and fragments default to PARTIAL | Overstates frequency counts, and 59 PARTIAL outcomes are not 59 failures | All frequency scores; treat counts as journeys, not runs |
| Each gold task ran once, and the success checks are shallow | Gold success says nothing about F01, F02 or F09 | Section 7 |
| Rafi (slow network) never ran; only Amara used 200% zoom; no reflow at 320px | Status for WCAG 1.4.4, 1.4.10 and 2.2.1 is unknown, not passing | F18 |
| The Joy-to-Rafi hand-off was never tested | The newcomer-to-newcomer loop is unexamined | F03, F12 |
| 23 of 76 routes were visited | Governance, agreements, conflicts, emergency and exit were not assessed (out of scope this pass) | — |
| Only 4 of 7 lenses ran (no domain expert, frontline worker or trust/behavioural lens) | Policy questions (F01's deadline), re-entry and recovery costs, and trust cues (agent tokens) are not scored | "Evidence no lens claimed" table |
| Lenses viewed only a few screenshots and opened no `trace.zip` files | Some evidence relies on lane notes rather than on visual confirmation | F05, F12, F17 |
| The test environment serves no ecosystem media | Error-weighted friction is inflated on /dashboard, /discover and / | F16, heatmap ranking |
