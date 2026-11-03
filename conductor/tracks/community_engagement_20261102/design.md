---
type: Product Design
title: Community life and return journeys
status: implemented-awaiting-release
---
# Design position
NEOS helps people find communities, participate in meaningful work, and remain connected without tracking every procedure themselves. Engagement comes from actual responses, invitations and outcomes. Preserve member agency: explicit follows, understandable frequency, quiet hours and easy withdrawal.

# Entry and joining
Anonymous home and /communities:
- H1 Find a community.
- One sentence: Discover people and projects you can contribute to.
- Search by name/purpose, public community cards with purpose/location/tags, View community CTA.
- Empty: No public communities match this search; Clear search. Never invent people/activity.
Public detail:
- Name/purpose -> What happens when you join -> Join this community. Opportunity titles remain behind sign-in under existing publication policy; anonymous previews explain that boundary.
- Sign-in returns to the specific existing ethos/join destination. Existing quizzes/agreement steps retain names and progress.
- A preview never implies membership. Authenticated members see Open community; pending members see Continue joining.

# Everyday home
Keep existing /dashboard and its current ownership/scope.
1. Your communities: membership cards with Open community; Find another community.
2. Waiting for you: existing next-step cards and actual authorized action/deadline semantics. Initially show five with the full count, explicit expansion/collapse and preserved ordering, so a long queue cannot bury community activity.
3. Recent community activity: source-linked chronological items with understandable event labels and View all updates.
4. Existing operational metrics remain lower.
Each activity item says what happened, where and when. No invented engagement counts, popularity ranking or required endless scroll.

# Personal updates
/updates:
- H1 Your updates; count of currently visible unread items.
- All / Unread, bounded Load more, mark individual read/unread.
- Each item: community, event label, time, current safe title, Open action, Why this reached you and follow/mute affordance.
- Message entries are personal and generic; the actual conversation owns private text.
- Empty unread: You're caught up. Find a community / Manage subscriptions.
- Withdrawn access: omit source details; navigation fallback explains content is unavailable without reproducing cached private text.
- Reading an update never marks a task completed.

# Subscription settings
/settings/notifications, accessible from /me, header updates, home and community cards.
Section 1: delivery channels and exact capability states.
- In-app: ready, built into Your updates.
- Email: pending setup until sender/key/webhook/globalactivation; owner then adds and verifies their own address.
- Push: explain browser-specific permission, explicit Enable on this device, no prompt on page load.
- SMS: optional pending setup or verified number; never infer opt-in from profile phone.
Section 2: what to follow.
- Scope type + authorized searchable named resource; category checkboxes; channel checkboxes; immediate/daily/weekly; save.
- Ecosystem follow is broad. Narrow records override cadence; explicit mute wins over broad follows.
- Muted row explains effect and supports Unmute. Delete follow is different from mute.
Section 3: pacing.
- Timezone, quiet interval, pause until, direct message in-app preference.
- Explain daily/weekly delivery cadence in local time and retain changes without any push device.
At every boundary show pending/error state honestly; failed saves keep user input and never display a success toast.

# Interaction and accessibility
Reuse existing Radix/shadcn controls, QueryState, React Hook Form/Zod and route shell. Every input has a visible associated label. Visible focus and44px interaction targets; mobile single-column layout without horizontal overflow. Accessible live save/error status. Date display uses Intl and explicit timezone. Load more is a button; no scroll interception.
TanStack Query keys include actual User.id and relevant scope. Auth changes clear private cached responses and browser registration ownership. Public list caches contain only public DTOs.
External-link notification click uses existing internal-path validation principles; service-worker equivalent rejects protocol-relative/cross-origin/unsafe paths.

# Architecture/package choices
- Database transactional outbox: source mutation and event commit together; send after commit through bounded worker.
- Ports/adapters: provider transport injected for tests; one selected email provider, no hidden fallback.
- Source adapters: canonical policies resolve current visibility before feed/read/send; event metadata stores identifiers, not private excerpts.
- Durable state machine: delivered != accepted, expired started attempts != unsent; claim fencing and immutable manifests.
- Granular policy resolution: mute/suppression dominate; per-channel consumption; actor-owned preferences independent of device.
- Progressive disclosure: ordinary members see community and participation concepts; provider/queue details live in operational runbook/admin readiness only.
- Existing React18/wouter3/TanStackQuery5, RHF7/Zod3 and Radix. No new feed SDK/state store.
- Existing Sanic25/SQLAlchemy2/Postgres16/Jinja2; add runtime httpx, svix, pywebpush and Twilio request validation as documented in provider-research.md.
- SQLAlchemy skip_locked semantics verified in official2.0 docs: https://docs.sqlalchemy.org/en/20/core/selectable.html. Raw captured Context7 response: .omc/research/engagement-sqlalchemy-docs-20261102.json.

# Owner credential gate
No external calls made to real recipients during implementation/QA. Email/push/SMS remain separately disabled; in-app can be deployed independently. Final handoff names exact configuration, sender validation, webhook setup, destination verification and one approved test procedure per channel. Provider accepted messages will only be claimed when real activation/test is actually executed later.
