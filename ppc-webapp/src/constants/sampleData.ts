import { COLORS } from "./colors";

// ── Sample Data ──
export const SAMPLE_KEYWORDS = [
  { keyword: "accounts payable automation", volume: 2400, cpc: 4.80, competition: 0.34, difficulty: 42, intent: "commercial", trend: [180,210,240,280,320,390,480,520,580,640,720,820], relevance: 95, group: null },
  { keyword: "invoice processing software", volume: 1900, cpc: 5.20, competition: 0.41, difficulty: 48, intent: "commercial", trend: [150,160,180,200,220,250,280,300,340,380,420,480], relevance: 92, group: null },
  { keyword: "automate invoice processing small business", volume: 720, cpc: 3.20, competition: 0.12, difficulty: 24, intent: "transactional", trend: [40,42,55,60,68,80,95,110,130,155,180,220], relevance: 97, group: "high-opportunity" },
  { keyword: "AP automation QuickBooks", volume: 590, cpc: 3.80, competition: 0.18, difficulty: 28, intent: "transactional", trend: [30,35,40,48,55,62,75,88,100,120,140,165], relevance: 98, group: "high-opportunity" },
  { keyword: "accounts payable software for SMB", volume: 480, cpc: 2.90, competition: 0.15, difficulty: 22, intent: "transactional", trend: [25,28,30,35,42,50,58,68,80,95,112,130], relevance: 96, group: "high-opportunity" },
  { keyword: "invoice matching automation", volume: 340, cpc: 4.10, competition: 0.22, difficulty: 31, intent: "commercial", trend: [20,22,25,28,32,38,44,52,60,72,85,100], relevance: 90, group: null },
  { keyword: "three way matching software", volume: 280, cpc: 3.60, competition: 0.19, difficulty: 26, intent: "transactional", trend: [18,20,22,25,28,32,38,44,52,60,70,82], relevance: 88, group: null },
  { keyword: "AP workflow automation tool", volume: 260, cpc: 3.40, competition: 0.16, difficulty: 25, intent: "transactional", trend: [15,18,20,24,28,33,40,48,56,65,76,88], relevance: 94, group: "high-opportunity" },
  { keyword: "supplier payment automation", volume: 420, cpc: 4.50, competition: 0.28, difficulty: 35, intent: "commercial", trend: [28,30,34,38,44,52,60,70,82,95,110,128], relevance: 86, group: null },
  { keyword: "Tipalti alternative small business", volume: 180, cpc: 6.20, competition: 0.08, difficulty: 18, intent: "transactional", trend: [8,10,12,15,18,22,28,35,42,50,60,72], relevance: 99, group: "competitor" },
  { keyword: "Bill.com alternative cheaper", volume: 320, cpc: 5.80, competition: 0.11, difficulty: 20, intent: "transactional", trend: [15,18,22,28,35,42,50,60,72,85,100,118], relevance: 99, group: "competitor" },
  { keyword: "automated invoice approval workflow", volume: 210, cpc: 3.10, competition: 0.14, difficulty: 23, intent: "commercial", trend: [12,14,16,18,22,26,30,36,42,50,58,68], relevance: 91, group: null },
  { keyword: "reduce invoice processing time", volume: 390, cpc: 2.60, competition: 0.09, difficulty: 19, intent: "informational", trend: [22,25,28,32,38,45,54,62,72,84,98,115], relevance: 82, group: null },
  { keyword: "AP automation Xero integration", volume: 160, cpc: 3.40, competition: 0.10, difficulty: 17, intent: "transactional", trend: [8,9,11,13,16,20,24,30,36,42,50,58], relevance: 97, group: "high-opportunity" },
  { keyword: "purchase order automation software", volume: 310, cpc: 4.00, competition: 0.25, difficulty: 33, intent: "commercial", trend: [18,20,23,26,30,36,42,50,58,68,80,94], relevance: 84, group: null },
];

export const SAMPLE_COMPETITORS = [
  { domain: "bill.com", keywords_shared: 42, paid_keywords: 128, organic_keywords: 890, est_traffic: 45200, budget: "$82K/mo" },
  { domain: "tipalti.com", keywords_shared: 31, paid_keywords: 95, organic_keywords: 620, est_traffic: 28400, budget: "$54K/mo" },
  { domain: "stampli.com", keywords_shared: 18, paid_keywords: 44, organic_keywords: 340, est_traffic: 12800, budget: "$22K/mo" },
  { domain: "avidxchange.com", keywords_shared: 24, paid_keywords: 67, organic_keywords: 510, est_traffic: 19600, budget: "$38K/mo" },
];

