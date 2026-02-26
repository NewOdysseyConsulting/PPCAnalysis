import React from "react";
import { Briefcase, DollarSign, Target, Layers, PenTool, Copy, Plus, Trash2 } from "lucide-react";
import { COLORS } from "../../constants";

interface ProductsTabProps {
  products: any[];
  activeProductId: string;
  setActiveProductId: (id: string) => void;
  setPanelMode: (mode: string) => void;
  setPanelOpen: (open: boolean) => void;
  onAddProduct: () => void;
  onEditProduct: (product: any) => void;
  onDuplicateProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  activeProductId,
  setActiveProductId,
  setPanelMode,
  setPanelOpen,
  onAddProduct,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
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
        <button
          onClick={() => { setPanelMode("portfolio"); setPanelOpen(true); }}
          style={{
            height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${COLORS.accent}`,
            background: COLORS.accentDim, color: COLORS.accent, cursor: "pointer",
            fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          Portfolio
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {products.map((prod) => {
          const isActive = prod.id === activeProductId;
          return (
            <div
              key={prod.id}
              onClick={() => setActiveProductId(prod.id)}
              style={{
                background: COLORS.bgCard,
                border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                borderRadius: 10, marginBottom: 10, overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.15s ease",
              }}
            >
              {/* Product Header */}
              <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, minWidth: 40,
                  background: isActive
                    ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`
                    : COLORS.bgElevated,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: isActive ? "none" : `1px solid ${COLORS.border}`,
                  fontSize: 16, fontWeight: 700, color: isActive ? "#fff" : COLORS.textSecondary,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {isActive ? <Briefcase size={18} color="#fff" /> : prod.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 15,
                    color: isActive ? COLORS.accent : COLORS.text,
                  }}>{prod.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{prod.description}</div>
                </div>
                {isActive && (
                  <div style={{
                    fontSize: 9, fontWeight: 700, padding: "3px 8px",
                    borderRadius: 4, background: COLORS.greenDim, color: COLORS.green,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    Active
                  </div>
                )}
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
                  onClick={(e) => { e.stopPropagation(); onEditProduct(prod); }}
                  style={{
                    flex: 1, height: 30, borderRadius: 6, border: `1px solid ${COLORS.accent}`,
                    background: COLORS.accentDim, color: COLORS.accent, cursor: "pointer",
                    fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}
                >
                  <PenTool size={11} /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicateProduct(prod.id); }}
                  style={{
                    height: 30, padding: "0 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                    background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                    fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <Copy size={11} /> Duplicate
                </button>
                {products.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteProduct(prod.id); }}
                    style={{
                      height: 30, padding: "0 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                      background: "transparent", color: COLORS.red, cursor: "pointer",
                      fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Product */}
        <button
          onClick={onAddProduct}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 10,
            border: `1px dashed ${COLORS.accent}`, background: COLORS.accentDim,
            color: COLORS.accent, cursor: "pointer", fontSize: 12, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Plus size={14} /> Add Product Profile
        </button>
      </div>
    </>
  );
};
