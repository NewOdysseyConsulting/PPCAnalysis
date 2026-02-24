// ════════════════════════════════════════════════════════════════
// SEO Intelligence Service — SERP Features, Backlinks, GSC, Rank History
// Currently using mock data; swap implementations for live API calls
// ════════════════════════════════════════════════════════════════

// ── Types ──

export interface SerpFeature {
  type: "featured_snippet" | "people_also_ask" | "local_pack" | "knowledge_panel" | "image_pack" | "video" | "shopping" | "sitelinks" | "top_stories" | "faq";
  present: boolean;
  position?: number;
  ownedByTarget?: boolean;
}

export interface SerpFeatureResult {
  keyword: string;
  volume: number;
  difficulty: number;
  features: SerpFeature[];
  totalFeatures: number;
  organicResultsCount: number;
  paidResultsCount: number;
}

export interface SerpCompetitor {
  domain: string;
  avgPosition: number;
  visibility: number;
  keywordsCount: number;
  estimatedTraffic: number;
  etv: number;
  commonKeywords: number;
  topKeywords: string[];
}

export interface HistoricalRank {
  keyword: string;
  positions: { date: string; position: number | null; url: string | null }[];
  currentPosition: number | null;
  bestPosition: number;
  volatility: number;
  trend: "improving" | "declining" | "stable" | "new" | "lost";
}

export interface BacklinkProfile {
  domain: string;
  totalBacklinks: number;
  referringDomains: number;
  domainAuthority: number;
  pageAuthority: number;
  trustFlow: number;
  citationFlow: number;
  doFollowRatio: number;
  newBacklinks30d: number;
  lostBacklinks30d: number;
  topAnchors: { anchor: string; count: number; percentage: number }[];
  topReferrers: { domain: string; authority: number; backlinks: number; doFollow: boolean }[];
  backlinkHistory: { month: string; total: number; referring: number }[];
}

export interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  trend: number[];
  pages: string[];
}

export interface GscPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: string[];
}

export interface GscData {
  summary: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    clicksTrend: number[];
    impressionsTrend: number[];
  };
  queries: GscQuery[];
  pages: GscPage[];
  devices: { device: string; clicks: number; impressions: number; ctr: number; position: number }[];
  countries: { country: string; clicks: number; impressions: number; ctr: number }[];
  searchAppearance: { type: string; clicks: number; impressions: number }[];
  dateRange: { start: string; end: string };
}

export interface ContentGap {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: string;
  competitorsRanking: { domain: string; position: number; url: string }[];
  yourPosition: number | null;
  opportunity: "high" | "medium" | "low";
  suggestedContentType: string;
}

// ── Mock Data Generators ──

const FEATURE_TYPES: SerpFeature["type"][] = [
  "featured_snippet", "people_also_ask", "local_pack", "knowledge_panel",
  "image_pack", "video", "shopping", "sitelinks", "top_stories", "faq",
];

function mockSerpFeatures(keywords: string[]): SerpFeatureResult[] {
  return keywords.map(kw => {
    const features: SerpFeature[] = FEATURE_TYPES.map(type => ({
      type,
      present: Math.random() > 0.55,
      position: Math.random() > 0.5 ? Math.ceil(Math.random() * 10) : undefined,
      ownedByTarget: Math.random() > 0.8,
    })).filter(f => f.present);

    return {
      keyword: kw,
      volume: Math.round(100 + Math.random() * 5000),
      difficulty: Math.round(10 + Math.random() * 80),
      features,
      totalFeatures: features.length,
      organicResultsCount: 10,
      paidResultsCount: Math.floor(Math.random() * 5),
    };
  });
}

