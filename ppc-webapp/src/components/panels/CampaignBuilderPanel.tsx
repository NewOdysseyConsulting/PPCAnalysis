import React, { useState } from "react";
import { COLORS } from "../../constants";
import { Target, ChevronRight, ChevronDown, Layers, Plus, X, Trash2, Copy } from "lucide-react";
import type { Campaign, AdGroup, CampaignKeyword, NegativeKeyword, BidStrategy, MatchType, CampaignStatus } from "../../types";

// ── Props ──

interface CampaignBuilderPanelProps {
  campaigns: Campaign[];
  onUpdateCampaigns: (campaigns: Campaign[]) => void;
  activeCampaignIdx: number;
  setActiveCampaignIdx: (idx: number) => void;
  activeAdGroupIdx: number;
  setActiveAdGroupIdx: (idx: number) => void;
  market: { currency: string; code: string; name: string };
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

const dangerBtnStyle: React.CSSProperties = {
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

// ── Constants ──

const BID_STRATEGIES: { value: BidStrategy; label: string }[] = [
  { value: "manual-cpc", label: "Manual CPC" },
  { value: "target-cpa", label: "Target CPA" },
  { value: "target-roas", label: "Target ROAS" },
  { value: "maximize-clicks", label: "Maximize Clicks" },
  { value: "maximize-conversions", label: "Maximize Conversions" },
];

const COUNTRY_OPTIONS = [
  { code: "GB", label: "GB" },
  { code: "US", label: "US" },
  { code: "DE", label: "DE" },
  { code: "AU", label: "AU" },
  { code: "CA", label: "CA" },
  { code: "FR", label: "FR" },
];

const STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

function statusColor(status: CampaignStatus): { bg: string; fg: string } {
  switch (status) {
    case "active": return { bg: COLORS.greenDim, fg: COLORS.green };
    case "paused": return { bg: `rgba(140,143,163,0.1)`, fg: COLORS.textMuted };
    case "archived": return { bg: `rgba(140,143,163,0.1)`, fg: COLORS.textMuted };
    default: return { bg: COLORS.amberDim, fg: COLORS.amber };
  }
}

// ── Helpers ──

function cloneCampaigns(campaigns: Campaign[]): Campaign[] {
  return JSON.parse(JSON.stringify(campaigns));
}

function makeDefaultCampaign(currency: string): Campaign {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "New Campaign",
    status: "draft",
    adGroups: [
      {
        id: crypto.randomUUID(),
        name: "Ad Group 1",
        keywords: [],
        negativeKeywords: [],
        headlines: ["Headline 1", "Headline 2", "Headline 3"],
        descriptions: ["Description line 1 goes here.", "Description line 2 goes here."],
      },
    ],
    negativeKeywords: [],
    bidConfig: {
      strategy: "manual-cpc",
      maxCpcLimit: 5.00,
      dailyBudget: 20,
    },
    targetCountries: ["GB"],
    createdAt: now,
    updatedAt: now,
  };
}

function makeDefaultAdGroup(): AdGroup {
  return {
    id: crypto.randomUUID(),
    name: "New Ad Group",
    keywords: [],
    negativeKeywords: [],
    headlines: ["Headline 1", "Headline 2", "Headline 3"],
    descriptions: ["Description line 1 goes here.", "Description line 2 goes here."],
  };
}

// ── Main Component ──

export default function CampaignBuilderPanel({
  campaigns,
  onUpdateCampaigns,
  activeCampaignIdx,
  setActiveCampaignIdx,
  activeAdGroupIdx,
  setActiveAdGroupIdx,
  market,
}: CampaignBuilderPanelProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [newKeywords, setNewKeywords] = useState<Record<string, string>>({});
  const [newNegKeywords, setNewNegKeywords] = useState<Record<string, string>>({});
  const [newCampaignNeg, setNewCampaignNeg] = useState("");
  const [expandedNegatives, setExpandedNegatives] = useState<Record<string, boolean>>({});
  const [campaignNegsExpanded, setCampaignNegsExpanded] = useState(false);

  const camp = campaigns[activeCampaignIdx];
  if (!camp) return <div style={{ padding: 32, color: COLORS.textMuted, textAlign: "center" }}>No campaigns. Click + to create one.</div>;

  // ── Mutation helpers ──

  function update(mutator: (draft: Campaign[]) => void) {
    const draft = cloneCampaigns(campaigns);
    mutator(draft);
    // Update the updatedAt timestamp
    if (draft[activeCampaignIdx]) {
      draft[activeCampaignIdx].updatedAt = new Date().toISOString();
    }
    onUpdateCampaigns(draft);
  }

  function updateCamp(mutator: (c: Campaign) => void) {
    update((draft) => {
      mutator(draft[activeCampaignIdx]);
    });
  }

  function updateAdGroup(agIdx: number, mutator: (ag: AdGroup) => void) {
    updateCamp((c) => {
      mutator(c.adGroups[agIdx]);
    });
  }

  // ── Campaign CRUD ──

  function addCampaign() {
    const draft = cloneCampaigns(campaigns);
    draft.push(makeDefaultCampaign(market.currency));
    onUpdateCampaigns(draft);
    setActiveCampaignIdx(draft.length - 1);
    setActiveAdGroupIdx(0);
  }

  function deleteCampaign() {
    if (campaigns.length <= 1) return;
    const draft = cloneCampaigns(campaigns);
    draft.splice(activeCampaignIdx, 1);
    onUpdateCampaigns(draft);
    setActiveCampaignIdx(Math.max(0, activeCampaignIdx - 1));
    setActiveAdGroupIdx(-1);
  }

  // ── Render ──

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ─── Campaign Selector Bar ─── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {campaigns.map((c, idx) => {
          const isActive = idx === activeCampaignIdx;
          const sc = statusColor(c.status);
          return (
            <button
              key={c.id}
              onClick={() => { setActiveCampaignIdx(idx); setActiveAdGroupIdx(-1); setEditingName(false); }}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                background: isActive ? COLORS.accentDim : COLORS.bgElevated,
                color: isActive ? COLORS.accent : COLORS.text,
                fontWeight: isActive ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: sc.fg,
                display: "inline-block",
              }} />
              {c.name}
            </button>
          );
        })}
        <button onClick={addCampaign} style={ghostBtnStyle}>
          <Plus size={12} /> New
        </button>
      </div>

      {/* ─── Campaign Header ─── */}
      <div style={{
        ...cardStyle,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <Target size={18} color={COLORS.accent} />
        <div style={{ flex: 1 }}>
          {editingName ? (
            <input
              autoFocus
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={() => {
                if (nameVal.trim()) updateCamp((c) => { c.name = nameVal.trim(); });
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (nameVal.trim()) updateCamp((c) => { c.name = nameVal.trim(); });
                  setEditingName(false);
                }
                if (e.key === "Escape") setEditingName(false);
              }}
              style={{
                ...inputStyle,
                fontWeight: 700,
                fontSize: 15,
                height: 28,
                width: "100%",
                maxWidth: 360,
              }}
            />
          ) : (
            <div
              onClick={() => { setEditingName(true); setNameVal(camp.name); }}
              style={{ fontWeight: 700, fontSize: 15, cursor: "text" }}
              title="Click to edit name"
            >
              {camp.name}
            </div>
          )}
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
            {camp.adGroups.length} ad group{camp.adGroups.length !== 1 ? "s" : ""} &middot; {camp.adGroups.reduce((a, g) => a + g.keywords.length, 0)} keywords &middot; {market.currency}{camp.bidConfig.dailyBudget}/day
          </div>
        </div>
        <select
          value={camp.status}
          onChange={(e) => updateCamp((c) => { c.status = e.target.value as CampaignStatus; })}
          style={{
            ...inputStyle,
            width: "auto",
            height: 28,
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "'JetBrains Mono', monospace",
            background: statusColor(camp.status).bg,
            color: statusColor(camp.status).fg,
            border: "none",
            borderRadius: 20,
            padding: "0 12px",
            cursor: "pointer",
            appearance: "auto",
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {campaigns.length > 1 && (
          <button onClick={deleteCampaign} style={dangerBtnStyle} title="Delete campaign">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* ─── Bid Config Card ─── */}
      <div style={cardStyle}>
        <div style={{ ...labelStyle, marginBottom: 12 }}>Bid Configuration</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* Strategy */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Strategy</div>
            <select
              value={camp.bidConfig.strategy}
              onChange={(e) => updateCamp((c) => { c.bidConfig.strategy = e.target.value as BidStrategy; })}
              style={{ ...inputStyle }}
            >
              {BID_STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Daily Budget */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Daily Budget ({market.currency})</div>
            <input
              type="number"
              min={1}
              step={1}
              value={camp.bidConfig.dailyBudget}
              onChange={(e) => updateCamp((c) => { c.bidConfig.dailyBudget = Math.max(1, Number(e.target.value)); })}
              style={inputStyle}
            />
          </div>

          {/* Conditional: Target CPA */}
          {camp.bidConfig.strategy === "target-cpa" && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Target CPA ({market.currency})</div>
              <input
                type="number"
                min={0}
                step={0.01}
                value={camp.bidConfig.targetCpa ?? ""}
                onChange={(e) => updateCamp((c) => { c.bidConfig.targetCpa = Number(e.target.value) || undefined; })}
                style={inputStyle}
                placeholder="e.g. 12.00"
              />
            </div>
          )}

          {/* Conditional: Target ROAS */}
          {camp.bidConfig.strategy === "target-roas" && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Target ROAS (%)</div>
              <input
                type="number"
                min={0}
                step={1}
                value={camp.bidConfig.targetRoas ?? ""}
                onChange={(e) => updateCamp((c) => { c.bidConfig.targetRoas = Number(e.target.value) || undefined; })}
                style={inputStyle}
                placeholder="e.g. 400"
              />
            </div>
          )}

          {/* Conditional: Max CPC Limit */}
          {camp.bidConfig.strategy === "manual-cpc" && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Max CPC ({market.currency})</div>
              <input
                type="number"
                min={0}
                step={0.01}
                value={camp.bidConfig.maxCpcLimit ?? ""}
                onChange={(e) => updateCamp((c) => { c.bidConfig.maxCpcLimit = Number(e.target.value) || undefined; })}
                style={inputStyle}
                placeholder="e.g. 5.00"
              />
            </div>
          )}
        </div>

        {/* Target Countries */}
        <div style={{ marginTop: 14 }}>
          <div style={{ ...labelStyle, marginBottom: 6, fontSize: 9 }}>Target Countries</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COUNTRY_OPTIONS.map((co) => {
              const selected = camp.targetCountries.includes(co.code);
              return (
                <label key={co.code} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, color: selected ? COLORS.accent : COLORS.textMuted, fontWeight: selected ? 600 : 400, fontFamily: "'JetBrains Mono', monospace" }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      updateCamp((c) => {
                        if (selected) {
                          c.targetCountries = c.targetCountries.filter((x) => x !== co.code);
                        } else {
                          c.targetCountries.push(co.code);
                        }
                      });
                    }}
                    style={{ accentColor: COLORS.accent, width: 14, height: 14 }}
                  />
                  {co.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Landing Page URL */}
        <div style={{ marginTop: 14 }}>
          <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Landing Page URL</div>
          <input
            type="url"
            value={camp.landingPageUrl ?? ""}
            onChange={(e) => updateCamp((c) => { c.landingPageUrl = e.target.value || undefined; })}
            style={inputStyle}
            placeholder="https://example.com/landing"
          />
        </div>
      </div>

      {/* ─── Ad Groups ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {camp.adGroups.map((ag, gi) => {
          const isOpen = activeAdGroupIdx === gi;
          const negKey = `${camp.id}-${ag.id}-neg`;
          const negsOpen = expandedNegatives[negKey] ?? false;

          return (
            <div key={ag.id} style={{
              background: COLORS.bgCard,
              border: `1px solid ${isOpen ? COLORS.accent : COLORS.border}`,
              borderRadius: 10,
              overflow: "hidden",
              transition: "border-color 0.15s ease",
            }}>
              {/* Ad Group Header */}
              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  borderBottom: isOpen ? `1px solid ${COLORS.border}` : "none",
                }}
              >
                <div
                  onClick={() => setActiveAdGroupIdx(isOpen ? -1 : gi)}
                  style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer" }}
                >
                  {isOpen
                    ? <ChevronDown size={14} color={COLORS.textMuted} />
                    : <ChevronRight size={14} color={COLORS.textMuted} />
                  }
                  <Layers size={13} color={COLORS.accent} />
                  <AdGroupName
                    name={ag.name}
                    onChange={(val) => updateAdGroup(gi, (a) => { a.name = val; })}
                  />
                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: COLORS.accentDim,
                    color: COLORS.accent,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {ag.keywords.length} kw
                  </span>
                </div>
                {camp.adGroups.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCamp((c) => { c.adGroups.splice(gi, 1); });
                      if (activeAdGroupIdx >= gi) setActiveAdGroupIdx(Math.max(-1, activeAdGroupIdx - 1));
                    }}
                    style={{ ...dangerBtnStyle, padding: "4px 6px" }}
                    title="Remove ad group"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Ad Group Content */}
              {isOpen && (
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>

                  {/* ── Keywords ── */}
                  <div>
                    <div style={{ ...labelStyle, marginBottom: 8 }}>Keywords</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {ag.keywords.map((kw, ki) => (
                        <KeywordRow
                          key={ki}
                          kw={kw}
                          currency={market.currency}
                          onUpdate={(updated) => updateAdGroup(gi, (a) => { a.keywords[ki] = updated; })}
                          onDelete={() => updateAdGroup(gi, (a) => { a.keywords.splice(ki, 1); })}
                        />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <input
                        value={newKeywords[ag.id] ?? ""}
                        onChange={(e) => setNewKeywords((p) => ({ ...p, [ag.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (newKeywords[ag.id] ?? "").trim()) {
                            updateAdGroup(gi, (a) => {
                              a.keywords.push({ keyword: (newKeywords[ag.id] ?? "").trim(), matchType: "broad" });
                            });
                            setNewKeywords((p) => ({ ...p, [ag.id]: "" }));
                          }
                        }}
                        placeholder="Add keyword..."
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={() => {
                          if ((newKeywords[ag.id] ?? "").trim()) {
                            updateAdGroup(gi, (a) => {
                              a.keywords.push({ keyword: (newKeywords[ag.id] ?? "").trim(), matchType: "broad" });
                            });
                            setNewKeywords((p) => ({ ...p, [ag.id]: "" }));
                          }
                        }}
                        style={accentBtnStyle}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>

                  {/* ── Negative Keywords (ad-group level) ── */}
                  <div>
                    <div
                      onClick={() => setExpandedNegatives((p) => ({ ...p, [negKey]: !negsOpen }))}
                      style={{ ...labelStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: negsOpen ? 8 : 0 }}
                    >
                      {negsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      Negative Keywords ({ag.negativeKeywords.length})
                    </div>
                    {negsOpen && (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {ag.negativeKeywords.map((nk, nki) => (
                            <NegativeKeywordRow
                              key={nki}
                              nk={nk}
                              onUpdate={(updated) => updateAdGroup(gi, (a) => { a.negativeKeywords[nki] = updated; })}
                              onDelete={() => updateAdGroup(gi, (a) => { a.negativeKeywords.splice(nki, 1); })}
                            />
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          <input
                            value={newNegKeywords[ag.id] ?? ""}
                            onChange={(e) => setNewNegKeywords((p) => ({ ...p, [ag.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (newNegKeywords[ag.id] ?? "").trim()) {
                                updateAdGroup(gi, (a) => {
                                  a.negativeKeywords.push({ keyword: (newNegKeywords[ag.id] ?? "").trim(), matchType: "broad", level: "ad-group" });
                                });
                                setNewNegKeywords((p) => ({ ...p, [ag.id]: "" }));
                              }
                            }}
                            placeholder="Add negative keyword..."
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button
                            onClick={() => {
                              if ((newNegKeywords[ag.id] ?? "").trim()) {
                                updateAdGroup(gi, (a) => {
                                  a.negativeKeywords.push({ keyword: (newNegKeywords[ag.id] ?? "").trim(), matchType: "broad", level: "ad-group" });
                                });
                                setNewNegKeywords((p) => ({ ...p, [ag.id]: "" }));
                              }
                            }}
                            style={accentBtnStyle}
                          >
                            <Plus size={12} /> Add
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── Headlines ── */}
                  <div>
                    <div style={{ ...labelStyle, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>Headlines (30 char max)</span>
                      <button
                        onClick={() => updateAdGroup(gi, (a) => { a.headlines.push(""); })}
                        style={{ ...ghostBtnStyle, padding: "2px 8px", fontSize: 10 }}
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    {ag.headlines.map((h, hi) => (
                      <div key={hi} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input
                          value={h}
                          maxLength={30}
                          onChange={(e) => updateAdGroup(gi, (a) => { a.headlines[hi] = e.target.value; })}
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder={`Headline ${hi + 1}`}
                        />
                        <span style={{
                          fontSize: 10,
                          color: h.length <= 30 ? COLORS.green : COLORS.red,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          minWidth: 34,
                          textAlign: "right",
                        }}>
                          {h.length}/30
                        </span>
                        {ag.headlines.length > 3 && (
                          <button
                            onClick={() => updateAdGroup(gi, (a) => { a.headlines.splice(hi, 1); })}
                            style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 2 }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Descriptions ── */}
                  <div>
                    <div style={{ ...labelStyle, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>Descriptions (90 char max)</span>
                      <button
                        onClick={() => updateAdGroup(gi, (a) => { a.descriptions.push(""); })}
                        style={{ ...ghostBtnStyle, padding: "2px 8px", fontSize: 10 }}
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    {ag.descriptions.map((d, di) => (
                      <div key={di} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                        <textarea
                          value={d}
                          maxLength={90}
                          onChange={(e) => updateAdGroup(gi, (a) => { a.descriptions[di] = e.target.value; })}
                          style={{
                            ...inputStyle,
                            flex: 1,
                            height: 48,
                            padding: "6px 10px",
                            resize: "none",
                            lineHeight: 1.5,
                          }}
                          placeholder={`Description ${di + 1}`}
                        />
                        <span style={{
                          fontSize: 10,
                          color: d.length <= 90 ? COLORS.green : COLORS.red,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          minWidth: 38,
                          textAlign: "right",
                          marginTop: 6,
                        }}>
                          {d.length}/90
                        </span>
                        {ag.descriptions.length > 2 && (
                          <button
                            onClick={() => updateAdGroup(gi, (a) => { a.descriptions.splice(di, 1); })}
                            style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 2, marginTop: 4 }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Ad Preview ── */}
                  <div>
                    <div style={{ ...labelStyle, marginBottom: 8 }}>Ad Preview</div>
                    <div style={{
                      padding: 16,
                      borderRadius: 8,
                      background: "#ffffff",
                      border: "1px solid #dadce0",
                      maxWidth: 440,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }}>
                      <div style={{ fontSize: 10, color: "#202124", fontFamily: "Arial, sans-serif", marginBottom: 2 }}>
                        Sponsored &middot; {ag.finalUrl ? new URL(ag.finalUrl).hostname : (camp.landingPageUrl ? new URL(camp.landingPageUrl).hostname : "example.com")}
                        {ag.displayPath1 && <span>/{ag.displayPath1}</span>}
                        {ag.displayPath2 && <span>/{ag.displayPath2}</span>}
                      </div>
                      <div style={{
                        fontSize: 16,
                        color: "#1a0dab",
                        fontFamily: "Arial, sans-serif",
                        fontWeight: 400,
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}>
                        {(ag.headlines[0] || "Headline 1")} | {(ag.headlines[1] || "Headline 2")}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: "#4d5156",
                        fontFamily: "Arial, sans-serif",
                        lineHeight: 1.45,
                      }}>
                        {ag.descriptions[0] || "Your description will appear here."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Add Ad Group Button ─── */}
      <button
        onClick={() => {
          updateCamp((c) => { c.adGroups.push(makeDefaultAdGroup()); });
          setActiveAdGroupIdx(camp.adGroups.length); // Will be the new last index after update
        }}
        style={{ ...accentBtnStyle, justifyContent: "center", padding: "10px 16px" }}
      >
        <Plus size={14} /> Add Ad Group
      </button>

      {/* ─── Campaign-Level Negative Keywords ─── */}
      <div style={cardStyle}>
        <div
          onClick={() => setCampaignNegsExpanded(!campaignNegsExpanded)}
          style={{ ...labelStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          {campaignNegsExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Campaign-Level Negative Keywords ({camp.negativeKeywords.length})
        </div>
        {campaignNegsExpanded && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {camp.negativeKeywords.map((nk, nki) => (
                <NegativeKeywordRow
                  key={nki}
                  nk={nk}
                  onUpdate={(updated) => updateCamp((c) => { c.negativeKeywords[nki] = updated; })}
                  onDelete={() => updateCamp((c) => { c.negativeKeywords.splice(nki, 1); })}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input
                value={newCampaignNeg}
                onChange={(e) => setNewCampaignNeg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCampaignNeg.trim()) {
                    updateCamp((c) => {
                      c.negativeKeywords.push({ keyword: newCampaignNeg.trim(), matchType: "broad", level: "campaign" });
                    });
                    setNewCampaignNeg("");
                  }
                }}
                placeholder="Add campaign negative..."
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => {
                  if (newCampaignNeg.trim()) {
                    updateCamp((c) => {
                      c.negativeKeywords.push({ keyword: newCampaignNeg.trim(), matchType: "broad", level: "campaign" });
                    });
                    setNewCampaignNeg("");
                  }
                }}
                style={accentBtnStyle}
              >
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ──

function AdGroupName({ name, onChange }: { name: string; onChange: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          if (val.trim()) onChange(val.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (val.trim()) onChange(val.trim());
            setEditing(false);
          }
          if (e.key === "Escape") setEditing(false);
        }}
        style={{
          ...inputStyle,
          fontWeight: 600,
          fontSize: 13,
          height: 24,
          width: 180,
        }}
      />
    );
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true); setVal(name); }}
      style={{ fontWeight: 600, fontSize: 13, cursor: "text" }}
      title="Click to edit"
    >
      {name}
    </span>
  );
}

function MatchTypePill({ matchType, onChange }: { matchType: MatchType; onChange: (mt: MatchType) => void }) {
  const types: MatchType[] = ["broad", "phrase", "exact"];

  function label(mt: MatchType) {
    switch (mt) {
      case "broad": return "Broad";
      case "phrase": return `"Phrase"`;
      case "exact": return "[Exact]";
    }
  }

  return (
    <div style={{ display: "flex", gap: 2 }}>
      {types.map((mt) => {
        const active = mt === matchType;
        return (
          <button
            key={mt}
            onClick={() => onChange(mt)}
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: mt === "broad" ? 10 : mt === "phrase" ? 6 : 3,
              border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
              background: active ? COLORS.accentDim : "transparent",
              color: active ? COLORS.accent : COLORS.textMuted,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "all 0.1s ease",
            }}
          >
            {label(mt)}
          </button>
        );
      })}
    </div>
  );
}

function KeywordRow({ kw, currency, onUpdate, onDelete }: {
  kw: CampaignKeyword;
  currency: string;
  onUpdate: (kw: CampaignKeyword) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 6,
      background: COLORS.bgElevated,
      border: `1px solid ${COLORS.border}`,
    }}>
      <span style={{
        flex: 1,
        fontSize: 11,
        color: COLORS.text,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {kw.keyword}
      </span>
      <MatchTypePill
        matchType={kw.matchType}
        onChange={(mt) => onUpdate({ ...kw, matchType: mt })}
      />
      <input
        type="number"
        min={0}
        step={0.01}
        value={kw.maxCpc ?? ""}
        onChange={(e) => onUpdate({ ...kw, maxCpc: e.target.value ? Number(e.target.value) : undefined })}
        placeholder={`${currency} CPC`}
        title="Max CPC override"
        style={{
          ...inputStyle,
          width: 72,
          fontSize: 10,
          height: 24,
          textAlign: "right",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      />
      <button
        onClick={onDelete}
        style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 2 }}
        title="Remove keyword"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function NegativeKeywordRow({ nk, onUpdate, onDelete }: {
  nk: NegativeKeyword;
  onUpdate: (nk: NegativeKeyword) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "4px 10px",
      borderRadius: 6,
      background: COLORS.redDim,
      border: `1px solid rgba(220,38,38,0.15)`,
    }}>
      <span style={{
        flex: 1,
        fontSize: 11,
        color: COLORS.red,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        &minus; {nk.keyword}
      </span>
      <MatchTypePill
        matchType={nk.matchType}
        onChange={(mt) => onUpdate({ ...nk, matchType: mt })}
      />
      <button
        onClick={onDelete}
        style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.red, padding: 2 }}
        title="Remove negative"
      >
        <X size={12} />
      </button>
    </div>
  );
}
