// Re-export service types that panels use
export type { StripeMetrics, StripeAttribution, StripeTimelinePoint } from "../services/stripe";
export type { SerpFeatureResult, SerpCompetitor, HistoricalRank, BacklinkProfile, GscData, ContentGap } from "../services/seo";
export type { NormalizedKeyword, NormalizedTrafficResult, Product as DfsProduct } from "../services/dataforseo";
export type { GA4Data, GA4Overview, GA4Channel, GA4Page, GA4Conversion } from "../services/google-analytics";
export type { PushCampaignInput, PushCampaignResult } from "../services/google-ads";
export type { GoogleConnectionStatus } from "../services/google-auth";

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

// ── Budget Allocator Types (Phase 3) ──

export type SearchChannel = 'google-ads' | 'bing-ads';

export interface ChannelConfig {
  channel: SearchChannel;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  budgetPercent: number;
  budgetAbsolute: number;
  estimatedCtr: number;
  estimatedConvRate: number;
  estimatedCpc: number;
  notes: string;
}

export interface ChannelProjection {
  channel: SearchChannel;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
  budget: number;
}

export interface BudgetAllocation {
  totalBudget: number;
  channels: ChannelConfig[];
  projections: ChannelProjection[];
  optimizedMix?: ChannelConfig[];
}

// ── Audience & Persona Types (Phase 5) ──

export interface IcpProfile {
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

export interface BuyerPersona {
  id: string;
  name: string;
  title: string;
  department: string;
  seniority: 'c-suite' | 'director' | 'manager' | 'individual-contributor';
  goals: string[];
  painPoints: string[];
  objections: string[];
  triggers: string[];
  informationSources: string[];
  decisionCriteria: string[];
  searchBehavior: string[];
  icpId: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  size: number;
  searchKeywords: string[];
  contentTopics: string[];
}

// ── Timeline Types (Phase 6) ──

export type PhaseGate = 'awareness' | 'consideration' | 'conversion' | 'retention';

export interface TimelineMilestone {
  id: string;
  name: string;
  date: string;
  type: 'launch' | 'review' | 'optimization' | 'expansion' | 'test';
  completed: boolean;
  notes: string;
}

export interface SeasonalAdjustment {
  month: number;
  budgetMultiplier: number;
  reason: string;
}

export interface TimelinePhase {
  id: string;
  name: string;
  gate: PhaseGate;
  startDate: string;
  endDate: string;
  color: string;
  markets: string[];
  channels: SearchChannel[];
  campaignIds: string[];
  monthlyBudget: number;
  milestones: TimelineMilestone[];
  seasonalAdjustments: SeasonalAdjustment[];
}

export interface CampaignTimeline {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  phases: TimelinePhase[];
  totalBudget: number;
}