function mockSerpCompetitors(targetDomain: string, countryCode: string): SerpCompetitor[] {
  const competitors = [
    { domain: "tipalti.com", base: 85 },
    { domain: "bill.com", base: 90 },
    { domain: "airbase.io", base: 65 },
    { domain: "ramp.com", base: 78 },
    { domain: "brex.com", base: 72 },
    { domain: "stampli.com", base: 58 },
    { domain: "coupa.com", base: 82 },
    { domain: "sap.com", base: 95 },
    { domain: "sage.com", base: 88 },
    { domain: "xero.com", base: 92 },
    { domain: "netsuite.com", base: 89 },
    { domain: "quickbooks.intuit.com", base: 94 },
  ].filter(c => c.domain !== targetDomain);

  return competitors.map(c => ({
    domain: c.domain,
    avgPosition: Math.round((5 + Math.random() * 40) * 10) / 10,
    visibility: Math.round(c.base * (0.6 + Math.random() * 0.4) * 100) / 100,
    keywordsCount: Math.round(50 + Math.random() * 2000),
    estimatedTraffic: Math.round(500 + Math.random() * 50000),
    etv: Math.round(1000 + Math.random() * 100000),
    commonKeywords: Math.round(10 + Math.random() * 200),
    topKeywords: [
      "accounts payable automation",
      "invoice processing software",
      "AP automation",
      `${c.domain.split(".")[0]} pricing`,
      "payment automation",
    ].slice(0, 3 + Math.floor(Math.random() * 2)),
  }));
}

function mockHistoricalRanks(keywords: string[]): HistoricalRank[] {
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return d.toISOString().slice(0, 7);
  });

  return keywords.map(kw => {
    const basePos = 5 + Math.random() * 60;
    const trendDir = Math.random();
    const positions = months.map((date, i) => {
      let pos: number | null;
      if (trendDir < 0.3) {
        // improving
        pos = Math.max(1, Math.round(basePos - i * 2 + (Math.random() * 6 - 3)));
      } else if (trendDir < 0.5) {
        // declining
        pos = Math.min(100, Math.round(basePos + i * 2 + (Math.random() * 6 - 3)));
      } else if (trendDir < 0.8) {
        // stable
        pos = Math.max(1, Math.round(basePos + (Math.random() * 8 - 4)));
      } else if (trendDir < 0.9) {
        // new (null for early months)
        pos = i < 6 ? null : Math.max(1, Math.round(basePos + (Math.random() * 10 - 5)));
      } else {
        // lost (null for recent months)
        pos = i > 8 ? null : Math.max(1, Math.round(basePos + (Math.random() * 10 - 5)));
      }
      return { date, position: pos, url: pos ? `/blog/${kw.replace(/\s+/g, "-")}` : null };
    });

    const validPositions = positions.filter(p => p.position !== null).map(p => p.position!);
    const current = positions[positions.length - 1].position;
    const first = positions.find(p => p.position !== null)?.position;

    let trend: HistoricalRank["trend"] = "stable";
    if (validPositions.length === 0) trend = "lost";
    else if (positions.slice(0, 6).every(p => p.position === null)) trend = "new";
    else if (current === null) trend = "lost";
    else if (first && current < first - 5) trend = "improving";
    else if (first && current > first + 5) trend = "declining";

    return {
      keyword: kw,
      positions,
      currentPosition: current,
      bestPosition: validPositions.length > 0 ? Math.min(...validPositions) : 0,
      volatility: Math.round(Math.random() * 30 * 10) / 10,
      trend,
    };
  });
}

function mockBacklinkProfile(domain: string): BacklinkProfile {
  const base = domain.length * 137;
  const totalBacklinks = Math.round(1000 + (base % 50000));
  const referringDomains = Math.round(totalBacklinks * (0.05 + Math.random() * 0.2));

  return {
    domain,
    totalBacklinks,
    referringDomains,
    domainAuthority: Math.round(20 + Math.random() * 60),
    pageAuthority: Math.round(15 + Math.random() * 55),
    trustFlow: Math.round(10 + Math.random() * 50),
    citationFlow: Math.round(15 + Math.random() * 55),
    doFollowRatio: Math.round((60 + Math.random() * 35) * 10) / 10,
    newBacklinks30d: Math.round(10 + Math.random() * 200),
    lostBacklinks30d: Math.round(5 + Math.random() * 50),
    topAnchors: [
      { anchor: domain.split(".")[0], count: Math.round(totalBacklinks * 0.15), percentage: 15 },
      { anchor: "accounts payable automation", count: Math.round(totalBacklinks * 0.08), percentage: 8 },
      { anchor: "click here", count: Math.round(totalBacklinks * 0.06), percentage: 6 },
      { anchor: "AP software", count: Math.round(totalBacklinks * 0.05), percentage: 5 },
      { anchor: "invoice processing", count: Math.round(totalBacklinks * 0.04), percentage: 4 },
      { anchor: "[image]", count: Math.round(totalBacklinks * 0.03), percentage: 3 },
      { anchor: "learn more", count: Math.round(totalBacklinks * 0.03), percentage: 3 },
      { anchor: "automation tool", count: Math.round(totalBacklinks * 0.02), percentage: 2 },
    ],
    topReferrers: [
      { domain: "g2.com", authority: 92, backlinks: Math.round(20 + Math.random() * 80), doFollow: true },
      { domain: "capterra.com", authority: 88, backlinks: Math.round(15 + Math.random() * 50), doFollow: true },
      { domain: "softwareadvice.com", authority: 85, backlinks: Math.round(10 + Math.random() * 40), doFollow: true },
      { domain: "techcrunch.com", authority: 94, backlinks: Math.round(1 + Math.random() * 5), doFollow: true },
      { domain: "forbes.com", authority: 95, backlinks: Math.round(1 + Math.random() * 3), doFollow: true },
      { domain: "reddit.com", authority: 97, backlinks: Math.round(5 + Math.random() * 20), doFollow: false },
      { domain: "medium.com", authority: 89, backlinks: Math.round(3 + Math.random() * 15), doFollow: false },
      { domain: "linkedin.com", authority: 98, backlinks: Math.round(2 + Math.random() * 10), doFollow: false },
    ],
    backlinkHistory: Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const growth = 1 + i * 0.05;
      return {
        month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        total: Math.round(totalBacklinks * (0.5 + growth * 0.04)),
        referring: Math.round(referringDomains * (0.5 + growth * 0.04)),
      };
    }),
  };
}

