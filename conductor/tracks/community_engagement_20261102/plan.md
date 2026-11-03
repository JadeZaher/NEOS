---
type: Implementation Plan
title: Community engagement design, review, execution and credential gate
---
# Workflow
- [x] Inventory existing community, home, next-step, notification and identity surfaces.
- [x] Finalize sourced provider/package recommendation.
- [x] Cycle 1: two independent randomized lenses, advocate/adversary; triage and revise.
- [x] Cycle 2: two unused lenses on revised design; triage and freeze contracts.
- [x] Parallel core backend, delivery/contact, frontend implementation; coordinator source hooks and integration.
- [x] Reconcile shared contracts, migrations, docs and missing risk tests.
- [x] Integrated validation sweep and isolated actual browser journeys; batch corrections if needed.
- [x] Independent final implementation/evidence verification.
- [x] Deploy verified code with external delivery disabled, verify release identity and in-app/public boundaries.
- [x] Finish credential gate and owner handoff; mark ready-for-provider-activation without claiming external delivery tested.

# Ownership (after review)
Core backend: engagement models (all tables), one migration after y5e9b3d7a1c4, services/engagement.py, api/engagement.py, api/communities.py, core tests.
Delivery: services/engagement_delivery.py, services/engagement_providers.py, api/engagement_delivery.py, contacts/worker/webhook tests, provider runbook. Consume core model interface; request changes, do not independently edit models.
Frontend: pages/communities, Updates, notification settings/hooks/service worker, Dashboard/Discover/Ethos reusable entry components, frontend tests. May own App/sidebar/header integrations once agreed.
Coordinator: config/main/model exports/package metadata/migration reservation, domain source hooks, final API contract integration, QA scripts, track and release evidence.
No lanes run broad tests, commit/push, modify .env, change production, or send external notifications. Coordinator owns validation and release.

# Packages and design patterns
Reuse React18, wouter3, TanStack Query5, Radix/shadcn, React Hook Form7 + Zod3, Lucide, Intl timezone support; no new UI framework/feed SaaS.
Backend SQLAlchemy2 + PostgreSQL transactional outbox, Pydantic validated DTOs, Sanic lifecycle workers, httpx AsyncClient provider adapter, pywebpush off event loop, svix signature verification and provider-specific Twilio signature verification. Exact dependency ranges and official source links in provider-research.md / design.md before implementation.
Use explicit source adapters and allowlists, user-owned query keys, cursor pagination, ports/adapters for provider transports, idempotency keys, leased work claims, state-machine delivery statuses and preference-vs-capability separation. Avoid Redis/Celery until actual scale needs another service.

# Validation evidence
Record actual commands/exits and source identities in verification.md. Keep setup/probe evidence separate from UI success, and mock transport proof separate from real delivery. Do not overwrite historical failures or claim a provider call without keys.
