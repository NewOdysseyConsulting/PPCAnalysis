import React, { useState, useRef, useEffect, useCallback } from "react";
import { Download, FolderPlus, Loader2, Filter, FileDown, Globe } from "lucide-react";
import { getSearchVolume, getKeywordsForKeywords, getKeywordsForSite, getAdTrafficByKeywords, scoreRelevance, LOCATION_CODES, getLabsKeywordSuggestions, getLabsRelatedKeywords, getLabsRankedKeywords, getLabsDomainIntersection, compareMarkets, getBingSearchVolume, getBingKeywordPerformance } from "./services/dataforseo";
import { getStripeMetrics, getStripeAttribution, getStripeTimeline, getStripeStatus } from "./services/stripe";
import type { StripeMetrics, StripeAttribution, StripeTimelinePoint } from "./services/stripe";
import { getSerpFeatures, getSerpCompetitors, getHistoricalRanks, getBacklinkProfile, getBacklinkComparison, getGscData, getContentGaps } from "./services/seo";
import type { SerpFeatureResult, SerpCompetitor, HistoricalRank, BacklinkProfile, GscData, ContentGap } from "./services/seo";
import { downloadKeywordsCsv, downloadGoogleAdsEditor, downloadPdfReport } from "./services/export";
import { sendChatMessage, generateIcp, generatePersona } from "./services/ai";
import { getGA4Data } from "./services/google-analytics";
import type { GA4Data } from "./services/google-analytics";
import { getLiveGscData } from "./services/search-console";
import { getGoogleConnectionStatus } from "./services/google-auth";
import type { GoogleConnectionStatus } from "./services/google-auth";
import { pushCampaignToGoogleAds } from "./services/google-ads";
import type { PushCampaignResult } from "./services/google-ads";
import type { Campaign, ChannelConfig, IcpProfile, BuyerPersona, AudienceSegment, CampaignTimeline } from "./types";
import { COLORS } from "./constants";
import { Sparkline, IntentBadge, MetricChip } from "./components/ui";
import { SAMPLE_KEYWORDS, SAMPLE_COMPETITORS, SAMPLE_CAMPAIGNS, SAMPLE_GA_DATA, COUNTRY_MARKETS, INITIAL_MESSAGES, SAMPLE_CHANNEL_CONFIGS, SAMPLE_ICP, SAMPLE_PERSONAS, SAMPLE_AUDIENCE_SEGMENTS, SAMPLE_TIMELINE, PRODUCT1_INFO, PRODUCT2_INFO, PRODUCT2_KEYWORDS, PRODUCT2_CAMPAIGNS, PRODUCT2_CHANNEL_CONFIGS, PRODUCT2_ICP, PRODUCT2_PERSONAS, PRODUCT2_AUDIENCE_SEGMENTS, PRODUCT2_TIMELINE, PRODUCT2_SEED_KEYWORDS, PRODUCT2_SAVED_GROUPS } from "./constants";
import { TablePanel, CompetitorPanel, VisualPanel, CampaignBuilderPanel, SeoPanel, BacklinksPanel, GscPanel, GaPanel, BudgetPanel, RevenuePanel, ProductPanel, BudgetAllocatorPanel, AudiencePanel, TimelinePanel, PortfolioPanel } from "./components/panels";
import { ChatTab, SeedsTab, GroupsTab, CampaignsTab, ProductsTab, IconRail, ApiSettingsPanel, AudienceTab, ProductFormModal, ProductOnboardingWizard, KnowledgeTab } from "./components/sidebar";
import usePortfolioState from "./hooks/usePortfolioState";

// ── Initial portfolio data ──
const PRODUCT1_SEEDS = [
  { id: 1, keyword: "accounts payable automation", source: "manual", addedAt: new Date(Date.now() - 86400000 * 5), status: "researched" },
  { id: 2, keyword: "invoice processing software", source: "manual", addedAt: new Date(Date.now() - 86400000 * 5), status: "researched" },
  { id: 3, keyword: "AP automation QuickBooks", source: "ai-suggested", addedAt: new Date(Date.now() - 86400000 * 3), status: "researched" },
  { id: 4, keyword: "supplier payment automation", source: "competitor", addedAt: new Date(Date.now() - 86400000 * 2), status: "researched" },
  { id: 5, keyword: "Bill.com alternative", source: "manual", addedAt: new Date(Date.now() - 86400000 * 2), status: "researched" },
  { id: 6, keyword: "Tipalti alternative small business", source: "ai-suggested", addedAt: new Date(Date.now() - 86400000 * 1), status: "researched" },
  { id: 7, keyword: "purchase order automation", source: "manual", addedAt: new Date(Date.now() - 86400000 * 1), status: "pending" },
  { id: 8, keyword: "automated vendor payments", source: "manual", addedAt: new Date(), status: "pending" },
];
const PRODUCT1_GROUPS = [
  { id: 1, name: "High Opportunity — UK AP", description: "Low competition, transactional intent, volume >150", createdAt: new Date(Date.now() - 86400000 * 3), color: COLORS.amber, keywords: SAMPLE_KEYWORDS.filter((k: any) => k.group === "high-opportunity") },
  { id: 2, name: "Competitor Alternatives", description: "Bill.com and Tipalti alternative keywords", createdAt: new Date(Date.now() - 86400000 * 2), color: COLORS.red, keywords: SAMPLE_KEYWORDS.filter((k: any) => k.group === "competitor") },
  { id: 3, name: "Invoice Processing Cluster", description: "All invoice-related keywords with commercial intent", createdAt: new Date(Date.now() - 86400000 * 1), color: COLORS.accent, keywords: SAMPLE_KEYWORDS.filter((k: any) => k.keyword.includes("invoice")) },
];
const INITIAL_PRODUCTS = [PRODUCT1_INFO, PRODUCT2_INFO];
const INITIAL_PRODUCT_DATA: Record<string, any> = {
  [PRODUCT1_INFO.id]: {
    keywords: SAMPLE_KEYWORDS, liveKeywords: {}, campaigns: SAMPLE_CAMPAIGNS,
    channelConfigs: SAMPLE_CHANNEL_CONFIGS, icpProfiles: SAMPLE_ICP,
    buyerPersonas: SAMPLE_PERSONAS, audienceSegments: SAMPLE_AUDIENCE_SEGMENTS,
    timeline: SAMPLE_TIMELINE, budgetMonthly: 1000,
    seedKeywords: PRODUCT1_SEEDS, savedGroups: PRODUCT1_GROUPS,
    bingData: {}, liveCompetitors: {}, liveGaps: [],
  },
  [PRODUCT2_INFO.id]: {
    keywords: PRODUCT2_KEYWORDS, liveKeywords: {}, campaigns: PRODUCT2_CAMPAIGNS,
    channelConfigs: PRODUCT2_CHANNEL_CONFIGS, icpProfiles: PRODUCT2_ICP,
    buyerPersonas: PRODUCT2_PERSONAS, audienceSegments: PRODUCT2_AUDIENCE_SEGMENTS,
    timeline: PRODUCT2_TIMELINE, budgetMonthly: 1200,
    seedKeywords: PRODUCT2_SEED_KEYWORDS, savedGroups: PRODUCT2_SAVED_GROUPS,
    bingData: {}, liveCompetitors: {}, liveGaps: [],
  },
};

