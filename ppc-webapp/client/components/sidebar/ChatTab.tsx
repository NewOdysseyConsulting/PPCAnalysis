import React from "react";
import { Send, Table2, GitCompare, BarChart3, Target, DollarSign, TrendingUp, Search, ExternalLink, Activity, Zap, Bot, User, SlidersHorizontal, Calendar, Users, Briefcase, ArrowRight } from "lucide-react";
import { COLORS } from "../../constants";

interface ChatTabProps {
  messages: any[];
  isTyping: boolean;
  inputValue: string;
  setInputValue: (v: string) => void;
  handleSend: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  panelMode: string;
  setPanelMode: (mode: string) => void;
  setPanelOpen: (open: boolean) => void;
  market: any;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  isTyping,
  inputValue,
  setInputValue,
  handleSend,
  chatEndRef,
  panelMode,
  setPanelMode,
  setPanelOpen,
  market,
  inputRef,
}) => {
  return (
    <>
      {/* Chat Header */}
      <div style={{
        height: 56, minHeight: 56, borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
        background: "#f1f2f4",
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: COLORS.green,
          boxShadow: `0 0 6px rgba(22,163,74,0.3)`,
        }} />
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>Orion</span>
        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>SEO & PPC Intelligence</span>
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 4,
          background: COLORS.accentDim, color: COLORS.accent,
          fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
        }}>{market.flag} {market.code}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["table", "competitor", "visual", "campaign", "budget", "allocator", "revenue", "seo", "backlinks", "gsc", "ga", "audience", "timeline", "portfolio"].map(mode => {
            const icons: Record<string, any> = { table: Table2, competitor: GitCompare, visual: BarChart3, campaign: Target, budget: DollarSign, allocator: SlidersHorizontal, revenue: TrendingUp, seo: Search, backlinks: ExternalLink, gsc: Search, ga: Activity, audience: Users, timeline: Calendar, portfolio: Briefcase };
            const labels: Record<string, string> = { table: "Table", competitor: "Competitor", visual: "Visual", campaign: "Campaign", budget: "Budget", allocator: "Allocator", revenue: "Revenue", seo: "SEO", backlinks: "Backlinks", gsc: "GSC", ga: "GA", audience: "Audience", timeline: "Timeline", portfolio: "Portfolio" };
            const Icon = icons[mode];
            return (
              <button
                key={mode}
                onClick={() => { setPanelMode(mode); setPanelOpen(true); }}
                style={{
                  height: 30, padding: "0 10px", borderRadius: 6, border: `1px solid ${panelMode === mode ? COLORS.accent : COLORS.border}`,
                  background: panelMode === mode ? COLORS.accentDim : "transparent",
                  color: panelMode === mode ? COLORS.accent : COLORS.textMuted,
                  cursor: "pointer", fontSize: 11, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 5,
                  transition: "all 0.15s ease", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Icon size={13} />
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 0 20px" }}>
        {messages.map((msg: any, i: number) => (
          <div key={i} style={{
            display: "flex", gap: 12, marginBottom: 20,
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
          }}>
            <div style={{
              width: 32, height: 32, minWidth: 32, borderRadius: 8,
              background: msg.role === "user" ? COLORS.accentDim : COLORS.bgCard,
              border: `1px solid ${msg.role === "user" ? COLORS.accent : COLORS.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {msg.role === "user" ? <User size={14} color={COLORS.accent} /> : <Bot size={14} color={COLORS.textSecondary} />}
            </div>
            <div style={{
              maxWidth: "75%", padding: "12px 16px", borderRadius: 12,
              background: msg.role === "user" ? COLORS.accent : COLORS.bgElevated,
              border: `1px solid ${msg.role === "user" ? COLORS.accent : COLORS.border}`,
              fontSize: 13, lineHeight: 1.65, color: msg.role === "user" ? "#ffffff" : COLORS.text,
            }}>
              {msg.content.split("\n").map((line: string, j: number) => {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <div key={j} style={{ marginBottom: line === "" ? 8 : 2 }}>
                    {parts.map((part: string, k: number) =>
                      part.startsWith("**") && part.endsWith("**")
                        ? <strong key={k} style={{ color: msg.role === "user" ? "#ffffff" : COLORS.accent, fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                        : <span key={k}>{part}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 10, color: msg.role === "user" ? "rgba(255,255,255,0.6)" : COLORS.textMuted }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.action && msg.role !== "user" && (
                  <button
                    onClick={msg.action}
                    style={{
                      fontSize: 10, fontWeight: 600, color: COLORS.accent,
                      background: COLORS.accentDim, border: `1px solid ${COLORS.accent}`,
                      borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "inline-flex", alignItems: "center", gap: 3,
                    }}
                  >
                    View <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32, minWidth: 32, borderRadius: 8,
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={14} color={COLORS.textSecondary} />
            </div>
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: COLORS.accent,
                    opacity: 0.4,
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>Querying DataForSEO...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "8px 20px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          "Find long-tail keywords for AP automation",
          "Show competitor gaps",
          "Build campaign from top keywords",
          "Show GSC performance",
          "Show GA analytics",
          "Show opportunity map",
        ].map((q, i) => (
          <button
            key={i}
            onClick={() => { setInputValue(q); setTimeout(() => inputRef.current?.focus(), 50); }}
            style={{
              padding: "5px 12px", borderRadius: 20, border: `1px solid ${COLORS.border}`,
              background: COLORS.bgCard, color: COLORS.textSecondary, fontSize: 11,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s ease", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = COLORS.accent; (e.target as HTMLElement).style.color = COLORS.accent; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = COLORS.border; (e.target as HTMLElement).style.color = COLORS.textSecondary; }}
          >
            <Zap size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />{q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 20px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "4px 4px 4px 16px",
          transition: "border-color 0.15s ease",
        }}>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about keywords, competitors, or build campaigns..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            style={{
              width: 36, height: 36, borderRadius: 8, border: "none",
              background: inputValue.trim() ? COLORS.accent : COLORS.bgCard,
              color: inputValue.trim() ? "#fff" : COLORS.textMuted,
              cursor: inputValue.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  );
};
