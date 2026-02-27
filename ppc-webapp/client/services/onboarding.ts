// ════════════════════════════════════════════════════════════════
// Onboarding Client — Calls our Express backend for product onboarding
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/onboarding";

// ── Types ──

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  bodyText: string;
  links: string[];
  success: boolean;
  error?: string;
}

export interface ExtractedProductInfo {
  name: string;
  description: string;
  valueProposition: string;
  targetAudience: string;
  acv: string;
  integrations: string;
  features: string[];
  keywords: string[];
}

export interface FullOnboardingResult {
  crawl: CrawlResult;
  product: ExtractedProductInfo;
}

// ── API call helper ──

async function apiCall(endpoint: string, body: unknown): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Onboarding API request failed (${response.status})`);
  }
  return data;
}

// ── Endpoints ──

export async function generateAdCopy(
  product: ExtractedProductInfo,
  keywords: string[],
  count?: number
): Promise<{ headlines: string[]; descriptions: string[] }> {
  const data = await apiCall("/generate-copy", { product, keywords, count });
  return data.result;
}

export async function fullOnboarding(url: string): Promise<FullOnboardingResult> {
  const data = await apiCall("/full", { url });
  return data.result;
}