export const SAMPLE_CAMPAIGNS = [
  {
    name: "Nexus AP — UK Launch",
    status: "draft",
    adGroups: [
      {
        name: "Invoice Processing",
        keywords: ["automate invoice processing small business", "invoice processing software", "automated invoice approval workflow"],
        headlines: ["Automate Your Invoice Processing", "Cut Invoice Time by 80%", "AP Automation from £49/mo"],
        descriptions: ["Stop processing invoices manually. Nexus AP automates matching, approval & payment in one platform.", "Connect QuickBooks or Xero in 2 minutes. See every invoice, every approval, every payment — in real time."],
      },
      {
        name: "QuickBooks/Xero Integration",
        keywords: ["AP automation QuickBooks", "AP automation Xero integration", "accounts payable software for SMB"],
        headlines: ["AP Automation for QuickBooks", "Connect Xero in 2 Minutes", "Automate Payables — £49/mo"],
        descriptions: ["Purpose-built AP automation that plugs directly into your existing QuickBooks or Xero. No migration needed.", "Three-way matching, automated approvals, and supplier payments — all synced with your accounting software."],
      },
      {
        name: "Competitor Alternatives",
        keywords: ["Bill.com alternative cheaper", "Tipalti alternative small business"],
        headlines: ["Tired of Bill.com Pricing?", "The Tipalti Alternative for SMBs", "AP Automation Without the Bloat"],
        descriptions: ["Nexus AP delivers everything Bill.com does at a fraction of the cost. Built for small and mid-market teams.", "Enterprise AP features without enterprise complexity. Switch from Tipalti in under a week."],
      },
    ],
  },
];

export const SAMPLE_PRODUCTS = [
  { name: "Nexus AP", description: "Accounts payable automation suite for SMBs", acv: "£588-2,400", target: "Financial Controllers, AP Managers", integrations: "QuickBooks, Xero" },
];

// ── GSC Sample Data ──
export const SAMPLE_GSC_DATA = [
  { query: "accounts payable automation", clicks: 342, impressions: 8420, ctr: 4.06, position: 6.2, trend: [28,32,35,38,42,48,52,58,62,68,72,78] },
  { query: "invoice processing software", clicks: 218, impressions: 6100, ctr: 3.57, position: 8.1, trend: [18,20,22,24,26,28,30,32,34,36,38,40] },
  { query: "AP automation for small business", clicks: 186, impressions: 3200, ctr: 5.81, position: 4.3, trend: [12,14,16,18,22,26,30,34,38,42,46,50] },
  { query: "automate invoice processing", clicks: 164, impressions: 4800, ctr: 3.42, position: 7.5, trend: [10,12,14,16,18,20,22,24,26,28,30,34] },
  { query: "accounts payable software SMB", clicks: 142, impressions: 2100, ctr: 6.76, position: 3.8, trend: [8,10,12,14,18,22,26,30,34,38,42,48] },
  { query: "three way matching software", clicks: 98, impressions: 1800, ctr: 5.44, position: 5.1, trend: [6,7,8,9,10,12,14,16,18,20,22,24] },
  { query: "AP workflow automation", clicks: 87, impressions: 2400, ctr: 3.63, position: 9.2, trend: [4,5,6,7,8,10,12,14,16,18,20,22] },
  { query: "supplier payment automation tool", clicks: 76, impressions: 1600, ctr: 4.75, position: 6.8, trend: [4,5,6,6,7,8,10,12,14,16,18,20] },
  { query: "QuickBooks AP automation", clicks: 64, impressions: 980, ctr: 6.53, position: 3.2, trend: [3,4,5,6,7,8,9,10,12,14,16,18] },
  { query: "Xero accounts payable integration", clicks: 52, impressions: 720, ctr: 7.22, position: 2.9, trend: [2,3,4,4,5,6,7,8,10,12,14,16] },
  { query: "automated invoice approval", clicks: 48, impressions: 1400, ctr: 3.43, position: 11.4, trend: [2,3,3,4,4,5,6,7,8,9,10,12] },
  { query: "reduce AP processing time", clicks: 44, impressions: 1200, ctr: 3.67, position: 10.6, trend: [2,3,3,4,4,5,6,6,7,8,9,10] },
];

export const SAMPLE_GSC_PAGES = [
  { page: "/features/invoice-automation", clicks: 520, impressions: 12400, ctr: 4.19, position: 5.8 },
  { page: "/pricing", clicks: 380, impressions: 8200, ctr: 4.63, position: 4.2 },
  { page: "/integrations/quickbooks", clicks: 210, impressions: 3600, ctr: 5.83, position: 3.5 },
  { page: "/integrations/xero", clicks: 165, impressions: 2800, ctr: 5.89, position: 3.1 },
  { page: "/blog/ap-automation-guide", clicks: 340, impressions: 14200, ctr: 2.39, position: 12.4 },
  { page: "/vs/bill-com", clicks: 148, impressions: 2200, ctr: 6.73, position: 4.8 },
  { page: "/vs/tipalti", clicks: 92, impressions: 1400, ctr: 6.57, position: 5.2 },
];

