import React from "react";
import { COLORS, SAMPLE_KEYWORDS, SAMPLE_COMPETITORS } from "../../constants";
import { ExternalLink, GitCompare, Loader2, Zap } from "lucide-react";

export interface CompetitorPanelProps {
  liveCompetitors: Record<string, any>;
  liveGaps: any[];
  hasApiCredentials: any;
  competitorLoading: boolean;
  handleCompetitorAnalysis: (domains: string[]) => void;
}

export default function CompetitorPanel({
  liveCompetitors,
  liveGaps,
  hasApiCredentials,
  competitorLoading,
  handleCompetitorAnalysis,
}: CompetitorPanelProps) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {(Object.keys(liveCompetitors).length > 0
          ? Object.values(liveCompetitors).map((comp: any) => ({
              domain: comp.domain,
              keywords_shared: comp.organic?.filter((ok: any) => comp.paid?.some((pk: any) => pk.keyword === ok.keyword)).length || 0,
              paid_keywords: comp.paid_keywords,
              organic_keywords: comp.organic_keywords,
              est_traffic: comp.est_traffic,
              budget: `~$${Math.round(comp.paid?.reduce((a: number, k: any) => a + (k.cpc || 0) * (k.volume || 0) / 12, 0) || 0).toLocaleString()}/mo`,
              gaps: comp.gaps?.length || 0,
            }))
          : SAMPLE_COMPETITORS
        ).map((comp: any, i: number) => (
          <div key={i} style={{
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{comp.domain}</span>
              <ExternalLink size={13} color={COLORS.textMuted} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shared</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent }}>{comp.keywords_shared}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>Paid KWs</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{comp.paid_keywords}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>Est. Traffic</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{(comp.est_traffic / 1000).toFixed(1)}K</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>Budget</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: COLORS.amber }}>{comp.budget}</div>
              </div>
            </div>
            {/* Mini gap indicator */}
            <div style={{ marginTop: 12, padding: "8px 10px", borderRadius: 6, background: COLORS.greenDim, border: `1px solid rgba(22,163,74,0.12)` }}>
              <span style={{ fontSize: 10, color: COLORS.green, fontWeight: 600 }}>
                {comp.gaps || (comp.paid_keywords - comp.keywords_shared)} keyword gaps found
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Run Competitor Analysis Button */}
      {hasApiCredentials && (
        <button
          onClick={() => handleCompetitorAnalysis(["bill.com", "tipalti.com", "stampli.com", "avidxchange.com"])}
          disabled={competitorLoading}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 8, marginBottom: 16,
            border: `1px solid ${COLORS.accent}`, background: COLORS.accentDim,
            color: COLORS.accent, cursor: competitorLoading ? "wait" : "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: competitorLoading ? 0.6 : 1,
          }}
        >
          {competitorLoading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <GitCompare size={15} />}
          {competitorLoading ? "Analyzing competitors..." : "Run Live Competitor Analysis"}
        </button>
      )}

      {/* Keyword Intersection Matrix */}
      <div style={{
        background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
        borderRadius: 10, padding: 16,
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Keyword Intersection</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4, 80px)", gap: 1, fontSize: 11 }}>
          {/* Header */}
          <div style={{ padding: 8, fontWeight: 600, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>Keyword</div>
          {SAMPLE_COMPETITORS.map((c, i) => (
            <div key={i} style={{ padding: 8, fontWeight: 600, color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", textAlign: "center" }}>
              {c.domain.split(".")[0]}
            </div>
          ))}
          {/* Rows */}
          {SAMPLE_KEYWORDS.slice(0, 8).map((kw, i) => (
            <React.Fragment key={`row-${i}`}>
              <div style={{ padding: "6px 8px", borderTop: `1px solid ${COLORS.borderSubtle}`, fontSize: 11, fontWeight: 500 }}>
                {kw.keyword}
              </div>
              {SAMPLE_COMPETITORS.map((c, j) => {
                const hasPaid = Math.random() > 0.5;
                const hasOrganic = Math.random() > 0.3;
                return (
                  <div key={`cell-${i}-${j}`} style={{
                    padding: "6px 8px", borderTop: `1px solid ${COLORS.borderSubtle}`,
                    textAlign: "center", display: "flex", justifyContent: "center", gap: 4,
                  }}>
                    {hasPaid && (
                      <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: COLORS.amberDim, color: COLORS.amber, fontWeight: 600 }}>
                        Ad
                      </span>
                    )}
                    {hasOrganic && (
                      <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: COLORS.accentDim, color: COLORS.accent, fontWeight: 600 }}>
                        #{Math.floor(Math.random() * 10 + 1)}
                      </span>
                    )}
                    {!hasPaid && !hasOrganic && (
                      <span style={{ fontSize: 9, color: COLORS.textMuted }}>—</span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Keyword Gaps Section */}
      {liveGaps.length > 0 && (
        <div style={{
          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
          borderRadius: 10, padding: 16, marginTop: 12,
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={14} color={COLORS.amber} />
            Keyword Gaps — Organic Only (Not Bid On)
            <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>
              {liveGaps.length} gaps found
            </span>
          </div>
          <div style={{ fontSize: 11 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 70px 80px 70px 1fr", gap: 1, marginBottom: 4 }}>
              <div style={{ padding: "6px 8px", fontWeight: 600, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>Keyword</div>
              <div style={{ padding: "6px 8px", fontWeight: 600, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", textAlign: "right" }}>Volume</div>
              <div style={{ padding: "6px 8px", fontWeight: 600, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", textAlign: "right" }}>CPC</div>
              <div style={{ padding: "6px 8px", fontWeight: 600, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", textAlign: "right" }}>Comp.</div>
              <div style={{ padding: "6px 8px", fontWeight: 600, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", textAlign: "right" }}>Rank</div>
              <div style={{ padding: "6px 8px", fontWeight: 600, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>Competitor</div>
            </div>
            {/* Rows */}
            {liveGaps.slice(0, 30).map((gap: any, i: number) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "2fr 80px 70px 80px 70px 1fr", gap: 1,
                borderTop: `1px solid ${COLORS.borderSubtle}`,
                background: i % 2 === 0 ? "transparent" : COLORS.bgHover,
              }}>
                <div style={{ padding: "6px 8px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gap.keyword}</div>
                <div style={{ padding: "6px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{(gap.volume || 0).toLocaleString()}</div>
                <div style={{ padding: "6px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>${(gap.cpc || 0).toFixed(2)}</div>
                <div style={{ padding: "6px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{(gap.competition || 0).toFixed(2)}</div>
                <div style={{ padding: "6px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: (gap.rankGroup || 99) <= 10 ? COLORS.green : COLORS.amber }}>{gap.rankGroup || "—"}</div>
                <div style={{ padding: "6px 8px", color: COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gap.competitorDomain}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
