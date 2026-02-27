import React from "react";
import { COLORS } from "../../constants";
import { Sparkline } from "../ui";
import type { StripeMetrics, StripeAttribution, StripeTimelinePoint } from "../../services/stripe";
import { DollarSign, Loader2, CheckCircle2, RefreshCw, Activity, Users, BarChart3, Target, Zap } from "lucide-react";

export interface RevenuePanelProps {
  stripeConnected: boolean;
  stripeLoading: boolean;
  stripeMetrics: StripeMetrics | null;
  stripeAttribution: StripeAttribution[];
  stripeTimeline: StripeTimelinePoint[];
  handleStripeRefresh: () => void;
}

export default function RevenuePanel({
  stripeConnected,
  stripeLoading,
  stripeMetrics,
  stripeAttribution,
  stripeTimeline,
  handleStripeRefresh,
}: RevenuePanelProps) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {/* Connection Status */}
      {!stripeConnected && !stripeLoading && (
        <div style={{
          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 24,
          textAlign: "center" as const, marginBottom: 16,
        }}>
          <DollarSign size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Connect Stripe</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            Set STRIPE_SECRET_KEY in your .env to see real MRR, LTV, and attribution data.
            Currently using estimated ACV of \u00a31,494 for ROAS calculations.
          </div>
          <button
            onClick={handleStripeRefresh}
            style={{
              height: 34, padding: "0 16px", borderRadius: 8,
              border: `1px solid ${COLORS.accent}`, background: COLORS.accentDim,
              color: COLORS.accent, cursor: "pointer", fontWeight: 600, fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Check Connection
          </button>
        </div>
      )}

      {stripeLoading && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: 40, color: COLORS.textMuted,
        }}>
          <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13 }}>Loading Stripe data...</span>
        </div>
      )}

      {stripeConnected && stripeMetrics && !stripeLoading && (() => {
        const m = stripeMetrics;
        const currSymbol = m.currency === "GBP" ? "\u00a3" : m.currency === "USD" ? "$" : m.currency === "EUR" ? "\u20ac" : m.currency + " ";

        const labelStyle: React.CSSProperties = { fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" };
        const bigNumStyle: React.CSSProperties = { fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" };
        const cardStyle: React.CSSProperties = { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 };

        return (
          <>
            {/* Refresh Button */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <CheckCircle2 size={14} color={COLORS.green} />
              <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>Stripe Connected</span>
              <div style={{ flex: 1 }} />
              <button
                onClick={handleStripeRefresh}
                style={{
                  height: 28, padding: "0 10px", borderRadius: 6,
                  border: `1px solid ${COLORS.border}`, background: "transparent",
                  color: COLORS.textMuted, cursor: "pointer", fontSize: 11,
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {/* MRR & Key Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "MRR", value: `${currSymbol}${m.mrr.toLocaleString()}`, color: COLORS.accent },
                { label: "ARR", value: `${currSymbol}${m.arr.toLocaleString()}`, color: COLORS.text },
                { label: "Active Subs", value: m.activeSubscriptions.toLocaleString(), color: COLORS.green },
                { label: "ARPU", value: `${currSymbol}${m.avgRevenuePerUser.toFixed(0)}/mo`, color: COLORS.accent },
                { label: "LTV", value: `${currSymbol}${m.ltv.toLocaleString()}`, color: COLORS.green },
                { label: "Churn Rate", value: `${m.churnRate.toFixed(1)}%`, color: m.churnRate < 3 ? COLORS.green : m.churnRate < 7 ? COLORS.amber : COLORS.red },
              ].map((metric, i) => (
                <div key={i} style={cardStyle}>
                  <div style={labelStyle}>{metric.label}</div>
                  <div style={{ ...bigNumStyle, color: metric.color, marginTop: 4 }}>{metric.value}</div>
                </div>
              ))}
            </div>

            {/* MRR Movement */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Activity size={14} color={COLORS.accent} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>MRR Movement (This Month)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: "New MRR", value: `+${currSymbol}${m.newMrrThisMonth.toFixed(0)}`, color: COLORS.green },
                  { label: "Expansion", value: `+${currSymbol}${m.expansionMrr.toFixed(0)}`, color: COLORS.accent },
                  { label: "Churned", value: `-${currSymbol}${m.churnedMrr.toFixed(0)}`, color: COLORS.red },
                  { label: "Net New", value: `${m.netNewMrr >= 0 ? "+" : ""}${currSymbol}${m.netNewMrr.toFixed(0)}`, color: m.netNewMrr >= 0 ? COLORS.green : COLORS.red },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trial Pipeline */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Users size={14} color={COLORS.accent} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Trial Pipeline</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ padding: "12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
                  <div style={labelStyle}>Active Trials</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent, marginTop: 6 }}>{m.trialCount}</div>
                </div>
                <div style={{ padding: "12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
                  <div style={labelStyle}>Trial → Paid Rate</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: m.trialConversionRate > 20 ? COLORS.green : COLORS.amber, marginTop: 6 }}>{m.trialConversionRate.toFixed(1)}%</div>
                </div>
                <div style={{ padding: "12px", background: COLORS.greenDim, borderRadius: 8, border: `1px solid ${COLORS.green}20` }}>
                  <div style={labelStyle}>Expected MRR from Trials</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.green, marginTop: 6 }}>
                    {currSymbol}{Math.round(m.trialCount * (m.trialConversionRate / 100) * m.avgRevenuePerUser).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* MRR Timeline Chart */}
            {stripeTimeline.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <BarChart3 size={14} color={COLORS.accent} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>MRR Timeline (12 Months)</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
                  {stripeTimeline.map((point, i) => {
                    const maxMrr = Math.max(...stripeTimeline.map(p => p.mrr), 1);
                    const barHeight = Math.max(4, (point.mrr / maxMrr) * 100);
                    const isLast = i === stripeTimeline.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: COLORS.textMuted }}>
                          {currSymbol}{point.mrr >= 1000 ? `${(point.mrr / 1000).toFixed(1)}k` : point.mrr.toFixed(0)}
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

            {/* UTM Attribution Table */}
            {stripeAttribution.length > 0 && (
              <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <Target size={14} color={COLORS.accent} />
                  Keyword → Revenue Attribution
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      {["Keyword", "Source", "Customers", "Revenue", "Avg Deal"].map(h => (
                        <th key={h} style={{
                          padding: "10px 8px", textAlign: h === "Keyword" || h === "Source" ? "left" as const : "right" as const,
                          color: COLORS.textMuted, fontWeight: 500, fontSize: 10,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stripeAttribution.slice(0, 20).map((attr, i) => (
                      <tr key={i}
                        style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }}
                        onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.background = COLORS.bgHover}
                        onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "8px", fontWeight: 500, fontSize: 11, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attr.keyword}</td>
                        <td style={{ padding: "8px", fontSize: 11 }}>
                          <span style={{
                            fontSize: 10, padding: "2px 6px", borderRadius: 4,
                            background: attr.source === "google" ? COLORS.accentDim : attr.source === "bing" ? COLORS.purpleDim : COLORS.bgCard,
                            color: attr.source === "google" ? COLORS.accent : attr.source === "bing" ? COLORS.purple : COLORS.textSecondary,
                            fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {attr.source}/{attr.medium}
                          </span>
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>{attr.customers}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.green }}>{currSymbol}{attr.totalRevenue.toLocaleString()}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{currSymbol}{attr.avgDealSize.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ROAS Calculator with Real Data */}
            <div style={{ ...cardStyle }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Zap size={14} color={COLORS.accent} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>True ROAS (Stripe-Verified)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <div style={{ padding: "12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
                  <div style={labelStyle}>Real ACV (ARPU × 12)</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent, marginTop: 6 }}>
                    {currSymbol}{(m.avgRevenuePerUser * 12).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    vs est. \u00a31,494
                  </div>
                </div>
                <div style={{ padding: "12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
                  <div style={labelStyle}>Revenue per Customer</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.green, marginTop: 6 }}>
                    {currSymbol}{m.ltv.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    lifetime value
                  </div>
                </div>
                <div style={{ padding: "12px", background: COLORS.greenDim, borderRadius: 8, border: `1px solid ${COLORS.green}20` }}>
                  <div style={labelStyle}>LTV-Based ROAS</div>
                  {(() => {
                    const totalAttrRevenue = stripeAttribution.reduce((a, b) => a + b.totalRevenue, 0);
                    const totalAttrCustomers = stripeAttribution.reduce((a, b) => a + b.customers, 0);
                    const avgCpcAll = 4.0;
                    const estimatedAdSpend = totalAttrCustomers * avgCpcAll * 20;
                    const ltvRoas = estimatedAdSpend > 0 ? (totalAttrRevenue / estimatedAdSpend) : 0;
                    return (
                      <>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: ltvRoas >= 3 ? COLORS.green : ltvRoas >= 1 ? COLORS.amber : COLORS.red, marginTop: 6 }}>
                          {ltvRoas.toFixed(1)}x
                        </div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                          {totalAttrCustomers} attributed customers
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
