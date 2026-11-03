---
type: API Contract
title: Frozen engagement interfaces for parallel implementation
version: 1
---
# Shared vocabulary
All new authenticated APIs use require_auth_user and actual User.id. Selected ecosystem cookies cannot change owner. Prefix /api/v1/engagement. Dates are UTC ISO8601 with Z; settings timezone is IANA. UUIDs are strings. Lists default 20, maximum 50; opaque cursor encodes (created_at,id) and is validated.
Channels: in_app, email, push, sms. Frequencies: immediate, daily, weekly.
Scopes: ecosystem, domain, team, proposal, agreement, collaboration, share, conversation.
Families: governance (proposal/agreement lifecycle), opportunities (share/need publication/update), collaboration, messages.
Message events are recipient-only. No message text or conversation title in generic event metadata.
Each scope advertised in GET /scope-options must have a current authorization resolver; scope-options searches authorized names and returns at most30 items. Domain/team scopes match only sources actually associated with that subgroup; never match the entire ecosystem.

# Models (core lane owns models/engagement.py and migration)
All UUID PKs use existing GUID; datetimes naive UTC at DB boundary to match project, serialize Z. Add indexes for queue states/due, events scope/date, inbox owner/read/date. Use unique constraints, not only application lookups.
- EngagementPreference: user_id PK/FK; timezone default UTC; quiet_start,quiet_end nullable HH:MM pair; paused_until nullable; email_enabled,push_enabled,sms_enabled false; channel_enabled_at JSON (UTC timestamps); direct_messages true; created_at,updated_at. Legacy preferences do not grant external consent.
- EngagementSubscription: id; user_id; scope_kind; scope_id UUID; event_families JSON; channels JSON; frequency default daily; muted false; created_at,updated_at. UNIQUE(user_id,scope_kind,scope_id). Empty event_families/channels invalid except muted subscription. Scope must exist and be visible at write/read/send.
- EngagementEvent: id; event_key String255 UNIQUE; family; event_type; actor_user_id nullable; ecosystem_id nullable; source_kind; source_id UUID; domain_id/team_id nullable; audience_user_ids JSON nullable (null means eligible ecosystem participants; list means private targeted recipients); occurred_at; fanout_cursor nullable String; fanout_complete false; created_at. Store no arbitrary user-supplied title/body/url. Event producers derive fields.
- EngagementInboxItem: id; user_id; event_id; reason_code; read_at nullable; created_at. UNIQUE(user_id,event_id). A missing/revoked source is filtered before DTO/unread count.
- NotificationContact: id; user_id; channel email|sms; destination private String320; destination_hash; generation int; verified_at nullable; revoked_at nullable; suppressed_at nullable; suppression_reason nullable; created_at. Immutable destination per row; replacement revokes old row and creates new id/generation, disables channel until explicit re-enable after verification. Do not expose destination in list except owner mask.
- NotificationChallenge: id; contact_id; token_hash; expires_at; attempts default0; used_at nullable; provider_verification_id nullable; created_at. One-use challenge tied to exact contact generation. Never return/log raw codes except outbound verification payload to transport. Bounded request+attempt rates.
- EngagementPushDevice: id; user_id; endpoint private unique; p256dh_key; auth_key; enabled true; created_at,updated_at. Existing endpoint cannot be silently rebound to another user. Disable devices on authenticated logout/account switch; browser clears subscription and server registration before re-enrolling.
- NotificationDelivery: id; delivery_key UNIQUE; user_id; channel; contact_id nullable; device_id nullable; event_ids JSON; state; due_at; attempt_count default0; claim_token nullable; lease_expires_at nullable; attempt_started_at nullable; first_attempt_at nullable; accepted_at nullable; delivered_at nullable; provider_message_id nullable indexed; frozen_payload JSON nullable; error_code nullable; created_at,updated_at.
- NotificationConsumption: id; user_id; event_id; channel; delivery_id; created_at. UNIQUE(user_id,event_id,channel). Reservation ties event to one delivery, released only on definite unsent cancellation if policy permits; accepted/ambiguous attempts never auto-replaced.
- NotificationWebhookReceipt: id; provider; receipt_key UNIQUE; received_at. No full raw webhook retention.
Core lane may refine names only after notifying coordinator and delivery lane; these field names are the initial integration contract.

