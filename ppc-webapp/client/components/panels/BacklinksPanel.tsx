import React from "react";
import { COLORS } from "../../constants";
import type { BacklinkProfile } from "../../services/seo";
import { ExternalLink, Loader2, GitCompare, Tag, BarChart3 } from "lucide-react";

export interface BacklinksPanelProps {
  backlinkData: BacklinkProfile | null;
  backlinkComparison: BacklinkProfile[];
  seoLoading: string | null;
  products: any[];
  handleFetchBacklinks: (domain?: string) => void;
  handleFetchBacklinkComparison: () => void;
}

export default function BacklinksPanel({
  backlinkData,
  backlinkComparison,
  seoLoading,
  products,
  handleFetchBacklinks,
  handleFetchBacklinkComparison,
}: BacklinksPanelProps) {
  const cardStyle: React.CSSProperties = { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 };
  const labelStyle: React.CSSProperties = { fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" };
  const bigNumStyle: React.CSSProperties = { fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" };
  const defaultDomain = products[0]?.name ? products[0].name.toLowerCase().replace(/\s+/g, "") + ".com" : "example.com";

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {/* Load Controls */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <ExternalLink size={14} color={COLORS.accent} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Backlink Analysis</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            id="backlink-domain-input"
            type="text"
            defaultValue={defaultDomain}
            placeholder="Enter domain..."
            style={{
              flex: 1, height: 34, borderRadius: 6, border: `1px solid ${COLORS.border}`,
              background: COLORS.bgElevated, color: COLORS.text, padding: "0 12px",
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none",
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById("backlink-domain-input") as HTMLInputElement;
              handleFetchBacklinks(input?.value || undefined);
            }}
            disabled={seoLoading === "backlinks"}
            style={{
              height: 34, padding: "0 14px", borderRadius: 6,
              border: `1px solid ${COLORS.accent}`, background: COLORS.accentDim,
              color: COLORS.accent, cursor: seoLoading === "backlinks" ? "wait" : "pointer",
              fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 4,
              opacity: seoLoading === "backlinks" ? 0.6 : 1,
            }}
          >
            {seoLoading === "backlinks" ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <ExternalLink size={11} />}
            {seoLoading === "backlinks" ? "Analyzing..." : "Analyze Backlinks"}
          </button>
          <button
            onClick={() => handleFetchBacklinkComparison()}
            disabled={seoLoading === "backlinks"}
            style={{
              height: 34, padding: "0 14px", borderRadius: 6,
              border: `1px solid ${COLORS.border}`, background: "transparent",
              color: COLORS.textSecondary, cursor: seoLoading === "backlinks" ? "wait" : "pointer",
              fontWeight: 500, fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <GitCompare size={11} /> Compare Competitors
          </button>
        </div>
      </div>

      {seoLoading === "backlinks" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 40, color: COLORS.textMuted }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13 }}>Analyzing backlink profile...</span>
        </div>
      )}

      {backlinkData && seoLoading !== "backlinks" && (() => {
        const b = backlinkData;
        const daColor = b.domainAuthority >= 60 ? COLORS.green : b.domainAuthority >= 30 ? COLORS.amber : COLORS.red;
        const paColor = b.pageAuthority >= 60 ? COLORS.green : b.pageAuthority >= 30 ? COLORS.amber : COLORS.red;
        return (
          <>
            {/* Domain Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Domain Authority", value: b.domainAuthority.toString(), color: daColor },
                { label: "Page Authority", value: b.pageAuthority.toString(), color: paColor },
                { label: "Total Backlinks", value: b.totalBacklinks.toLocaleString(), color: COLORS.accent },
                { label: "Referring Domains", value: b.referringDomains.toLocaleString(), color: COLORS.text },
                { label: "Trust Flow", value: b.trustFlow.toString(), color: COLORS.green },
                { label: "Citation Flow", value: b.citationFlow.toString(), color: COLORS.amber },
              ].map((m, i) => (
                <div key={i} style={cardStyle}>
                  <div style={labelStyle}>{m.label}</div>
                  <div style={{ ...bigNumStyle, color: m.color, marginTop: 4 }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Backlink Health */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              <div style={cardStyle}>
                <div style={labelStyle}>DoFollow Ratio</div>
                <div style={{ ...bigNumStyle, color: b.doFollowRatio >= 70 ? COLORS.green : b.doFollowRatio >= 40 ? COLORS.amber : COLORS.red, marginTop: 4 }}>{b.doFollowRatio.toFixed(1)}%</div>
              </div>
              <div style={cardStyle}>
                <div style={labelStyle}>New (30d)</div>
                <div style={{ ...bigNumStyle, color: COLORS.green, marginTop: 4 }}>+{b.newBacklinks30d.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={labelStyle}>Lost (30d)</div>
                <div style={{ ...bigNumStyle, color: COLORS.red, marginTop: 4 }}>-{b.lostBacklinks30d.toLocaleString()}</div>
              </div>
            </div>

            {/* Top Referring Domains */}
            {b.topReferrers.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 16, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <ExternalLink size={14} color={COLORS.accent} /> Top Referring Domains
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      {["Domain", "Authority", "Backlinks", "DoFollow"].map(h => (
                        <th key={h} style={{ padding: "8px", textAlign: h === "Domain" ? "left" as const : h === "DoFollow" ? "center" as const : "right" as const, ...labelStyle }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.topReferrers.map((ref, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{ref.domain}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: ref.authority >= 60 ? COLORS.green : ref.authority >= 30 ? COLORS.amber : COLORS.red }}>{ref.authority}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{ref.backlinks.toLocaleString()}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, background: ref.doFollow ? COLORS.greenDim : COLORS.redDim, color: ref.doFollow ? COLORS.green : COLORS.red, fontFamily: "'JetBrains Mono', monospace" }}>
                            {ref.doFollow ? "FOLLOW" : "NOFOLLOW"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top Anchors */}
            {b.topAnchors.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 16, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag size={14} color={COLORS.accent} /> Top Anchor Texts
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      {["Anchor Text", "Count", "Percentage"].map(h => (
                        <th key={h} style={{ padding: "8px", textAlign: h === "Anchor Text" ? "left" as const : "right" as const, ...labelStyle }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.topAnchors.map((anc, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>{anc.anchor || "(empty)"}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{anc.count.toLocaleString()}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                            <div style={{ width: 60, height: 6, borderRadius: 3, background: COLORS.bgActive, overflow: "hidden" }}>
                              <div style={{ width: `${anc.percentage}%`, height: "100%", borderRadius: 3, background: COLORS.accent }} />
                            </div>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, minWidth: 36, textAlign: "right" }}>{anc.percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Backlink History Chart */}
            {b.backlinkHistory.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <BarChart3 size={14} color={COLORS.accent} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Backlink History (12 Months)</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
                  {b.backlinkHistory.map((point, i) => {
                    const maxTotal = Math.max(...b.backlinkHistory.map(p => p.total), 1);
                    const barHeight = Math.max(4, (point.total / maxTotal) * 100);
                    const isLast = i === b.backlinkHistory.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: COLORS.textMuted }}>
                          {point.total >= 1000 ? `${(point.total / 1000).toFixed(1)}k` : point.total}
                        </span>
                        <div style={{
                          width: "100%", height: barHeight, borderRadius: 3,
                          background: isLast ? COLORS.accent : `${COLORS.accent}40`,
                          transition: "height 0.3s ease",
                        }} />
                        <span style={{ fontSize: 8, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{point.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Competitor Comparison */}
      {backlinkComparison.length > 0 && seoLoading !== "backlinks" && (
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <GitCompare size={14} color={COLORS.accent} /> Competitor Comparison
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Domain", "DA", "PA", "Total Backlinks", "Referring Domains", "Trust Flow"].map(h => (
                  <th key={h} style={{ padding: "8px", textAlign: h === "Domain" ? "left" as const : "right" as const, ...labelStyle }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...backlinkComparison].sort((a, b) => b.domainAuthority - a.domainAuthority).map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "8px", fontWeight: 600, fontSize: 12 }}>{c.domain}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: c.domainAuthority >= 60 ? COLORS.green : c.domainAuthority >= 30 ? COLORS.amber : COLORS.red }}>{c.domainAuthority}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: c.pageAuthority >= 60 ? COLORS.green : c.pageAuthority >= 30 ? COLORS.amber : COLORS.red }}>{c.pageAuthority}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.totalBacklinks.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.referringDomains.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.green }}>{c.trustFlow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!backlinkData && !seoLoading && backlinkComparison.length === 0 && (
        <div style={{ ...cardStyle, textAlign: "center" as const, padding: 40 }}>
          <ExternalLink size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Backlink Analysis</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>
            Enter a domain above and click "Analyze Backlinks" to see domain authority, referring domains, anchor text distribution, and more.
          </div>
        </div>
      )}
    </div>
  );
}