function mockGscData(): GscData {
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return d;
  });

  const queries: GscQuery[] = [
    { query: "accounts payable automation", clicks: 342, impressions: 8400, ctr: 4.07, position: 6.2 },
    { query: "AP automation software", clicks: 215, impressions: 5200, ctr: 4.13, position: 7.8 },
    { query: "invoice processing automation", clicks: 189, impressions: 6100, ctr: 3.10, position: 9.4 },
    { query: "automate accounts payable", clicks: 156, impressions: 3800, ctr: 4.11, position: 5.1 },
    { query: "AP automation for small business", clicks: 134, impressions: 2100, ctr: 6.38, position: 3.2 },
    { query: "accounts payable software", clicks: 128, impressions: 4500, ctr: 2.84, position: 11.3 },
    { query: "invoice matching automation", clicks: 98, impressions: 1800, ctr: 5.44, position: 4.7 },
    { query: "three way matching software", clicks: 87, impressions: 1400, ctr: 6.21, position: 3.8 },
    { query: "supplier payment automation", clicks: 76, impressions: 2200, ctr: 3.45, position: 8.9 },
    { query: "AP workflow automation", clicks: 72, impressions: 1600, ctr: 4.50, position: 5.5 },
    { query: "automated invoice approval", clicks: 65, impressions: 1500, ctr: 4.33, position: 6.1 },
    { query: "accounts payable automation quickbooks", clicks: 58, impressions: 920, ctr: 6.30, position: 2.8 },
    { query: "bill.com alternative", clicks: 52, impressions: 780, ctr: 6.67, position: 4.1 },
    { query: "tipalti alternative", clicks: 45, impressions: 620, ctr: 7.26, position: 3.5 },
    { query: "AP automation ROI", clicks: 38, impressions: 540, ctr: 7.04, position: 4.2 },
    { query: "accounts payable best practices", clicks: 112, impressions: 4800, ctr: 2.33, position: 14.2 },
    { query: "reduce invoice processing time", clicks: 42, impressions: 1100, ctr: 3.82, position: 7.6 },
    { query: "AP automation benefits", clicks: 34, impressions: 890, ctr: 3.82, position: 8.3 },
    { query: "invoice automation software UK", clicks: 28, impressions: 450, ctr: 6.22, position: 3.9 },
    { query: "accounts payable automation cost", clicks: 24, impressions: 380, ctr: 6.32, position: 5.7 },
  ].map(q => ({
    ...q,
    trend: months.map((_, i) => Math.round(q.clicks * (0.5 + i * 0.05 + Math.random() * 0.2))),
    pages: [
      `/blog/${q.query.replace(/\s+/g, "-")}`,
      ...(Math.random() > 0.5 ? [`/features/${q.query.split(" ")[0]}`] : []),
    ],
  }));

  const pages: GscPage[] = [
    { page: "/", clicks: 520, impressions: 12000, ctr: 4.33, position: 8.2, topQueries: ["accounts payable automation", "AP automation software"] },
    { page: "/features/automation", clicks: 380, impressions: 6500, ctr: 5.85, position: 5.1, topQueries: ["automate accounts payable", "AP workflow automation"] },
    { page: "/blog/accounts-payable-automation-guide", clicks: 290, impressions: 8200, ctr: 3.54, position: 7.8, topQueries: ["accounts payable automation", "AP automation benefits"] },
    { page: "/blog/invoice-processing-automation", clicks: 210, impressions: 5400, ctr: 3.89, position: 9.1, topQueries: ["invoice processing automation", "automated invoice approval"] },
    { page: "/pricing", clicks: 180, impressions: 2800, ctr: 6.43, position: 4.5, topQueries: ["accounts payable automation cost", "AP automation pricing"] },
    { page: "/blog/bill-com-alternative", clicks: 145, impressions: 1800, ctr: 8.06, position: 3.2, topQueries: ["bill.com alternative", "bill.com competitor"] },
    { page: "/blog/three-way-matching", clicks: 120, impressions: 2100, ctr: 5.71, position: 4.3, topQueries: ["three way matching software", "invoice matching automation"] },
    { page: "/integrations/quickbooks", clicks: 95, impressions: 1400, ctr: 6.79, position: 3.6, topQueries: ["accounts payable automation quickbooks", "quickbooks AP automation"] },
    { page: "/blog/ap-automation-roi-calculator", clicks: 82, impressions: 1200, ctr: 6.83, position: 4.8, topQueries: ["AP automation ROI", "accounts payable automation cost"] },
    { page: "/features/supplier-payments", clicks: 68, impressions: 1600, ctr: 4.25, position: 6.9, topQueries: ["supplier payment automation", "automated supplier payments"] },
  ];

  const totalClicks = queries.reduce((a, q) => a + q.clicks, 0);
  const totalImpressions = queries.reduce((a, q) => a + q.impressions, 0);

  return {
    summary: {
      totalClicks,
      totalImpressions,
      avgCtr: Math.round((totalClicks / totalImpressions) * 10000) / 100,
      avgPosition: Math.round(queries.reduce((a, q) => a + q.position, 0) / queries.length * 10) / 10,
      clicksTrend: months.map((_, i) => Math.round(totalClicks / 12 * (0.6 + i * 0.04 + Math.random() * 0.1))),
      impressionsTrend: months.map((_, i) => Math.round(totalImpressions / 12 * (0.6 + i * 0.04 + Math.random() * 0.1))),
    },
    queries,
    pages,
    devices: [
      { device: "Desktop", clicks: Math.round(totalClicks * 0.62), impressions: Math.round(totalImpressions * 0.58), ctr: 4.62, position: 6.8 },
      { device: "Mobile", clicks: Math.round(totalClicks * 0.32), impressions: Math.round(totalImpressions * 0.36), ctr: 3.84, position: 8.1 },
      { device: "Tablet", clicks: Math.round(totalClicks * 0.06), impressions: Math.round(totalImpressions * 0.06), ctr: 4.12, position: 7.2 },
    ],
    countries: [
      { country: "United Kingdom", clicks: Math.round(totalClicks * 0.45), impressions: Math.round(totalImpressions * 0.40), ctr: 4.87 },
      { country: "United States", clicks: Math.round(totalClicks * 0.30), impressions: Math.round(totalImpressions * 0.32), ctr: 4.06 },
      { country: "Australia", clicks: Math.round(totalClicks * 0.10), impressions: Math.round(totalImpressions * 0.12), ctr: 3.61 },
      { country: "Canada", clicks: Math.round(totalClicks * 0.08), impressions: Math.round(totalImpressions * 0.09), ctr: 3.85 },
      { country: "Germany", clicks: Math.round(totalClicks * 0.04), impressions: Math.round(totalImpressions * 0.04), ctr: 4.33 },
      { country: "India", clicks: Math.round(totalClicks * 0.03), impressions: Math.round(totalImpressions * 0.03), ctr: 4.12 },
    ],
    searchAppearance: [
      { type: "Web", clicks: Math.round(totalClicks * 0.88), impressions: Math.round(totalImpressions * 0.82) },
      { type: "FAQ rich result", clicks: Math.round(totalClicks * 0.06), impressions: Math.round(totalImpressions * 0.08) },
      { type: "How-to rich result", clicks: Math.round(totalClicks * 0.03), impressions: Math.round(totalImpressions * 0.05) },
      { type: "Review snippet", clicks: Math.round(totalClicks * 0.02), impressions: Math.round(totalImpressions * 0.03) },
      { type: "Video", clicks: Math.round(totalClicks * 0.01), impressions: Math.round(totalImpressions * 0.02) },
    ],
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      end: new Date().toISOString().slice(0, 10),
    },
  };
}

