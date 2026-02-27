import React, { useState, useMemo } from "react";
import { COLORS } from "../../constants";
import {
  DollarSign,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  Target,
  MousePointerClick,
  Eye,
  Sparkles,
} from "lucide-react";

// ── Local type definitions (canonical types will live in types/index.ts) ──

type SearchChannel = "google-ads" | "bing-ads";

interface ChannelConfig {
  channel: SearchChannel;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  budgetPercent: number;
  budgetAbsolute: number;
  estimatedCtr: number;
  estimatedConvRate: number;
  estimatedCpc: number;
  notes: string;
}

interface ChannelProjection {
  channel: SearchChannel;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
  budget: number;
}

// ── Props ──

interface BudgetAllocatorPanelProps {
  totalBudget: number;
  setTotalBudget: (v: number) => void;
  channelConfigs: ChannelConfig[];
  setChannelConfigs: (configs: ChannelConfig[]) => void;
  market: any;
  stripeMetrics: any | null;
}

// ── Shared style constants ──

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: COLORS.textMuted,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: "'JetBrains Mono', monospace",
};

const bigNumStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  background: COLORS.bgCard,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: 16,
};

const numberInputStyle: React.CSSProperties = {
  width: 80,
  height: 30,
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.bgElevated,
  color: COLORS.text,
  padding: "0 8px",
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  outline: "none",
};

const thStyle: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "right",
  color: COLORS.textMuted,
  fontWeight: 500,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: "'JetBrains Mono', monospace",
};

// ── Helpers ──

function getChannelColor(ch: SearchChannel): string {
  return ch === "google-ads" ? COLORS.accent : COLORS.purple;
}

function computeProjection(
  config: ChannelConfig,
  budget: number,
  acv: number,
): ChannelProjection {
  const impressions =
    config.estimatedCpc > 0
      ? Math.round(budget / config.estimatedCpc / (config.estimatedCtr / 100))
      : 0;
  const clicks =
    config.estimatedCpc > 0
      ? Math.round(budget / config.estimatedCpc)
      : 0;
  const conversions = Math.round(clicks * (config.estimatedConvRate / 100));
  const cpa = conversions > 0 ? budget / conversions : 0;
  const revenue = conversions * acv;
  const roas = budget > 0 ? revenue / budget : 0;

  return {
    channel: config.channel,
    impressions,
    clicks,
    conversions,
    cpa,
    revenue,
    roas,
    budget,
  };
}

// ── Component ──

