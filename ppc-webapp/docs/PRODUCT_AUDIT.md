# Orion Platform: Product Capability Audit

## Verdict

Orion is a strong **keyword intelligence and budget modeling tool** but is NOT ready for full multi-channel campaign planning. The platform is research-first and read-only — users can analyze extensively but cannot take action on their findings.

---

## What's Solid

| Area | Rating | Why |
|------|--------|-----|
| Keyword research | **Strong** | Google + Bing + Labs + competitor gaps in one unified table with sorting, filtering, source tracking |
| Multi-market support | **Strong** | 6 countries (GB, US, DE, AU, CA, FR) with localized keywords, currencies, competitor context |
| Budget/ROAS modeling | **Strong** | Scenario table, Stripe-backed real ACV, Bing arbitrage, conversion funnel |
| SEO intelligence | **Good** | SERP features, rank tracking, backlinks, content gaps, domain authority |
| Competitive analysis | **Good** | Organic/paid gaps, domain intersection, SERP competitors, keyword overlap matrix |
| Revenue attribution | **Good** | Stripe MRR, LTV, churn, UTM keyword-to-customer mapping |

---

## Critical Gaps

### 1. No Export or Output
The biggest blocker. Users can research keywords, build campaigns, model budgets, and analyze competitors but cannot take **anything** out. No CSV, no Google Ads Editor format, no PDF report, no clipboard copy. The platform is a dead end.

**Impact:** Users cannot act on any insights without manually re-entering data elsewhere.

### 2. No Editable Campaign Builder
Campaign panel is read-only with hardcoded sample data. Users cannot:
- Create new campaigns
- Edit ad copy (headlines/descriptions)
- Set keyword match types (broad/phrase/exact)
- Assign bids or daily budgets
- Define landing page URLs
- Set location/audience targeting

**Impact:** Cannot plan real campaigns — only view a template.

### 3. No Non-Search Channels
Only covers Google Ads + Bing Ads + SEO. Missing:
- Facebook/Instagram Ads (audience sizing, creative formats, budget modeling)
- LinkedIn Ads (B2B targeting, Matched Audiences)
- YouTube/Video Ads
- Display/Programmatic
- Email marketing integration
- Content marketing calendar

**Impact:** Cannot plan a "competitive marketing campaign across multiple channels."

### 4. No Audience/Persona Definition
Product profiles exist with "target buyer" field, but there's no:
- ICP (Ideal Customer Profile) builder
- Buyer persona framework with pain points, triggers, objections
- Audience segment definition
- Targeting configuration per channel

**Impact:** Campaign strategy lacks audience-first thinking.

### 5. No AI Assistant
Chat tab routes to panels and displays hardcoded responses but has no LLM integration. Cannot:
- Generate ad copy variations
- Analyze keyword clusters and recommend strategy
- Write content briefs
- Suggest campaign structures based on goals
- Answer strategic questions

**Impact:** Loses the "intelligence" differentiator.

### 6. Non-Functional Edit/Action Buttons
Every "Edit", "Add Product", "Export", "Duplicate", and "New Campaign" button in the sidebar and panels is UI chrome with no handler wired up.

**Impact:** Users hit dead ends throughout the product.

### 7. No Cross-Channel Budget Allocation
Budget planner only models search (Google + optional Bing split). Cannot:
- Split budget across Google/Bing/Social/Display/Content
- Compare per-channel ROI projections
- Model channel mix optimization
- Account for audience overlap between channels

**Impact:** Budget planning is incomplete for multi-channel campaigns.

### 8. No Campaign Timeline or Phased Rollout
No way to plan:
- Market entry sequencing (launch UK first, then US, then DE)
- Phase gates (awareness → consideration → conversion)
- Launch dates and milestones
- Seasonal adjustments
- A/B testing schedule

**Impact:** Cannot coordinate international or multi-phase campaigns.

---

## Feature Matrix: Current State

### Data & Research

