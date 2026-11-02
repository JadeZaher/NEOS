---
type: Review Synthesis
title: Cycle one advocate and adversary findings
status: revised-pending-runtime
---

# Snapshot and branches

Both independent read-only reviewers used the same immutable 142-file snapshot:
`.omc/research/dev-drive-20261102/cycle-1-snapshot/manifest.json`, SHA-256
`D21052DE6DF23F4A31FE5FD9E691C941EA0B5051CD970E1363527B15B2AE15BE`.
The successful snapshot preserves changed source bytes and deleted-file records.
Earlier failed capture directories remain separate; they were never review inputs.

| Branch | Reviewer | Lens | Stance | Result |
|---|---|---|---|---|
| A | contracts_advocate_cycle1 | Documentation and contracts | Enthusiastic advocate | Three actionable client/server integration mismatches |
| B | correctness_adversary_cycle1 | Correctness | Discriminating adversary | Two high-priority correctness failures plus the independently confirmed result-page mismatch |

Both reviewers traced the full acceptance scope and made no test, model, browser,
database or deployment calls. Their statements are source evidence, not runtime
approval. Neither changed source. They preserved the accepted historical proposal
author policy.

## Join decisions

| ID | Finding and immutable evidence | Decision and reason | Required revision/check |
|---|---|---|---|
| C1-01 | P1: quizzes.py:473 normalizes every answer/key to lowercase strings, collapsing legal distinct radio values A/a or numeric 1/string 1 | Accept: a configured wrong choice can produce a current verified passing result and admit an ordinary entrant | Typed exact choice comparison, unordered typed checkbox comparison, text-only intentional normalization; submission and client serialization regressions must preserve case and types |
| C1-02 | P1: governance_tools.py:2149 stores repair commitments as a list; conflicts.py:442 canonicalizes REST input to a mapping, and :499 later unpacks the mapping | Accept: a successfully agent-created repair can break case reads and fulfillment | Shared canonical creation preparation plus safe normalization of legacy lists on read/update/check-in; prove actual registered creation through confirmed fulfillment and legacy preservation |
| C1-03 | P2: QuizResults.tsx:57 searches only the default Member history while quizzes.py:539 stores a result against the quiz's actual ecosystem Member | Accept; independently reported by both branches: normal cross-ecosystem completion loses its result and return path | Owner-authorized result-ID lookup, actual result metadata and validated recovery on errors; cover older active A/pending B, explicit false completion, failed attempts, reload and cross-user denial |
| C1-04 | P2: OrientationJourney.tsx:91 submits the sequential next index while orientation_completion.py:71 resolves configured choice routes and :108 rejects a different destination | Accept: legitimate forward/terminal branches receive a 409 | Shared client destination helper, structured route validation, correct next/completion state and reload; enforce required evidence on the selected path |
| C1-05 | P2: JourneyAuthoring.tsx:12 uses membership-scoped ordinary quiz lookup when mounted by SupportFieldEditor.tsx:27 for a memberless global admin | Accept: the normal named quiz selector is unusable and leaves only a raw-ID fallback | Explicit audited support lookup mode by selected ecosystem, preserving ordinary steward scope; cover named selection/save/receipt with zero admin memberships |

No finding was rejected or deferred. Duplicate result-page reports are one repair,
not two defects. `operator_gap_executor` is the single revision author for the
whole accepted batch. Additional tests are authored but not run until the final
coordinated sweep. Cycle two will inspect the revised snapshot with the previously
drawn security advocate and architecture adversary lenses; no recursive tree or
repeated lens is added.

The revision author has frozen all five fixes, including exact typed grading with
verification version `survey-completion-v2-typed-grading`, canonical legacy repair
normalization, owner-only result-ID lookup, selected-path journey navigation and
audited support-mode quiz lookup. Static parsing passed for twelve Python files
and fifteen TypeScript/TSX files; the authored browser script parses and whitespace
checks pass. These are author static checks only. Runtime claims remain pending.
The complete handoff is `.omc/research/dev-drive-20261102/cycle-1-revision-handoff.md`.