export default function BudgetAllocatorPanel({
  totalBudget,
  setTotalBudget,
  channelConfigs,
  setChannelConfigs,
  market,
  stripeMetrics,
}: BudgetAllocatorPanelProps) {
  const [expandedChannels, setExpandedChannels] = useState<Set<SearchChannel>>(
    new Set(),
  );
  const [isOptimizing, setIsOptimizing] = useState(false);

  const currency = market?.currency ?? "\u00a3";
  const acv = stripeMetrics?.avgRevenuePerUser
    ? stripeMetrics.avgRevenuePerUser * 12
    : 588;

  // ── Derived projections ──

  const projections = useMemo(() => {
    return channelConfigs
      .filter((c) => c.enabled)
      .map((c) => {
        const channelBudget = totalBudget * (c.budgetPercent / 100);
        return computeProjection(c, channelBudget, acv);
      });
  }, [channelConfigs, totalBudget, acv]);

  const totals = useMemo(() => {
    return projections.reduce(
      (acc, p) => ({
        budget: acc.budget + p.budget,
        impressions: acc.impressions + p.impressions,
        clicks: acc.clicks + p.clicks,
        conversions: acc.conversions + p.conversions,
        revenue: acc.revenue + p.revenue,
      }),
      { budget: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    );
  }, [projections]);

  const totalCpa =
    totals.conversions > 0 ? totals.budget / totals.conversions : 0;
  const totalRoas = totals.budget > 0 ? totals.revenue / totals.budget : 0;

  // ── Optimized mix: shift toward higher-ROAS channel by 15% ──

  const optimizedMix = useMemo(() => {
    const enabled = channelConfigs.filter((c) => c.enabled);
    if (enabled.length < 2) return null;

    const roasMap = new Map<SearchChannel, number>();
    for (const c of enabled) {
      const channelBudget = totalBudget * (c.budgetPercent / 100);
      const proj = computeProjection(c, channelBudget, acv);
      roasMap.set(c.channel, proj.roas);
    }

    const sorted = [...enabled].sort(
      (a, b) => (roasMap.get(b.channel) ?? 0) - (roasMap.get(a.channel) ?? 0),
    );
    const best = sorted[0];
    const other = sorted[1];

    const shift = 15;
    const bestNewPercent = Math.min(
      95,
      best.budgetPercent + shift,
    );
    const otherNewPercent = Math.max(5, other.budgetPercent - shift);

    const bestBudget = totalBudget * (bestNewPercent / 100);
    const otherBudget = totalBudget * (otherNewPercent / 100);
    const bestProj = computeProjection(best, bestBudget, acv);
    const otherProj = computeProjection(other, otherBudget, acv);

    return {
      channels: [
        { ...best, budgetPercent: bestNewPercent },
        { ...other, budgetPercent: otherNewPercent },
      ],
      projections: [bestProj, otherProj],
      totalRoas:
        bestBudget + otherBudget > 0
          ? (bestProj.revenue + otherProj.revenue) /
            (bestBudget + otherBudget)
          : 0,
    };
  }, [channelConfigs, totalBudget, acv]);

  // ── Handlers ──

  function updateChannel(
    channel: SearchChannel,
    update: Partial<ChannelConfig>,
  ) {
    setChannelConfigs(
      channelConfigs.map((c) =>
        c.channel === channel ? { ...c, ...update } : c,
      ),
    );
  }

  function handleToggleChannel(channel: SearchChannel) {
    const config = channelConfigs.find((c) => c.channel === channel);
    if (!config) return;

    const newEnabled = !config.enabled;
    const updated = channelConfigs.map((c) => {
      if (c.channel === channel) return { ...c, enabled: newEnabled };
      return c;
    });

    // If only one channel is now enabled, give it 100%
    const enabledCount = updated.filter((c) => c.enabled).length;
    if (enabledCount === 1) {
      const solo = updated.find((c) => c.enabled);
      if (solo) {
        setChannelConfigs(
          updated.map((c) =>
            c.channel === solo.channel
              ? { ...c, budgetPercent: 100, budgetAbsolute: totalBudget }
              : { ...c, budgetPercent: 0, budgetAbsolute: 0 },
          ),
        );
        return;
      }
    }

    // Normalize percentages among enabled channels
    const enabledChannels = updated.filter((c) => c.enabled);
    if (enabledChannels.length > 0) {
      const totalPct = enabledChannels.reduce(
        (s, c) => s + c.budgetPercent,
        0,
      );
      if (totalPct === 0) {
        const even = 100 / enabledChannels.length;
        setChannelConfigs(
          updated.map((c) =>
            c.enabled
              ? {
                  ...c,
                  budgetPercent: Math.round(even),
                  budgetAbsolute: Math.round(totalBudget * (even / 100)),
                }
              : { ...c, budgetPercent: 0, budgetAbsolute: 0 },
          ),
        );
        return;
      }
    }

    setChannelConfigs(updated);
  }

  function handlePercentChange(channel: SearchChannel, newPct: number) {
    const clamped = Math.max(0, Math.min(100, newPct));
    const other = channelConfigs.find(
      (c) => c.channel !== channel && c.enabled,
    );

    setChannelConfigs(
      channelConfigs.map((c) => {
        if (c.channel === channel) {
          return {
            ...c,
            budgetPercent: clamped,
            budgetAbsolute: Math.round(totalBudget * (clamped / 100)),
          };
        }
        if (other && c.channel === other.channel) {
          const remainder = 100 - clamped;
          return {
            ...c,
            budgetPercent: remainder,
            budgetAbsolute: Math.round(totalBudget * (remainder / 100)),
          };
        }
        return c;
      }),
    );
  }

  function toggleExpanded(channel: SearchChannel) {
    setExpandedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }

  async function handleOptimize() {
    if (!optimizedMix) return;
    setIsOptimizing(true);

    // Simulate a brief delay for the "optimize" action
    await new Promise((r) => setTimeout(r, 400));

    setChannelConfigs(
      channelConfigs.map((c) => {
        const opt = optimizedMix.channels.find(
          (o) => o.channel === c.channel,
        );
        if (opt) {
          return {
            ...c,
            budgetPercent: opt.budgetPercent,
            budgetAbsolute: Math.round(
              totalBudget * (opt.budgetPercent / 100),
            ),
          };
        }
        return c;
      }),
    );

    setIsOptimizing(false);
  }

  // ── Render ──

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {/* ── Section 1: Total Budget Input ── */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <DollarSign size={14} color={COLORS.accent} />
          <span
            style={{
              fontWeight: 600,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Total Monthly Budget
          </span>
          <div style={{ flex: 1 }} />
          <span
            style={{ ...bigNumStyle, fontSize: 28, color: COLORS.accent }}
          >
            {currency}
            {totalBudget.toLocaleString()}
          </span>
          <span style={{ ...labelStyle, marginLeft: 4 }}>/mo</span>
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            type="range"
            min={100}
            max={10000}
            step={50}
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            style={{
              width: "100%",
              accentColor: COLORS.accent,
              cursor: "pointer",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              ...labelStyle,
              marginTop: 4,
            }}
          >
            <span>{currency}100</span>
            <span>{currency}10,000</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }} />
          <span style={{ ...labelStyle, fontSize: 9 }}>ACV</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: stripeMetrics ? COLORS.green : COLORS.textSecondary,
            }}
          >
            {currency}
            {Math.round(acv).toLocaleString()}
          </span>
          {stripeMetrics ? (
            <span
              style={{
                fontSize: 9,
                padding: "2px 5px",
                borderRadius: 3,
                background: COLORS.greenDim,
                color: COLORS.green,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.04em",
              }}
            >
              STRIPE
            </span>
          ) : (
            <span
              style={{
                fontSize: 9,
                padding: "2px 5px",
                borderRadius: 3,
                background: COLORS.bgCard,
                color: COLORS.textMuted,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.04em",
              }}
            >
              EST
            </span>
          )}
          <span style={{ ...labelStyle, fontSize: 9, marginLeft: 8 }}>
            Market
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              color: COLORS.text,
            }}
          >
            {market?.name ?? "United Kingdom"}
          </span>
        </div>
      </div>

      {/* ── Section 2: Channel Allocation Grid ── */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <BarChart3 size={14} color={COLORS.accent} />
          <span
            style={{
              fontWeight: 600,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Channel Allocation
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {channelConfigs.map((config) => {
            const chColor = getChannelColor(config.channel);
            const channelBudget = Math.round(
              totalBudget * (config.budgetPercent / 100),
            );

            return (
              <div
                key={config.channel}
                style={{
                  padding: 14,
                  background: config.enabled
                    ? COLORS.bgElevated
                    : COLORS.bgCard,
                  borderRadius: 8,
                  border: `1px solid ${config.enabled ? chColor + "30" : COLORS.borderSubtle}`,
                  opacity: config.enabled ? 1 : 0.55,
                  transition: "opacity 0.15s, border-color 0.15s",
                }}
              >
                {/* Toggle + Label row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <button
                    onClick={() => handleToggleChannel(config.channel)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={`Toggle ${config.label}`}
                  >
                    {config.enabled ? (
                      <ToggleRight size={22} color={chColor} />
                    ) : (
                      <ToggleLeft size={22} color={COLORS.textMuted} />
                    )}
                  </button>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif",
                      color: config.enabled ? COLORS.text : COLORS.textMuted,
                    }}
                  >
                    {config.label}
                  </span>
                  <div style={{ flex: 1 }} />
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: config.enabled ? chColor : COLORS.textMuted,
                    }}
                  >
                    {config.budgetPercent}%
                  </span>
                </div>

                {/* Percentage slider */}
                {config.enabled && (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={config.budgetPercent}
                      onChange={(e) =>
                        handlePercentChange(
                          config.channel,
                          Number(e.target.value),
                        )
                      }
                      style={{
                        width: "100%",
                        accentColor: chColor,
                        cursor: "pointer",
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span style={labelStyle}>Budget</span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: chColor,
                        }}
                      >
                        {currency}
                        {channelBudget.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Per-Channel Config Cards (expandable) ── */}
      {channelConfigs
        .filter((c) => c.enabled)
        .map((config) => {
          const isExpanded = expandedChannels.has(config.channel);
          const chColor = getChannelColor(config.channel);

          return (
            <div
              key={`config-${config.channel}`}
              style={{ ...cardStyle, marginBottom: 12 }}
            >
              <button
                onClick={() => toggleExpanded(config.channel)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: chColor,
                  }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    color: COLORS.text,
                  }}
                >
                  {config.label} Configuration
                </span>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
                {isExpanded ? (
                  <ChevronUp size={14} color={COLORS.textMuted} />
                ) : (
                  <ChevronDown size={14} color={COLORS.textMuted} />
                )}
              </button>

              {isExpanded && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: `1px solid ${COLORS.borderSubtle}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span style={labelStyle}>Expected CTR %</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      max={20}
                      value={config.estimatedCtr}
                      onChange={(e) =>
                        updateChannel(config.channel, {
                          estimatedCtr: Number(e.target.value) || 0,
                        })
                      }
                      style={numberInputStyle}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span style={labelStyle}>Conv Rate %</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      max={50}
                      value={config.estimatedConvRate}
                      onChange={(e) =>
                        updateChannel(config.channel, {
                          estimatedConvRate: Number(e.target.value) || 0,
                        })
                      }
                      style={numberInputStyle}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span style={labelStyle}>Avg CPC ({currency})</span>
                    <input
                      type="number"
                      step={0.01}
                      min={0.01}
                      max={100}
                      value={config.estimatedCpc}
                      onChange={(e) =>
                        updateChannel(config.channel, {
                          estimatedCpc: Number(e.target.value) || 0,
                        })
                      }
                      style={numberInputStyle}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      flex: 1,
                      minWidth: 150,
                    }}
                  >
                    <span style={labelStyle}>Notes</span>
                    <input
                      type="text"
                      value={config.notes}
                      onChange={(e) =>
                        updateChannel(config.channel, {
                          notes: e.target.value,
                        })
                      }
                      placeholder="Optional notes..."
                      style={{
                        ...numberInputStyle,
                        width: "100%",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

      {/* ── Section 4: Projections Table ── */}
      <div
        style={{
          ...cardStyle,
          marginBottom: 16,
          marginTop: 16,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${COLORS.border}`,
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Target size={14} color={COLORS.accent} />
          Channel Projections
        </div>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {[
                "Channel",
                "Budget",
                "Impressions",
                "Clicks",
                "Conversions",
                "CPA",
                "Revenue",
                "ROAS",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    ...thStyle,
                    textAlign: h === "Channel" ? "left" : "right",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projections.map((p) => {
              const config = channelConfigs.find(
                (c) => c.channel === p.channel,
              );
              const chColor = getChannelColor(p.channel);
              return (
                <tr
                  key={p.channel}
                  style={{
                    borderBottom: `1px solid ${COLORS.borderSubtle}`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = COLORS.bgHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "10px 8px",
                      fontWeight: 600,
                      fontSize: 11,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: chColor,
                        }}
                      />
                      {config?.label ?? p.channel}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {currency}
                    {Math.round(p.budget).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                    }}
                  >
                    {p.impressions.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      color: COLORS.accent,
                    }}
                  >
                    {p.clicks.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      color: COLORS.green,
                    }}
                  >
                    {p.conversions.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                    }}
                  >
                    {currency}
                    {p.cpa.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      color: COLORS.accent,
                    }}
                  >
                    {currency}
                    {Math.round(p.revenue).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color:
                        p.roas >= 3
                          ? COLORS.green
                          : p.roas >= 1
                            ? COLORS.amber
                            : COLORS.red,
                    }}
                  >
                    {p.roas.toFixed(1)}x
                  </td>
                </tr>
              );
            })}

            {/* ── Section 5: Combined Totals Row ── */}
            {projections.length > 1 && (
              <tr
                style={{
                  borderTop: `2px solid ${COLORS.border}`,
                  background: COLORS.bgCard,
                }}
              >
                <td
                  style={{
                    padding: "10px 8px",
                    fontWeight: 700,
                    fontSize: 11,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Combined Total
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {currency}
                  {Math.round(totals.budget).toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {totals.impressions.toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.accent,
                  }}
                >
                  {totals.clicks.toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.green,
                  }}
                >
                  {totals.conversions.toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {currency}
                  {totalCpa.toFixed(2)}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.accent,
                  }}
                >
                  {currency}
                  {Math.round(totals.revenue).toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      totalRoas >= 3
                        ? COLORS.green
                        : totalRoas >= 1
                          ? COLORS.amber
                          : COLORS.red,
                  }}
                >
                  {totalRoas.toFixed(1)}x
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Section 6: Channel Mix Optimizer ── */}
      {optimizedMix && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <Sparkles size={14} color={COLORS.accent} />
            <span
              style={{
                fontWeight: 600,
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Channel Mix Optimizer
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: `1px solid ${COLORS.accent}`,
                background: COLORS.accentDim,
                color: COLORS.accent,
                cursor: isOptimizing ? "wait" : "pointer",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                opacity: isOptimizing ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Zap size={12} />
              {isOptimizing ? "Optimizing..." : "Apply Optimized Mix"}
            </button>
          </div>

          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
            Budget is shifted toward the higher-ROAS channel by up to 15% to maximize returns.
          </div>

          {/* Current Mix Bar */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ ...labelStyle, fontSize: 9 }}>Current Mix</span>
              <span
                style={{
                  ...labelStyle,
                  fontSize: 9,
                  color: COLORS.textSecondary,
                }}
              >
                ROAS {totalRoas.toFixed(1)}x
              </span>
            </div>
            <div
              style={{
                display: "flex",
                height: 28,
                borderRadius: 6,
                overflow: "hidden",
                border: `1px solid ${COLORS.borderSubtle}`,
              }}
            >
              {channelConfigs
                .filter((c) => c.enabled && c.budgetPercent > 0)
                .map((c) => (
                  <div
                    key={`cur-${c.channel}`}
                    style={{
                      width: `${c.budgetPercent}%`,
                      background:
                        getChannelColor(c.channel) + "25",
                      borderRight: `1px solid ${COLORS.bgElevated}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 40,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: getChannelColor(c.channel),
                      }}
                    >
                      {c.label.split(" ")[0]} {c.budgetPercent}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Optimized Mix Bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ ...labelStyle, fontSize: 9 }}>
                Optimized Mix
              </span>
              <span
                style={{
                  ...labelStyle,
                  fontSize: 9,
                  color: COLORS.green,
                }}
              >
                ROAS {optimizedMix.totalRoas.toFixed(1)}x
              </span>
            </div>
            <div
              style={{
                display: "flex",
                height: 28,
                borderRadius: 6,
                overflow: "hidden",
                border: `1px solid ${COLORS.green}30`,
                background: COLORS.greenDim,
              }}
            >
              {optimizedMix.channels
                .filter((c) => c.budgetPercent > 0)
                .map((c) => (
                  <div
                    key={`opt-${c.channel}`}
                    style={{
                      width: `${c.budgetPercent}%`,
                      background:
                        getChannelColor(c.channel) + "30",
                      borderRight: `1px solid ${COLORS.bgElevated}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 40,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: getChannelColor(c.channel),
                      }}
                    >
                      {c.label.split(" ")[0]} {c.budgetPercent}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Projected improvement summary */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 14,
              paddingTop: 12,
              borderTop: `1px solid ${COLORS.borderSubtle}`,
              flexWrap: "wrap",
            }}
          >
            {(() => {
              const optRevenue = optimizedMix.projections.reduce(
                (s, p) => s + p.revenue,
                0,
              );
              const curRevenue = totals.revenue;
              const delta = optRevenue - curRevenue;
              const deltaPct =
                curRevenue > 0 ? (delta / curRevenue) * 100 : 0;
              return (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <TrendingUp size={13} color={COLORS.green} />
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "'DM Sans', sans-serif",
                        color: COLORS.textSecondary,
                      }}
                    >
                      Projected revenue change:
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: delta >= 0 ? COLORS.green : COLORS.red,
                      }}
                    >
                      {delta >= 0 ? "+" : ""}
                      {currency}
                      {Math.round(Math.abs(delta)).toLocaleString()} (
                      {deltaPct >= 0 ? "+" : ""}
                      {deltaPct.toFixed(1)}%)
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Quick Metrics Summary ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: "Total Clicks",
            value: totals.clicks.toLocaleString(),
            icon: MousePointerClick,
            color: COLORS.accent,
          },
          {
            label: "Impressions",
            value: totals.impressions.toLocaleString(),
            icon: Eye,
            color: COLORS.text,
          },
          {
            label: "Conversions",
            value: totals.conversions.toLocaleString(),
            icon: Target,
            color: COLORS.green,
          },
          {
            label: "Blended ROAS",
            value: `${totalRoas.toFixed(1)}x`,
            icon: Zap,
            color:
              totalRoas >= 3
                ? COLORS.green
                : totalRoas >= 1
                  ? COLORS.amber
                  : COLORS.red,
          },
        ].map((m, i) => (
          <div key={i} style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <m.icon size={13} color={COLORS.textMuted} />
              <span style={labelStyle}>{m.label}</span>
            </div>
            <div style={{ ...bigNumStyle, fontSize: 20, color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
