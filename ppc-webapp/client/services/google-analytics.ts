// ════════════════════════════════════════════════════════════════
// Google Analytics 4 Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/ga4";

export interface GA4Overview {
  users: number;
  newUsers: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: string;
  pagesPerSession: number;
  usersTrend: number[];
  sessionsTrend: number[];
}

export interface GA4Channel {
  channel: string;
  users: number;
  sessions: number;
  bounceRate: number;
  convRate: number;
  revenue: string;
  color: string;
}

export interface GA4Page {
  page: string;
  pageviews: number;
  uniquePageviews: number;
  avgTimeOnPage: string;
  bounceRate: number;
  exitRate: number;
}

export interface GA4Conversion {
  goal: string;
  completions: number;
  convRate: number;
  value: string;
}

export interface GA4Data {
  overview: GA4Overview;
  channels: GA4Channel[];
  topPages: GA4Page[];
  conversions: GA4Conversion[];
}

async function apiCall(endpoint: string, params?: Record<string, string>): Promise<any> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const response = await fetch(`${API_BASE}${endpoint}${query}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `GA4 API request failed (${response.status})`);
  }
  return data;
}

export async function getGA4Data(options?: {
  propertyId?: string;
  currency?: string;
  daysBack?: number;
}): Promise<GA4Data> {
  const params: Record<string, string> = {};
  if (options?.propertyId) params.propertyId = options.propertyId;
  if (options?.currency) params.currency = options.currency;
  if (options?.daysBack) params.daysBack = options.daysBack.toString();
  const data = await apiCall("/data", Object.keys(params).length > 0 ? params : undefined);
  return data.result;
}

