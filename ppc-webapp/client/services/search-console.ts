// ════════════════════════════════════════════════════════════════
// Google Search Console Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/gsc";

// Re-use GscData from seo.ts since the shape is identical
export type { GscData } from "./seo";

async function apiCall(endpoint: string, params?: Record<string, string>): Promise<any> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const response = await fetch(`${API_BASE}${endpoint}${query}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `GSC API request failed (${response.status})`);
  }
  return data;
}

export async function getLiveGscData(options?: {
  siteUrl?: string;
  daysBack?: number;
}): Promise<import("./seo").GscData> {
  const params: Record<string, string> = {};
  if (options?.siteUrl) params.siteUrl = options.siteUrl;
  if (options?.daysBack) params.daysBack = options.daysBack.toString();
  const data = await apiCall("/data", Object.keys(params).length > 0 ? params : undefined);
  return data.result;
}

