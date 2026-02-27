import React from "react";
import { X } from "lucide-react";
import { COLORS } from "../../constants";

interface ProductData {
  id: string;
  name: string;
  description: string;
  acv: string;
  target: string;
  integrations: string;
  websiteUrl?: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductData) => void;
  editProduct?: ProductData | null;
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: COLORS.textMuted,
  fontFamily: "'JetBrains Mono', monospace",
  marginBottom: 6,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 12px",
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.bgElevated,
  color: COLORS.text,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 16,
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editProduct,
}) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [acv, setAcv] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [integrations, setIntegrations] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");

  React.useEffect(() => {
    if (editProduct) {
      setName(editProduct.name);
      setDescription(editProduct.description);
      setAcv(editProduct.acv);
      setTarget(editProduct.target);
      setIntegrations(editProduct.integrations);
      setWebsiteUrl(editProduct.websiteUrl || "");
    } else {
      setName("");
      setDescription("");
      setAcv("");
      setTarget("");
      setIntegrations("");
      setWebsiteUrl("");
    }
  }, [editProduct, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const now = new Date().toISOString();
    onSave({
      id: editProduct ? editProduct.id : crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      acv: acv.trim(),
      target: target.trim(),
      integrations: integrations.trim(),
      websiteUrl: websiteUrl.trim() || undefined,
    });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = COLORS.accent;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = COLORS.border;
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: COLORS.bgElevated,
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: COLORS.text,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {editProduct ? "Edit Product" : "New Product"}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: COLORS.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: "24px" }}>
          {/* Product Name */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Orion Analytics"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {/* Description */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the product"
              rows={3}
              style={{
                ...inputStyle,
                height: "auto",
                padding: "10px 12px",
                resize: "vertical",
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {/* ACV / Price Range */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>ACV / Price Range</label>
            <input
              type="text"
              value={acv}
              onChange={(e) => setAcv(e.target.value)}
              placeholder="e.g., $588-2,400/yr"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {/* Target Audience */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Target Audience</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., Financial Controllers, AP Managers"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {/* Integrations */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Integrations</label>
            <input
              type="text"
              value={integrations}
              onChange={(e) => setIntegrations(e.target.value)}
              placeholder="e.g., QuickBooks, Xero, NetSuite"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {/* Website URL */}
          <div style={{ ...fieldGroupStyle, marginBottom: 0 }}>
            <label style={labelStyle}>Website URL</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g., https://example.com/product"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 36,
              padding: "0 20px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: "transparent",
              color: COLORS.textSecondary,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              height: 36,
              padding: "0 24px",
              borderRadius: 8,
              border: "none",
              background: COLORS.accent,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              opacity: name.trim() ? 1 : 0.5,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (name.trim()) e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = name.trim() ? "1" : "0.5";
            }}
          >
            {editProduct ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
};
