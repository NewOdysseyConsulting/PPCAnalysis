import React from "react";
import { Users, Building2, UserCheck, Grid3X3, ChevronRight, Search, Tag } from "lucide-react";
import { COLORS } from "../../constants";

// ── Local Types ──

interface IcpProfile {
  id: string;
  name: string;
  companySize: { min: number; max: number; label: string };
  industry: string[];
  revenue: { min: number; max: number; currency: string };
  geography: string[];
  techStack: string[];
  painPoints: string[];
  buyingTriggers: string[];
  decisionMakers: string[];
  budgetRange: { min: number; max: number; currency: string };
}

interface BuyerPersona {
  id: string;
  name: string;
  title: string;
  department: string;
  seniority: "c-suite" | "director" | "manager" | "individual-contributor";
  goals: string[];
  painPoints: string[];
  objections: string[];
  triggers: string[];
  informationSources: string[];
  decisionCriteria: string[];
  searchBehavior: string[];
  icpId: string;
}

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  size: number;
  searchKeywords: string[];
  contentTopics: string[];
}

// ── Props ──

interface AudienceTabProps {
  icpProfiles: IcpProfile[];
  buyerPersonas: BuyerPersona[];
  audienceSegments: AudienceSegment[];
  setPanelMode: (mode: string) => void;
  setPanelOpen: (open: boolean) => void;
}

// ── Helpers ──

function seniorityBadge(s: BuyerPersona["seniority"]): { bg: string; fg: string; label: string } {
  switch (s) {
    case "c-suite": return { bg: COLORS.purpleDim, fg: COLORS.purple, label: "C-Suite" };
    case "director": return { bg: COLORS.accentDim, fg: COLORS.accent, label: "Director" };
    case "manager": return { bg: COLORS.amberDim, fg: COLORS.amber, label: "Manager" };
    case "individual-contributor": return { bg: COLORS.greenDim, fg: COLORS.green, label: "IC" };
  }
}

// ── Component ──

export const AudienceTab: React.FC<AudienceTabProps> = ({
  icpProfiles,
  buyerPersonas,
  audienceSegments,
  setPanelMode,
  setPanelOpen,
}) => {
  function openPanel() {
    setPanelMode("audience");
    setPanelOpen(true);
  }

  return (
    <>
      {/* Header */}
      <div style={{
        height: 56, minHeight: 56, borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
        background: "#f1f2f4",
      }}>
        <Users size={16} color={COLORS.accent} />
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>Audience</span>
        <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
          {icpProfiles.length} ICPs / {buyerPersonas.length} Personas / {audienceSegments.length} Segments
        </span>
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>

        {/* ICP Summary Cards */}
        {icpProfiles.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 8, display: "flex", alignItems: "center", gap: 4,
            }}>
              <Building2 size={10} /> ICP Profiles
            </div>
            {icpProfiles.map((icp) => (
              <div
                key={icp.id}
                onClick={openPanel}
                style={{
                  background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: "12px 14px", marginBottom: 6,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  transition: "border-color 0.15s ease",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, minWidth: 32,
                  background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.green})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Building2 size={14} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{icp.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>
                    {icp.industry.length} industrie{icp.industry.length !== 1 ? "s" : ""} &middot; {icp.geography.length} region{icp.geography.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <ChevronRight size={14} color={COLORS.textMuted} />
              </div>
            ))}
          </div>
        )}

        {/* Persona Summary Cards */}
        {buyerPersonas.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 8, display: "flex", alignItems: "center", gap: 4,
            }}>
              <UserCheck size={10} /> Buyer Personas
            </div>
            {buyerPersonas.map((persona) => {
              const badge = seniorityBadge(persona.seniority);
              return (
                <div
                  key={persona.id}
                  onClick={openPanel}
                  style={{
                    background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, padding: "12px 14px", marginBottom: 6,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 16, minWidth: 32,
                    background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.accent})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {persona.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      {persona.name}
                      <span style={{
                        fontSize: 8, padding: "1px 6px", borderRadius: 8,
                        background: badge.bg, color: badge.fg,
                        fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>
                      {persona.title}
                    </div>
                  </div>
                  <ChevronRight size={14} color={COLORS.textMuted} />
                </div>
              );
            })}
          </div>
        )}

        {/* Segment Summary */}
        {audienceSegments.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 8, display: "flex", alignItems: "center", gap: 4,
            }}>
              <Grid3X3 size={10} /> Audience Segments
            </div>
            {audienceSegments.map((seg) => (
              <div
                key={seg.id}
                onClick={openPanel}
                style={{
                  background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: "12px 14px", marginBottom: 6,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  transition: "border-color 0.15s ease",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, minWidth: 32,
                  background: COLORS.amberDim,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Grid3X3 size={14} color={COLORS.amber} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{seg.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{seg.size.toLocaleString()}</span> reach
                    <span>&middot;</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      <Search size={8} /> {seg.searchKeywords.length} kw
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} color={COLORS.textMuted} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {icpProfiles.length === 0 && buyerPersonas.length === 0 && audienceSegments.length === 0 && (
          <div style={{
            padding: 32, textAlign: "center", color: COLORS.textMuted, fontSize: 12,
          }}>
            <Users size={32} color={COLORS.borderSubtle} style={{ marginBottom: 12 }} />
            <div style={{ marginBottom: 4, fontWeight: 600, color: COLORS.textSecondary }}>No audience data yet</div>
            <div>Open the audience panel to create ICP profiles, buyer personas, and audience segments.</div>
            <button
              onClick={openPanel}
              style={{
                marginTop: 12,
                border: `1px solid ${COLORS.accent}`,
                background: COLORS.accentDim,
                color: COLORS.accent,
                fontWeight: 600,
                fontSize: 11,
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Open Audience Panel
            </button>
          </div>
        )}
      </div>
    </>
  );
};
