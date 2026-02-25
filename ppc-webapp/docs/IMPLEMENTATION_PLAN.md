# Orion Platform: Implementation Roadmap

## Overview

6-phase plan to transform Orion from a read-only research tool into a full SEO/PPC campaign planning platform. Each phase is independently buildable, with later phases depending on earlier type definitions.

**Scope:** Search intent channels only — Google Ads, Bing Ads, and SEO. Social media advertising (Facebook, Instagram, LinkedIn) is out of scope as it uses a fundamentally different targeting model (audience/interest-based vs keyword/intent-based).

---

## Dependency Graph

```
Phase 1 (Export)            ── no dependencies ✅ DONE
Phase 2 (Campaign Builder)  ── no dependencies ✅ DONE
Phase 3 (Budget Allocator)  ── depends on Phase 2 types (Campaign) ✅ DONE
Phase 4 (AI Assistant)      ── no dependencies ✅ DONE
Phase 5 (Audience/Persona)  ── depends on Phase 2 + Phase 4 ✅ DONE
Phase 6 (Timeline/Roadmap)  ── depends on Phase 2 + Phase 3 ✅ DONE
```

All 6 phases are complete.

---

## Phase 1: Export System ✅ DONE

**Complexity:** Medium | **Dependencies:** None

### Delivered
- `src/services/export.ts` — Client-side CSV, Google Ads Editor, and PDF export
- `downloadKeywordsCsv()` — 11-column keyword table export
- `downloadGoogleAdsEditor()` — Campaign export with match types, CPCs, ad copy
- `downloadPdfReport()` — Print-friendly HTML report
- All Export buttons in panel headers wired and functional

---

## Phase 2: Editable Campaign Builder ✅ DONE

**Complexity:** High | **Dependencies:** None

### Delivered
- `src/components/panels/CampaignBuilderPanel.tsx` — Full CRUD campaign panel (1,032 lines)
- `src/types/index.ts` — Campaign, AdGroup, BidConfig, CampaignKeyword, NegativeKeyword types
- `src/constants/sampleData.ts` — Typed SAMPLE_CAMPAIGNS with match types, bid config, negatives
- `src/components/sidebar/CampaignsTab.tsx` — New Campaign and Export buttons functional
- Inline editable names, status, bid strategy, per-keyword match type pills, negative keywords, character counters, ad preview

---

## Phase 3: Cross-Channel Budget Allocator ✅ DONE

**Complexity:** Medium-High | **Dependencies:** Phase 2 (Campaign types)

### Delivered
- `src/components/panels/BudgetAllocatorPanel.tsx` — Google/Bing budget allocation UI with projections
- `server/routes/budget.ts` — POST /api/budget/optimize endpoint
- `server/services/budget.ts` — Channel mix optimization logic
- `src/services/budget.ts` — Frontend budget optimization client
- Channel allocation grid, per-channel config cards, projections table, optimizer visualization

### Goal
Split budget across Google Ads and Bing Ads (the two search channels). Per-channel ROI projections. Channel mix optimization between search engines.

### Types (add to `src/types/index.ts`)

```typescript
type SearchChannel = 'google-ads' | 'bing-ads';

interface ChannelConfig {
  channel: SearchChannel;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  budgetPercent: number;      // 0-100, must sum to 100
  budgetAbsolute: number;     // derived: totalBudget * percent / 100
  estimatedCtr: number;
  estimatedConvRate: number;
  estimatedCpc: number;
  notes: string;
}

interface ChannelProjection {
  channel: SearchChannel;
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
| `src/components/panels/BudgetAllocatorPanel.tsx` | Google/Bing budget allocation UI |
| `server/routes/budget.ts` | `POST /api/budget/optimize` |
| `server/services/budget.ts` | Mock channel mix optimization |
| `src/services/budget.ts` | Frontend budget optimization client |

### BudgetAllocatorPanel Sections

1. **Total Budget Input** — slider (same pattern as BudgetPanel)
2. **Channel Allocation Grid** — Google Ads and Bing Ads: percentage slider, absolute amount, enable/disable toggle. Auto-normalizes to 100%.
3. **Per-Channel Config Cards** — expandable, with CTR/ConvRate/CPC override inputs
4. **Projections Table** — side-by-side comparison: Channel | Budget | Impressions | Clicks | Conversions | CPA | Revenue | ROAS
5. **Channel Mix Optimizer** — bar showing current vs optimized split (mock: shift toward higher-ROAS channel)

### Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `channelConfigs` state, `panelMode: "allocator"`, render BudgetAllocatorPanel |
| `src/constants/sampleData.ts` | Add `SAMPLE_CHANNEL_CONFIGS` (Google Ads + Bing Ads defaults) |
| `src/components/sidebar/ChatTab.tsx` | Add "allocator" panel mode button |
| `src/components/panels/index.ts` | Export BudgetAllocatorPanel |
| `server/index.ts` | Register budget router |

---

## Phase 4: AI Assistant ✅ DONE

**Complexity:** High | **Dependencies:** None

### Delivered
- `server/services/ai.ts` — Backend service using OpenAI chat completions API (482 lines)
- `server/routes/ai.ts` — 4 endpoints: `/api/ai/chat`, `/generate-copy`, `/content-brief`, `/campaign-suggest`
- `src/services/ai.ts` — Frontend client with typed functions
- Context-aware chat with product/keyword/market/budget context
- Ad copy generation with strict character limit enforcement
- Content brief and campaign structure suggestion
- Graceful fallbacks when OPENAI_API_KEY is not set
- Chat now routes non-shortcut messages to AI backend

---

## Phase 5: Audience & Persona Builder ✅ DONE

**Complexity:** Medium | **Dependencies:** Phase 2 + Phase 4

### Delivered
- `src/components/panels/AudiencePanel.tsx` — Full ICP builder, persona cards, audience segments, keyword-persona mapping
- `src/components/sidebar/AudienceTab.tsx` — Sidebar summary with ICP/persona/segment cards
- AI endpoints: POST /api/ai/generate-icp and POST /api/ai/generate-persona
- Editable tag lists, expandable cards, "Generate with AI" buttons

### Goal
ICP builder, buyer persona framework, audience segmentation. Focused on search intent personas — who is searching for these keywords and why.

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
  searchBehavior: string[];  // what they search for and when
  icpId: string;
}

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  size: number;
  searchKeywords: string[];   // keywords this segment searches for
  contentTopics: string[];    // content topics that resonate
}
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/panels/AudiencePanel.tsx` | ICP builder, persona cards, audience segments |
| `src/components/sidebar/AudienceTab.tsx` | Sidebar summary of ICPs, personas, segments |

