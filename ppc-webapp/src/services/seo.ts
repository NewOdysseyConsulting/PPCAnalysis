// ════════════════════════════════════════════════════════════════
// SEO Intelligence Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/seo";

// ── Types ──

export interface SerpFeature {
  type: "featured_snippet" | "people_also_ask" | "local_pack" | "knowledge_panel" | "image_pack" | "video" | "shopping" | "sitelinks" | "top_stories" | "faq";
  present: boolean;
  position?: number;
  ownedByTarget?: boolean;
}

export interface SerpFeatureResult {
  keyword: string;
  volume: number;
  difficulty: number;
  features: SerpFeature[];
  totalFeatures: number;
  organicResultsCount: number;
  paidResultsCount: number;
}

export interface SerpCompetitor {
  domain: string;
  avgPosition: number;
  visibility: number;
  keywordsCount: number;
  estimatedTraffic: number;
  etv: number;
  commonKeywords: number;
  topKeywords: string[];
}

export interface HistoricalRank {
  keyword: string;
  positions: { date: string; position: number | null; url: string | null }[];
  currentPosition: number | null;
  bestPosition: number;
  volatility: number;
  trend: "improving" | "declining" | "stable" | "new" | "lost";
}

export interface BacklinkProfile {
  domain: string;
  totalBacklinks: number;
  referringDomains: number;
  domainAuthority: number;
  pageAuthority: number;
  trustFlow: number;
  citationFlow: number;
  doFollowRatio: number;
  newBacklinks30d: number;
  lostBacklinks30d: number;
  topAnchors: { anchor: string; count: number; percentage: number }[];
  topReferrers: { domain: string; authority: number; backlinks: number; doFollow: boolean }[];
  backlinkHistory: { month: string; total: number; referring: number }[];
}

export interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  trend: number[];
  pages: string[];
}

export interface GscPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: string[];
}

export interface GscData {
  summary: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    clicksTrend: number[];
    impressionsTrend: number[];
  };
  queries: GscQuery[];
  pages: GscPage[];
  devices: { device: string; clicks: number; impressions: number; ctr: number; position: number }[];
  countries: { country: string; clicks: number; impressions: number; ctr: number }[];
  searchAppearance: { type: string; clicks: number; impressions: number }[];
  dateRange: { start: string; end: string };
}

export interface ContentGap {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: string;
  competitorsRanking: { domain: string; position: number; url: string }[];
  yourPosition: number | null;
  opportunity: "high" | "medium" | "low";
  suggestedContentType: string;
}

// ── API call helper ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiCall(endpoint: string, options: { method?: string; body?: unknown } = {}): Promise<any> {
  const { method = "POST", body } = options;
  const fetchOpts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && method !== "GET") {
    fetchOpts.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${endpoint}`, fetchOpts);
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `SEO API request failed (${response.status})`);
  }
  return data;
}

// ── Endpoints ──

export async function getSerpFeatures(keywords: string[], countryCode: string = "GB"): Promise<SerpFeatureResult[]> {
  const data = await apiCall("/serp-features", { body: { keywords, countryCode } });
  return data.results;
}

export async function getSerpCompetitors(target: string, countryCode: string = "GB"): Promise<SerpCompetitor[]> {
  const data = await apiCall("/serp-competitors", { body: { target, countryCode } });
  return data.results;
}

export async function getHistoricalRanks(keywords: string[], countryCode: string = "GB"): Promise<HistoricalRank[]> {
  const data = await apiCall("/rank-history", { body: { keywords, countryCode } });
  return data.results;
}

export async function getBacklinkProfile(domain: string): Promise<BacklinkProfile> {
  const data = await apiCall("/backlinks", { body: { domain } });
  return data.result;
}

export async function getBacklinkComparison(domains: string[]): Promise<BacklinkProfile[]> {
  const data = await apiCall("/backlinks/compare", { body: { domains } });
  return data.results;
}

export async function getGscData(): Promise<GscData> {
  const data = await apiCall("/gsc", { method: "GET" });
  return data.result;
}

export async function getContentGaps(keywords: string[], competitors: string[]): Promise<ContentGap[]> {
  const data = await apiCall("/content-gaps", { body: { keywords, competitors } });
  return data.results;
}
