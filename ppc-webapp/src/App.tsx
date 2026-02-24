import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Send, ChevronRight, ChevronDown, ArrowUpRight, BarChart3, Table2, GitCompare, Sparkles, Download, Save, FolderPlus, Settings, Plus, X, Loader2, TrendingUp, TrendingDown, Minus, Filter, SlidersHorizontal, Copy, FileDown, Zap, Target, Globe, DollarSign, Eye, MousePointerClick, Tag, Layers, MessageSquare, Bot, User, ChevronLeft, MoreHorizontal, Bookmark, Clock, Play, Pause, RefreshCw, ExternalLink, AlertCircle, CheckCircle2, Info, Star, ArrowRight, PanelRightOpen, PanelRightClose, Command, Hash, Briefcase, PenTool, LayoutGrid, List, Activity, Users, Key } from "lucide-react";
import { getSearchVolume, getKeywordsForKeywords, getKeywordsForSite, getAdTrafficByKeywords, scoreRelevance, LOCATION_CODES, getApiStatus, getLabsKeywordSuggestions, getLabsRelatedKeywords, getLabsRankedKeywords, getLabsDomainIntersection, compareMarkets, getBingSearchVolume, getBingKeywordPerformance } from "./services/dataforseo";
import { getStripeMetrics, getStripeAttribution, getStripeTimeline, getStripeStatus } from "./services/stripe";
import type { StripeMetrics, StripeAttribution, StripeTimelinePoint } from "./services/stripe";
import { getSerpFeatures, getSerpCompetitors, getHistoricalRanks, getBacklinkProfile, getBacklinkComparison, getGscData, getContentGaps } from "./services/seo";
import type { SerpFeatureResult, SerpCompetitor, HistoricalRank, BacklinkProfile, GscData, ContentGap } from "./services/seo";
import { COLORS } from "./constants";
import { Sparkline, IntentBadge, MetricChip } from "./components/ui";
import { SAMPLE_KEYWORDS, SAMPLE_COMPETITORS, SAMPLE_CAMPAIGNS, SAMPLE_PRODUCTS, SAMPLE_GSC_DATA, SAMPLE_GSC_PAGES, SAMPLE_GA_DATA, COUNTRY_MARKETS, INITIAL_MESSAGES } from "./constants";
import { TablePanel, CompetitorPanel, VisualPanel, CampaignPanel, SeoPanel, BacklinksPanel, GscPanel, GaPanel, BudgetPanel, RevenuePanel, ProductPanel } from "./components/panels";
import { ChatTab, SeedsTab, GroupsTab, CampaignsTab, ProductsTab, IconRail, ApiSettingsPanel } from "./components/sidebar";

