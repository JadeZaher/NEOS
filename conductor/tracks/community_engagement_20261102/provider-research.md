---
type: Provider Research
title: Community engagement delivery providers and integration contracts
date: 2026-11-02
status: researched-awaiting-owner-credentials
---

# Recommendation

Use **Resend for email**, **native Web Push with VAPID** for browser notifications, and **Twilio Messaging plus Verify** for optional SMS. Keep external delivery disabled until the corresponding credentials, verified sender, destination verification, and consent requirements are satisfied. These are engineering recommendations for NEOS's current Python/Sanic + Railway deployment; no provider account, key, DNS record, paid plan, or external message was created by this research.

| Option | Current verified terms | Fit for NEOS |
|---|---|---|
| Resend | Free transactional quota 3,000/month and 100/day; pricing page lists Pro at $20/month for 50,000. Quotas count recipients, and free quota includes received mail. | Recommended initial email adapter: straightforward HTTP API, signed event webhooks, documented request idempotency. Daily free limit makes staggered digests necessary even with a small community. |
| SendGrid | Current official pricing offers a 60-day trial of 100/day; ongoing paid pricing depends on volume/features. | Viable alternative if the owner already has an established sender/account. Do not describe the old perpetual free plan as current. |
| Amazon SES | Base outbound $0.10/1,000, with data and optional-feature charges. New regional sandbox restricts recipients, 200/day and one message/second until production access. | Cheapest stated base transport price; more AWS identity, regional approval, feedback and operational setup. Reconsider at meaningful volume or if the owner already operates SES. |
| Native Web Push | Application owns VAPID keys; browser push service handles delivery. | No additional notification SaaS account required. Browser support/permission still determines availability. |
| Twilio SMS | Country, sender type, registration and message-segment dependent; no single global unit-price claim. | Optional separate setup. Use explicit SMS consent, verified phone and a configured Messaging Service. Voice calling is a separate future decision, not implied by SMS. |

