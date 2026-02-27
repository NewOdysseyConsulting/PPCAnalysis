import React from "react";
import { COLORS } from "../../constants";

// ── Metric Chip ──
export const MetricChip = ({ icon: Icon, label, value, color = COLORS.text, small }: { icon: any; label: any; value: any; color?: string; small?: any }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: small ? 4 : 6,
    background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
    borderRadius: 6, padding: small ? "3px 8px" : "5px 10px",
  }}>
    {Icon && <Icon size={small ? 11 : 13} color={COLORS.textMuted} />}
    <span style={{ fontSize: small ? 10 : 11, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    <span style={{ fontSize: small ? 11 : 12, color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
  </div>
);
