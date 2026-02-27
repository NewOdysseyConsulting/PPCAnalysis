import React, { useState, useEffect, useCallback } from "react";
import { Database, Globe, Loader2, Search, Trash2, Play, Square, RefreshCw, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { COLORS } from "../../constants";
import {
  startCrawl,
  getCrawlStatus,
  getSites,
  deleteSite,
  stopCrawl,
  searchKnowledge,
  generateClusters,
  getClusters,
} from "../../services/knowledge";
import type { SiteStats, CrawlJob, SearchResult, KeywordCluster } from "../../services/knowledge";

interface KnowledgeTabProps {
  activeProductId: string;
  keywords: any[];
}

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({
  activeProductId,
  keywords,
}) => {
  // ── Crawl state ──
  const [crawlUrl, setCrawlUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(50);
  const [crawling, setCrawling] = useState(false);
  const [activeJob, setActiveJob] = useState<CrawlJob | null>(null);
  const [sites, setSites] = useState<SiteStats[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // ── Clustering state ──
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);

  // ── Section toggles ──
  const [showCrawl, setShowCrawl] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showClusters, setShowClusters] = useState(false);

  // ── Load sites on mount ──
  const loadSites = useCallback(async () => {
    setSitesLoading(true);
    try {
      const result = await getSites();
      setSites(result);
    } catch { /* ignore */ }
    setSitesLoading(false);
  }, []);

  useEffect(() => { loadSites(); }, [loadSites]);

  // ── Load stored clusters for active product ──
  const loadClusters = useCallback(async () => {
    try {
      const result = await getClusters(activeProductId);
      setClusters(result);
    } catch { /* ignore */ }
  }, [activeProductId]);

  useEffect(() => { loadClusters(); }, [loadClusters]);

  // ── Poll active job status ──
  useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed" || activeJob.status === "stopped") return;
    const interval = setInterval(async () => {
      try {
        const job = await getCrawlStatus(activeJob.id);
        setActiveJob(job);
        if (job.status === "completed" || job.status === "failed" || job.status === "stopped") {
          setCrawling(false);
          loadSites();
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeJob, loadSites]);

  // ── Handlers ──
  const handleStartCrawl = async () => {
    if (!crawlUrl.trim()) return;
    setCrawling(true);
    try {
      const { jobId } = await startCrawl(crawlUrl.trim(), { maxDepth, maxPages });
      const job = await getCrawlStatus(jobId);
      setActiveJob(job);
    } catch (err: any) {
      setCrawling(false);
      alert(err.message || "Failed to start crawl");
    }
  };

  const handleStopCrawl = async () => {
    if (!activeJob) return;
    try {
      await stopCrawl(activeJob.id);
      setActiveJob({ ...activeJob, status: "stopped" });
      setCrawling(false);
    } catch { /* ignore */ }
  };

  const handleDeleteSite = async (siteId: string) => {
    try {
      await deleteSite(siteId);
      loadSites();
    } catch { /* ignore */ }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchKnowledge(searchQuery.trim(), { limit: 8 });
      setSearchResults(results);
    } catch { /* ignore */ }
    setSearching(false);
  };

  const handleGenerateClusters = async () => {
    if (keywords.length === 0) return;
    setClusterLoading(true);
    try {
      const kwInput = keywords.slice(0, 200).map((kw: any) => ({
        keyword: kw.keyword,
        volume: kw.volume,
        cpc: kw.cpc,
        intent: kw.intent,
      }));
      const result = await generateClusters(activeProductId, kwInput);
      setClusters(result);
    } catch (err: any) {
      alert(err.message || "Failed to generate clusters");
    }
    setClusterLoading(false);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.06em", color: COLORS.textMuted,
    fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 32, padding: "0 10px", borderRadius: 6,
    border: `1px solid ${COLORS.border}`, background: COLORS.bgElevated,
    color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  const sectionHeaderStyle = (open: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 8, padding: "10px 0",
    cursor: "pointer", borderBottom: open ? "none" : `1px solid ${COLORS.border}`,
  });

  return (
    <>
      {/* Header */}
      <div style={{
        height: 56, minHeight: 56, borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
        background: "#f1f2f4",
      }}>
        <Database size={16} color={COLORS.accent} />
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>Knowledge Base</span>
        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{sites.length} site{sites.length !== 1 ? "s" : ""}</span>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {/* ═══ SITE CRAWLING ═══ */}
        <div onClick={() => setShowCrawl(!showCrawl)} style={sectionHeaderStyle(showCrawl)}>
          {showCrawl ? <ChevronUp size={14} color={COLORS.textMuted} /> : <ChevronDown size={14} color={COLORS.textMuted} />}
          <Globe size={14} color={COLORS.accent} />
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>Site Crawler</span>
        </div>

        {showCrawl && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Website URL</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text" value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartCrawl()}
                  placeholder="https://example.com" style={{ ...inputStyle, flex: 1 }}
                />
                {crawling ? (
                  <button onClick={handleStopCrawl} style={{
                    height: 32, padding: "0 10px", borderRadius: 6, border: "none",
                    background: COLORS.red, color: "#fff", fontSize: 11, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Square size={11} /> Stop
                  </button>
                ) : (
                  <button onClick={handleStartCrawl} disabled={!crawlUrl.trim()} style={{
                    height: 32, padding: "0 10px", borderRadius: 6, border: "none",
                    background: crawlUrl.trim() ? COLORS.accent : COLORS.bgCard,
                    color: crawlUrl.trim() ? "#fff" : COLORS.textMuted,
                    fontSize: 11, cursor: crawlUrl.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Play size={11} /> Crawl
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Max Depth</label>
                <input type="number" value={maxDepth} min={1} max={5}
                  onChange={(e) => setMaxDepth(Number(e.target.value))} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Max Pages</label>
                <input type="number" value={maxPages} min={1} max={200}
                  onChange={(e) => setMaxPages(Number(e.target.value))} style={inputStyle} />
              </div>
            </div>

            {/* Active job progress */}
            {activeJob && activeJob.status === "running" && (
              <div style={{
                padding: "10px 12px", borderRadius: 8,
                background: COLORS.accentDim, border: `1px solid ${COLORS.accent}20`,
                marginBottom: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Loader2 size={12} color={COLORS.accent} style={{ animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent }}>Crawling {activeJob.siteId}...</span>
                </div>
                <div style={{
                  height: 4, borderRadius: 2, background: COLORS.border,
                }}>
                  <div style={{
                    height: "100%", borderRadius: 2, background: COLORS.accent,
                    width: `${activeJob.pagesTotal > 0 ? (activeJob.pagesCrawled / activeJob.maxPages) * 100 : 0}%`,
                    transition: "width 0.3s ease",
                  }} />
                </div>
                <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                  {activeJob.pagesCrawled} / {activeJob.maxPages} pages
                </span>
              </div>
            )}

            {/* Crawled sites list */}
            {sites.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ ...labelStyle, marginBottom: 0 }}>Indexed Sites</span>
                  <button onClick={loadSites} style={{
                    background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted,
                    display: "flex", alignItems: "center",
                  }}>
                    <RefreshCw size={11} />
                  </button>
                </div>
                {sites.map((site) => (
                  <div key={site.siteId} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 10px", borderRadius: 6, marginBottom: 4,
                    background: COLORS.bgCard, border: `1px solid ${COLORS.borderSubtle}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{site.siteId}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                        {site.pageCount} pages, {site.chunkCount} chunks
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSite(site.siteId)} style={{
                      background: "none", border: "none", cursor: "pointer", color: COLORS.red,
                      display: "flex", alignItems: "center", padding: 4,
                    }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SEMANTIC SEARCH ═══ */}
        <div onClick={() => setShowSearch(!showSearch)} style={sectionHeaderStyle(showSearch)}>
          {showSearch ? <ChevronUp size={14} color={COLORS.textMuted} /> : <ChevronDown size={14} color={COLORS.textMuted} />}
          <Search size={14} color={COLORS.accent} />
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>Semantic Search</span>
        </div>

        {showSearch && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search knowledge base..."
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={handleSearch} disabled={!searchQuery.trim() || searching} style={{
                height: 32, padding: "0 10px", borderRadius: 6, border: "none",
                background: searchQuery.trim() && !searching ? COLORS.accent : COLORS.bgCard,
                color: searchQuery.trim() && !searching ? "#fff" : COLORS.textMuted,
                fontSize: 11, cursor: searchQuery.trim() && !searching ? "pointer" : "default",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {searching ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={11} />}
                Search
              </button>
            </div>
            {searchResults.map((r, i) => (
              <div key={i} style={{
                padding: "8px 10px", borderRadius: 6, marginBottom: 6,
                background: COLORS.bgCard, border: `1px solid ${COLORS.borderSubtle}`,
              }}>
                <div style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.5, marginBottom: 4 }}>
                  {r.content.slice(0, 200)}{r.content.length > 200 ? "..." : ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                    Score: {(r.score * 100).toFixed(0)}%
                  </span>
                  {r.url && (
                    <span style={{ fontSize: 9, color: COLORS.accent }}>
                      {new URL(r.url).pathname}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ KEYWORD CLUSTERS ═══ */}
        <div onClick={() => setShowClusters(!showClusters)} style={sectionHeaderStyle(showClusters)}>
          {showClusters ? <ChevronUp size={14} color={COLORS.textMuted} /> : <ChevronDown size={14} color={COLORS.textMuted} />}
          <Layers size={14} color={COLORS.accent} />
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>Keyword Clusters</span>
          {clusters.length > 0 && (
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>({clusters.length})</span>
          )}
        </div>

        {showClusters && (
          <div style={{ marginBottom: 16 }}>
            <button onClick={handleGenerateClusters} disabled={keywords.length === 0 || clusterLoading} style={{
              width: "100%", height: 32, borderRadius: 6, border: `1px solid ${COLORS.accent}`,
              background: COLORS.accentDim, color: COLORS.accent,
              fontSize: 11, fontWeight: 600, cursor: keywords.length > 0 && !clusterLoading ? "pointer" : "default",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              marginBottom: 10, opacity: keywords.length === 0 ? 0.5 : 1,
            }}>
              {clusterLoading
                ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Clustering...</>
                : <><Layers size={12} /> Generate Clusters ({keywords.length} keywords)</>}
            </button>

            {clusters.map((cluster, i) => (
              <div key={i} style={{
                borderRadius: 8, marginBottom: 6, overflow: "hidden",
                border: `1px solid ${COLORS.border}`, background: COLORS.bgCard,
              }}>
                <div
                  onClick={() => setExpandedCluster(expandedCluster === i ? null : i)}
                  style={{
                    padding: "8px 10px", display: "flex", alignItems: "center", gap: 8,
                    cursor: "pointer",
                  }}
                >
                  {expandedCluster === i
                    ? <ChevronUp size={12} color={COLORS.textMuted} />
                    : <ChevronDown size={12} color={COLORS.textMuted} />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, flex: 1 }}>
                    {cluster.name}
                  </span>
                  <span style={{
                    fontSize: 9, padding: "2px 6px", borderRadius: 4,
                    background: COLORS.accentDim, color: COLORS.accent,
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  }}>
                    {cluster.metadata.keywordCount}
                  </span>
                </div>
                {expandedCluster === i && (
                  <div style={{ padding: "0 10px 10px" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                        Avg Vol: {cluster.metadata.avgVolume}
                      </span>
                      <span style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                        Avg CPC: ${cluster.metadata.avgCpc}
                      </span>
                      <span style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                        Intent: {cluster.metadata.dominantIntent}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {cluster.keywords.map((kw, j) => (
                        <span key={j} style={{
                          fontSize: 10, padding: "3px 8px", borderRadius: 12,
                          background: COLORS.bgElevated, border: `1px solid ${COLORS.borderSubtle}`,
                          color: COLORS.textSecondary,
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
