import React, { useState } from "react";
import { X, Globe, Loader2, ArrowRight, ArrowLeft, Check, Sparkles, Copy, Tag, Target, DollarSign, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { COLORS } from "../../constants";
import { fullOnboarding, generateAdCopy as generateOnboardingCopy } from "../../services/onboarding";
import type { ExtractedProductInfo } from "../../services/onboarding";

interface ProductOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (product: {
    id: string;
    name: string;
    description: string;
    acv: string;
    target: string;
    integrations: string;
    websiteUrl: string;
    keywords: string[];
    adCopy: { headlines: string[]; descriptions: string[] };
  }) => void;
}

type Step = "url" | "product" | "keywords" | "adcopy";
const STEPS: Step[] = ["url", "product", "keywords", "adcopy"];
const STEP_LABELS: Record<Step, string> = {
  url: "Website URL",
  product: "Product Profile",
  keywords: "Keywords",
  adcopy: "Ad Copy",
};

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

export const ProductOnboardingWizard: React.FC<ProductOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Product data (editable)
  const [productInfo, setProductInfo] = useState<ExtractedProductInfo | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editAcv, setEditAcv] = useState("");
  const [editIntegrations, setEditIntegrations] = useState("");

  // Keywords
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [newKeyword, setNewKeyword] = useState("");

  // Ad Copy
  const [adCopy, setAdCopy] = useState<{ headlines: string[]; descriptions: string[] } | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);

  if (!isOpen) return null;

  const stepIdx = STEPS.indexOf(step);

  // ── Step 1: Crawl the URL ──
  const handleCrawl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await fullOnboarding(url.trim());
      setProductInfo(result.product);
      setEditName(result.product.name);
      setEditDescription(result.product.description);
      setEditTarget(result.product.targetAudience);
      setEditAcv(result.product.acv);
      setEditIntegrations(result.product.integrations);
      const kws = result.product.keywords || [];
      setKeywords(kws);
      setSelectedKeywords(new Set(kws));
      setStep("product");
    } catch (err: any) {
      setError(err.message || "Failed to crawl website");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3→4: Generate ad copy ──
  const handleGenerateCopy = async () => {
    if (selectedKeywords.size === 0) return;
    setLoading(true);
    setError("");
    try {
      const product: ExtractedProductInfo = {
        ...productInfo!,
        name: editName,
        description: editDescription,
        targetAudience: editTarget,
        acv: editAcv,
        integrations: editIntegrations,
      };
      const result = await generateOnboardingCopy(product, [...selectedKeywords], 15);
      setAdCopy(result);
      setStep("adcopy");
    } catch (err: any) {
      setError(err.message || "Failed to generate ad copy");
    } finally {
      setLoading(false);
    }
  };

  // ── Final: Complete onboarding ──
  const handleComplete = () => {
    onComplete({
      id: crypto.randomUUID(),
      name: editName,
      description: editDescription,
      acv: editAcv,
      target: editTarget,
      integrations: editIntegrations,
      websiteUrl: url.trim(),
      keywords: [...selectedKeywords],
      adCopy: adCopy || { headlines: [], descriptions: [] },
    });
    // Reset state
    setStep("url");
    setUrl("");
    setProductInfo(null);
    setKeywords([]);
    setSelectedKeywords(new Set());
    setAdCopy(null);
    setError("");
  };

  const handleBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  };

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords(prev => [...prev, kw]);
      setSelectedKeywords(prev => new Set([...prev, kw]));
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw));
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      next.delete(kw);
      return next;
    });
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = COLORS.accent;
  };
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = COLORS.border;
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
      <div style={{
        width: "100%",
        maxWidth: 640,
        maxHeight: "90vh",
        background: COLORS.bgElevated,
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={18} color={COLORS.accent} />
            <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>
              Product Onboarding
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: "transparent", color: COLORS.textMuted, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Steps */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 4 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < stepIdx ? COLORS.green : i === stepIdx ? COLORS.accent : COLORS.bgCard,
                color: i <= stepIdx ? "#fff" : COLORS.textMuted,
                border: i > stepIdx ? `1px solid ${COLORS.border}` : "none",
              }}>
                {i < stepIdx ? <Check size={12} /> : i + 1}
              </div>
              <span style={{
                fontSize: 11, fontWeight: i === stepIdx ? 600 : 400,
                color: i === stepIdx ? COLORS.text : COLORS.textMuted,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {STEP_LABELS[s]}
              </span>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < stepIdx ? COLORS.green : COLORS.border, margin: "0 4px" }} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

          {/* ── Step 1: URL Input ── */}
          {step === "url" && (
            <div>
              <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
                Enter your product website URL. We'll crawl it to extract product information, keywords, and generate ad copy.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Website URL</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Globe size={14} color={COLORS.textMuted} style={{ position: "absolute", left: 12, top: 11 }} />
                    <input
                      type="text"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCrawl()}
                      placeholder="https://example.com/product"
                      style={{ ...inputStyle, paddingLeft: 34 }}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleCrawl}
                    disabled={!url.trim() || loading}
                    style={{
                      height: 36, padding: "0 20px", borderRadius: 6, border: "none",
                      background: url.trim() && !loading ? COLORS.accent : COLORS.bgCard,
                      color: url.trim() && !loading ? "#fff" : COLORS.textMuted,
                      fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                      cursor: url.trim() && !loading ? "pointer" : "default",
                      display: "flex", alignItems: "center", gap: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Crawling...</> : <>Analyze <ArrowRight size={14} /></>}
                  </button>
                </div>
              </div>
              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)",
                  border: `1px solid rgba(239,68,68,0.2)`, color: COLORS.red, fontSize: 12,
                }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Product Profile Review ── */}
          {step === "product" && (
            <div>
              <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>
                Review and edit the extracted product information. This will be used to generate keywords and ad copy.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Product Name *</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Description</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                  rows={2} style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }}
                  onFocus={handleInputFocus} onBlur={handleInputBlur} />
              </div>

              {productInfo?.valueProposition && (
                <div style={{
                  marginBottom: 16, padding: "12px 14px", borderRadius: 8,
                  background: COLORS.accentDim, border: `1px solid ${COLORS.accent}20`,
                }}>
                  <div style={{ ...labelStyle, color: COLORS.accent, marginBottom: 4 }}>Value Proposition</div>
                  <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>{productInfo.valueProposition}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Target Audience</label>
                  <input type="text" value={editTarget} onChange={e => setEditTarget(e.target.value)}
                    style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
                <div>
                  <label style={labelStyle}>ACV / Pricing</label>
                  <input type="text" value={editAcv} onChange={e => setEditAcv(e.target.value)}
                    style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Integrations</label>
                <input type="text" value={editIntegrations} onChange={e => setEditIntegrations(e.target.value)}
                  placeholder="Comma-separated integrations"
                  style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
              </div>

              {/* Features collapsible */}
              {productInfo?.features && productInfo.features.length > 0 && (
                <div style={{ marginBottom: 0 }}>
                  <button
                    onClick={() => setShowFeatures(!showFeatures)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                      padding: 0, cursor: "pointer", color: COLORS.textSecondary, fontSize: 12, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {showFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Extracted Features ({productInfo.features.length})
                  </button>
                  {showFeatures && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {productInfo.features.map((f, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: "4px 10px", borderRadius: 20,
                          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                          color: COLORS.textSecondary,
                        }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Keywords Review ── */}
          {step === "keywords" && (
            <div>
              <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 1.6 }}>
                Select the keywords to include in your product profile. These will be used to generate ad copy.
              </p>

              {/* Select / Deselect all */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                  {selectedKeywords.size} of {keywords.length} selected
                </span>
                <button
                  onClick={() => setSelectedKeywords(new Set(keywords))}
                  style={{
                    padding: "3px 10px", borderRadius: 4, border: `1px solid ${COLORS.border}`,
                    background: "transparent", color: COLORS.accent, fontSize: 11, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >Select All</button>
                <button
                  onClick={() => setSelectedKeywords(new Set())}
                  style={{
                    padding: "3px 10px", borderRadius: 4, border: `1px solid ${COLORS.border}`,
                    background: "transparent", color: COLORS.textMuted, fontSize: 11, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >Deselect All</button>
              </div>

              {/* Add keyword input */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addKeyword()}
                  placeholder="Add a keyword..."
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <button
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                  style={{
                    height: 36, padding: "0 14px", borderRadius: 6,
                    border: `1px solid ${COLORS.accent}`,
                    background: COLORS.accentDim, color: COLORS.accent,
                    fontSize: 12, fontWeight: 600, cursor: newKeyword.trim() ? "pointer" : "default",
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: newKeyword.trim() ? 1 : 0.5,
                  }}
                >Add</button>
              </div>

              {/* Keywords grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {keywords.map(kw => {
                  const isSelected = selectedKeywords.has(kw);
                  return (
                    <div key={kw} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "5px 10px", borderRadius: 20,
                      background: isSelected ? COLORS.accentDim : COLORS.bgCard,
                      border: `1px solid ${isSelected ? COLORS.accent : COLORS.border}`,
                      cursor: "pointer", transition: "all 0.12s ease",
                    }}
                      onClick={() => toggleKeyword(kw)}
                    >
                      <Tag size={10} color={isSelected ? COLORS.accent : COLORS.textMuted} />
                      <span style={{ fontSize: 12, color: isSelected ? COLORS.accent : COLORS.textSecondary }}>
                        {kw}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeKeyword(kw); }}
                        style={{
                          width: 14, height: 14, borderRadius: "50%", border: "none",
                          background: "transparent", color: COLORS.textMuted, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, padding: 0,
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)",
                  border: `1px solid rgba(239,68,68,0.2)`, color: COLORS.red, fontSize: 12,
                }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Ad Copy ── */}
          {step === "adcopy" && adCopy && (
            <div>
              <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>
                Generated ad copy for your product. Headlines are max 30 characters, descriptions max 90 characters.
              </p>

              {/* Headlines */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ ...labelStyle, marginBottom: 10 }}>
                  Headlines ({adCopy.headlines.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {adCopy.headlines.map((h, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 6,
                      background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                    }}>
                      <span style={{ fontSize: 13, color: COLORS.text }}>{h}</span>
                      <span style={{
                        fontSize: 10, color: h.length <= 30 ? COLORS.green : COLORS.red,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {h.length}/30
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <div style={{ ...labelStyle, marginBottom: 10 }}>
                  Descriptions ({adCopy.descriptions.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {adCopy.descriptions.map((d, i) => (
                    <div key={i} style={{
                      padding: "8px 12px", borderRadius: 6,
                      background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                    }}>
                      <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5, marginBottom: 4 }}>{d}</div>
                      <span style={{
                        fontSize: 10, color: d.length <= 90 ? COLORS.green : COLORS.red,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {d.length}/90
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            {stepIdx > 0 && step !== "url" && (
              <button
                onClick={handleBack}
                disabled={loading}
                style={{
                  height: 36, padding: "0 16px", borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.textSecondary,
                  fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  cursor: loading ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                height: 36, padding: "0 16px", borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: "transparent", color: COLORS.textSecondary,
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            {step === "product" && (
              <button
                onClick={() => { setError(""); setStep("keywords"); }}
                disabled={!editName.trim()}
                style={{
                  height: 36, padding: "0 20px", borderRadius: 8, border: "none",
                  background: editName.trim() ? COLORS.accent : COLORS.bgCard,
                  color: editName.trim() ? "#fff" : COLORS.textMuted,
                  fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  cursor: editName.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                Keywords <ArrowRight size={14} />
              </button>
            )}

            {step === "keywords" && (
              <button
                onClick={handleGenerateCopy}
                disabled={selectedKeywords.size === 0 || loading}
                style={{
                  height: 36, padding: "0 20px", borderRadius: 8, border: "none",
                  background: selectedKeywords.size > 0 && !loading ? COLORS.accent : COLORS.bgCard,
                  color: selectedKeywords.size > 0 && !loading ? "#fff" : COLORS.textMuted,
                  fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  cursor: selectedKeywords.size > 0 && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</> : <>Generate Copy <Sparkles size={14} /></>}
              </button>
            )}

            {step === "adcopy" && (
              <button
                onClick={handleComplete}
                style={{
                  height: 36, padding: "0 24px", borderRadius: 8, border: "none",
                  background: COLORS.green, color: "#fff",
                  fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Check size={14} /> Create Product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
