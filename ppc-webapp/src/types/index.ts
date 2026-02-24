// Re-export service types that panels use
export type { StripeMetrics, StripeAttribution, StripeTimelinePoint } from "../services/stripe";
export type { SerpFeatureResult, SerpCompetitor, HistoricalRank, BacklinkProfile, GscData, ContentGap } from "../services/seo";
export type { NormalizedKeyword, NormalizedTrafficResult, Product as DfsProduct } from "../services/dataforseo";

// ── Campaign Builder Types ──

export type MatchType = 'broad' | 'phrase' | 'exact';
export type BidStrategy = 'manual-cpc' | 'target-cpa' | 'target-roas' | 'maximize-clicks' | 'maximize-conversions';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface CampaignKeyword {
  keyword: string;
  matchType: MatchType;
  maxCpc?: number;
  finalUrl?: string;
}

export interface NegativeKeyword {
  keyword: string;
  matchType: MatchType;
  level: 'campaign' | 'ad-group';
}

export interface AdGroup {
  id: string;
  name: string;
  keywords: CampaignKeyword[];
  negativeKeywords: NegativeKeyword[];
  headlines: string[];
  descriptions: string[];
  finalUrl?: string;
  displayPath1?: string;
  displayPath2?: string;
}

export interface BidConfig {
  strategy: BidStrategy;
  targetCpa?: number;
  targetRoas?: number;
  maxCpcLimit?: number;
  dailyBudget: number;
}

export interface Campaign {
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
