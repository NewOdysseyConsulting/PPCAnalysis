import React from "react";
import { ChevronRight } from "lucide-react";
import { COLORS } from "../../constants";

interface Product {
  id: string;
  name: string;
  description: string;
}

interface ProductSwitcherProps {
  products: Product[];
  activeProductId: string;
  setActiveProductId: (id: string) => void;
}

export const ProductSwitcher: React.FC<ProductSwitcherProps> = ({
  products,
  activeProductId,
  setActiveProductId,
}) => {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const activeProduct = products.find((p) => p.id === activeProductId);
  const activeLetter = activeProduct ? activeProduct.name.charAt(0).toUpperCase() : "?";

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        title={activeProduct ? activeProduct.name : "Select product"}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          boxShadow: `0 2px 8px rgba(13,148,136,0.18)`,
        }}
      >
        {activeLetter}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            left: 48,
            top: 0,
            width: 240,
            background: COLORS.bgElevated,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            padding: 6,
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: "6px 10px",
              fontSize: 10,
              color: COLORS.textMuted,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Switch Product
          </div>

          {products.map((product) => {
            const isActive = product.id === activeProductId;
            const letter = product.name.charAt(0).toUpperCase();

            return (
              <button
                key={product.id}
                onClick={() => {
                  setActiveProductId(product.id);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: isActive ? `1px solid ${COLORS.accent}` : "1px solid transparent",
                  background: isActive ? COLORS.accentDim : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  transition: "all 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = COLORS.bgHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: isActive
                      ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`
                      : COLORS.bgCard,
                    color: isActive ? "#fff" : COLORS.textSecondary,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {letter}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? COLORS.accent : COLORS.text,
                      fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {product.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {product.description}
                  </div>
                </div>
                {isActive && <ChevronRight size={14} color={COLORS.accent} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
