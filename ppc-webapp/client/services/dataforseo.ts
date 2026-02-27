// ════════════════════════════════════════════════════════════════
// DataForSEO API Client — Calls our Express backend
// All actual API logic runs server-side to avoid CORS & credential exposure
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/keywords";

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
  locationCode?: number;
  languageCode?: string;
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
  acv?: string;
  target?: string;
  integrations?: string;
}

export interface ApiStatusResponse {
  ok: boolean;
  credentialsConfigured: boolean;
  supportedMarkets: string[];
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

// ── API call helper ──

interface ApiCallOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiCall(endpoint: string, options: ApiCallOptions = {}): Promise<any> {
  const { method = "POST", body, headers: extraHeaders } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json", ...extraHeaders };

  const fetchOpts: RequestInit = { method, headers };
  if (body && method !== "GET") {
    fetchOpts.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, fetchOpts);
  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `API request failed (${response.status})`);
  }

  return data;
}

// ── Credential headers ──

function credHeaders(credentials?: Credentials): Record<string, string> {
  if (!credentials?.login || !credentials?.password) return {};
  return {
    "x-dfs-login": credentials.login,
    "x-dfs-password": credentials.password,
  };
}

// ── Google Ads endpoints ──

export async function getSearchVolume(
  keywords: string[],
  countryCode: string,
  credentials?: Credentials,
  options: Record<string, unknown> = {},
): Promise<NormalizedKeyword[]> {
  const data = await apiCall("/search-volume", {
    body: { keywords, countryCode, options },
    headers: credHeaders(credentials),
  });
  return data.results;
}

export async function getKeywordsForKeywords(
  seedKeywords: string[],
  countryCode: string,
  credentials?: Credentials,
  options: Record<string, unknown> = {},
): Promise<NormalizedKeyword[]> {
  const data = await apiCall("/suggestions", {
    body: { keywords: seedKeywords, countryCode, options },
    headers: credHeaders(credentials),
  });
  return data.results;
}

export async function getKeywordsForSite(
  target: string,
  countryCode: string,
  credentials?: Credentials,
  options: Record<string, unknown> = {},
): Promise<NormalizedKeyword[]> {
  const data = await apiCall("/for-site", {
    body: { target, countryCode, options },
    headers: credHeaders(credentials),
  });
  return data.results;
}

export async function getAdTrafficByKeywords(
  keywords: string[],
  countryCode: string,
  credentials?: Credentials,
  options: Record<string, unknown> = {},
): Promise<NormalizedTrafficResult[]> {
  const data = await apiCall("/ad-traffic", {
    body: { keywords, countryCode, options },
    headers: credHeaders(credentials),
  });
  return data.results;
}

// ── Bing endpoints ──

export async function getBingSearchVolume(
  keywords: string[],
  countryCode: string,
  credentials?: Credentials,
): Promise<NormalizedKeyword[]> {
  const data = await apiCall("/bing/search-volume", {
    body: { keywords, countryCode },
    headers: credHeaders(credentials),
  });
  return data.results;
}

export async function getBingKeywordPerformance(
  keywords: string[],
  countryCode: string,
  credentials?: Credentials,
): Promise<unknown[]> {
  const data = await apiCall("/bing/performance", {
    body: { keywords, countryCode },
    headers: credHeaders(credentials),
  });
  return data.results;
}

// ── Multi-market comparison ──

export async function compareMarkets(
  keywords: string[],
  countryCodes: string[],
  credentials?: Credentials,
): Promise<Record<string, NormalizedKeyword[] | { error: string }>> {
  const data = await apiCall("/compare-markets", {
    body: { keywords, countryCodes },
    headers: credHeaders(credentials),
  });
  return data.results;
}

// ── Labs endpoints ──

export interface LabsKeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
}

export interface RankedKeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  rankGroup: number;
  url: string;
  etv: number;
}

export interface DomainIntersectionResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
}

export async function getLabsKeywordSuggestions(
  keyword: string,
  countryCode: string,
  credentials?: Credentials,
  options: Record<string, unknown> = {},
): Promise<LabsKeywordResult[]> {
  const data = await apiCall("/labs/suggestions", {
    body: { keyword, countryCode, options },
    headers: credHeaders(credentials),
  });
  return data.results;
}

export async function getLabsRelatedKeywords(
  keyword: string,
  countryCode: string,
  credentials?: Credentials,
  options: Record<string, unknown> = {},
): Promise<LabsKeywordResult[]> {
  const data = await apiCall("/labs/related", {
    body: { keyword, countryCode, options },
    headers: credHeaders(credentials),
  });
  return data.results;
}

export async function getLabsRankedKeywords(
  target: string,
  countryCode: string,
  credentials?: Credentials,
  options: Record<string, unknown> = {},
): Promise<RankedKeywordResult[]> {
  const data = await apiCall("/labs/ranked", {
    body: { target, countryCode, options },
    headers: credHeaders(credentials),
  });
  return data.results;
}

export async function getLabsDomainIntersection(
  target1: string,
  target2: string,
  countryCode: string,
  credentials?: Credentials,
  options: Record<string, unknown> = {},
): Promise<DomainIntersectionResult[]> {
  const data = await apiCall("/labs/intersection", {
    body: { target1, target2, countryCode, options },
    headers: credHeaders(credentials),
  });
  return data.results;
}

// ── Relevance scoring (client-side for immediate feedback) ──

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

// ── Status check ──

export async function getApiStatus(): Promise<ApiStatusResponse> {
  const data = await apiCall("/status", { method: "GET" });
  return data;
}
