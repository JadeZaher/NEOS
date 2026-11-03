---
type: Feature Specification
title: Community entry, everyday activity, and consented re-engagement
status: released-at-provider-activation-gate
---
# Intent
Help a person discover a community, preview its actual life, join through its existing configured requirements, contribute, receive a response, and return. Reuse the existing Dashboard and personal next-steps queue. Build community activity and personal updates without introducing generic social posting, engagement scoring, reactions, or an algorithmic feed.

The owner authorized design/specification, two advocate/adversary review cycles, revised plans, parallel implementation and verification. Stop external provider activation at credentials/sender identity: everything else should be concretely ready. No live email/SMS/push sends or bulk subscription grants are authorized by this track. Existing deployment authority permits a verified release with external delivery disabled. Preserve previous configured-only quizzes, exactly two Ahmed Zaher NodeAdmins, public support attribution, and non-Anthropic agents.

# User experience
1. Public /communities offers searchable public-active community cards and a detail preview. Explicit public DTOs include name, purpose and tags/location. Opportunity titles retain their existing signed-in visibility policy; anonymous previews invite sign-in. Never expose private proposals, membership lists, matching profiles, messages, or private organizations.
2. A single primary CTA leads to the existing /ethos/:id join flow. Preserve intended destination through sign-in and configured consent/quiz gates. Following never joins; joining never enables external messages.
3. Home retains /dashboard and existing next-steps semantics, moving Your communities / Waiting for you / Recent updates above administrative summaries.
4. /updates is an owner-owned durable unread/all inbox with source links, read controls, and a readable Why you received this explanation. Read state is independent of governance action completion.
5. /settings/notifications is the canonical settings destination, also linked from /me, the bell, Home and community/detail cards. Broad follows select an ecosystem; narrow follows select supported subgroups or records using recognizable names. Categories, channels and cadence remain independent.
6. Honest loading/error/empty/pending-provider states; no fake community activity or false successful delivery. Accessible keyboard controls, semantic contrast, 44px targets, responsive reflow and no trapped navigation.
7. Service worker registered only for explicit push enrollment; runtime capabilities supply VAPID public key. Notification clicks allow only internal same-origin paths. Shared browser account changes must not transfer registrations or private cached payloads.

# Scope and semantics
- Activity sources: proposal/agreement lifecycle transitions; public shares/needs publication/updates/responses; collaboration changes; direct conversation messages. Central service hooks cover REST and agent paths atomically. No old-event notification backfill.
- Scope enum: ecosystem, domain, team, proposal, agreement, collaboration, share, conversation. Support only sources with a real ownership/visibility resolver. No arbitrary topic/person IDs.
- Source content and permissions are rechecked for activity reads, inbox serialization and delivery. A follow never grants source visibility. Revoked/deleted/private resources yield no stale title/body leakage.
- Direct messages generate recipient-only inbox entries; never community feed entries. Generic external summaries omit message bodies, private titles, identity-sensitive context and attachment data.
- New external channel consent defaults off; existing legacy push category preferences do not count as email/SMS consent. Preferences persist independently of devices and selected ecosystem.
- Cadence: immediate, daily, weekly. Broad subscriptions default daily for external channels. Overlapping subscriptions deduplicate; select the fastest expressly requested cadence for a given recipient/event/channel. Pause and quiet hours are global per user/channel, evaluated with IANA timezone and DST-safe next due time.
- In-app default activity is available to active members; optional follows personalize inbox. Direct replies/messages can generate in-app inbox by default. Per-scope mute overrides implicit in-app inclusion.
- Email/phone destinations require ownership verification; never trust profile phone or OAuth metadata. Verification expires, is one-use, is rate limited and is invalidated when destination changes. Disabled providers cannot send verification or falsely verify.
- Email one-click unsubscribe is signed, recipient-bound and separate from login/session credentials. GET shows a confirmation page; POST applies channel opt-out. Unsubscribe remains usable without login. Invalid signatures and replay must be safe.
- Suppression from hard bounce/complaint/STOP overrides preference changes and retry. Webhooks verify raw-body signatures and deduplicate receipts.
- Resend email, native Web Push, optional Twilio SMS. Voice calls are deferred. No external marketing/tracking pixel service. External global switch defaults false, and channels separately require keys, verified sender/contact and consent.

# Delivery integrity
Persist domain event in the same transaction as action; rollback means no event. Fanout derives eligible recipients and persists unique inbox/delivery keys. Database-backed outbox, bounded worker batches, leased claims with PostgreSQL SKIP LOCKED, explicit retry/dead/ambiguous states, bounded backoff and current-consent checks. Exactly-once delivery cannot be claimed across arbitrary provider failures: stable provider idempotency keys plus local state avoid normal duplicates; uncertain SMS/push outcomes must not be blindly retried. Resend idempotency retention is 24h; stop automatic ambiguous retries beyond that window.

No provider request runs inside the originating governance transaction. Payloads are rendered from current authorized records. Digest identity is recipient/channel/device/window plus a numbered overflow part, capped at50 events. A unique consumption row reserves each event/channel/device to a durable delivery at scheduling time; provider acceptance and delivery remain separate states. Only eligible new unread/unreserved items enter a digest, and retries reuse their existing reservation. Do not flood historical pending work when a channel is enabled. A digest uses a privacy-minimal summary/link; users visit authenticated Updates for details.

# Acceptance
- Public discovery and preview -> signed-in target -> actual configured gate -> Home -> first action link.
- Cross-user/scope visibility, withdrawn membership and source visibility changes respected; direct messages absent from community feed/public DTO.
- Preferences save with zero browser endpoints; broad/narrow create/edit/mute/delete and overlapping dedup; owner-only inbox read state.
- No credentials => capabilities pending, no network send, no fabricated delivery/verification; in-app experience fully works.
- Commit/rollback producer tests; duplicate event idempotency; concurrent fanout/worker claims; lease recovery; suppression/revocation before send.
- Fake transports exercise email/SMS/push success/timeout/429/hard failure, webhook signatures/replay, verification expiry/attempt limit, unsubscribe, stale endpoint removal.
- Quiet hours crossing midnight, DST, pause, daily/weekly windows and no historical activation flood.
- One integrated test/typecheck/build sweep after all fixes, then justified affected checks only. Real PostgreSQL race checks and actual browser flows against isolated QA data; no external sends.
- Independent final evidence review. Release with outbound disabled if safe; handoff exact missing variables, domain/DNS/webhook steps and an explicit first-test procedure.

# Non-goals and deferred owner decisions
No generic posts/reactions, ranking engine, native app, voice calls, contacts import or auto-subscription. Topic/person follows and agent-driven notification preference tools require separate authorization contracts; current settings UI is fully usable without them. Provider account purchase, sender-domain choice, keys, production outbound activation and first real test recipient remain owner steps.
