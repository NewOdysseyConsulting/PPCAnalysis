import { COLORS } from "./colors";
import type { Campaign, ChannelConfig, IcpProfile, BuyerPersona, AudienceSegment, CampaignTimeline } from "../types";

// ── Product Info ──

export const PRODUCT1_INFO = {
  id: "prod-001",
  name: "Nexus AP",
  description: "Accounts payable automation suite for SMBs",
  acv: "£588-2,400",
  target: "Financial Controllers, AP Managers",
  integrations: "QuickBooks, Xero",
  websiteUrl: "https://nexusap.com",
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-02-24T14:30:00Z",
};

export const PRODUCT2_INFO = {
  id: "prod-002",
  name: "Orion CRM",
  description: "Lightweight CRM for B2B sales teams with pipeline automation",
  acv: "$1,200-4,800",
  target: "VP Sales, Sales Managers, Revenue Operations",
  integrations: "Salesforce, HubSpot, Slack, Gmail",
  websiteUrl: "https://orioncrm.com",
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-02-20T14:30:00Z",
};

// ── Keywords (US market, CRM / sales tools) ──

export const PRODUCT2_KEYWORDS = [
  { keyword: "best crm for small business", volume: 7200, cpc: 6.80, competition: 0.62, difficulty: 58, intent: "commercial", trend: [480,510,550,600,660,730,810,900,1000,1100,1210,1340], relevance: 94, group: null },
  { keyword: "b2b crm software", volume: 4800, cpc: 7.40, competition: 0.55, difficulty: 52, intent: "commercial", trend: [320,340,370,400,440,490,540,600,670,750,840,940], relevance: 96, group: null },
  { keyword: "sales pipeline software", volume: 3600, cpc: 5.90, competition: 0.48, difficulty: 46, intent: "commercial", trend: [240,260,290,320,360,400,450,500,560,630,710,800], relevance: 93, group: null },
  { keyword: "crm for startups", volume: 2900, cpc: 4.50, competition: 0.32, difficulty: 34, intent: "transactional", trend: [180,200,220,250,280,320,360,410,470,540,620,710], relevance: 97, group: "high-opportunity" },
  { keyword: "hubspot alternative cheaper", volume: 2200, cpc: 8.10, competition: 0.18, difficulty: 22, intent: "transactional", trend: [120,140,165,195,230,270,320,380,450,530,620,730], relevance: 99, group: "competitor" },
  { keyword: "salesforce alternative smb", volume: 1800, cpc: 8.60, competition: 0.15, difficulty: 20, intent: "transactional", trend: [95,110,130,155,185,220,260,310,370,440,520,620], relevance: 99, group: "competitor" },
  { keyword: "sales automation tools", volume: 3200, cpc: 5.20, competition: 0.44, difficulty: 44, intent: "commercial", trend: [210,230,250,280,310,350,400,450,510,580,660,750], relevance: 90, group: null },
  { keyword: "deal tracking software", volume: 1400, cpc: 4.80, competition: 0.28, difficulty: 30, intent: "transactional", trend: [85,95,108,124,142,165,190,220,255,295,340,395], relevance: 92, group: "high-opportunity" },
  { keyword: "lead management software", volume: 2600, cpc: 6.30, competition: 0.50, difficulty: 50, intent: "commercial", trend: [170,185,205,230,260,295,335,380,430,490,560,640], relevance: 88, group: null },
  { keyword: "crm with email integration", volume: 1600, cpc: 5.50, competition: 0.36, difficulty: 36, intent: "transactional", trend: [100,115,130,150,175,200,230,265,310,360,415,480], relevance: 95, group: "high-opportunity" },
  { keyword: "lightweight crm", volume: 1100, cpc: 3.80, competition: 0.20, difficulty: 24, intent: "transactional", trend: [60,70,82,96,112,132,155,185,220,260,305,360], relevance: 98, group: "high-opportunity" },
  { keyword: "affordable crm b2b", volume: 900, cpc: 4.20, competition: 0.22, difficulty: 26, intent: "transactional", trend: [50,58,68,80,94,112,132,158,188,225,268,320], relevance: 97, group: "high-opportunity" },
  { keyword: "crm pipeline management tool", volume: 820, cpc: 5.10, competition: 0.30, difficulty: 32, intent: "commercial", trend: [48,55,64,75,88,104,122,145,172,205,244,290], relevance: 94, group: null },
  { keyword: "simple crm for sales teams", volume: 680, cpc: 3.40, competition: 0.12, difficulty: 18, intent: "transactional", trend: [35,42,50,60,72,86,104,125,150,180,218,262], relevance: 98, group: "high-opportunity" },
  { keyword: "best crm for b2b sales", volume: 540, cpc: 7.00, competition: 0.42, difficulty: 40, intent: "informational", trend: [30,35,42,50,60,72,86,104,125,150,182,220], relevance: 91, group: null },
];

