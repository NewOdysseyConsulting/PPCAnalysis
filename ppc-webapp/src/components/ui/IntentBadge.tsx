import React from "react";
import { COLORS } from "../../constants";

// ── Intent Badge ──
export const IntentBadge = ({ intent }: { intent: string }) => {
  const map = {
    transactional: { bg: COLORS.greenDim, color: COLORS.green, label: "Transactional" },
    commercial: { bg: COLORS.accentDim, color: COLORS.accent, label: "Commercial" },
    informational: { bg: COLORS.purpleDim, color: COLORS.purple, label: "Informational" },
    navigational: { bg: COLORS.amberDim, color: COLORS.amber, label: "Navigational" },
  };
  const style = map[intent as keyof typeof map] || map.informational;
  return (
    <span style={{
      fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
      background: style.bg, color: style.color, padding: "2px 7px", borderRadius: 4,
      letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{style.label}</span>
  );
};