Sources: [Resend pricing](https://resend.com/pricing), [Resend account quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits), [SendGrid pricing](https://www.twilio.com/en-us/products/email-api/pricing), [SES pricing](https://aws.amazon.com/ses/pricing/), [SES sandbox](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html), [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API).

# Recommended packages and patterns

- Reuse SQLAlchemy/Alembic and PostgreSQL for a transactional outbox, durable recipient delivery records, deduplication and bounded worker claims. Do not add Redis/Celery solely for this first implementation.
- Promote existing `httpx` from dev-only to runtime, with a compatible bounded range such as `httpx>=0.27,<1`; use one lifecycle-managed AsyncClient with explicit connect/read timeouts. No Resend SDK is required for the small HTTP contract below.
- Use `svix>=1,<2` for Resend webhook signature validation rather than custom cryptography. Verify raw request bytes with the three Svix headers before parsing or processing events.
- Use `pywebpush>=2,<3`, locking the resolved published release during integration. Upstream main currently declares 2.5.0/Python >=3.10, but this research does not claim that Git main is the installed or tested release. Use the stable synchronous API through `asyncio.to_thread` with a finite timeout, or independently validate the selected release's async API before adopting it. Avoid relying on newer exception convenience properties across the whole 2.x range; inspect `exception.response.status_code` defensively.
- If SMS is enabled, prefer the maintained Twilio Python SDK's RequestValidator (`twilio>=9,<10`, resolve/lock in implementation) for callback signatures. Sending can reuse httpx. Keep SMS dependencies/config optional if the release ships with SMS unavailable.
- Reuse React/TanStack Query/wouter and browser Service Worker/Push APIs. Do not add a second client cache, feed framework, commercial notification inbox, or frontend email renderer. Jinja2 is already available for escaped HTML plus plain-text email templates.

Official library/API references: [pywebpush](https://github.com/web-push-libs/pywebpush), [upstream package metadata](https://raw.githubusercontent.com/web-push-libs/pywebpush/main/pyproject.toml), [Resend webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests), [Twilio request security](https://www.twilio.com/docs/usage/security). Context7 was consulted for `/websites/resend` and `/web-push-libs/pywebpush`; captured source material is under `.omc/research/engagement-*`.

# Email adapter contract

Integration resolved runtime versions to httpx0.28.1 (declared >=0.27,<1), svix1.99.1, pywebpush2.5.0, and twilio9.12.0. Provider/signature packages are pinned in agent/pyproject.toml and the production uv.lock includes the new dependencies. tzdata supplies IANA zones on Windows (QA installed2025.3; frozen production resolution2026.6, declared >=2025.1). The full suite uses the installed Python3.14 QA environment; an isolated frozen Python3.12 install and application import smoke also passed, matching Railway's Python minor version.

Send one recipient per delivery using `POST https://api.resend.com/emails`, bearer API key, JSON `from`, `to`, `subject`, `html`, `text`, and application-controlled headers. Save the returned provider email ID. API acceptance means accepted, not delivered or read. Treat `email.delivered` as recipient-server delivery only.

Use a stable `Idempotency-Key` derived from the durable delivery ID. Resend retains keys **24 hours**, supports up to 256 characters, and rejects reuse with a different body. Freeze the body per attempt; keep application deduplication longer than provider retention. After an ambiguous timeout/crash, retry with the same key inside its window. Do not blindly resend an uncertain request after 24 hours: retain an explicit uncertain state and reconcile. Honor provider Retry-After/rate limits with bounded backoff; never reset a key on retry.

API/body: [Send email](https://resend.com/docs/api-reference/emails/send-email). Retry semantics: [Idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys).

Subscribe to delivered, bounced, complained, failed, suppressed and delivery-delayed webhooks. Validate the raw body with `svix-id`, `svix-timestamp`, `svix-signature` and a dedicated webhook signing secret; record provider event IDs uniquely so replay cannot duplicate work. Match provider IDs to known local deliveries; do not accept arbitrary webhook recipients as authorization. Hard bounces and complaints create local address/channel suppression; delayed events do not override a later successful delivery or undo a suppression. Webhook event ordering is not guaranteed by the application.

Event meanings: [Resend event types](https://resend.com/docs/webhooks/event-types). Signature contract: [Verify webhook requests](https://resend.com/docs/webhooks/verify-webhooks-requests).

# Consent, identity and unsubscribe

Application account email is not proof of verified ownership or notification consent. A user-requested email verification flow needs a bounded, expiring, single-use token tied to the current user and exact normalized destination; replacement invalidates previous verification. Verify destination ownership separately from selecting a subscription. Rate-limit challenge requests and never enable delivery because an administrator typed an address.

Every engagement email should explain why it was sent, link to preferences, and carry a signed opaque unsubscribe token. Implement RFC8058 headers `List-Unsubscribe: <https://...>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. GET displays a confirmation page; POST consumes the valid token and suppresses the stated scope without login. Link scanners must not unsubscribe on GET. Never put raw email/user IDs or session tokens in links. Disable provider open/click tracking by default; no engagement tracking pixels. These are proposed NEOS design requirements, not a claim about existing account verification.

Resend's transactional API does not manage the application's contact list; NEOS must own preference enforcement: [Unsubscribe for transactional emails](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails). Sender-domain tracking controls: [Verified domains](https://resend.com/docs/dashboard/domains/introduction).

# Web Push contract

Register a same-origin service worker on an explicit user action and request browser permission only then. Bind subscriptions to the authenticated User/device, not just the currently selected Member row. Validate subscription endpoint/key shapes and constrain outbound endpoints to supported HTTPS push-service hosts; reject localhost/private-network destinations and redirects. Subscription URLs are capabilities and must not enter public audits or logs.

Use VAPID private key server-side and public key in browser registration. Send bounded generic title/body plus a same-origin relative destination; never put private messages, quiz answers, matching profiles, or privileged record bodies on a lock screen. Revalidate recipient access immediately before delivery and again when opening the app. A 404/410 push response disables that device subscription; other failures stay observable and bounded. Generate a fresh claims dict per send because pywebpush may mutate it.

References: [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API), [pywebpush usage](https://github.com/web-push-libs/pywebpush).

# SMS contract

Twilio credentials alone do not make SMS ready. Require an approved sender/Messaging Service for the destination regions, verified E.164 phone ownership (Twilio Verify or an equivalently secure application challenge), explicit SMS consent, and a functioning signed opt-out webhook. Use the Messaging Service's Advanced Opt-Out and mirror `OptOutType=STOP` into local suppression. START can clear provider-level blocking but must not silently recreate unrelated application subscriptions.

Validate `X-Twilio-Signature` using the exact externally configured HTTPS URL and original form parameters; do not trust arbitrary proxy Host values. The auth token needed for webhook validation is distinct from API-key authentication used for outgoing calls. Deduplicate callbacks by provider identifiers. Treat ambiguous SMS send timeouts as uncertain instead of assuming Resend's idempotency contract applies to Twilio. Prefer generic short summaries and deep links; private content stays in-app.

References: [Twilio request validation](https://www.twilio.com/docs/usage/security), [Advanced Opt-Out](https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out), [Twilio Verify](https://www.twilio.com/docs/verify/api/verification), [Message resource](https://www.twilio.com/docs/messaging/api/message-resource).

# Concrete credential gate

All local schema, API/UI, subscription evaluation, event/outbox jobs, templates, provider adapters, signature validation, opt-out, capability reporting, test fixtures, and operator setup documentation can be completed without sending external messages.

Owner-provided setup after implementation:

1. **Resend:** account, a domain/subdomain the owner controls (suggest `updates.primusneo.com` only if that DNS zone is theirs), provider-generated DNS verification records, approved From/Reply-To identity, sending API key, and webhook signing secret. Confirm verified status in provider dashboard; do not assume having a key means verified. Disable open/click tracking in domain settings.
2. **Web Push:** coordinator-generated VAPID pair, stable public key, protected private key and a real contact email/HTTPS subject. Generation needs no purchased provider account; activation still requires browser opt-in.
3. **Optional SMS:** Twilio account SID, API key SID/secret or restricted auth credentials, callback auth token, Messaging Service SID, Verify Service SID, approved sender/regions, and exact public callback URL. Defer enabling SMS until these are ready.
4. Set the external-delivery feature flag only after channel readiness and an explicitly approved test destination are supplied. Do not transmit community messages to real users as a setup smoke.

Do not ask the owner to paste secrets into chat or commit them. Configure protected runtime variables through Railway/approved secret management. The normal user UI should state which channels are available; the NodeAdmin setup page can expose readiness booleans and missing variable names, never secret values.

Credential absence must produce an explicit unavailable/blocked-configuration result. A dry-run/local preview is not a sent email. Prevent a large stale backlog from flushing when credentials arrive: expire old engagement deliveries and require current consent/access at dispatch; generate fresh bounded digests instead.
