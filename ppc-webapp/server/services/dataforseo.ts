// ════════════════════════════════════════════════════════════════
// DataForSEO Keyword Data API — Server-Side Service
// Docs: https://docs.dataforseo.com/v3/keywords_data/overview/
// ════════════════════════════════════════════════════════════════

const API_BASE = "https://api.dataforseo.com/v3";

// ── Types ──

export interface Credentials {
  login: string;
  password: string;
}

export interface LocationInfo {
  code: number;
  language: string;
  name: string;
}

export interface NormalizedKeyword {
  keyword: string;
  volume: number;
  cpc: number;
  cpcLow: number;
  cpcHigh: number;
  competition: number;
  competitionLabel: string;
  difficulty: number;
  intent: "transactional" | "commercial" | "informational" | "navigational";
  trend: number[] | null;
  monthlySearches: unknown[];
  relevance: number;
  group: string | null;
  spell: string | null;
  locationCode: number | undefined;
  languageCode: string | undefined;
}

export interface NormalizedTrafficResult {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
}

export interface Product {
  name: string;
  description: string;
  target?: string;
  integrations?: string;
}

export interface SearchVolumeOptions {
  searchPartners?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
}

export interface KeywordsForKeywordsOptions {
  searchPartners?: boolean;
  sortBy?: string;
}

export interface KeywordsForSiteOptions {
  targetType?: "site" | "page";
  sortBy?: string;
}

export interface AdTrafficOptions {
  bid: number;
  match?: "exact" | "broad" | "phrase";
  dateInterval?: string;
}

export interface LabsKeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  cpcLow: number;
  cpcHigh: number;
  competition: number;
  competitionLevel: string;
  difficulty: number;
  intent: string;
  intentForeign: string[];
  trend: number[] | null;
  monthlySearches: unknown[];
  categories: number[];
}

export interface RankedKeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  rankGroup: number;
  rankAbsolute: number;
  url: string;
  title: string;
  etv: number;
  estimatedPaidTrafficCost: number;
  type: string; // "organic" | "paid" | etc
}

export interface DomainIntersectionResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  domain1Rank: number;
  domain1Url: string;
  domain1Etv: number;
  domain2Rank: number;
  domain2Url: string;
  domain2Etv: number;
}

export interface LabsSuggestionsOptions {
  limit?: number;
}

export interface LabsRelatedOptions {
  depth?: number;
  limit?: number;
}

export interface LabsRankedOptions {
  itemTypes?: string[];
  limit?: number;
}

export interface LabsDomainIntersectionOptions {
  intersections?: boolean;
  itemTypes?: string[];
  limit?: number;
}

export interface AsyncTaskOptions {
  tag?: string;
  postbackUrl?: string;
  pingbackUrl?: string;
}

export interface TaskResult {
  status: "complete" | "pending";
  results: NormalizedKeyword[];
}

// ── Location codes ──

export const LOCATION_CODES: Record<string, LocationInfo> = {
  GB: { code: 2826, language: "en", name: "United Kingdom" },
  US: { code: 2840, language: "en", name: "United States" },
  DE: { code: 2276, language: "de", name: "Germany" },
  AU: { code: 2036, language: "en", name: "Australia" },
  CA: { code: 2124, language: "en", name: "Canada" },
  FR: { code: 2250, language: "fr", name: "France" },
};

// ── Auth helper ──

