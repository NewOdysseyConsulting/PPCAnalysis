# Orion Platform: Implementation Roadmap

## Overview

7-phase plan to transform Orion from a read-only research tool into a full multi-channel campaign planning platform. Each phase is independently buildable, with later phases depending on earlier type definitions.

---

## Dependency Graph

```
Phase 1 (Export)            ── no dependencies, start immediately
Phase 2 (Campaign Builder)  ── no dependencies, start immediately
Phase 3 (Budget Allocator)  ── depends on Phase 2 types (Campaign)
Phase 4 (AI Assistant)      ── no dependencies, start immediately
Phase 5 (Audience/Persona)  ── depends on Phase 2 + Phase 4
Phase 6 (Paid Social)       ── depends on Phase 3 + Phase 5
Phase 7 (Timeline/Roadmap)  ── depends on Phase 2 + Phase 3 + Phase 6
```

Phases 1, 2, and 4 can begin in parallel.

---

## Phase 1: Export System

**Complexity:** Medium | **Dependencies:** None

### Goal
Enable users to get data out — CSV for any panel, Google Ads Editor format for campaigns, PDF reports.

### New Files

| File | Purpose |
|------|---------|
| `src/services/export.ts` | Client-side CSV, Google Ads Editor, and PDF generation |
| `server/routes/export.ts` | Stub for future server-side PDF (`POST /api/export/pdf` → 501) |
| `server/services/export.ts` | Stub: `generatePdfBuffer()` with TODO for puppeteer |

### Types (add to `src/types/index.ts`)

```typescript
export interface ExportConfig {
  format: 'csv' | 'google-ads-editor' | 'pdf';
  panelMode: string;
  filename?: string;
}

export interface PdfReportSection {
  title: string;
  type: 'table' | 'summary' | 'chart-placeholder';
  data: Record<string, unknown>[];
  columns?: string[];
}

export interface GoogleAdsEditorRow {
  Campaign: string;
  AdGroup: string;
  Keyword: string;
  MatchType: string;
  MaxCPC: string;
  HeadlinePart1?: string;
  HeadlinePart2?: string;
  HeadlinePart3?: string;
  Description?: string;
  Description2?: string;
  FinalURL?: string;
  Status: string;
}
```

### Export Service Functions (`src/services/export.ts`)

- `generateCsv(headers, rows)` → CSV string
- `downloadCsv(filename, headers, rows)` → Blob + temporary anchor download
- `generateGoogleAdsEditorCsv(campaigns, market)` → Google Ads Editor format
- `downloadGoogleAdsEditor(campaigns, market, filename?)` → trigger download
- `generatePdfHtml(sections, meta)` → printable HTML document
- `downloadPdf(sections, meta)` → `window.print()` (no heavy PDF library)

### Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Import export functions, wire Export buttons in panel headers, add `handleExportPdf` callback |
| `src/components/sidebar/CampaignsTab.tsx` | Wire Export button (line 113) to `onExport` prop |
| `server/index.ts` | Register `app.use("/api/export", exportRouter)` |

---

## Phase 2: Editable Campaign Builder

**Complexity:** High | **Dependencies:** None

### Goal
Full CRUD for campaigns: create/edit campaigns, ad groups, ad copy, keyword match types, bid strategies, landing pages, negative keywords.

### Types (add to `src/types/index.ts`)

```typescript
type MatchType = 'broad' | 'phrase' | 'exact';
type BidStrategy = 'manual-cpc' | 'target-cpa' | 'target-roas' | 'maximize-clicks' | 'maximize-conversions';
type CampaignStatus = 'draft' | 'active' | 'paused' | 'archived';

interface CampaignKeyword {
  keyword: string;
  matchType: MatchType;
  maxCpc?: number;
  finalUrl?: string;
}

interface NegativeKeyword {
  keyword: string;
  matchType: MatchType;
  level: 'campaign' | 'ad-group';
}

interface AdGroup {
  id: string;
  name: string;
  keywords: CampaignKeyword[];
  negativeKeywords: NegativeKeyword[];
  headlines: string[];        // max 15, each ≤30 chars
  descriptions: string[];     // max 4, each ≤90 chars
  finalUrl?: string;
  mobileFinalUrl?: string;
  displayPath1?: string;
  displayPath2?: string;
}

interface BidConfig {
  strategy: BidStrategy;
  targetCpa?: number;
  targetRoas?: number;
  maxCpcLimit?: number;
  dailyBudget: number;
}

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  adGroups: AdGroup[];
  negativeKeywords: NegativeKeyword[];
  bidConfig: BidConfig;
  targetCountries: string[];
  landingPageUrl?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/panels/CampaignBuilderPanel.tsx` | Full replacement for CampaignPanel with edit capabilities |