// ── Campaigns ──

export const PRODUCT2_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp-002",
    name: "Orion CRM — US Launch",
    status: "draft",
    bidConfig: {
      strategy: "manual-cpc",
      maxCpcLimit: 7.00,
      dailyBudget: 35,
    },
    targetCountries: ["US"],
    landingPageUrl: "https://orioncrm.com/us",
    negativeKeywords: [
      { keyword: "free", matchType: "broad", level: "campaign" },
      { keyword: "open source", matchType: "phrase", level: "campaign" },
      { keyword: "enterprise", matchType: "broad", level: "campaign" },
      { keyword: "tutorial", matchType: "broad", level: "campaign" },
    ],
    adGroups: [
      {
        id: "ag-201",
        name: "Pipeline Management",
        keywords: [
          { keyword: "sales pipeline software", matchType: "phrase" },
          { keyword: "deal tracking software", matchType: "broad" },
          { keyword: "crm pipeline management tool", matchType: "exact" },
        ],
        negativeKeywords: [
          { keyword: "excel", matchType: "broad", level: "ad-group" },
        ],
        headlines: [
          "Manage Your Sales Pipeline",
          "Close Deals 2x Faster",
          "Pipeline CRM from $99/mo",
        ],
        descriptions: [
          "Track every deal from lead to close. Orion CRM gives your sales team full pipeline visibility.",
          "Drag-and-drop pipeline, automated follow-ups, and real-time forecasting. Try Orion CRM free.",
        ],
        finalUrl: "https://orioncrm.com/us/pipeline",
        displayPath1: "pipeline",
        displayPath2: "management",
      },
      {
        id: "ag-202",
        name: "CRM Alternatives",
        keywords: [
          { keyword: "hubspot alternative cheaper", matchType: "exact" },
          { keyword: "salesforce alternative smb", matchType: "phrase" },
          { keyword: "affordable crm b2b", matchType: "broad" },
        ],
        negativeKeywords: [],
        headlines: [
          "Tired of HubSpot Pricing?",
          "Salesforce Too Complex?",
          "CRM Built for SMB Teams",
        ],
        descriptions: [
          "Orion CRM delivers the features you need without the bloat. Switch from HubSpot in under a day.",
          "All the CRM power, none of the complexity. Purpose-built for B2B sales teams under 50 reps.",
        ],
        finalUrl: "https://orioncrm.com/us/compare",
        displayPath1: "compare",
        displayPath2: "alternatives",
      },
      {
        id: "ag-203",
        name: "Lightweight CRM",
        keywords: [
          { keyword: "lightweight crm", matchType: "phrase" },
          { keyword: "simple crm for sales teams", matchType: "broad" },
          { keyword: "crm for startups", matchType: "phrase" },
        ],
        negativeKeywords: [],
        headlines: [
          "CRM That Just Works",
          "Set Up CRM in 5 Minutes",
          "Simple CRM for Sales",
        ],
        descriptions: [
          "No consultants, no training needed. Orion CRM is the lightweight CRM your sales team will love.",
          "Built for speed — import contacts, build pipelines, and start selling in minutes, not months.",
        ],
        finalUrl: "https://orioncrm.com/us/simple-crm",
        displayPath1: "simple",
        displayPath2: "crm",
      },
    ],
    startDate: "2026-04-01",
    createdAt: "2026-02-18T09:00:00Z",
    updatedAt: "2026-02-20T14:30:00Z",
  },
];

// ── Channel Configs ──

export const PRODUCT2_CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    channel: "google-ads",
    label: "Google Ads",
    icon: "Search",
    color: COLORS.accent,
    enabled: true,
    budgetPercent: 80,
    budgetAbsolute: 960,
    estimatedCtr: 4.0,
    estimatedConvRate: 2.8,
    estimatedCpc: 5.60,
    notes: "Primary channel — CRM keywords are highly competitive on Google",
  },
  {
    channel: "bing-ads",
    label: "Bing Ads",
    icon: "Globe",
    color: COLORS.purple,
    enabled: true,
    budgetPercent: 20,
    budgetAbsolute: 240,
    estimatedCtr: 4.6,
    estimatedConvRate: 3.4,
    estimatedCpc: 4.10,
    notes: "Lower CPC, strong B2B desktop audience on Bing",
  },
];

// ── ICP ──

