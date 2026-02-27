// ════════════════════════════════════════════════════════════════
// Google Search Console API Service
// Uses direct HTTP calls with google-auth-library
// ════════════════════════════════════════════════════════════════

import { getServiceAccountAuth, getOAuth2Client, getStoredToken, SCOPES } from "./google-auth.ts";
import type { GscData, GscQuery, GscPage } from "./seo.ts";

interface GscApiRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface DimensionFilter {
  filters: Array<{ dimension: string; operator: string; expression: string }>;
}

const GSC_API = "https://www.googleapis.com/webmasters/v3";
const SEARCHANALYTICS_API = "https://searchconsole.googleapis.com/webmasters/v3";

// ── Auth helper ──

async function getAccessToken(): Promise<string> {
  // Service account
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (keyJson) {
    const credentials = JSON.parse(keyJson);
    const auth = getServiceAccountAuth([SCOPES.GSC]);
    if (auth) {
      const client = await auth.getClient();
      const tokenRes = await client.getAccessToken();
      if (tokenRes.token) return tokenRes.token;
    }
  }

  // OAuth2
  const stored = await getStoredToken("gsc");
  if (stored?.refreshToken) {
    const oauth = getOAuth2Client();
    if (oauth) {
      oauth.setCredentials({ refresh_token: stored.refreshToken });
      const tokenRes = await oauth.getAccessToken();
      if (tokenRes.token) return tokenRes.token;
    }
  }

  throw new Error("No Google Search Console credentials configured");
}

