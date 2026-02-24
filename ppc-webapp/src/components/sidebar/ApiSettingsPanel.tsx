import React from "react";
import { Key, X, CheckCircle2 } from "lucide-react";
import { COLORS } from "../../constants";
import { getApiStatus } from "../../services/dataforseo";

interface ApiSettingsPanelProps {
  showApiSettings: boolean;
  setShowApiSettings: (v: boolean) => void;
  apiCredentials: { login: string; password: string };
  setApiCredentials: React.Dispatch<React.SetStateAction<{ login: string; password: string }>>;
  hasApiCredentials: string | boolean;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setSidebarTab: (tab: string) => void;
}

export const ApiSettingsPanel: React.FC<ApiSettingsPanelProps> = ({
  showApiSettings,
  setShowApiSettings,
  apiCredentials,
  setApiCredentials,
  hasApiCredentials,
  setMessages,
  setSidebarTab,
}) => {
  if (!showApiSettings) return null;

  return (
    <div style={{
      position: "fixed", left: 64, bottom: 80, width: 340, zIndex: 200,
      background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
      borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
      padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Key size={16} color={COLORS.accent} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>DataForSEO API</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowApiSettings(false)}
          style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: COLORS.bgCard, color: COLORS.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
        Credentials are sent per-request via headers to the Express backend. Alternatively, set <code style={{ fontSize: 11, background: COLORS.bgCard, padding: "1px 4px", borderRadius: 3 }}>DATAFORSEO_LOGIN</code> and <code style={{ fontSize: 11, background: COLORS.bgCard, padding: "1px 4px", borderRadius: 3 }}>DATAFORSEO_PASSWORD</code> in your server <code style={{ fontSize: 11, background: COLORS.bgCard, padding: "1px 4px", borderRadius: 3 }}>.env</code> file.
      </div>

      <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4, display: "block", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", textTransform: "uppercase" }}>Login (email)</label>
      <input
        type="text"
        value={apiCredentials.login}
        onChange={e => setApiCredentials(prev => ({ ...prev, login: e.target.value }))}
        placeholder="your@email.com"
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 6,
          border: `1px solid ${COLORS.border}`, background: COLORS.bgCard,
          color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          outline: "none", marginBottom: 12,
        }}
      />

      <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4, display: "block", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", textTransform: "uppercase" }}>API Password</label>
      <input
        type="password"
        value={apiCredentials.password}
        onChange={e => setApiCredentials(prev => ({ ...prev, password: e.target.value }))}
        placeholder="api_password"
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 6,
          border: `1px solid ${COLORS.border}`, background: COLORS.bgCard,
          color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          outline: "none", marginBottom: 16,
        }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={async () => {
            try {
              const status = await getApiStatus();
              setMessages(prev => [...prev, {
                role: "system",
                content: `**API Status:** Server is ${status.ok ? "online" : "offline"}. ${status.credentialsConfigured ? "Server-side credentials configured." : "No server-side credentials — using browser credentials."} Supported markets: ${status.supportedMarkets?.join(", ")}`,
                timestamp: new Date(),
              }]);
              setShowApiSettings(false);
              setSidebarTab("chat");
            } catch (err) {
              setMessages(prev => [...prev, {
                role: "system",
                content: `**Connection Error:** ${(err as Error).message}. Make sure the Express server is running (\`npm run server\`).`,
                timestamp: new Date(),
              }]);
              setSidebarTab("chat");
            }
          }}
          style={{
            flex: 1, height: 36, borderRadius: 8, border: "none",
            background: COLORS.accent, color: "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <CheckCircle2 size={13} /> Test Connection
        </button>
        {hasApiCredentials && (
          <button
            onClick={() => { setApiCredentials({ login: "", password: "" }); }}
            style={{
              height: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
              background: "transparent", color: COLORS.textMuted, cursor: "pointer",
              fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {hasApiCredentials && (
        <div style={{
          marginTop: 12, padding: "8px 10px", borderRadius: 6,
          background: COLORS.greenDim, display: "flex", alignItems: "center", gap: 6,
        }}>
          <CheckCircle2 size={12} color={COLORS.green} />
          <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 500 }}>Credentials set — live API calls enabled</span>
        </div>
      )}
    </div>
  );
};