### CampaignBuilderPanel Sections

1. **Campaign Header** — editable name, status dropdown, bid strategy selector
2. **Bid Config Card** — strategy dropdown, daily budget input, conditional target CPA/ROAS inputs, max CPC limit
3. **Ad Group List** — collapsible sections, each containing:
   - Editable name
   - **Keyword Editor** — match type toggle pills (`[broad]` `"phrase"` `[exact]`), optional max CPC, add from keyword table
   - **Negative Keywords** — expandable, same match type pills, add/remove
   - **Headline Editor** — 3+ text inputs with `/30` character counter, +/- buttons
   - **Description Editor** — 2+ text inputs with `/90` character counter, +/- buttons
   - **Landing Page** — URL input with validation
   - **Ad Preview** — Google SERP-style preview (existing pattern, now with live editable state)
4. **Add Ad Group** button
5. **Campaign-Level Negative Keywords** — expandable section

### Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Replace `campaigns` state type → `Campaign[]`, add CRUD handlers (`handleCreateCampaign`, `handleUpdateCampaign`, `handleDeleteCampaign`, `handleAddAdGroup`, `handleRemoveAdGroup`, `handleUpdateAdGroup`, `handleAddKeywordToCampaign`), render CampaignBuilderPanel |
| `src/constants/sampleData.ts` | Update `SAMPLE_CAMPAIGNS` to match new `Campaign` type |
| `src/components/panels/index.ts` | Export CampaignBuilderPanel |
| `src/components/sidebar/CampaignsTab.tsx` | Wire New Campaign, Edit, Delete, Duplicate buttons |

### Backend
No backend — campaign data lives in client state. Persistence is a future concern.

---

## Phase 3: Cross-Channel Budget Allocator

**Complexity:** Medium-High | **Dependencies:** Phase 2 (Campaign types)

### Goal
Split budget across Google/Bing/Social/Display/Content. Per-channel ROI projections. Channel mix optimization.

### Types (add to `src/types/index.ts`)

```typescript
type Channel = 'google-ads' | 'bing-ads' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'display' | 'content';

interface ChannelConfig {
  channel: Channel;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  budgetPercent: number;      // 0-100, must sum to 100
  budgetAbsolute: number;     // derived: totalBudget * percent / 100
  estimatedCtr: number;
  estimatedConvRate: number;
  estimatedCpc: number;
  estimatedCpm?: number;      // for display/social
  audienceSize?: number;
  notes: string;
}

interface ChannelProjection {
  channel: Channel;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
  budget: number;
}

interface BudgetAllocation {
  totalBudget: number;
  channels: ChannelConfig[];
  projections: ChannelProjection[];
  optimizedMix?: ChannelConfig[];
}
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/panels/BudgetAllocatorPanel.tsx` | Multi-channel budget allocation UI |
| `server/routes/budget.ts` | `POST /api/budget/optimize` |
| `server/services/budget.ts` | Mock channel mix optimization |
| `src/services/budget.ts` | Frontend budget optimization client |

### BudgetAllocatorPanel Sections

1. **Total Budget Input** — slider (same pattern as BudgetPanel)
2. **Channel Allocation Grid** — per-channel: color bar, percentage slider, absolute amount, enable/disable toggle. Auto-normalizes to 100%.
3. **Per-Channel Config Cards** — expandable, with CTR/ConvRate/CPC/CPM override inputs
4. **Projections Table** — cross-channel comparison: Channel | Budget | Impressions | Clicks | Conversions | CPA | Revenue | ROAS
5. **Channel Mix Optimizer** — stacked bar showing current vs optimized mix (mock: shift toward highest-ROAS channels)
6. **Audience Overlap Warning** — banner for Google/Bing/social overlap

### Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `channelConfigs` state, `panelMode: "allocator"`, render BudgetAllocatorPanel |
| `src/constants/sampleData.ts` | Add `SAMPLE_CHANNEL_CONFIGS` (8 channels with defaults) |
| `src/components/sidebar/ChatTab.tsx` | Add "allocator" panel mode button |
| `src/components/panels/index.ts` | Export BudgetAllocatorPanel |
| `server/index.ts` | Register budget router |

---

## Phase 4: AI Assistant

**Complexity:** High | **Dependencies:** None (but enhanced by Phase 2 campaign data)

