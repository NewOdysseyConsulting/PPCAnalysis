import React from "react";
import { COLORS } from "../../constants";
import { Target, ChevronRight, Layers, Plus } from "lucide-react";

export interface CampaignPanelProps {
  campaigns: any[];
  activeAdGroup: number;
  setActiveAdGroup: (idx: number) => void;
}

export default function CampaignPanel({ campaigns, activeAdGroup, setActiveAdGroup }: CampaignPanelProps) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {campaigns.map((campaign, ci) => (
        <div key={ci}>
          {/* Campaign Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            padding: "12px 16px", background: COLORS.bgCard, borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
          }}>
            <Target size={16} color={COLORS.accent} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{campaign.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                {campaign.adGroups.length} ad groups · {campaign.adGroups.reduce((a: any, g: any) => a + g.keywords.length, 0)} keywords · Est. £540-720/mo
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{
              fontSize: 10, padding: "3px 10px", borderRadius: 20,
              background: COLORS.amberDim, color: COLORS.amber,
              fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {campaign.status}
            </span>
          </div>

          {/* Ad Groups */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {campaign.adGroups.map((ag: any, gi: number) => (
              <div key={gi} style={{
                background: COLORS.bgCard, border: `1px solid ${activeAdGroup === gi ? COLORS.accent : COLORS.border}`,
                borderRadius: 10, overflow: "hidden",
                transition: "border-color 0.15s ease",
              }}>
                {/* Ad Group Header */}
                <div
                  onClick={() => setActiveAdGroup(activeAdGroup === gi ? -1 : gi)}
                  style={{
                    padding: "12px 16px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    borderBottom: activeAdGroup === gi ? `1px solid ${COLORS.border}` : "none",
                  }}
                >
                  <ChevronRight
                    size={14}
                    color={COLORS.textMuted}
                    style={{
                      transform: activeAdGroup === gi ? "rotate(90deg)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  />
                  <Layers size={13} color={COLORS.accent} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{ag.name}</span>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{ag.keywords.length} keywords</span>
                </div>

                {/* Ad Group Content */}
                {activeAdGroup === gi && (
                  <div style={{ padding: 16 }}>
                    {/* Keywords */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                        Keywords
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {ag.keywords.map((kw: string, ki: number) => (
                          <span key={ki} style={{
                            fontSize: 11, padding: "4px 10px", borderRadius: 6,
                            background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
                            color: COLORS.text, fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {kw}
                          </span>
                        ))}
                        <button style={{
                          fontSize: 11, padding: "4px 10px", borderRadius: 6,
                          background: "transparent", border: `1px dashed ${COLORS.border}`,
                          color: COLORS.textMuted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <Plus size={11} /> Add
                        </button>
                      </div>
                    </div>

                    {/* Headlines */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                        Headlines (30 char max)
                      </div>
                      {ag.headlines.map((h: string, hi: number) => (
                        <div key={hi} style={{
                          display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                        }}>
                          <div style={{
                            flex: 1, padding: "8px 12px", borderRadius: 6,
                            background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
                            fontSize: 13, color: COLORS.text, fontWeight: 500,
                          }}>
                            {h}
                          </div>
                          <span style={{
                            fontSize: 10, color: h.length <= 30 ? COLORS.green : COLORS.red,
                            fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, minWidth: 30, textAlign: "right",
                          }}>
                            {h.length}/30
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Descriptions */}
                    <div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                        Descriptions (90 char max)
                      </div>
                      {ag.descriptions.map((d: string, di: number) => (
                        <div key={di} style={{
                          display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6,
                        }}>
                          <div style={{
                            flex: 1, padding: "8px 12px", borderRadius: 6,
                            background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
                            fontSize: 12, color: COLORS.text, lineHeight: 1.5,
                          }}>
                            {d}
                          </div>
                          <span style={{
                            fontSize: 10, color: d.length <= 90 ? COLORS.green : COLORS.red,
                            fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, minWidth: 35, textAlign: "right",
                            marginTop: 8,
                          }}>
                            {d.length}/90
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Ad Preview */}
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                        Ad Preview
                      </div>
                      <div style={{
                        padding: 16, borderRadius: 8, background: "#fff",
                        border: "1px solid #dadce0", maxWidth: 400,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      }}>
                        <div style={{ fontSize: 10, color: "#202124", fontFamily: "Arial, sans-serif", marginBottom: 2 }}>
                          Sponsored · new-odyssey.com
                        </div>
                        <div style={{ fontSize: 16, color: "#1a0dab", fontFamily: "Arial, sans-serif", fontWeight: 400, marginBottom: 4, lineHeight: 1.3 }}>
                          {ag.headlines[0]} | {ag.headlines[1]}
                        </div>
                        <div style={{ fontSize: 13, color: "#4d5156", fontFamily: "Arial, sans-serif", lineHeight: 1.45 }}>
                          {ag.descriptions[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
