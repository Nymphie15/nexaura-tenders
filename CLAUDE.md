# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

Frontend for **Nexaura Appel d'Offre Automation** — a SaaS platform that automates French public procurement (appels d'offres) using multi-agent AI. This is the Next.js web client that connects to a FastAPI backend.

**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui (Radix), Zustand 5, TanStack React Query 5

## Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint

# Tests
npm run test:run         # All tests (Vitest)
npm run test:unit        # Unit tests only
npm run test:ui-components  # UI component tests
npm run test:forms       # Form component tests
npm run test:realtime    # WebSocket/realtime tests
npm run test:e2e         # Playwright E2E
npm run test:coverage    # Coverage report

# Single test file
npx vitest run src/__tests__/hooks/use-templates.test.ts
npx vitest run path/to/test.ts --reporter=verbose
```

## Architecture

### API Communication

All API calls go through a single Axios instance in `src/lib/api/client.ts`:
- **Base URL** auto-appends `/api/v2` (Phase 2 domain consolidation)
- Dev proxy in `next.config.ts` rewrites `/api/v2/*` and `/ws/*` to `http://localhost:8000`
- JWT token from `localStorage` injected via request interceptor
- Auto-retry (3x exponential backoff) on 502, 503, network errors
- CSRF token from cookie on mutating requests
- `X-Trace-Id` (per session) + `X-Request-Id` (per request) for correlation
- 401 triggers token refresh queue, then force-logout

**Endpoint definitions** are centralized in `src/lib/api/endpoints.ts` — 24 exported API objects (authApi, tendersApi, workflowApi, hitlApi, templatesApi, etc.). All paths are **relative** (e.g., `/templates/`, not `/api/v2/templates/`) because the Axios baseURL already includes `/api/v2`.

### Route Protection

`src/middleware.ts` checks for `auth_presence` cookie (set by auth-store on login). No cookie → redirect to `/login?redirect=<path>`. JWT validation is server-side on the backend.

### State Management

- **Server state:** TanStack React Query (hooks in `src/hooks/use-*.ts`)
- **Client state:** Zustand stores in `src/stores/`:
  - `auth-store.ts` — JWT tokens, user, login/logout (persisted to localStorage)
  - `preferences-store.ts` — Language (fr/en), notification prefs, date format (persisted)
  - `notification-store.ts` — In-app notification list, unread count
  - `copilot-store.ts` — AI copilot panel state, conversation history
  - `extension-store.ts` — Browser extension integration
  - `eval-history-store.ts` — LLM evaluation run history

### Route Structure (App Router)

Two route groups:
- `(auth)/` — Login, register, forgot-password (no sidebar)
- `(dashboard)/` — All authenticated pages (with sidebar layout)

Key pages: `/` (dashboard), `/tenders`, `/workflows`, `/hitl`, `/opportunities`, `/templates`, `/analytics`, `/audit`, `/settings`, `/company`, `/projects`, `/responses`, `/decisions`

Dynamic routes: `/tenders/[id]`, `/workflows/[caseId]`, `/hitl/[caseId]/[checkpoint]`, `/tenders/[id]/edit/[filename]`

### Styling

Tailwind CSS 4 configured via PostCSS (no `tailwind.config.ts`). Design tokens defined in `src/app/globals.css` via `@theme inline` blocks. Custom utilities: `.glass`, `.glow-primary`, `.hover-lift`, `.text-gradient`, `.card-premium`.

UI components: shadcn/ui pattern (Radix primitives in `src/components/ui/`), Tremor for dashboard charts, Recharts, Framer Motion for animations.

### Path Alias

`@/*` maps to `./src/*` (tsconfig paths).

## Key Patterns

### Adding a new API endpoint

1. Add the endpoint function in `src/lib/api/endpoints.ts` using the shared `api` instance
2. Create a React Query hook in `src/hooks/use-<feature>.ts`
3. Use relative paths (e.g., `/templates/stats`) — the `/api/v2` prefix is automatic

### Adding a new page

1. Create `src/app/(dashboard)/<route>/page.tsx`
2. The `(dashboard)/layout.tsx` provides the sidebar and auth guard
3. Use hooks from `src/hooks/` for data fetching

### Backend connection

The backend (FastAPI) runs on port 8000. In dev, `next.config.ts` proxies:
- `/api/v2/*` → `http://localhost:8000/api/v2/*`
- `/ws/*` → `http://localhost:8000/ws/*`

Start the backend first: `docker compose up -d` from the project root.

## Services & Ports

| Port | Service |
|------|---------|
| 3000 | Next.js frontend (dev) |
| 8000 | FastAPI backend |
| 8443 | Kong API Gateway |
| 5433 | PostgreSQL (host port) |
| 6379 | Redis |
| 6333 | Qdrant |

## Testing

- **Unit/Integration:** Vitest + Testing Library + jsdom (52 test files in `src/__tests__/`)
- **E2E:** Playwright (specs in `tests/e2e/`)
- Tests are organized by domain: `auth/`, `hooks/`, `components/forms/`, `components/layout/`, `stores/`, `realtime/`, `lib/`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: empty, proxy handles it in dev) |
| `BACKEND_URL` | Backend URL for dev proxy rewrites (default: `http://localhost:8000`) |

## Backend Context

The backend is a FastAPI app with:
- 6 domain routers under `/api/v2` (auth, dce, workflow, documents, sourcing, admin)
- LLM orchestration via Qwen models on Ollama Cloud (3-tier: 27B/80B/122B)
- LangGraph workflow engine (10 phases, 2 HITL checkpoints — fail-closed)
- PostgreSQL 15 + Redis 7 + Qdrant (vector DB)
- Full backend docs: see `CLAUDE.md` at the project root