export const PRODUCT2_ICP: IcpProfile[] = [
  {
    id: "icp-002",
    name: "Sales-Led B2B Companies",
    companySize: { min: 10, max: 150, label: "SMB" },
    industry: ["SaaS", "Professional Services", "Financial Services", "Recruiting"],
    revenue: { min: 500000, max: 30000000, currency: "$" },
    geography: ["US"],
    techStack: ["Gmail", "Slack", "Google Workspace", "LinkedIn Sales Navigator"],
    painPoints: [
      "Deals falling through cracks — no centralized pipeline view",
      "Sales reps spending 30%+ of time on admin instead of selling",
      "No visibility into rep activity or forecast accuracy",
      "Outgrown spreadsheets but overwhelmed by Salesforce complexity",
    ],
    buyingTriggers: [
      "Hired third sales rep — spreadsheets no longer scale",
      "Missed quarterly revenue target due to poor pipeline visibility",
      "VP Sales hired to professionalize the sales org",
      "Board asking for reliable revenue forecasts",
    ],
    decisionMakers: ["VP Sales", "Sales Manager", "Head of Revenue Operations"],
    budgetRange: { min: 1200, max: 6000, currency: "$" },
  },
];

// ── Buyer Personas ──

export const PRODUCT2_PERSONAS: BuyerPersona[] = [
  {
    id: "persona-201",
    name: "Mark the VP Sales",
    title: "VP of Sales",
    department: "Sales",
    seniority: "director",
    goals: [
      "Hit quarterly revenue targets consistently",
      "Get full pipeline visibility without micromanaging reps",
      "Reduce sales cycle length by 20%",
    ],
    painPoints: [
      "Cannot trust the forecast — reps update deals inconsistently",
      "No way to see which deals are stuck without 1:1 check-ins",
      "Current CRM requires admin help for every report change",
    ],
    objections: [
      "Reps will resist adopting yet another tool",
      "Migration from current system will disrupt Q2 pipeline",
      "Needs to integrate with existing email and calendar",
    ],
    triggers: [
      "Missed Q1 target by 15% due to sandbagged pipeline",
      "Two reps quit citing 'too much admin work'",
      "Board requested weekly pipeline snapshots",
    ],
    informationSources: ["LinkedIn", "SaaStr", "G2 Reviews", "Sales Hacker"],
    decisionCriteria: [
      "Ease of adoption — reps must actually use it",
      "Pipeline reporting and forecasting accuracy",
      "Email and calendar integration quality",
      "Price per seat per month",
    ],
    searchBehavior: [
      "Searches 'best CRM for small sales team' when evaluating options",
      "Compares 'HubSpot vs Pipedrive vs alternatives' on G2",
      "Searches 'CRM adoption tips' when worried about rep buy-in",
      "Looks for 'sales pipeline template' as a stopgap",
    ],
    icpId: "icp-002",
  },
  {
    id: "persona-202",
    name: "Lisa the RevOps Manager",
    title: "Revenue Operations Manager",
    department: "Revenue Operations",
    seniority: "manager",
    goals: [
      "Build a single source of truth for pipeline and revenue data",
      "Automate lead routing and deal stage progression",
      "Deliver accurate weekly forecasts to the VP Sales",
    ],
    painPoints: [
      "Stitching together data from spreadsheets, email, and Slack",
      "Manual lead assignment causing response time delays",
      "Cannot run pipeline velocity reports without exporting to Excel",
    ],
    objections: [
      "Needs API access for custom integrations",
      "Worried about data import accuracy from existing system",
      "Must support custom fields and deal stages",
    ],
    triggers: [
      "Promoted from SDR manager to RevOps — tasked with fixing the stack",
      "Sales team doubled in 6 months and processes are breaking",
      "CEO wants a dashboard showing real-time pipeline health",
    ],
    informationSources: ["RevOps Co-op", "LinkedIn", "Pavilion community", "Product Hunt"],
    decisionCriteria: [
      "API quality and webhook support",
      "Custom field and workflow flexibility",
      "Reporting depth without needing a BI tool",
      "Speed of implementation",
    ],
    searchBehavior: [
      "Searches 'CRM with good API for RevOps' when evaluating",
      "Reads 'revenue operations CRM setup guide' articles",
      "Searches 'Salesforce alternative for small team' when current tool is too heavy",
    ],
    icpId: "icp-002",
  },
];

// ── Audience Segments ──

export const PRODUCT2_AUDIENCE_SEGMENTS: AudienceSegment[] = [
  {
    id: "seg-201",
    name: "High-Intent CRM Buyers",
    description: "Sales leaders and RevOps managers actively searching for a CRM to replace spreadsheets or switch from an overpriced incumbent",
    personaIds: ["persona-201", "persona-202"],
    size: 18600,
    searchKeywords: [
      "best crm for small business",
      "hubspot alternative cheaper",
      "sales pipeline software",
      "lightweight crm",
    ],
    contentTopics: [
      "CRM buying guide",
      "Sales pipeline best practices",
      "CRM adoption strategies",
      "RevOps tech stack optimization",
    ],
  },
];

