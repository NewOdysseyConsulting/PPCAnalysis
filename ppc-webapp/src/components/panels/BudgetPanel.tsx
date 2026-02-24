import React from "react";
import { COLORS } from "../../constants";
import type { StripeMetrics } from "../../services/stripe";
import { DollarSign, MousePointerClick, Eye, Target, TrendingUp, Zap, Activity, ArrowRight, Globe, Hash, BarChart3, CheckCircle2, Info } from "lucide-react";

export interface BudgetPanelProps {
  mergedKeywords: any[];
  selectedKeywords: Set<any>;
  budgetMonthly: number;
  setBudgetMonthly: (v: number) => void;
  budgetCtrOverride: number | null;
  setBudgetCtrOverride: (v: number | null) => void;
  budgetConvRateOverride: number | null;
  setBudgetConvRateOverride: (v: number | null) => void;
  budgetUseSelected: boolean;
  setBudgetUseSelected: React.Dispatch<React.SetStateAction<boolean>>;
  adjustedGA: any;
  market: any;
  hasBing: boolean;
  stripeMetrics: StripeMetrics | null;
  setPanelMode: (mode: string) => void;
}

export default function BudgetPanel({
  mergedKeywords,
  selectedKeywords,
  budgetMonthly,
  setBudgetMonthly,
  budgetCtrOverride,
  setBudgetCtrOverride,
  budgetConvRateOverride,
  setBudgetConvRateOverride,
  budgetUseSelected,
  setBudgetUseSelected,
  adjustedGA,
  market,
  hasBing,
  stripeMetrics,
  setPanelMode,
}: BudgetPanelProps) {
  const budgetKeywords = budgetUseSelected && selectedKeywords.size > 0
    ? mergedKeywords.filter((_: any, i: number) => selectedKeywords.has(i))
    : mergedKeywords;

  const avgKeywordCpc = budgetKeywords.length > 0
    ? budgetKeywords.reduce((a: number, k: any) => a + k.cpc, 0) / budgetKeywords.length
    : 0;

  const totalMonthlyVolume = budgetKeywords.reduce((a: number, k: any) => a + k.volume, 0);

  const paidSearchChannel = adjustedGA.channels.find((c: any) => c.channel === "Paid Search");
  const effectiveCtr = budgetCtrOverride ?? (paidSearchChannel ? (paidSearchChannel.bounceRate < 50 ? 3.5 : 2.5) : 3.5);
  const effectiveConvRate = budgetConvRateOverride ?? (paidSearchChannel?.convRate || 4.8);

  const estimatedClicks = avgKeywordCpc > 0 ? Math.round(budgetMonthly / avgKeywordCpc) : 0;
  const impressionsNeeded = effectiveCtr > 0 ? Math.round(estimatedClicks / (effectiveCtr / 100)) : 0;
  const estimatedConversions = Math.round(estimatedClicks * (effectiveConvRate / 100));

  const demoConvRate = 0.76;
  const trialConvRate = 0.46;
  const contactConvRate = 0.34;
  const estimatedDemos = Math.round(estimatedClicks * (demoConvRate / 100));
  const estimatedTrials = Math.round(estimatedClicks * (trialConvRate / 100));
  const estimatedContacts = Math.round(estimatedClicks * (contactConvRate / 100));

  const avgAcv = stripeMetrics ? stripeMetrics.avgRevenuePerUser * 12 : 1494;
  const estimatedRevenue = estimatedConversions * avgAcv;
  const roas = budgetMonthly > 0 ? (estimatedRevenue / budgetMonthly) : 0;
  const cpa = estimatedConversions > 0 ? budgetMonthly / estimatedConversions : 0;

  const avgBingCpc = hasBing && budgetKeywords.length > 0
    ? budgetKeywords.filter((k: any) => k.bingCpc > 0).reduce((a: number, k: any) => a + k.bingCpc, 0) / (budgetKeywords.filter((k: any) => k.bingCpc > 0).length || 1)
    : 0;
  const bingClicks = avgBingCpc > 0 ? Math.round(budgetMonthly * 0.15 / avgBingCpc) : 0;

  const scenarioBudgets = [500, 1000, 2000, 3000, 5000, 7500, 10000];

  const topKeywords = [...budgetKeywords]
    .sort((a: any, b: any) => (b.volume / (b.cpc || 1)) - (a.volume / (a.cpc || 1)))
    .slice(0, 10);

  const labelStyle: React.CSSProperties = { fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" };
  const bigNumStyle: React.CSSProperties = { fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" };
  const cardStyle: React.CSSProperties = { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {/* Budget Input Controls */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <DollarSign size={14} color={COLORS.accent} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Budget Configuration</span>
          <div style={{ flex: 1 }} />
          <span style={{ ...bigNumStyle, fontSize: 28, color: COLORS.accent }}>{market.currency}{budgetMonthly.toLocaleString()}</span>
          <span style={{ ...labelStyle, marginLeft: 4 }}>/mo</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="range" min={100} max={10000} step={50} value={budgetMonthly}
            onChange={e => setBudgetMonthly(Number(e.target.value))}
            style={{ width: "100%", accentColor: COLORS.accent, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", ...labelStyle, marginTop: 4 }}>
            <span>{market.currency}100</span>
            <span>{market.currency}10,000</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={labelStyle}>Expected CTR %</span>
            <input
              type="number" step={0.1} min={0.1} max={20}
              placeholder={String(effectiveCtr)}
              value={budgetCtrOverride ?? ""}
              onChange={e => setBudgetCtrOverride(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: 80, height: 30, borderRadius: 6, border: `1px solid ${COLORS.border}`,
                background: COLORS.bgElevated, color: COLORS.text, padding: "0 8px",
                fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={labelStyle}>Conv Rate %</span>
            <input
              type="number" step={0.1} min={0.1} max={50}
              placeholder={String(effectiveConvRate)}
              value={budgetConvRateOverride ?? ""}
              onChange={e => setBudgetConvRateOverride(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: 80, height: 30, borderRadius: 6, border: `1px solid ${COLORS.border}`,
                background: COLORS.bgElevated, color: COLORS.text, padding: "0 8px",
                fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={labelStyle}>Keyword Set</span>
            <button
              onClick={() => setBudgetUseSelected(p => !p)}
              style={{
                height: 30, padding: "0 12px", borderRadius: 6,
                border: `1px solid ${budgetUseSelected ? COLORS.accent : COLORS.border}`,
                background: budgetUseSelected ? COLORS.accentDim : "transparent",
                color: budgetUseSelected ? COLORS.accent : COLORS.textMuted,
                cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {budgetUseSelected && selectedKeywords.size > 0 ? `Selected (${selectedKeywords.size})` : `All (${mergedKeywords.length})`}
            </button>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ ...labelStyle, fontSize: 9 }}>Avg CPC</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.amber }}>{market.currency}{avgKeywordCpc.toFixed(2)}</span>
            <span style={{ ...labelStyle, fontSize: 9, marginLeft: 8 }}>Total Vol</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{totalMonthlyVolume.toLocaleString()}</span>
            <span style={{ ...labelStyle, fontSize: 9, marginLeft: 8 }}>ACV</span>
            <span style={{
              fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              color: stripeMetrics ? COLORS.green : COLORS.textSecondary,
            }}>
              {market.currency}{Math.round(avgAcv).toLocaleString()}
            </span>
            {stripeMetrics ? (
              <span style={{
                fontSize: 9, padding: "2px 5px", borderRadius: 3,
                background: COLORS.greenDim, color: COLORS.green,
                fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.04em",
              }}>STRIPE</span>
            ) : (
              <span style={{
                fontSize: 9, padding: "2px 5px", borderRadius: 3,
                background: COLORS.bgCard, color: COLORS.textMuted,
                fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.04em",
              }}>EST</span>
            )}
          </div>
        </div>
      </div>

      {/* ACV Source Banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px",
        borderRadius: 8, fontSize: 11, fontFamily: "'DM Sans', sans-serif",
        background: stripeMetrics ? COLORS.greenDim : COLORS.amberDim,
        border: `1px solid ${stripeMetrics ? COLORS.green : COLORS.amber}20`,
        color: stripeMetrics ? COLORS.green : COLORS.amber,
      }}>
        {stripeMetrics ? <CheckCircle2 size={13} /> : <Info size={13} />}
        <span style={{ fontWeight: 600 }}>
          {stripeMetrics
            ? `Revenue projections use real Stripe ARPU (${market.currency}${stripeMetrics.avgRevenuePerUser.toFixed(0)}/mo = ${market.currency}${Math.round(stripeMetrics.avgRevenuePerUser * 12).toLocaleString()} ACV)`
            : `Revenue projections use estimated ACV of ${market.currency}1,494 (midpoint of ${market.currency}588\u2013${market.currency}2,400). Connect Stripe for real data.`
          }
        </span>
        {!stripeMetrics && (
          <button
            onClick={() => { setPanelMode("revenue"); }}
            style={{
              marginLeft: "auto", padding: "3px 8px", borderRadius: 4, fontSize: 10,
              border: `1px solid ${COLORS.amber}`, background: "transparent",
              color: COLORS.amber, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap",
            }}
          >
            Connect Stripe
          </button>
        )}
      </div>

      {/* Main Projections Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Monthly Clicks", value: estimatedClicks.toLocaleString(), icon: MousePointerClick, color: COLORS.accent },
          { label: "Impressions", value: impressionsNeeded.toLocaleString(), icon: Eye, color: COLORS.text },
          { label: "Conversions", value: estimatedConversions.toLocaleString(), icon: Target, color: COLORS.green },
          { label: "CPA", value: `${market.currency}${cpa.toFixed(2)}`, icon: DollarSign, color: cpa > 0 && cpa < 100 ? COLORS.green : cpa < 200 ? COLORS.amber : COLORS.red },
          { label: stripeMetrics ? "Annual Revenue (Stripe)" : "Est. Annual Revenue", value: `${market.currency}${(estimatedRevenue).toLocaleString()}`, icon: TrendingUp, color: stripeMetrics ? COLORS.green : COLORS.accent },
          { label: stripeMetrics ? "ROAS (Stripe ACV)" : "ROAS (Estimated)", value: `${roas.toFixed(1)}x`, icon: Zap, color: roas >= 3 ? COLORS.green : roas >= 1 ? COLORS.amber : COLORS.red },
        ].map((m, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <m.icon size={13} color={COLORS.textMuted} />
              <span style={labelStyle}>{m.label}</span>
            </div>
            <div style={{ ...bigNumStyle, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Activity size={14} color={COLORS.accent} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Conversion Funnel</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", padding: "10px 16px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
            <div style={labelStyle}>Impressions</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{impressionsNeeded.toLocaleString()}</div>
          </div>
          <ArrowRight size={16} color={COLORS.textMuted} />
          <div style={{ textAlign: "center", padding: "10px 16px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
            <div style={labelStyle}>Clicks ({effectiveCtr}%)</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent, marginTop: 4 }}>{estimatedClicks.toLocaleString()}</div>
          </div>
          <ArrowRight size={16} color={COLORS.textMuted} />
          <div style={{ textAlign: "center", padding: "10px 16px", background: COLORS.greenDim, borderRadius: 8, border: `1px solid ${COLORS.green}20` }}>
            <div style={labelStyle}>Conversions ({effectiveConvRate}%)</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.green, marginTop: 4 }}>{estimatedConversions.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8 }}>Breakdown by GA Goal</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { goal: "Demo Requests", count: estimatedDemos, rate: demoConvRate, color: COLORS.green },
            { goal: "Free Trial Signups", count: estimatedTrials, rate: trialConvRate, color: COLORS.accent },
            { goal: "Contact Form", count: estimatedContacts, rate: contactConvRate, color: COLORS.amber },
          ].map((g, i) => (
            <div key={i} style={{ padding: "10px 12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{g.goal}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: g.color }}>{g.count}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{g.rate}% of clicks</div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Scenarios Table */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={14} color={COLORS.accent} />
          Budget Scenarios
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {["Budget", "Clicks", "Conversions", "CPA", stripeMetrics ? "Revenue \u2713" : "Revenue ~", "ROAS"].map(h => (
                <th key={h} style={{
                  padding: "10px 8px", textAlign: h === "Budget" ? "left" : "right",
                  color: COLORS.textMuted, fontWeight: 500, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarioBudgets.map(b => {
              const sClicks = avgKeywordCpc > 0 ? Math.round(b / avgKeywordCpc) : 0;
              const sConv = Math.round(sClicks * (effectiveConvRate / 100));
              const sCpa = sConv > 0 ? b / sConv : 0;
              const sRev = sConv * avgAcv;
              const sRoas = b > 0 ? sRev / b : 0;
              const isActive = b === budgetMonthly;
              return (
                <tr
                  key={b}
                  onClick={() => setBudgetMonthly(b)}
                  style={{
                    borderBottom: `1px solid ${COLORS.borderSubtle}`,
                    background: isActive ? COLORS.accentDim : "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = COLORS.bgHover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "8px", fontWeight: isActive ? 700 : 500, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: isActive ? COLORS.accent : COLORS.text }}>
                    {market.currency}{b.toLocaleString()}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{sClicks.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.green }}>{sConv}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{market.currency}{sCpa.toFixed(2)}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>{market.currency}{sRev.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: sRoas >= 3 ? COLORS.green : sRoas >= 1 ? COLORS.amber : COLORS.red }}>{sRoas.toFixed(1)}x</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bing Comparison (if available) */}
      {hasBing && avgBingCpc > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Globe size={14} color={COLORS.accent} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Google vs Bing Comparison</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ padding: "12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
              <div style={labelStyle}>Google (85% budget)</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent, marginTop: 6 }}>{estimatedClicks.toLocaleString()} clicks</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>at {market.currency}{avgKeywordCpc.toFixed(2)} CPC</div>
            </div>
            <div style={{ padding: "12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
              <div style={labelStyle}>Bing (15% budget)</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.purple, marginTop: 6 }}>{bingClicks.toLocaleString()} clicks</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>at {market.currency}{avgBingCpc.toFixed(2)} CPC</div>
            </div>
            <div style={{ padding: "12px", background: COLORS.greenDim, borderRadius: 8, border: `1px solid ${COLORS.green}20` }}>
              <div style={labelStyle}>Combined</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.green, marginTop: 6 }}>{(estimatedClicks + bingClicks).toLocaleString()} clicks</div>
              <div style={{ fontSize: 11, color: COLORS.green, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginTop: 4 }}>+{Math.round(bingClicks / (estimatedClicks || 1) * 100)}% more for 15% budget</div>
            </div>
          </div>
        </div>
      )}

      {/* Keyword-Level Breakdown */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Hash size={14} color={COLORS.accent} />
          Top Keywords by Opportunity
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {["Keyword", "Volume", "CPC", "Est. Clicks", "Est. Cost", "Est. Conv"].map(h => (
                <th key={h} style={{
                  padding: "10px 8px", textAlign: h === "Keyword" ? "left" : "right",
                  color: COLORS.textMuted, fontWeight: 500, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topKeywords.map((kw: any, i: number) => {
              const kwShare = totalMonthlyVolume > 0 ? kw.volume / totalMonthlyVolume : 0;
              const kwBudget = budgetMonthly * kwShare;
              const kwClicks = kw.cpc > 0 ? Math.round(kwBudget / kw.cpc) : 0;
              const kwConv = Math.round(kwClicks * (effectiveConvRate / 100));
              return (
                <tr key={i}
                  style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "8px", fontWeight: 500, fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw.keyword}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{kw.volume.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.amber }}>{market.currency}{kw.cpc.toFixed(2)}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>{kwClicks.toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{market.currency}{kwBudget.toFixed(0)}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.green }}>{kwConv}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
