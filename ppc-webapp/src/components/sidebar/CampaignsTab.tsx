import React from "react";
import { Target, ChevronRight, Layers, PenTool, FileDown, Plus } from "lucide-react";
import { COLORS } from "../../constants";

interface CampaignsTabProps {
  campaigns: any[];
  expandedCampaignSidebar: number;
  setExpandedCampaignSidebar: (idx: number) => void;
  setPanelMode: (mode: string) => void;
  setPanelOpen: (open: boolean) => void;
  setActiveCampaign: (idx: number) => void;
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaigns,
  expandedCampaignSidebar,
  setExpandedCampaignSidebar,
  setPanelMode,
  setPanelOpen,
  setActiveCampaign,
}) => {
  return (
    <>
      <div style={{
        height: 56, minHeight: 56, borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
        background: "#f1f2f4",
      }}>
        <Target size={16} color={COLORS.accent} />
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>Campaigns</span>
        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</span>
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {campaigns.map((campaign, ci) => {
          const totalKeywords = campaign.adGroups.reduce((a: number, g: any) => a + g.keywords.length, 0);
          const statusStyles: Record<string, { bg: string; color: string }> = {
            draft: { bg: COLORS.amberDim, color: COLORS.amber },
            active: { bg: COLORS.greenDim, color: COLORS.green },
            paused: { bg: COLORS.bgCard, color: COLORS.textMuted },
          };
          const st = statusStyles[campaign.status] || statusStyles.draft;

          return (
            <div key={ci} style={{
              background: COLORS.bgCard, border: `1px solid ${expandedCampaignSidebar === ci ? COLORS.accent : COLORS.border}`,
              borderRadius: 10, marginBottom: 10, overflow: "hidden",
              transition: "border-color 0.15s ease",
            }}>
              {/* Campaign Header */}
              <div
                onClick={() => setExpandedCampaignSidebar(expandedCampaignSidebar === ci ? -1 : ci)}
                style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                <Target size={14} color={COLORS.accent} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{campaign.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                    {campaign.adGroups.length} ad groups · {totalKeywords} keywords
                  </div>
                </div>
                <span style={{
                  fontSize: 9, padding: "2px 8px", borderRadius: 10,
                  background: st.bg, color: st.color,
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{campaign.status}</span>
                <ChevronRight
                  size={14} color={COLORS.textMuted}
                  style={{ transform: expandedCampaignSidebar === ci ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}
                />
              </div>

              {/* Campaign Details */}
              {expandedCampaignSidebar === ci && (
                <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  {campaign.adGroups.map((ag: any, gi: number) => (
                    <div key={gi} style={{
                      padding: "10px 16px 10px 36px", display: "flex", alignItems: "center", gap: 8,
                      borderBottom: gi < campaign.adGroups.length - 1 ? `1px solid ${COLORS.borderSubtle}` : "none",
                    }}>
                      <Layers size={12} color={COLORS.accent} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{ag.name}</div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                          {ag.keywords.length} keywords · {ag.headlines.length} headlines · {ag.descriptions.length} descriptions
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Campaign Actions */}
                  <div style={{ padding: "10px 16px", display: "flex", gap: 6, borderTop: `1px solid ${COLORS.border}` }}>
                    <button
                      onClick={() => { setPanelMode("campaign"); setPanelOpen(true); setActiveCampaign(ci); }}
                      style={{
                        flex: 1, height: 30, borderRadius: 6, border: `1px solid ${COLORS.accent}`,
                        background: COLORS.accentDim, color: COLORS.accent, cursor: "pointer",
                        fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      }}
                    >
                      <PenTool size={11} /> Edit Campaign
                    </button>
                    <button
                      style={{
                        height: 30, padding: "0 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                        background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                        fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      <FileDown size={11} /> Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Create New Campaign */}
        <button style={{
          width: "100%", padding: "14px 16px", borderRadius: 10,
          border: `1px dashed ${COLORS.accent}`, background: COLORS.accentDim,
          color: COLORS.accent, cursor: "pointer", fontSize: 12, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Plus size={14} /> New Campaign
        </button>
      </div>
    </>
  );
};
