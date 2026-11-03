---
type: Verification Record
title: Community engagement implementation and release evidence
status: passed-at-provider-gate
---

# Independent implementation checks
Two bounded read-only implementation lanes reviewed core/producers and delivery/providers after the two design review cycles. They found five release blockers: SQL versus JSON null filtering of activity, missing agent domain-join events, missing ratified-proposal registration/amendment events, historical external backfill after widening a subscription, and digest overflow starving other owners. These are being corrected before the integrated sweep.

OAuth entry review also found that frontend target preservation needed a signed backend target. The callback now rechecks the selected public active community and rolls back account creation if that community becomes unavailable. Existing users retain memberships.

# Validation boundary
No external email, SMS or push has been sent. Transport verification is simulated until the owner credential/recipient gate. Actual commands, exits and deployment identities will be appended below; authored tests are not counted as executed.

# Integrated sweep
- Frontend: npm test passed171/171; npm run check exit0; npm run build exit0; npm run check:contrast passed34 semantic pairs, minimum5.51:1. Build retains large-chunk and mixed static/dynamic import warnings.
- Backend full sweep:1737 passed,50 failed in1272.99seconds (1787 cases). All failures belonged to three files: engagement delivery, NodeAdmin support inventory, and platform administration. Corrections used valid contact fingerprints in fixtures, corrected the frozen digest size expectation while retaining immutability assertions, explicitly classified private engagement tables, and fixed cooperative worker shutdown before database disposal.
- Final affected sweep:359 passed,0 failed/errors/skipped in156.29seconds. This reran every previously failing suite plus all engagement, PostgreSQL, OAuth and main tests; added3 real lifecycle regressions. An independent verifier mapped all50 original failed IDs to exactly one passing case in the final JUnit XML. All6 PostgreSQL engagement cases passed. No second full-suite run was performed.
- Local PostgreSQL: alembic upgrade head exit0, y5e9b3d7a1c4 -> z6f0c4e8b2d5.
- Deployment dependencies: uv lock added10 required packages without upgrading existing locked packages; isolated uv sync --frozen --no-dev --no-editable on Python3.12 passed. Installed application import/create_app registered57 blueprints. First inline smoke had a PowerShell quoting failure; corrected script-file smoke passed. Raw failed attempt retained.

# Local browser flows
- p8-community-engagement.mjs passed first run, exit0, real non-gold synthetic accounts, local sentinel verified, outbound disabled. Preferences persisted, broad follow saved, private message produced generic owner update, read did not change next steps, source mute blocked later updates,390px layout fit, and anonymous preview preserved login/signup target. Report and screenshot: uxqa/passes/08-community-engagement/.
- Separate signup browser probe completed full admission: anonymous selection -> password signup -> exactly one ordinary membership in selected community, pending_consent -> actual configured quiz submission -> still pending -> actual agreement consent -> active membership. No seeded passes or bypass. First harness attempt incorrectly expected201 instead of the existing200 signup contract; its report/log are retained and the corrected probe used a fresh account.
- Desktop inspection found the existing27-item task queue buried community activity. Dashboard now initially shows5 with full count and keyboard-accessible expansion/collapse. Actual browser probe verified5->27->5, preserved action-link order and focus; activity moved2770px nearer the top. Final frontend verification after this change passed171 tests, TypeScript and production build.

# Release
Both Railway releases succeeded and the live checks passed:
- Backend a495e5f561e963092622bd0107da4fb3d566efcc, deployment546ab917-c42e-4151-930d-18fcaf310aee.
- Frontend3ba7f4509442baf6f8250bc3962919debeeca0da, deployment9278b18c-b9d4-40e0-b0ba-0803db62a821.
- Production schema z6f0c4e8b2d5; all11 engagement tables present. Exactly the two approved Ahmed Zaher accounts remain active NodeAdmins.
- Nine deployed engagement/OAuth source hashes match the local verified source. Public HTML, JavaScript and CSS hashes exactly match the running frontend container; production JS differs from the local build because of deployment configuration.
- Live anonymous browser home -> community preview -> selected-community login passed. Anonymous opportunity titles are withheld; inbox/preferences/capabilities/admin catalog reject unsigned guests; /updates redirects guests to login. No production account or governance mutation was performed.
- Protected Railway variables contain canonical URLs, signing secret, VAPID pair/subject and all4 switches explicitly false. Configuration used stdin and --skip-deploys. No provider account/key was created and no real email/SMS/push was sent.

Machine evidence is release-evidence.json. Raw logs stay in ignored .omc/research. The first remote-check wrapper captured no command report; the corrected single-command SSH invocation completed read-only verification. Both attempts are retained.

# Remaining gate and limitations
Owner setup: Resend account, verified sender DNS/From, API key and webhook signing secret, then explicit channel activation and approved first recipient. Optional Twilio setup is independent; native VAPID keys are already configured. Real provider delivery remains untested until that gate is completed. See provider-setup.md.

Existing Sanic/asyncio/cookie deprecation warnings and the frontend large-bundle warning remain non-blocking technical debt. Local automated/browser checks establish implemented flow behavior, not evidence of real-member retention or comprehension.
