import React from "react";
import { COLORS } from "../../constants";

export interface VisualPanelProps {
  keywords: any[];
}

export default function VisualPanel({ keywords }: VisualPanelProps) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      <div style={{
        background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
        borderRadius: 10, padding: 20, height: "calc(100% - 32px)", position: "relative",
      }}>
        {/* Axes */}
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "rotate(-90deg) translateX(50%)", fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Search Volume →
        </div>
        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Competition →
        </div>

        {/* Opportunity Zone */}
        <div style={{
          position: "absolute", top: 20, left: 40, width: "40%", height: "45%",
          background: "rgba(20,184,166,0.04)", border: `1px dashed rgba(20,184,166,0.2)`,
          borderRadius: 8, display: "flex", alignItems: "flex-start", justifyContent: "flex-start",
          padding: 8,
        }}>
          <span style={{ fontSize: 9, color: COLORS.accent, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ★ Opportunity Zone
          </span>
        </div>

        {/* Data Points */}
        {keywords.map((kw, i) => {
          const maxVol = 2400;
          const yRaw = 85 - (kw.volume / maxVol) * 70;
          const size = Math.max(8, Math.min(24, kw.cpc * 4));
          const intentColor = {
            transactional: COLORS.green,
            commercial: COLORS.accent,
            informational: COLORS.purple,
            navigational: COLORS.amber,
          }[kw.intent as string] as string;

          return (
            <div
              key={i}
              title={`${kw.keyword}\nVol: ${kw.volume} | CPC: £${kw.cpc} | Comp: ${kw.competition}`}
              style={{
                position: "absolute",
                left: `${10 + (kw.competition / 0.45) * 75}%`,
                top: `${yRaw}%`,
                width: size, height: size, borderRadius: "50%",
                background: intentColor,
                opacity: kw.group === "high-opportunity" ? 0.9 : 0.5,
                border: kw.group === "high-opportunity" ? `2px solid ${COLORS.amber}` : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: kw.group === "high-opportunity" ? `0 0 10px rgba(217,119,6,0.35)` : "none",
              }}
            />
          );
        })}

        {/* Legend */}
        <div style={{
          position: "absolute", bottom: 24, right: 16,
          display: "flex", gap: 12, fontSize: 10, color: COLORS.textMuted,
        }}>
          {[
            { color: COLORS.green, label: "Transactional" },
            { color: COLORS.accent, label: "Commercial" },
            { color: COLORS.purple, label: "Informational" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", border: `2px solid ${COLORS.amber}`, background: "transparent" }} />
            <span>High Opportunity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
