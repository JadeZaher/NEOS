---
type: UX Lane Report
title: Mobile explanations and keyboard orientation
---

Both scoped journeys completed using visible UI only, three-attempt budgets, and finished uxSession traces. Exactly two live assistant messages were sent, both by Priya. Kofi sent none. No source inspection, direct API calls, pointer workaround, exhausted attempt, or abandonment occurred.

| Persona | Outcome | Seconds | Clicks | Dead/rage | Failed attempts | Workarounds | Friction |
|---|---|---:|---:|---:|---:|---:|---:|
| qa-new-priya, 390×844 | COMPLETED | 114 | 12 | 0/0 | 0 | 0 | 2 |
| qa-new-kofi, keyboard only | COMPLETED | 190 | 14 | 0/0 | 0 | 0 | 2 |

## Priya

Started at `/`, opened visible Communications, and selected AI Chat. The exact first prompt was `wat is consent here do i have to vote`. The response explicitly explained that consent is not a vote, means no reasoned objection, and includes stand aside for concerns that do not block the change. It described objection and resolution as well. The second and final prompt was `how do i leave this place`. The response said leaving is voluntary and has no penalty, then listed filing an exit, standard 30-day or urgent 7-day handoff, handing over roles/agreements/commitments with a coordinator, portable governance-record export, and steward confirmation. Both required content sets were present and presented in short paragraphs/lists. Possible remaining wording friction for low-literacy participants: “reasoned objection” and “shared aims” are specialized terms; the first answer did not directly say whether recording a position is optional. This is a content hypothesis, not a demonstrated blocker.

At 390×844 the collapsed panel was x16/y169.2, 358×590.8; expanded was x16/y42.6, 358×717.4. Composer was x28/y680, 286×68 in both states; the 44×44 close control stayed within the viewport. Closing/reopening, expanding/minimizing, then following sidebar Messaging and reopening AI Chat preserved both answers and the unsent `my unsent question` draft. Agent availability on Messaging was confirmed; no third message was sent.

Evidence: `runs/qa-new-priya--constrained-consent-exit-mobile/trace.zip`, `ux.json`, `consent-answer-390.png`, `exit-answer-390.png`, `expanded-draft-390.png`, `messaging-agent-draft-390.png`. Visible transcript and measured bounds: `runs/priya-content-and-layout.json`.

## Kofi

All activation used Tab/Enter/Space. Community expansion exposed Members, Domains, Ecosystems, but no Orientation entry. The visible Dashboard shortcut labeled Orientation opened the OmniOne dossier. Its Open orientation button opened Choose Your Journey. Selecting OmniOne Ready to Join and Start Journey reached an actual `/orientation/<UI-observed-id>/journey`, Step 1 of 4, Quick Welcome. This was a journey, not the entry quiz. The dossier separately displayed Participation consent; that consent did not block starting the orientation path. The welcome video could not load; its visible continue-without-video checkbox worked with Space and Continue reached Step 2, Your Skills & Interests.

Keyboard navigation through Discover exposed Plan Systems. Its dossier said starting a journey asks to join, and separately offered Join and consent to participate. The first keyboard Begin activated the first Explorer link, so the landing initially selected Explorer. Kofi then explicitly chose the visible Plan Systems Ready to Join card and activated Join and start journey. After Joining…, the UI reached the actual Plan Systems journey, Step 1 of 4, Quick Start. It again offered a working keyboard fallback for the unavailable video; continuing reached Step 2, Your Skills. The sidebar now offered Plan Systems as a current ecosystem option, while the header remained OmniOne. No participation-consent modal or agreement-consent gate interrupted this path. This observed result does not establish how agreement-required ecosystems behave.

Evidence: `runs/qa-new-kofi--keyboard-plan-systems-orientation/trace.zip`, `ux.json`, `orientation-landing-keyboard.png`, `ready-to-join-started-keyboard.png`, `ready-to-join-second-step.png`, `plan-participation-consent.png`, `plan-join-first-settled.png`, `plan-step-two-keyboard.png`. Accessible UI captures: `runs/kofi-orientation-evidence.json`.

## Visible friction and limits

No concrete blocker prevented the two scoped goals. Both welcome videos displayed “This video could not be loaded”; both had recoverable keyboard fallbacks. Each run recorded one console resource failure, `net::ERR_NETWORK_ACCESS_DENIED`, on `/`; the lane did not establish which resource it affected. No HTTP failures were recorded. Metrics do not count the video fallback as a workaround because it is an offered product path. No journey completion or quiz completion is claimed: Kofi intentionally stopped at the skills step after proving real journey entry and fallback navigation.

Saved flow: `flows/constrained/observed-flow.mjs` (syntax checked with `node --check`, exit 0). It contains exactly two Send message activations; replay would spend two more real assistant messages and mutate the two QA personas' orientation state, so it was not replayed. The run artifacts and traces are the evidence of this execution.
