// ════════════════════════════════════════════════════════════════
// Shared types for the keyword research agent pipeline
// ════════════════════════════════════════════════════════════════

export interface SeedKeyword {
  keyword: string;
  source: "manual" | "ai-suggested" | "competitor";
}

export interface KeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  cpcLow: number;
  cpcHigh: number;
  competition: number;
  competitionLevel: string;
  difficulty: number;
  intent: string;
  trend: number[] | null;
  source: string; // which expansion method found this
}

export interface CompetitorKeyword {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  rankGroup: number;
  url: string;
  etv: number;
  domain: string;
  type: "organic" | "paid" | string;
}

export interface KeywordGap {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  competitorDomain: string;
  competitorRank: number;
  competitorEtv: number;
  gapType: "organic-only" | "low-competition-high-intent" | "untapped";
}

export interface ScoredKeyword {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  score: number;
  scoreBreakdown: {
    volumeScore: number;
    intentScore: number;
    competitionScore: number;
    cpcAffordabilityScore: number;
  };
  source: string;
  tier: "sweet-spot" | "high-value" | "monitor" | "low-priority";
}

export interface PipelineConfig {
  seedKeywords: string[];
  targetCountry: string;
  competitors: string[];
  product?: {
    name: string;
    description: string;
    target?: string;
    integrations?: string;
  };
  cpcRange: { min: number; max: number }; // sweet spot CPC range
  apiBaseUrl: string;
}

export interface PipelineResult {
  keywords: ScoredKeyword[];
  gaps: KeywordGap[];
  summary: {
    totalKeywordsFound: number;
    sweetSpotCount: number;
    highValueCount: number;
    avgCpc: number;
    topKeyword: string;
    competitorGaps: number;
    marketOpportunity: string;
  };
  metadata: {
    country: string;
    seedKeywords: string[];
    competitors: string[];
    timestamp: string;
    duration: number;
  };
}