### Goal
Replace hardcoded chat responses with real LLM integration. Ad copy generation, keyword strategy analysis, content briefs, campaign structure suggestions. Uses existing OpenAI Agents SDK.

### Types (add to `src/types/index.ts`)

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'assistant';
  content: string;
  timestamp: Date;
  action?: () => void;
  data?: any;
  streaming?: boolean;
  toolCalls?: { name: string; status: 'pending' | 'complete'; result?: string }[];
}

interface AiChatRequest {
  message: string;
  history: { role: string; content: string }[];
  context: {
    product?: any;
    keywordsSummary?: { count: number; avgCpc: number; topKeywords: string[] };
    campaignsSummary?: { count: number; totalKeywords: number };
    market?: { code: string; name: string; currency: string };
    budgetMonthly?: number;
  };
}

interface AiChatResponse {
  message: string;
  suggestedAction?: {
    type: 'switch-panel' | 'add-keywords' | 'create-campaign' | 'update-budget';
    payload: any;
  };
  toolResults?: { name: string; result: string }[];
}
```

### New Files

| File | Purpose |
|------|---------|
| `server/routes/ai.ts` | 4 endpoints: `/api/ai/chat`, `/generate-copy`, `/content-brief`, `/campaign-suggest` |
| `server/services/ai.ts` | OpenAI Agents SDK integration: agent definition, tools, system prompt with context |
| `src/services/ai.ts` | Frontend client: `sendChatMessage()`, `generateAdCopy()`, `generateContentBrief()`, `suggestCampaignStructure()` |

### Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/chat` | POST | General chat with keyword/campaign/market context |
| `/api/ai/generate-copy` | POST | Ad copy: headlines + descriptions from keywords + product |
| `/api/ai/content-brief` | POST | Content brief from keyword + product + competitors |
| `/api/ai/campaign-suggest` | POST | Campaign structure suggestion from keyword groups |

### Agent Tools (in `server/services/ai.ts`)

Follow the pattern from `agents/tools.ts` — each tool defined with `tool()` from `@openai/agents`:
- `generate_ad_copy` — given keywords + product, return headlines/descriptions
- `analyze_keyword_cluster` — group keywords by intent, suggest strategy
- `write_content_brief` — generate SEO content brief
- `suggest_campaign_structure` — organize keywords into campaigns/ad groups

### Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Replace `handleSend` (lines 759-937) — keep shortcut routing for API triggers, everything else → `sendChatMessage()`. Add `chatHistory` state, `handleGenerateAdCopy` callback |
| `src/components/sidebar/ChatTab.tsx` | Streaming text display, tool call status indicators ("Analyzing keywords...", "Generating copy...") |
| `src/components/panels/CampaignBuilderPanel.tsx` | "Generate with AI" button on headline/description sections (Phase 2 integration) |
| `server/index.ts` | Register `app.use("/api/ai", aiRouter)` |

---

## Phase 5: Audience & Persona Builder

**Complexity:** Medium | **Dependencies:** Phase 2 + Phase 4

### Goal
ICP builder, buyer persona framework, audience segmentation, per-channel targeting configuration.

### Types (add to `src/types/index.ts`)

```typescript
interface IcpProfile {
  id: string;
  name: string;
  companySize: { min: number; max: number; label: string };
  industry: string[];
  revenue: { min: number; max: number; currency: string };
  geography: string[];
  techStack: string[];
  painPoints: string[];
  buyingTriggers: string[];
  decisionMakers: string[];
  budgetRange: { min: number; max: number; currency: string };
}

interface BuyerPersona {
  id: string;
  name: string;         // e.g., "Sarah the Financial Controller"
  title: string;
  department: string;
  seniority: 'c-suite' | 'director' | 'manager' | 'individual-contributor';
  goals: string[];
  painPoints: string[];
  objections: string[];
  triggers: string[];
  informationSources: string[];
  decisionCriteria: string[];
  icpId: string;
}

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  size: number;
  channelTargeting: Record<Channel, ChannelTargetingConfig>;
}

interface ChannelTargetingConfig {
  enabled: boolean;
  targeting: { type: string; values: string[] }[];
  exclusions: string[];
  estimatedReach?: number;
  estimatedCpm?: number;
}
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/panels/AudiencePanel.tsx` | ICP builder, persona cards, audience segments, per-channel targeting |
| `src/components/sidebar/AudienceTab.tsx` | Sidebar summary of ICPs, personas, segments |

### AudiencePanel Sections