// ════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════
export default function OrionApp() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [targetCountry, setTargetCountry] = useState("GB");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [panelMode, setPanelMode] = useState("table"); // table | competitor | visual | campaign | product | gsc | ga
  const [panelOpen, setPanelOpen] = useState(true);
  const [keywords, setKeywords] = useState(SAMPLE_KEYWORDS);
  const [selectedKeywords, setSelectedKeywords] = useState(new Set());
  const [sortCol, setSortCol] = useState("relevance");
  const [sortDir, setSortDir] = useState("desc");
  const [activeFilters, setActiveFilters] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [campaigns, setCampaigns] = useState(SAMPLE_CAMPAIGNS);
  const [activeCampaign, setActiveCampaign] = useState(0);
  const [activeAdGroup, setActiveAdGroup] = useState(0);
  const [sidebarTab, setSidebarTab] = useState("chat"); // chat | seeds | groups | campaigns | products
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [showProductInput, setShowProductInput] = useState(false);
  const [seedKeywords, setSeedKeywords] = useState([
    { id: 1, keyword: "accounts payable automation", source: "manual", addedAt: new Date(Date.now() - 86400000 * 5), status: "researched" },
    { id: 2, keyword: "invoice processing software", source: "manual", addedAt: new Date(Date.now() - 86400000 * 5), status: "researched" },
    { id: 3, keyword: "AP automation QuickBooks", source: "ai-suggested", addedAt: new Date(Date.now() - 86400000 * 3), status: "researched" },
    { id: 4, keyword: "supplier payment automation", source: "competitor", addedAt: new Date(Date.now() - 86400000 * 2), status: "researched" },
    { id: 5, keyword: "Bill.com alternative", source: "manual", addedAt: new Date(Date.now() - 86400000 * 2), status: "researched" },
    { id: 6, keyword: "Tipalti alternative small business", source: "ai-suggested", addedAt: new Date(Date.now() - 86400000 * 1), status: "researched" },
    { id: 7, keyword: "purchase order automation", source: "manual", addedAt: new Date(Date.now() - 86400000 * 1), status: "pending" },
    { id: 8, keyword: "automated vendor payments", source: "manual", addedAt: new Date(), status: "pending" },
  ]);
  const [newSeedInput, setNewSeedInput] = useState("");
  const [savedGroups, setSavedGroups] = useState([
    {
      id: 1, name: "High Opportunity — UK AP", description: "Low competition, transactional intent, volume >150",
      createdAt: new Date(Date.now() - 86400000 * 3), color: COLORS.amber,
      keywords: SAMPLE_KEYWORDS.filter(k => k.group === "high-opportunity"),
    },
    {
      id: 2, name: "Competitor Alternatives", description: "Bill.com and Tipalti alternative keywords",
      createdAt: new Date(Date.now() - 86400000 * 2), color: COLORS.red,
      keywords: SAMPLE_KEYWORDS.filter(k => k.group === "competitor"),
    },
    {
      id: 3, name: "Invoice Processing Cluster", description: "All invoice-related keywords with commercial intent",
      createdAt: new Date(Date.now() - 86400000 * 1), color: COLORS.accent,
      keywords: SAMPLE_KEYWORDS.filter(k => k.keyword.includes("invoice")),
    },
  ]);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [expandedCampaignSidebar, setExpandedCampaignSidebar] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [apiCredentials, setApiCredentials] = useState({ login: "", password: "" });
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [liveKeywords, setLiveKeywords] = useState({}); // { [countryCode]: keyword[] }
  const [liveCompetitors, setLiveCompetitors] = useState<Record<string, any>>({});
  const [liveGaps, setLiveGaps] = useState<any[]>([]);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [bingData, setBingData] = useState<Record<string, any>>({});  // { [keyword]: { volume, cpc, ... } }
  const [bingLoading, setBingLoading] = useState(false);
  const [budgetMonthly, setBudgetMonthly] = useState(1000);
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasApiCredentials = apiCredentials.login && apiCredentials.password;

  // ── Derived market data (live API data if available, else sample) ──
  const market = COUNTRY_MARKETS[targetCountry as keyof typeof COUNTRY_MARKETS];
  const adjustedKeywords = (liveKeywords as Record<string, any>)[targetCountry] || market.keywords;
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

  const toggleKeyword = (idx: number) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const sortedKeywords = [...mergedKeywords].sort((a: any, b: any) => {
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
      const activeProduct = products[0] || null;
      const scored = volumeData
        .filter(kw => kw && kw.volume > 0)
        .map(kw => {
          const kwLower = kw.keyword?.toLowerCase();
          const sources: string[] = ["google"];
          if (labsKeywordSet.has(kwLower)) sources.push("labs");
          return {
            ...kw,
            relevance: scoreRelevance(kw, activeProduct),
            sources,
            source: labsKeywordSet.has(kwLower) ? "labs" : "google",
          };
        })
        .sort((a, b) => b.relevance - a.relevance);

      // Store in live data
      setLiveKeywords(prev => ({ ...prev, [targetCountry]: scored }));

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
  }, [hasApiCredentials, targetCountry, apiCredentials, products, market]);

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
      const activeProduct = products[0] || null;
      const scored = results
        .filter(kw => kw && kw.volume > 0)
        .map(kw => ({ ...kw, relevance: scoreRelevance(kw, activeProduct), sources: ["site"], source: "site" }))
        .sort((a, b) => b.volume - a.volume);

      setMessages(prev => [...prev, {
        role: "system",
        content: `**Competitor keywords for ${domain} (${market.name}):**\n\n- **${scored.length} keywords** found\n- Top keyword: **"${scored[0]?.keyword || "—"}"** (${scored[0]?.volume?.toLocaleString() || 0}/mo)\n- Average CPC: **${market.currency}${(scored.reduce((a, k) => a + k.cpc, 0) / (scored.length || 1)).toFixed(2)}**\n\nKeywords added to your table for comparison.`,
        timestamp: new Date(),
        action: () => { setPanelMode("table"); setPanelOpen(true); },
      }]);

      // Merge with existing live keywords
      setLiveKeywords(prev => {
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
  }, [hasApiCredentials, targetCountry, apiCredentials, products, market]);

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
    const target = domain || (products[0]?.name ? products[0].name.toLowerCase().replace(/\s+/g, "") + ".com" : "example.com");
    setSeoLoading("competitors");
    try {
      const results = await getSerpCompetitors(target, market.code);
      setSerpCompetitors(results);
    } catch (err) { console.error("SERP competitors error:", err); }
    setSeoLoading(null);
  }, [market.code, products]);

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
    const target = domain || (products[0]?.name ? products[0].name.toLowerCase().replace(/\s+/g, "") + ".com" : "example.com");
    setSeoLoading("backlinks");
    try {
      const result = await getBacklinkProfile(target);
      setBacklinkData(result);
    } catch (err) { console.error("Backlinks error:", err); }
    setSeoLoading(null);
  }, [products]);

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
      const result = await getGscData();
      setGscData(result);
    } catch (err) { console.error("GSC error:", err); }
    setSeoLoading(null);
  }, []);

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

    // Simulate AI response for non-API queries (or when no credentials)
    setTimeout(() => {
      let response: { role: "system"; content: string; timestamp: Date; action?: () => void };

      if (lower.includes("long-tail") || lower.includes("keyword") && lower.includes("accounts payable")) {
        response = {
          role: "system",
          content: `Found **${adjustedKeywords.length} keyword variations** for ${market.name}.\n\n**Key findings:**\n- Average CPC: **${market.currency}${avgCpc}** \n- **${adjustedKeywords.filter((k: any) => k.group === "high-opportunity").length} high-opportunity keywords** with transactional intent\n- ${market.competitorNote}\n\nThe data panel shows all results sorted by opportunity score.${!hasApiCredentials ? "\n\n*Connect your DataForSEO API key to get live keyword data instead of sample data.*" : ""}`,
          timestamp: new Date(),
          action: () => { setPanelMode("table"); setPanelOpen(true); },
        };
      } else if (lower.includes("competitor") || lower.includes("tipalti") || lower.includes("bill.com")) {
        response = {
          role: "system",
          content: `**Competitor Landscape — UK AP Automation:**\n\n| Competitor | Paid Keywords (UK) | Est. Monthly Spend |\n|---|---|---|\n| Bill.com | 128 keywords | $82K/mo |\n| Tipalti | 95 keywords | $54K/mo |\n| Stampli | 44 keywords | $22K/mo |\n| AvidXchange | 67 keywords | $38K/mo |\n\n**Critical gap:** Bill.com dominates volume but overspends on broad terms. Their top keyword "accounts payable software" has a CPC of £8.40 — you can outperform on long-tail at £3-4. Tipalti isn't bidding on any QuickBooks-specific terms.\n\nSwitch to the **Competitor panel** to see the full keyword intersection matrix.`,
          timestamp: new Date(),
          action: () => { setPanelMode("competitor"); setPanelOpen(true); },
        };
      } else if (lower.includes("campaign") || lower.includes("build") || lower.includes("ad group") || lower.includes("ad copy")) {
        response = {
          role: "system",
          content: `I've structured a campaign draft based on your high-opportunity keywords and Nexus AP's product profile.\n\n**Campaign: Nexus AP — UK Launch**\n- **3 ad groups** clustered by theme\n- **8 keywords** across groups\n- **6 headline variations** and **6 descriptions** generated\n- Estimated monthly budget: **£540-720**\n- Expected CTR: **3.2-4.5%** (above B2B SaaS average)\n\nThe campaign panel shows the full structure with editable ad copy. Each headline and description is tailored to the keyword cluster's intent and Nexus AP's positioning against Bill.com and Tipalti.`,
          timestamp: new Date(),
          action: () => { setPanelMode("campaign"); setPanelOpen(true); },
        };
      } else if (lower.includes("product") || lower.includes("nexus")) {
        response = {
          role: "system",
          content: `**Active Product Profile — Nexus AP:**\n\n- **ACV Range:** £588–£2,400/year\n- **Target Buyer:** Financial Controllers, AP Managers at 10-200 employee companies\n- **Key Integrations:** QuickBooks Online, Xero\n- **Core Value Props:** Three-way matching, automated approval workflows, supplier payment automation, real-time AP dashboard\n- **Differentiator:** Purpose-built for SMBs — no enterprise bloat, connects to QBO/Xero in 2 minutes\n\nThis profile is used to generate contextual ad copy and score keyword relevance. You can edit it in the Products panel.`,
          timestamp: new Date(),
          action: () => { setPanelMode("product"); setPanelOpen(true); },
        };
      } else if (lower.includes("serp") || lower.includes("serp feature") || lower.includes("featured snippet") || lower.includes("people also ask")) {
        handleFetchSerpFeatures();
        response = {
          role: "system",
          content: `Analyzing SERP features for your keywords in the ${market.name} market. Check the SEO panel for featured snippet opportunities, PAA boxes, and other SERP elements.`,
          timestamp: new Date(),
          action: () => { setPanelMode("seo"); setPanelOpen(true); },
        };
      } else if (lower.includes("backlink") || lower.includes("domain authority") || lower.includes("referring domain")) {
        handleFetchBacklinks();
        response = {
          role: "system",
          content: `Analyzing backlink profile. Check the Backlinks panel for domain authority, referring domains, anchor text distribution, and competitor comparison.`,
          timestamp: new Date(),
          action: () => { setPanelMode("backlinks"); setPanelOpen(true); },
        };
      } else if (lower.includes("rank track") || lower.includes("position history") || lower.includes("rank history")) {
        handleFetchRankHistory();
        response = {
          role: "system",
          content: `Loading rank history for your tracked keywords. Check the SEO panel for position trends over the last 12 months.`,
          timestamp: new Date(),
          action: () => { setPanelMode("seo"); setPanelOpen(true); },
        };
      } else if (lower.includes("content gap") || lower.includes("content opportunit")) {
        handleFetchContentGaps();
        response = {
          role: "system",
          content: `Analyzing content gaps — keywords your competitors rank for but you don't. Check the SEO panel for high-opportunity content recommendations.`,
          timestamp: new Date(),
          action: () => { setPanelMode("seo"); setPanelOpen(true); },
        };
      } else if (lower.includes("search console") || lower.includes("gsc")) {
        handleFetchGsc();
        response = {
          role: "system",
          content: `Loading Google Search Console data — organic queries, pages, devices, and country breakdown. Check the GSC panel for details.`,
          timestamp: new Date(),
          action: () => { setPanelMode("gsc"); setPanelOpen(true); },
        };
      } else if (lower.includes("budget") || lower.includes("spend") || lower.includes("forecast") || (lower.includes("how much") && lower.includes("cost"))) {
        const bAvgCpc = mergedKeywords.length > 0 ? (mergedKeywords.reduce((a: number, k: any) => a + k.cpc, 0) / mergedKeywords.length) : 0;
        const bClicks = bAvgCpc > 0 ? Math.round(budgetMonthly / bAvgCpc) : 0;
        const bPaidCh = adjustedGA.channels.find((c: any) => c.channel === "Paid Search");
        const bConvR = budgetConvRateOverride ?? (bPaidCh?.convRate || 4.8);
        const bConv = Math.round(bClicks * (bConvR / 100));
        const bCpa = bConv > 0 ? (budgetMonthly / bConv).toFixed(2) : "N/A";
        const bRev = bConv * 1494;
        const bRoas = budgetMonthly > 0 ? (bRev / budgetMonthly).toFixed(1) : "0";
        response = {
          role: "system",
          content: `**Budget Planner for ${market.name}:**\n\nBased on ${mergedKeywords.length} keywords with avg CPC ${market.currency}${bAvgCpc.toFixed(2)}:\n\n| Metric | Projection |\n|---|---|\n| Monthly Budget | ${market.currency}${budgetMonthly.toLocaleString()} |\n| Estimated Clicks | ${bClicks.toLocaleString()} |\n| Conversions (${bConvR}%) | ${bConv} |\n| CPA | ${market.currency}${bCpa} |\n| Est. Annual Revenue | ${market.currency}${bRev.toLocaleString()} |\n| ROAS | ${bRoas}x |\n\nOpen the **Budget Planner** panel to adjust your budget, override CTR/conversion rates, and explore scenarios.`,
          timestamp: new Date(),
          action: () => { setPanelMode("budget"); setPanelOpen(true); },
        };
      } else if (lower.includes("stripe") || lower.includes("mrr") || lower.includes("revenue") || lower.includes("ltv") || lower.includes("churn") || lower.includes("subscription")) {
        handleStripeRefresh();
        response = {
          role: "system",
          content: stripeConnected
            ? `Loading live Stripe data — MRR, LTV, churn, and keyword attribution. Check the Revenue panel for real-time subscription metrics.`
            : `Checking Stripe connection... Set STRIPE_SECRET_KEY in your .env to connect. Opening the Revenue panel now.`,
          timestamp: new Date(),
          action: () => { setPanelMode("revenue"); setPanelOpen(true); },
        };
      } else if (lower.includes("ga") || lower.includes("analytics") || lower.includes("traffic") || lower.includes("conversion")) {
        response = {
          role: "system",
          content: `**Google Analytics — Last 28 Days:**\n\n- **Users:** 12,480 (+22% vs prior period)\n- **Sessions:** 18,640 (+19%)\n- **Bounce Rate:** 42.3% (down from 46.1% — improving)\n- **Avg Session Duration:** 3:24\n\n**Channel Performance:**\n- **Paid Search** leads in revenue: £22,600 (4.8% conversion rate)\n- **Organic Search** leads in users: 5,240 (3.4% conversion rate)\n- **Email** has highest conversion rate: 5.6%\n\n**Key Conversions:**\n- Demo Requests: 142 (£42,600 value)\n- Free Trial Signups: 86 (£25,800 value)\n\nSwitch to the **GA panel** for channel breakdown, top pages, and conversion details.`,
          timestamp: new Date(),
          action: () => { setPanelMode("ga"); setPanelOpen(true); },
        };
      } else if (lower.includes("export") || lower.includes("csv") || lower.includes("google ads editor")) {
        response = {
          role: "system",
          content: `**Export ready.** I've prepared two formats:\n\n1. **CSV** — Full keyword dataset with all metrics (${SAMPLE_KEYWORDS.length} keywords)\n2. **Google Ads Editor** — Campaign-ready import file with keywords, match types, suggested bids, and ad group assignments\n\nThe Google Ads Editor file maps directly to the "Nexus AP — UK Launch" campaign structure. Import it into Google Ads and your campaign goes live immediately.\n\n*Click the download buttons in the data panel toolbar.*`,
          timestamp: new Date(),
        };
      } else {
        response = {
          role: "system",
          content: `I can help with that. Here are some things I can do:\n\n- **"Find long-tail keywords for [topic]"** — Pulls from DataForSEO with full metrics\n- **"Compare competitors for [keyword]"** — Shows who's bidding and where the gaps are\n- **"Build a campaign from [keyword group]"** — Generates ad groups, copy, and budget estimates\n- **"Show opportunity map"** — Visual scatter plot of volume vs competition\n- **"Show GSC performance"** — Google Search Console queries, pages & ranking data\n- **"Show GA analytics"** — Google Analytics traffic, channels & conversions\n- **"Budget forecast"** — PPC budget planner with click/conversion projections\n- **"Export to Google Ads Editor"** — Campaign-ready file for immediate import\n\nWhat would you like to explore?`,
          timestamp: new Date(),
        };
      }

      setIsTyping(false);
      setMessages(prev => [...prev, response]);
      if (response.action) response.action();
    }, 1800);
  }, [inputValue, hasApiCredentials, seedKeywords, adjustedKeywords, handleLiveResearch, handleSiteResearch, handleTrafficProjection, handleCompetitorAnalysis, handleCompareMarkets, handleBingResearch, handleStripeRefresh, stripeConnected, market, avgCpc, mergedKeywords, adjustedGA, budgetMonthly, budgetConvRateOverride, handleFetchSerpFeatures, handleFetchBacklinks, handleFetchRankHistory, handleFetchContentGaps, handleFetchGsc]);

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
          />
        )}

        {/* ═══ PRODUCT PROFILES TAB ═══ */}
        {sidebarTab === "products" && (
          <ProductsTab
            products={products}
            setPanelMode={setPanelMode}
            setPanelOpen={setPanelOpen}
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
              {{ table: "Keyword Explorer", competitor: "Competitor Matrix", visual: "Opportunity Map", campaign: "Campaign Builder", budget: "Budget Planner", revenue: "Revenue & Stripe", seo: "SEO Intelligence", backlinks: "Backlink Analysis", product: "Product Profiles", gsc: "Search Console", ga: "Analytics" }[panelMode]}
            </span>
            <div style={{ flex: 1 }} />

            {panelMode === "table" && (
              <div style={{ display: "flex", gap: 4 }}>
                <button style={{
                  height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Filter size={11} /> Filters
                </button>
                <button style={{
                  height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Download size={11} /> Export
                </button>
                <button style={{
                  height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.accent}`,
                  background: COLORS.accentDim, color: COLORS.accent, cursor: "pointer",
                  fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <FolderPlus size={11} /> Save Group
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
                <button style={{
                  height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <PenTool size={11} /> Regenerate Copy
                </button>
                <button style={{
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

          {/* ── TABLE MODE ── */}
          {panelMode === "table" && (
            <TablePanel
              mergedKeywords={mergedKeywords}
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
            <CampaignPanel
              campaigns={campaigns}
              activeAdGroup={activeAdGroup}
              setActiveAdGroup={setActiveAdGroup}
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
            />
          )}

          {/* ── GA MODE ── */}
          {panelMode === "ga" && (
            <GaPanel adjustedGA={adjustedGA} />
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
            <ProductPanel products={products} />
          )}

        </div>
      )}

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