# API DTOs
GET /preferences -> {timezone,quiet_start,quiet_end,paused_until,email_enabled,push_enabled,sms_enabled,direct_messages}.
PUT /preferences accepts same fields; strict bool/types, valid timezone/pair. Enabling external channel requires operational capability + verified current contact/device and records channel_enabled_at=now. Disabling applies immediately to queued work. GET never creates implicit consent.
GET /capabilities -> {external_delivery_enabled:boolean,channels:{in_app:{state:'ready'},email:{state,reason},push:{state,reason,public_key?},sms:{state,reason}},contacts:[{id,channel,masked_destination,verified,suppressed}]}.
state enum: pending_setup, configured_disabled, needs_verification, ready, suppressed. No credentials. Channel state derives configuration AND user readiness; reason is safe human text.
GET /subscriptions -> {items:[{id,scope_kind,scope_id,scope_label,event_families,channels,frequency,muted}]}.
POST /subscriptions upserts by actor+scope, accepts {scope_kind,scope_id,event_families,channels,frequency,muted}; returns same DTO.
DELETE /subscriptions/:id ->204 owned-only. Deleting follow falls back to default in-app community activity; mute requires explicit muted:true and overrides broad/implicit matches.
GET /scope-options?kind=&q= -> {items:[{scope_kind,scope_id,label,ecosystem_id?}]} authorized only.
GET /activity?ecosystem_id=&cursor=&limit= -> {items:[Activity],next_cursor}. Current actor memberships and source policy; omit direct messages from community activity.
GET /inbox?unread=true&cursor=&limit= -> {items:[InboxItem],next_cursor,unread_count}.
PATCH /inbox/:id {read:true|false} -> InboxItem or neutral404; owner-only.
POST /inbox/read {ids:[uuid,...]} bounded50, no global arbitrary mass operation.
Activity = {id,event_type,family,source_kind,source_id,ecosystem_id,ecosystem_name,title,summary,url,occurred_at}.
InboxItem = Activity + {inbox_id,read_at,reason}. Source adapters generate safe labels and internal paths. Summary is fixed event description, not raw message text.
GET /communities (separate /api/v1 prefix) ?q=&cursor=&limit= -> {items:[{id,name,description,tags,location,logo_url,preview_url,join_url}],next_cursor}.
GET /communities/:id -> public-active community fields + {opportunities:[{id,title,url}],opportunities_require_sign_in:boolean,join_url:'/ethos/<id>'}. Existing exchange policy defines public opportunities as signed-in visibility: anonymous previews return no opportunity titles and set the sign-in flag; authenticated previews use current source policy. No private participant/fit/proposal content.
Existing /api/v1/me/next-steps remains canonical for action obligations; do not duplicate in engagement.

# Delivery API (delivery lane)
POST /contacts {channel:'email'|'sms',destination:string} -> {contact:{id,channel,masked_destination,verified:false},challenge_id,status:'verification_pending'}; rejects503 pending_setup without claiming sent. Request validation/rate limits first; activation must be enabled even for real verification.
POST /contacts/:id/verify {challenge_id,code} -> masked contact DTO. Only current owner/contact/generation, unexpired one-use challenge. Twilio Verify result must actually be approved.
DELETE /contacts/:id ->204 revokes destination/challenges/unsent work, disables corresponding channel.
POST /push {endpoint,keys:{p256dh,auth}} -> {id,status:'subscribed'} validated allowed provider endpoints; no alternate owner input.
DELETE /push {endpoint} ->204 actual-user-only. Enrollment may register local browser subscription only when capability configured; failed backend registration cleans browser enrollment.
POST /push/test -> not in current scope; no automatic external test sends.
GET /unsubscribe?token= -> safe minimal HTML confirmation form. POST same path accepts valid signed recipient/channel token and disables channel; replay idempotent, GET no mutation. Works without login.
POST /webhooks/resend raw signed Svix; POST /webhooks/twilio form signed with fixed externally configured HTTPS callback URL. Return minimal acceptance, no address disclosure.

# Source adapter and producer interface
services.engagement.record_event(session, *, event_key, family, event_type, source_kind, source_id, ecosystem_id=None, actor_user_id=None, domain_id=None, team_id=None, audience_user_ids=None) -> EngagementEvent. Idempotent savepoint/upsert. Never commit, send or perform fanout in originating mutation.
services.engagement.event_view(session,user_id,event, *, community=False) -> Activity|None. Fresh user/participation/source checks; disabled user denied.
services.engagement.fanout_pending(session, *, limit=50) -> counts. Bounded resumable recipients, event/inbox uniqueness and cursor. Called after domain commit by dedicated worker; inbox GET may materialize recent due events only through same service and bounded limits if needed.
services.engagement.delivery_candidates(session,user_id,event) -> list[{channel,frequency,reason}]. Resolves current subscription policy, enabled_since, contact and mute.
delivery.get_capabilities(session,user_id,settings) -> dict; api/engagement capabilities delegates.
delivery.run_engagement_loop(app) -> cancellable separate <=30sec interval bounded fanout/queue/deliver cycle. app.ctx.db/settings and shared httpx client, no sleep inside transactions.
These signatures are shared; implementation changes require updating contract and notifying dependent lane.

# Visibility map
ecosystem: active Member belongs to ecosystem; public preview separate.
domain/team: active parent membership plus actual configured subgroup participation where source policy requires it; source membership helper reused.
proposal/agreement: use current governance scope access; do not make private drafts public.
share/collaboration: services.exchange.load_viewer + load_visible/load_collaboration; withdrawn/hidden states handled by existing policy.
conversation: services.member_messaging current participant access; events additionally bind exact intended recipient set. Never source-wide ecosystem fanout.
For public cards only public-active ecosystem + explicitly public visible share/need; private title is not an acceptable teaser.

