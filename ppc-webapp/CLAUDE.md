# Orion — SEO/PPC Intelligence Platform

## Project Overview
Orion is a SaaS marketing intelligence platform for planning competitive PPC and SEO campaigns across multiple markets. Built with React 19 + TypeScript (frontend) and Express 5 + TypeScript (backend).

## Tech Stack
- **Frontend:** React 19, Vite 7, TypeScript 5.9, Lucide React icons
- **Backend:** Express 5, TypeScript, tsx runtime (no build step)
- **Database:** PostgreSQL + pgvector via Knex query builder (cosine distance via `<=>` operator, HNSW indexes)
- **APIs:** DataForSEO (keywords, SERP, backlinks), Stripe (revenue), Google Search Console, Google Analytics
- **Embeddings:** OpenAI text-embedding-3-small (1536 dimensions) for RAG, clustering, and semantic search
- **Agent Pipeline:** OpenAI Agents SDK (`@openai/agents`) with Zod v4 structured output
- **Styling:** Inline styles with COLORS constant (no CSS framework)

## Architecture

### Directory Structure
```
ppc-webapp/
  src/
    App.tsx                    # State orchestrator (~1,500 lines): non-product state, handlers, layout routing
    hooks/
      usePortfolioState.ts     # Product-scoped state management (useReducer, 7 action types)
    constants/
      colors.ts                # COLORS theme palette
      sampleData.ts            # Product 1 (Nexus AP) mock data, COUNTRY_MARKETS, INITIAL_MESSAGES
      sampleProduct2.ts        # Product 2 (Orion CRM) sample data
    components/
      ui/                      # Shared: Sparkline, IntentBadge, MetricChip
      panels/                  # 16 panel components (Table, Competitor, Visual, Campaign, CampaignBuilder, SEO, Backlinks, GSC, GA, Budget, BudgetAllocator, Revenue, Product, Audience, Timeline, Portfolio)
      sidebar/                 # 13 sidebar components (IconRail, ApiSettings, Chat, Seeds, Groups, Campaigns, Products, Audience, ProductSwitcher, ProductFormModal, ProductOnboardingWizard, KnowledgeTab)
    services/
      dataforseo.ts            # Frontend client for /api/keywords/* (proxied to Express)
      stripe.ts                # Frontend client for /api/stripe/*
      seo.ts                   # Frontend client for /api/seo/*
      onboarding.ts            # Frontend client for /api/onboarding/* (crawl + AI extraction)
      knowledge.ts             # Frontend client for /api/knowledge/* (crawl, search, clusters)
    types/
      index.ts                 # Re-exports service types
  server/
    index.ts                   # Express app: CORS, JSON, route registration, error handler
    services/
      dataforseo.ts            # DataForSEO API v3 wrapper (Google Ads, Bing, Labs endpoints)
      stripe.ts                # Stripe SDK: MRR, churn, LTV, UTM attribution, webhooks
      seo.ts                   # SEO mock data service (SERP features, backlinks, GSC, rank history, content gaps)
      ai.ts                    # OpenAI chat completions + JSON extraction + product extraction + ad copy
      crawl.ts                 # Single-page website crawler (fetch + HTML text extraction)
      db.ts                    # Knex instance (pg + pgvector), schema migrations, HNSW indexes
      embeddings.ts            # Embedding generation (text-embedding-3-small), vector storage/query, text chunking
      siteCrawler.ts           # Recursive BFS site crawler with robots.txt, chunking, embedding pipeline
      chatHistory.ts           # Persistent chat storage + RAG-augmented context retrieval
      clustering.ts            # Semantic keyword clustering (agglomerative + AI labelling)
    routes/
      keywords.ts              # /api/keywords/* — 15 endpoints for keyword research
      stripe.ts                # /api/stripe/* — metrics, attribution, timeline, webhook
      seo.ts                   # /api/seo/* — serp-features, competitors, rank-history, backlinks, gsc, content-gaps
      ai.ts                    # /api/ai/* — chat (with RAG), ad copy, content brief, ICP, persona
      onboarding.ts            # /api/onboarding/* — crawl, extract-product, generate-copy, full pipeline
      knowledge.ts             # /api/knowledge/* — site crawl management, semantic search, keyword clusters
  agents/
    pipeline.ts                # OpenAI agent pipeline: seed expansion → competitor analysis → scoring → report
    tools.ts                   # Agent tools wrapping DataForSEO endpoints
    scoring.ts                 # Keyword scoring algorithm
    types.ts                   # Pipeline config and result types
    run.ts                     # CLI entry point
```

