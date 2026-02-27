// ════════════════════════════════════════════════════════════════
// Stripe Revenue Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/stripe";

// ── Types ──

export interface StripeMetrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  avgRevenuePerUser: number;
  churnRate: number;
  ltv: number;
  newMrrThisMonth: number;
  expansionMrr: number;
  churnedMrr: number;
  netNewMrr: number;
  trialCount: number;
  trialConversionRate: number;
  currency: string;
}

export interface StripeAttribution {
  keyword: string;
  source: string;
  medium: string;
  campaign: string;
  customers: number;
  totalRevenue: number;
  avgDealSize: number;
  conversionRate: number;
}

export interface StripeTimelinePoint {
  month: string;
  mrr: number;
  customers: number;
  churn: number;
  newCustomers: number;
}

export interface StripeStatusResponse {
  ok: boolean;
  configured: boolean;
  webhookConfigured: boolean;
}

// ── API call helper ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiCall(endpoint: string): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Stripe API request failed (${response.status})`);
  }
  return data;
}

// ── Endpoints ──

export async function getStripeMetrics(): Promise<StripeMetrics> {
  const data = await apiCall("/metrics");
  return data.metrics;
}

export async function getStripeAttribution(): Promise<StripeAttribution[]> {
  const data = await apiCall("/attribution");
  return data.attribution;
}

export async function getStripeTimeline(): Promise<StripeTimelinePoint[]> {
  const data = await apiCall("/timeline");
  return data.timeline;
}

export async function getStripeStatus(): Promise<StripeStatusResponse> {
  return apiCall("/status");
}
