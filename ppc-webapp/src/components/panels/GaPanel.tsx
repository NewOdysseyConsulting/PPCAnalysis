import React from "react";
import { COLORS } from "../../constants";
import { Sparkline, MetricChip } from "../ui";
import { Users, Activity, TrendingDown, TrendingUp, Clock, Layers, Target, Globe } from "lucide-react";

export interface GaPanelProps {
  adjustedGA: any;
}

export default function GaPanel({ adjustedGA }: GaPanelProps) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {/* GA Overview */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap",
      }}>
        <MetricChip icon={Users} label="Users" value={adjustedGA.overview.users.toLocaleString()} color={COLORS.accent} />
        <MetricChip icon={Activity} label="Sessions" value={adjustedGA.overview.sessions.toLocaleString()} />
        <MetricChip icon={TrendingDown} label="Bounce" value="42.3%" color={COLORS.amber} />
        <MetricChip icon={Clock} label="Avg Duration" value="3:24" />
      </div>

      {/* Mini Trend Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
            Users (Last 12 Weeks)
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent, marginBottom: 8 }}>
            {adjustedGA.overview.users.toLocaleString()}
          </div>
          <Sparkline data={adjustedGA.overview.usersTrend} color={COLORS.accent} width={200} height={40} />
          <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <TrendingUp size={12} /> +22% vs prior period
          </div>
        </div>
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
            Sessions (Last 12 Weeks)
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
            {adjustedGA.overview.sessions.toLocaleString()}
          </div>
          <Sparkline data={adjustedGA.overview.sessionsTrend} color={COLORS.purple} width={200} height={40} />
          <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <TrendingUp size={12} /> +19% vs prior period
          </div>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div style={{
        background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
        borderRadius: 10, marginBottom: 16, overflow: "hidden",
      }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={14} color={COLORS.accent} />
          Channel Performance
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {[
                { label: "Channel", align: "left", width: "auto" },
                { label: "Users", align: "right", width: 70 },
                { label: "Sessions", align: "right", width: 80 },
                { label: "Bounce", align: "right", width: 65 },
                { label: "Conv %", align: "right", width: 60 },
                { label: "Revenue", align: "right", width: 80 },
              ].map(col => (
                <th key={col.label} style={{
                  padding: "10px 8px", textAlign: col.align as React.CSSProperties["textAlign"], width: col.width,
                  color: COLORS.textMuted, fontWeight: 500, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adjustedGA.channels.map((ch: any, i: number) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "8px", fontWeight: 500, fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color }} />
                    {ch.channel}
                  </div>
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>
                  {ch.users.toLocaleString()}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {ch.sessions.toLocaleString()}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: ch.bounceRate < 40 ? COLORS.green : ch.bounceRate < 50 ? COLORS.amber : COLORS.red }}>
                  {ch.bounceRate}%
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: ch.convRate >= 4 ? COLORS.green : ch.convRate >= 2 ? COLORS.amber : COLORS.textSecondary }}>
                  {ch.convRate}%
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>
                  {ch.revenue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Conversions */}
      <div style={{
        background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
        borderRadius: 10, marginBottom: 16, overflow: "hidden",
      }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={14} color={COLORS.green} />
          Conversions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
          {adjustedGA.conversions.map((conv: any, i: number) => (
            <div key={i} style={{
              padding: 16, borderRight: i % 2 === 0 ? `1px solid ${COLORS.borderSubtle}` : "none",
              borderBottom: i < 2 ? `1px solid ${COLORS.borderSubtle}` : "none",
            }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{conv.goal}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>
                {conv.completions.toLocaleString()}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                  Rate: <span style={{ color: COLORS.accent, fontWeight: 600 }}>{conv.convRate}%</span>
                </span>
                <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                  Value: <span style={{ color: COLORS.amber, fontWeight: 600 }}>{conv.value}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Pages */}
      <div style={{
        background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
        borderRadius: 10, overflow: "hidden",
      }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Globe size={14} color={COLORS.accent} />
          Top Pages
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {[
                { label: "Page", align: "left", width: "auto" },
                { label: "Views", align: "right", width: 65 },
                { label: "Unique", align: "right", width: 65 },
                { label: "Avg Time", align: "right", width: 70 },
                { label: "Bounce", align: "right", width: 60 },
                { label: "Exit %", align: "right", width: 55 },
              ].map(col => (
                <th key={col.label} style={{
                  padding: "10px 8px", textAlign: col.align as React.CSSProperties["textAlign"], width: col.width,
                  color: COLORS.textMuted, fontWeight: 500, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adjustedGA.topPages.map((page: any, i: number) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSubtle}` }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "8px", fontWeight: 500, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent }}>{page.page}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>
                  {page.pageviews.toLocaleString()}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {page.uniquePageviews.toLocaleString()}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {page.avgTimeOnPage}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: page.bounceRate < 30 ? COLORS.green : page.bounceRate < 45 ? COLORS.amber : COLORS.red }}>
                  {page.bounceRate}%
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: page.exitRate < 25 ? COLORS.green : page.exitRate < 40 ? COLORS.amber : COLORS.red }}>
                  {page.exitRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
