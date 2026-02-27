// ════════════════════════════════════════════════════════════════
// Google Analytics 4 Data API Service
// ════════════════════════════════════════════════════════════════

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getServiceAccountAuth, getOAuth2Client, getStoredToken, SCOPES } from "./google-auth.ts";

// ── Types ──

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

// ── Channel color mapping ──

const CHANNEL_COLORS: Record<string, string> = {
  "Organic Search": "#22c55e",
  "Paid Search": "#f59e0b",
  "Direct": "#6366f1",
  "Social": "#a855f7",
  "Referral": "#ef4444",
  "Email": "#0ea5e9",
  "Display": "#ec4899",
  "Affiliates": "#14b8a6",
  "Video": "#8b5cf6",
};

// ── Client factory ──

async function getClient(): Promise<BetaAnalyticsDataClient> {
  // Service account path
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (keyJson) {
    const credentials = JSON.parse(keyJson);
    return new BetaAnalyticsDataClient({ credentials });
  }

  // OAuth2 path
  const token = await getStoredToken("ga4");
  if (token?.refreshToken) {
    const oauth = getOAuth2Client();
    if (oauth) {
      oauth.setCredentials({ refresh_token: token.refreshToken });
      return new BetaAnalyticsDataClient({ authClient: oauth as InstanceType<typeof import("google-auth-library").OAuth2Client> });
    }
  }

  throw new Error("No Google Analytics credentials configured");
}

function getPropertyId(): string {
  const id = process.env.GA4_PROPERTY_ID;
  if (!id) throw new Error("GA4_PROPERTY_ID environment variable is required");
  return id.startsWith("properties/") ? id : `properties/${id}`;
}

// ── Helpers ──

interface GA4Row {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCurrency(value: number, currency = "£"): string {
  if (value === 0) return "—";
  return `${currency}${value.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ── Public API ──

export async function getGA4Data(options?: {
  propertyId?: string;
  currency?: string;
  daysBack?: number;
}): Promise<GA4Data> {
  const client = await getClient();
  const property = options?.propertyId || getPropertyId();
  const currency = options?.currency || "£";
  const daysBack = options?.daysBack || 90;

  const startDate = dateNDaysAgo(daysBack);
  const endDate = dateNDaysAgo(1);

  // Run all reports in parallel
  const [overviewResult, channelResult, pagesResult, conversionsResult, trendsResult] = await Promise.all([
    // 1. Overview metrics
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
        { name: "screenPageViewsPerSession" },
      ],
    }),

    // 2. Channel breakdown
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "conversions" },
        { name: "totalRevenue" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),

    // 3. Top pages
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 20,
    }),

    // 4. Conversions (key events)
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [
        { name: "eventCount" },
        { name: "totalRevenue" },
        { name: "totalUsers" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: ["purchase", "sign_up", "generate_lead", "begin_checkout", "page_view"],
          },
        },
      },
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 10,
    }),

    // 5. Weekly trends (12 weeks)
    client.runReport({
      property,
      dateRanges: [{ startDate: dateNDaysAgo(84), endDate }],
      dimensions: [{ name: "isoYearIsoWeek" }],
      metrics: [
        { name: "totalUsers" },
        { name: "sessions" },
      ],
      orderBys: [{ dimension: { dimensionName: "isoYearIsoWeek" }, desc: false }],
    }),
  ]);

  // Parse overview
  const ov = overviewResult[0]?.rows?.[0]?.metricValues || [];
  const overview: GA4Overview = {
    users: parseInt(ov[0]?.value || "0"),
    newUsers: parseInt(ov[1]?.value || "0"),
    sessions: parseInt(ov[2]?.value || "0"),
    bounceRate: parseFloat((parseFloat(ov[3]?.value || "0") * 100).toFixed(1)),
    avgSessionDuration: formatDuration(parseFloat(ov[4]?.value || "0")),
    pagesPerSession: parseFloat(parseFloat(ov[5]?.value || "0").toFixed(1)),
    usersTrend: [],
    sessionsTrend: [],
  };

  // Parse trends
  const trendRows = trendsResult[0]?.rows || [];
  overview.usersTrend = (trendRows as GA4Row[]).map((r) => parseInt(r.metricValues?.[0]?.value || "0"));
  overview.sessionsTrend = (trendRows as GA4Row[]).map((r) => parseInt(r.metricValues?.[1]?.value || "0"));
  // Pad to 12 if needed
  while (overview.usersTrend.length < 12) overview.usersTrend.unshift(0);
  while (overview.sessionsTrend.length < 12) overview.sessionsTrend.unshift(0);
  overview.usersTrend = overview.usersTrend.slice(-12);
  overview.sessionsTrend = overview.sessionsTrend.slice(-12);

  // Parse channels
  const totalSessions = overview.sessions || 1;
  const channels: GA4Channel[] = ((channelResult[0]?.rows || []) as GA4Row[]).map((r) => {
    const channel = r.dimensionValues?.[0]?.value || "Other";
    const sessions = parseInt(r.metricValues?.[1]?.value || "0");
    const conversions = parseInt(r.metricValues?.[3]?.value || "0");
    const revenue = parseFloat(r.metricValues?.[4]?.value || "0");
    return {
      channel,
      users: parseInt(r.metricValues?.[0]?.value || "0"),
      sessions,
      bounceRate: parseFloat((parseFloat(r.metricValues?.[2]?.value || "0") * 100).toFixed(1)),
      convRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(1)) : 0,
      revenue: formatCurrency(revenue, currency),
      color: CHANNEL_COLORS[channel] || "#6b7280",
    };
  });

  // Parse top pages
  const topPages: GA4Page[] = ((pagesResult[0]?.rows || []) as GA4Row[]).map((r) => {
    const pageviews = parseInt(r.metricValues?.[0]?.value || "0");
    return {
      page: r.dimensionValues?.[0]?.value || "/",
      pageviews,
      uniquePageviews: parseInt(r.metricValues?.[1]?.value || "0"),
      avgTimeOnPage: formatDuration(parseFloat(r.metricValues?.[2]?.value || "0")),
      bounceRate: parseFloat((parseFloat(r.metricValues?.[3]?.value || "0") * 100).toFixed(1)),
      exitRate: 0, // GA4 doesn't have exit rate per page in the same way
    };
  });

  // Parse conversions
  const conversions: GA4Conversion[] = ((conversionsResult[0]?.rows || []) as GA4Row[]).map((r) => {
    const completions = parseInt(r.metricValues?.[0]?.value || "0");
    const totalUsers = parseInt(r.metricValues?.[2]?.value || "1");
    return {
      goal: formatEventName(r.dimensionValues?.[0]?.value || ""),
      completions,
      convRate: parseFloat(((completions / Math.max(totalUsers, 1)) * 100).toFixed(2)),
      value: formatCurrency(parseFloat(r.metricValues?.[1]?.value || "0"), currency),
    };
  });

  return { overview, channels, topPages, conversions };
}

export async function testGA4Connection(propertyId?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = await getClient();
    const property = propertyId || getPropertyId();
    await client.runReport({
      property,
      dateRanges: [{ startDate: dateNDaysAgo(7), endDate: dateNDaysAgo(1) }],
      metrics: [{ name: "totalUsers" }],
      limit: 1,
    });
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function isGA4Configured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_CLIENT_ID);
}

function formatEventName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
