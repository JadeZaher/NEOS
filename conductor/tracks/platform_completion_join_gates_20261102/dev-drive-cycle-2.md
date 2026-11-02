---
type: Review Synthesis
title: Cycle two security advocate and architecture adversary
status: revised-pending-targeted-verification
---

# Revised snapshot and branches

Both independent read-only reviewers used the same immutable 146-file revised
snapshot, `.omc/research/dev-drive-20261102/cycle-2-snapshot/manifest.json`.
Its SHA-256 is `32415E9D87B7E465D421B4D2EE4FC040B000A2EBA57C8984035AADA4F1E58E1C`.
Cycle one repairs were included before capture. No review branch ran tests,
models, browser flows or database operations, or edited source.

| Branch | Reviewer | Lens | Stance | Result |
|---|---|---|---|---|
| A | security_advocate_cycle2 | Security | Enthusiastic advocate | One concrete completion-proof bypass |
| B | architecture_adversary_cycle2 | Architecture | Discriminating adversary | Three cross-path privacy/lifecycle/transaction failures |

## Join decisions

| ID | Source evidence and trigger | Decision and reason | Required correction/check |
|---|---|---|---|
| C2-01 | P1: orientation_completion.py:126 validates complete only when explicitly requested, while orientation.py:462 inherits the old status on a journey switch | Accept: switching completed A to B without status can mark B complete with empty required evidence | Compute effective persisted status before validation; a new journey starts in progress; validate every effective complete state. Prove legitimate A completion cannot transfer to B without B's own current AI/survey proof |
| C2-02 | P1: matching.py:208 reads consent unlocked before storing answers at :219; assessment creation similarly checks then separately inserts; withdrawal at :86 locks/purges without serializing those writers | Accept: an in-flight writer can recreate private data after consent withdrawal returned success | Shared owner transaction boundary for consent, private writers and erasers, including global deletion and retention; fresh enabled-consent check under the boundary. Barrier-based real PostgreSQL concurrency tests must prove zero data after erasure |
| C2-03 | P2: quizzes.py:559 treats any lifetime result as consuming a no-retakes attempt, while join_gates.py:192 accepts only current verified fingerprints | Accept: a changed quiz or historical unverified result permanently strands an ordinary entrant | Enforce no retakes within the current verified content version; preserve historical evidence and current-version restrictions. Test pending consent, changed content, a fresh allowed attempt, repeated current-version denial and legacy unverified results |
| C2-04 | P2: OrientationJourney.tsx:98 commits advancement/completion before :116 separately saves genplan; orientation.py commits those writes separately | Accept: a failed second request or page close leaves completion with missing canonical output and no normal retry | Persist derived canonical output from the validated server choice in the advancement transaction; retain an idempotent compatibility endpoint. Test forward/terminal rollback, reload and retry without trusting client output labels |

All four findings are accepted. `backend_executor` is the sole correction author
for this final review-driven batch, including narrow client changes. No third
review cycle or new randomized lens will be launched. The original reviewers may
perform targeted verification of their fixes, as the dev-drive skill allows.

The single author has frozen all four corrections. Effective completion status is
validated before persistence; owner-row locking serializes matching consent,
private writes and all erasure paths; no-retakes is enforced per current verified
fingerprint; and canonical genplan output is part of progress's transaction.
Six opt-in real PostgreSQL barrier cases are authored for answer/assessment races
against withdrawal, global erase and retention. They explicitly skip without the
disposable PostgreSQL URL, so the coordinator must enable them in the final sweep.
Static parsing and whitespace checks passed; no runtime approval is claimed.

The exact final-file delta hashes for targeted checks are recorded in
`.omc/research/dev-drive-20261102/cycle-2-targeted-fixes.json`. These checks reuse
the original two cycle-two reviewers and verify the accepted repairs; they do not
draw new lenses or launch a third cycle.

The architecture review withdrew a preliminary cron-import hypothesis after a
complete numbered read confirmed `import asyncio`; it is not a defect and causes
no source change. This withdrawal is retained to distinguish checked findings
from early hypotheses.

## Coordinator setup evidence

The migrated local API started and both the plugin local-health guard and the
adapter's exact `neos_uxqa` sentinel guard passed. Seventeen synthetic personas
were refreshed. The final UI fixture manifest contains twenty-nine API-created
entries and no failures. An initial preparer failure tried to use the intentionally
anonymous Mateo persona; its partial manifest remains preserved, and its five
marker-verified scopes were retired through audited support actions before a
successful fresh setup using the signed-in Tomas fixture.

Two coordinator helper corrections followed the immutable capture: the sentinel
read uses a Member-capable fixture while separately verifying the memberless
operator, and fixture preparation preflights required signed-in handles. These
are preparation fixes, not scored UI or model success. Their current source is
included in the final author's targeted verification request. Scored flows and
the integrated suites remain pending.