1. **ICP Builder** — company size range slider, industry multi-select, revenue range, geography checkboxes (from COUNTRY_MARKETS), tech stack tags, pain points, buying triggers
2. **Persona Cards** — collapsible: name, title, department, seniority, goals/painPoints/objections as editable tag lists, linked ICP
3. **Audience Segments** — table: name, description, linked personas, estimated size, per-channel targeting badges
4. **Per-Channel Targeting** — expand segment → channel-specific config: Google (keywords, demographics), Facebook (interests, lookalike), LinkedIn (job titles, company size)
5. **"Generate with AI"** buttons on ICP and Persona sections (calls Phase 4 AI endpoints)

### Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `icpProfiles`, `buyerPersonas`, `audienceSegments` state, `panelMode: "audience"`, CRUD handlers |
| `src/constants/sampleData.ts` | Add `SAMPLE_ICP`, `SAMPLE_PERSONAS`, `SAMPLE_AUDIENCE_SEGMENTS` |
| `src/components/sidebar/IconRail.tsx` | Add audience tab button (`Users` icon) |
| `src/components/sidebar/index.ts` | Export AudienceTab |
| `src/components/panels/index.ts` | Export AudiencePanel |
| `server/routes/ai.ts` | Add `POST /api/ai/generate-icp` and `POST /api/ai/generate-persona` |

---

## Phase 6: Paid Social Planning

**Complexity:** Medium | **Dependencies:** Phase 3 + Phase 5

### Goal
Facebook/Instagram/LinkedIn audience sizing, creative format support, budget modeling per social platform.

### Types (add to `src/types/index.ts`)

```typescript
type SocialPlatform = 'facebook' | 'instagram' | 'linkedin';
type CreativeFormat = 'single-image' | 'carousel' | 'video' | 'stories' | 'lead-gen' | 'message-ad' | 'text-ad';

interface SocialAudienceEstimate {
  platform: SocialPlatform;
  estimatedReach: number;
  estimatedDailyReach: number;
  targeting: {
    interests: string[];
    jobTitles: string[];
    companySize: string[];
    industries: string[];
    customAudiences: string[];
  };
}

interface SocialCreative {
  id: string;
  format: CreativeFormat;
  headline: string;
  body: string;
  ctaButton: string;
  imageUrl?: string;
  platform: SocialPlatform;
  specs: { width: number; height: number; maxFileSize: string; maxTextLength: number };
}

interface SocialCampaign {
  id: string;
  name: string;
  platform: SocialPlatform;
  objective: 'awareness' | 'consideration' | 'conversion' | 'lead-gen';
  dailyBudget: number;
  monthlyBudget: number;
  audienceEstimate: SocialAudienceEstimate;
  creatives: SocialCreative[];
  projections: {
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversions: number;
    costPerConversion: number;
  };
}
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/panels/SocialPanel.tsx` | Paid social planning UI |
| `server/routes/social.ts` | `POST /api/social/audience-estimate`, `POST /api/social/projections` |
| `server/services/social.ts` | Mock audience sizing + performance projections |
| `src/services/social.ts` | Frontend social client |

### SocialPanel Sections

1. **Platform Selector** — tab strip: Facebook / Instagram / LinkedIn
2. **Audience Builder** — per-platform targeting (Facebook: interests, demographics, lookalike; LinkedIn: job titles, company size, seniority, industry)
3. **Audience Size Estimator** — shows estimated reach based on targeting (mock, TODO: Meta Marketing API / LinkedIn Campaign Manager API)
4. **Creative Format Selector** — grid of format options with spec badges (image size, text limits)
5. **Creative Editor** — headline, body, CTA inputs with character counters
6. **Budget Modeling** — CPM/CPC estimates, daily/monthly slider, conversion projections
7. **Platform Comparison Table** — side-by-side Facebook vs Instagram vs LinkedIn metrics

### Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `socialCampaigns`, `activeSocialPlatform` state, `panelMode: "social"` |
| `src/constants/sampleData.ts` | Add `SAMPLE_SOCIAL_CAMPAIGNS`, `SOCIAL_PLATFORM_SPECS`, `SOCIAL_BENCHMARKS` |
| `src/components/sidebar/ChatTab.tsx` | Add "social" panel mode button |
| `src/components/panels/index.ts` | Export SocialPanel |
| `server/index.ts` | Register social router |

---

## Phase 7: Campaign Timeline / Roadmap

**Complexity:** Medium-High | **Dependencies:** Phase 2 + Phase 3 + Phase 6

### Goal
Market entry sequencing, phase gates, launch dates, seasonal adjustments, Gantt-style visualization.

### Types (add to `src/types/index.ts`)

