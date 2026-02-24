import React from "react";
import { COLORS } from "../../constants";
import { Sparkline, IntentBadge, MetricChip } from "../ui";
import type { SerpFeatureResult, SerpCompetitor, HistoricalRank, ContentGap } from "../../services/seo";
import { Search, Loader2, Star, Info, Hash, Users, TrendingUp, TrendingDown, Minus, BarChart3, Zap } from "lucide-react";

export interface SeoPanelProps {
  serpFeatures: Record<string, SerpFeatureResult>;
  serpCompetitors: SerpCompetitor[];
  rankHistory: HistoricalRank[];
  contentGaps: ContentGap[];
  seoLoading: string | null;
  handleFetchSerpFeatures: () => void;
  handleFetchSerpCompetitors: () => void;
  handleFetchRankHistory: () => void;
  handleFetchContentGaps: () => void;
}

export default function SeoPanel({
  serpFeatures,
  serpCompetitors,
  rankHistory,
  contentGaps,
  seoLoading,
  handleFetchSerpFeatures,
  handleFetchSerpCompetitors,
  handleFetchRankHistory,
  handleFetchContentGaps,
}: SeoPanelProps) {
  const cardStyle: React.CSSProperties = { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 };
  const labelStyle: React.CSSProperties = { fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" };
  const serpFeatureList = Object.values(serpFeatures);
  const fsCount = serpFeatureList.filter(r => r.features.some(f => f.type === "featured_snippet" && f.present)).length;
  const paaCount = serpFeatureList.filter(r => r.features.some(f => f.type === "people_also_ask" && f.present)).length;
  const featureBadgeMap: Record<string, { label: string; bg: string; color: string }> = {
    featured_snippet: { label: "FS", bg: COLORS.greenDim, color: COLORS.green },
    people_also_ask: { label: "PAA", bg: "rgba(59,130,246,0.08)", color: "#3b82f6" },
    local_pack: { label: "LP", bg: COLORS.amberDim, color: COLORS.amber },
    knowledge_panel: { label: "KP", bg: COLORS.purpleDim, color: COLORS.purple },
    image_pack: { label: "IP", bg: "rgba(20,184,166,0.08)", color: "#14b8a6" },
    video: { label: "VD", bg: COLORS.redDim, color: COLORS.red },
    shopping: { label: "SH", bg: "rgba(249,115,22,0.08)", color: "#f97316" },
    sitelinks: { label: "SL", bg: "rgba(107,114,128,0.08)", color: "#6b7280" },
    top_stories: { label: "TS", bg: "rgba(236,72,153,0.08)", color: "#ec4899" },
    faq: { label: "FAQ", bg: COLORS.greenDim, color: COLORS.green },
  };
  const improvingCount = rankHistory.filter(r => r.trend === "improving").length;
  const decliningCount = rankHistory.filter(r => r.trend === "declining").length;
  const stableCount = rankHistory.filter(r => r.trend === "stable").length;
  const highOppGaps = contentGaps.filter(g => g.opportunity === "high").length;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {/* SERP Features Analysis */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Search size={14} color={COLORS.accent} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>SERP Features Analysis</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => handleFetchSerpFeatures()}
            disabled={seoLoading === "serp"}
            style={{
              height: 28, padding: "0 12px", borderRadius: 6,
              border: `1px solid ${COLORS.accent}`, background: COLORS.accentDim,
              color: COLORS.accent, cursor: seoLoading === "serp" ? "wait" : "pointer",
              fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 4,
              opacity: seoLoading === "serp" ? 0.6 : 1,
            }}
          >
            {seoLoading === "serp" ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={11} />}
            {seoLoading === "serp" ? "Analyzing..." : "Analyze SERP Features"}
          </button>
        </div>
        {serpFeatureList.length > 0 && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <MetricChip icon={Star} label="Featured Snippet" value={fsCount} color={COLORS.green} small />
              <MetricChip icon={Info} label="PAA" value={paaCount} color="#3b82f6" small />
              <MetricChip icon={Hash} label="Analyzed" value={serpFeatureList.length} color={COLORS.accent} small />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Keyword", "Volume", "KD", "Features", "Organic", "Paid"].map(h => (
                    <th key={h} style={{ padding: "8px", textAlign: h === "Keyword" ? "left" as const : h === "Features" ? "left" as const : "right" as const, ...labelStyle }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {serpFeatureList.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{r.keyword}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{r.volume.toLocaleString()}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: r.difficulty < 25 ? COLORS.green : r.difficulty < 40 ? COLORS.amber : COLORS.red }}>{r.difficulty}</td>
                    <td style={{ padding: "8px" }}>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {r.features.filter(f => f.present).map((f, fi) => {
                          const badge = featureBadgeMap[f.type] || { label: f.type, bg: COLORS.bgCard, color: COLORS.textMuted };
                          return (
                            <span key={fi} title={f.type.replace(/_/g, " ")} style={{
                              fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700,
                              background: badge.bg, color: badge.color,
                              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
                            }}>{badge.label}</span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{r.organicResultsCount}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.amber }}>{r.paidResultsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: COLORS.greenDim, fontSize: 11, color: COLORS.green, fontWeight: 600 }}>
              {fsCount} keywords have featured snippet opportunity, {paaCount} have PAA
            </div>
          </>
        )}
        {serpFeatureList.length === 0 && seoLoading !== "serp" && (
          <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center" as const, padding: 20 }}>
            Click "Analyze SERP Features" to scan your keywords for featured snippets, PAA, and other SERP elements.
          </div>
        )}
      </div>

      {/* SERP Competitors */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Users size={14} color={COLORS.accent} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>SERP Competitors</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => handleFetchSerpCompetitors()}
            disabled={seoLoading === "competitors"}
            style={{
              height: 28, padding: "0 12px", borderRadius: 6,
              border: `1px solid ${COLORS.accent}`, background: COLORS.accentDim,
              color: COLORS.accent, cursor: seoLoading === "competitors" ? "wait" : "pointer",
              fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 4,
              opacity: seoLoading === "competitors" ? 0.6 : 1,
            }}
          >
            {seoLoading === "competitors" ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Users size={11} />}
            {seoLoading === "competitors" ? "Finding..." : "Find SERP Competitors"}
          </button>
        </div>
        {serpCompetitors.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Domain", "Avg Pos", "Visibility", "Keywords", "Est. Traffic", "ETV", "Common"].map(h => (
                  <th key={h} style={{ padding: "8px", textAlign: h === "Domain" ? "left" as const : "right" as const, ...labelStyle }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...serpCompetitors].sort((a, b) => b.visibility - a.visibility).map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "8px", fontWeight: 600, fontSize: 12 }}>{c.domain}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.avgPosition <= 5 ? COLORS.green : c.avgPosition <= 10 ? COLORS.amber : COLORS.red }}>{c.avgPosition.toFixed(1)}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>{(c.visibility * 100).toFixed(1)}%</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.keywordsCount.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{c.estimatedTraffic.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.amber }}>{c.etv.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.commonKeywords}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {serpCompetitors.length === 0 && seoLoading !== "competitors" && (
          <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center" as const, padding: 20 }}>
            Click "Find SERP Competitors" to discover domains competing for your keywords.
          </div>
        )}
      </div>

      {/* Rank Tracking */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <TrendingUp size={14} color={COLORS.accent} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Rank Tracking</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => handleFetchRankHistory()}
            disabled={seoLoading === "ranks"}
            style={{
              height: 28, padding: "0 12px", borderRadius: 6,
              border: `1px solid ${COLORS.accent}`, background: COLORS.accentDim,
              color: COLORS.accent, cursor: seoLoading === "ranks" ? "wait" : "pointer",
              fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 4,
              opacity: seoLoading === "ranks" ? 0.6 : 1,
            }}
          >
            {seoLoading === "ranks" ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <BarChart3 size={11} />}
            {seoLoading === "ranks" ? "Loading..." : "Load Rank History"}
          </button>
        </div>
        {rankHistory.length > 0 && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <MetricChip icon={TrendingUp} label="Improving" value={improvingCount} color={COLORS.green} small />
              <MetricChip icon={TrendingDown} label="Declining" value={decliningCount} color={COLORS.red} small />
              <MetricChip icon={Minus} label="Stable" value={stableCount} color={COLORS.textMuted} small />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Keyword", "Position", "Best", "Trend", "Volatility", "History"].map(h => (
                    <th key={h} style={{ padding: "8px", textAlign: h === "Keyword" ? "left" as const : h === "History" ? "center" as const : "right" as const, ...labelStyle }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankHistory.map((r, i) => {
                  const posColor = r.currentPosition === null ? COLORS.textMuted : r.currentPosition <= 3 ? COLORS.green : r.currentPosition <= 10 ? "#14b8a6" : r.currentPosition <= 20 ? COLORS.amber : COLORS.red;
                  const trendIcons: Record<string, { icon: string; color: string }> = {
                    improving: { icon: "\u25B2", color: COLORS.green },
                    declining: { icon: "\u25BC", color: COLORS.red },
                    stable: { icon: "\u2014", color: COLORS.textMuted },
                    new: { icon: "\u2605", color: "#3b82f6" },
                    lost: { icon: "\u2715", color: COLORS.red },
                  };
                  const t = trendIcons[r.trend] || trendIcons.stable;
                  const posData = r.positions.map(p => p.position !== null ? (101 - p.position) : 0);
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{r.keyword}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: posColor }}>
                        {r.currentPosition !== null ? `#${r.currentPosition}` : "Lost"}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.green }}>{r.bestPosition}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: t.color, fontFamily: "'JetBrains Mono', monospace" }}>{t.icon} {r.trend}</span>
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: r.volatility > 5 ? COLORS.red : r.volatility > 2 ? COLORS.amber : COLORS.green }}>{r.volatility.toFixed(1)}</td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <Sparkline data={posData} color={t.color} width={80} height={20} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: COLORS.bgCard, fontSize: 11, color: COLORS.textSecondary }}>
              {improvingCount} improving, {decliningCount} declining, {stableCount} stable
            </div>
          </>
        )}
        {rankHistory.length === 0 && seoLoading !== "ranks" && (
          <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center" as const, padding: 20 }}>
            Click "Load Rank History" to see position trends over the last 12 months.
          </div>
        )}
      </div>

      {/* Content Gaps */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Zap size={14} color={COLORS.amber} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Content Gaps</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => handleFetchContentGaps()}
            disabled={seoLoading === "gaps"}
            style={{
              height: 28, padding: "0 12px", borderRadius: 6,
              border: `1px solid ${COLORS.accent}`, background: COLORS.accentDim,
              color: COLORS.accent, cursor: seoLoading === "gaps" ? "wait" : "pointer",
              fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 4,
              opacity: seoLoading === "gaps" ? 0.6 : 1,
            }}
          >
            {seoLoading === "gaps" ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={11} />}
            {seoLoading === "gaps" ? "Analyzing..." : "Find Content Gaps"}
          </button>
        </div>
        {contentGaps.length > 0 && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <MetricChip icon={Star} label="High Opp" value={highOppGaps} color={COLORS.green} small />
              <MetricChip icon={Hash} label="Total Gaps" value={contentGaps.length} color={COLORS.accent} small />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Keyword", "Volume", "KD", "Intent", "Opportunity", "Competitors", "Your Pos", "Content Type"].map(h => (
                    <th key={h} style={{ padding: "8px", textAlign: h === "Keyword" || h === "Content Type" ? "left" as const : h === "Intent" || h === "Opportunity" || h === "Competitors" ? "center" as const : "right" as const, ...labelStyle }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contentGaps.map((g, i) => {
                  const oppColors: Record<string, { bg: string; color: string }> = {
                    high: { bg: COLORS.greenDim, color: COLORS.green },
                    medium: { bg: COLORS.amberDim, color: COLORS.amber },
                    low: { bg: "rgba(107,114,128,0.08)", color: "#6b7280" },
                  };
                  const opp = oppColors[g.opportunity] || oppColors.low;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{g.keyword}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{g.volume.toLocaleString()}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: g.difficulty < 25 ? COLORS.green : g.difficulty < 40 ? COLORS.amber : COLORS.red }}>{g.difficulty}</td>
                      <td style={{ padding: "8px", textAlign: "center" }}><IntentBadge intent={g.intent} /></td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, background: opp.bg, color: opp.color, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{g.opportunity}</span>
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                          {g.competitorsRanking.map((cr, ci) => (
                            <span key={ci} title={cr.domain} style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, background: COLORS.accentDim, color: COLORS.accent, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                              {cr.domain.split(".")[0]}:#{cr.position}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: g.yourPosition ? (g.yourPosition <= 10 ? COLORS.green : COLORS.amber) : COLORS.red }}>
                        {g.yourPosition ? `#${g.yourPosition}` : "Not ranking"}
                      </td>
                      <td style={{ padding: "8px", fontSize: 10, color: COLORS.textSecondary }}>{g.suggestedContentType}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: COLORS.greenDim, fontSize: 11, color: COLORS.green, fontWeight: 600 }}>
              {highOppGaps} high-opportunity content gaps found
            </div>
          </>
        )}
        {contentGaps.length === 0 && seoLoading !== "gaps" && (
          <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center" as const, padding: 20 }}>
            Click "Find Content Gaps" to discover keywords your competitors rank for but you don't.
          </div>
        )}
      </div>
    </div>
  );
}