### AudiencePanel Sections

1. **ICP Builder** — company size range slider, industry multi-select, revenue range, geography checkboxes (from COUNTRY_MARKETS), tech stack tags, pain points, buying triggers
2. **Persona Cards** — collapsible: name, title, department, seniority, goals/painPoints/objections as editable tag lists, search behavior (what they search, when, and why)
3. **Audience Segments** — table: name, description, linked personas, estimated size, associated search keywords
4. **Keyword-Persona Mapping** — which keywords map to which persona and buying stage
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

## Phase 6: Campaign Timeline / Roadmap ✅ DONE

**Complexity:** Medium-High | **Dependencies:** Phase 2 + Phase 3

### Delivered
- `src/components/panels/TimelinePanel.tsx` — Gantt-style campaign roadmap with phase bars, milestones, seasonal adjustments, market sequencing, budget over time chart
- Pure CSS/HTML Gantt chart with month gridlines, phase editor, milestone CRUD
- Sample timeline with 4 phases: UK Launch, UK Conversion, US Entry, DACH Expansion

### Goal
Market entry sequencing, phase gates, launch dates, seasonal adjustments, Gantt-style visualization for search campaigns.

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
  channels: SearchChannel[];
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
2. **Gantt View** — horizontal bars positioned with `position: absolute`, `left`/`width` as percentages of total duration. Month gridlines. Milestone diamonds. Market flag badges. Channel icon pills (Google/Bing).
3. **Phase Editor** — click phase bar to expand: name, gate dropdown, start/end dates, market checkboxes, channel toggles (Google/Bing), monthly budget, milestones CRUD
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
| 1 ✅ | `src/services/export.ts` | CSV, Google Ads Editor, PDF export |
| 2 ✅ | `src/components/panels/CampaignBuilderPanel.tsx` | Full CRUD campaign builder |
| 3 | `src/components/panels/BudgetAllocatorPanel.tsx` | Google/Bing budget allocation |
| 3 | `server/routes/budget.ts` | Budget optimization endpoint |
| 3 | `server/services/budget.ts` | Channel mix optimization |
| 3 | `src/services/budget.ts` | Frontend budget client |
| 4 ✅ | `server/routes/ai.ts` | AI chat + generation endpoints |
| 4 ✅ | `server/services/ai.ts` | OpenAI chat completions integration |
| 4 ✅ | `src/services/ai.ts` | Frontend AI client |
| 5 | `src/components/panels/AudiencePanel.tsx` | ICP, persona, segment builder |
| 5 | `src/components/sidebar/AudienceTab.tsx` | Audience sidebar summary |
| 6 | `src/components/panels/TimelinePanel.tsx` | Gantt-style campaign roadmap |

## All Modified Files Summary

| File | Phases | Changes |
|------|--------|---------|
| `src/App.tsx` | All | State variables, handlers, panel rendering, sidebar routing |
| `src/types/index.ts` | All | Type definitions for each phase |
| `src/constants/sampleData.ts` | 2,3,5,6 | Updated/new sample data |
| `src/components/panels/index.ts` | 2,3,5,6 | Barrel exports for new panels |
| `src/components/sidebar/index.ts` | 5 | Barrel export for AudienceTab |
| `src/components/sidebar/ChatTab.tsx` | 3,6 | New panel mode buttons |
| `src/components/sidebar/IconRail.tsx` | 5 | Audience tab button |
| `src/components/sidebar/CampaignsTab.tsx` | 1,2 | Wire export + CRUD handlers |
| `server/index.ts` | 3 | Register budget router |