function mockContentGaps(keywords: string[], competitors: string[]): ContentGap[] {
  const gapKeywords = [
    { keyword: "purchase order automation", volume: 1800, difficulty: 35, intent: "commercial" },
    { keyword: "AP automation vs manual processing", volume: 880, difficulty: 22, intent: "informational" },
    { keyword: "invoice approval workflow template", volume: 720, difficulty: 18, intent: "transactional" },
    { keyword: "accounts payable KPI dashboard", volume: 540, difficulty: 28, intent: "commercial" },
    { keyword: "vendor management automation", volume: 1200, difficulty: 42, intent: "commercial" },
    { keyword: "duplicate invoice detection software", volume: 390, difficulty: 15, intent: "transactional" },
    { keyword: "AP automation implementation guide", volume: 460, difficulty: 20, intent: "informational" },
    { keyword: "procure to pay automation", volume: 950, difficulty: 38, intent: "commercial" },
    { keyword: "accounts payable fraud prevention", volume: 680, difficulty: 25, intent: "informational" },
    { keyword: "automated receipt processing", volume: 520, difficulty: 19, intent: "commercial" },
    { keyword: "expense management automation", volume: 1500, difficulty: 45, intent: "commercial" },
    { keyword: "accounts payable audit checklist", volume: 340, difficulty: 12, intent: "informational" },
    { keyword: "invoice data extraction AI", volume: 410, difficulty: 30, intent: "commercial" },
    { keyword: "AP department benchmarks", volume: 280, difficulty: 16, intent: "informational" },
    { keyword: "payment reconciliation software", volume: 620, difficulty: 32, intent: "transactional" },
  ];

  return gapKeywords.map(kw => ({
    ...kw,
    competitorsRanking: competitors.slice(0, 2 + Math.floor(Math.random() * 2)).map(domain => ({
      domain,
      position: Math.ceil(Math.random() * 20),
      url: `https://${domain}/blog/${kw.keyword.replace(/\s+/g, "-")}`,
    })),
    yourPosition: Math.random() > 0.6 ? null : Math.ceil(20 + Math.random() * 80),
    opportunity: kw.difficulty < 20 ? "high" as const : kw.difficulty < 35 ? "medium" as const : "low" as const,
    suggestedContentType: kw.intent === "informational" ? "Blog post / Guide" : kw.intent === "transactional" ? "Landing page" : "Comparison page",
  }));
}

