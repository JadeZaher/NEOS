# NEOS Tech Stack

## Architecture

**Monorepo with BFF (Backend For Frontend)**

```
NEOS/
├── neos-operating-system/     # Backend + governance skills
│   ├── agent/                 # Python/Sanic API (BFF layer)
│   │   ├── src/neos_agent/    # Application code
│   │   ├── tests/             # Backend tests
│   │   └── alembic/           # Database migrations
│   ├── neos-core/             # 54 governance skill modules (markdown + YAML)
│   └── scripts/               # Validation & utility scripts
├── charting-the-course/       # Frontend React app
│   ├── client/src/            # React components
│   └── server/                # Express dev server (to be replaced by Sanic API)
└── conductor/                 # Project management context
```

## Backend (neos-operating-system/agent/)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | >=3.12 | Runtime |
| Sanic | 25.x | Async web framework (BFF API) |
| SQLAlchemy | 2.0+ | Async ORM |
| Alembic | 1.13+ | Database migrations |
| Anthropic SDK | 0.40+ | Claude API for governance AI agent |
| pydantic-settings | 2.0+ | Configuration management |
| PostgreSQL | 16+ | Production database (via Railway) |
| SQLite | — | Local development database |

## Frontend (charting-the-course/)

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Styling (exclusively) |
| shadcn/ui + Radix | — | Component library |
| TanStack Query | 5.x | Server state management |
| wouter | 3.x | Client-side routing |
| react-hook-form + zod | — | Form handling & validation |
| Drizzle ORM | 0.39 | (Being removed — migrating to Sanic API) |
| Recharts | 2.x | Data visualization |
| Framer Motion | 11.x | Animations |

## Governance Skill Stack (neos-core/)

| Technology | Purpose |
|-----------|---------|
| Markdown | Skill definitions (SKILL.md) |
| YAML | Frontmatter, configuration schemas |
| Python 3.14 | Validation scripts (stdlib only, zero dependencies) |

## Deployment

| Service | Purpose |
|---------|---------|
| Railway | Hosting (API + frontend), PostgreSQL database |
| Git | Version control (monorepo) |

## Removing

- **Supabase** — Being replaced by Railway PostgreSQL + Sanic API
- **Express backend** — Being replaced by Sanic BFF API
- **Drizzle ORM** — Frontend will call Sanic API instead of direct DB access
- **Neon serverless** — Replaced by Railway PostgreSQL

## CSS Rule

All styling uses Tailwind CSS utility classes exclusively. No custom CSS files, no CSS custom properties. Both frontend and backend dashboard follow this rule.