// ── GA Sample Data ──
export const SAMPLE_GA_DATA = {
  overview: {
    users: 12480, newUsers: 8920, sessions: 18640, bounceRate: 42.3,
    avgSessionDuration: "3:24", pagesPerSession: 2.8,
    usersTrend: [820,880,920,980,1040,1100,1180,1250,1320,1400,1480,1560],
    sessionsTrend: [1200,1280,1360,1440,1520,1620,1740,1850,1960,2080,2200,2340],
  },
  channels: [
    { channel: "Organic Search", users: 5240, sessions: 7860, bounceRate: 38.2, convRate: 3.4, revenue: "£18,400", color: COLORS.green },
    { channel: "Paid Search", users: 2840, sessions: 4260, bounceRate: 44.1, convRate: 4.8, revenue: "£22,600", color: COLORS.amber },
    { channel: "Direct", users: 1960, sessions: 2940, bounceRate: 35.6, convRate: 2.1, revenue: "£6,200", color: COLORS.accent },
    { channel: "Social", users: 1280, sessions: 1920, bounceRate: 58.4, convRate: 1.2, revenue: "£2,800", color: COLORS.purple },
    { channel: "Referral", users: 860, sessions: 1290, bounceRate: 41.8, convRate: 2.8, revenue: "£4,100", color: COLORS.red },
    { channel: "Email", users: 300, sessions: 450, bounceRate: 32.1, convRate: 5.6, revenue: "£3,400", color: "#0ea5e9" },
  ],
  topPages: [
    { page: "/", pageviews: 8420, uniquePageviews: 6200, avgTimeOnPage: "1:42", bounceRate: 38.5, exitRate: 28.2 },
    { page: "/features/invoice-automation", pageviews: 4280, uniquePageviews: 3400, avgTimeOnPage: "4:12", bounceRate: 22.8, exitRate: 18.4 },
    { page: "/pricing", pageviews: 3620, uniquePageviews: 2800, avgTimeOnPage: "2:58", bounceRate: 31.2, exitRate: 42.6 },
    { page: "/blog/ap-automation-guide", pageviews: 2840, uniquePageviews: 2400, avgTimeOnPage: "5:34", bounceRate: 52.1, exitRate: 48.8 },
    { page: "/integrations/quickbooks", pageviews: 1960, uniquePageviews: 1580, avgTimeOnPage: "3:28", bounceRate: 28.4, exitRate: 22.1 },
    { page: "/demo", pageviews: 1420, uniquePageviews: 1100, avgTimeOnPage: "6:15", bounceRate: 18.2, exitRate: 15.6 },
  ],
  conversions: [
    { goal: "Demo Request", completions: 142, convRate: 0.76, value: "£42,600" },
    { goal: "Free Trial Signup", completions: 86, convRate: 0.46, value: "£25,800" },
    { goal: "Contact Form", completions: 64, convRate: 0.34, value: "£12,800" },
    { goal: "Pricing Page View", completions: 2800, convRate: 15.02, value: "—" },
  ],
};

