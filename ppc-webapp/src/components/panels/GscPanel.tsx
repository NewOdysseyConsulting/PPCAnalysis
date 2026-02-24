import React from "react";
import { COLORS } from "../../constants";
import { Sparkline, MetricChip } from "../ui";
import type { GscData } from "../../services/seo";
import { Search, Loader2, MousePointerClick, Eye, TrendingUp, BarChart3, Globe, CheckCircle2, RefreshCw } from "lucide-react";

export interface GscPanelProps {
  gscData: GscData | null;
  seoLoading: string | null;
  adjustedGSC: any;
  handleFetchGsc: () => void;
}

export default function GscPanel({ gscData, seoLoading, adjustedGSC, handleFetchGsc }: GscPanelProps) {
  const cardStyle: React.CSSProperties = { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 };
  const labelStyle: React.CSSProperties = { fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" };
  const bigNumStyle: React.CSSProperties = { fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {/* Load Button */}
      {!gscData && seoLoading !== "gsc" && (
        <div style={{ ...cardStyle, textAlign: "center" as const, marginBottom: 16 }}>
          <Search size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Google Search Console</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            Load organic search performance data — queries, pages, devices, and countries.
          </div>
          <button
            onClick={handleFetchGsc}
            style={{
              height: 34, padding: "0 16px", borderRadius: 8,
              border: `1px solid ${COLORS.accent}`, background: COLORS.accentDim,
              color: COLORS.accent, cursor: "pointer", fontWeight: 600, fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <Search size={13} /> Load GSC Data
          </button>
        </div>
      )}

      {seoLoading === "gsc" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 40, color: COLORS.textMuted }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13 }}>Loading Search Console data...</span>
        </div>
      )}

      {/* Fallback to sample data when no API data */}
      {!gscData && seoLoading !== "gsc" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <MetricChip icon={MousePointerClick} label="Clicks" value={adjustedGSC.reduce((a: number, r: any) => a + r.clicks, 0).toLocaleString()} color={COLORS.accent} />
            <MetricChip icon={Eye} label="Impressions" value={`${(adjustedGSC.reduce((a: number, r: any) => a + r.impressions, 0) / 1000).toFixed(1)}K`} />
            <MetricChip icon={TrendingUp} label="Avg CTR" value="3.32%" color={COLORS.green} />
            <MetricChip icon={BarChart3} label="Avg Position" value="6.4" color={COLORS.amber} />
          </div>
          <div style={{ ...cardStyle, marginBottom: 16, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={14} color={COLORS.accent} /> Top Queries (Sample)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Query", "Clicks", "Impressions", "CTR", "Position", "Trend"].map(h => (
                    <th key={h} style={{ padding: "10px 8px", textAlign: h === "Query" ? "left" as const : h === "Trend" ? "center" as const : "right" as const, color: COLORS.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adjustedGSC.map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{row.query}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>{row.clicks.toLocaleString()}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{row.impressions.toLocaleString()}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: row.ctr >= 5 ? COLORS.green : row.ctr >= 3 ? COLORS.amber : COLORS.red }}>{row.ctr.toFixed(2)}%</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: row.position <= 5 ? COLORS.green : row.position <= 10 ? COLORS.amber : COLORS.red }}>{row.position.toFixed(1)}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}><Sparkline data={row.trend} color={COLORS.green} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Live GSC Data */}
      {gscData && !seoLoading && (() => {
        const g = gscData;
        return (
          <>
            {/* Refresh */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <CheckCircle2 size={14} color={COLORS.green} />
              <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>GSC Data Loaded</span>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>({g.dateRange.start} to {g.dateRange.end})</span>
              <div style={{ flex: 1 }} />
              <button onClick={handleFetchGsc} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Total Clicks", value: g.summary.totalClicks.toLocaleString(), color: COLORS.accent, trend: g.summary.clicksTrend },
                { label: "Impressions", value: g.summary.totalImpressions.toLocaleString(), color: COLORS.text, trend: g.summary.impressionsTrend },
                { label: "Avg CTR", value: `${g.summary.avgCtr.toFixed(2)}%`, color: COLORS.green, trend: null },
                { label: "Avg Position", value: g.summary.avgPosition.toFixed(1), color: COLORS.amber, trend: null },
              ].map((m, i) => (
                <div key={i} style={cardStyle}>
                  <div style={labelStyle}>{m.label}</div>
                  <div style={{ ...bigNumStyle, color: m.color, marginTop: 4 }}>{m.value}</div>
                  {m.trend && <div style={{ marginTop: 8 }}><Sparkline data={m.trend} color={m.color} width={120} height={24} /></div>}
                </div>
              ))}
            </div>

            {/* Device Breakdown */}
            {g.devices.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Globe size={14} color={COLORS.accent} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Device Breakdown</span>
                </div>
                <div style={{ display: "flex", gap: 4, height: 24, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                  {g.devices.map((d, i) => {
                    const total = g.devices.reduce((a, x) => a + x.clicks, 0);
                    const pct = total > 0 ? (d.clicks / total) * 100 : 0;
                    const colors = [COLORS.accent, COLORS.amber, COLORS.purple];
                    return <div key={i} style={{ width: `${pct}%`, background: colors[i] || COLORS.textMuted, minWidth: pct > 0 ? 2 : 0 }} title={`${d.device}: ${pct.toFixed(1)}%`} />;
                  })}
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  {g.devices.map((d, i) => {
                    const total = g.devices.reduce((a, x) => a + x.clicks, 0);
                    const pct = total > 0 ? (d.clicks / total) * 100 : 0;
                    const colors = [COLORS.accent, COLORS.amber, COLORS.purple];
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i] || COLORS.textMuted }} />
                        <span style={{ fontSize: 11, fontWeight: 500 }}>{d.device}</span>
                        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.textMuted }}>{pct.toFixed(1)}% ({d.clicks.toLocaleString()} clicks)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Country Breakdown */}
            {g.countries.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 16, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <Globe size={14} color={COLORS.accent} /> Country Breakdown
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      {["Country", "Clicks", "Impressions", "CTR"].map(h => (
                        <th key={h} style={{ padding: "10px 8px", textAlign: h === "Country" ? "left" as const : "right" as const, color: COLORS.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.countries.map((c, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{c.country}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>{c.clicks.toLocaleString()}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.impressions.toLocaleString()}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.ctr >= 5 ? COLORS.green : c.ctr >= 3 ? COLORS.amber : COLORS.red }}>{c.ctr.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Search Appearance */}
            {g.searchAppearance.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 16, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <Eye size={14} color={COLORS.accent} /> Search Appearance
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      {["Type", "Clicks", "Impressions"].map(h => (
                        <th key={h} style={{ padding: "10px 8px", textAlign: h === "Type" ? "left" as const : "right" as const, color: COLORS.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.searchAppearance.map((sa, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{sa.type}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>{sa.clicks.toLocaleString()}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{sa.impressions.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top Queries */}
            <div style={{ ...cardStyle, marginBottom: 16, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <Search size={14} color={COLORS.accent} /> Top Queries
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    {["Query", "Clicks", "Impressions", "CTR", "Position", "Trend"].map(h => (
                      <th key={h} style={{ padding: "10px 8px", textAlign: h === "Query" ? "left" as const : h === "Trend" ? "center" as const : "right" as const, color: COLORS.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.queries.slice(0, 20).map((q, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{q.query}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>{q.clicks.toLocaleString()}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{q.impressions.toLocaleString()}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: q.ctr >= 5 ? COLORS.green : q.ctr >= 3 ? COLORS.amber : COLORS.red }}>{q.ctr.toFixed(2)}%</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: q.position <= 5 ? COLORS.green : q.position <= 10 ? COLORS.amber : COLORS.red }}>{q.position.toFixed(1)}</td>
                      <td style={{ padding: "8px", textAlign: "center" }}><Sparkline data={q.trend} color={COLORS.green} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Pages */}
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <Globe size={14} color={COLORS.accent} /> Top Pages
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    {["Page", "Clicks", "Impressions", "CTR", "Position", "Top Queries"].map(h => (
                      <th key={h} style={{ padding: "10px 8px", textAlign: h === "Page" || h === "Top Queries" ? "left" as const : "right" as const, color: COLORS.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.pages.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "8px", fontWeight: 500, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.page}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{p.clicks.toLocaleString()}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{p.impressions.toLocaleString()}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.ctr >= 5 ? COLORS.green : p.ctr >= 3 ? COLORS.amber : COLORS.red }}>{p.ctr.toFixed(2)}%</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.position <= 5 ? COLORS.green : p.position <= 10 ? COLORS.amber : COLORS.red }}>{p.position.toFixed(1)}</td>
                      <td style={{ padding: "8px", fontSize: 10, color: COLORS.textMuted }}>{p.topQueries.slice(0, 3).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}
    </div>
  );
}
