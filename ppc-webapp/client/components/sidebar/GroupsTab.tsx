import React from "react";
import { Bookmark, ChevronRight, Tag, Table2, Target, FolderPlus } from "lucide-react";
import { COLORS } from "../../constants";
import { IntentBadge, MetricChip } from "../ui";

interface GroupsTabProps {
  savedGroups: any[];
  expandedGroup: number | null;
  setExpandedGroup: (id: number | null) => void;
  setPanelMode: (mode: string) => void;
  setPanelOpen: (open: boolean) => void;
  market: any;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({
  savedGroups,
  expandedGroup,
  setExpandedGroup,
  setPanelMode,
  setPanelOpen,
  market,
}) => {
  return (
    <>
      <div style={{
        height: 56, minHeight: 56, borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
        background: "#f1f2f4",
      }}>
        <Bookmark size={16} color={COLORS.accent} />
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>Saved Groups</span>
        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{savedGroups.length} groups</span>
        <div style={{ flex: 1 }} />
        <MetricChip icon={Tag} label="Keywords" value={savedGroups.reduce((a, g) => a + g.keywords.length, 0)} color={COLORS.accent} small />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {savedGroups.map((group) => (
          <div key={group.id} style={{
            background: COLORS.bgCard, border: `1px solid ${expandedGroup === group.id ? COLORS.accent : COLORS.border}`,
            borderRadius: 10, marginBottom: 10, overflow: "hidden",
            transition: "border-color 0.15s ease",
          }}>
            {/* Group Header */}
            <div
              onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
              style={{
                padding: "14px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 3, background: group.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{group.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{group.description}</div>
              </div>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 4,
                background: COLORS.accentDim, color: COLORS.accent,
                fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
              }}>{group.keywords.length} kw</span>
              <ChevronRight
                size={14} color={COLORS.textMuted}
                style={{ transform: expandedGroup === group.id ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}
              />
            </div>

            {/* Group Keywords */}
            {expandedGroup === group.id && (
              <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
                {group.keywords.map((kw: any, ki: number) => (
                  <div key={ki} style={{
                    padding: "8px 16px 8px 36px", display: "flex", alignItems: "center", gap: 8,
                    borderBottom: ki < group.keywords.length - 1 ? `1px solid ${COLORS.borderSubtle}` : "none",
                    fontSize: 12,
                  }}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{kw.keyword}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.textMuted }}>
                      {kw.volume.toLocaleString()}/mo
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.amber }}>
                      {market.currency}{kw.cpc.toFixed(2)}
                    </span>
                    <IntentBadge intent={kw.intent} />
                  </div>
                ))}
                {/* Group Actions */}
                <div style={{ padding: "10px 16px", display: "flex", gap: 6, borderTop: `1px solid ${COLORS.border}` }}>
                  <button
                    onClick={() => { setPanelMode("table"); setPanelOpen(true); }}
                    style={{
                      flex: 1, height: 30, borderRadius: 6, border: `1px solid ${COLORS.border}`,
                      background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
                      fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}
                  >
                    <Table2 size={11} /> View in Table
                  </button>
                  <button
                    onClick={() => { setPanelMode("campaign"); setPanelOpen(true); }}
                    style={{
                      flex: 1, height: 30, borderRadius: 6, border: `1px solid ${COLORS.accent}`,
                      background: COLORS.accentDim, color: COLORS.accent, cursor: "pointer",
                      fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}
                  >
                    <Target size={11} /> Build Campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Create New Group */}
        <button style={{
          width: "100%", padding: "14px 16px", borderRadius: 10,
          border: `1px dashed ${COLORS.accent}`, background: COLORS.accentDim,
          color: COLORS.accent, cursor: "pointer", fontSize: 12, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <FolderPlus size={14} /> Create New Group
        </button>
      </div>
    </>
  );
};
