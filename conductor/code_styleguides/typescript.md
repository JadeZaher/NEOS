# TypeScript Style Guide — NEOS Frontend

## General
- TypeScript 5.6 strict mode
- React 18 with functional components and hooks
- No `any` types — use `unknown` and narrow

## Formatting
- 2-space indentation
- Max line length: 100 characters
- Single quotes for strings
- Semicolons required
- Trailing commas in multiline

## Components
- Functional components only (no class components)
- Props interfaces named `<ComponentName>Props`
- Use `React.FC` sparingly — prefer explicit return types
- Co-locate styles, tests, and types with components

## State Management
- TanStack Query for server state
- React state/context for UI state only
- No global state libraries unless complexity demands it

## Naming
- `PascalCase` for components and types
- `camelCase` for functions, variables, hooks
- `UPPER_CASE` for constants
- Hooks prefixed with `use`

## API Integration
- All API calls through TanStack Query hooks
- Centralized API client hitting Sanic BFF endpoints
- Zod schemas for runtime response validation
