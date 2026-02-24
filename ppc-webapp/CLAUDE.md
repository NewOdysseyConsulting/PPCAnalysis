# Orion — SEO/PPC Intelligence Platform

## Project Overview
Orion is a SaaS marketing intelligence platform for planning competitive PPC and SEO campaigns across multiple markets. Built with React 19 + TypeScript (frontend) and Express 5 + TypeScript (backend).

## Tech Stack
- **Frontend:** React 19, Vite 7, TypeScript 5.9, Lucide React icons
- **Backend:** Express 5, TypeScript, tsx runtime (no build step)
- **APIs:** DataForSEO (keywords, SERP, backlinks), Stripe (revenue), Google Search Console, Google Analytics
- **Agent Pipeline:** OpenAI Agents SDK (`@openai/agents`) with Zod v4 structured output
- **Styling:** Inline styles with COLORS constant (no CSS framework)

## Architecture

### Directory Structure
```
ppc-webapp/
  src/
    App.tsx                    # State orchestrator (~1,279 lines): all state, handlers, layout routing
    constants/
      colors.ts                # COLORS theme palette
      sampleData.ts            # All mock/sample data, COUNTRY_MARKETS, INITIAL_MESSAGES
    components/
      ui/                      # Shared: Sparkline, IntentBadge, MetricChip
      panels/                  # 11 panel components (Table, Competitor, Visual, Campaign, SEO, Backlinks, GSC, GA, Budget, Revenue, Product)
      sidebar/                 # 7 sidebar components (IconRail, ApiSettings, Chat, Seeds, Groups, Campaigns, Products)
    services/
      dataforseo.ts            # Frontend client for /api/keywords/* (proxied to Express)
      stripe.ts                # Frontend client for /api/stripe/*
      seo.ts                   # Frontend client for /api/seo/*
    types/
      index.ts                 # Re-exports service types
  server/
    index.ts                   # Express app: CORS, JSON, route registration, error handler
    services/
      dataforseo.ts            # DataForSEO API v3 wrapper (Google Ads, Bing, Labs endpoints)
      stripe.ts                # Stripe SDK: MRR, churn, LTV, UTM attribution, webhooks
      seo.ts                   # SEO mock data service (SERP features, backlinks, GSC, rank history, content gaps)
    routes/
      keywords.ts              # /api/keywords/* — 15 endpoints for keyword research
      stripe.ts                # /api/stripe/* — metrics, attribution, timeline, webhook
      seo.ts                   # /api/seo/* — serp-features, competitors, rank-history, backlinks, gsc, content-gaps
  agents/
    pipeline.ts                # OpenAI agent pipeline: seed expansion → competitor analysis → scoring → report
    tools.ts                   # Agent tools wrapping DataForSEO endpoints
    scoring.ts                 # Keyword scoring algorithm
    types.ts                   # Pipeline config and result types
    run.ts                     # CLI entry point
```

### Key Patterns
- **State lives in App.tsx** — all ~50 state variables and ~15 handler functions. Panels receive data via props.
- **Panels are pure renderers** — each panel component under `components/panels/` receives only what it needs. No fetch logic in panels.
- **Services proxy through Express** — frontend clients call `/api/*` which the Express server handles. No direct third-party API calls from the browser.
- **Mock data for SEO** — `server/services/seo.ts` uses mock generators. Each function has a `// TODO: Replace with [API]` comment for future live implementation.
- **Multi-market via COUNTRY_MARKETS** — country picker switches `targetCountry` state, which recalculates all derived data (keywords, GSC, GA) from the per-country sample data.

### Running the App
```bash
npm run dev          # Vite dev server (frontend only, port 5173)
npm run server       # Express backend (port 3001)
npm run dev:all      # Both concurrently
npm run pipeline     # Run agent keyword research pipeline (CLI)
npm run build        # Vite production build
```

### Environment Variables
```
DATAFORSEO_LOGIN=...         # DataForSEO API credentials
DATAFORSEO_PASSWORD=...
STRIPE_SECRET_KEY=sk_...     # Stripe API key
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...        # For agent pipeline
PORT=3001                    # Express server port
```

## Conventions
- **TypeScript strict mode** — `strict: true` in both tsconfigs
- **No CSS framework** — all styling is inline via the COLORS constant from `src/constants/colors.ts`
- **Fonts:** JetBrains Mono for data/numbers, DM Sans for UI text (loaded via Google Fonts link in App.tsx)
- **Component pattern:** Each panel/sidebar component exports a default function component with a typed Props interface
- **Icon imports:** Each component imports only the lucide-react icons it uses (no barrel import)
- **Barrel exports:** Each component directory has an `index.ts` that re-exports all components
- **Server imports use .ts extensions** — `allowImportingTsExtensions: true` in tsconfig.server.json
- **No ORM/database** — all data is in-memory or from external APIs. No persistence layer yet.

## Current Limitations (see docs/PRODUCT_AUDIT.md for full details)
- All "Edit", "Export", "Add", "Duplicate" buttons are non-functional UI placeholders
- No CSV/PDF export capability
- Campaign builder is read-only with hardcoded sample data
- No LLM integration in chat (routing only)
- GSC and GA panels use mock/sample data (no real API connection)
- SEO service (SERP, backlinks, rank history) uses mock data generators
- Single-user, no auth, no persistence

## When Modifying Code
- Run `npx tsc --noEmit` and `npx tsc --noEmit -p tsconfig.server.json` to check types
- Run `npx vite build` to verify production build
- Keep panel components focused on rendering — handlers stay in App.tsx
- When adding a new panel: create component in `panels/`, add to `panels/index.ts`, add mode string to tab array in App.tsx, add title mapping, add conditional render
- When adding a new API endpoint: add to `server/services/`, add route in `server/routes/`, add frontend client function in `src/services/`, register route in `server/index.ts`