function getSiteUrl(): string {
  const url = process.env.GSC_SITE_URL;
  if (!url) throw new Error("GSC_SITE_URL environment variable is required");
  return url;
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ── Search Analytics query helper ──

async function searchAnalyticsQuery(
  siteUrl: string,
  token: string,
  params: {
    dimensions: string[];
    startDate: string;
    endDate: string;
    rowLimit?: number;
    dimensionFilterGroups?: DimensionFilter[];
  }
): Promise<GscApiRow[]> {
  const encodedUrl = encodeURIComponent(siteUrl);
  const response = await fetch(
    `${SEARCHANALYTICS_API}/sites/${encodedUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: params.dimensions,
        rowLimit: params.rowLimit || 500,
        dimensionFilterGroups: params.dimensionFilterGroups,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Search Console API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { rows?: GscApiRow[] };
  return data.rows || [];
}

// ── Public API ──

export async function getSearchConsoleData(options?: {
  siteUrl?: string;
  daysBack?: number;
}): Promise<GscData> {
  const token = await getAccessToken();
  const siteUrl = options?.siteUrl || getSiteUrl();
  const daysBack = options?.daysBack || 90;

  // GSC data has a ~3 day lag
  const startDate = dateNDaysAgo(daysBack);
  const endDate = dateNDaysAgo(3);

  // Run all queries in parallel
  const [queryRows, pageRows, deviceRows, countryRows, searchAppRows, weeklyRows] = await Promise.all([
    // 1. Top queries
    searchAnalyticsQuery(siteUrl, token, {
      dimensions: ["query"],
      startDate,
      endDate,
      rowLimit: 100,
    }),

    // 2. Top pages
    searchAnalyticsQuery(siteUrl, token, {
      dimensions: ["page"],
      startDate,
      endDate,
      rowLimit: 50,
    }),

    // 3. Device breakdown
    searchAnalyticsQuery(siteUrl, token, {
      dimensions: ["device"],
      startDate,
      endDate,
    }),

    // 4. Country breakdown
    searchAnalyticsQuery(siteUrl, token, {
      dimensions: ["country"],
      startDate,
      endDate,
      rowLimit: 20,
    }),

    // 5. Search appearance
    searchAnalyticsQuery(siteUrl, token, {
      dimensions: ["searchAppearance"],
      startDate,
      endDate,
    }),

    // 6. Weekly trends (query by date, aggregated into weeks)
    searchAnalyticsQuery(siteUrl, token, {
      dimensions: ["date"],
      startDate: dateNDaysAgo(84),
      endDate,
    }),
  ]);

  // Parse queries
  const queries: GscQuery[] = queryRows.map((r: GscApiRow) => ({
    query: r.keys[0],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: parseFloat((r.ctr * 100).toFixed(2)),
    position: parseFloat(r.position.toFixed(1)),
    trend: [], // Will be populated per-query if needed
    pages: [],
  }));

  // Parse pages
  const pages: GscPage[] = pageRows.map((r: GscApiRow) => {
    const url = new URL(r.keys[0]);
    return {
      page: url.pathname,
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: parseFloat((r.ctr * 100).toFixed(2)),
      position: parseFloat(r.position.toFixed(1)),
      topQueries: [],
    };
  });

  // Parse devices
  const devices = deviceRows.map((r: GscApiRow) => ({
    device: r.keys[0],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: parseFloat((r.ctr * 100).toFixed(2)),
    position: parseFloat(r.position.toFixed(1)),
  }));

  // Parse countries
  const countries = countryRows.map((r: GscApiRow) => ({
    country: r.keys[0],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: parseFloat((r.ctr * 100).toFixed(2)),
  }));

  // Parse search appearance
  const searchAppearance = searchAppRows.map((r: GscApiRow) => ({
    type: r.keys[0],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
  }));

  // Aggregate daily data into 12-week trends
  const weekBuckets: { clicks: number; impressions: number }[] = Array.from({ length: 12 }, () => ({ clicks: 0, impressions: 0 }));
  const bucketStart = new Date(dateNDaysAgo(84));
  for (const r of weeklyRows) {
    const date = new Date(r.keys[0]);
    const daysSinceStart = Math.floor((date.getTime() - bucketStart.getTime()) / 86400000);
    const weekIdx = Math.min(Math.floor(daysSinceStart / 7), 11);
    weekBuckets[weekIdx].clicks += Math.round(r.clicks);
    weekBuckets[weekIdx].impressions += Math.round(r.impressions);
  }

  // Summary
  const totalClicks = queryRows.reduce((a: number, r: GscApiRow) => a + r.clicks, 0);
  const totalImpressions = queryRows.reduce((a: number, r: GscApiRow) => a + r.impressions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgPosition = queryRows.length > 0
    ? queryRows.reduce((a: number, r: GscApiRow) => a + r.position, 0) / queryRows.length
    : 0;

  return {
    summary: {
      totalClicks: Math.round(totalClicks),
      totalImpressions: Math.round(totalImpressions),
      avgCtr: parseFloat(avgCtr.toFixed(2)),
      avgPosition: parseFloat(avgPosition.toFixed(1)),
      clicksTrend: weekBuckets.map((b) => b.clicks),
      impressionsTrend: weekBuckets.map((b) => b.impressions),
    },
    queries,
    pages,
    devices,
    countries,
    searchAppearance,
    dateRange: { start: startDate, end: endDate },
  };
}

export async function getSiteList(): Promise<{ siteUrl: string; permissionLevel: string }[]> {
  const token = await getAccessToken();
  const response = await fetch(`${GSC_API}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Search Console API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { siteEntry?: { siteUrl: string; permissionLevel: string }[] };
  return (data.siteEntry || []).map((s) => ({
    siteUrl: s.siteUrl,
    permissionLevel: s.permissionLevel,
  }));
}

export async function testSearchConsoleConnection(siteUrl?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = await getAccessToken();
    const site = siteUrl || getSiteUrl();
    const rows = await searchAnalyticsQuery(site, token, {
      dimensions: ["query"],
      startDate: dateNDaysAgo(7),
      endDate: dateNDaysAgo(3),
      rowLimit: 1,
    });
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function isGSCConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_CLIENT_ID);
}
