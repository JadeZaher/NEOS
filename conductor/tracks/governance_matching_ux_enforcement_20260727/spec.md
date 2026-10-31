# Governance Matching UX Enforcement — 2026-07-27

**Status:** Phase 1 (collapse) + hostile-review sweep COMPLETE. Phase 2 (hardening) PENDING.
**Repo:** charting-the-course (client). Commits on `main`, unpushed as of 2026-07-27 — user pushes from Windows (no GitHub creds in WSL).

## Governing directives (CURRENT — override older contradictory direction)

1. **Two-mode IA:** EXPLORE (cross-ecosystem public discovery: /discover, /ethos/*, /orientation/*) vs ECOSYSTEM (one current ecosystem at a time). Consolidation happens WITHIN one ecosystem; no merged cross-ecosystem member feed. Mode is derived from route, always explicit.
2. **Object model:** agreements are first-class (standalone-public / collaboration requiring cross-ecosystem admin consent before activation / membership-required with entry quizzes). Domains are strictly single-parent children of one ecosystem; federation happens by assigning domains into collaboration agreements. Proposals attach ONLY to ecosystem or domain and produce agreements, shares, needs. Decisions are immutable TRANSFORMATION RECEIPTS (proposal resolution → outcomes; member fulfillment → receipt) — a read ledger, never CRUD.
3. **Five linear workflows:** join/orientation (fit-check is an optional pre-orientation stage, not a separate workflow), proposal→decision, exit, correction/dispute. Everything else is canopy; the canopy's default lens is "needs my input."
4. **Matching:** fit estimate renders ONLY in the dossier, always with coverage + versions + reasons; suppressed when under-covered or uncalculated (foundation step: "not yet calculated"). Structural staleness (overdue review) outranks personalization. One member matching profile with per-ecosystem disclosure selections. High fit never creates membership, role, authority, or visibility.
5. **Roles:** per-ecosystem tiers user→mod→admin→owner (Discord-style) gate views; complexity hides behind tier/process instead of deletion. Consent is granular (access / directory visibility / direct contact / matching data) and fail-closed.
6. **Backend rule:** match backend reality, then extend backend to goal. Never fabricate governance facts — render "Governance profile incomplete" placeholders instead.
7. **Binding acceptance criteria:** GOVERNANCE-ECOSYSTEM-MATCHING-UX-GUIDE.md + GOVERNANCE-ECOSYSTEM-MATCHING-QA-GUIDE.md (repo root).

### Overrides of older direction

- `memory_precedent_ui_20260427` decision-records UI → decisions become the receipts ledger (H1).
- Any alignment-score UI (EthosCard/EthosDetail) → fit-estimate explanation contract (H3); raw % suppressed at foundation step.
- Ecosystem "Join" semantics → "Request to begin orientation"; lifecycle prospective→onboarding→active, ceremony-gated (H2 for backend).
- Session work committed directly on `main` with conventional-commit messages (refactor/fix/docs), not `conductor(<scope>)` feature branches — current directive, user-led.
- Commit cadence per-lane (not per-phase) — subagent-driven-development workflow governs this stream.
- **2026-07-28 SUPERSEDING DIRECTIVE (git):** agent no longer commits in NEOS repos. Work lands on `main` in the working tree UNCOMMITTED; the user reviews diffs and commits personally. Subagent lanes are deprecated on this FS (repeated 600s timeouts) — direct orchestrator execution is the default.
- **LLM status (2026-07-28, live-verified):** backend AI pipeline WORKS (provider.py acompletion via litellm/OpenRouter, key valid via OPENROUTER_KEY alias, model openrouter/qwen/qwen3-30b-a3b-instruct-2507 — live ping returned 'ok'). User-visible inactivity = client-side intentional stub: lib/omnibot.ts is_stub because the 29-tool chat agent lacks a tool-free session-segregated mode (AGENTS.md). Activation work item: backend session_type/tool-free mode → then un-stub client OmniBot/AIConversationStep.

## Shipped

| Commit | Lane | Content |
| --- | --- | --- |
| 36c02db | S1 | Two-mode shell IA, wave-1 route redirects, single-current-ecosystem default |
| 8ec3192 | S1-fix | FloatingComms FAB hidden on /messaging |
| 77120cb | S2 | Solutions catalogue merged into /discover (4th tab) |
| 9733fcf | S3 | /me composes Profile + Notifications + Quiz history; legacy paths redirect |
| 95b1b1f | S4 | /ecosystems/:id governance stamp (derived, never fabricated), Domains card, Open Proposals card |
| 12cb736 | SWEEP-1 | Public dossier before consent (gate only members directory), ConsentGate fail-closed + retry, raw alignment % → "not yet calculated" |
| 387c233 | SWEEP-2 | Ceremony positions displayed distinctly + consent-only counting, reflection-window render from server fields, "Request to begin orientation" language |
| 8198b4f | H5 | docs/H5-SCHEMA-GAP-REPORT.md |
| ee25d96 | D-lane | Decisions reframed as interactive receipts: plain-language cards (Decision/Reasoning/Additional context), Linked-context card (domain resolution, structured related_records, no JSON dumps), working domain select filter, hidden fields surfaced (recorder, review_date, superseded_by, verification) |
| 76190ac | F-lane | 8 stale links re-pointed to canonical routes; 6 verified-orphan pages deleted (Discover, EthosDiscover, JourneyMapList/Editor, CommsPage, ChatPanel) |
| de58b98 | E-lane | MemberDetail: Ecosystems + Domains Stewarded + Activity cards; MemberList: onboarding badge; useDomains false-gating extension |
| a8d409f | E-fix | Dedupe created-at renders across member surfaces |
| 7b7bfa3 | G-lane | Un-buried member-right safety surfaces: Conflicts + Exit always visible; Emergency/Safeguards/Compliance via platform perms OR any ecosystem membership |
| e1aacff (neos repo) | H4-lite backend | members.role tier column (migration i4b7c2e9f1a3), MemberRole schemas + RoleUpdateRequest, require_ecosystem_role helper, PUT /members/:id/role (owner any / admin user-mod / self-demotion / profile-admin bootstrap), enforcement swaps (update self-or-mod, status mod, resend-invite admin-OR-role), 14 tests — 39/39 green |
| 486ebfb | H4-lite types | api.ts role contract hand-patched (generator output has drifted from committed api.ts — reconciliation owed; regen broke 2 client files and dropped interfaces) |
| 9e4735f | SAFE (self-executed) | Compliance: api-client dedupe, generate errors visible on empty path, retry, always-rendered "What a compliance audit needs" guidance card. Safeguards: fabricated 0/100 health score replaced with honest no-data state, GHI section framed as standard thresholds, audit drill-in error gains retry + ecosystem-scope hint |

**Operational notes (2026-07-28):**
- `alembic upgrade head` required per environment to apply members.role (i4b7c2e9f1a3).
- api.ts generator (neos-operating-system/scripts/generate_types.py) drift: full regen drops interfaces the client uses (OAuthProvider, MemberSummary, others) and changed shapes (2 tsc breaks). Reconcile generator vs committed contract before relying on regen — candidate track.
- Compliance "timeout" root cause: POST /generate runs synchronous AI synthesis server-side; the empty-state branch never displayed the failure. Client now surfaces errors + retry; server-side async generation remains the proper fix (backend backlog).
- Audit drill-in statically consistent (routes/links/serializers/types all match); hardened client error path; live verification with real data still owed.
- Subagent lanes on drvfs timed out 4x on multi-file implementation; H4-lite + SAFE were completed by direct orchestrator execution (execute_code loop) — prefer self-execution for multi-file work on this FS.
- **Audit drill-in root cause (2026-07-28, live-repro URL):** DB stores indicator_scores/triggered_safeguards/structured_recommendations as JSON DICTs; AuditDetail schema demands list[...] → pydantic ValidationError → 500 on GET /safeguards/audits/:id while list endpoints (which never touch those fields) stayed green. FIX (uncommitted in neos tree): _scores_to_list/_str_list normalizers in api/safeguards.py coerce dict→list (indicator_id injected from key, "items"-wrapped dicts unwrapped, unconvertible → None instead of 500). Verified via repro harness (dict/list/None shapes) + py_compile; no existing audit tests exist (375 deselected). Deploy = user commit/push; no migration needed.

## Backend map (neos-operating-system/agent — scout 2026-07-28)

Stack: Sanic + SQLAlchemy async + Alembic + pytest. JSON API = api/ blueprints (/api/v1); views/ = legacy Jinja. Client types/api.ts is "auto-generated from Pydantic models" but the GENERATOR SCRIPT IS UNLOCATED — must be found or hand-patched before any contract change.

H4-lite (role tiers) anchors: Member model db/models/member.py:34-62 (NO role column; uq (ecosystem_id,user_id) :38); Ecosystem has NO created_by (ecosystem.py:41-59) — owner bootstrap strategy TBD; permission primitive today = require_admin via Member.profile persona (api/helpers.py:23-30 — WRONG AXIS, do not build on); ctx.member is an ARBITRARY single row (main.py:320-323) — role checks must re-query per (user_id, ecosystem_id); serializers api/members.py:69-81/:97-120/:123-159 + schemas api/schemas/members.py; 9-step ordered diff plan in session log.

H2 (ceremony contracts) anchors: join = ecosystems.py:343-408 (409 on re-join, creates "pending_consent" + NO MemberOnboarding row); ceremony api/onboarding.py:142/:189 (consent bool-collapse :241-248, sets only consent_date); cooling_off_start/end are Date not DateTime (memberonboarding.py:44-45) and never set in JSON API; NO 48h gate anywhere; withdrawal EXISTS as DELETE /agreements/<id>/consent (agreements.py:744-803, sets withdrawn_at unconditionally — no 7-day window); status vocabulary fragmented: "prospective" (member.py:47) vs "pending_consent" (ecosystems.py:380, agreements.py:731/799) vs "active" (members.py:432) — unify all sites together; 7-step ordered diff plan in session log.

H5 corrections (scout-verified): withdrawal endpoint exists (not greenfield); unique constraint is (ecosystem_id,user_id); cooling_off needs a TYPE migration; no server-side is_admin exists in this backend; owner bootstrap undefined (no ecosystems.created_by).

**Directive refinements (2026-07-27, lead UX — current, override prior phrasing):**
- Decisions serve as **receipts of completed governed action in response to shares/needs/proposals**. Their route must be interactive and contextualize each receipt against the agreement, share, need, and domain it is tied to. Sterile precedent-jargon presentation and dead controls are defects. (Client framing landed ee25d96; typed receipt linkage pending H1/backend.)
- Member management is a **smart per-ecosystem surface**: ecosystems held, domains stewarded, recent activity, and per-ecosystem role (roles pending H4 — honest placeholder, never fabricated).

**Verification:** tsc zero errors at every lane and on the final tree; vite build green; per-lane spec review PASS (S1–S4 consolidated); quality APPROVED. S4 first attempt timed out (slow-FS over-reading) — respawn with orchestrator-pre-digested patch spec landed in half the budget. Two sweep lanes raced the git index in parallel; both recovered; history verified clean and linear post-hoc. Lesson: serialize commit steps for parallel lanes sharing a repo.

## Findings register (hostile review 2026-07-27)

**BLOCKERs:**
1. Whole dossier gated behind participation consent → FIXED 12cb736 (public sections hoisted; only members directory gated).
2. ConsentGate bundled consents + failed open on error, no retry → FIXED (fail-closed + retry); granular scopes pending backend → H4.
3. Ceremony `stand_aside` persisted/displayed as consent → display/counting FIXED 387c233; lifecycle enforcement (MATCH-AUTH-06) → backend.
4. No 48h reflection / 7-day withdrawal → window render FIXED (server fields exist); server-time enforcement + withdrawal endpoint → backend (MATCH-AUTH-11).
5. Join read as immediate membership → language FIXED; prospective-record creation + idempotency (MATCH-AUTH-03/08) → backend.

**HIGHs:** member directory data ships in API pre-consent (render-only protection) → H4/backend; raw alignment percentages → suppressed 12cb736; onboarding list had no lifecycle status → honest rename; status field missing → H5/backend.

**MEDs:** AlignedParticipants stub needs distinct contact-discovery consent → H3/H4; decisions payload is precedent-shaped, not receipts → H1.

**OPEN verification (R1 lane timed out — recheck):** quiz-browse stranding after /quizzes→/onboarding; DashboardHome widgets stranded by /governance→/ecosystems; single-ecosystem-default aggregate regressions; /map content loss accepted or restore as discover view.

## H5 schema gap report

`charting-the-course/docs/H5-SCHEMA-GAP-REPORT.md` — 21 contract items: 3 EXISTS, 9 PARTIAL, 9 MISSING; 14-step ordered migration plan (SQL sketches); 11 required backend behaviors (server-time 48h, idempotent join, 7-day withdrawal endpoint, role-tier enforcement distinct from is_admin, assessment immutability/staleness, activation gates, default-off directory consent, receipt issuance, full position enum). Structural note: governance contract currently exists only in client `types/api.ts` (generated from a separate Pydantic backend); `supabase/migrations` is a thin handoff layer.

## Next lanes (Phase 2 queue)

1. H1 proposal→receipt transformation + decisions ledger reshape (uses H5 C-items).
2. H2 onboarding ceremony backend contracts: server-time 48h, idempotent join creating prospective records, withdrawal endpoint, lifecycle status field (uses H5 B-items).
3. H3 fit-check surfaces + ecosystem matching profiles (largest net-new; dossier-only render, coverage math, 60% gate, four statuses).
4. H4 per-ecosystem role tiers + granular consent scopes + server-side member-data withholding (uses H5 D/A-items).
5. Wave-2 cleanup: 8 stale internal links, orphaned page files deletion (MapPage, QuizzesOnboardingHub, Discover.tsx, JourneyMap*, CommsPage, ChatPanel, DashboardHome).
6. R1-residual verification (open items above).

## Route guidance surface (2026-07-28)

New directive (current): every governed surface carries contextual governance instructions — floating, collapsible, per route.

- Shipped: `components/RouteGuidePanel.tsx` — right-edge vertical handle expands to an accordion panel of per-page steps; Escape closes; open state persists (localStorage `neos:route-guide-open`); mobile sheet layout; z-40 (FloatingComms overlays at z-50); renders nothing on unguided routes. Wired in `AppLayout`.
- Content: `lib/route-guides.ts` — longest-prefix route matcher + sections/steps for 18 clusters, every claim grounded in the binding rules (granular consent, distinct ceremony positions, 48h/7-day windows, receipts-not-CRUD, single-parent domains, fit = decision support, member rights never buried). Extend by adding a `guides` entry; longest prefix wins.
- Open: UX-owner content review; optional first-visit auto-open hint; short-viewport overlap with FloatingComms panel accepted (comms wins).

## Ceremony capability + consent 500 round (2026-07-28, evening)

User-reported: (1) consent POST to agreements 500s; (2) members discover steward-gating only by failing (status controls shown to everyone); (3) agreements/proposals layout hard to read; (4) wants color-highlighted next action per surface.

**Root causes found:**
- Consent 500: tz-aware `datetime.now(UTC)` written to `TIMESTAMP WITHOUT TIME ZONE` columns — asyncpg raises "can't subtract offset-naive and offset-aware". Hit consent attest, consent withdraw, AND steward ceremony record (status transitions would 500 for stewards too); same latent bug in discover.py collaboration approval. FIXED: naive-UTC `_utcnow()` (mirrors emergency.py pattern) in agreements.py x3 + discover.py x1. Verified by replaying the full write path against Railway DB (rollback).
- Steward wall: agreements status gate checked legacy persona `profile in {co_creator,builder}` (wrong axis — role tiers landed i4b7c2e9f1a3). Practically nobody passes it. FIXED: gate on `role in {admin,owner}` + active status.
- UX trap: no caller capability in contracts → UI showed "Change Status" + evidence form to everyone. FIXED: `caller_role` + `caller_can_conduct` added to agreement + proposal detail payloads (schema defaults keep contract total); client hides ceremony controls for non-conductors and shows an honest muted note (no disabled-fake controls).

**Client (charting-the-course):**
- AgreementDetail rewritten: next-action highlight (warning-toned "Your consent is needed" with inline attestation; success-toned recorded state; muted "consent opens at the consent ceremony" when pre-consent stage; steward "next ceremony" pointer); ceremony controls gated on caller_can_conduct; 2-col layout (main: text/consent/ceremonies; rail: details/ratification) — "intentional detail columns" per page-shell contract (no full-page max width).
- ProposalDetail: phase next-action banner (advice/consent/test → CTA deeplinks into now-controlled Tabs); status select gated on caller_can_conduct; details moved to rail.
- Agreement/Proposal lists: card hierarchy tightened (title+status row, chip row, single compact footer line) replacing stacked 2-col dl.
- types/api.ts: additive caller_role/caller_can_conduct on both detail contracts (hand-patched per generator-drift rule).

**Verify:** tsc 0 errors; vite build green; pytest test_agreement_consent 1 pass / 1 pre-existing fixture error (quizzes FK registration — confirmed identical on stashed tree); backend consent write path replayed green against Railway.

**OPEN decision points for UX owner:**
1. Proposals status transitions have NO steward gate in the backend (any ecosystem member can advance ACT phases) while agreements now require steward tier. Inconsistent either way — left permissive (matches current backend); gate proposals too if ceremonies are steward-only by policy.
2. List-level "needs my input" badges require per-item caller state in list payloads (consent standing per agreement, my position per proposal) — backend extension, watch N+1; not faked client-side.
3. Withdrawal window (7-day) + cooling-off still unenforced server-side (H2 track items; consent withdraw sets withdrawn_at unconditionally).