// ── Country Market Data (per-country keywords, GSC, GA) ──
export const COUNTRY_MARKETS: Record<string, any> = {
  GB: {
    code: "GB", flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom", currency: "\u00A3",
    competitorNote: "Bill.com has no active UK paid campaigns for AP automation",
    keywords: [
      { keyword: "accounts payable automation", volume: 2400, cpc: 4.80, competition: 0.34, difficulty: 42, intent: "commercial", trend: [180,210,240,280,320,390,480,520,580,640,720,820], relevance: 95, group: null },
      { keyword: "invoice processing software", volume: 1900, cpc: 5.20, competition: 0.41, difficulty: 48, intent: "commercial", trend: [150,160,180,200,220,250,280,300,340,380,420,480], relevance: 92, group: null },
      { keyword: "automate invoice processing small business", volume: 720, cpc: 3.20, competition: 0.12, difficulty: 24, intent: "transactional", trend: [40,42,55,60,68,80,95,110,130,155,180,220], relevance: 97, group: "high-opportunity" },
      { keyword: "AP automation QuickBooks", volume: 590, cpc: 3.80, competition: 0.18, difficulty: 28, intent: "transactional", trend: [30,35,40,48,55,62,75,88,100,120,140,165], relevance: 98, group: "high-opportunity" },
      { keyword: "accounts payable software for SMB", volume: 480, cpc: 2.90, competition: 0.15, difficulty: 22, intent: "transactional", trend: [25,28,30,35,42,50,58,68,80,95,112,130], relevance: 96, group: "high-opportunity" },
      { keyword: "invoice matching automation", volume: 340, cpc: 4.10, competition: 0.22, difficulty: 31, intent: "commercial", trend: [20,22,25,28,32,38,44,52,60,72,85,100], relevance: 90, group: null },
      { keyword: "three way matching software", volume: 280, cpc: 3.60, competition: 0.19, difficulty: 26, intent: "transactional", trend: [18,20,22,25,28,32,38,44,52,60,70,82], relevance: 88, group: null },
      { keyword: "AP workflow automation tool", volume: 260, cpc: 3.40, competition: 0.16, difficulty: 25, intent: "transactional", trend: [15,18,20,24,28,33,40,48,56,65,76,88], relevance: 94, group: "high-opportunity" },
      { keyword: "supplier payment automation", volume: 420, cpc: 4.50, competition: 0.28, difficulty: 35, intent: "commercial", trend: [28,30,34,38,44,52,60,70,82,95,110,128], relevance: 86, group: null },
      { keyword: "Tipalti alternative small business", volume: 180, cpc: 6.20, competition: 0.08, difficulty: 18, intent: "transactional", trend: [8,10,12,15,18,22,28,35,42,50,60,72], relevance: 99, group: "competitor" },
      { keyword: "Bill.com alternative cheaper", volume: 320, cpc: 5.80, competition: 0.11, difficulty: 20, intent: "transactional", trend: [15,18,22,28,35,42,50,60,72,85,100,118], relevance: 99, group: "competitor" },
      { keyword: "automated invoice approval workflow", volume: 210, cpc: 3.10, competition: 0.14, difficulty: 23, intent: "commercial", trend: [12,14,16,18,22,26,30,36,42,50,58,68], relevance: 91, group: null },
      { keyword: "reduce invoice processing time", volume: 390, cpc: 2.60, competition: 0.09, difficulty: 19, intent: "informational", trend: [22,25,28,32,38,45,54,62,72,84,98,115], relevance: 82, group: null },
      { keyword: "AP automation Xero integration", volume: 160, cpc: 3.40, competition: 0.10, difficulty: 17, intent: "transactional", trend: [8,9,11,13,16,20,24,30,36,42,50,58], relevance: 97, group: "high-opportunity" },
      { keyword: "purchase order automation software", volume: 310, cpc: 4.00, competition: 0.25, difficulty: 33, intent: "commercial", trend: [18,20,23,26,30,36,42,50,58,68,80,94], relevance: 84, group: null },
    ],
    gsc: [
      { query: "accounts payable automation", clicks: 342, impressions: 8420, ctr: 4.06, position: 6.2, trend: [28,32,35,38,42,48,52,58,62,68,72,78] },
      { query: "invoice processing software", clicks: 218, impressions: 6100, ctr: 3.57, position: 8.1, trend: [18,20,22,24,26,28,30,32,34,36,38,40] },
      { query: "AP automation for small business", clicks: 186, impressions: 3200, ctr: 5.81, position: 4.3, trend: [12,14,16,18,22,26,30,34,38,42,46,50] },
      { query: "automate invoice processing", clicks: 164, impressions: 4800, ctr: 3.42, position: 7.5, trend: [10,12,14,16,18,20,22,24,26,28,30,34] },
      { query: "accounts payable software SMB", clicks: 142, impressions: 2100, ctr: 6.76, position: 3.8, trend: [8,10,12,14,18,22,26,30,34,38,42,48] },
      { query: "three way matching software", clicks: 98, impressions: 1800, ctr: 5.44, position: 5.1, trend: [6,7,8,9,10,12,14,16,18,20,22,24] },
      { query: "AP workflow automation", clicks: 87, impressions: 2400, ctr: 3.63, position: 9.2, trend: [4,5,6,7,8,10,12,14,16,18,20,22] },
      { query: "QuickBooks AP automation", clicks: 64, impressions: 980, ctr: 6.53, position: 3.2, trend: [3,4,5,6,7,8,9,10,12,14,16,18] },
      { query: "Xero accounts payable integration", clicks: 52, impressions: 720, ctr: 7.22, position: 2.9, trend: [2,3,4,4,5,6,7,8,10,12,14,16] },
    ],
    ga: { users: 12480, sessions: 18640, bounceRate: 42.3, avgDuration: "3:24" },
  },
  US: {
    code: "US", flag: "\u{1F1FA}\u{1F1F8}", name: "United States", currency: "$",
    competitorNote: "Highly saturated \u2014 Bill.com, Tipalti, and AvidXchange all active",
    keywords: [
      { keyword: "accounts payable automation software", volume: 9800, cpc: 6.40, competition: 0.72, difficulty: 68, intent: "commercial", trend: [680,720,780,840,920,1020,1140,1260,1380,1520,1680,1840], relevance: 94, group: null },
      { keyword: "AP automation solutions", volume: 6200, cpc: 7.10, competition: 0.65, difficulty: 62, intent: "commercial", trend: [420,460,500,540,600,680,760,840,940,1040,1160,1280], relevance: 90, group: null },
      { keyword: "best invoice processing software", volume: 4100, cpc: 5.80, competition: 0.58, difficulty: 55, intent: "commercial", trend: [280,300,340,380,420,480,540,600,680,760,840,940], relevance: 88, group: null },
      { keyword: "automate accounts payable process", volume: 2800, cpc: 4.20, competition: 0.28, difficulty: 34, intent: "transactional", trend: [180,200,220,250,280,320,360,400,450,510,580,660], relevance: 96, group: "high-opportunity" },
      { keyword: "AP automation for small business", volume: 2200, cpc: 3.90, competition: 0.22, difficulty: 28, intent: "transactional", trend: [140,160,180,200,230,260,300,340,390,440,500,570], relevance: 97, group: "high-opportunity" },
      { keyword: "accounts payable software QuickBooks", volume: 1800, cpc: 4.80, competition: 0.35, difficulty: 38, intent: "transactional", trend: [110,125,140,160,180,210,240,280,320,360,410,470], relevance: 98, group: "high-opportunity" },
      { keyword: "invoice approval workflow software", volume: 1200, cpc: 5.50, competition: 0.42, difficulty: 45, intent: "commercial", trend: [80,90,100,115,130,150,170,195,220,250,285,320], relevance: 89, group: null },
      { keyword: "three way match automation", volume: 980, cpc: 4.90, competition: 0.31, difficulty: 36, intent: "transactional", trend: [60,68,78,88,100,115,130,150,170,195,225,260], relevance: 87, group: null },
      { keyword: "Bill.com alternative", volume: 1600, cpc: 8.40, competition: 0.18, difficulty: 24, intent: "transactional", trend: [90,110,130,155,180,215,260,310,370,440,520,620], relevance: 99, group: "competitor" },
      { keyword: "Tipalti competitor", volume: 720, cpc: 7.80, competition: 0.14, difficulty: 20, intent: "transactional", trend: [40,48,58,70,84,100,120,145,175,210,255,310], relevance: 99, group: "competitor" },
      { keyword: "AvidXchange alternative for SMBs", volume: 440, cpc: 6.90, competition: 0.10, difficulty: 16, intent: "transactional", trend: [22,26,32,38,46,56,68,82,100,120,145,175], relevance: 98, group: "competitor" },
      { keyword: "vendor payment automation", volume: 1400, cpc: 4.60, competition: 0.38, difficulty: 42, intent: "commercial", trend: [90,100,115,130,150,175,200,230,260,300,340,390], relevance: 85, group: null },
      { keyword: "purchase order automation", volume: 1100, cpc: 5.20, competition: 0.45, difficulty: 48, intent: "commercial", trend: [70,80,92,105,120,140,160,185,210,240,275,315], relevance: 83, group: null },
      { keyword: "reduce AP processing costs", volume: 860, cpc: 3.40, competition: 0.12, difficulty: 18, intent: "informational", trend: [55,62,72,82,95,110,128,148,170,195,225,260], relevance: 80, group: null },
      { keyword: "NetSuite AP automation", volume: 680, cpc: 6.80, competition: 0.30, difficulty: 35, intent: "transactional", trend: [40,46,54,62,72,84,98,115,135,158,185,218], relevance: 92, group: "high-opportunity" },
    ],
    gsc: [
      { query: "accounts payable automation software", clicks: 1280, impressions: 32000, ctr: 4.0, position: 6.8, trend: [90,100,110,120,135,150,168,188,210,235,260,290] },
      { query: "AP automation solutions", clicks: 820, impressions: 22400, ctr: 3.66, position: 8.4, trend: [55,62,70,78,88,100,112,126,142,160,180,202] },
      { query: "best invoice processing software", clicks: 640, impressions: 18600, ctr: 3.44, position: 9.2, trend: [42,48,54,62,70,80,90,102,116,132,150,170] },
      { query: "automate accounts payable", clicks: 520, impressions: 8400, ctr: 6.19, position: 4.1, trend: [34,38,44,50,58,66,76,88,100,115,132,152] },
      { query: "AP automation small business", clicks: 440, impressions: 6800, ctr: 6.47, position: 3.6, trend: [28,32,38,44,50,58,68,78,90,104,120,138] },
      { query: "Bill.com alternative", clicks: 380, impressions: 5200, ctr: 7.31, position: 3.2, trend: [22,26,30,36,42,50,60,72,86,102,122,146] },
      { query: "QuickBooks AP automation", clicks: 210, impressions: 3200, ctr: 6.56, position: 3.8, trend: [12,14,16,20,24,28,34,40,48,56,68,82] },
      { query: "NetSuite accounts payable", clicks: 165, impressions: 2800, ctr: 5.89, position: 5.1, trend: [10,12,14,16,18,22,26,30,36,42,50,60] },
    ],
    ga: { users: 43680, sessions: 65240, bounceRate: 44.8, avgDuration: "2:58" },
  },
  DE: {
    code: "DE", flag: "\u{1F1E9}\u{1F1EA}", name: "Germany", currency: "\u20AC",
    competitorNote: "Low competition \u2014 Tipalti and Stampli have minimal German presence",
    keywords: [
      { keyword: "Kreditorenbuchhaltung automatisieren", volume: 1400, cpc: 3.80, competition: 0.18, difficulty: 22, intent: "commercial", trend: [80,90,100,115,130,150,175,200,230,265,305,350], relevance: 95, group: "high-opportunity" },
      { keyword: "Rechnungsverarbeitung Software", volume: 1100, cpc: 4.20, competition: 0.24, difficulty: 28, intent: "commercial", trend: [65,72,82,92,105,120,138,158,182,210,242,280], relevance: 93, group: null },
      { keyword: "automatische Rechnungserfassung", volume: 880, cpc: 3.40, competition: 0.14, difficulty: 18, intent: "transactional", trend: [50,56,65,74,85,98,112,130,150,172,198,228], relevance: 96, group: "high-opportunity" },
      { keyword: "AP Automatisierung Buchhaltung", volume: 620, cpc: 3.10, competition: 0.12, difficulty: 16, intent: "transactional", trend: [35,40,46,52,60,70,80,92,106,122,142,165], relevance: 97, group: "high-opportunity" },
      { keyword: "Rechnungsfreigabe digitalisieren", volume: 540, cpc: 2.80, competition: 0.10, difficulty: 14, intent: "transactional", trend: [30,34,40,46,52,62,72,84,96,112,130,150], relevance: 94, group: "high-opportunity" },
      { keyword: "Lieferantenzahlung automatisieren", volume: 380, cpc: 3.60, competition: 0.16, difficulty: 20, intent: "commercial", trend: [22,25,28,32,38,44,52,60,70,82,95,110], relevance: 88, group: null },
      { keyword: "DATEV Kreditorenbuchhaltung Software", volume: 460, cpc: 4.50, competition: 0.20, difficulty: 25, intent: "transactional", trend: [25,28,32,38,44,52,60,70,82,95,112,130], relevance: 98, group: "high-opportunity" },
      { keyword: "Drei-Wege-Abgleich Software", volume: 220, cpc: 3.20, competition: 0.08, difficulty: 12, intent: "transactional", trend: [12,14,16,18,22,26,30,36,42,50,58,68], relevance: 86, group: null },
      { keyword: "Bill.com Alternative Deutschland", volume: 140, cpc: 5.40, competition: 0.06, difficulty: 10, intent: "transactional", trend: [6,8,10,12,14,18,22,28,34,42,52,65], relevance: 99, group: "competitor" },
      { keyword: "Rechnungseingangsbuch automatisieren", volume: 320, cpc: 2.60, competition: 0.09, difficulty: 13, intent: "commercial", trend: [18,20,24,28,32,38,44,52,60,70,82,96], relevance: 90, group: null },
      { keyword: "SAP Kreditorenbuchhaltung Alternative KMU", volume: 260, cpc: 5.80, competition: 0.15, difficulty: 19, intent: "transactional", trend: [14,16,18,22,26,30,36,42,50,58,68,80], relevance: 92, group: "competitor" },
      { keyword: "Bestellautomatisierung Software", volume: 290, cpc: 3.00, competition: 0.11, difficulty: 15, intent: "commercial", trend: [16,18,22,25,30,35,42,48,56,66,78,92], relevance: 82, group: null },
    ],
    gsc: [
      { query: "Kreditorenbuchhaltung automatisieren", clicks: 128, impressions: 3200, ctr: 4.0, position: 5.8, trend: [8,10,12,14,16,18,22,26,30,35,40,46] },
      { query: "Rechnungsverarbeitung Software", clicks: 95, impressions: 2800, ctr: 3.39, position: 7.2, trend: [6,7,8,10,12,14,16,18,22,25,28,32] },
      { query: "automatische Rechnungserfassung", clicks: 82, impressions: 1600, ctr: 5.13, position: 4.2, trend: [5,6,7,8,10,12,14,16,18,22,26,30] },
      { query: "AP Automatisierung KMU", clicks: 56, impressions: 980, ctr: 5.71, position: 3.6, trend: [3,4,5,6,7,8,10,12,14,16,18,22] },
      { query: "DATEV Rechnungsverarbeitung", clicks: 44, impressions: 720, ctr: 6.11, position: 3.1, trend: [2,3,3,4,5,6,7,8,10,12,14,16] },
      { query: "Rechnungsfreigabe digital", clicks: 38, impressions: 640, ctr: 5.94, position: 4.5, trend: [2,2,3,3,4,5,6,7,8,10,12,14] },
    ],
    ga: { users: 3740, sessions: 5590, bounceRate: 40.1, avgDuration: "3:48" },
  },
  AU: {
    code: "AU", flag: "\u{1F1E6}\u{1F1FA}", name: "Australia", currency: "A$",
    competitorNote: "Very low competition \u2014 no major AP automation players running paid campaigns",
    keywords: [
      { keyword: "accounts payable automation Australia", volume: 580, cpc: 4.20, competition: 0.12, difficulty: 16, intent: "commercial", trend: [30,34,38,44,50,58,68,78,90,105,122,142], relevance: 96, group: "high-opportunity" },
      { keyword: "invoice processing software Australia", volume: 440, cpc: 4.80, competition: 0.18, difficulty: 22, intent: "commercial", trend: [24,28,32,36,42,48,56,65,75,88,102,118], relevance: 92, group: null },
      { keyword: "AP automation Xero Australia", volume: 320, cpc: 3.60, competition: 0.08, difficulty: 12, intent: "transactional", trend: [16,18,22,26,30,36,42,50,58,68,80,95], relevance: 99, group: "high-opportunity" },
      { keyword: "creditors automation software", volume: 260, cpc: 3.40, competition: 0.10, difficulty: 14, intent: "commercial", trend: [14,16,18,22,26,30,36,42,48,56,66,78], relevance: 90, group: null },
      { keyword: "automate supplier payments AUD", volume: 180, cpc: 3.80, competition: 0.06, difficulty: 10, intent: "transactional", trend: [8,10,12,14,16,20,24,28,34,40,48,58], relevance: 94, group: "high-opportunity" },
      { keyword: "MYOB accounts payable integration", volume: 210, cpc: 4.40, competition: 0.09, difficulty: 13, intent: "transactional", trend: [10,12,14,16,20,24,28,34,40,48,56,66], relevance: 97, group: "high-opportunity" },
      { keyword: "Xero invoice automation add-on", volume: 290, cpc: 3.20, competition: 0.07, difficulty: 11, intent: "transactional", trend: [15,18,20,24,28,34,40,48,56,66,78,92], relevance: 98, group: "high-opportunity" },
      { keyword: "purchase order software small business AU", volume: 150, cpc: 3.00, competition: 0.05, difficulty: 8, intent: "transactional", trend: [6,8,10,12,14,18,22,26,32,38,46,56], relevance: 85, group: null },
      { keyword: "Bill.com alternative Australia", volume: 120, cpc: 5.60, competition: 0.04, difficulty: 7, intent: "transactional", trend: [4,6,8,10,12,15,18,22,28,35,42,52], relevance: 99, group: "competitor" },
      { keyword: "three way matching Xero", volume: 160, cpc: 3.10, competition: 0.06, difficulty: 9, intent: "transactional", trend: [8,9,11,14,16,20,24,28,34,40,48,58], relevance: 88, group: null },
      { keyword: "AP workflow automation Australia", volume: 130, cpc: 3.50, competition: 0.07, difficulty: 10, intent: "transactional", trend: [6,7,8,10,12,15,18,22,26,32,38,46], relevance: 93, group: "high-opportunity" },
    ],
    gsc: [
      { query: "accounts payable automation Australia", clicks: 68, impressions: 1800, ctr: 3.78, position: 6.4, trend: [4,5,6,7,8,9,10,12,14,16,18,22] },
      { query: "Xero AP automation", clicks: 52, impressions: 980, ctr: 5.31, position: 3.8, trend: [3,3,4,5,6,7,8,9,10,12,14,16] },
      { query: "MYOB invoice automation", clicks: 38, impressions: 720, ctr: 5.28, position: 4.2, trend: [2,2,3,3,4,5,6,7,8,9,10,12] },
      { query: "creditors automation software", clicks: 28, impressions: 640, ctr: 4.38, position: 5.6, trend: [1,2,2,3,3,4,4,5,6,7,8,10] },
      { query: "automate supplier payments", clicks: 22, impressions: 480, ctr: 4.58, position: 5.2, trend: [1,1,2,2,2,3,3,4,5,6,7,8] },
    ],
    ga: { users: 3120, sessions: 4660, bounceRate: 39.8, avgDuration: "3:36" },
  },
  CA: {
    code: "CA", flag: "\u{1F1E8}\u{1F1E6}", name: "Canada", currency: "C$",
    competitorNote: "Moderate competition \u2014 Bill.com active but limited budget",
    keywords: [
      { keyword: "accounts payable automation Canada", volume: 1200, cpc: 5.00, competition: 0.28, difficulty: 32, intent: "commercial", trend: [70,80,90,105,120,140,162,188,218,252,292,340], relevance: 94, group: null },
      { keyword: "invoice processing software Canada", volume: 880, cpc: 5.40, competition: 0.32, difficulty: 36, intent: "commercial", trend: [52,58,66,76,88,102,118,136,158,184,212,246], relevance: 91, group: null },
      { keyword: "AP automation for Canadian business", volume: 540, cpc: 3.60, competition: 0.14, difficulty: 18, intent: "transactional", trend: [28,32,38,44,52,62,72,84,98,114,132,156], relevance: 97, group: "high-opportunity" },
      { keyword: "automate accounts payable QuickBooks CA", volume: 380, cpc: 4.20, competition: 0.16, difficulty: 20, intent: "transactional", trend: [20,24,28,32,38,44,52,62,72,84,98,116], relevance: 98, group: "high-opportunity" },
      { keyword: "supplier payment automation Canada", volume: 280, cpc: 4.60, competition: 0.22, difficulty: 26, intent: "commercial", trend: [15,18,20,24,28,34,40,46,55,64,76,90], relevance: 86, group: null },
      { keyword: "Bill.com alternative Canada", volume: 240, cpc: 6.80, competition: 0.10, difficulty: 14, intent: "transactional", trend: [10,12,16,20,25,30,38,46,56,68,82,100], relevance: 99, group: "competitor" },
      { keyword: "three way matching software Canada", volume: 180, cpc: 3.80, competition: 0.12, difficulty: 16, intent: "transactional", trend: [9,10,12,14,18,22,26,32,38,46,56,68], relevance: 87, group: null },
      { keyword: "Sage accounts payable automation", volume: 320, cpc: 5.20, competition: 0.20, difficulty: 24, intent: "transactional", trend: [18,20,24,28,34,40,48,56,66,78,92,108], relevance: 93, group: "high-opportunity" },
      { keyword: "invoice approval workflow Canada", volume: 160, cpc: 3.40, competition: 0.11, difficulty: 15, intent: "commercial", trend: [8,10,12,14,16,20,24,28,34,40,48,56], relevance: 89, group: null },
      { keyword: "AP automation Xero Canada", volume: 140, cpc: 3.60, competition: 0.08, difficulty: 12, intent: "transactional", trend: [6,8,10,12,14,18,22,26,32,38,46,56], relevance: 96, group: "high-opportunity" },
      { keyword: "purchase order automation Canada", volume: 220, cpc: 4.00, competition: 0.18, difficulty: 22, intent: "commercial", trend: [12,14,16,18,22,26,32,38,44,52,62,74], relevance: 82, group: null },
    ],
    gsc: [
      { query: "accounts payable automation Canada", clicks: 142, impressions: 3800, ctr: 3.74, position: 6.8, trend: [8,10,12,14,16,18,22,26,30,34,40,46] },
      { query: "invoice processing software Canada", clicks: 98, impressions: 2800, ctr: 3.50, position: 7.6, trend: [6,7,8,10,12,14,16,18,20,24,28,32] },
      { query: "AP automation Canadian business", clicks: 76, impressions: 1400, ctr: 5.43, position: 4.2, trend: [4,5,6,7,8,10,12,14,16,18,22,26] },
      { query: "QuickBooks AP automation Canada", clicks: 52, impressions: 860, ctr: 6.05, position: 3.4, trend: [3,3,4,5,6,7,8,9,10,12,14,16] },
      { query: "Bill.com alternative Canada", clicks: 44, impressions: 680, ctr: 6.47, position: 3.8, trend: [2,3,3,4,5,6,7,8,10,12,14,16] },
      { query: "Sage AP automation", clicks: 36, impressions: 620, ctr: 5.81, position: 4.6, trend: [2,2,3,3,4,5,6,7,8,9,10,12] },
    ],
    ga: { users: 6240, sessions: 9320, bounceRate: 41.6, avgDuration: "3:18" },
  },
  FR: {
    code: "FR", flag: "\u{1F1EB}\u{1F1F7}", name: "France", currency: "\u20AC",
    competitorNote: "Low competition \u2014 French market prefers local AP solutions",
    keywords: [
      { keyword: "automatisation comptabilit\u00E9 fournisseurs", volume: 1200, cpc: 3.40, competition: 0.16, difficulty: 20, intent: "commercial", trend: [65,74,85,98,112,130,150,172,198,228,265,305], relevance: 95, group: "high-opportunity" },
      { keyword: "logiciel traitement factures", volume: 980, cpc: 3.80, competition: 0.22, difficulty: 26, intent: "commercial", trend: [55,62,72,82,95,110,128,148,170,196,226,260], relevance: 93, group: null },
      { keyword: "d\u00E9mat\u00E9rialisation factures fournisseurs", volume: 1600, cpc: 2.90, competition: 0.20, difficulty: 24, intent: "commercial", trend: [90,102,118,135,155,180,208,240,276,320,370,425], relevance: 88, group: null },
      { keyword: "automatiser saisie factures", volume: 720, cpc: 2.60, competition: 0.10, difficulty: 14, intent: "transactional", trend: [38,44,50,58,68,78,90,105,122,142,165,192], relevance: 97, group: "high-opportunity" },
      { keyword: "logiciel comptabilit\u00E9 fournisseurs PME", volume: 540, cpc: 3.20, competition: 0.12, difficulty: 16, intent: "transactional", trend: [28,32,38,44,52,60,70,82,95,112,130,152], relevance: 96, group: "high-opportunity" },
      { keyword: "rapprochement factures automatique", volume: 380, cpc: 3.00, competition: 0.08, difficulty: 12, intent: "transactional", trend: [20,24,28,32,38,44,52,60,70,82,96,112], relevance: 90, group: "high-opportunity" },
      { keyword: "workflow validation factures", volume: 460, cpc: 2.80, competition: 0.14, difficulty: 18, intent: "commercial", trend: [24,28,32,38,44,52,60,70,82,95,112,130], relevance: 91, group: null },
      { keyword: "Sage alternative comptabilit\u00E9", volume: 320, cpc: 5.20, competition: 0.18, difficulty: 22, intent: "transactional", trend: [16,18,22,26,32,38,46,54,64,76,90,108], relevance: 92, group: "competitor" },
      { keyword: "Cegid alternative PME", volume: 280, cpc: 4.80, competition: 0.15, difficulty: 19, intent: "transactional", trend: [14,16,18,22,26,32,38,46,54,65,78,94], relevance: 88, group: "competitor" },
      { keyword: "paiement fournisseurs automatis\u00E9", volume: 240, cpc: 3.40, competition: 0.09, difficulty: 13, intent: "transactional", trend: [12,14,16,20,24,28,34,40,48,56,68,82], relevance: 86, group: null },
      { keyword: "facture \u00E9lectronique obligatoire 2026", volume: 2800, cpc: 1.80, competition: 0.06, difficulty: 8, intent: "informational", trend: [120,150,190,240,300,380,480,600,750,940,1180,1480], relevance: 78, group: null },
      { keyword: "int\u00E9gration Sage comptabilit\u00E9 fournisseurs", volume: 180, cpc: 4.60, competition: 0.11, difficulty: 15, intent: "transactional", trend: [8,10,12,14,18,22,26,32,38,46,56,68], relevance: 95, group: "high-opportunity" },
    ],
    gsc: [
      { query: "automatisation comptabilit\u00E9 fournisseurs", clicks: 92, impressions: 2400, ctr: 3.83, position: 5.4, trend: [5,6,7,8,10,12,14,16,18,22,26,30] },
      { query: "logiciel traitement factures", clicks: 78, impressions: 2200, ctr: 3.55, position: 6.8, trend: [4,5,6,7,8,10,12,14,16,18,22,25] },
      { query: "d\u00E9mat\u00E9rialisation factures", clicks: 120, impressions: 4800, ctr: 2.50, position: 10.2, trend: [6,8,10,12,14,16,20,24,28,34,40,48] },
      { query: "automatiser saisie factures", clicks: 56, impressions: 1100, ctr: 5.09, position: 4.0, trend: [3,3,4,5,6,7,8,10,12,14,16,18] },
      { query: "facture \u00E9lectronique 2026", clicks: 340, impressions: 18000, ctr: 1.89, position: 14.2, trend: [12,16,22,30,40,52,68,88,115,150,195,255] },
      { query: "Sage alternative comptabilit\u00E9", clicks: 42, impressions: 680, ctr: 6.18, position: 3.6, trend: [2,2,3,4,4,5,6,7,8,10,12,14] },
    ],
    ga: { users: 3120, sessions: 4660, bounceRate: 44.2, avgDuration: "2:52" },
  },
};

// ── Chat Messages ──
export const INITIAL_MESSAGES: { role: string; content: string; timestamp: Date; data?: any; action?: () => void }[] = [
  {
    role: "system",
    content: "Welcome back, Ademola. You have **1 active product profile** (Nexus AP) and **3 saved keyword groups**. Your last session identified 23 high-opportunity keywords for UK AP automation. What would you like to explore?",
    timestamp: new Date(),
    data: null,
  },
];
