import React from "react";
import { Briefcase, DollarSign, Target, Layers, PenTool, Copy, Plus } from "lucide-react";
import { COLORS } from "../../constants";

interface ProductsTabProps {
  products: any[];
  setPanelMode: (mode: string) => void;
  setPanelOpen: (open: boolean) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  setPanelMode,
  setPanelOpen,
}) => {
  return (
    <>
      <div style={{
        height: 56, minHeight: 56, borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
        background: "#f1f2f4",
      }}>
        <Briefcase size={16} color={COLORS.accent} />
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>Product Profiles</span>
        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{products.length} product{products.length !== 1 ? "s" : ""}</span>
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {products.map((prod, pi) => (
          <div key={pi} style={{
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, marginBottom: 10, overflow: "hidden",
          }}>
            {/* Product Header */}
            <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, minWidth: 40,
                background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Briefcase size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{prod.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{prod.description}</div>
              </div>
            </div>

            {/* Product Details */}
            <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: DollarSign, label: "ACV Range", value: prod.acv },
                { icon: Target, label: "Target Buyer", value: prod.target },
                { icon: Layers, label: "Integrations", value: prod.integrations },
              ].map((field, fi) => (
                <div key={fi} style={{
                  padding: "8px 10px", background: COLORS.bgElevated, borderRadius: 6,
                  border: `1px solid ${COLORS.borderSubtle}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <field.icon size={10} color={COLORS.textMuted} />
                    <span style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>
                      {field.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{field.value}</div>
                </div>
              ))}
            </div>

            {/* Product Actions */}
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 6 }}>
              <button
                onClick={() => { setPanelMode("product"); setPanelOpen(true); }}
                style={{
                  flex: 1, height: 30, borderRadius: 6, border: `1px solid ${COLORS.accent}`,
                  background: COLORS.accentDim, color: COLORS.accent, cursor: "pointer",
                  fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                <PenTool size={11} /> Edit in Panel
              </button>
              <button
                style={{
                  height: 30, padding: "0 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Copy size={11} /> Duplicate
              </button>
            </div>
          </div>
        ))}

        {/* Add New Product */}
        <button style={{
          width: "100%", padding: "14px 16px", borderRadius: 10,
          border: `1px dashed ${COLORS.accent}`, background: COLORS.accentDim,
          color: COLORS.accent, cursor: "pointer", fontSize: 12, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Plus size={14} /> Add Product Profile
        </button>
      </div>
    </>
  );
};
