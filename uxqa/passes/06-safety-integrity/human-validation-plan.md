---
type: Research Validation Plan
title: Carried research questions and human evidence requirements
status: not-executed
---

# Evidence boundary

No human participants have been recruited or observed in this pass. Automated
persona flows, reading-level heuristics and axe results can identify defects and
test behavior, but cannot establish human comprehension, screen-reader usability
or informed approval. The owner asked that decisions needing their involvement
be recorded rather than interrupting independent implementation; recruitment and
research operations remain deferred in the track's decision ledger.

The three open pass-05 research questions remain unchanged in that historical
ledger. This plan carries them into pass 06 and 07 rather than silently closing
them because source fixes or simulated journeys pass.

| Question | Segment and sample | Observation | Decision evidence |
|---|---|---|---|
| p5-reading-level: can a new reader act on the assistant's explanation? | Five new/simple-language readers | First-attempt explanation of advice, concern versus objection and voluntary exit; then configured learning check and next action | Ask participants to explain who acts, what changes and whether leaving needs permission; compare comprehension with the unchanged grade-eight heuristic |
| p5-human-accessibility-trust: can constrained users navigate and recover? | Five keyboard/assistive-technology users, including actual screen-reader users | Signup requirements, failed check feedback, scope return, orientation history, directory opt-out and action review at mobile/zoom constraints | Record focus loss, unannounced errors, inability to find the next step, attempts, workarounds and abandonment; automated AA findings remain separate |
| p5-human-accessibility-trust: do support operators understand authority and public receipts? | Five technical-support operators assisting another organization | Memberless admin navigation, quiz exemption, configured role assignment, reviewed correction, matching-policy publication and public receipt | Ask who is acting, whose membership changes, what is public, what was confirmed and how to recover from a wrong selection; distinguish ordinary participation from support authority |
| p5-video-network: is playback failure caused by the application or the restricted environment? | Normal-network technical probe plus observation in the newcomer sessions | Load the actual configured video source, then reproduce an unavailable source and use the learning fallback | Capture network/error outcome and usable fallback separately; a working fallback does not prove successful upstream playback |

Use the same task wording and finite attempt budgets across each segment. Obtain
consent before recording, avoid real governance actions, and use disposable test
organizations and recipients. Choose recruitment, recording retention and session
scheduling with the owner before contacting anyone. Report findings as observed
counts and examples; a small purposive sample does not establish population rates.