### Key Patterns
- **Product-scoped state via usePortfolioState hook** — keywords, campaigns, channels, ICP, personas, segments, timeline, budget, seeds, groups, Bing data, competitors, and gaps are all scoped per product via `useReducer`. Wrapper setters in App.tsx maintain backward-compatible `setX(val)` and `setX(prev => ...)` API. Non-product state (messages, panelMode, API credentials, SEO data, Stripe data) remains as `useState` in App.tsx.
- **Panels are pure renderers** — each panel component under `components/panels/` receives only what it needs. No fetch logic in panels.
- **Services proxy through Express** — frontend clients call `/api/*` which the Express server handles. No direct third-party API calls from the browser.
- **Mock data for SEO** — `server/services/seo.ts` uses mock generators. Each function has a `// TODO: Replace with [API]` comment for future live implementation.
- **Multi-product portfolio** — `usePortfolioState` manages `Record<productId, ProductScopedData>`. ProductSwitcher in icon rail switches active product. PortfolioPanel shows cross-product dashboard.
- **Multi-market via COUNTRY_MARKETS** — country picker switches `targetCountry` state, which feeds into per-country live keyword research.
- **RAG-augmented chat** — Chat messages are stored with vector embeddings in PostgreSQL (pgvector). On each new message, similar past conversations and knowledge base chunks are retrieved via cosine similarity and injected into the system prompt as additional context.
- **Knowledge base via embeddings** — Recursive site crawler stores pages, chunks them, generates embeddings, and stores as `vector(1536)` columns in PostgreSQL. Semantic search uses pgvector's `<=>` cosine distance operator with HNSW indexes for fast approximate nearest neighbor search.
- **Semantic keyword clustering** — Agglomerative clustering over keyword embeddings with cosine distance threshold. Clusters are labelled by AI. Stored per product in PostgreSQL with centroid vectors.
- **Product onboarding wizard** — 4-step flow: URL → crawl + AI extract → keyword review → ad copy generation. Uses `ProductOnboardingWizard` component.

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
OPENAI_API_KEY=sk-...        # For agent pipeline, AI chat, embeddings, clustering
PORT=3001                    # Express server port
DATABASE_URL=postgres://...  # PostgreSQL connection (or use individual vars below)
PGHOST=localhost             # PostgreSQL host
PGPORT=5432                  # PostgreSQL port
PGDATABASE=orion             # PostgreSQL database name
PGUSER=postgres              # PostgreSQL user
PGPASSWORD=postgres          # PostgreSQL password
```

## Conventions
- **TypeScript strict mode** — `strict: true` in both tsconfigs
- **No CSS framework** — all styling is inline via the COLORS constant from `src/constants/colors.ts`
- **Fonts:** JetBrains Mono for data/numbers, DM Sans for UI text (loaded via Google Fonts link in App.tsx)
- **Component pattern:** Each panel/sidebar component exports a default function component with a typed Props interface
- **Icon imports:** Each component imports only the lucide-react icons it uses (no barrel import)
- **Barrel exports:** Each component directory has an `index.ts` that re-exports all components
- **Server imports use .ts extensions** — `allowImportingTsExtensions: true` in tsconfig.server.json
- **Knex query builder for PostgreSQL** — All database access uses Knex (`getDb()` returns the Knex instance). Queries use Knex's fluent API: `db('table').where().select()`, `db('table').insert().returning()`, `db('table').where().update()`, `db('table').where().del()`. For pgvector operations (cosine distance `<=>`), use `db.raw()`. Embeddings stored as `vector(1536)` columns. Database initialized at server startup via `await initDb()` which runs Knex schema migrations and creates HNSW indexes. Product/campaign state remains in-memory on the frontend. Requires PostgreSQL with the `vector` extension installed.

## Current Limitations (see docs/PRODUCT_AUDIT.md for full details)
- GSC and GA panels use mock/sample data (no real API connection)
- SEO service (SERP, backlinks, rank history) uses mock data generators
- Single-user, no auth
- No direct Google Ads API push — export CSV then import to Google Ads Editor

## When Modifying Code
- Run `npx tsc --noEmit` and `npx tsc --noEmit -p tsconfig.server.json` to check types
- Run `npx vite build` to verify production build
- Keep panel components focused on rendering — handlers stay in App.tsx
- When adding a new panel: create component in `panels/`, add to `panels/index.ts`, add mode string to tab array in App.tsx, add title mapping, add conditional render
- When adding a new API endpoint: add to `server/services/`, add route in `server/routes/`, add frontend client function in `src/services/`, register route in `server/index.ts`
