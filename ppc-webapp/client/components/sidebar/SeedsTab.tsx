import React from "react";
import { Hash, Plus, X, Search, Loader2, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { COLORS } from "../../constants";
import { MetricChip } from "../ui";

interface SeedsTabProps {
  seedKeywords: any[];
  setSeedKeywords: React.Dispatch<React.SetStateAction<any[]>>;
  newSeedInput: string;
  setNewSeedInput: (v: string) => void;
  apiLoading: boolean;
  handleLiveResearch: (seeds: string[]) => Promise<void>;
  setPanelMode: (mode: string) => void;
  setPanelOpen: (open: boolean) => void;
  market: any;
}

export const SeedsTab: React.FC<SeedsTabProps> = ({
  seedKeywords,
  setSeedKeywords,
  newSeedInput,
  setNewSeedInput,
  apiLoading,
  handleLiveResearch,
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
        <Hash size={16} color={COLORS.accent} />
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>Seed Keywords</span>
        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{seedKeywords.length} seeds</span>
        <div style={{ flex: 1 }} />
        <MetricChip icon={CheckCircle2} label="Researched" value={seedKeywords.filter(s => s.status === "researched").length} color={COLORS.green} small />
        <MetricChip icon={Clock} label="Pending" value={seedKeywords.filter(s => s.status === "pending").length} color={COLORS.amber} small />
      </div>

      {/* Add new seed */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{
          display: "flex", gap: 8,
          background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: "4px 4px 4px 12px",
        }}>
          <input
            value={newSeedInput}
            onChange={e => setNewSeedInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newSeedInput.trim()) {
                setSeedKeywords(prev => [...prev, {
                  id: Date.now(), keyword: newSeedInput.trim(), source: "manual",
                  addedAt: new Date(), status: "pending",
                }]);
                setNewSeedInput("");
              }
            }}
            placeholder="Add a seed keyword..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={() => {
              if (newSeedInput.trim()) {
                setSeedKeywords(prev => [...prev, {
                  id: Date.now(), keyword: newSeedInput.trim(), source: "manual",
                  addedAt: new Date(), status: "pending",
                }]);
                setNewSeedInput("");
              }
            }}
            style={{
              height: 32, padding: "0 12px", borderRadius: 6, border: "none",
              background: newSeedInput.trim() ? COLORS.accent : COLORS.bgCard,
              color: newSeedInput.trim() ? "#fff" : COLORS.textMuted,
              cursor: newSeedInput.trim() ? "pointer" : "default",
              fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* Seed list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {seedKeywords.map((seed) => {
          const sourceStyles: Record<string, { bg: string; color: string; label: string }> = {
            manual: { bg: COLORS.bgCard, color: COLORS.textMuted, label: "Manual" },
            "ai-suggested": { bg: COLORS.purpleDim, color: COLORS.purple, label: "AI" },
            competitor: { bg: COLORS.redDim, color: COLORS.red, label: "Competitor" },
          };
          const src = sourceStyles[seed.source] || sourceStyles.manual;
          return (
            <div
              key={seed.id}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                borderBottom: `1px solid ${COLORS.borderSubtle}`, cursor: "pointer",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.bgHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: seed.status === "researched" ? COLORS.green : COLORS.amber,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{seed.keyword}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
                  Added {seed.addedAt.toLocaleDateString()}
                </div>
              </div>
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                background: src.bg, color: src.color, textTransform: "uppercase",
                letterSpacing: "0.04em", fontFamily: "'JetBrains Mono', monospace",
              }}>{src.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSeedKeywords(prev => prev.filter(s => s.id !== seed.id));
                }}
                style={{
                  width: 24, height: 24, borderRadius: 4, border: "none",
                  background: "transparent", color: COLORS.textMuted, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Seed Actions */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8 }}>
        <button
          disabled={apiLoading}
          onClick={async () => {
            const pendingSeeds = seedKeywords.filter(s => s.status === "pending").map(s => s.keyword);
            const allSeeds = seedKeywords.map(s => s.keyword);
            const seeds = pendingSeeds.length > 0 ? allSeeds : allSeeds;
            await handleLiveResearch(seeds);
            setSeedKeywords(prev => prev.map(s => ({ ...s, status: "researched" })));
          }}
          style={{
            flex: 1, height: 36, borderRadius: 8, border: "none",
            background: apiLoading ? COLORS.bgActive : COLORS.accent, color: apiLoading ? COLORS.textMuted : "#fff",
            cursor: apiLoading ? "wait" : "pointer",
            fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {apiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={13} />}
          {apiLoading ? "Researching..." : "Research All Pending"}
        </button>
        <button
          onClick={() => {
            const pending = seedKeywords.filter(s => s.status === "pending");
            if (pending.length > 0) {
              setPanelMode("table");
              setPanelOpen(true);
            }
          }}
          style={{
            height: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.textSecondary, cursor: "pointer",
            fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <ArrowRight size={13} /> View in Table
        </button>
      </div>
    </>
  );
};
