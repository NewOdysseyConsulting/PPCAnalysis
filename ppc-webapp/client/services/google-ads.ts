// ════════════════════════════════════════════════════════════════
// Google Ads Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/google-ads";

export interface PushCampaignInput {
  name: string;
  dailyBudget: number;
  bidStrategy: string;
  targetCpa?: number;
  targetRoas?: number;
  targetCountries: string[];
  adGroups: {
    name: string;
    keywords: { keyword: string; matchType: string; maxCpc?: number }[];
    negativeKeywords?: { keyword: string; matchType: string }[];
    headlines: string[];
    descriptions: string[];
    finalUrl?: string;
  }[];
  negativeKeywords?: { keyword: string; matchType: string }[];
}

export interface PushCampaignResult {
  campaignId: string;
  adGroupIds: string[];
  keywordCount: number;
  adCount: number;
}

async function apiCall(endpoint: string, options: { method?: string; body?: unknown; params?: Record<string, string> } = {}): Promise<{ result: unknown; results: unknown }> {
  const { method = "GET", body, params } = options;
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const fetchOpts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && method !== "GET") {
    fetchOpts.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${endpoint}${query}`, fetchOpts);
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Google Ads API request failed (${response.status})`);
  }
  return data as { result: unknown; results: unknown };
}

export async function pushCampaignToGoogleAds(campaign: PushCampaignInput, customerId?: string): Promise<PushCampaignResult> {
  const data = await apiCall("/push", { method: "POST", body: { campaign, customerId } });
  return data.result as PushCampaignResult;
}
