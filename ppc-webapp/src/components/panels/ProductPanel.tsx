import React from "react";
import { COLORS } from "../../constants";
import { Briefcase, DollarSign, Target, Layers, CheckCircle2, PenTool, Plus } from "lucide-react";

export interface ProductPanelProps {
  products: any[];
}

export default function ProductPanel({ products }: ProductPanelProps) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {products.map((prod, i) => (
        <div key={i} style={{
          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
          borderRadius: 10, padding: 20, marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Briefcase size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{prod.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{prod.description}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "ACV Range", value: prod.acv, icon: DollarSign },
              { label: "Target Buyer", value: prod.target, icon: Target },
              { label: "Integrations", value: prod.integrations, icon: Layers },
            ].map((field, fi) => (
              <div key={fi} style={{ padding: "10px 12px", background: COLORS.bgElevated, borderRadius: 8, border: `1px solid ${COLORS.borderSubtle}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <field.icon size={11} color={COLORS.textMuted} />
                  <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>
                    {field.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{field.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
              Value Propositions (used in ad copy generation)
            </div>
            {[
              "Three-way matching eliminates manual invoice verification",
              "Automated approval workflows with configurable thresholds",
              "Real-time AP dashboard with supplier payment tracking",
              "Connects to QuickBooks or Xero in under 2 minutes",
              "Purpose-built for SMBs — no enterprise complexity",
            ].map((vp, vi) => (
              <div key={vi} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                borderBottom: vi < 4 ? `1px solid ${COLORS.borderSubtle}` : "none",
              }}>
                <CheckCircle2 size={13} color={COLORS.green} />
                <span style={{ fontSize: 12 }}>{vp}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
              Competitive Positioning
            </div>
            {[
              { vs: "vs Bill.com", angle: "60% lower cost, same core features, built for smaller teams" },
              { vs: "vs Tipalti", angle: "No minimum transaction volume, QBO/Xero native, faster setup" },
              { vs: "vs Stampli", angle: "Broader automation (not just invoice processing), transparent pricing" },
            ].map((pos, pi) => (
              <div key={pi} style={{
                padding: "8px 12px", marginBottom: 6, borderRadius: 6,
                background: COLORS.bgElevated, border: `1px solid ${COLORS.borderSubtle}`,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent }}>{pos.vs}</span>
                <span style={{ fontSize: 11, color: COLORS.textSecondary, marginLeft: 8 }}>{pos.angle}</span>
              </div>
            ))}
          </div>

          <button style={{
            marginTop: 16, width: "100%", padding: "10px 16px", borderRadius: 8,
            border: `1px dashed ${COLORS.border}`, background: "transparent",
            color: COLORS.textMuted, cursor: "pointer", fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <PenTool size={13} /> Edit Product Profile
          </button>
        </div>
      ))}

      <button style={{
        width: "100%", padding: "14px 16px", borderRadius: 10,
        border: `1px dashed ${COLORS.accent}`, background: COLORS.accentDim,
        color: COLORS.accent, cursor: "pointer", fontSize: 13, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <Plus size={15} /> Add Product Profile
      </button>
    </div>
  );
}
