---
type: Change Record
title: Public NEOS introduction and About discoverability
status: deployed-and-verified
---

The existing About page was public but absent from the community directory navigation. Visitors now see a concise NEOS introduction before Find a community, with an About NEOS link on the directory and individual community previews. About explains this site's purpose, identifies ecosystems as communities, and links to community discovery from its navigation, introduction and closing action. Sign-in stays available.

The implementation follows C:/Users/atooz/.gemini/UI-UX-guidance.md and changes only About.tsx and Communities.tsx. Existing routes and joining requirements remain intact. An independent source reviewer found no release-blocking issues.

Validation:171 frontend tests passed; TypeScript, production build and34-pair contrast audit passed. Local desktop1366px and mobile390px browser journeys verified introduction, keyboard About navigation, return to discovery and About links on community previews, with no horizontal overflow or mutating requests. The initial probe used a nonexistent main element; it was corrected to the existing #main-content container and passed. Both logs are retained privately in .omc/research/about-*20261103*.

Railway deployment01b9b7c6-6a10-4aa8-bc05-8e372bf58b37 succeeded for frontend commit195ac8b9f9eecf229422ec5e0e60ff3d7b1df721. The same desktop and mobile keyboard/navigation/overflow checks passed on https://neos.primusneo.com with zero mutating requests. Public /about remains accessible without signing in.
