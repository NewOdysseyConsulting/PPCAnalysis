// ════════════════════════════════════════════════════════════════
// Budget Optimization Client — Calls our Express backend
// ════════════════════════════════════════════════════════════════

const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

// ── Types ──

interface OptimizeChannelInput {
  channel: string;
  budgetPercent: number;
  estimatedCtr: number;
  estimatedConvRate: number;
  estimatedCpc: number;
}

interface OptimizeParams {
  totalBudget: number;
  channels: OptimizeChannelInput[];
  acv: number;
}

interface OptimizedChannel {
  channel: string;
  budgetPercent: number;
  projectedRoas: number;
}

interface OptimizeResult {
  optimizedChannels: OptimizedChannel[];
  totalProjectedRevenue: number;
  totalProjectedConversions: number;
}

// ── API ──

export async function optimizeBudget(
  params: OptimizeParams,
): Promise<OptimizeResult> {
  const response = await fetch(`${API_BASE}/api/budget/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ||
        `Budget optimization request failed (${response.status})`,
    );
  }

  return data as OptimizeResult;
}
