// ════════════════════════════════════════════════════════════════
// AI Assistant Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/ai";

// ── Types ──

export interface ChatResponse {
  message: string;
  suggestedAction?: {
    type: string;
    panel?: string;
    payload?: unknown;
  };
  sources?: { url: string; snippet: string }[];
}

// ── API call helper ──

async function apiCall(endpoint: string, options: { method?: string; body?: unknown } = {}): Promise<{ result: unknown }> {
  const { method = "POST", body } = options;
  const fetchOpts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && method !== "GET") {
    fetchOpts.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${endpoint}`, fetchOpts);
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `AI API request failed (${response.status})`);
  }
  return data as { result: unknown };
}

// ── Endpoints ──

export async function sendChatMessage(
  message: string,
  history?: { role: string; content: string }[],
  context?: Record<string, unknown>,
  options?: { sessionId?: string; productId?: string }
): Promise<ChatResponse> {
  const data = await apiCall("/chat", {
    body: { message, history, context, ...options },
  });
  return data.result as ChatResponse;
}

export async function generateIcp(
  product: Record<string, unknown>,
  market: string,
  existingIcps?: string[]
): Promise<Record<string, unknown>> {
  const data = await apiCall("/generate-icp", {
    body: { product, market, existingIcps },
  });
  return data.result as Record<string, unknown>;
}

export async function generatePersona(
  product: Record<string, unknown>,
  market: string,
  icpName?: string,
  existingPersonas?: string[]
): Promise<Record<string, unknown>> {
  const data = await apiCall("/generate-persona", {
    body: { product, market, icpName, existingPersonas },
  });
  return data.result as Record<string, unknown>;
}
