import React from "react";
import { COLORS } from "../../constants";
import {
  Briefcase,
  DollarSign,
  Hash,
  TrendingUp,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Search,
  Megaphone,
  PieChart,
  Users,
  Zap,
  Package,
  BarChart3,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  description: string;
  acv: string;
  target: string;
}

interface ChannelConfig {
  channel: string;
  enabled: boolean;
  budgetPercent: number;
  estimatedCtr: number;
  estimatedConvRate: number;
  estimatedCpc: number;
}

interface ProductPortfolioData {
  keywords: any[];
  campaigns: any[];
  channelConfigs: ChannelConfig[];
  icpProfiles: any[];
  buyerPersonas: any[];
  budgetMonthly: number;
}

interface PortfolioPanelProps {
  products: Product[];
  activeProductId: string;
  setActiveProductId: (id: string) => void;
  portfolioData: Record<string, ProductPortfolioData>;
  market: any;
  setPanelMode: (mode: string) => void;
  setPanelOpen: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Derived per-product metrics
// ---------------------------------------------------------------------------

interface ProductMetrics {
  product: Product;
  budget: number;
  keywordsCount: number;
  campaignsCount: number;
  avgCpc: number;
  avgCtr: number;
  avgConvRate: number;
  clicks: number;
  conversions: number;
  acv: number;
  revenue: number;
  roas: number;
  status: "active" | "draft" | "empty";
}

type SortKey =
  | "name"
  | "budget"
  | "keywords"
  | "campaigns"
  | "clicks"
  | "conversions"
  | "revenue"
  | "roas";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseAcv(acvString: string): number {
  const cleaned = acvString.replace(/[^0-9.,]/g, " ");
  const match = cleaned.match(/[\d,]+(\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, ""));
}

function computeWeightedChannelMetrics(configs: ChannelConfig[]) {
  const enabled = configs.filter((c) => c.enabled && c.budgetPercent > 0);
  if (enabled.length === 0) {
    return { avgCpc: 0, avgCtr: 0, avgConvRate: 0 };
  }
  const totalWeight = enabled.reduce((s, c) => s + c.budgetPercent, 0);
  if (totalWeight === 0) {
    return { avgCpc: 0, avgCtr: 0, avgConvRate: 0 };
  }
  const avgCpc =
    enabled.reduce((s, c) => s + c.estimatedCpc * c.budgetPercent, 0) /
    totalWeight;
  const avgCtr =
    enabled.reduce((s, c) => s + c.estimatedCtr * c.budgetPercent, 0) /
    totalWeight;
  const avgConvRate =
    enabled.reduce((s, c) => s + c.estimatedConvRate * c.budgetPercent, 0) /
    totalWeight;
  return { avgCpc, avgCtr, avgConvRate };
}

function computeProductMetrics(
  product: Product,
  data: ProductPortfolioData | undefined
): ProductMetrics {
  if (!data) {
    return {
      product,
      budget: 0,
      keywordsCount: 0,
      campaignsCount: 0,
      avgCpc: 0,
      avgCtr: 0,
      avgConvRate: 0,
      clicks: 0,
      conversions: 0,
      acv: parseAcv(product.acv),
      revenue: 0,
      roas: 0,
      status: "empty",
    };
  }

  const { avgCpc, avgCtr, avgConvRate } = computeWeightedChannelMetrics(
    data.channelConfigs
  );
  const clicks = avgCpc > 0 ? data.budgetMonthly / avgCpc : 0;
  const conversions = clicks * (avgConvRate / 100);
  const acv = parseAcv(product.acv);
  const revenue = conversions * acv;
  const roas = data.budgetMonthly > 0 ? revenue / data.budgetMonthly : 0;

  let status: "active" | "draft" | "empty" = "empty";
  if (data.campaigns.length > 0) {
    const hasActive = data.campaigns.some(
      (c: any) => c.status === "active" || c.status === "Active"
    );
    status = hasActive ? "active" : "draft";
  } else if (data.keywords.length > 0 || data.budgetMonthly > 0) {
    status = "draft";
  }

  return {
    product,
    budget: data.budgetMonthly,
    keywordsCount: data.keywords.length,
    campaignsCount: data.campaigns.length,
    avgCpc,
    avgCtr,
    avgConvRate,
    clicks,
    conversions,
    acv,
    revenue,
    roas,
    status,
  };
}

function formatCurrency(value: number, symbol: string): string {
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(1)}k`;
  return `${symbol}${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return Math.round(value).toLocaleString();
}

// Cycle through colors for chart bars
const BAR_COLORS = [
  COLORS.accent,
  COLORS.purple,
  COLORS.amber,
  COLORS.green,
  COLORS.red,
];

function getBarColor(index: number): string {
  return BAR_COLORS[index % BAR_COLORS.length];
}

function getBarDimColor(index: number): string {
  const dimColors = [
    COLORS.accentDim,
    COLORS.purpleDim,
    COLORS.amberDim,
    COLORS.greenDim,
    COLORS.redDim,
  ];
  return dimColors[index % dimColors.length];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PortfolioPanel({
  products,
  activeProductId,
  setActiveProductId,
  portfolioData,
  market,
  setPanelMode,
  setPanelOpen,
}: PortfolioPanelProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("roas");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const currency = market?.currency ?? "$";

  // Compute metrics for every product
  const allMetrics: ProductMetrics[] = products.map((p) =>
    computeProductMetrics(p, portfolioData[p.id])
  );

  // Sorted copy
  const sortedMetrics = [...allMetrics].sort((a, b) => {
    let av: number | string = 0;
    let bv: number | string = 0;
    switch (sortKey) {
      case "name":
        av = a.product.name.toLowerCase();
        bv = b.product.name.toLowerCase();
        return sortDir === "asc"
          ? (av as string).localeCompare(bv as string)
          : (bv as string).localeCompare(av as string);
      case "budget":
        av = a.budget;
        bv = b.budget;
        break;
      case "keywords":
        av = a.keywordsCount;
        bv = b.keywordsCount;
        break;
      case "campaigns":
        av = a.campaignsCount;
        bv = b.campaignsCount;
        break;
      case "clicks":
        av = a.clicks;
        bv = b.clicks;
        break;
      case "conversions":
        av = a.conversions;
        bv = b.conversions;
        break;
      case "revenue":
        av = a.revenue;
        bv = b.revenue;
        break;
      case "roas":
        av = a.roas;
        bv = b.roas;
        break;
    }
    return sortDir === "asc"
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });

  // Aggregates
  const totalBudget = allMetrics.reduce((s, m) => s + m.budget, 0);
  const totalKeywords = allMetrics.reduce((s, m) => s + m.keywordsCount, 0);
  const totalRevenue = allMetrics.reduce((s, m) => s + m.revenue, 0);
  const portfolioRoas = totalBudget > 0 ? totalRevenue / totalBudget : 0;

  // Top opportunities (sorted by ROAS desc)
  const roasSorted = [...allMetrics].sort((a, b) => b.roas - a.roas);
  const topOpportunities = roasSorted.slice(0, 5);
  const lowestRoasProduct =
    roasSorted.length > 0 ? roasSorted[roasSorted.length - 1] : null;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function handleProductClick(productId: string) {
    setActiveProductId(productId);
    setPanelMode("table");
  }

  // Status dot color
  function statusColor(status: "active" | "draft" | "empty"): string {
    if (status === "active") return COLORS.green;
    if (status === "draft") return COLORS.amber;
    return COLORS.textMuted;
  }

  function statusLabel(status: "active" | "draft" | "empty"): string {
    if (status === "active") return "Active";
    if (status === "draft") return "Draft";
    return "No campaigns";
  }

  // Column header renderer
  function ColHeader({
    label,
    colKey,
    align = "right",
    width,
  }: {
    label: string;
    colKey: SortKey;
    align?: string;
    width?: number | string;
  }) {
    const active = sortKey === colKey;
    return (
      <th
        onClick={() => handleSort(colKey)}
        style={{
          padding: "10px 8px",
          textAlign: align as React.CSSProperties["textAlign"],
          width: width ?? "auto",
          color: active ? COLORS.accent : COLORS.textMuted,
          fontWeight: 600,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          cursor: "pointer",
          userSelect: "none",
          whiteSpace: "nowrap",
          fontFamily: "'JetBrains Mono', monospace",
          background: active ? COLORS.bgCard : "transparent",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {label}
        {active && (
          <span style={{ marginLeft: 3, fontSize: 8 }}>
            {sortDir === "desc" ? "\u25BC" : "\u25B2"}
          </span>
        )}
      </th>
    );
  }

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------
  if (products.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          minHeight: 300,
        }}
      >
        <Package size={40} color={COLORS.textMuted} />
        <div
          style={{
            fontWeight: 600,
            fontSize: 16,
            color: COLORS.text,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          No products configured
        </div>
        <div
          style={{
            fontSize: 13,
            color: COLORS.textMuted,
            textAlign: "center",
            maxWidth: 360,
            lineHeight: 1.5,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Add products to your portfolio to see aggregate performance, budget
          allocation, and optimization opportunities.
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {/* ----------------------------------------------------------------- */}
      {/* Section 1 -- Portfolio Summary Cards                               */}
      {/* ----------------------------------------------------------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          {
            icon: Briefcase,
            label: "Total Products",
            value: `${products.length}`,
            color: COLORS.accent,
            dimColor: COLORS.accentDim,
          },
          {
            icon: DollarSign,
            label: "Monthly Budget",
            value: formatCurrency(totalBudget, currency),
            color: COLORS.amber,
            dimColor: COLORS.amberDim,
          },
          {
            icon: Hash,
            label: "Total Keywords",
            value: totalKeywords.toLocaleString(),
            color: COLORS.purple,
            dimColor: COLORS.purpleDim,
          },
          {
            icon: TrendingUp,
            label: "Portfolio ROAS",
            value: `${portfolioRoas.toFixed(1)}x`,
            color: portfolioRoas >= 3 ? COLORS.green : portfolioRoas >= 1 ? COLORS.amber : COLORS.red,
            dimColor: portfolioRoas >= 3 ? COLORS.greenDim : portfolioRoas >= 1 ? COLORS.amberDim : COLORS.redDim,
          },
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.borderSubtle}`,
              borderRadius: 10,
              padding: "16px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: card.dimColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <card.icon size={15} color={card.color} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: COLORS.textMuted,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {card.label}
              </span>
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.text,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 2 -- Product Performance Table                             */}
      {/* ----------------------------------------------------------------- */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <BarChart3 size={14} color={COLORS.accent} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Product Performance
          </span>
          <span
            style={{
              fontSize: 11,
              color: COLORS.textMuted,
              marginLeft: "auto",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {products.length} product{products.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "10px 8px 10px 16px",
                    textAlign: "left",
                    width: 32,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                />
                <ColHeader label="Product" colKey="name" align="left" />
                <ColHeader label="Budget" colKey="budget" width={90} />
                <ColHeader label="KWs" colKey="keywords" width={55} />
                <ColHeader
                  label="Campaigns"
                  colKey="campaigns"
                  width={75}
                />
                <ColHeader label="Est. Clicks" colKey="clicks" width={85} />
                <ColHeader
                  label="Est. Conv"
                  colKey="conversions"
                  width={80}
                />
                <ColHeader label="Est. Revenue" colKey="revenue" width={100} />
                <ColHeader label="ROAS" colKey="roas" width={65} />
              </tr>
            </thead>
            <tbody>
              {sortedMetrics.map((m, i) => {
                const isActive = m.product.id === activeProductId;
                return (
                  <tr
                    key={m.product.id}
                    style={{
                      borderBottom: `1px solid ${COLORS.borderSubtle}`,
                      background: isActive ? COLORS.accentDim : "transparent",
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.background = COLORS.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => handleProductClick(m.product.id)}
                  >
                    {/* Status dot */}
                    <td style={{ padding: "8px 8px 8px 16px", width: 32 }}>
                      <div
                        title={statusLabel(m.status)}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: statusColor(m.status),
                        }}
                      />
                    </td>
                    {/* Product name */}
                    <td
                      style={{
                        padding: "8px",
                        fontWeight: 600,
                        fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif",
                        color: COLORS.accent,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <span>{m.product.name}</span>
                        <span
                          style={{
                            fontSize: 10,
                            color: COLORS.textMuted,
                            fontWeight: 400,
                          }}
                        >
                          {m.product.description.length > 40
                            ? m.product.description.slice(0, 40) + "..."
                            : m.product.description}
                        </span>
                      </div>
                    </td>
                    {/* Budget */}
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {m.budget > 0 ? (
                        formatCurrency(m.budget, currency)
                      ) : (
                        <span style={{ color: COLORS.textMuted }}>--</span>
                      )}
                    </td>
                    {/* Keywords */}
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                      }}
                    >
                      {m.keywordsCount > 0 ? (
                        m.keywordsCount.toLocaleString()
                      ) : (
                        <span style={{ color: COLORS.textMuted }}>--</span>
                      )}
                    </td>
                    {/* Campaigns */}
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                      }}
                    >
                      {m.campaignsCount > 0 ? (
                        m.campaignsCount
                      ) : (
                        <span style={{ color: COLORS.textMuted }}>--</span>
                      )}
                    </td>
                    {/* Est Clicks */}
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                      }}
                    >
                      {m.clicks > 0 ? (
                        formatNumber(m.clicks)
                      ) : (
                        <span style={{ color: COLORS.textMuted }}>--</span>
                      )}
                    </td>
                    {/* Est Conv */}
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                      }}
                    >
                      {m.conversions > 0 ? (
                        formatNumber(m.conversions)
                      ) : (
                        <span style={{ color: COLORS.textMuted }}>--</span>
                      )}
                    </td>
                    {/* Est Revenue */}
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        fontWeight: 600,
                        color: m.revenue > 0 ? COLORS.green : COLORS.textMuted,
                      }}
                    >
                      {m.revenue > 0
                        ? formatCurrency(m.revenue, currency)
                        : "--"}
                    </td>
                    {/* ROAS */}
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {m.roas > 0 ? (
                        <span
                          style={{
                            color:
                              m.roas >= 3
                                ? COLORS.green
                                : m.roas >= 1
                                ? COLORS.amber
                                : COLORS.red,
                          }}
                        >
                          {m.roas.toFixed(1)}x
                        </span>
                      ) : (
                        <span style={{ color: COLORS.textMuted }}>--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 3 -- Budget Allocation Chart                               */}
      {/* ----------------------------------------------------------------- */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <PieChart size={14} color={COLORS.purple} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Budget Allocation
          </span>
        </div>

        {totalBudget === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 24,
              color: COLORS.textMuted,
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            No budget allocated across products yet.
          </div>
        ) : (
          <>
            {/* Stacked horizontal bar */}
            <div
              style={{
                display: "flex",
                height: 32,
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              {allMetrics.map((m, idx) => {
                const pct =
                  totalBudget > 0 ? (m.budget / totalBudget) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={m.product.id}
                    title={`${m.product.name}: ${pct.toFixed(1)}% (${formatCurrency(m.budget, currency)})`}
                    style={{
                      width: `${pct}%`,
                      background: getBarColor(idx),
                      minWidth: pct > 0 ? 4 : 0,
                      transition: "width 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {pct >= 12 && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#fff",
                          fontFamily: "'JetBrains Mono', monospace",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          padding: "0 4px",
                        }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {allMetrics.map((m, idx) => {
                const pct =
                  totalBudget > 0 ? (m.budget / totalBudget) * 100 : 0;
                if (m.budget === 0) return null;
                return (
                  <div
                    key={m.product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: getBarDimColor(idx),
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: getBarColor(idx),
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif",
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.product.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: COLORS.textSecondary,
                      }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: COLORS.text,
                        minWidth: 60,
                        textAlign: "right",
                      }}
                    >
                      {formatCurrency(m.budget, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 4 -- Top Opportunities                                     */}
      {/* ----------------------------------------------------------------- */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <Lightbulb size={14} color={COLORS.amber} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Top Opportunities
          </span>
        </div>

        {topOpportunities.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 24,
              color: COLORS.textMuted,
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Configure products with keywords and channels to see opportunities.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topOpportunities.map((m, rank) => {
              const isLowest =
                lowestRoasProduct &&
                m.product.id === lowestRoasProduct.product.id &&
                topOpportunities.length > 1;
              const isTop = rank === 0 && m.roas > 0;

              let recommendation = "";
              if (isTop && m.roas > 0) {
                recommendation =
                  "Highest return in portfolio -- consider increasing budget to scale results.";
              } else if (rank === 1 && m.roas > 0) {
                recommendation =
                  "Strong performer -- explore expanding keywords to capture more traffic.";
              } else if (m.roas >= 2) {
                recommendation =
                  "Solid ROAS -- maintain current strategy and monitor for growth.";
              } else if (m.roas >= 1) {
                recommendation =
                  "Breaking even -- optimize channel mix or adjust targeting.";
              } else if (m.roas > 0) {
                recommendation =
                  "Below target ROAS -- consider reducing budget or optimizing keywords.";
              } else {
                recommendation =
                  "No estimated returns yet -- configure channels and keywords.";
              }

              // Override for lowest ROAS product
              if (
                isLowest &&
                lowestRoasProduct &&
                lowestRoasProduct.roas < 2 &&
                lowestRoasProduct.roas > 0
              ) {
                recommendation =
                  "Lowest ROAS in portfolio -- consider reducing budget or optimizing keywords.";
              }

              return (
                <div
                  key={m.product.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: COLORS.bgElevated,
                    border: `1px solid ${COLORS.borderSubtle}`,
                    cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                  onClick={() => handleProductClick(m.product.id)}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLDivElement
                    ).style.borderColor = COLORS.accent;
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLDivElement
                    ).style.borderColor = COLORS.borderSubtle;
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background:
                        rank === 0
                          ? COLORS.greenDim
                          : isLowest && lowestRoasProduct && lowestRoasProduct.roas < 2
                          ? COLORS.redDim
                          : COLORS.bgCard,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      color:
                        rank === 0
                          ? COLORS.green
                          : isLowest && lowestRoasProduct && lowestRoasProduct.roas < 2
                          ? COLORS.red
                          : COLORS.textMuted,
                    }}
                  >
                    {rank + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {m.product.name}
                      </span>
                      {m.roas > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background:
                              m.roas >= 3
                                ? COLORS.greenDim
                                : m.roas >= 1
                                ? COLORS.amberDim
                                : COLORS.redDim,
                            color:
                              m.roas >= 3
                                ? COLORS.green
                                : m.roas >= 1
                                ? COLORS.amber
                                : COLORS.red,
                          }}
                        >
                          {m.roas.toFixed(1)}x ROAS
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: COLORS.textSecondary,
                        lineHeight: 1.4,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {recommendation}
                    </div>
                  </div>
                  <ArrowRight
                    size={13}
                    color={COLORS.textMuted}
                    style={{ flexShrink: 0, marginTop: 4 }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 5 -- Quick Actions Grid                                    */}
      {/* ----------------------------------------------------------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {[
          {
            icon: Search,
            label: "View Keywords",
            desc: "Explore keyword research data",
            mode: "table",
          },
          {
            icon: Megaphone,
            label: "Manage Campaigns",
            desc: "Build and manage ad campaigns",
            mode: "campaign",
          },
          {
            icon: DollarSign,
            label: "Budget Allocator",
            desc: "Optimize spend across channels",
            mode: "allocator",
          },
          {
            icon: Users,
            label: "Audience & Personas",
            desc: "View ICP profiles and personas",
            mode: "audience",
          },
        ].map((action) => (
          <div
            key={action.mode}
            onClick={() => {
              setPanelMode(action.mode);
              setPanelOpen(true);
            }}
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.borderSubtle}`,
              borderRadius: 10,
              padding: "16px 14px",
              cursor: "pointer",
              transition: "border-color 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = COLORS.accent;
              el.style.background = COLORS.bgHover;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = COLORS.borderSubtle;
              el.style.background = COLORS.bgCard;
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: COLORS.accentDim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <action.icon size={16} color={COLORS.accent} />
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: 3,
              }}
            >
              {action.label}
            </div>
            <div
              style={{
                fontSize: 11,
                color: COLORS.textMuted,
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.3,
              }}
            >
              {action.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
