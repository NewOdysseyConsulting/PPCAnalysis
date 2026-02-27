import React, { useState, useMemo } from "react";
import { COLORS } from "../../constants";
import {
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  BarChart3,
  List,
  GanttChart,
  CheckCircle2,
  Circle,
  X,
  Globe,
  Search,
  Flag,
  Zap,
  Settings,
} from "lucide-react";

// ── Local Types ──

type SearchChannel = "google-ads" | "bing-ads";
type PhaseGate = "awareness" | "consideration" | "conversion" | "retention";

interface TimelineMilestone {
  id: string;
  name: string;
  date: string;
  type: "launch" | "review" | "optimization" | "expansion" | "test";
  completed: boolean;
  notes: string;
}

interface SeasonalAdjustment {
  month: number;
  budgetMultiplier: number;
  reason: string;
}

interface TimelinePhase {
  id: string;
  name: string;
  gate: PhaseGate;
  startDate: string;
  endDate: string;
  color: string;
  markets: string[];
  channels: SearchChannel[];
  campaignIds: string[];
  monthlyBudget: number;
  milestones: TimelineMilestone[];
  seasonalAdjustments: SeasonalAdjustment[];
}

interface CampaignTimeline {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  phases: TimelinePhase[];
  totalBudget: number;
}

interface TimelinePanelProps {
  timeline: CampaignTimeline;
  setTimeline: (t: CampaignTimeline) => void;
  market: any;
}

// ── Shared Styles ──

const cardStyle: React.CSSProperties = {
  background: COLORS.bgCard,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: COLORS.textMuted,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: "'JetBrains Mono', monospace",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 32,
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.bgElevated,
  color: COLORS.text,
  padding: "0 10px",
  fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  boxSizing: "border-box" as const,
};

const accentBtn: React.CSSProperties = {
  border: `1px solid ${COLORS.accent}`,
  background: COLORS.accentDim,
  color: COLORS.accent,
  fontWeight: 600,
  fontSize: 11,
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const ghostBtn: React.CSSProperties = {
  border: `1px dashed ${COLORS.border}`,
  background: "transparent",
  color: COLORS.textMuted,
  fontSize: 11,
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const dangerBtn: React.CSSProperties = {
  border: `1px solid ${COLORS.red}`,
  background: COLORS.redDim,
  color: COLORS.red,
  fontWeight: 600,
  fontSize: 11,
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  paddingRight: 28,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238b8fa3' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
};

const monoFont: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const sansFont: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

// ── Constants ──

const COUNTRIES = [
  { code: "GB", flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom" },
  { code: "US", flag: "\u{1F1FA}\u{1F1F8}", name: "United States" },
  { code: "DE", flag: "\u{1F1E9}\u{1F1EA}", name: "Germany" },
  { code: "AU", flag: "\u{1F1E6}\u{1F1FA}", name: "Australia" },
  { code: "CA", flag: "\u{1F1E8}\u{1F1E6}", name: "Canada" },
  { code: "FR", flag: "\u{1F1EB}\u{1F1F7}", name: "France" },
];

const GATES: Record<PhaseGate, { label: string; bg: string; fg: string }> = {
  awareness: { label: "Awareness", bg: COLORS.purpleDim, fg: COLORS.purple },
  consideration: { label: "Consideration", bg: COLORS.amberDim, fg: COLORS.amber },
  conversion: { label: "Conversion", bg: COLORS.greenDim, fg: COLORS.green },
  retention: { label: "Retention", bg: COLORS.accentDim, fg: COLORS.accent },
};

const MS_TYPES: Record<string, { label: string; color: string }> = {
  launch: { label: "Launch", color: COLORS.green },
  review: { label: "Review", color: COLORS.amber },
  optimization: { label: "Optimization", color: COLORS.accent },
  expansion: { label: "Expansion", color: COLORS.purple },
  test: { label: "Test", color: COLORS.red },
};

const PRESET_COLORS = [
  COLORS.accent, COLORS.purple, COLORS.amber, COLORS.green, COLORS.red,
  "#3b82f6", "#ec4899", "#f97316", "#06b6d4", "#8b5cf6",
];

const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Helpers ──

function cloneTimeline(t: CampaignTimeline): CampaignTimeline {
  return JSON.parse(JSON.stringify(t));
}

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function pctLeft(date: string, start: string, total: number): number {
  return Math.max(0, Math.min(100, ((daysBetween(start, date) - 1) / total) * 100));
}

function pctWidth(a: string, b: string, total: number): number {
  return Math.max(1, (daysBetween(a, b) / total) * 100);
}

function getGridlines(startDate: string, endDate: string) {
  const total = daysBetween(startDate, endDate);
  const end = new Date(endDate);
  const lines: { label: string; pct: number }[] = [];
  const cur = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 1);
  while (cur <= end) {
    const p = ((daysBetween(startDate, cur.toISOString().split("T")[0]) - 1) / total) * 100;
    if (p > 0 && p < 100) lines.push({ label: MO[cur.getMonth()], pct: p });
    cur.setMonth(cur.getMonth() + 1);
  }
  return lines;
}

function getMonthRange(startDate: string, endDate: string) {
  const end = new Date(endDate);
  const months: { month: number; year: number; label: string }[] = [];
  const cur = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth(), 1);
  while (cur <= end) {
    months.push({ month: cur.getMonth() + 1, year: cur.getFullYear(), label: `${MO[cur.getMonth()]} ${cur.getFullYear()}` });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function fmtCurrency(v: number, c: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(v);
}

function makePhase(): TimelinePhase {
  const today = new Date();
  const end = new Date(today);
  end.setMonth(end.getMonth() + 3);
  return {
    id: crypto.randomUUID(),
    name: "New Phase",
    gate: "awareness",
    startDate: today.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    color: COLORS.accent,
    markets: ["GB"],
    channels: ["google-ads"],
    campaignIds: [],
    monthlyBudget: 1000,
    milestones: [],
    seasonalAdjustments: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      budgetMultiplier: 1.0,
      reason: "",
    })),
  };
}