function getAuthHeader(login: string, password: string): string {
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

// ── HTTP helpers ──

interface DfsResponse {
  status_code: number;
  status_message: string;
  tasks?: DfsTask[];
}

interface DfsTask {
  id: string;
  status_code: number;
  status_message: string;
  result?: unknown[];
}

async function apiPost(endpoint: string, body: unknown, credentials: Credentials): Promise<DfsResponse> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(credentials.login, credentials.password),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as DfsResponse;

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO API error ${data.status_code}: ${data.status_message}`);
  }

  return data;
}

async function apiGet(endpoint: string, credentials: Credentials): Promise<DfsResponse> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(credentials.login, credentials.password),
    },
  });

  if (!response.ok) {
    throw new Error(`DataForSEO HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as DfsResponse;

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO API error ${data.status_code}: ${data.status_message}`);
  }

  return data;
}

// ── Normalization ──

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeKeywordResult(result: any): NormalizedKeyword | null {
  if (!result) return null;

  const trend = (result.monthly_searches || [])
    .slice(0, 12)
    .reverse()
    .map((m: any) => m.search_volume || 0);

  const competitionMap: Record<string, number> = { LOW: 0.15, MEDIUM: 0.45, HIGH: 0.80 };
  const competitionValue = result.competition_index != null
    ? result.competition_index / 100
    : competitionMap[result.competition] || 0;

  const intent = inferIntent(result.keyword);

  return {
    keyword: result.keyword,
    volume: result.search_volume || 0,
    cpc: result.cpc || result.high_top_of_page_bid || 0,
    cpcLow: result.low_top_of_page_bid || 0,
    cpcHigh: result.high_top_of_page_bid || 0,
    competition: competitionValue,
    competitionLabel: result.competition || "UNKNOWN",
    difficulty: Math.round(competitionValue * 100),
    intent,
    trend: trend.length >= 2 ? trend : null,
    monthlySearches: result.monthly_searches || [],
    relevance: 0,
    group: null,
    spell: result.spell || null,
    locationCode: result.location_code,
    languageCode: result.language_code,
  };
}

function normalizeTrafficResult(result: any): NormalizedTrafficResult | null {
  if (!result) return null;
  return {
    keyword: result.keyword,
    impressions: result.impressions || 0,
    clicks: result.clicks || 0,
    ctr: result.ctr || 0,
    averageCpc: result.average_cpc || 0,
    cost: result.cost || 0,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function inferIntent(keyword: string): NormalizedKeyword["intent"] {
  const kw = (keyword || "").toLowerCase();

  const transactionalSignals = [
    "buy", "purchase", "order", "pricing", "price", "cost", "cheap",
    "affordable", "deal", "discount", "coupon", "trial", "demo", "signup",
    "sign up", "subscribe", "download", "get", "start", "alternative",
    "vs", "versus", "compare", "switch", "migrate", "integration",
    "quickbooks", "xero", "sage", "netsuite",
  ];
  const informationalSignals = [
    "what is", "how to", "guide", "tutorial", "tips", "best practices",
    "examples", "definition", "meaning", "why", "benefits", "advantages",
    "overview", "introduction", "learn", "understand", "explain",
    "reduce", "improve", "optimize",
  ];
  const navigationalSignals = [
    "login", "log in", "sign in", "portal", "dashboard", "account",
    "support", "contact", "help",
  ];

  if (transactionalSignals.some(s => kw.includes(s))) return "transactional";
  if (informationalSignals.some(s => kw.includes(s))) return "informational";
  if (navigationalSignals.some(s => kw.includes(s))) return "navigational";
  return "commercial";
}

export function scoreRelevance(keyword: NormalizedKeyword, product: Product | null): number {
  if (!product) return 50;

  const kw = keyword.keyword.toLowerCase();
  let score = 50;

  const productTerms = [
    product.name, product.description,
    product.target, product.integrations,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/\s+/);

  const matchedTerms = productTerms.filter(term =>
    term.length > 3 && kw.includes(term),
  );
  score += matchedTerms.length * 8;

  if (keyword.intent === "transactional") score += 15;
  if (keyword.intent === "commercial") score += 8;
  if (keyword.competition < 0.2) score += 12;
  else if (keyword.competition < 0.35) score += 6;
  if (keyword.volume >= 100 && keyword.volume <= 2000) score += 5;

  return Math.min(100, Math.max(0, score));
}

// ════════════════════════════════════════════════════════════════
// GOOGLE ADS ENDPOINTS
// ════════════════════════════════════════════════════════════════

export async function getSearchVolume(
  keywords: string[],
  countryCode: string,
  credentials: Credentials,
  options: SearchVolumeOptions = {},
): Promise<NormalizedKeyword[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    keywords: keywords.slice(0, 1000),
    location_code: location.code,
    language_code: location.language,
    search_partners: options.searchPartners || false,
    ...(options.dateFrom && { date_from: options.dateFrom }),
    ...(options.dateTo && { date_to: options.dateTo }),
    ...(options.sortBy && { sort_by: options.sortBy }),
  }];

  const data = await apiPost("/keywords_data/google_ads/search_volume/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }
  return (task.result || []).map(normalizeKeywordResult).filter((r): r is NormalizedKeyword => r !== null);
}

export async function getKeywordsForKeywords(
  seedKeywords: string[],
  countryCode: string,
  credentials: Credentials,
  options: KeywordsForKeywordsOptions = {},
): Promise<NormalizedKeyword[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    keywords: seedKeywords.slice(0, 20),
    location_code: location.code,
    language_code: location.language,
    search_partners: options.searchPartners || false,
    ...(options.sortBy && { sort_by: options.sortBy }),
  }];

  const data = await apiPost("/keywords_data/google_ads/keywords_for_keywords/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }
  return (task.result || []).map(normalizeKeywordResult).filter((r): r is NormalizedKeyword => r !== null);
}

export async function getKeywordsForSite(
  target: string,
  countryCode: string,
  credentials: Credentials,
  options: KeywordsForSiteOptions = {},
): Promise<NormalizedKeyword[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    target,
    target_type: options.targetType || "site",
    location_code: location.code,
    language_code: location.language,
    ...(options.sortBy && { sort_by: options.sortBy }),
  }];

  const data = await apiPost("/keywords_data/google_ads/keywords_for_site/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }
  return (task.result || []).map(normalizeKeywordResult).filter((r): r is NormalizedKeyword => r !== null);
}

export async function getAdTrafficByKeywords(
  keywords: string[],
  countryCode: string,
  credentials: Credentials,
  options: AdTrafficOptions,
): Promise<NormalizedTrafficResult[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  if (!options.bid) throw new Error("bid is required for ad traffic projections");

  const taskBody = [{
    keywords: keywords.slice(0, 1000),
    location_code: location.code,
    language_code: location.language,
    bid: options.bid,
    match: options.match || "exact",
    date_interval: options.dateInterval || "next_month",
  }];

  const data = await apiPost("/keywords_data/google_ads/ad_traffic_by_keywords/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }
  return (task.result || []).map(normalizeTrafficResult).filter((r): r is NormalizedTrafficResult => r !== null);
}

// ── Bing ──

export async function getBingSearchVolume(
  keywords: string[],
  countryCode: string,
  credentials: Credentials,
): Promise<NormalizedKeyword[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    keywords: keywords.slice(0, 1000),
    location_code: location.code,
    language_code: location.language,
  }];

  const data = await apiPost("/keywords_data/bing/search_volume/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }
  return (task.result || []).map(normalizeKeywordResult).filter((r): r is NormalizedKeyword => r !== null);
}

export async function getBingKeywordPerformance(
  keywords: string[],
  countryCode: string,
  credentials: Credentials,
): Promise<unknown[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    keywords: keywords.slice(0, 1000),
    location_code: location.code,
    language_code: location.language,
  }];

  const data = await apiPost("/keywords_data/bing/keyword_performance/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }
  return task.result || [];
}

// ── Async Mode ──

export async function submitSearchVolumeTask(
  keywords: string[],
  countryCode: string,
  credentials: Credentials,
  options: AsyncTaskOptions = {},
): Promise<string> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    keywords: keywords.slice(0, 1000),
    location_code: location.code,
    language_code: location.language,
    ...(options.tag && { tag: options.tag }),
    ...(options.postbackUrl && { postback_url: options.postbackUrl }),
    ...(options.pingbackUrl && { pingback_url: options.pingbackUrl }),
  }];

  const data = await apiPost("/keywords_data/google_ads/search_volume/task_post", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20100) {
    throw new Error(`Task submission failed: ${task?.status_message || "Unknown error"}`);
  }
  return task.id;
}

export async function getTaskResult(taskId: string, credentials: Credentials): Promise<TaskResult> {
  const data = await apiGet(`/keywords_data/google_ads/search_volume/task_get/${taskId}`, credentials);
  const task = data.tasks?.[0];
  if (!task) throw new Error("No task found");

  if (task.status_code === 20000 && task.result) {
    return {
      status: "complete",
      results: task.result.map(normalizeKeywordResult).filter((r): r is NormalizedKeyword => r !== null),
    };
  }
  return { status: "pending", results: [] };
}

// ── Reference ──

export async function getLocations(credentials: Credentials, country: string | null = null): Promise<unknown[]> {
  const endpoint = country
    ? `/keywords_data/google_ads/locations/${country}`
    : "/keywords_data/google_ads/locations";
  const data = await apiGet(endpoint, credentials);
  return data.tasks?.[0]?.result || [];
}

export async function getLanguages(credentials: Credentials): Promise<unknown[]> {
  const data = await apiGet("/keywords_data/google_ads/languages", credentials);
  return data.tasks?.[0]?.result || [];
}

// ── Multi-market comparison ──

export async function compareMarkets(
  keywords: string[],
  countryCodes: string[],
  credentials: Credentials,
): Promise<Record<string, NormalizedKeyword[] | { error: string }>> {
  const results: Record<string, NormalizedKeyword[] | { error: string }> = {};
  const promises = countryCodes.map(async (code) => {
    try {
      const data = await getSearchVolume(keywords, code, credentials);
      results[code] = data;
    } catch (err) {
      results[code] = { error: (err as Error).message };
    }
  });
  await Promise.all(promises);
  return results;
}

// ════════════════════════════════════════════════════════════════
// DATAFORSEO LABS ENDPOINTS
// ════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getLabsKeywordSuggestions(
  keyword: string,
  countryCode: string,
  credentials: Credentials,
  options: LabsSuggestionsOptions = {},
): Promise<LabsKeywordResult[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    keyword,
    location_code: location.code,
    language_code: location.language,
    include_serp_info: true,
    limit: options.limit || 500,
    filters: [["keyword_info.search_volume", ">", 10]],
    order_by: ["keyword_info.search_volume,desc"],
  }];

  const data = await apiPost("/dataforseo_labs/google/keyword_suggestions/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }

  return ((task.result as any)?.[0]?.items || []).map((item: any) => ({
    keyword: item.keyword,
    volume: item.keyword_info.search_volume,
    cpc: item.keyword_info.cpc,
    cpcLow: item.keyword_info.low_top_of_page_bid,
    cpcHigh: item.keyword_info.high_top_of_page_bid,
    competition: item.keyword_info.competition,
    competitionLevel: item.keyword_info.competition_level,
    difficulty: item.keyword_properties?.keyword_difficulty || 0,
    intent: item.search_intent_info?.main_intent || "commercial",
    intentForeign: item.search_intent_info?.foreign_intent || [],
    trend: (item.keyword_info.monthly_searches || []).slice(0, 12).reverse().map((m: any) => m.search_volume || 0),
    monthlySearches: item.keyword_info.monthly_searches || [],
    categories: item.keyword_info.categories || [],
  }));
}

export async function getLabsRelatedKeywords(
  keyword: string,
  countryCode: string,
  credentials: Credentials,
  options: LabsRelatedOptions = {},
): Promise<LabsKeywordResult[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    keyword,
    location_code: location.code,
    language_code: location.language,
    depth: options.depth || 2,
    include_serp_info: true,
    limit: options.limit || 500,
    order_by: ["keyword_data.keyword_info.search_volume,desc"],
  }];

  const data = await apiPost("/dataforseo_labs/google/related_keywords/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }

  return ((task.result as any)?.[0]?.items || []).map((item: any) => ({
    keyword: item.keyword_data.keyword,
    volume: item.keyword_data.keyword_info.search_volume,
    cpc: item.keyword_data.keyword_info.cpc,
    cpcLow: item.keyword_data.keyword_info.low_top_of_page_bid,
    cpcHigh: item.keyword_data.keyword_info.high_top_of_page_bid,
    competition: item.keyword_data.keyword_info.competition,
    competitionLevel: item.keyword_data.keyword_info.competition_level,
    difficulty: item.keyword_data.keyword_properties?.keyword_difficulty || 0,
    intent: item.keyword_data.search_intent_info?.main_intent || "commercial",
    intentForeign: item.keyword_data.search_intent_info?.foreign_intent || [],
    trend: (item.keyword_data.keyword_info.monthly_searches || []).slice(0, 12).reverse().map((m: any) => m.search_volume || 0),
    monthlySearches: item.keyword_data.keyword_info.monthly_searches || [],
    categories: item.keyword_data.keyword_info.categories || [],
  }));
}

export async function getLabsRankedKeywords(
  target: string,
  countryCode: string,
  credentials: Credentials,
  options: LabsRankedOptions = {},
): Promise<RankedKeywordResult[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    target,
    location_code: location.code,
    language_code: location.language,
    item_types: options.itemTypes || ["organic"],
    limit: options.limit || 1000,
    filters: [["keyword_data.keyword_info.search_volume", ">", 10]],
    order_by: ["keyword_data.keyword_info.search_volume,desc"],
  }];

  const data = await apiPost("/dataforseo_labs/google/ranked_keywords/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }

  return ((task.result as any)?.[0]?.items || []).map((item: any) => ({
    keyword: item.keyword_data.keyword,
    volume: item.keyword_data.keyword_info.search_volume,
    cpc: item.keyword_data.keyword_info.cpc,
    competition: item.keyword_data.keyword_info.competition,
    difficulty: item.keyword_data.keyword_properties?.keyword_difficulty || 0,
    intent: item.keyword_data.search_intent_info?.main_intent || "commercial",
    rankGroup: item.ranked_serp_element.serp_item.rank_group,
    rankAbsolute: item.ranked_serp_element.serp_item.rank_absolute,
    url: item.ranked_serp_element.serp_item.url,
    title: item.ranked_serp_element.serp_item.title,
    etv: item.ranked_serp_element.serp_item.etv || 0,
    estimatedPaidTrafficCost: item.ranked_serp_element.serp_item.estimated_paid_traffic_cost || 0,
    type: item.ranked_serp_element.serp_item.type,
  }));
}

export async function getLabsDomainIntersection(
  target1: string,
  target2: string,
  countryCode: string,
  credentials: Credentials,
  options: LabsDomainIntersectionOptions = {},
): Promise<DomainIntersectionResult[]> {
  const location = LOCATION_CODES[countryCode];
  if (!location) throw new Error(`Unsupported country code: ${countryCode}`);

  const taskBody = [{
    target1,
    target2,
    location_code: location.code,
    language_code: location.language,
    intersections: options.intersections !== undefined ? options.intersections : true,
    item_types: options.itemTypes || ["organic"],
    limit: options.limit || 1000,
    order_by: ["keyword_data.keyword_info.search_volume,desc"],
  }];

  const data = await apiPost("/dataforseo_labs/google/domain_intersection/live", taskBody, credentials);
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`Task failed: ${task?.status_message || "Unknown error"}`);
  }

  return ((task.result as any)?.[0]?.items || []).map((item: any) => ({
    keyword: item.keyword_data.keyword,
    volume: item.keyword_data.keyword_info.search_volume,
    cpc: item.keyword_data.keyword_info.cpc,
    competition: item.keyword_data.keyword_info.competition,
    difficulty: item.keyword_data.keyword_properties?.keyword_difficulty || 0,
    intent: item.keyword_data.search_intent_info?.main_intent || "commercial",
    domain1Rank: item.first_domain_serp_element?.rank_group || 0,
    domain1Url: item.first_domain_serp_element?.url || "",
    domain1Etv: item.first_domain_serp_element?.etv || 0,
    domain2Rank: item.second_domain_serp_element?.rank_group || 0,
    domain2Url: item.second_domain_serp_element?.url || "",
    domain2Etv: item.second_domain_serp_element?.etv || 0,
  }));
}

/* eslint-enable @typescript-eslint/no-explicit-any */