| Feature | Status | Notes |
|---------|--------|-------|
| Google Ads keyword research | Working | Volume, CPC, competition, difficulty, intent, trends |
| Bing keyword research | Working | Volume, CPC, performance, arbitrage detection |
| DataForSEO Labs (SERP-based) | Working | Suggestions, related, ranked keywords, domain intersection |
| SERP feature analysis | Working (mock) | Featured snippets, PAA, local packs, knowledge panels |
| Rank tracking (12mo) | Working (mock) | Position history, trend classification, volatility |
| Backlink analysis | Working (mock) | DA, PA, trust/citation flow, referring domains, anchors |
| Content gap analysis | Working (mock) | Keywords competitors rank for, opportunity scoring |
| Google Search Console | Working (mock) | Queries, pages, devices, countries, search appearance |
| Google Analytics | Working (mock) | Channels, conversions, top pages, trends |
| Stripe revenue data | Working | MRR, LTV, churn, UTM attribution |
| Multi-market comparison | Working | 6 countries with per-market keyword data |

### Campaign Planning

| Feature | Status | Notes |
|---------|--------|-------|
| Campaign structure view | Read-only | Hardcoded sample, cannot create/edit |
| Ad copy (headlines/descriptions) | Read-only | Hardcoded, no generation or editing |
| Ad preview (SERP mockup) | Working | Google-style preview, view-only |
| Match type selection | Missing | No broad/phrase/exact controls |
| Bid strategy | Missing | No target CPA/ROAS/manual bid controls |
| Landing page assignment | Missing | No URL mapping |
| Audience targeting | Missing | No persona/segment/demographic targeting |
| Negative keywords | Missing | No exclusion management |

### Budget & Forecasting

| Feature | Status | Notes |
|---------|--------|-------|
| Budget slider (£100-10K) | Working | Dynamic projections |
| Conversion funnel modeling | Working | CTR, conv rate, CPA, ROAS calculations |
| 7-level scenario table | Working | Clickable rows, side-by-side comparison |
| Stripe-powered real ACV | Working | Replaces hardcoded estimate when connected |
| Google vs Bing split | Working | 85/15 comparison with combined projections |
| Per-keyword breakdown | Working | Top 10 by opportunity, pro-rata allocation |
| Cross-channel allocation | Missing | Search-only, no social/display/email |
| Seasonal adjustment | Missing | Fixed monthly model |
| LTV-based projections | Partial | Shows in Revenue panel, not in Budget |

### Output & Collaboration

| Feature | Status | Notes |
|---------|--------|-------|
| CSV export | Missing | No export for any data |
| Google Ads Editor format | Missing | Cannot push/export campaigns |
| PDF report generation | Missing | No report builder |
| Shareable links | Missing | No sharing capability |
| Team collaboration | Missing | Single-user only |
| Approval workflows | Missing | No review/approve process |
| Campaign timeline | Missing | No Gantt/roadmap view |
| AI-generated strategy | Missing | Chat is routing-only |

---

## Panel Interaction Summary

| Panel | Can View | Can Edit | Can Export | Can Create |
|-------|----------|----------|------------|------------|
| Keyword Table | Yes (sort, filter, select) | No | No | No |
| Competitor Matrix | Yes (live analysis available) | No | No | No |
| Opportunity Map | Yes (hover tooltips) | No | No | No |
| Campaign Builder | Yes (expand/collapse) | No | No | No |
| Budget Planner | Yes (slider, overrides, scenarios) | Partial (inputs) | No | No |
| Revenue/Stripe | Yes (refresh) | No | No | No |
| SEO Intelligence | Yes (fetch SERP/ranks/gaps) | No | No | No |
| Backlinks | Yes (analyze/compare) | No | No | No |
| GSC | Yes (load data) | No | No | No |
| Analytics | Yes (view channels) | No | No | No |
| Products | Yes (view profiles) | No | No | No |

---

## Multi-Market Capabilities

### Supported Countries
- GB (United Kingdom) - £ GBP - 15 keywords - English
- US (United States) - $ USD - 15 keywords - English
- DE (Germany) - EUR - 12 keywords - German
- AU (Australia) - A$ AUD - 11 keywords - English
- CA (Canada) - C$ CAD - 11 keywords - English
- FR (France) - EUR - 12 keywords - French

### What Works Per Market
- Currency-adjusted CPC and budget projections
- Localized keyword sets (German/French language support)
- Market-specific competitor notes
- Per-country GSC and GA sample data
- Country picker in sidebar (switches all data)

### What's Missing
- Cross-market budget allocation (how much per country?)
- Market entry prioritization framework
- Unified multi-market dashboard
- Currency conversion for comparison
- Market-specific audience sizing
- Regional competitive landscape comparison