function makeMilestone(date: string): TimelineMilestone {
  return { id: crypto.randomUUID(), name: "New Milestone", date, type: "review", completed: false, notes: "" };
}

// ── Component ──

export default function TimelinePanel({ timeline, setTimeline, market }: TimelinePanelProps) {
  const [viewMode, setViewMode] = useState<"gantt" | "list">("gantt");
  const [selId, setSelId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>({
    editor: true, milestones: true, seasonal: false, marketSeq: false, budgetChart: true,
  });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const currency = market?.currency || "USD";
  const selPhase = timeline.phases.find((p) => p.id === selId) || null;
  const totalDays = daysBetween(timeline.startDate, timeline.endDate);

  const gl = useMemo(
    () => getGridlines(timeline.startDate, timeline.endDate),
    [timeline.startDate, timeline.endDate],
  );
  const mr = useMemo(
    () => getMonthRange(timeline.startDate, timeline.endDate),
    [timeline.startDate, timeline.endDate],
  );

  const toggleSection = (k: string) => setSections((s) => ({ ...s, [k]: !s[k] }));

  // ── Mutation helpers ──

  function updateTimeline(patch: Partial<CampaignTimeline>) {
    setTimeline({ ...cloneTimeline(timeline), ...patch });
  }

  function updatePhase(pid: string, patch: Partial<TimelinePhase>) {
    const next = cloneTimeline(timeline);
    const idx = next.phases.findIndex((p) => p.id === pid);
    if (idx >= 0) next.phases[idx] = { ...next.phases[idx], ...patch };
    setTimeline(next);
  }

  function addPhase() {
    const next = cloneTimeline(timeline);
    const phase = makePhase();
    next.phases.push(phase);
    setTimeline(next);
    setSelId(phase.id);
  }

  function removePhase(pid: string) {
    const next = cloneTimeline(timeline);
    next.phases = next.phases.filter((p) => p.id !== pid);
    setTimeline(next);
    if (selId === pid) setSelId(null);
    setConfirmDel(null);
  }

  function addMilestone(pid: string) {
    const next = cloneTimeline(timeline);
    const ph = next.phases.find((p) => p.id === pid);
    if (ph) ph.milestones.push(makeMilestone(ph.startDate));
    setTimeline(next);
  }

  function updateMilestone(pid: string, mid: string, patch: Partial<TimelineMilestone>) {
    const next = cloneTimeline(timeline);
    const ph = next.phases.find((p) => p.id === pid);
    if (ph) {
      const i = ph.milestones.findIndex((m) => m.id === mid);
      if (i >= 0) ph.milestones[i] = { ...ph.milestones[i], ...patch };
    }
    setTimeline(next);
  }

  function removeMilestone(pid: string, mid: string) {
    const next = cloneTimeline(timeline);
    const ph = next.phases.find((p) => p.id === pid);
    if (ph) ph.milestones = ph.milestones.filter((m) => m.id !== mid);
    setTimeline(next);
  }

  function updateSeasonal(pid: string, month: number, mult: number) {
    const next = cloneTimeline(timeline);
    const ph = next.phases.find((p) => p.id === pid);
    if (ph) {
      const adj = ph.seasonalAdjustments.find((a) => a.month === month);
      if (adj) adj.budgetMultiplier = mult;
    }
    setTimeline(next);
  }

  function applyPreset(pid: string, preset: "q4" | "summer" | "even") {
    const next = cloneTimeline(timeline);
    const ph = next.phases.find((p) => p.id === pid);
    if (!ph) return;
    ph.seasonalAdjustments.forEach((a) => {
      if (preset === "even") {
        a.budgetMultiplier = 1.0;
        a.reason = "";
      } else if (preset === "q4") {
        a.budgetMultiplier = [10, 11, 12].includes(a.month) ? 1.5 : 1.0;
        a.reason = [10, 11, 12].includes(a.month) ? "Q4 push" : "";
      } else {
        a.budgetMultiplier = [6, 7, 8].includes(a.month) ? 0.7 : 1.0;
        a.reason = [6, 7, 8].includes(a.month) ? "Summer slowdown" : "";
      }
    });
    setTimeline(next);
  }

  // ── Budget chart data ──

  const budgetData = useMemo(() => {
    return mr.map(({ month, year, label }) => {
      let total = 0;
      for (const ph of timeline.phases) {
        const ps = new Date(ph.startDate), pe = new Date(ph.endDate);
        const ms = new Date(year, month - 1, 1), me = new Date(year, month, 0);
        if (ps <= me && pe >= ms) {
          const adj = ph.seasonalAdjustments.find((x) => x.month === month);
          total += ph.monthlyBudget * (adj?.budgetMultiplier ?? 1.0);
        }
      }
      return { label, total };
    });
  }, [timeline.phases, mr]);

  const maxBudget = Math.max(1, ...budgetData.map((b) => b.total));

  // ── Section header sub-component ──

  function SecHead({ label, sk, icon }: { label: string; sk: string; icon: React.ReactNode }) {
    return (
      <div
        onClick={() => toggleSection(sk)}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 0", userSelect: "none" }}
      >
        {sections[sk] ? <ChevronDown size={14} color={COLORS.textMuted} /> : <ChevronRight size={14} color={COLORS.textMuted} />}
        {icon}
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, ...sansFont }}>{label}</span>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // 1. Timeline Header
  // ═══════════════════════════════════════════

  function renderHeader() {
    return (
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 200 }}>
          <Calendar size={18} color={COLORS.accent} />
          {editingName ? (
            <input
              autoFocus
              value={timeline.name}
              onChange={(e) => updateTimeline({ name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              style={{ ...inputStyle, width: 240, fontSize: 15, fontWeight: 700 }}
            />
          ) : (
            <span
              onClick={() => setEditingName(true)}
              style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, ...sansFont, cursor: "pointer", borderBottom: `1px dashed ${COLORS.border}`, paddingBottom: 1 }}
            >
              {timeline.name}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ ...labelStyle, fontSize: 11 }}>
            {timeline.startDate} &mdash; {timeline.endDate}
          </span>
          <span style={{ ...monoFont, fontSize: 13, fontWeight: 700, color: COLORS.accent, background: COLORS.accentDim, padding: "4px 10px", borderRadius: 6 }}>
            {fmtCurrency(timeline.totalBudget, currency)}
          </span>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 2, background: COLORS.bgCard, borderRadius: 6, border: `1px solid ${COLORS.border}`, padding: 2 }}>
            {(["gantt", "list"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  ...ghostBtn,
                  border: "none",
                  background: viewMode === m ? COLORS.bgElevated : "transparent",
                  color: viewMode === m ? COLORS.accent : COLORS.textMuted,
                  fontWeight: viewMode === m ? 700 : 400,
                  borderRadius: 4,
                  padding: "4px 10px",
                }}
              >
                {m === "gantt" ? <GanttChart size={13} /> : <List size={13} />}
                {m === "gantt" ? "Gantt" : "List"}
              </button>
            ))}
          </div>

          <button onClick={addPhase} style={accentBtn}>
            <Plus size={13} /> Add Phase
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // 2. Gantt View
  // ═══════════════════════════════════════════

  function renderGanttView() {
    return (
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {/* Month header */}
        <div style={{ position: "relative", height: 28, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgCard }}>
          <span style={{ position: "absolute", left: 4, top: 6, ...labelStyle, fontSize: 9 }}>
            {MO[new Date(timeline.startDate).getMonth()]}
          </span>
          {gl.map((g, i) => (
            <span key={i} style={{ position: "absolute", left: `${g.pct}%`, top: 6, transform: "translateX(-50%)", ...labelStyle, fontSize: 9 }}>
              {g.label}
            </span>
          ))}
        </div>

        {/* Phase rows */}
        <div style={{ padding: "8px 0" }}>
          {timeline.phases.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: COLORS.textMuted, fontSize: 12, ...sansFont }}>
              No phases yet. Click "Add Phase" to get started.
            </div>
          )}

          {timeline.phases.map((phase) => {
            const left = pctLeft(phase.startDate, timeline.startDate, totalDays);
            const width = pctWidth(phase.startDate, phase.endDate, totalDays);
            const isSel = selId === phase.id;
            const gate = GATES[phase.gate];

            return (
              <div
                key={phase.id}
                onClick={() => setSelId(isSel ? null : phase.id)}
                style={{
                  position: "relative", height: 48, margin: "4px 0", cursor: "pointer",
                  background: isSel ? COLORS.bgHover : "transparent", borderRadius: 6,
                }}
              >
                {/* Vertical gridlines */}
                {gl.map((g, i) => (
                  <div key={i} style={{ position: "absolute", left: `${g.pct}%`, top: 0, bottom: 0, width: 1, background: COLORS.borderSubtle, pointerEvents: "none" }} />
                ))}

                {/* Phase bar */}
                <div style={{
                  position: "absolute", left: `${left}%`, width: `${width}%`, top: 6, height: 36,
                  background: phase.color, borderRadius: 6, display: "flex", alignItems: "center",
                  gap: 6, padding: "0 10px", overflow: "hidden", minWidth: 40,
                  boxShadow: isSel ? `0 0 0 2px ${COLORS.bgElevated}, 0 0 0 4px ${phase.color}` : "none",
                  transition: "box-shadow 0.15s",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", ...sansFont, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {phase.name}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.25)", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", textTransform: "uppercase", ...monoFont, letterSpacing: "0.04em", flexShrink: 0 }}>
                    {gate.label}
                  </span>
                  {phase.markets.map((code) => {
                    const c = COUNTRIES.find((o) => o.code === code);
                    return c ? <span key={code} style={{ fontSize: 12, flexShrink: 0 }} title={c.name}>{c.flag}</span> : null;
                  })}
                  {phase.channels.includes("google-ads") && (
                    <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(255,255,255,0.3)", color: "#fff", padding: "2px 5px", borderRadius: 3, ...monoFont, flexShrink: 0 }}>G</span>
                  )}
                  {phase.channels.includes("bing-ads") && (
                    <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(255,255,255,0.3)", color: "#fff", padding: "2px 5px", borderRadius: 3, ...monoFont, flexShrink: 0 }}>B</span>
                  )}
                </div>

                {/* Milestone diamonds */}
                {phase.milestones.map((ms) => {
                  const mLeft = pctLeft(ms.date, timeline.startDate, totalDays);
                  const mColor = MS_TYPES[ms.type]?.color || COLORS.textMuted;
                  return (
                    <div
                      key={ms.id}
                      title={`${ms.name} (${ms.type})${ms.completed ? " - Done" : ""}`}
                      style={{
                        position: "absolute", left: `${mLeft}%`, top: 16,
                        transform: "translateX(-50%) rotate(45deg)",
                        width: 10, height: 10,
                        background: ms.completed ? mColor : "transparent",
                        border: `2px solid ${mColor}`, borderRadius: 2,
                        zIndex: 2, pointerEvents: "none",
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // 3. List View
  // ═══════════════════════════════════════════

  function renderListView() {
    const cols = ["Name", "Gate", "Start", "End", "Markets", "Channels", "Budget", "Milestones"];
    return (
      <div style={{ ...cardStyle, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, ...sansFont }}>
          <thead>
            <tr>
              {cols.map((h) => (
                <th key={h} style={{ ...labelStyle, padding: "10px 12px", textAlign: "left", background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeline.phases.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 32, color: COLORS.textMuted }}>
                  No phases yet.
                </td>
              </tr>
            )}
            {timeline.phases.map((phase) => {
              const gate = GATES[phase.gate];
              const isSel = selId === phase.id;
              return (
                <tr
                  key={phase.id}
                  onClick={() => setSelId(isSel ? null : phase.id)}
                  style={{ cursor: "pointer", background: isSel ? COLORS.bgHover : "transparent", borderBottom: `1px solid ${COLORS.borderSubtle}` }}
                >
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.text }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: phase.color, flexShrink: 0 }} />
                      {phase.name}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: gate.bg, color: gate.fg, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, ...monoFont, textTransform: "uppercase" }}>
                      {gate.label}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", ...monoFont, fontSize: 11, color: COLORS.textSecondary }}>{phase.startDate}</td>
                  <td style={{ padding: "10px 12px", ...monoFont, fontSize: 11, color: COLORS.textSecondary }}>{phase.endDate}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {phase.markets.map((code) => { const c = COUNTRIES.find((o) => o.code === code); return c ? <span key={code} title={c.name}>{c.flag}</span> : null; })}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {phase.channels.map((ch) => (
                        <span key={ch} style={{ fontSize: 9, fontWeight: 600, background: COLORS.bgHover, color: COLORS.textSecondary, padding: "2px 6px", borderRadius: 3, ...monoFont }}>
                          {ch === "google-ads" ? "Google" : "Bing"}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", ...monoFont, fontSize: 11, fontWeight: 600, color: COLORS.text }}>
                    {fmtCurrency(phase.monthlyBudget, currency)}/mo
                  </td>
                  <td style={{ padding: "10px 12px", ...monoFont, fontSize: 11, color: COLORS.textSecondary }}>
                    {phase.milestones.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // 4. Phase Editor
  // ═══════════════════════════════════════════

  function renderPhaseEditor() {
    if (!selPhase) return null;
    const ph = selPhase;

    return (
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 16 }}>
        <SecHead label="Phase Editor" sk="editor" icon={<Settings size={14} color={COLORS.accent} />} />

        {sections.editor && (
          <>
            {/* Name + Gate + Color */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px auto", gap: 12 }}>
              <div>
                <div style={{ ...labelStyle, marginBottom: 4 }}>Phase Name</div>
                <input value={ph.name} onChange={(e) => updatePhase(ph.id, { name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ ...labelStyle, marginBottom: 4 }}>Gate</div>
                <select value={ph.gate} onChange={(e) => updatePhase(ph.id, { gate: e.target.value as PhaseGate })} style={selectStyle}>
                  <option value="awareness">Awareness</option>
                  <option value="consideration">Consideration</option>
                  <option value="conversion">Conversion</option>
                  <option value="retention">Retention</option>
                </select>
              </div>
              <div>
                <div style={{ ...labelStyle, marginBottom: 4 }}>Color</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {PRESET_COLORS.map((c) => (
                    <div
                      key={c}
                      onClick={() => updatePhase(ph.id, { color: c })}
                      style={{
                        width: 24, height: 24, borderRadius: 4, background: c, cursor: "pointer",
                        border: ph.color === c ? `2px solid ${COLORS.text}` : "2px solid transparent",
                        transition: "border-color 0.15s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Dates + Budget */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px", gap: 12 }}>
              <div>
                <div style={{ ...labelStyle, marginBottom: 4 }}>Start Date</div>
                <input type="date" value={ph.startDate} onChange={(e) => updatePhase(ph.id, { startDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ ...labelStyle, marginBottom: 4 }}>End Date</div>
                <input type="date" value={ph.endDate} onChange={(e) => updatePhase(ph.id, { endDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ ...labelStyle, marginBottom: 4 }}>Monthly Budget</div>
                <input type="number" min={0} step={100} value={ph.monthlyBudget} onChange={(e) => updatePhase(ph.id, { monthlyBudget: Number(e.target.value) || 0 })} style={{ ...inputStyle, ...monoFont }} />
              </div>
            </div>

            {/* Markets */}
            <div>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Markets</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COUNTRIES.map((co) => {
                  const on = ph.markets.includes(co.code);
                  return (
                    <label
                      key={co.code}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                        padding: "5px 10px", borderRadius: 6,
                        border: `1px solid ${on ? COLORS.accent : COLORS.border}`,
                        background: on ? COLORS.accentDim : "transparent",
                        fontSize: 12, ...sansFont,
                        color: on ? COLORS.accent : COLORS.textSecondary,
                        fontWeight: on ? 600 : 400, transition: "all 0.15s", userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox" checked={on}
                        onChange={() => updatePhase(ph.id, { markets: on ? ph.markets.filter((m) => m !== co.code) : [...ph.markets, co.code] })}
                        style={{ display: "none" }}
                      />
                      <span>{co.flag}</span>
                      <span>{co.code}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Channels */}
            <div>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Channels</div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["google-ads", "bing-ads"] as SearchChannel[]).map((ch) => {
                  const on = ph.channels.includes(ch);
                  return (
                    <button
                      key={ch}
                      onClick={() => updatePhase(ph.id, { channels: on ? ph.channels.filter((c) => c !== ch) : [...ph.channels, ch] })}
                      style={{
                        ...ghostBtn,
                        border: `1px solid ${on ? COLORS.accent : COLORS.border}`,
                        background: on ? COLORS.accentDim : "transparent",
                        color: on ? COLORS.accent : COLORS.textMuted,
                        fontWeight: on ? 600 : 400,
                      }}
                    >
                      <Search size={12} />
                      {ch === "google-ads" ? "Google Ads" : "Bing Ads"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delete */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {confirmDel === ph.id ? (
                <>
                  <span style={{ fontSize: 11, color: COLORS.red, alignSelf: "center", ...sansFont }}>Delete this phase?</span>
                  <button onClick={() => removePhase(ph.id)} style={dangerBtn}><Trash2 size={12} /> Confirm</button>
                  <button onClick={() => setConfirmDel(null)} style={ghostBtn}>Cancel</button>
                </>
              ) : (
                <button onClick={() => setConfirmDel(ph.id)} style={dangerBtn}><Trash2 size={12} /> Delete Phase</button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // 5. Milestones CRUD
  // ═══════════════════════════════════════════

  function renderMilestones() {
    if (!selPhase) return null;
    const ph = selPhase;

    return (
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
        <SecHead label={`Milestones (${ph.milestones.length})`} sk="milestones" icon={<Flag size={14} color={COLORS.amber} />} />

        {sections.milestones && (
          <>
            {ph.milestones.length === 0 && (
              <div style={{ color: COLORS.textMuted, fontSize: 12, ...sansFont, padding: "8px 0" }}>
                No milestones. Add one to mark key dates in this phase.
              </div>
            )}

            {ph.milestones.map((ms) => (
              <div key={ms.id} style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.borderSubtle}`, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 130px auto auto", gap: 8, alignItems: "end" }}>
                  <div>
                    <div style={{ ...labelStyle, marginBottom: 3 }}>Name</div>
                    <input value={ms.name} onChange={(e) => updateMilestone(ph.id, ms.id, { name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ ...labelStyle, marginBottom: 3 }}>Date</div>
                    <input type="date" value={ms.date} onChange={(e) => updateMilestone(ph.id, ms.id, { date: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ ...labelStyle, marginBottom: 3 }}>Type</div>
                    <select value={ms.type} onChange={(e) => updateMilestone(ph.id, ms.id, { type: e.target.value as TimelineMilestone["type"] })} style={selectStyle}>
                      {Object.entries(MS_TYPES).map(([val, conf]) => (
                        <option key={val} value={val}>{conf.label}</option>
                      ))}
                    </select>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, color: ms.completed ? COLORS.green : COLORS.textMuted, ...sansFont, paddingBottom: 6, userSelect: "none" }}>
                    <input type="checkbox" checked={ms.completed} onChange={() => updateMilestone(ph.id, ms.id, { completed: !ms.completed })} style={{ display: "none" }} />
                    {ms.completed ? <CheckCircle2 size={16} color={COLORS.green} /> : <Circle size={16} color={COLORS.textMuted} />}
                    Done
                  </label>
                  <button onClick={() => removeMilestone(ph.id, ms.id)} style={{ ...dangerBtn, padding: "4px 8px", marginBottom: 2 }} title="Remove milestone">
                    <X size={12} />
                  </button>
                </div>
                <div>
                  <div style={{ ...labelStyle, marginBottom: 3 }}>Notes</div>
                  <input value={ms.notes} onChange={(e) => updateMilestone(ph.id, ms.id, { notes: e.target.value })} placeholder="Optional notes..." style={{ ...inputStyle, color: COLORS.textSecondary }} />
                </div>
              </div>
            ))}

            <button onClick={() => addMilestone(ph.id)} style={ghostBtn}>
              <Plus size={12} /> Add Milestone
            </button>
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // 6. Seasonal Adjustments
  // ═══════════════════════════════════════════

  function renderSeasonal() {
    if (!selPhase) return null;
    const ph = selPhase;

    return (
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
        <SecHead label="Seasonal Adjustments" sk="seasonal" icon={<Zap size={14} color={COLORS.purple} />} />

        {sections.seasonal && (
          <>
            {/* Presets */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => applyPreset(ph.id, "q4")} style={ghostBtn}>Q4 Push</button>
              <button onClick={() => applyPreset(ph.id, "summer")} style={ghostBtn}>Summer Slowdown</button>
              <button onClick={() => applyPreset(ph.id, "even")} style={ghostBtn}>Even Split</button>
            </div>

            {/* 12-month grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {ph.seasonalAdjustments.map((adj) => {
                const highlighted = adj.budgetMultiplier !== 1.0;
                const isUp = adj.budgetMultiplier > 1.0;
                return (
                  <div
                    key={adj.month}
                    style={{
                      background: highlighted ? (isUp ? COLORS.greenDim : COLORS.amberDim) : COLORS.bgElevated,
                      border: `1px solid ${highlighted ? (isUp ? COLORS.green : COLORS.amber) : COLORS.borderSubtle}`,
                      borderRadius: 8, padding: "8px 10px",
                      display: "flex", flexDirection: "column", gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, ...sansFont }}>
                        {MO[adj.month - 1]}
                      </span>
                      <span style={{ ...monoFont, fontSize: 11, fontWeight: 700, color: highlighted ? (isUp ? COLORS.green : COLORS.amber) : COLORS.textSecondary }}>
                        {adj.budgetMultiplier.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range" min={0.5} max={2.0} step={0.1}
                      value={adj.budgetMultiplier}
                      onChange={(e) => updateSeasonal(ph.id, adj.month, parseFloat(e.target.value))}
                      style={{ width: "100%", cursor: "pointer", accentColor: COLORS.accent }}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // 7. Market Sequencing View
  // ═══════════════════════════════════════════

  function renderMarketSequencing() {
    return (
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
        <SecHead label="Market Sequencing" sk="marketSeq" icon={<Globe size={14} color={COLORS.accent} />} />

        {sections.marketSeq && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {COUNTRIES.map((co) => {
              const active = timeline.phases.filter((p) => p.markets.includes(co.code));
              return (
                <div key={co.code} style={{ display: "flex", alignItems: "center", gap: 12, height: 36 }}>
                  <div style={{ width: 80, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{co.flag}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, ...sansFont }}>{co.code}</span>
                  </div>
                  <div style={{ flex: 1, position: "relative", height: 24, background: COLORS.bgElevated, border: `1px solid ${COLORS.borderSubtle}`, borderRadius: 4, overflow: "hidden" }}>
                    {gl.map((g, i) => (
                      <div key={i} style={{ position: "absolute", left: `${g.pct}%`, top: 0, bottom: 0, width: 1, background: COLORS.borderSubtle, pointerEvents: "none" }} />
                    ))}
                    {active.map((ph) => (
                      <div
                        key={ph.id}
                        title={ph.name}
                        style={{
                          position: "absolute",
                          left: `${pctLeft(ph.startDate, timeline.startDate, totalDays)}%`,
                          width: `${pctWidth(ph.startDate, ph.endDate, totalDays)}%`,
                          top: 3, height: 18, background: ph.color, borderRadius: 3, opacity: 0.85,
                        }}
                      />
                    ))}
                    {active.length === 0 && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 10, ...sansFont }}>
                        No active phases
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // 8. Budget Over Time Chart
  // ═══════════════════════════════════════════

  function renderBudgetChart() {
    return (
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
        <SecHead label="Budget Over Time" sk="budgetChart" icon={<BarChart3 size={14} color={COLORS.green} />} />

        {sections.budgetChart && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160, padding: "0 4px", borderBottom: `1px solid ${COLORS.border}` }}>
              {budgetData.map((d, i) => {
                const hPct = maxBudget > 0 ? (d.total / maxBudget) * 100 : 0;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%", justifyContent: "flex-end" }}>
                    {d.total > 0 && (
                      <span style={{ fontSize: 8, ...monoFont, color: COLORS.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {fmtCurrency(d.total, currency)}
                      </span>
                    )}
                    <div style={{
                      width: "100%", maxWidth: 40, height: `${hPct}%`,
                      minHeight: d.total > 0 ? 4 : 0,
                      background: COLORS.accent, borderRadius: "4px 4px 0 0",
                      transition: "height 0.2s",
                    }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 4, padding: "0 4px" }}>
              {budgetData.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: COLORS.textMuted, ...monoFont, fontWeight: 600 }}>
                  {d.label.split(" ")[0]}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Main Layout
  // ═══════════════════════════════════════════

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {renderHeader()}
      {viewMode === "gantt" ? renderGanttView() : renderListView()}
      {renderPhaseEditor()}
      {selPhase && renderMilestones()}
      {selPhase && renderSeasonal()}
      {renderMarketSequencing()}
      {renderBudgetChart()}
    </div>
  );
}
