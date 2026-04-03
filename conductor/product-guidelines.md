# NEOS Product Guidelines

## Brand Voice & Tone

**Structural clarity over inspirational language.** NEOS communicates like an engineering specification, not a manifesto. The tone is precise, evidence-based, and grounded in real governance mechanics.

- Use concrete language: "this process requires consent from all affected parties" not "we believe in collective wisdom"
- Name failure modes explicitly: "capital capture" not "potential misalignment"
- Reference structural mechanisms, not values or aspirations
- Treat governance as engineering, not philosophy

## Design Standards

### Frontend (React App)

- **Design System**: Material Design foundation with educational platform patterns (Notion, Canvas, Linear)
- **Typography**: Inter for UI, JetBrains Mono for data/code
- **Color**: Calm blue primary (220 85% 55%), purple secondary (265 70% 60%)
- **Layout**: Information hierarchy through typography and spacing, progressive disclosure for complexity
- **Components**: shadcn/ui + Radix primitives
- **CSS**: Tailwind CSS exclusively — no custom CSS files

### Backend Dashboard (Sanic/Datastar)

- **CSS**: Tailwind CSS only — no custom CSS files, no CSS custom properties
- **Interactivity**: Datastar SSE-first hypermedia (11KB JS)
- **Templates**: Jinja2 server-rendered

## Communication Style

- Lead with the structural problem, then the mechanism that solves it
- Every skill document follows the 12-section format (A through L)
- Governance terms use NEOS vocabulary: ETHOS (autonomous units), Current-Sees (influence currency), ACT (Advice/Consent/Test), SHUR (physical spaces)
- Error messages and UI copy should be actionable and specific

## Quality Bar

- No governance skill deploys without passing all 7 stress-test scenarios
- UI components must meet WCAG AA accessibility standards (4.5:1 contrast ratio)
- All API endpoints documented with request/response schemas