```typescript
type PhaseGate = 'awareness' | 'consideration' | 'conversion' | 'retention';

interface TimelinePhase {
  id: string;
  name: string;
  gate: PhaseGate;
  startDate: string;
  endDate: string;
  color: string;
  markets: string[];      // country codes
  channels: Channel[];
  campaignIds: string[];
  monthlyBudget: number;
  milestones: TimelineMilestone[];
  seasonalAdjustments: SeasonalAdjustment[];
}

interface TimelineMilestone {
  id: string;
  name: string;
  date: string;
  type: 'launch' | 'review' | 'optimization' | 'expansion' | 'test';
  completed: boolean;
  notes: string;
}

interface SeasonalAdjustment {
  month: number;              // 1-12
  budgetMultiplier: number;   // e.g., 1.5 = +50%
  reason: string;
}

interface CampaignTimeline {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  phases: TimelinePhase[];
  totalBudget: number;
}
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/panels/TimelinePanel.tsx` | Gantt-style campaign roadmap |

### TimelinePanel Sections

1. **Timeline Header** — date range picker, total budget, Gantt/list toggle
2. **Gantt View** — horizontal bars positioned with `position: absolute`, `left`/`width` as percentages of total duration. Month gridlines. Milestone diamonds. Market flag badges. Channel icon pills.
3. **Phase Editor** — click phase bar to expand: name, gate dropdown, start/end dates, market checkboxes, channel toggles, monthly budget, milestones CRUD
4. **Seasonal Adjustments** — 12-month multiplier sliders with presets ("Q4 Push", "Summer Slowdown", "Even Split")
5. **Market Sequencing View** — country-by-country timeline rows
6. **Budget Over Time Chart** — monthly bar chart with seasonal adjustments applied

### Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `timeline`, `activePhase` state, CRUD handlers for phases/milestones, `panelMode: "timeline"` |
| `src/constants/sampleData.ts` | Add `SAMPLE_TIMELINE` with international launch phases |
| `src/components/sidebar/ChatTab.tsx` | Add "timeline" panel mode button |
| `src/components/panels/index.ts` | Export TimelinePanel |

### Backend
No backend — timeline data is client-side state.

---

## All New Files Summary

| Phase | File | Purpose |
|-------|------|---------|
| 1 | `src/services/export.ts` | CSV, Google Ads Editor, PDF export |
| 1 | `server/routes/export.ts` | Server-side PDF stub |
| 1 | `server/services/export.ts` | PDF generation stub |
| 2 | `src/components/panels/CampaignBuilderPanel.tsx` | Full CRUD campaign builder |
| 3 | `src/components/panels/BudgetAllocatorPanel.tsx` | Cross-channel budget allocation |
| 3 | `server/routes/budget.ts` | Budget optimization endpoint |
| 3 | `server/services/budget.ts` | Channel mix optimization |
| 3 | `src/services/budget.ts` | Frontend budget client |
| 4 | `server/routes/ai.ts` | AI chat + generation endpoints |
| 4 | `server/services/ai.ts` | OpenAI Agents SDK integration |
| 4 | `src/services/ai.ts` | Frontend AI client |
| 5 | `src/components/panels/AudiencePanel.tsx` | ICP, persona, segment builder |
| 5 | `src/components/sidebar/AudienceTab.tsx` | Audience sidebar summary |
| 6 | `src/components/panels/SocialPanel.tsx` | Paid social planning |
| 6 | `server/routes/social.ts` | Social audience/projection endpoints |
| 6 | `server/services/social.ts` | Social platform mock service |
| 6 | `src/services/social.ts` | Frontend social client |
| 7 | `src/components/panels/TimelinePanel.tsx` | Gantt-style campaign roadmap |

## All Modified Files Summary

| File | Phases | Changes |
|------|--------|---------|
| `src/App.tsx` | All | State variables, handlers, panel rendering, sidebar routing |
| `src/types/index.ts` | All | Type definitions for each phase |
| `src/constants/sampleData.ts` | 2,3,5,6,7 | Updated/new sample data |
| `src/components/panels/index.ts` | 2,3,5,6,7 | Barrel exports for new panels |
| `src/components/sidebar/index.ts` | 5 | Barrel export for AudienceTab |
| `src/components/sidebar/ChatTab.tsx` | 3,4,6,7 | New panel mode buttons, streaming UI |
| `src/components/sidebar/IconRail.tsx` | 5 | Audience tab button |
| `src/components/sidebar/CampaignsTab.tsx` | 1,2 | Wire export + CRUD handlers |
| `server/index.ts` | 1,3,4,6 | Register new route files |
