---
type: Release Plan
title: Explicit NodeAdmin bootstrap and decision routing release
status: PENDING_VERIFICATION
---

The owner authorized the initial NodeAdmin role for **both production accounts named Ahmed Zaher**, after a read-only lookup established duplicate display names and creation dates. This supersedes the earlier builder/co-creator bulk-grant instruction. The exact User IDs are `594bedc7-c56c-4365-aece-f5af6aa17d2f` (July 12) and `6a1ae969-0a87-4bb8-a0dd-390d19e66ba5` (July 13). No other existing account is included.

The production bootstrap must use only those two explicitly configured IDs, through `NODE_ADMIN_BOOTSTRAP_USER_IDS`. The migration creates no role assignments from profiles. The initializer validates usable identities, serializes bootstrap, creates immutable public grant receipts and marks completion only after success. Later starts do not regrant a revoked role. Clear the initial configuration after verifying the assignments if routine configuration hygiene requires it; the persisted role and bootstrap record are authoritative.

A read-only production eligibility check for exactly these two IDs returned requested 2, eligible 2. It exported aggregate counts only, with no authentication methods, credentials, session details or membership metadata. No assignment or configuration mutation occurred in this check.

For the isolated local QA database only, the synthetic Oren account is the initial support operator. Synthetic second/memberless operators and all local fixtures are separate from production assignment decisions.

After reviewed source, migrations and integrated checks pass, the coordinator deploys backend and frontend to the existing Railway production services. Preserve Gemini 3.1 Flash-Lite generation and the existing OpenRouter key. Enable the measured pinned router with `AI_DECISION_MODEL=typesafe/jev-1.14-20261014` and `AI_DECISION_TIMEOUT_SECONDS=6`.

Read-only pre-release runtime verification returned `provider=openrouter`, `generation_model=openrouter/google/gemini-3.1-flash-lite` and `key_matches_authorized_pi=true`. The comparison used a digest in memory and exported only the match boolean; no key was printed or transferred in a command argument. The running backend remains the prior successful deployment until the final checks and release.

Verify exact deployment IDs, database migration head, health, both active roster assignments and absence of any additional NodeAdmin grants. Check anonymous redacted audit/roster endpoints and public pages; verify fixed-text model inference without reading or publishing private conversations. Record remaining study quality limits independently of deployment success.

## Local migration evidence

Coordinator ran `alembic upgrade w3c7f1a9d5e2` with `DATABASE_URL` explicitly set to the isolated `127.0.0.1:5433/neos_uxqa`; exit 0. Metadata readback returned revision `w3c7f1a9d5e2`, zero NodeAdmin assignments, zero bootstrap-complete markers, and both `node_admin_actions_immutable` and `node_admin_snapshots_immutable` triggers. Thus this migration did not silently grant authority from historical profiles. Startup/bootstrap and functional QA remain separate checks.
