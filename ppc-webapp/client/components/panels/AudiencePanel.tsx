import React, { useState } from "react";
import { COLORS } from "../../constants";
import {
  Users, ChevronDown, ChevronRight, Plus, X, Sparkles, Building2, Globe,
  Cpu, AlertTriangle, Zap, UserCheck, DollarSign, Grid3X3, Tag, Search,
  FileText, Briefcase, Target,
} from "lucide-react";

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

interface AudiencePanelProps {
  icpProfiles: IcpProfile[];
  setIcpProfiles: (profiles: IcpProfile[]) => void;
  buyerPersonas: BuyerPersona[];
  setBuyerPersonas: (personas: BuyerPersona[]) => void;
  audienceSegments: AudienceSegment[];
  setAudienceSegments: (segments: AudienceSegment[]) => void;
  market: any;
  onGenerateIcp?: () => void;
  onGeneratePersona?: () => void;
}

// ── Shared Styles ──

const cardStyle: React.CSSProperties = {
  background: COLORS.bgCard,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  overflow: "hidden",
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
  boxSizing: "border-box",
};

const accentBtnStyle: React.CSSProperties = {
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

const ghostBtnStyle: React.CSSProperties = {
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

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
};

// ── Seniority Helpers ──

const SENIORITY_OPTIONS: { value: BuyerPersona["seniority"]; label: string }[] = [
  { value: "c-suite", label: "C-Suite" },
  { value: "director", label: "Director" },
  { value: "manager", label: "Manager" },
  { value: "individual-contributor", label: "IC" },
];

function seniorityColor(s: BuyerPersona["seniority"]): { bg: string; fg: string } {
  switch (s) {
    case "c-suite": return { bg: COLORS.purpleDim, fg: COLORS.purple };
    case "director": return { bg: COLORS.accentDim, fg: COLORS.accent };
    case "manager": return { bg: COLORS.amberDim, fg: COLORS.amber };
    case "individual-contributor": return { bg: COLORS.greenDim, fg: COLORS.green };
  }
}

function seniorityLabel(s: BuyerPersona["seniority"]): string {
  switch (s) {
    case "c-suite": return "C-Suite";
    case "director": return "Director";
    case "manager": return "Manager";
    case "individual-contributor": return "IC";
  }
}

// ── Clone Helpers ──

function cloneIcps(arr: IcpProfile[]): IcpProfile[] {
  return JSON.parse(JSON.stringify(arr));
}

function clonePersonas(arr: BuyerPersona[]): BuyerPersona[] {
  return JSON.parse(JSON.stringify(arr));
}

function cloneSegments(arr: AudienceSegment[]): AudienceSegment[] {
  return JSON.parse(JSON.stringify(arr));
}

// ── Tag List Component ──

function TagList({
  items,
  color = COLORS.accent,
  bgColor = COLORS.accentDim,
  onAdd,
  onRemove,
}: {
  items: string[];
  color?: string;
  bgColor?: string;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState("");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            borderRadius: 12,
            background: bgColor,
            color: color,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {item}
          <X
            size={10}
            style={{ cursor: "pointer", opacity: 0.7 }}
            onClick={() => onRemove(i)}
          />
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputVal.trim()) {
              onAdd(inputVal.trim());
              setInputVal("");
              setAdding(false);
            }
            if (e.key === "Escape") {
              setInputVal("");
              setAdding(false);
            }
          }}
          onBlur={() => {
            if (inputVal.trim()) onAdd(inputVal.trim());
            setInputVal("");
            setAdding(false);
          }}
          style={{
            ...inputStyle,
            width: 100,
            height: 26,
            fontSize: 11,
            borderRadius: 12,
          }}
          placeholder="Add..."
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            border: `1px dashed ${COLORS.border}`,
            background: "transparent",
            color: COLORS.textMuted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );
}

// ── Editable List Component ──

