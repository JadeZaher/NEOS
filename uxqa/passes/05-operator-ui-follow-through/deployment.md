---
type: Deployment Verification
title: Decision routing and audited NodeAdmin release
status: DEPLOYED_VERIFIED
---

The coordinator published the approved source and configured Railway through the CLI. The existing OpenRouter key was retained after an in-memory comparison confirmed it matches the authorized Pi configuration. No key was printed or committed.

| Service | Commit | Exact deployment | Observed state |
|---|---|---|---|
| Backend | `c4ea26c4022bdef2e0d81494639bfa0235a10d66` | `0c9b9e8d-2290-4cef-ae1b-7f9135f278ce` | SUCCESS |
| Frontend | `bde2ce5359a62d58f23c419c1923740fae148607` | `638abaf7-e458-4d15-97e4-e5be695fb29e` | SUCCESS |

Production: [Node Administration](https://neos.primusneo.com/admin), [public support history](https://neos.primusneo.com/node/audit), [API health](https://neos-operating-system-production.up.railway.app/api/v1/health).

## Assignments and data protections

The only active NodeAdmins are the two exact Ahmed Zaher accounts selected by the owner: `594bedc7-c56c-4365-aece-f5af6aa17d2f` and `6a1ae969-0a87-4bb8-a0dd-390d19e66ba5`. Anonymous roster and public profile reads show their computed badges. Exactly two `bootstrap_admin` events exist, and the bootstrap-complete marker is version1. No profile-based or bulk builder/co-creator promotion occurred.

Database migration head is `w3c7f1a9d5e2`. Both `node_admin_actions_immutable` and `node_admin_snapshots_immutable` triggers are installed. Public audit/roster/profile checks found metadata-only audit entries and no exposed phone, DID, password hash, prompt or record body. Protected inspection remains a separate reasoned action.

## Models and served artifact

The in-container fixed synthetic generation prompt returned **`OK.`** through `openrouter/google/gemini-3.1-flash-lite`. A synthetic consent-definition question used **`typesafe/jev-1.14-20261014`**, returned decision source `decision`, mode `framework`, no selected skill, and cost `$0.000234696`. Both routes are non-Anthropic. These smoke checks made zero governance mutations; database queries were read-only.

Health is `healthy`, database `connected`, and all54 skills are loaded. Public app/admin/audit pages and the served JavaScript return HTTP200. The public asset `/assets/index-DUG7D7x_.js` contains the new administration, audit, explicit inspection and typed preparation features. Its SHA256 matches the actual file in the active nginx container for the verified frontend deployment. It differs from the Windows local build hash, so this verification uses the deployed artifact and exact source commit rather than claiming cross-environment byte identity.

Machine summaries: `production-public-verification.json`, `production-artifact-verification.json` and `production-backend-verification.json`. Source/test evidence remains in `verification.md`.

## Study limits retained

The historical full pass remains **23/26**, with one actual state violation and friction16.375. Its final C3-only repair and successful natural memberless support follow-up are separate evidence. All seven gold goals passed first attempts, but the two-consecutive-pass convergence criterion, reading-level finding and human/accessibility research remain unmet. Deployment success does not relabel those historical results.
