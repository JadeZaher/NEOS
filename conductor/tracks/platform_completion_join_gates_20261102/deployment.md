---
type: Deployment Verification
title: Published release identities and production postflight
status: verified-complete
date: 2026-11-02
---

# Published release

Both validated source commits were pushed to `main` and are deployed successfully.
The application is [neos.primusneo.com](https://neos.primusneo.com), with backend
[API health](https://neos-operating-system-production.up.railway.app/api/v1/health).

| Service | Commit | Railway deployment | Terminal status |
|---|---|---|---|
| Backend | `4c99dae161ec4aa8eb1b52f5cce87532b9f5625b` | `e6e3f647-4586-461b-bfec-91af3994739f` | SUCCESS |
| Frontend | `ae7cc472429be5b0b89fe011506fe163ef9f3f29` | `976f080a-0173-43f0-917d-aca6d60e528e` | SUCCESS |

Railway CLI deployment JSON records the exact Git commit and successful deployment
for each service in `.omc/research/backend-release-deployments-20261102.json` and
`frontend-release-deployments-20261102.json`. The source commits remain unchanged
after validation. Final independent postflight review is APPROVED_COMPLETE in
[release-review.md](release-review.md); this documentation records that result
without rewriting or granting itself reviewer approval.

# Actual production checks

| Boundary | Executed result |
|---|---|
| Schema | Production head is `y5e9b3d7a1c4`; all five expected private-data tables are present |
| Completion proof columns | `completion_verified` is non-null with default false; `graded_fingerprint` is nullable; zero verified results lack a fingerprint |
| Operator assignments | Exactly two active NodeAdmins, matching the two authorized Ahmed Zaher accounts; no builder/co-creator expansion |
| Immutable support history | Both `node_admin_actions_immutable` and `node_admin_snapshots_immutable` triggers are enabled with PostgreSQL mode `O` |
| Public audit privacy/time | Actual latest public audit uses UTC `Z`; its public serialization contains no private snapshot payload |
| Backend identity | Eight selected critical runtime source SHA-256 values match the committed Git blobs |
| Generation | Actual pinned paid OpenRouter `google/gemini-3.1-flash-lite` response received and exactly matches the minimal `OK` smoke expectation |
| Decision routing | Real typed Jev response uses `framework`, no skill, source `decision` for a definition request; configured `/app/neos-core` exists and loads 54 skills |
| Guest HTTP boundaries | Health, public audit and roster return 200; private support catalog, orientation history and matching profile return 401 |
| Guest browser | Actual public audit heading/UI and exact two-account public roster load; guest administration is denied |
| Frontend identity | Production HTML and JS/CSS hashes match the running Nginx container associated with the exact frontend Git/deployment metadata |
| Write boundary | Browser smoke observes zero governance or account writes; SQL checks are read-only metadata reads |

The configured provider is `openrouter`, generation model
`openrouter/google/gemini-3.1-flash-lite`, and decision model
`typesafe/jev-1.14-20261014` with a six-second decision timeout. Actual runtime
versions are LiteLLM 1.92.0 and OpenAI SDK 2.45.0. These checks establish actual
deployment availability and routing without publishing any model key, credential,
private conversation, export body or snapshot.

The asset comparison uses the production response and running container, plus
Railway's exact Git identity. Production JS differs from the local build because
its build configuration differs; that is not a source-identity failure. The CSS
also matches the local build. Initial verifier results involving PostgreSQL's
internal character metadata and a UTF-16 log decoder were corrected in the
verification harness, with the initial artifacts preserved. No production source
patch was made to resolve those verifier issues.

# Evidence artifacts

- `.omc/research/production-release-verification-r2-20261102.json`: schema, exact
  assignments, private tables, completion columns, enabled immutable triggers,
  public UTC/privacy serialization, runtime hashes/configuration and actual
  minimal generation response.
- `.omc/research/backend-release-source-hashes-20261102.json`: fingerprints of the
  committed backend Git blobs, independent of Windows working-tree line endings.
- `.omc/research/production-decision-smoke-20261102.json`: actual typed decision,
  configured core path and loaded skill inventory count.
- `.omc/research/production-web-smoke-20261102.json`: actual HTTP/browser public and
  private boundary checks, public roster/audit observations and zero application writes.
- `.omc/research/production-frontend-artifact-verification-20261102.json`: exact
  deployment/commit and production-response-to-container HTML/asset identities.

# Review and claim limits

Local source, affected test closure and actual model/operator behavior are documented
in [verification.md](verification.md) and the
[pass-07 verdict](../../../uxqa/passes/07-stewardship/verdict.md). Historical initial
backend failures, the R1 lexical false negative, M5's separate budget followup and
operator coverage across distinct attempts remain unchanged. Deployment success
does not turn them into a second full-suite pass, a single 26/26 model run, a single
11/11 operator run, two-pass study convergence or human research evidence.

The final independent postflight result is APPROVED_COMPLETE. Its verbatim report
is [release-review.md](release-review.md), with matching source/copy SHA-256 and
authorship provenance in [release-review-provenance.json](release-review-provenance.json).
The accepted automated implementation, QA and production release scope is complete.
D-08 future custom roles and D-09 human recruitment/accessibility validation remain
explicitly deferred, with no new owner decision invented.