// ════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════
export default function OrionApp() {
  // ── Portfolio state (product-scoped data) ──
  const {
    products, activeProductId, activeProduct, setActiveProductId,
    activeData, updateActiveData, updateActiveDataFn,
    portfolioData,
    addProduct, updateProduct, deleteProduct, duplicateProduct,
  } = usePortfolioState({
    initialProducts: INITIAL_PRODUCTS as any,
    initialProductData: INITIAL_PRODUCT_DATA,
  });

  // Destructure active product data
  const {
    keywords, liveKeywords, campaigns, channelConfigs,
    icpProfiles, buyerPersonas, audienceSegments, timeline,
    budgetMonthly, seedKeywords, savedGroups, bingData,
    liveCompetitors, liveGaps,
  } = activeData;

  // Wrapper setters for product-scoped data (support functional updates)
  const setLiveKeywords = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ liveKeywords: v(c.liveKeywords) }))
    : updateActiveData({ liveKeywords: v }), [updateActiveData, updateActiveDataFn]);
  const setCampaigns = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ campaigns: v(c.campaigns) }))
    : updateActiveData({ campaigns: v }), [updateActiveData, updateActiveDataFn]);
  const setChannelConfigs = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ channelConfigs: v(c.channelConfigs) }))
    : updateActiveData({ channelConfigs: v }), [updateActiveData, updateActiveDataFn]);
  const setIcpProfiles = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ icpProfiles: v(c.icpProfiles) }))
    : updateActiveData({ icpProfiles: v }), [updateActiveData, updateActiveDataFn]);
  const setBuyerPersonas = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ buyerPersonas: v(c.buyerPersonas) }))
    : updateActiveData({ buyerPersonas: v }), [updateActiveData, updateActiveDataFn]);
  const setAudienceSegments = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ audienceSegments: v(c.audienceSegments) }))
    : updateActiveData({ audienceSegments: v }), [updateActiveData, updateActiveDataFn]);
  const setTimeline = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ timeline: v(c.timeline) }))
    : updateActiveData({ timeline: v }), [updateActiveData, updateActiveDataFn]);
  const setBudgetMonthly = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ budgetMonthly: v(c.budgetMonthly) }))
    : updateActiveData({ budgetMonthly: v }), [updateActiveData, updateActiveDataFn]);
  const setSeedKeywords = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ seedKeywords: v(c.seedKeywords) }))
    : updateActiveData({ seedKeywords: v }), [updateActiveData, updateActiveDataFn]);
  const setSavedGroups = useCallback((v: any) => typeof v === 'function'
    ? updateActiveDataFn((c: any) => ({ savedGroups: v(c.savedGroups) }))
    : updateActiveData({ savedGroups: v }), [updateActiveData, updateActiveDataFn]);
  const setLiveCompetitors = useCallback((v: any) => updateActiveData({ liveCompetitors: v }), [updateActiveData]);
  const setLiveGaps = useCallback((v: any) => updateActiveData({ liveGaps: v }), [updateActiveData]);
  const setBingData = useCallback((v: any) => updateActiveData({ bingData: v }), [updateActiveData]);

  // ── Non-product-scoped state ──
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [targetCountry, setTargetCountry] = useState("GB");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [panelMode, setPanelMode] = useState("table");
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedKeywords, setSelectedKeywords] = useState(new Set());
  const [sortCol, setSortCol] = useState("relevance");
  const [sortDir, setSortDir] = useState("desc");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(0);
  const [activeAdGroup, setActiveAdGroup] = useState(0);
  const [aiChatHistory, setAiChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [sidebarTab, setSidebarTab] = useState("chat");
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem("orion-session-id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("orion-session-id", id); }
    return id;
  });
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProductData, setEditProductData] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newSeedInput, setNewSeedInput] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [expandedCampaignSidebar, setExpandedCampaignSidebar] = useState(0);
  const [apiCredentials, setApiCredentials] = useState({ login: "", password: "" });
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [bingLoading, setBingLoading] = useState(false);
  const [budgetCtrOverride, setBudgetCtrOverride] = useState<number | null>(null);
  const [budgetConvRateOverride, setBudgetConvRateOverride] = useState<number | null>(null);
  const [budgetUseSelected, setBudgetUseSelected] = useState(false);
  const [stripeMetrics, setStripeMetrics] = useState<StripeMetrics | null>(null);
  const [stripeAttribution, setStripeAttribution] = useState<StripeAttribution[]>([]);
  const [stripeTimeline, setStripeTimeline] = useState<StripeTimelinePoint[]>([]);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [serpFeatures, setSerpFeatures] = useState<Record<string, SerpFeatureResult>>({});
  const [serpCompetitors, setSerpCompetitors] = useState<SerpCompetitor[]>([]);
  const [rankHistory, setRankHistory] = useState<HistoricalRank[]>([]);
  const [backlinkData, setBacklinkData] = useState<BacklinkProfile | null>(null);
  const [backlinkComparison, setBacklinkComparison] = useState<BacklinkProfile[]>([]);
  const [gscData, setGscData] = useState<GscData | null>(null);
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [seoLoading, setSeoLoading] = useState<string | null>(null);
  const [liveGA, setLiveGA] = useState<GA4Data | null>(null);
  const [gaLoading, setGaLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleConnectionStatus | null>(null);
  const [googleAdsPushing, setGoogleAdsPushing] = useState(false);
  const [googleAdsPushResult, setGoogleAdsPushResult] = useState<PushCampaignResult | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasApiCredentials = apiCredentials.login && apiCredentials.password;

  // ── Derived market data (live API data if available, else sample) ──
  const market = COUNTRY_MARKETS[targetCountry as keyof typeof COUNTRY_MARKETS];
  const adjustedKeywords = liveKeywords[targetCountry] || keywords;
  const adjustedGSC = market.gsc;
  const gaScale = market.ga.users / SAMPLE_GA_DATA.overview.users;
  const adjustedGA = {
    ...SAMPLE_GA_DATA,
    overview: {
      ...SAMPLE_GA_DATA.overview,
      users: market.ga.users,
      sessions: market.ga.sessions,
      bounceRate: market.ga.bounceRate,
      avgSessionDuration: market.ga.avgDuration,
      usersTrend: SAMPLE_GA_DATA.overview.usersTrend.map(v => Math.round(v * gaScale)),
      sessionsTrend: SAMPLE_GA_DATA.overview.sessionsTrend.map(v => Math.round(v * gaScale)),
    },
    channels: SAMPLE_GA_DATA.channels.map(ch => ({
      ...ch,
      users: Math.round(ch.users * gaScale),
      sessions: Math.round(ch.sessions * gaScale),
    })),
  };

  // ── Merged keywords: join base (Google) + Bing data into unified rows ──
  const hasBing = Object.keys(bingData).length > 0;
  const mergedKeywords = React.useMemo(() => {
    // Start with Google/Labs keywords
    const merged = adjustedKeywords.map((kw: any) => {
      const bd = hasBing ? bingData[kw.keyword?.toLowerCase()] : null;
      const bingVol = bd?.volume || 0;
      const bingCpc = bd?.cpc || 0;
      const bingComp = bd?.competition || 0;
      const bingImpressions = bd?.impressions || 0;
      const bingClicks = bd?.clicks || 0;
      const bingCtr = bd?.ctr || 0;
      const cpcDelta = (kw.cpc > 0 && bingCpc > 0) ? Math.round(((kw.cpc - bingCpc) / kw.cpc) * 100) : 0;
      // Sources: tag where this keyword was found
      const sources: string[] = kw.sources || [];
      if (sources.length === 0) {
        if (kw.source?.startsWith("gap:")) sources.push("gap");
        else if (kw.source === "bing") sources.push("bing");
        else if (kw.source === "labs") sources.push("labs");
        else if (kw.source === "site") sources.push("site");
        else sources.push("google");
      }
      if (bd && !sources.includes("bing")) sources.push("bing");
      return {
        ...kw,
        sources,
        bingVol,
        bingCpc,
        bingComp,
        bingImpressions,
        bingClicks,
        bingCtr,
        cpcDelta, // positive = Bing is cheaper (arbitrage opportunity)
      };
    });

    // Add Bing-only keywords (in Bing data but not in Google/base keywords)
    if (hasBing) {
      const existingSet = new Set(adjustedKeywords.map((k: any) => k.keyword?.toLowerCase()));
      Object.entries(bingData).forEach(([kwLower, bd]: [string, any]) => {
        if (!existingSet.has(kwLower) && bd.volume > 0) {
          merged.push({
            keyword: bd.keyword || kwLower,
            volume: 0,
            cpc: 0,
            competition: 0,
            difficulty: 0,
            intent: "informational",
            trend: [],
            relevance: 50,
            group: null,
            sources: ["bing"],
            bingVol: bd.volume,
            bingCpc: bd.cpc || 0,
            bingComp: bd.competition || 0,
            bingImpressions: bd.impressions || 0,
            bingClicks: bd.clicks || 0,
            bingCtr: bd.ctr || 0,
            cpcDelta: 0,
          });
        }
      });
    }

    return merged;
  }, [adjustedKeywords, bingData, hasBing]);

  const avgCpc = mergedKeywords.length > 0
    ? (mergedKeywords.reduce((a: number, k: any) => a + k.cpc, 0) / mergedKeywords.length).toFixed(2)
    : "0.00";
  const avgVolume = mergedKeywords.length > 0
    ? Math.round(mergedKeywords.reduce((a: number, k: any) => a + k.volume, 0) / mergedKeywords.length)
    : 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Check Google API connection status on mount
  useEffect(() => {
    getGoogleConnectionStatus()
      .then(setGoogleStatus)
      .catch(() => setGoogleStatus(null));
  }, []);

  const toggleKeyword = (idx: number) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const filteredKeywords = React.useMemo(() => {
    if (activeFilters.length === 0) return mergedKeywords;
    return mergedKeywords.filter((kw: any) => {
      return activeFilters.every((f) => {
        if (f === "intent:commercial") return kw.intent === "commercial";
        if (f === "intent:transactional") return kw.intent === "transactional";
        if (f === "intent:informational") return kw.intent === "informational";
        if (f === "intent:navigational") return kw.intent === "navigational";
        if (f === "volume:high") return kw.volume >= 1000;
        if (f === "volume:medium") return kw.volume >= 100 && kw.volume < 1000;
        if (f === "volume:low") return kw.volume < 100;
        if (f === "competition:low") return kw.competition < 0.3;
        if (f === "competition:medium") return kw.competition >= 0.3 && kw.competition < 0.7;
        if (f === "competition:high") return kw.competition >= 0.7;
        if (f === "difficulty:easy") return kw.difficulty < 30;
        if (f === "difficulty:medium") return kw.difficulty >= 30 && kw.difficulty < 60;
        if (f === "difficulty:hard") return kw.difficulty >= 60;
        if (f === "source:bing") return kw.sources?.includes("bing");
        if (f === "source:google") return kw.sources?.includes("google");
        if (f === "cpc:arbitrage") return kw.cpcDelta >= 30;
        return true;
      });
    });
  }, [mergedKeywords, activeFilters]);

  const sortedKeywords = [...filteredKeywords].sort((a: any, b: any) => {
    const dir = sortDir === "desc" ? -1 : 1;
    const aVal = a[sortCol];
    const bVal = b[sortCol];
    if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * dir;
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    return String(aVal).localeCompare(String(bVal)) * dir;
  });

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const handleSaveGroup = useCallback(() => {
    if (selectedKeywords.size === 0) return;
    const selected = sortedKeywords.filter((_: any, i: number) => selectedKeywords.has(i));
    const groupName = `Group ${savedGroups.length + 1} (${selected.length} kws)`;
    const newGroup = {
      id: Date.now(),
      name: groupName,
      description: `Saved ${selected.length} keywords`,
      createdAt: new Date(),
      color: [COLORS.accent, COLORS.purple, COLORS.amber, COLORS.green, COLORS.red][savedGroups.length % 5],
      keywords: selected,
    };
    setSavedGroups((prev: any[]) => [...prev, newGroup]);
    setSelectedKeywords(new Set());
  }, [selectedKeywords, sortedKeywords, savedGroups, setSavedGroups]);

  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  }, []);

  // ── Live DataForSEO Research ──
  const handleLiveResearch = useCallback(async (seedKws: string[]) => {
    if (!hasApiCredentials) {
      setShowApiSettings(true);
      setMessages(prev => [...prev, {
        role: "system",
        content: "**API credentials required.** Please enter your DataForSEO login and password in the settings panel to enable live keyword research.",
        timestamp: new Date(),
      }]);
      return;
    }

    setApiLoading(true);
    setIsTyping(true);

    try {
      // Step 1: Get keyword suggestions from seeds
      const suggestions = await getKeywordsForKeywords(
        seedKws.slice(0, 20),
        targetCountry,
        apiCredentials,
        { sortBy: "search_volume" },
      );

      // Step 3: Labs keyword suggestions (per seed)
      const labsSuggestions = await Promise.all(
        seedKws.slice(0, 5).map(seed =>
          getLabsKeywordSuggestions(seed, targetCountry, apiCredentials, { limit: 100 })
            .catch(() => [])
        )
      );

      // Step 4: Labs related keywords (per seed)
      const labsRelated = await Promise.all(
        seedKws.slice(0, 5).map(seed =>
          getLabsRelatedKeywords(seed, targetCountry, apiCredentials, { depth: 2, limit: 50 })
            .catch(() => [])
        )
      );

      // Merge all keyword sources and track provenance
      const labsFlat = [...labsSuggestions.flat(), ...labsRelated.flat()];
      const labsKeywordSet = new Set(labsFlat.map(k => k.keyword?.toLowerCase()));
      const allKeywords = [...new Set([
        ...seedKws,
        ...suggestions.map(s => s.keyword),
        ...labsFlat.map(k => k.keyword),
      ])];

      // Step 2: Get search volume for all found keywords
      const volumeData = await getSearchVolume(
        allKeywords.slice(0, 1000),
        targetCountry,
        apiCredentials,
        { sortBy: "search_volume" },
      );

      // Score relevance against active product + tag sources
      const currentProduct = activeProduct || null;
      const scored = volumeData
        .filter(kw => kw && kw.volume > 0)
        .map(kw => {
          const kwLower = kw.keyword?.toLowerCase();
          const sources: string[] = ["google"];
          if (labsKeywordSet.has(kwLower)) sources.push("labs");
          return {
            ...kw,
            relevance: scoreRelevance(kw, currentProduct),
            sources,
            source: labsKeywordSet.has(kwLower) ? "labs" : "google",
          };
        })
        .sort((a, b) => b.relevance - a.relevance);

      // Store in live data
      setLiveKeywords((prev: any) => ({ ...prev, [targetCountry]: scored }));

      const highOpp = scored.filter(k => k.competition < 0.2 && k.intent === "transactional");

      setMessages(prev => [...prev, {
        role: "system",
        content: `**Live DataForSEO results for ${market.name}:**\n\n- **${scored.length} keywords** found from ${seedKws.length} seed${seedKws.length > 1 ? "s" : ""}\n- **${labsFlat.length} additional keywords** from SERP analysis (Labs)\n- Average CPC: **${market.currency}${(scored.reduce((a, k) => a + k.cpc, 0) / scored.length).toFixed(2)}**\n- **${highOpp.length} high-opportunity keywords** (low competition + transactional intent)\n- Data is now live in the keyword table.\n\n*Powered by DataForSEO Keyword Data API + Labs — ${LOCATION_CODES[targetCountry]?.name || targetCountry} market.*`,
        timestamp: new Date(),
        action: () => { setPanelMode("table"); setPanelOpen(true); },
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "system",
        content: `**API Error:** ${(err as Error).message}\n\nPlease check your DataForSEO credentials and try again. The table will continue showing sample data for ${market.name}.`,
        timestamp: new Date(),
      }]);
    } finally {
      setApiLoading(false);
      setIsTyping(false);
    }
  }, [hasApiCredentials, targetCountry, apiCredentials, activeProduct, market]);

  // ── Live competitor site research ──
  const handleSiteResearch = useCallback(async (domain: string) => {
    if (!hasApiCredentials) {
      setShowApiSettings(true);
      return;
    }

    setApiLoading(true);
    setIsTyping(true);

    try {
      const results = await getKeywordsForSite(domain, targetCountry, apiCredentials);
      const currentProduct = activeProduct || null;
      const scored = results
        .filter(kw => kw && kw.volume > 0)
        .map(kw => ({ ...kw, relevance: scoreRelevance(kw, currentProduct), sources: ["site"], source: "site" }))
        .sort((a, b) => b.volume - a.volume);

      setMessages(prev => [...prev, {
        role: "system",
        content: `**Competitor keywords for ${domain} (${market.name}):**\n\n- **${scored.length} keywords** found\n- Top keyword: **"${scored[0]?.keyword || "—"}"** (${scored[0]?.volume?.toLocaleString() || 0}/mo)\n- Average CPC: **${market.currency}${(scored.reduce((a, k) => a + k.cpc, 0) / (scored.length || 1)).toFixed(2)}**\n\nKeywords added to your table for comparison.`,
        timestamp: new Date(),
        action: () => { setPanelMode("table"); setPanelOpen(true); },
      }]);

      // Merge with existing live keywords
      setLiveKeywords((prev: any) => {
        const existing = (prev as Record<string, any>)[targetCountry] || [];
        const existingSet = new Set(existing.map((k: any) => k.keyword));
        const newKws = scored.filter(k => !existingSet.has(k.keyword));
        return { ...prev, [targetCountry]: [...existing, ...newKws] };
      });
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "system",
        content: `**API Error:** ${(err as Error).message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setApiLoading(false);
      setIsTyping(false);
    }
  }, [hasApiCredentials, targetCountry, apiCredentials, activeProduct, market]);

  // ── Ad traffic projections ──
  const handleTrafficProjection = useCallback(async (kwList: string[], bid: number) => {
    if (!hasApiCredentials) {
      setShowApiSettings(true);
      return;
    }

    setApiLoading(true);
    setIsTyping(true);

    try {
      const results = await getAdTrafficByKeywords(
        kwList.slice(0, 1000),
        targetCountry,
        apiCredentials,
        { bid: bid || 500, match: "exact" },
      );

      const totalImpressions = results.reduce((a, r) => a + r.impressions, 0);
      const totalClicks = results.reduce((a, r) => a + r.clicks, 0);
      const totalCost = results.reduce((a, r) => a + r.cost, 0);

      setMessages(prev => [...prev, {
        role: "system",
        content: `**Ad Traffic Projections (${market.name}, next month):**\n\n- **${Math.round(totalImpressions).toLocaleString()} impressions** projected\n- **${Math.round(totalClicks).toLocaleString()} clicks** projected\n- **${market.currency}${totalCost.toFixed(2)} estimated cost**\n- Average CTR: **${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%**\n\nBased on ${kwList.length} keywords at ${market.currency}${(bid / 100).toFixed(2)} max CPC bid, exact match.`,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "system",
        content: `**API Error:** ${(err as Error).message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setApiLoading(false);
      setIsTyping(false);
    }
  }, [hasApiCredentials, targetCountry, apiCredentials, market]);

  // ── Live competitor analysis (Labs) ──
  const handleCompetitorAnalysis = useCallback(async (domains: string[]) => {
    if (!hasApiCredentials) {
      setShowApiSettings(true);
      return;
    }

    setCompetitorLoading(true);
    setApiLoading(true);
    setIsTyping(true);

    try {
      // Fetch organic ranked keywords for each competitor
      const competitorResults = await Promise.all(
        domains.map(async (domain) => {
          const [organic, paid] = await Promise.all([
            getLabsRankedKeywords(domain, targetCountry, apiCredentials, { limit: 500 }).catch(() => []),
            getKeywordsForSite(domain, targetCountry, apiCredentials, { sortBy: "search_volume" }).catch(() => []),
          ]);
          return {
            domain,
            organic_keywords: organic.length,
            paid_keywords: paid.length,
            organic,
            paid,
            est_traffic: organic.reduce((sum: number, k: any) => sum + (k.etv || 0), 0),
            // Find gaps: organic but not paid
            gaps: organic.filter((ok: any) => !paid.some((pk: any) => pk.keyword === ok.keyword)),
          };
        })
      );

      // Domain intersection between first two competitors
      let intersectionData: any[] = [];
      if (domains.length >= 2) {
        intersectionData = await getLabsDomainIntersection(
          domains[0], domains[1], targetCountry, apiCredentials,
          { limit: 200 }
        ).catch(() => []);
      }

      // Build live competitor data
      const liveCompData: Record<string, any> = {};
      competitorResults.forEach(comp => {
        liveCompData[comp.domain] = comp;
      });

      setLiveCompetitors(liveCompData);

      // Collect all gaps
      const allGaps = competitorResults.flatMap(comp =>
        comp.gaps.slice(0, 50).map((g: any) => ({
          ...g,
          competitorDomain: comp.domain,
          gapType: "organic-only",
        }))
      );
      setLiveGaps(allGaps);

      // Merge gap keywords into liveKeywords too
      const gapKeywords = allGaps.map((g: any) => ({
        keyword: g.keyword,
        volume: g.volume || 0,
        cpc: g.cpc || 0,
        competition: g.competition || 0,
        difficulty: g.difficulty || 0,
        intent: g.intent || "commercial",
        relevance: 85,
        group: "competitor-gap",
        source: `gap:${g.competitorDomain}`,
      }));

      setLiveKeywords((prev: any) => {
        const existing = prev[targetCountry] || [];
        const existingSet = new Set(existing.map((k: any) => k.keyword));
        const newKws = gapKeywords.filter((k: any) => !existingSet.has(k.keyword));
        return { ...prev, [targetCountry]: [...existing, ...newKws] };
      });

      // Summary message
      const totalGaps = allGaps.length;
      const totalOrganic = competitorResults.reduce((s, c) => s + c.organic_keywords, 0);
      const totalPaid = competitorResults.reduce((s, c) => s + c.paid_keywords, 0);

      setMessages((prev: any) => [...prev, {
        role: "system",
        content: `**Competitor Analysis Complete (${market.name}):**\n\n${competitorResults.map(c =>
          `- **${c.domain}**: ${c.organic_keywords} organic, ${c.paid_keywords} paid, ${c.gaps.length} gaps`
        ).join("\n")}\n\n**Total:** ${totalOrganic} organic keywords, ${totalPaid} paid keywords\n**${totalGaps} keyword gaps found** — keywords competitors rank for organically but aren't bidding on\n${intersectionData.length > 0 ? `**${intersectionData.length} shared keywords** between ${domains[0]} and ${domains[1]}` : ""}\n\nGap keywords have been added to your keyword table. Switch to the **Competitor panel** to see the full breakdown.`,
        timestamp: new Date(),
        action: () => { setPanelMode("competitor"); setPanelOpen(true); },
      }]);
    } catch (err) {
      setMessages((prev: any) => [...prev, {
        role: "system",
        content: `**Competitor Analysis Error:** ${(err as Error).message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setCompetitorLoading(false);
      setApiLoading(false);
      setIsTyping(false);
    }
  }, [hasApiCredentials, targetCountry, apiCredentials, market]);

  // ── Multi-market comparison (Labs) ──
  const handleCompareMarkets = useCallback(async () => {
    if (!hasApiCredentials) {
      setShowApiSettings(true);
      return;
    }

    setApiLoading(true);
    setIsTyping(true);

    try {
      const seedKws = seedKeywords.map(s => s.keyword).slice(0, 10);
      const countryCodes = Object.keys(LOCATION_CODES);
      const results = await compareMarkets(seedKws, countryCodes, apiCredentials);

      const summary = Object.entries(results).map(([code, data]) => {
        if ('error' in (data as any)) return `- **${code}**: Error fetching data`;
        const keywords = data as any[];
        const avgVol = keywords.length > 0 ? Math.round(keywords.reduce((a: number, k: any) => a + k.volume, 0) / keywords.length) : 0;
        const avgCpcVal = keywords.length > 0 ? (keywords.reduce((a: number, k: any) => a + k.cpc, 0) / keywords.length).toFixed(2) : "0.00";
        return `- **${code}**: ${keywords.length} keywords, avg vol ${avgVol}, avg CPC $${avgCpcVal}`;
      }).join("\n");

      setMessages((prev: any) => [...prev, {
        role: "system",
        content: `**Multi-Market Comparison:**\n\n${summary}\n\n*Compared ${seedKws.length} seed keywords across ${countryCodes.length} markets.*`,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages((prev: any) => [...prev, {
        role: "system",
        content: `**Market Comparison Error:** ${(err as Error).message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setApiLoading(false);
      setIsTyping(false);
    }
  }, [hasApiCredentials, seedKeywords, apiCredentials]);

  // ── Bing research ──
  const handleBingResearch = useCallback(async (keywords?: string[]) => {
    if (!hasApiCredentials) {
      setShowApiSettings(true);
      return;
    }

    const kwList = keywords || adjustedKeywords.map((k: any) => k.keyword);
    if (kwList.length === 0) return;

    setBingLoading(true);
    setApiLoading(true);
    setIsTyping(true);

    try {
      // Bing search volume
      const bingVolume = await getBingSearchVolume(
        kwList.slice(0, 1000),
        targetCountry,
        apiCredentials,
      );

      // Bing keyword performance (click/impression estimates)
      const bingPerf = await getBingKeywordPerformance(
        kwList.slice(0, 1000),
        targetCountry,
        apiCredentials,
      ).catch(() => []);

      // Index Bing data by keyword for lookup
      const bingMap: Record<string, any> = {};
      bingVolume.forEach((kw: any) => {
        bingMap[kw.keyword?.toLowerCase()] = {
          keyword: kw.keyword,
          volume: kw.volume || 0,
          cpc: kw.cpc || 0,
          competition: kw.competition || 0,
          intent: kw.intent || "informational",
          difficulty: kw.difficulty || 0,
        };
      });
      (bingPerf as any[]).forEach((p: any) => {
        const key = p.keyword?.toLowerCase();
        if (key && bingMap[key]) {
          bingMap[key].impressions = p.impressions || 0;
          bingMap[key].clicks = p.clicks || 0;
          bingMap[key].ctr = p.ctr || 0;
        }
      });

      setBingData(bingMap);

      // Merge Bing-unique keywords (have Bing volume but no Google data) into liveKeywords
      const existingKws = new Set(adjustedKeywords.map((k: any) => k.keyword?.toLowerCase()));
      const bingOnlyKws = Object.values(bingMap)
        .filter((bd: any) => bd.volume > 0 && !existingKws.has(bd.keyword?.toLowerCase()))
        .map((bd: any) => ({
          keyword: bd.keyword,
          volume: 0,
          cpc: 0,
          competition: bd.competition || 0,
          difficulty: bd.difficulty || 0,
          intent: bd.intent || "informational",
          trend: [],
          relevance: 40,
          group: null,
          sources: ["bing"],
          source: "bing",
        }));

      if (bingOnlyKws.length > 0) {
        setLiveKeywords((prev: any) => {
          const existing = prev[targetCountry] || adjustedKeywords;
          return { ...prev, [targetCountry]: [...existing, ...bingOnlyKws] };
        });
      }

      // Summary
      const totalBingVol = bingVolume.reduce((a: number, k: any) => a + (k.volume || 0), 0);
      const avgBingCpc = bingVolume.length > 0
        ? (bingVolume.reduce((a: number, k: any) => a + (k.cpc || 0), 0) / bingVolume.length).toFixed(2)
        : "0.00";
      const kwWithVolume = bingVolume.filter((k: any) => k.volume > 0).length;
      const totalBingClicks = (bingPerf as any[]).reduce((a: number, p: any) => a + (p.clicks || 0), 0);
      const totalBingImpressions = (bingPerf as any[]).reduce((a: number, p: any) => a + (p.impressions || 0), 0);

      // Find arbitrage opportunities: Bing CPC > 30% cheaper than Google
      const arbitrageCount = Object.entries(bingMap).filter(([kwLower, bd]: [string, any]) => {
        const gkw = adjustedKeywords.find((k: any) => k.keyword?.toLowerCase() === kwLower);
        return gkw && gkw.cpc > 0 && bd.cpc > 0 && ((gkw.cpc - bd.cpc) / gkw.cpc) > 0.3;
      }).length;

      setMessages((prev: any) => [...prev, {
        role: "system",
        content: `**Bing Ads & SEO Data (${market.name}):**\n\n**Search Volume:**\n- **${kwWithVolume}/${kwList.length} keywords** have Bing search volume\n- Total Bing volume: **${totalBingVol.toLocaleString()}/mo** (typically 10-15% of Google)\n- Average Bing CPC: **${market.currency}${avgBingCpc}**\n${bingOnlyKws.length > 0 ? `- **${bingOnlyKws.length} Bing-only keywords** not found in Google — added to table\n` : ""}\n**Bing SEO Traffic:**\n${totalBingImpressions > 0 ? `- **${totalBingImpressions.toLocaleString()} impressions/mo** on Bing organic\n- **${totalBingClicks.toLocaleString()} clicks/mo** from Bing organic\n- Average Bing CTR: **${totalBingImpressions > 0 ? ((totalBingClicks / totalBingImpressions) * 100).toFixed(1) : 0}%**\n` : "- Performance data not available for this market\n"}\n**Arbitrage Opportunities:**\n- **${arbitrageCount} keywords** where Bing CPC is 30%+ cheaper than Google\n- These are highlighted in the table with a green **Δ** indicator\n- Consider running Bing Ads campaigns for these keywords at lower CPCs\n\nBing data is now merged into the keyword table. Source badges show where each keyword was found.`,
        timestamp: new Date(),
        action: () => { setPanelMode("table"); setPanelOpen(true); },
      }]);
    } catch (err) {
      setMessages((prev: any) => [...prev, {
        role: "system",
        content: `**Bing API Error:** ${(err as Error).message}\n\nBing Ads data may not be available for all markets.`,
        timestamp: new Date(),
      }]);
    } finally {
      setBingLoading(false);
      setApiLoading(false);
      setIsTyping(false);
    }
  }, [hasApiCredentials, targetCountry, apiCredentials, adjustedKeywords, market]);

  const handleStripeRefresh = useCallback(async () => {
    setStripeLoading(true);
    try {
      const status = await getStripeStatus();
      setStripeConnected(status.configured);
      if (!status.configured) {
        setStripeLoading(false);
        return;
      }
      const [metrics, attribution, timeline] = await Promise.all([
        getStripeMetrics(),
        getStripeAttribution(),
        getStripeTimeline(),
      ]);
      setStripeMetrics(metrics);
      setStripeAttribution(attribution);
      setStripeTimeline(timeline);
    } catch (err) {
      console.error("Stripe fetch error:", err);
    }
    setStripeLoading(false);
  }, []);

  const handleFetchSerpFeatures = useCallback(async (keywords?: string[]) => {
    const kws = keywords || adjustedKeywords.slice(0, 20).map((k: any) => k.keyword);
    if (!kws.length) return;
    setSeoLoading("serp");
    try {
      const results = await getSerpFeatures(kws, market.code);
      const map: Record<string, SerpFeatureResult> = {};
      results.forEach(r => { map[r.keyword.toLowerCase()] = r; });
      setSerpFeatures(prev => ({ ...prev, ...map }));
    } catch (err) { console.error("SERP features error:", err); }
    setSeoLoading(null);
  }, [adjustedKeywords, market.code]);

  const handleFetchSerpCompetitors = useCallback(async (domain?: string) => {
    const target = domain || (activeProduct?.name ? activeProduct.name.toLowerCase().replace(/\s+/g, "") + ".com" : "example.com");
    setSeoLoading("competitors");
    try {
      const results = await getSerpCompetitors(target, market.code);
      setSerpCompetitors(results);
    } catch (err) { console.error("SERP competitors error:", err); }
    setSeoLoading(null);
  }, [market.code, activeProduct]);

  const handleFetchRankHistory = useCallback(async (keywords?: string[]) => {
    const kws = keywords || adjustedKeywords.slice(0, 15).map((k: any) => k.keyword);
    if (!kws.length) return;
    setSeoLoading("ranks");
    try {
      const results = await getHistoricalRanks(kws, market.code);
      setRankHistory(results);
    } catch (err) { console.error("Rank history error:", err); }
    setSeoLoading(null);
  }, [adjustedKeywords, market.code]);

  const handleFetchBacklinks = useCallback(async (domain?: string) => {
    const target = domain || (activeProduct?.name ? activeProduct.name.toLowerCase().replace(/\s+/g, "") + ".com" : "example.com");
    setSeoLoading("backlinks");
    try {
      const result = await getBacklinkProfile(target);
      setBacklinkData(result);
    } catch (err) { console.error("Backlinks error:", err); }
    setSeoLoading(null);
  }, [activeProduct]);

  const handleFetchBacklinkComparison = useCallback(async (domains?: string[]) => {
    const targets = domains || SAMPLE_COMPETITORS.map((c: any) => c.domain).slice(0, 5);
    if (!targets.length) return;
    setSeoLoading("backlinks");
    try {
      const results = await getBacklinkComparison(targets);
      setBacklinkComparison(results);
    } catch (err) { console.error("Backlink comparison error:", err); }
    setSeoLoading(null);
  }, []);

  const handleFetchGsc = useCallback(async () => {
    setSeoLoading("gsc");
    try {
      // Try live GSC API first if configured
      if (googleStatus?.gsc) {
        const result = await getLiveGscData();
        setGscData(result);
      } else {
        // Fall back to mock SEO service
        const result = await getGscData();
        setGscData(result);
      }
    } catch (err) { console.error("GSC error:", err); }
    setSeoLoading(null);
  }, [googleStatus]);

  const handleFetchGA = useCallback(async () => {
    setGaLoading(true);
    try {
      const result = await getGA4Data({ currency: market.currency });
      setLiveGA(result);
    } catch (err) { console.error("GA4 error:", err); }
    setGaLoading(false);
  }, [market.currency]);

  const handleFetchContentGaps = useCallback(async () => {
    const kws = seedKeywords.length > 0 ? seedKeywords.map((s: any) => s.keyword) : adjustedKeywords.slice(0, 10).map((k: any) => k.keyword);
    const comps = SAMPLE_COMPETITORS.map((c: any) => c.domain).slice(0, 3);
    if (!kws.length || !comps.length) return;
    setSeoLoading("gaps");
    try {
      const results = await getContentGaps(kws, comps);
      setContentGaps(results);
    } catch (err) { console.error("Content gaps error:", err); }
    setSeoLoading(null);
  }, [seedKeywords, adjustedKeywords]);

  // ── Export handlers ──
  const handleExportKeywords = useCallback(() => {
    downloadKeywordsCsv(mergedKeywords, market, `keywords-${market.code.toLowerCase()}.csv`);
  }, [mergedKeywords, market]);

  const handleExportGoogleAds = useCallback(() => {
    downloadGoogleAdsEditor(campaigns as any, market, `google-ads-${market.code.toLowerCase()}.csv`);
  }, [campaigns, market]);

  const handlePushToGoogleAds = useCallback(async (campaignIdx: number) => {
    const camp = campaigns[campaignIdx];
    if (!camp) return;
    setGoogleAdsPushing(true);
    setGoogleAdsPushResult(null);
    try {
      const result = await pushCampaignToGoogleAds({
        name: camp.name,
        dailyBudget: camp.bidConfig.dailyBudget,
        bidStrategy: camp.bidConfig.strategy,
        targetCpa: camp.bidConfig.targetCpa,
        targetRoas: camp.bidConfig.targetRoas,
        targetCountries: camp.targetCountries,
        adGroups: camp.adGroups.map((ag: any) => ({
          name: ag.name,
          keywords: ag.keywords.map((kw: any) => ({
            keyword: kw.keyword,
            matchType: kw.matchType,
            maxCpc: kw.maxCpc,
          })),
          negativeKeywords: ag.negativeKeywords.map((nk: any) => ({
            keyword: nk.keyword,
            matchType: nk.matchType,
          })),
          headlines: ag.headlines,
          descriptions: ag.descriptions,
          finalUrl: ag.finalUrl || camp.landingPageUrl,
        })),
        negativeKeywords: camp.negativeKeywords
          .filter((nk: any) => nk.level === "campaign")
          .map((nk: any) => ({ keyword: nk.keyword, matchType: nk.matchType })),
      });
      setGoogleAdsPushResult(result);
    } catch (err) {
      console.error("Google Ads push error:", err);
    }
    setGoogleAdsPushing(false);
  }, [campaigns]);

  const handleExportPdf = useCallback(() => {
    const sections = [
      {
        title: "Keyword Summary",
        type: "summary" as const,
        metrics: [
          { label: "Total Keywords", value: String(mergedKeywords.length) },
          { label: "Avg CPC", value: `${market.currency}${avgCpc}` },
          { label: "Avg Volume", value: String(avgVolume) },
          { label: "Market", value: market.name },
        ],
      },
      {
        title: "Top Keywords",
        type: "table" as const,
        headers: ["Keyword", "Volume", "CPC", "Difficulty", "Intent", "Relevance"],
        rows: sortedKeywords.slice(0, 20).map((k: any) => [
          k.keyword, k.volume, `${market.currency}${k.cpc.toFixed(2)}`, k.difficulty, k.intent, k.relevance,
        ]),
      },
    ];
    downloadPdfReport(sections, {
      title: `Orion Keyword Report — ${market.name}`,
      market: market.name,
      date: new Date().toLocaleDateString(),
      currency: market.currency,
    });
  }, [mergedKeywords, sortedKeywords, market, avgCpc, avgVolume]);

  // ── Campaign handlers ──
  const handleUpdateCampaigns = useCallback((updated: Campaign[]) => {
    setCampaigns(updated);
  }, []);

  const handleCreateCampaign = useCallback(() => {
    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      name: `New Campaign — ${market.name}`,
      status: "draft",
      adGroups: [{
        id: crypto.randomUUID(),
        name: "Ad Group 1",
        keywords: [],
        negativeKeywords: [],
        headlines: ["Headline 1", "Headline 2", "Headline 3"],
        descriptions: ["Description 1", "Description 2"],
      }],
      negativeKeywords: [],
      bidConfig: { strategy: "manual-cpc", dailyBudget: 20, maxCpcLimit: 5.00 },
      targetCountries: [market.code],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCampaigns((prev: any) => [...prev, newCampaign]);
    setActiveCampaign(campaigns.length);
    setPanelMode("campaign");
    setPanelOpen(true);
  }, [market, campaigns.length]);

  // ── AI ICP/Persona generation handlers ──
  const handleGenerateIcp = useCallback(async () => {
    if (!activeProduct) return;
    try {
      const result = await generateIcp(
        { name: activeProduct.name, description: activeProduct.description, acv: activeProduct.acv, target: activeProduct.target },
        market.code,
        icpProfiles.map(p => p.name)
      );
      const newIcp: IcpProfile = {
        id: crypto.randomUUID(),
        ...(result as Omit<IcpProfile, "id">),
      };
      setIcpProfiles((prev: any) => [...prev, newIcp]);
    } catch (err) {
      console.error("ICP generation error:", err);
    }
  }, [activeProduct, market.code, icpProfiles, setIcpProfiles]);

  const handleGeneratePersona = useCallback(async () => {
    if (!activeProduct) return;
    try {
      const result = await generatePersona(
        { name: activeProduct.name, description: activeProduct.description, acv: activeProduct.acv, target: activeProduct.target },
        market.code,
        icpProfiles[0]?.name,
        buyerPersonas.map(p => p.name)
      );
      const persona = result as Record<string, unknown>;
      const newPersona: BuyerPersona = {
        id: crypto.randomUUID(),
        icpId: icpProfiles[0]?.id || "",
        ...(persona as Omit<BuyerPersona, "id" | "icpId" | "seniority">),
        seniority: (['c-suite', 'director', 'manager', 'individual-contributor'].includes(persona.seniority as string) ? persona.seniority : 'manager') as BuyerPersona['seniority'],
      };
      setBuyerPersonas((prev: any) => [...prev, newPersona]);
    } catch (err) {
      console.error("Persona generation error:", err);
    }
  }, [activeProduct, market.code, icpProfiles, buyerPersonas, setBuyerPersonas]);

  // ── Chat send handler (must be after API handlers) ──
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    const userMsg = { role: "user" as const, content: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const lower = inputValue.toLowerCase();

    // If API credentials are set, route keyword/competitor/traffic queries to live API
    if (hasApiCredentials) {
      // Competitor analysis with Labs
      if (lower.includes("competitor") && (lower.includes("analy") || lower.includes("gap") || lower.includes("organic"))) {
        const defaultCompetitors = ["bill.com", "tipalti.com", "stampli.com", "avidxchange.com"];
        handleCompetitorAnalysis(defaultCompetitors);
        return;
      }

      // Market comparison
      if (lower.includes("compare") && lower.includes("market")) {
        handleCompareMarkets();
        return;
      }

      // Bing research
      if (lower.includes("bing") || (lower.includes("microsoft") && lower.includes("ads"))) {
        handleBingResearch();
        return;
      }

      // Labs keyword expansion (long-tail / SERP)
      if (lower.includes("labs") || lower.includes("serp") || lower.includes("related")) {
        const seedWords = seedKeywords.map(s => s.keyword);
        handleLiveResearch(seedWords);
        return;
      }

      if (lower.includes("research") || (lower.includes("keyword") && (lower.includes("find") || lower.includes("long-tail") || lower.includes("search")))) {
        const seedWords = seedKeywords.map(s => s.keyword);
        handleLiveResearch(seedWords);
        return;
      }
      if ((lower.includes("competitor") || lower.includes("site")) && lower.match(/\b[\w-]+\.(com|co\.uk|io|net|org|de|fr|au)\b/)) {
        const domainMatch = lower.match(/\b([\w-]+\.(?:com|co\.uk|io|net|org|de|fr|au))\b/);
        if (domainMatch) {
          handleSiteResearch(domainMatch[1]);
          return;
        }
      }
      if (lower.includes("traffic") && lower.includes("project")) {
        const kwList = adjustedKeywords.map((k: any) => k.keyword);
        handleTrafficProjection(kwList, 500);
        return;
      }
    }

    // ── Panel-routing shortcuts (keep these for instant navigation) ──
    const panelRoutes: [RegExp | ((s: string) => boolean), string, string, (() => void)?][] = [
      [s => s.includes("serp") || s.includes("featured snippet") || s.includes("people also ask"), "seo", "Analyzing SERP features for your keywords. Check the SEO panel.", () => handleFetchSerpFeatures()],
      [s => s.includes("backlink") || s.includes("domain authority"), "backlinks", "Analyzing backlink profile. Check the Backlinks panel.", () => handleFetchBacklinks()],
      [s => s.includes("rank track") || s.includes("position history") || s.includes("rank history"), "seo", "Loading rank history. Check the SEO panel for position trends.", () => handleFetchRankHistory()],
      [s => s.includes("content gap") || s.includes("content opportunit"), "seo", "Analyzing content gaps. Check the SEO panel.", () => handleFetchContentGaps()],
      [s => s.includes("search console") || s.includes("gsc"), "gsc", "Loading Google Search Console data.", () => handleFetchGsc()],
      [s => (s.includes("stripe") || s.includes("mrr") || s.includes("ltv") || s.includes("churn")), "revenue", stripeConnected ? "Loading live Stripe data." : "Checking Stripe connection... Set STRIPE_SECRET_KEY in .env.", () => handleStripeRefresh()],
      [s => s.includes("show opportunity") || s.includes("opportunity map") || s.includes("scatter"), "visual", "Opening the Opportunity Map."],
      [s => s.includes("show ga") || s.includes("show analytics") || s.includes("ga analytics"), "ga", "Opening Google Analytics panel."],
    ];

    for (const [matcher, panel, msg, action] of panelRoutes) {
      const match = typeof matcher === "function" ? matcher(lower) : matcher.test(lower);
      if (match) {
        if (action) action();
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { role: "system", content: msg, timestamp: new Date(), action: () => { setPanelMode(panel); setPanelOpen(true); } }]);
          setPanelMode(panel);
          setPanelOpen(true);
        }, 800);
        return;
      }
    }

    // ── Export shortcuts ──
    if (lower.includes("export") || lower.includes("csv") || lower.includes("download")) {
      if (lower.includes("google ads") || lower.includes("campaign")) {
        handleExportGoogleAds();
      } else if (lower.includes("pdf") || lower.includes("report")) {
        handleExportPdf();
      } else {
        handleExportKeywords();
      }
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          role: "system",
          content: `**Export started.** Your download should begin automatically. Available exports:\n\n- **"Export keywords"** — CSV with all ${mergedKeywords.length} keywords\n- **"Export Google Ads"** — Campaign-ready file for Google Ads Editor\n- **"Export PDF report"** — Print-friendly keyword report\n\nYou can also use the export buttons in the panel header.`,
          timestamp: new Date(),
        }]);
      }, 600);
      return;
    }

    // ── Budget quick-view ──
    if (lower.includes("budget") || lower.includes("spend") || lower.includes("forecast") || (lower.includes("how much") && lower.includes("cost"))) {
      setTimeout(() => {
        setIsTyping(false);
        setPanelMode("budget");
        setPanelOpen(true);
        setMessages(prev => [...prev, {
          role: "system",
          content: `Opening the **Budget Planner** for ${market.name}. Use the slider, override CTR/conversion rates, and explore 7 budget scenarios.`,
          timestamp: new Date(),
          action: () => { setPanelMode("budget"); setPanelOpen(true); },
        }]);
      }, 600);
      return;
    }

    // ── AI Chat — send to backend LLM ──
    const context = {
      product: activeProduct ? { name: activeProduct.name, description: activeProduct.description, acv: activeProduct.acv, target: activeProduct.target } : undefined,
      keywordsSummary: { count: mergedKeywords.length, avgCpc: parseFloat(avgCpc), topKeywords: mergedKeywords.slice(0, 5).map((k: any) => k.keyword) },
      campaignsSummary: { count: campaigns.length, totalKeywords: campaigns.reduce((a: number, c: any) => a + c.adGroups.reduce((b: number, g: any) => b + g.keywords.length, 0), 0) },
      market: { code: market.code, name: market.name, currency: market.currency },
      budgetMonthly,
    };
    const history = aiChatHistory.slice(-10);

    sendChatMessage(inputValue, history, context, { sessionId, productId: activeProductId })
      .then(result => {
        setIsTyping(false);
        const aiMsg = {
          role: "system" as const,
          content: result.message,
          timestamp: new Date(),
          action: result.suggestedAction?.panel ? () => { setPanelMode(result.suggestedAction!.panel!); setPanelOpen(true); } : undefined,
        };
        setMessages(prev => [...prev, aiMsg]);
        setAiChatHistory(prev => [...prev, { role: "user", content: inputValue }, { role: "assistant", content: result.message }]);
        if (result.suggestedAction?.panel) {
          setPanelMode(result.suggestedAction.panel);
          setPanelOpen(true);
        }
      })
      .catch(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          role: "system",
          content: `I can help with that. Here are some things I can do:\n\n- **"Find long-tail keywords"** — Keyword research with full metrics\n- **"Compare competitors"** — See who's bidding and find gaps\n- **"Build campaign"** — View and edit campaign structure\n- **"Show opportunity map"** — Volume vs competition scatter plot\n- **"Export keywords"** — Download CSV, Google Ads Editor, or PDF\n- **"Budget forecast"** — PPC budget planner with projections\n\nWhat would you like to explore?`,
          timestamp: new Date(),
        }]);
      });
  }, [inputValue, hasApiCredentials, seedKeywords, adjustedKeywords, handleLiveResearch, handleSiteResearch, handleTrafficProjection, handleCompetitorAnalysis, handleCompareMarkets, handleBingResearch, handleStripeRefresh, stripeConnected, market, avgCpc, mergedKeywords, adjustedGA, budgetMonthly, budgetConvRateOverride, handleFetchSerpFeatures, handleFetchBacklinks, handleFetchRankHistory, handleFetchContentGaps, handleFetchGsc, products, campaigns, aiChatHistory, handleExportKeywords, handleExportGoogleAds, handleExportPdf]);

  // ── Styles ──
  const fontLink = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap";

  return (
    <div style={{ width: "100vw", height: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'DM Sans', sans-serif", display: "flex", overflow: "hidden", fontSize: 14 }}>
      <link href={fontLink} rel="stylesheet" />

      {/* ═══ LEFT SIDEBAR ═══ */}
      <IconRail
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        showApiSettings={showApiSettings}
        setShowApiSettings={setShowApiSettings}
        hasApiCredentials={hasApiCredentials}
        showCountryPicker={showCountryPicker}
        setShowCountryPicker={setShowCountryPicker}
        targetCountry={targetCountry}
        setTargetCountry={setTargetCountry}
        market={market}
        panelOpen={panelOpen}
        setPanelOpen={setPanelOpen}
        products={products}
        activeProductId={activeProductId}
        setActiveProductId={setActiveProductId}
      />

      {/* ═══ API SETTINGS PANEL ═══ */}
      <ApiSettingsPanel
        showApiSettings={showApiSettings}
        setShowApiSettings={setShowApiSettings}
        apiCredentials={apiCredentials}
        setApiCredentials={setApiCredentials}
        hasApiCredentials={hasApiCredentials}
        setMessages={setMessages}
        setSidebarTab={setSidebarTab}
      />

      {/* ═══ LEFT CONTENT PANEL (switches based on sidebarTab) ═══ */}
      <div style={{
        flex: panelOpen ? "0 0 50%" : "1 1 100%",
        display: "flex", flexDirection: "column",
        borderRight: panelOpen ? `1px solid ${COLORS.border}` : "none",
        transition: "flex 0.3s ease",
      }}>

        {/* ═══ CHAT TAB ═══ */}
        {sidebarTab === "chat" && (
          <ChatTab
            messages={messages}
            isTyping={isTyping}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSend={handleSend}
            chatEndRef={chatEndRef}
            panelMode={panelMode}
            setPanelMode={setPanelMode}
            setPanelOpen={setPanelOpen}
            market={market}
            inputRef={inputRef}
          />
        )}

        {/* ═══ SEED KEYWORDS TAB ═══ */}
        {sidebarTab === "seeds" && (
          <SeedsTab
            seedKeywords={seedKeywords}
            setSeedKeywords={setSeedKeywords}
            newSeedInput={newSeedInput}
            setNewSeedInput={setNewSeedInput}
            apiLoading={apiLoading}
            handleLiveResearch={handleLiveResearch}
            setPanelMode={setPanelMode}
            setPanelOpen={setPanelOpen}
            market={market}
          />
        )}

        {/* ═══ SAVED GROUPS TAB ═══ */}
        {sidebarTab === "groups" && (
          <GroupsTab
            savedGroups={savedGroups}
            expandedGroup={expandedGroup}
            setExpandedGroup={setExpandedGroup}
            setPanelMode={setPanelMode}
            setPanelOpen={setPanelOpen}
            market={market}
          />
        )}

        {/* ═══ CAMPAIGNS TAB ═══ */}
        {sidebarTab === "campaigns" && (
          <CampaignsTab
            campaigns={campaigns}
            expandedCampaignSidebar={expandedCampaignSidebar}
            setExpandedCampaignSidebar={setExpandedCampaignSidebar}
            setPanelMode={setPanelMode}
            setPanelOpen={setPanelOpen}
            setActiveCampaign={setActiveCampaign}
            onCreateCampaign={handleCreateCampaign}
            onExportCampaign={handleExportGoogleAds}
          />
        )}

        {/* ═══ PRODUCT PROFILES TAB ═══ */}
        {sidebarTab === "products" && (
          <ProductsTab
            products={products}
            activeProductId={activeProductId}
            setActiveProductId={setActiveProductId}
            setPanelMode={setPanelMode}
            setPanelOpen={setPanelOpen}
            onAddProduct={() => setShowOnboarding(true)}
            onEditProduct={(prod) => { setEditProductData(prod); setShowProductForm(true); }}
            onDuplicateProduct={duplicateProduct}
            onDeleteProduct={deleteProduct}
          />
        )}

        {/* ═══ AUDIENCE TAB ═══ */}
        {sidebarTab === "audience" && (
          <AudienceTab
            icpProfiles={icpProfiles}
            buyerPersonas={buyerPersonas}
            audienceSegments={audienceSegments}
            setPanelMode={setPanelMode}
            setPanelOpen={setPanelOpen}
          />
        )}

        {sidebarTab === "knowledge" && (
          <KnowledgeTab
            activeProductId={activeProductId}
            keywords={mergedKeywords}
          />
        )}

      </div>

      {/* ═══ DATA PANEL ═══ */}
      {panelOpen && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: COLORS.bgPanel, overflow: "hidden" }}>

          {/* Panel Header */}
          <div style={{
            height: 56, minHeight: 56, borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", padding: "0 16px", gap: 10,
          }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              {{ table: "Keyword Explorer", competitor: "Competitor Matrix", visual: "Opportunity Map", campaign: "Campaign Builder", budget: "Budget Planner", allocator: "Budget Allocator", revenue: "Revenue & Stripe", seo: "SEO Intelligence", backlinks: "Backlink Analysis", product: "Product Profiles", gsc: "Search Console", ga: "Analytics", audience: "Audience & Personas", timeline: "Campaign Timeline", portfolio: "Portfolio Dashboard" }[panelMode]}
            </span>
            <div style={{ flex: 1 }} />

            {panelMode === "table" && (
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setShowFilterPanel(p => !p)}
                  style={{
                  height: 28, padding: "0 10px", borderRadius: 6,
                  border: `1px solid ${showFilterPanel || activeFilters.length > 0 ? COLORS.accent : COLORS.border}`,
                  background: showFilterPanel || activeFilters.length > 0 ? COLORS.accentDim : "transparent",
                  color: showFilterPanel || activeFilters.length > 0 ? COLORS.accent : COLORS.textSecondary,
                  cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Filter size={11} /> Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
                </button>
                <button
                  onClick={handleExportKeywords}
                  style={{
                  height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Download size={11} /> Export CSV
                </button>
                <button
                  onClick={handleExportPdf}
                  style={{
                  height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <FileDown size={11} /> PDF Report
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={selectedKeywords.size === 0}
                  style={{
                  height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.accent}`,
                  background: selectedKeywords.size > 0 ? COLORS.accentDim : "transparent",
                  color: selectedKeywords.size > 0 ? COLORS.accent : COLORS.textMuted,
                  cursor: selectedKeywords.size > 0 ? "pointer" : "default",
                  fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                  opacity: selectedKeywords.size > 0 ? 1 : 0.5,
                }}>
                  <FolderPlus size={11} /> Save Group{selectedKeywords.size > 0 ? ` (${selectedKeywords.size})` : ""}
                </button>
                {hasApiCredentials && (
                  <button
                    onClick={() => handleBingResearch()}
                    disabled={bingLoading}
                    style={{
                      height: 28, padding: "0 10px", borderRadius: 6,
                      border: `1px solid ${Object.keys(bingData).length > 0 ? COLORS.green : COLORS.border}`,
                      background: Object.keys(bingData).length > 0 ? COLORS.greenDim : "transparent",
                      color: Object.keys(bingData).length > 0 ? COLORS.green : COLORS.textSecondary,
                      cursor: bingLoading ? "wait" : "pointer",
                      fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", gap: 4,
                      opacity: bingLoading ? 0.6 : 1,
                    }}
                  >
                    {bingLoading ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Globe size={11} />}
                    {bingLoading ? "Fetching..." : Object.keys(bingData).length > 0 ? "Bing ✓" : "Fetch Bing"}
                  </button>
                )}
              </div>
            )}

            {panelMode === "campaign" && (
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={handleExportGoogleAds}
                  style={{
                  height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.accent}`,
                  background: COLORS.accentDim, color: COLORS.accent, cursor: "pointer",
                  fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <FileDown size={11} /> Export to Google Ads
                </button>
              </div>
            )}
          </div>

          {/* ── FILTER PANEL ── */}
          {panelMode === "table" && showFilterPanel && (
            <div style={{ padding: "8px 16px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgCard, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { group: "Intent", filters: [{ key: "intent:commercial", label: "Commercial" }, { key: "intent:transactional", label: "Transactional" }, { key: "intent:informational", label: "Informational" }, { key: "intent:navigational", label: "Navigational" }] },
                { group: "Volume", filters: [{ key: "volume:high", label: "High (1k+)" }, { key: "volume:medium", label: "Medium (100-1k)" }, { key: "volume:low", label: "Low (<100)" }] },
                { group: "Competition", filters: [{ key: "competition:low", label: "Low" }, { key: "competition:medium", label: "Medium" }, { key: "competition:high", label: "High" }] },
                { group: "Difficulty", filters: [{ key: "difficulty:easy", label: "Easy (<30)" }, { key: "difficulty:medium", label: "Medium (30-60)" }, { key: "difficulty:hard", label: "Hard (60+)" }] },
                ...(hasBing ? [{ group: "Source", filters: [{ key: "source:google", label: "Google" }, { key: "source:bing", label: "Bing" }, { key: "cpc:arbitrage", label: "CPC Arbitrage" }] }] : []),
              ].map(({ group, filters }) => (
                <div key={group} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginRight: 2 }}>{group}:</span>
                  {filters.map(f => (
                    <button key={f.key} onClick={() => toggleFilter(f.key)} style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      border: `1px solid ${activeFilters.includes(f.key) ? COLORS.accent : COLORS.border}`,
                      background: activeFilters.includes(f.key) ? COLORS.accentDim : "transparent",
                      color: activeFilters.includes(f.key) ? COLORS.accent : COLORS.textSecondary,
                    }}>{f.label}</button>
                  ))}
                  <span style={{ width: 1, height: 16, background: COLORS.border, margin: "0 4px" }} />
                </div>
              ))}
              {activeFilters.length > 0 && (
                <button onClick={() => setActiveFilters([])} style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red,
                }}>Clear All</button>
              )}
            </div>
          )}

          {/* ── TABLE MODE ── */}
          {panelMode === "table" && (
            <TablePanel
              mergedKeywords={filteredKeywords}
              sortedKeywords={sortedKeywords}
              selectedKeywords={selectedKeywords}
              toggleKeyword={toggleKeyword}
              sortCol={sortCol}
              sortDir={sortDir}
              handleSort={handleSort}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              hasBing={hasBing}
              avgCpc={avgCpc}
              avgVolume={avgVolume}
              market={market}
            />
          )}


          {/* ── COMPETITOR MODE ── */}
          {panelMode === "competitor" && (
            <CompetitorPanel
              liveCompetitors={liveCompetitors}
              liveGaps={liveGaps}
              hasApiCredentials={hasApiCredentials}
              competitorLoading={competitorLoading}
              handleCompetitorAnalysis={handleCompetitorAnalysis}
            />
          )}

          {/* ── VISUAL / OPPORTUNITY MAP MODE ── */}
          {panelMode === "visual" && (
            <VisualPanel keywords={SAMPLE_KEYWORDS} />
          )}

          {/* ── CAMPAIGN BUILDER MODE ── */}
          {panelMode === "campaign" && (
            <CampaignBuilderPanel
              campaigns={campaigns}
              onUpdateCampaigns={handleUpdateCampaigns}
              activeCampaignIdx={activeCampaign}
              setActiveCampaignIdx={setActiveCampaign}
              activeAdGroupIdx={activeAdGroup}
              setActiveAdGroupIdx={setActiveAdGroup}
              market={market}
              googleAdsConnected={!!googleStatus?.googleAds}
              onPushToGoogleAds={handlePushToGoogleAds}
              googleAdsPushing={googleAdsPushing}
              googleAdsPushResult={googleAdsPushResult}
            />
          )}

          {/* ── SEO INTELLIGENCE MODE ── */}
          {panelMode === "seo" && (
            <SeoPanel
              serpFeatures={serpFeatures}
              serpCompetitors={serpCompetitors}
              rankHistory={rankHistory}
              contentGaps={contentGaps}
              seoLoading={seoLoading}
              handleFetchSerpFeatures={handleFetchSerpFeatures}
              handleFetchSerpCompetitors={handleFetchSerpCompetitors}
              handleFetchRankHistory={handleFetchRankHistory}
              handleFetchContentGaps={handleFetchContentGaps}
            />
          )}

          {/* ── BACKLINKS MODE ── */}
          {panelMode === "backlinks" && (
            <BacklinksPanel
              backlinkData={backlinkData}
              backlinkComparison={backlinkComparison}
              seoLoading={seoLoading}
              products={products}
              handleFetchBacklinks={handleFetchBacklinks}
              handleFetchBacklinkComparison={handleFetchBacklinkComparison}
            />
          )}

          {/* ── GSC MODE ── */}
          {panelMode === "gsc" && (
            <GscPanel
              gscData={gscData}
              seoLoading={seoLoading}
              adjustedGSC={adjustedGSC}
              handleFetchGsc={handleFetchGsc}
              gscConnected={!!googleStatus?.gsc}
            />
          )}

          {/* ── GA MODE ── */}
          {panelMode === "ga" && (
            <GaPanel
              adjustedGA={adjustedGA}
              liveGA={liveGA}
              gaLoading={gaLoading}
              gaConnected={!!googleStatus?.ga4}
              handleFetchGA={handleFetchGA}
            />
          )}

          {/* ── BUDGET PLANNER MODE ── */}
          {panelMode === "budget" && (
            <BudgetPanel
              mergedKeywords={mergedKeywords}
              selectedKeywords={selectedKeywords}
              budgetMonthly={budgetMonthly}
              setBudgetMonthly={setBudgetMonthly}
              budgetCtrOverride={budgetCtrOverride}
              setBudgetCtrOverride={setBudgetCtrOverride}
              budgetConvRateOverride={budgetConvRateOverride}
              setBudgetConvRateOverride={setBudgetConvRateOverride}
              budgetUseSelected={budgetUseSelected}
              setBudgetUseSelected={setBudgetUseSelected}
              adjustedGA={adjustedGA}
              market={market}
              hasBing={hasBing}
              stripeMetrics={stripeMetrics}
              setPanelMode={setPanelMode}
            />
          )}

          {/* ── REVENUE / STRIPE MODE ── */}
          {panelMode === "revenue" && (
            <RevenuePanel
              stripeConnected={stripeConnected}
              stripeLoading={stripeLoading}
              stripeMetrics={stripeMetrics}
              stripeAttribution={stripeAttribution}
              stripeTimeline={stripeTimeline}
              handleStripeRefresh={handleStripeRefresh}
            />
          )}

          {/* ── PRODUCT PROFILES MODE ── */}
          {panelMode === "product" && (
            <ProductPanel
              products={products}
              onEditProduct={(prod) => { setEditProductData(prod); setShowProductForm(true); }}
              onAddProduct={() => { setEditProductData(null); setShowProductForm(true); }}
            />
          )}

          {/* ── BUDGET ALLOCATOR MODE ── */}
          {panelMode === "allocator" && (
            <BudgetAllocatorPanel
              totalBudget={budgetMonthly}
              setTotalBudget={setBudgetMonthly}
              channelConfigs={channelConfigs}
              setChannelConfigs={setChannelConfigs}
              market={market}
              stripeMetrics={stripeMetrics}
            />
          )}

          {/* ── AUDIENCE & PERSONAS MODE ── */}
          {panelMode === "audience" && (
            <AudiencePanel
              icpProfiles={icpProfiles}
              setIcpProfiles={setIcpProfiles}
              buyerPersonas={buyerPersonas}
              setBuyerPersonas={setBuyerPersonas}
              audienceSegments={audienceSegments}
              setAudienceSegments={setAudienceSegments}
              market={market}
              onGenerateIcp={handleGenerateIcp}
              onGeneratePersona={handleGeneratePersona}
            />
          )}

          {/* ── CAMPAIGN TIMELINE MODE ── */}
          {panelMode === "timeline" && (
            <TimelinePanel
              timeline={timeline}
              setTimeline={setTimeline}
              market={market}
            />
          )}

          {/* ── PORTFOLIO DASHBOARD MODE ── */}
          {panelMode === "portfolio" && (
            <PortfolioPanel
              products={products}
              activeProductId={activeProductId}
              setActiveProductId={setActiveProductId}
              portfolioData={portfolioData}
              market={market}
              setPanelMode={setPanelMode}
              setPanelOpen={setPanelOpen}
            />
          )}

        </div>
      )}

      {/* ═══ PRODUCT FORM MODAL ═══ */}
      <ProductFormModal
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        editProduct={editProductData}
        onSave={(productData) => {
          if (editProductData) {
            updateProduct(productData.id, productData);
          } else {
            addProduct({
              ...productData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any);
          }
        }}
      />

      {/* ═══ PRODUCT ONBOARDING WIZARD ═══ */}
      <ProductOnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(result) => {
          const now = new Date().toISOString();
          addProduct({
            id: result.id,
            name: result.name,
            description: result.description,
            acv: result.acv,
            target: result.target,
            integrations: result.integrations,
            websiteUrl: result.websiteUrl,
            createdAt: now,
            updatedAt: now,
          } as any, {
            keywords: result.keywords.map((kw: string, i: number) => ({
              keyword: kw,
              volume: 0,
              cpc: 0,
              cpcLow: 0,
              cpcHigh: 0,
              competition: 0,
              competitionLabel: "unknown",
              difficulty: 0,
              intent: "commercial" as const,
              trend: null,
              monthlySearches: [],
              relevance: 80 - i,
              group: null,
              spell: null,
              locationCode: undefined,
              languageCode: undefined,
            })),
          });
          setShowOnboarding(false);
        }}
      />

      {/* Animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4d5da; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #b0b3be; }
        input::placeholder { color: ${COLORS.textMuted}; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