function EditableList({
  items,
  onUpdate,
  onRemove,
  onAdd,
  placeholder,
}: {
  items: string[];
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: (value: string) => void;
  placeholder: string;
}) {
  const [newVal, setNewVal] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
            style={{ ...inputStyle, flex: 1, height: 28, fontSize: 11 }}
          />
          <button
            onClick={() => onRemove(i)}
            style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 2 }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newVal.trim()) {
              onAdd(newVal.trim());
              setNewVal("");
            }
          }}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1, height: 28, fontSize: 11 }}
        />
        <button
          onClick={() => {
            if (newVal.trim()) {
              onAdd(newVal.trim());
              setNewVal("");
            }
          }}
          style={{ ...ghostBtnStyle, padding: "4px 8px", fontSize: 10 }}
        >
          <Plus size={10} /> Add
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function AudiencePanel({
  icpProfiles,
  setIcpProfiles,
  buyerPersonas,
  setBuyerPersonas,
  audienceSegments,
  setAudienceSegments,
  market,
  onGenerateIcp,
  onGeneratePersona,
}: AudiencePanelProps) {
  const [expandedIcp, setExpandedIcp] = useState<string | null>(null);
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  // ── ICP mutation helpers ──

  function updateIcp(id: string, mutator: (icp: IcpProfile) => void) {
    const draft = cloneIcps(icpProfiles);
    const idx = draft.findIndex((p) => p.id === id);
    if (idx >= 0) {
      mutator(draft[idx]);
      setIcpProfiles(draft);
    }
  }

  function addIcp() {
    const draft = cloneIcps(icpProfiles);
    const newIcp: IcpProfile = {
      id: crypto.randomUUID(),
      name: "New ICP Profile",
      companySize: { min: 50, max: 500, label: "Mid-Market" },
      industry: [],
      revenue: { min: 1000000, max: 50000000, currency: market?.currency || "USD" },
      geography: [],
      techStack: [],
      painPoints: [],
      buyingTriggers: [],
      decisionMakers: [],
      budgetRange: { min: 10000, max: 100000, currency: market?.currency || "USD" },
    };
    draft.push(newIcp);
    setIcpProfiles(draft);
    setExpandedIcp(newIcp.id);
  }

  function removeIcp(id: string) {
    setIcpProfiles(icpProfiles.filter((p) => p.id !== id));
    if (expandedIcp === id) setExpandedIcp(null);
  }

  // ── Persona mutation helpers ──

  function updatePersona(id: string, mutator: (p: BuyerPersona) => void) {
    const draft = clonePersonas(buyerPersonas);
    const idx = draft.findIndex((p) => p.id === id);
    if (idx >= 0) {
      mutator(draft[idx]);
      setBuyerPersonas(draft);
    }
  }

  function addPersona() {
    const draft = clonePersonas(buyerPersonas);
    const newPersona: BuyerPersona = {
      id: crypto.randomUUID(),
      name: "New Persona",
      title: "Title",
      department: "Department",
      seniority: "manager",
      goals: [],
      painPoints: [],
      objections: [],
      triggers: [],
      informationSources: [],
      decisionCriteria: [],
      searchBehavior: [],
      icpId: icpProfiles.length > 0 ? icpProfiles[0].id : "",
    };
    draft.push(newPersona);
    setBuyerPersonas(draft);
    setExpandedPersona(newPersona.id);
  }

  function removePersona(id: string) {
    setBuyerPersonas(buyerPersonas.filter((p) => p.id !== id));
    if (expandedPersona === id) setExpandedPersona(null);
  }

  // ── Segment mutation helpers ──

  function updateSegment(id: string, mutator: (s: AudienceSegment) => void) {
    const draft = cloneSegments(audienceSegments);
    const idx = draft.findIndex((s) => s.id === id);
    if (idx >= 0) {
      mutator(draft[idx]);
      setAudienceSegments(draft);
    }
  }

  function addSegment() {
    const draft = cloneSegments(audienceSegments);
    const newSeg: AudienceSegment = {
      id: crypto.randomUUID(),
      name: "New Segment",
      description: "",
      personaIds: [],
      size: 0,
      searchKeywords: [],
      contentTopics: [],
    };
    draft.push(newSeg);
    setAudienceSegments(draft);
    setExpandedSegment(newSeg.id);
  }

  function removeSegment(id: string) {
    setAudienceSegments(audienceSegments.filter((s) => s.id !== id));
    if (expandedSegment === id) setExpandedSegment(null);
  }

  // ── Build keyword-persona mapping data ──

  const allKeywords = Array.from(
    new Set(audienceSegments.flatMap((s) => s.searchKeywords))
  );

  const keywordPersonaMap: Record<string, string[]> = {};
  for (const seg of audienceSegments) {
    for (const kw of seg.searchKeywords) {
      if (!keywordPersonaMap[kw]) keywordPersonaMap[kw] = [];
      for (const pid of seg.personaIds) {
        if (!keywordPersonaMap[kw].includes(pid)) {
          keywordPersonaMap[kw].push(pid);
        }
      }
    }
  }

  // ── Render ──

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ═══════════════════════════════════════════════════════════
          Section 1: ICP Builder
         ═══════════════════════════════════════════════════════════ */}
      <div>
        <div style={sectionHeaderStyle}>
          <Building2 size={17} color={COLORS.accent} />
          <span>ICP Builder</span>
          <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>
            {icpProfiles.length} profile{icpProfiles.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {icpProfiles.map((icp) => {
            const isOpen = expandedIcp === icp.id;
            return (
              <div key={icp.id} style={{
                ...cardStyle,
                borderColor: isOpen ? COLORS.accent : COLORS.border,
                transition: "border-color 0.15s ease",
              }}>
                {/* ICP Header */}
                <div
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedIcp(isOpen ? null : icp.id)}
                >
                  {isOpen
                    ? <ChevronDown size={14} color={COLORS.textMuted} />
                    : <ChevronRight size={14} color={COLORS.textMuted} />
                  }
                  <Building2 size={14} color={COLORS.accent} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{icp.name}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
                      {icp.industry.length} industries &middot; {icp.geography.length} regions &middot; {icp.companySize.label}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeIcp(icp.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 2 }}
                    title="Remove ICP"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* ICP Expanded Content */}
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 16, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
                    {/* Name */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 4 }}>Profile Name</div>
                      <input
                        value={icp.name}
                        onChange={(e) => updateIcp(icp.id, (p) => { p.name = e.target.value; })}
                        style={inputStyle}
                      />
                    </div>

                    {/* Company Size */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Users size={10} /> Company Size
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ ...labelStyle, fontSize: 9, marginBottom: 2 }}>Min</div>
                          <input
                            type="number"
                            value={icp.companySize.min}
                            onChange={(e) => updateIcp(icp.id, (p) => { p.companySize.min = Number(e.target.value) || 0; })}
                            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                          />
                        </div>
                        <div>
                          <div style={{ ...labelStyle, fontSize: 9, marginBottom: 2 }}>Max</div>
                          <input
                            type="number"
                            value={icp.companySize.max}
                            onChange={(e) => updateIcp(icp.id, (p) => { p.companySize.max = Number(e.target.value) || 0; })}
                            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                          />
                        </div>
                        <div>
                          <div style={{ ...labelStyle, fontSize: 9, marginBottom: 2 }}>Label</div>
                          <input
                            value={icp.companySize.label}
                            onChange={(e) => updateIcp(icp.id, (p) => { p.companySize.label = e.target.value; })}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Industry */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Briefcase size={10} /> Industries
                        </span>
                      </div>
                      <TagList
                        items={icp.industry}
                        color={COLORS.purple}
                        bgColor={COLORS.purpleDim}
                        onAdd={(v) => updateIcp(icp.id, (p) => { p.industry.push(v); })}
                        onRemove={(i) => updateIcp(icp.id, (p) => { p.industry.splice(i, 1); })}
                      />
                    </div>

                    {/* Revenue Range */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <DollarSign size={10} /> Revenue Range ({icp.revenue.currency})
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ ...labelStyle, fontSize: 9, marginBottom: 2 }}>Min</div>
                          <input
                            type="number"
                            value={icp.revenue.min}
                            onChange={(e) => updateIcp(icp.id, (p) => { p.revenue.min = Number(e.target.value) || 0; })}
                            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                          />
                        </div>
                        <div>
                          <div style={{ ...labelStyle, fontSize: 9, marginBottom: 2 }}>Max</div>
                          <input
                            type="number"
                            value={icp.revenue.max}
                            onChange={(e) => updateIcp(icp.id, (p) => { p.revenue.max = Number(e.target.value) || 0; })}
                            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Geography */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Globe size={10} /> Geography
                        </span>
                      </div>
                      <TagList
                        items={icp.geography}
                        color={COLORS.accent}
                        bgColor={COLORS.accentDim}
                        onAdd={(v) => updateIcp(icp.id, (p) => { p.geography.push(v); })}
                        onRemove={(i) => updateIcp(icp.id, (p) => { p.geography.splice(i, 1); })}
                      />
                    </div>

                    {/* Tech Stack */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Cpu size={10} /> Tech Stack
                        </span>
                      </div>
                      <TagList
                        items={icp.techStack}
                        color={COLORS.amber}
                        bgColor={COLORS.amberDim}
                        onAdd={(v) => updateIcp(icp.id, (p) => { p.techStack.push(v); })}
                        onRemove={(i) => updateIcp(icp.id, (p) => { p.techStack.splice(i, 1); })}
                      />
                    </div>

                    {/* Pain Points */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={10} /> Pain Points
                        </span>
                      </div>
                      <EditableList
                        items={icp.painPoints}
                        onUpdate={(i, v) => updateIcp(icp.id, (p) => { p.painPoints[i] = v; })}
                        onRemove={(i) => updateIcp(icp.id, (p) => { p.painPoints.splice(i, 1); })}
                        onAdd={(v) => updateIcp(icp.id, (p) => { p.painPoints.push(v); })}
                        placeholder="Add pain point..."
                      />
                    </div>

                    {/* Buying Triggers */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Zap size={10} /> Buying Triggers
                        </span>
                      </div>
                      <EditableList
                        items={icp.buyingTriggers}
                        onUpdate={(i, v) => updateIcp(icp.id, (p) => { p.buyingTriggers[i] = v; })}
                        onRemove={(i) => updateIcp(icp.id, (p) => { p.buyingTriggers.splice(i, 1); })}
                        onAdd={(v) => updateIcp(icp.id, (p) => { p.buyingTriggers.push(v); })}
                        placeholder="Add trigger..."
                      />
                    </div>

                    {/* Decision Makers */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <UserCheck size={10} /> Decision Makers
                        </span>
                      </div>
                      <TagList
                        items={icp.decisionMakers}
                        color={COLORS.green}
                        bgColor={COLORS.greenDim}
                        onAdd={(v) => updateIcp(icp.id, (p) => { p.decisionMakers.push(v); })}
                        onRemove={(i) => updateIcp(icp.id, (p) => { p.decisionMakers.splice(i, 1); })}
                      />
                    </div>

                    {/* Budget Range */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <DollarSign size={10} /> Budget Range ({icp.budgetRange.currency})
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ ...labelStyle, fontSize: 9, marginBottom: 2 }}>Min</div>
                          <input
                            type="number"
                            value={icp.budgetRange.min}
                            onChange={(e) => updateIcp(icp.id, (p) => { p.budgetRange.min = Number(e.target.value) || 0; })}
                            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                          />
                        </div>
                        <div>
                          <div style={{ ...labelStyle, fontSize: 9, marginBottom: 2 }}>Max</div>
                          <input
                            type="number"
                            value={icp.budgetRange.max}
                            onChange={(e) => updateIcp(icp.id, (p) => { p.budgetRange.max = Number(e.target.value) || 0; })}
                            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Generate with AI */}
                    {onGenerateIcp && (
                      <button onClick={onGenerateIcp} style={{
                        ...accentBtnStyle,
                        justifyContent: "center",
                        padding: "10px 16px",
                        background: `linear-gradient(135deg, ${COLORS.accentDim}, ${COLORS.purpleDim})`,
                        border: `1px solid ${COLORS.accent}`,
                      }}>
                        <Sparkles size={13} /> Generate with AI
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* New ICP Button */}
        <button onClick={addIcp} style={{
          ...accentBtnStyle,
          width: "100%",
          justifyContent: "center",
          padding: "12px 16px",
          marginTop: 10,
          border: `1px dashed ${COLORS.accent}`,
          background: COLORS.accentDim,
        }}>
          <Plus size={14} /> New ICP
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Section 2: Buyer Persona Cards
         ═══════════════════════════════════════════════════════════ */}
      <div>
        <div style={sectionHeaderStyle}>
          <UserCheck size={17} color={COLORS.purple} />
          <span>Buyer Personas</span>
          <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>
            {buyerPersonas.length} persona{buyerPersonas.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {buyerPersonas.map((persona) => {
            const isOpen = expandedPersona === persona.id;
            const sc = seniorityColor(persona.seniority);

            return (
              <div key={persona.id} style={{
                ...cardStyle,
                borderColor: isOpen ? COLORS.purple : COLORS.border,
                transition: "border-color 0.15s ease",
              }}>
                {/* Persona Header */}
                <div
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedPersona(isOpen ? null : persona.id)}
                >
                  {isOpen
                    ? <ChevronDown size={14} color={COLORS.textMuted} />
                    : <ChevronRight size={14} color={COLORS.textMuted} />
                  }
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.accent})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    minWidth: 32,
                  }}>
                    {persona.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                      {persona.name}
                      <span style={{
                        fontSize: 9,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: sc.bg,
                        color: sc.fg,
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}>
                        {seniorityLabel(persona.seniority)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
                      {persona.title} &middot; {persona.department}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removePersona(persona.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 2 }}
                    title="Remove persona"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Persona Expanded Content */}
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
                    {/* Name / Title / Department */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Name</div>
                        <input
                          value={persona.name}
                          onChange={(e) => updatePersona(persona.id, (p) => { p.name = e.target.value; })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Title</div>
                        <input
                          value={persona.title}
                          onChange={(e) => updatePersona(persona.id, (p) => { p.title = e.target.value; })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Department</div>
                        <input
                          value={persona.department}
                          onChange={(e) => updatePersona(persona.id, (p) => { p.department = e.target.value; })}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Seniority Dropdown */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 4 }}>Seniority</div>
                      <select
                        value={persona.seniority}
                        onChange={(e) => updatePersona(persona.id, (p) => { p.seniority = e.target.value as BuyerPersona["seniority"]; })}
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          appearance: "auto",
                        }}
                      >
                        {SENIORITY_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Goals */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Target size={10} /> Goals
                        </span>
                      </div>
                      <TagList
                        items={persona.goals}
                        color={COLORS.green}
                        bgColor={COLORS.greenDim}
                        onAdd={(v) => updatePersona(persona.id, (p) => { p.goals.push(v); })}
                        onRemove={(i) => updatePersona(persona.id, (p) => { p.goals.splice(i, 1); })}
                      />
                    </div>

                    {/* Pain Points */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={10} /> Pain Points
                        </span>
                      </div>
                      <TagList
                        items={persona.painPoints}
                        color={COLORS.red}
                        bgColor={COLORS.redDim}
                        onAdd={(v) => updatePersona(persona.id, (p) => { p.painPoints.push(v); })}
                        onRemove={(i) => updatePersona(persona.id, (p) => { p.painPoints.splice(i, 1); })}
                      />
                    </div>

                    {/* Objections */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>Objections</div>
                      <EditableList
                        items={persona.objections}
                        onUpdate={(i, v) => updatePersona(persona.id, (p) => { p.objections[i] = v; })}
                        onRemove={(i) => updatePersona(persona.id, (p) => { p.objections.splice(i, 1); })}
                        onAdd={(v) => updatePersona(persona.id, (p) => { p.objections.push(v); })}
                        placeholder="Add objection..."
                      />
                    </div>

                    {/* Triggers */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Zap size={10} /> Triggers
                        </span>
                      </div>
                      <EditableList
                        items={persona.triggers}
                        onUpdate={(i, v) => updatePersona(persona.id, (p) => { p.triggers[i] = v; })}
                        onRemove={(i) => updatePersona(persona.id, (p) => { p.triggers.splice(i, 1); })}
                        onAdd={(v) => updatePersona(persona.id, (p) => { p.triggers.push(v); })}
                        placeholder="Add trigger..."
                      />
                    </div>

                    {/* Information Sources */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <FileText size={10} /> Information Sources
                        </span>
                      </div>
                      <TagList
                        items={persona.informationSources}
                        color={COLORS.accent}
                        bgColor={COLORS.accentDim}
                        onAdd={(v) => updatePersona(persona.id, (p) => { p.informationSources.push(v); })}
                        onRemove={(i) => updatePersona(persona.id, (p) => { p.informationSources.splice(i, 1); })}
                      />
                    </div>

                    {/* Decision Criteria */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Tag size={10} /> Decision Criteria
                        </span>
                      </div>
                      <TagList
                        items={persona.decisionCriteria}
                        color={COLORS.amber}
                        bgColor={COLORS.amberDim}
                        onAdd={(v) => updatePersona(persona.id, (p) => { p.decisionCriteria.push(v); })}
                        onRemove={(i) => updatePersona(persona.id, (p) => { p.decisionCriteria.splice(i, 1); })}
                      />
                    </div>

                    {/* Search Behavior */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Search size={10} /> Search Behavior
                        </span>
                      </div>
                      <EditableList
                        items={persona.searchBehavior}
                        onUpdate={(i, v) => updatePersona(persona.id, (p) => { p.searchBehavior[i] = v; })}
                        onRemove={(i) => updatePersona(persona.id, (p) => { p.searchBehavior.splice(i, 1); })}
                        onAdd={(v) => updatePersona(persona.id, (p) => { p.searchBehavior.push(v); })}
                        placeholder="Add search behavior..."
                      />
                    </div>

                    {/* ICP Link */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 4 }}>Linked ICP Profile</div>
                      <select
                        value={persona.icpId}
                        onChange={(e) => updatePersona(persona.id, (p) => { p.icpId = e.target.value; })}
                        style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                      >
                        <option value="">-- None --</option>
                        {icpProfiles.map((icp) => (
                          <option key={icp.id} value={icp.id}>{icp.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Generate with AI */}
                    {onGeneratePersona && (
                      <button onClick={onGeneratePersona} style={{
                        ...accentBtnStyle,
                        justifyContent: "center",
                        padding: "10px 16px",
                        background: `linear-gradient(135deg, ${COLORS.purpleDim}, ${COLORS.accentDim})`,
                        border: `1px solid ${COLORS.purple}`,
                        color: COLORS.purple,
                      }}>
                        <Sparkles size={13} /> Generate with AI
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* New Persona Button */}
        <button onClick={addPersona} style={{
          ...accentBtnStyle,
          width: "100%",
          justifyContent: "center",
          padding: "12px 16px",
          marginTop: 10,
          border: `1px dashed ${COLORS.purple}`,
          background: COLORS.purpleDim,
          color: COLORS.purple,
        }}>
          <Plus size={14} /> New Persona
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Section 3: Audience Segments Table
         ═══════════════════════════════════════════════════════════ */}
      <div>
        <div style={sectionHeaderStyle}>
          <Grid3X3 size={17} color={COLORS.amber} />
          <span>Audience Segments</span>
          <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>
            {audienceSegments.length} segment{audienceSegments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 40px",
          gap: 8,
          padding: "8px 12px",
          background: COLORS.bgCard,
          borderRadius: "8px 8px 0 0",
          border: `1px solid ${COLORS.border}`,
          borderBottom: "none",
        }}>
          {["Name", "Description", "Personas", "Size", "Keywords", "Topics"].map((h) => (
            <div key={h} style={labelStyle}>{h}</div>
          ))}
          <div />
        </div>

        {/* Table Rows */}
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
          {audienceSegments.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>
              No segments yet. Click "New Segment" to add one.
            </div>
          )}
          {audienceSegments.map((seg, si) => {
            const isOpen = expandedSegment === seg.id;
            return (
              <div key={seg.id} style={{ borderBottom: si < audienceSegments.length - 1 ? `1px solid ${COLORS.borderSubtle}` : "none" }}>
                {/* Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 40px",
                    gap: 8,
                    padding: "10px 12px",
                    background: isOpen ? COLORS.bgHover : COLORS.bgElevated,
                    cursor: "pointer",
                    alignItems: "center",
                    transition: "background 0.1s ease",
                  }}
                  onClick={() => setExpandedSegment(isOpen ? null : seg.id)}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seg.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seg.description || "--"}</div>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>{seg.personaIds.length}</div>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>{seg.size.toLocaleString()}</div>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>{seg.searchKeywords.length}</div>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.text }}>{seg.contentTopics.length}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSegment(seg.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 2 }}
                    title="Remove segment"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Expanded Row */}
                {isOpen && (
                  <div style={{ padding: "12px 16px", background: COLORS.bgHover, display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${COLORS.borderSubtle}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Name</div>
                        <input
                          value={seg.name}
                          onChange={(e) => updateSegment(seg.id, (s) => { s.name = e.target.value; })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Size</div>
                        <input
                          type="number"
                          value={seg.size}
                          onChange={(e) => updateSegment(seg.id, (s) => { s.size = Number(e.target.value) || 0; })}
                          style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Description</div>
                      <input
                        value={seg.description}
                        onChange={(e) => updateSegment(seg.id, (s) => { s.description = e.target.value; })}
                        style={inputStyle}
                      />
                    </div>

                    {/* Linked Personas */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>Linked Personas</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {seg.personaIds.map((pid, i) => {
                          const p = buyerPersonas.find((bp) => bp.id === pid);
                          return (
                            <span key={i} style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "3px 10px", borderRadius: 12,
                              background: COLORS.purpleDim, color: COLORS.purple,
                              fontSize: 11, fontWeight: 600,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>
                              {p ? p.name : pid.slice(0, 8)}
                              <X
                                size={10}
                                style={{ cursor: "pointer", opacity: 0.7 }}
                                onClick={() => updateSegment(seg.id, (s) => { s.personaIds.splice(i, 1); })}
                              />
                            </span>
                          );
                        })}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value && !seg.personaIds.includes(e.target.value)) {
                              updateSegment(seg.id, (s) => { s.personaIds.push(e.target.value); });
                            }
                          }}
                          style={{
                            ...inputStyle,
                            width: 120,
                            height: 26,
                            fontSize: 10,
                            borderRadius: 12,
                            cursor: "pointer",
                            appearance: "auto",
                          }}
                        >
                          <option value="">+ Add persona</option>
                          {buyerPersonas.filter((bp) => !seg.personaIds.includes(bp.id)).map((bp) => (
                            <option key={bp.id} value={bp.id}>{bp.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Search Keywords */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Search size={10} /> Search Keywords
                        </span>
                      </div>
                      <TagList
                        items={seg.searchKeywords}
                        color={COLORS.accent}
                        bgColor={COLORS.accentDim}
                        onAdd={(v) => updateSegment(seg.id, (s) => { s.searchKeywords.push(v); })}
                        onRemove={(i) => updateSegment(seg.id, (s) => { s.searchKeywords.splice(i, 1); })}
                      />
                    </div>

                    {/* Content Topics */}
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <FileText size={10} /> Content Topics
                        </span>
                      </div>
                      <TagList
                        items={seg.contentTopics}
                        color={COLORS.amber}
                        bgColor={COLORS.amberDim}
                        onAdd={(v) => updateSegment(seg.id, (s) => { s.contentTopics.push(v); })}
                        onRemove={(i) => updateSegment(seg.id, (s) => { s.contentTopics.splice(i, 1); })}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* New Segment Button */}
        <button onClick={addSegment} style={{
          ...accentBtnStyle,
          width: "100%",
          justifyContent: "center",
          padding: "12px 16px",
          marginTop: 10,
          border: `1px dashed ${COLORS.amber}`,
          background: COLORS.amberDim,
          color: COLORS.amber,
        }}>
          <Plus size={14} /> New Segment
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Section 4: Keyword-Persona Mapping
         ═══════════════════════════════════════════════════════════ */}
      {buyerPersonas.length > 0 && allKeywords.length > 0 && (
        <div>
          <div style={sectionHeaderStyle}>
            <Grid3X3 size={17} color={COLORS.green} />
            <span>Keyword-Persona Mapping</span>
          </div>

          <div style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            overflow: "auto",
            background: COLORS.bgElevated,
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <thead>
                <tr>
                  <th style={{
                    ...labelStyle,
                    padding: "10px 12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${COLORS.border}`,
                    background: COLORS.bgCard,
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    minWidth: 140,
                  }}>
                    Persona
                  </th>
                  {allKeywords.map((kw, ki) => (
                    <th key={ki} style={{
                      ...labelStyle,
                      padding: "10px 8px",
                      textAlign: "center",
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: COLORS.bgCard,
                      minWidth: 80,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 120,
                    }}>
                      {kw}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buyerPersonas.map((persona) => (
                  <tr key={persona.id}>
                    <td style={{
                      padding: "8px 12px",
                      borderBottom: `1px solid ${COLORS.borderSubtle}`,
                      fontWeight: 600,
                      fontSize: 11,
                      color: COLORS.text,
                      fontFamily: "'DM Sans', sans-serif",
                      background: COLORS.bgElevated,
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      whiteSpace: "nowrap",
                    }}>
                      {persona.name}
                    </td>
                    {allKeywords.map((kw, ki) => {
                      const isMapped = keywordPersonaMap[kw]?.includes(persona.id) ?? false;
                      return (
                        <td key={ki} style={{
                          padding: "8px",
                          borderBottom: `1px solid ${COLORS.borderSubtle}`,
                          textAlign: "center",
                        }}>
                          {isMapped ? (
                            <div style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              background: COLORS.greenDim,
                              border: `1px solid ${COLORS.green}`,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                              <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: 2,
                                background: COLORS.green,
                              }} />
                            </div>
                          ) : (
                            <div style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              background: COLORS.bgCard,
                              border: `1px solid ${COLORS.borderSubtle}`,
                              display: "inline-block",
                            }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, fontSize: 10, color: COLORS.textMuted }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.green }} />
              Mapped
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.bgCard, border: `1px solid ${COLORS.borderSubtle}` }} />
              Not mapped
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {allKeywords.length} keywords &middot; {buyerPersonas.length} personas
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
