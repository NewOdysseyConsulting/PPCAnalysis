import React from "react";
import { COLORS } from "../../constants";
import { Sparkline, IntentBadge, MetricChip } from "../ui";
import { Hash, DollarSign, TrendingUp, Target, Globe, Zap, MousePointerClick, Eye, Star, X } from "lucide-react";

export interface TablePanelProps {
  mergedKeywords: any[];
  sortedKeywords: any[];
  selectedKeywords: Set<any>;
  toggleKeyword: (idx: number) => void;
  sortCol: string;
  sortDir: string;
  handleSort: (col: string) => void;
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<never[]>>;
  hasBing: boolean;
  avgCpc: string;
  avgVolume: number;
  market: any;
}

export default function TablePanel({
  mergedKeywords,
  sortedKeywords,
  selectedKeywords,
  toggleKeyword,
  sortCol,
  sortDir,
  handleSort,
  activeFilters,
  setActiveFilters,
  hasBing,
  avgCpc,
  avgVolume,
  market,
}: TablePanelProps) {
  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      {/* Summary Strip */}
      <div style={{
        display: "flex", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`,
        flexWrap: "wrap",
      }}>
        <MetricChip icon={Hash} label="Keywords" value={mergedKeywords.length} color={COLORS.accent} />
        <MetricChip icon={DollarSign} label="Google CPC" value={`${market.currency}${avgCpc}`} color={COLORS.amber} />
        <MetricChip icon={TrendingUp} label="Avg Volume" value={`${avgVolume}/mo`} />
        <MetricChip icon={Target} label="Selected" value={selectedKeywords.size} color={COLORS.purple} />
        {hasBing && (() => {
          const bingKws = mergedKeywords.filter((k: any) => k.bingVol > 0);
          const avgBingCpc = bingKws.length > 0 ? (bingKws.reduce((a: number, k: any) => a + k.bingCpc, 0) / bingKws.length).toFixed(2) : "0";
          const arbitrage = mergedKeywords.filter((k: any) => k.cpcDelta >= 30).length;
          const bingOnly = mergedKeywords.filter((k: any) => k.sources?.includes("bing") && !k.sources?.includes("google")).length;
          return (
            <>
              <MetricChip icon={Globe} label="Bing CPC" value={`${market.currency}${avgBingCpc}`} color="#0078d7" />
              <MetricChip icon={Globe} label="Bing KWs" value={`${bingKws.length}`} color="#0078d7" />
              {arbitrage > 0 && <MetricChip icon={Zap} label="Arbitrage" value={`${arbitrage}`} color={COLORS.green} />}
              {bingOnly > 0 && <MetricChip icon={Globe} label="Bing Only" value={`${bingOnly}`} color={COLORS.purple} />}
              {(() => {
                const totalBingClicks = mergedKeywords.reduce((a: number, k: any) => a + k.bingClicks, 0);
                const totalBingImpr = mergedKeywords.reduce((a: number, k: any) => a + k.bingImpressions, 0);
                return totalBingClicks > 0 ? (
                  <>
                    <MetricChip icon={MousePointerClick} label="Bing Clicks" value={`${totalBingClicks.toLocaleString()}/mo`} color={COLORS.accent} />
                    <MetricChip icon={Eye} label="Bing Impr" value={`${totalBingImpr.toLocaleString()}/mo`} />
                  </>
                ) : null;
              })()}
            </>
          );
        })()}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div style={{ display: "flex", gap: 4, padding: "8px 16px", flexWrap: "wrap" }}>
          {activeFilters.map((f, i) => (
            <span key={i} style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 4,
              background: COLORS.accentDim, color: COLORS.accent,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {f} <X size={10} style={{ cursor: "pointer" }} onClick={() => setActiveFilters(prev => prev.filter((_, j) => j !== i))} />
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <th style={{ width: 36, padding: "10px 8px" }}>
              <input type="checkbox" style={{ accentColor: COLORS.accent }} />
            </th>
            {[
              { key: "keyword", label: "Keyword", align: "left", width: "auto" },
              { key: "sources", label: "Source", align: "center", width: 90, noSort: true },
              { key: "volume", label: "Google Vol", align: "right", width: 80 },
              { key: "trend", label: "Trend", align: "center", width: 72, noSort: true },
              { key: "cpc", label: "Google CPC", align: "right", width: 80 },
              { key: "competition", label: "Comp", align: "right", width: 50 },
              { key: "difficulty", label: "KD", align: "right", width: 40 },
              { key: "intent", label: "Intent", align: "center", width: 100 },
              ...(hasBing ? [
                { key: "bingVol", label: "Bing Vol", align: "right", width: 70 },
                { key: "bingCpc", label: "Bing CPC", align: "right", width: 70 },
                { key: "cpcDelta", label: "\u0394 CPC", align: "right", width: 55 },
                { key: "bingClicks", label: "Bing Clicks", align: "right", width: 75 },
                { key: "bingImpressions", label: "Bing Impr", align: "right", width: 75 },
              ] : []),
              { key: "relevance", label: "Rel", align: "right", width: 40 },
            ].map(col => (
              <th
                key={col.key}
                onClick={() => !(col as any).noSort && handleSort(col.key)}
                style={{
                  padding: "10px 8px", textAlign: col.align as React.CSSProperties["textAlign"], width: col.width,
                  color: COLORS.textMuted, fontWeight: 500, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  cursor: !(col as any).noSort ? "pointer" : "default",
                  userSelect: "none", whiteSpace: "nowrap",
                  fontFamily: "'JetBrains Mono', monospace",
                  background: sortCol === col.key ? COLORS.bgCard : "transparent",
                }}
              >
                {col.label}
                {sortCol === col.key && (
                  <span style={{ marginLeft: 3, fontSize: 8 }}>{sortDir === "desc" ? "\u25BC" : "\u25B2"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedKeywords.map((kw, i) => {
            const isSelected = selectedKeywords.has(i);
            const isHighOpp = kw.group === "high-opportunity";
            const isCompetitor = kw.group === "competitor";
            return (
              <tr
                key={i}
                onClick={() => toggleKeyword(i)}
                style={{
                  borderBottom: `1px solid ${COLORS.borderSubtle}`,
                  background: isSelected ? COLORS.accentDim : "transparent",
                  cursor: "pointer",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = COLORS.bgHover; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ padding: "8px", textAlign: "center" }}>
                  <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ accentColor: COLORS.accent }} />
                </td>
                <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isHighOpp && <Star size={11} color={COLORS.amber} fill={COLORS.amber} />}
                    {isCompetitor && <Target size={11} color={COLORS.red} />}
                    {kw.group === "competitor-gap" && <Zap size={11} color={COLORS.green} />}
                    <span style={{ color: isHighOpp ? COLORS.amber : kw.sources?.includes("bing") && !kw.sources?.includes("google") ? COLORS.purple : COLORS.text }}>{kw.keyword}</span>
                  </div>
                </td>
                {/* Source badges */}
                <td style={{ padding: "8px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                    {(kw.sources || []).map((src: string) => {
                      const srcStyles: Record<string, { bg: string; color: string; label: string }> = {
                        google: { bg: COLORS.accentDim, color: COLORS.accent, label: "G" },
                        labs: { bg: COLORS.purpleDim, color: COLORS.purple, label: "L" },
                        bing: { bg: "rgba(0,120,215,0.08)", color: "#0078d7", label: "B" },
                        site: { bg: COLORS.amberDim, color: COLORS.amber, label: "S" },
                        gap: { bg: COLORS.greenDim, color: COLORS.green, label: "Gap" },
                      };
                      const s = srcStyles[src] || { bg: COLORS.bgCard, color: COLORS.textMuted, label: src };
                      return (
                        <span key={src} title={src === "google" ? "Google Ads" : src === "labs" ? "DataForSEO Labs (SERP)" : src === "bing" ? "Bing Ads" : src === "site" ? "Competitor Site" : src === "gap" ? "Competitor Gap" : src} style={{
                          fontSize: 8, padding: "1px 4px", borderRadius: 3,
                          background: s.bg, color: s.color, fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}>{s.label}</span>
                      );
                    })}
                  </div>
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>
                  {kw.volume > 0 ? kw.volume.toLocaleString() : <span style={{ color: COLORS.textMuted }}>—</span>}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  {kw.trend?.length > 1 ? (
                    <Sparkline data={kw.trend} color={kw.trend[kw.trend.length - 1] > kw.trend[0] ? COLORS.green : COLORS.red} />
                  ) : <span style={{ color: COLORS.textMuted, fontSize: 10 }}>—</span>}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.amber }}>
                  {kw.cpc > 0 ? `${market.currency}${kw.cpc.toFixed(2)}` : <span style={{ color: COLORS.textMuted }}>—</span>}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  <span style={{
                    color: kw.competition < 0.15 ? COLORS.green : kw.competition < 0.3 ? COLORS.amber : COLORS.red,
                  }}>
                    {kw.competition > 0 ? kw.competition.toFixed(2) : "—"}
                  </span>
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  <span style={{
                    color: kw.difficulty < 25 ? COLORS.green : kw.difficulty < 40 ? COLORS.amber : COLORS.red,
                  }}>
                    {kw.difficulty > 0 ? kw.difficulty : "—"}
                  </span>
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  <IntentBadge intent={kw.intent} />
                </td>
                {/* Bing columns */}
                {hasBing && (
                  <>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                      {kw.bingVol > 0 ? (
                        <span>{kw.bingVol.toLocaleString()}</span>
                      ) : <span style={{ color: COLORS.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                      {kw.bingCpc > 0 ? (
                        <span style={{ color: kw.bingCpc < kw.cpc ? COLORS.green : COLORS.text }}>
                          {market.currency}{kw.bingCpc.toFixed(2)}
                        </span>
                      ) : <span style={{ color: COLORS.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>
                      {kw.cpcDelta > 0 ? (
                        <span style={{
                          color: kw.cpcDelta >= 30 ? COLORS.green : kw.cpcDelta >= 15 ? COLORS.amber : COLORS.textMuted,
                        }}>
                          {kw.cpcDelta >= 30 ? "\u25BC" : ""}{kw.cpcDelta}%
                        </span>
                      ) : kw.cpcDelta < 0 ? (
                        <span style={{ color: COLORS.red }}>\u25B2{Math.abs(kw.cpcDelta)}%</span>
                      ) : <span style={{ color: COLORS.textMuted }}>—</span>}
                    </td>
                    {/* Bing SEO traffic */}
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                      {kw.bingClicks > 0 ? (
                        <span style={{ color: COLORS.accent }}>{kw.bingClicks.toLocaleString()}</span>
                      ) : <span style={{ color: COLORS.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                      {kw.bingImpressions > 0 ? (
                        <span>{kw.bingImpressions.toLocaleString()}</span>
                      ) : <span style={{ color: COLORS.textMuted }}>—</span>}
                    </td>
                  </>
                )}
                <td style={{
                  padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: 700, color: kw.relevance >= 95 ? COLORS.accent : COLORS.text,
                }}>
                  {kw.relevance}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