# Precedence and lifecycle (cycle1 accepted revisions)
1. Current user/source authorization and contact/device generation.
2. Hard bounce/complaint/STOP suppression, global channel off/pause and quiet-time scheduling.
3. Any matching explicit mute overrides all matching broader/implicit subscriptions for that event.
4. Matching category/channel scopes; fastest explicit frequency wins; unique recipient/event/channel.
Read-before-first-attempt excludes item from digest (immediate delivery may still occur if already accepted). In-app read does not consume another channel. Push acceptance does not consume email. Completed governance is independent.
Freeze event manifest, destination/contact generation, and exact rendered payload at first attempt. Recheck eligibility before retries: if permission/contact/consent changed suppress, never mutate frozen payload or create automatic replacement. New events go to another eligible digest window.
Claim states: pending -> claimed -> sending -> accepted -> delivered; retry_wait for definite retryable failure; suppressed/dead/ambiguous terminal unless explicit safe reconciliation. Capability absence yields blocked_configuration without network calls, not accepted.
Persist claim_token, lease_expires_at, attempt_started_at before network I/O. Timeout shorter than lease; CAS completion by claim_token. Expired claim with no attempt started can be retried. Expired started SMS/push attempt => ambiguous, never blind retry. Resend ambiguous replay uses same frozen bytes/key within24h; beyond window ambiguous terminal. Provider acceptance vs delivery separate.
Each external enable records fresh channel_enabled_at; external candidates must occur after it. Never backfill before consent/activation or send old verification challenges after configuration changes.
Contact replacement A->B revokes A, disables channel and requires B verification+explicit re-enable. A callbacks affect A only; global unsubscribe is a separate owner/channel preference.
# Cycle 2 accepted amendments (authoritative)
Integration refinements: NotificationConsumption has non-null target_key default empty and uniqueness(user,event,channel,target_key); push uses device UUID, email/SMS empty. This permits independently retried devices without duplicated delivery to the same device. EngagementPushDevice.auth_session_id binds actual authenticated enrollment; logout/expired session disables only its devices. Daily cadence is09:00 local; weekly is Monday09:00 local; immediate respects quiet hours and pause. Unread counts carry unread_count_is_lower_bound when bounded visibility scans cannot establish exact count; UI displays +.
Security:
- Every cookie-authenticated engagement mutation requires application/json and an exact allowed Origin from configured FRONTEND_URL/CORS_ORIGINS. Reject foreign or literal null Origin. Origin-less nonbrowser JSON calls are allowed only without browser Sec-Fetch-* headers; no simple-form fallback. Signed unsubscribe and provider callbacks are explicitly separate public boundaries.
- Verification quotas persist across challenge/contact replacement: atomic user/channel/hour, normalized destination fingerprint/channel/hour and global/channel/hour counters. Default limits5/user/hour,3/destination/hour,100/global/hour; <=5 verification guesses per contact plus user-wide20/hour. Store keyed hashes for short codes and consume under row lock. Add NotificationRateLimit(id,bucket_key UNIQUE,window_start,count) owned by core lane.
- Push enrollment AND transport validate HTTPS, exact supported provider hosts/subdomain boundaries, no userinfo/non443port/IP literals, URL<=2048 and valid decoded p256dh/auth key lengths. Resolve destinations and reject nonglobal IPs. Requests session passed to pywebpush must reject redirects at its actual request boundary. Supported host families: fcm.googleapis.com, updates.push.services.mozilla.com and *.push.services.mozilla.com, web.push.apple.com and *.push.apple.com, *.notify.windows.com. No arbitrary configurable bypass. Test lookalikes/private DNS/redirect-to-private; unsupported providers fail honestly.

Architecture:
- An event is one occurrence, independent of how many ecosystems/domains it spans. Add services.engagement.event_scopes(session,event) returning complete current scopes from the canonical source; stored ecosystem_id is display context only. Shared proposal/agreement ecosystem_ids and both collaboration domains participate in matching/fanout. Dual membership still yields one inbox/event and one consumption/event/channel. Current visibility is checked per recipient; no broad superset grants.
- Required producer matrix is in producer-matrix.md; all direct Message construction in exchange.respond must emit same message-id occurrence as ordinary messaging. Automatic governance transitions use the shared entry/_apply path.
- Occurrence identity is a persisted source message/ceremony/round ID where present. Otherwise create a fresh mutation occurrence UUID only when actually executing a validated domain state change and persist it in EngagementEvent in the same transaction; replay event ingestion uses that stored key. Never use resource+target-status alone, timestamp truncation, or regenerate occurrence IDs during fanout/retry.
- Team/domain membership changes are concrete community-family events (family enum adds community; source_kind team/domain). Scope options may advertise these only with wired producers and tested authorized resolution. Domain scoped governance/share events continue to match actual domain, never entire ecosystem as substitute.

## Subscription activation refinement
Widening an existing follow (adding a channel/category or unmuting) resets its complete activation timestamp. No historical external backfill is permitted. This conservative whole-follow cutoff also excludes pending older events for unchanged categories/channels on that follow; independent matching follows still apply. No-op and narrowing edits preserve activation. Active follows require at least one category; an empty category list means none, never all.
