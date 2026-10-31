# Member Decisions — user-owned decision substrate (spec v1, 2026-07-28)

Directive (user, verbatim essence): "Decisions can be made about agreements,
proposals, shares and needs — it's a common substrate and decisions are
something an individual user takes ownership of. An active agreement can have
a user decision linked to it if the user has accepted it; a proposal once
accepted can have decisions attached; a share can be used with a decision; a
need can be served with a decision. Decisions are also tasks/todos for users
where users can follow up and set their decision state. A user must only be
able to edit their own decisions. A member can only edit their own profile.
Also: no way to join a domain in QA — make it possible."

This is DISTINCT from DecisionRecord (the ecosystem artifact ledger minted by
completed ACT processes). MemberDecision = one member's personal decision
about a subject, doubling as a follow-up task.

## Backend lane (neos-operating-system/agent)

### Model: `src/neos_agent/db/models/memberdecision.py`

```python
class MemberDecision(TimestampMixin, Base):
    __tablename__ = "member_decisions"
    __table_args__ = (
        Index("ix_member_decisions_member_id", "member_id"),
        Index("ix_member_decisions_subject", "subject_type", "subject_id"),
    )
    id: uuid PK (GUID, default uuid4)
    ecosystem_id: GUID FK ecosystems.id, nullable=False
    member_id: GUID FK members.id, nullable=False        # the OWNER
    subject_type: String(20), nullable=False             # agreement | proposal | share | need
    subject_id: GUID, nullable=False                     # polymorphic, validated in API (no DB FK)
    decision: String(500), nullable=False                # what they decided ("I accept...", "I'll serve...")
    state: String(20), nullable=False, default="intended" # intended | in_progress | done | follow_up | dropped
    notes: Text, nullable=True
```

Register in `db/models/__init__.py` (alphabetical near Member).

### Migration: alembic revision `m5f9c3e7a2b4`, down_revision `l4e8b2d6f3a1`

Conventions: `sa.Uuid()`, FK constraints named implicitly OK, create both
indexes. Apply with `agent/.venv/bin/python -m alembic upgrade head`
(env.py reads DATABASE_URL from agent/.env → Railway dev DB).

### API: `src/neos_agent/api/my_decisions.py`, blueprint `my_decisions_api_bp`, prefix `/api/v1/my-decisions`

Register in `main.py` next to agent_tokens_api_bp (import + app.blueprint).

Auth: `require_auth` from `.helpers`; resolve the caller's Member rows via
`select(Member).where(Member.user_id == request.ctx.user.id)` — a user has
ONE Member row per ecosystem (see api/AGENTS.md identity model).

Endpoints:
- `GET /` — the caller's decisions across their ecosystems. Query params:
  `state`, `subject_type`, `ecosystem_id` (must be one of theirs). Newest first.
  Item: {id, ecosystem_id, subject_type, subject_id, decision, state, notes,
  created_at, updated_at, subject_title} — subject_title resolved by a batch
  lookup per subject_type (Agreement.title / Proposal.title / SharesNeeds.title).
- `POST /` — body {subject_type, subject_id, decision (3-500 chars), notes?}.
  Subject validation + decision-able state:
    agreement: exists, status == "active", caller is a Member of its ecosystem
    proposal:  exists, status == "ratified", caller is a Member of its ecosystem
    share|need: SharesNeeds row exists, type matches subject_type,
               status == "active", caller is a Member of its ecosystem
  ecosystem_id = the subject's ecosystem; member_id = the caller's Member row
  IN THAT ECOSYSTEM. 409 if the caller already has a non-dropped decision on
  the same (subject_type, subject_id) — tell them to edit the existing one.
  404 for unknown subjects, 403 for non-members, 400 for wrong state.
