import React from "react";
import { MessageSquare, Hash, Bookmark, Target, Briefcase, Key, PanelRightOpen, PanelRightClose, Command } from "lucide-react";
import { COLORS, COUNTRY_MARKETS } from "../../constants";

interface IconRailProps {
  sidebarTab: string;
  setSidebarTab: (tab: string) => void;
  showApiSettings: boolean;
  setShowApiSettings: React.Dispatch<React.SetStateAction<boolean>>;
  hasApiCredentials: string | boolean;
  showCountryPicker: boolean;
  setShowCountryPicker: React.Dispatch<React.SetStateAction<boolean>>;
  targetCountry: string;
  setTargetCountry: (code: string) => void;
  market: any;
  panelOpen: boolean;
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const IconRail: React.FC<IconRailProps> = ({
  sidebarTab,
  setSidebarTab,
  showApiSettings,
  setShowApiSettings,
  hasApiCredentials,
  showCountryPicker,
  setShowCountryPicker,
  targetCountry,
  setTargetCountry,
  market,
  panelOpen,
  setPanelOpen,
}) => {
  return (
    <div style={{
      width: 56, minWidth: 56, background: "#f1f2f4", borderRight: `1px solid ${COLORS.border}`,
      display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 4,
    }}>
      {/* Logo */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        boxShadow: `0 2px 12px rgba(13,148,136,0.2)`,
      }}>
        <Command size={18} color="#fff" strokeWidth={2.5} />
      </div>

      {[
        { icon: MessageSquare, tab: "chat", label: "Chat" },
        { icon: Hash, tab: "seeds", label: "Seeds" },
        { icon: Bookmark, tab: "groups", label: "Groups" },
        { icon: Target, tab: "campaigns", label: "Campaigns" },
        { icon: Briefcase, tab: "products", label: "Products" },
      ].map(({ icon: Icon, tab, label }) => (
        <button
          key={tab}
          onClick={() => setSidebarTab(tab)}
          title={label}
          style={{
            width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer",
            background: sidebarTab === tab ? COLORS.accentDim : "transparent",
            color: sidebarTab === tab ? COLORS.accent : COLORS.textMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <Icon size={18} />
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* API Settings */}
      <button
        onClick={() => setShowApiSettings(p => !p)}
        title="API Settings"
        style={{
          width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer",
          background: showApiSettings ? COLORS.accentDim : "transparent",
          color: showApiSettings ? COLORS.accent : COLORS.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s ease",
          position: "relative",
        }}
      >
        <Key size={18} />
        {hasApiCredentials && (
          <div style={{
            position: "absolute", top: 6, right: 6, width: 7, height: 7,
            borderRadius: "50%", background: COLORS.green,
          }} />
        )}
      </button>

      {/* Country Picker */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowCountryPicker(p => !p)}
          title={`Market: ${market.name}`}
          style={{
            width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer",
            background: showCountryPicker ? COLORS.accentDim : "transparent",
            color: COLORS.textMuted, fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          {market.flag}
        </button>
        {showCountryPicker && (
          <div style={{
            position: "absolute", left: 48, bottom: 0, width: 200,
            background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            padding: 6, zIndex: 100,
          }}>
            <div style={{ padding: "6px 10px", fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>
              Target Market
            </div>
            {Object.values(COUNTRY_MARKETS).map((c: any) => (
              <button
                key={c.code}
                onClick={() => { setTargetCountry(c.code); setShowCountryPicker(false); }}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 6, border: "none",
                  background: targetCountry === c.code ? COLORS.accentDim : "transparent",
                  color: targetCountry === c.code ? COLORS.accent : COLORS.text,
                  cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                  fontWeight: targetCountry === c.code ? 600 : 400,
                  transition: "all 0.1s ease",
                }}
                onMouseEnter={e => { if (targetCountry !== c.code) e.currentTarget.style.background = COLORS.bgHover; }}
                onMouseLeave={e => { if (targetCountry !== c.code) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span>{c.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{c.currency}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setPanelOpen(p => !p)}
        title={panelOpen ? "Close panel" : "Open panel"}
        style={{
          width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer",
          background: "transparent", color: COLORS.textMuted, marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
      </button>
    </div>
  );
};