// ── Timeline ──

export const PRODUCT2_TIMELINE: CampaignTimeline = {
  id: "tl-002",
  name: "Orion CRM — US Go-to-Market 2026",
  startDate: "2026-04-01",
  endDate: "2026-09-30",
  totalBudget: 42000,
  phases: [
    {
      id: "phase-201",
      name: "US Launch",
      gate: "awareness",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      color: COLORS.accent,
      markets: ["US"],
      channels: ["google-ads", "bing-ads"],
      campaignIds: ["cmp-002"],
      monthlyBudget: 5000,
      milestones: [
        { id: "ms-201", name: "Campaign launch", date: "2026-04-01", type: "launch", completed: false, notes: "Launch Google Ads + Bing Ads campaigns for Orion CRM" },
        { id: "ms-202", name: "First review", date: "2026-04-15", type: "review", completed: false, notes: "Assess initial CPC, CTR, and quality scores across ad groups" },
        { id: "ms-203", name: "Ad copy A/B test", date: "2026-05-01", type: "test", completed: false, notes: "Test headline variants for Pipeline and Alternatives ad groups" },
        { id: "ms-204", name: "Landing page optimization", date: "2026-06-01", type: "optimization", completed: false, notes: "Test demo request vs free trial as primary CTA" },
      ],
      seasonalAdjustments: [
        { month: 4, budgetMultiplier: 1.0, reason: "Launch month" },
        { month: 5, budgetMultiplier: 1.0, reason: "Steady state" },
        { month: 6, budgetMultiplier: 1.2, reason: "Pre-Q3 pipeline push" },
      ],
    },
    {
      id: "phase-202",
      name: "Expansion & Conversion",
      gate: "conversion",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      color: COLORS.green,
      markets: ["US"],
      channels: ["google-ads", "bing-ads"],
      campaignIds: ["cmp-002"],
      monthlyBudget: 9000,
      milestones: [
        { id: "ms-205", name: "Scale winning keywords", date: "2026-07-01", type: "optimization", completed: false, notes: "Increase bids on top converters, pause underperformers" },
        { id: "ms-206", name: "Retargeting launch", date: "2026-08-01", type: "expansion", completed: false, notes: "Launch display retargeting for demo page visitors" },
        { id: "ms-207", name: "Q3 review", date: "2026-09-15", type: "review", completed: false, notes: "Full funnel review — CAC, pipeline generated, close rate" },
      ],
      seasonalAdjustments: [
        { month: 7, budgetMultiplier: 0.9, reason: "Summer slowdown" },
        { month: 8, budgetMultiplier: 1.0, reason: "Ramp up" },
        { month: 9, budgetMultiplier: 1.3, reason: "Fall budget season — buying activity increases" },
      ],
    },
  ],
};

// ── Seed Keywords ──

export const PRODUCT2_SEED_KEYWORDS = [
  { id: 101, keyword: "crm for small business", source: "manual" as const, addedAt: new Date(Date.now() - 86400000 * 3), status: "researched" as const },
  { id: 102, keyword: "sales pipeline tool", source: "manual" as const, addedAt: new Date(Date.now() - 86400000 * 3), status: "researched" as const },
  { id: 103, keyword: "hubspot alternative", source: "manual" as const, addedAt: new Date(Date.now() - 86400000 * 2), status: "researched" as const },
  { id: 104, keyword: "lightweight crm b2b", source: "manual" as const, addedAt: new Date(Date.now() - 86400000 * 2), status: "researched" as const },
  { id: 105, keyword: "deal tracking crm", source: "ai-expanded" as const, addedAt: new Date(Date.now() - 86400000 * 1), status: "pending" as const },
  { id: 106, keyword: "revenue operations software", source: "ai-expanded" as const, addedAt: new Date(Date.now() - 86400000 * 1), status: "pending" as const },
];

// ── Saved Groups ──

export const PRODUCT2_SAVED_GROUPS = [
  {
    id: "grp-201",
    name: "High-Opportunity CRM",
    color: COLORS.green,
    keywords: ["crm for startups", "lightweight crm", "affordable crm b2b", "deal tracking software", "simple crm for sales teams", "crm with email integration"],
    createdAt: "2026-02-18T09:30:00Z",
  },
  {
    id: "grp-202",
    name: "Competitor Conquest",
    color: COLORS.amber,
    keywords: ["hubspot alternative cheaper", "salesforce alternative smb"],
    createdAt: "2026-02-19T11:00:00Z",
  },
];
