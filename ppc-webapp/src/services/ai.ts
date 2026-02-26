// ════════════════════════════════════════════════════════════════
// AI Assistant Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/ai";

// ── Types ──

export interface ChatResponse {
  message: string;
  suggestedAction?: {
    type: string;
    panel?: string;
    payload?: any;
  };
  sources?: { url: string; snippet: string }[];
}

export interface ContentBrief {
  title: string;
  metaDescription: string;
  outline: string[];
  targetLength: number;
  keyPoints: string[];
  targetKeyword: string;
}

export interface CampaignSuggestion {
  campaignName: string;
  adGroups: {
    name: string;
    keywords: string[];
    suggestedHeadlines: string[];
    suggestedDescriptions: string[];
  }[];
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
    throw new Error((data as { error?: string }).error || `AI API request failed (${response.status})`);
  }
  return data;
}

// ── Endpoints ──

export async function sendChatMessage(
  message: string,
  history?: { role: string; content: string }[],
  context?: any,
  options?: { sessionId?: string; productId?: string }
): Promise<ChatResponse> {
  const data = await apiCall("/chat", {
    body: { message, history, context, ...options },
  });
  return data.result;
}

export async function getChatHistory(
  params: { sessionId?: string; productId?: string; limit?: number } = {}
): Promise<{ id: number; role: string; content: string; createdAt: string }[]> {
  const query = new URLSearchParams();
  if (params.sessionId) query.set("sessionId", params.sessionId);
  if (params.productId) query.set("productId", params.productId);
  if (params.limit) query.set("limit", String(params.limit));
  const data = await apiCall(`/chat/history?${query}`, { method: "GET" });
  return data.result;
}

export async function generateAdCopy(
  keywords: string[],
  product: any,
  options?: { tone?: string; count?: number }
): Promise<{ headlines: string[]; descriptions: string[] }> {
  const data = await apiCall("/generate-copy", {
    body: { keywords, product, ...options },
  });
  return data.result;
}

export async function generateContentBrief(
  keyword: string,
  product: any,
  competitors?: string[]
): Promise<ContentBrief> {
  const data = await apiCall("/content-brief", {
    body: { keyword, product, competitors },
  });
  return data.result;
}

export async function generateIcp(
  product: any,
  market: string,
  existingIcps?: string[]
): Promise<any> {
  const data = await apiCall("/generate-icp", {
    body: { product, market, existingIcps },
  });
  return data.result;
}

export async function generatePersona(
  product: any,
  market: string,
  icpName?: string,
  existingPersonas?: string[]
): Promise<any> {
  const data = await apiCall("/generate-persona", {
    body: { product, market, icpName, existingPersonas },
  });
  return data.result;
}

export async function suggestCampaignStructure(
  keywords: string[],
  product: any,
  budget: number,
  market: string
): Promise<CampaignSuggestion> {
  const data = await apiCall("/campaign-suggest", {
    body: { keywords, product, budget, market },
  });
  return data.result;
}