// ── Public API (all mock for now) ──

export async function getSerpFeatures(keywords: string[], _countryCode: string): Promise<SerpFeatureResult[]> {
  // TODO: Replace with DataForSEO SERP API call
  return mockSerpFeatures(keywords);
}

export async function getSerpCompetitors(targetDomain: string, countryCode: string): Promise<SerpCompetitor[]> {
  // TODO: Replace with /dataforseo_labs/google/serp_competitors/live
  return mockSerpCompetitors(targetDomain, countryCode);
}

export async function getHistoricalRanks(keywords: string[], _countryCode: string): Promise<HistoricalRank[]> {
  // TODO: Replace with /dataforseo_labs/google/historical_serps/live
  return mockHistoricalRanks(keywords);
}

export async function getBacklinkProfile(domain: string): Promise<BacklinkProfile> {
  // TODO: Replace with DataForSEO Backlinks API
  return mockBacklinkProfile(domain);
}

export async function getBacklinkComparison(domains: string[]): Promise<BacklinkProfile[]> {
  return Promise.all(domains.map(d => mockBacklinkProfile(d)));
}

export async function getGscData(): Promise<GscData> {
  // TODO: Replace with Google Search Console API
  return mockGscData();
}

export async function getContentGaps(keywords: string[], competitors: string[]): Promise<ContentGap[]> {
  return mockContentGaps(keywords, competitors);
}