- `GET /<id>` — own only; 404 if not found OR not owned (don't leak existence).
- `PUT /<id>` — own only. Body {decision?, state?, notes?}; state must be one
  of the five values. Sets updated_at via onupdate.
- `DELETE /<id>` — own only, hard delete.

### Profile-edit ownership audit

`PUT /api/v1/profiles/me` is the own-profile path (keep). Grep
`src/neos_agent/api/profiles.py` and `api/members.py` for any OTHER endpoint
that writes profile content (bio, links, visibility, display fields) for a
member that is NOT the caller. If found, gate it: only the owning member may
edit profile content (role-tier management endpoints like PUT
/members/:id/role are NOT profile content — leave those). Report what you
found in the lane summary; change only true violations.

### Seed additions (scripts/seed_act_lifecycle.py)

Add 1-2 MemberDecision rows per ecosystem owned by the named seed members:
one on an active agreement (state in_progress), one on a ratified proposal
(state intended), one serving a need if a shares_needs row exists for that
ecosystem (create one if the seed has none — type "need", status "active").
Deterministic uuid5 ids under the "neos.seed.act" namespace like the rest of
the script; include them in --purge. Verify: run the seed, then GET / as a
seed member via the Sanic test client and confirm the rows surface.

### Verify (backend lane)

- `agent/.venv/bin/python -m py_compile` on every touched file.
- Migration applies cleanly (`alembic upgrade head`, `alembic current`).
- In-process smoke via `app.test_client` with a real session cookie (mint one
  with `neos_agent.auth.middleware.make_session_cookie` + an unexpired
  auth_sessions row): POST creates on an active agreement; duplicate POST 409;
  PUT by owner works; PUT/GET/DELETE of another user's decision 404s; POST on
  a draft agreement 400s; domain participation endpoint still 200s.
- Do NOT commit — leave changes in the working tree.

## Frontend lane (charting-the-course/client)

Contract: the API above. Base styles: brutalist (border-2 border-strong-border,
rounded-none), shadcn components in `src/components/ui`, TanStack Query hooks
in `src/hooks/use-governance.ts`, api functions in `src/lib/api-client.ts`,
types in `src/types/api.ts`.

1. `types/api.ts`: `MemberDecision` interface (fields per contract),
   `MemberDecisionState = 'intended'|'in_progress'|'done'|'follow_up'|'dropped'`.
2. `api-client.ts`: fetchMyDecisions(params?), createMyDecision(data),
   updateMyDecision(id, data), deleteMyDecision(id).
3. `hooks/use-governance.ts`: useMyDecisions(params?), useCreateMyDecision,
   useUpdateMyDecision, useDeleteMyDecision (invalidate ['my-decisions']).
4. `components/governance/RecordDecisionDialog.tsx`: reusable dialog —
   props {subjectType, subjectId, subjectTitle, onRecorded}. Text input for
   the decision (placeholder per subject type: agreement "I accept this
   agreement and will uphold it", proposal "I accept this decision and will
   act on it", share "I'll use this share", need "I'll serve this need"),
   optional notes textarea, submit → createMyDecision. On 409 (already have
   one) surface the message honestly.
5. Wire actions:
   - `pages/governance/agreements/AgreementDetail.tsx`: for status "active"
     agreements, a "Record your decision" button (rail, near ActGatesPanel).
   - `pages/governance/proposals/ProposalDetail.tsx`: for status "ratified".
   - Shares/needs surface (find the live list — grep App.tsx for shares-needs
     route; likely under discover or ecosystem pages): "Use" on shares,
     "Serve" on needs (both open the dialog with the right subjectType).
   - Show the caller's existing decision (if any) as a small badge+state
     under the button by fetching useMyDecisions({subject_type, subject_id})
     — hook must accept those params.
6. `pages/me/MePage.tsx`: new tab "My decisions" →
   `pages/settings/MyDecisions.tsx`: task-list of the caller's decisions
   grouped by state (intended / in_progress / follow_up / done / dropped),
   each row: subject type badge + subject_title + decision text + state
   Select to change state + notes edit (inline, save on blur) + delete.
   Own-decisions only by construction (API enforces).
7. Domain join: find the live domain detail page (grep App.tsx for domains
   route). Add a "Join this domain" button calling the EXISTING endpoint
   `POST /api/v1/domains/<id>/participation` (add api-client fn
   joinDomainParticipation(domainId) + hook). Show joined state if the
   detail payload already exposes the caller's participation; otherwise just
   toast on success and refetch.
8. Verify: `npx tsc --noEmit` and `npm run build` in charting-the-course.
   Do NOT commit — leave changes in the working tree.

## Pitfalls (both lanes)

- One Member row PER ecosystem: always resolve the caller's row in the
  SUBJECT's ecosystem, never `limit(1)` across ecosystems.
- Detail reads elsewhere use membership scope; this API is inherently
  own-rows-only — 404 (not 403) for other people's decisions.
- Backend: governance tables use naive DateTime — never write tz-aware
  datetimes into them (see api/AGENTS.md).
- Backend: parent+child inserts in one flush can FK-violate (broken
  table-level sort from quiz_assignments) — flush the parent first.
- Frontend: never fabricate — empty states say "No decisions recorded yet".
