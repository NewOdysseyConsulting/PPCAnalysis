// ════════════════════════════════════════════════════════════════
// Pipeline Client — trigger and poll keyword research pipeline jobs
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/pipeline";

export interface PipelineJobInput {
  seedKeywords: string[];
  targetCountry: string;
  competitors: string[];
  cpcRange: { min: number; max: number };
  productId?: string;
  product?: {
    name: string;
    description: string;
    target?: string;
    integrations?: string;
  };
}

export type PipelineStatus = "queued" | "expanding" | "analyzing" | "scoring" | "reporting" | "completed" | "failed";

export interface PipelineRun {
  id: string;
  productId: string | null;
  status: PipelineStatus;
  stageDetail: string | null;
  config: PipelineJobInput;
  result: PipelineResult | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PipelineResult {
  keywords: ScoredKeyword[];
  gaps: KeywordGap[];
  summary: {
    totalKeywordsFound: number;
    sweetSpotCount: number;
    highValueCount: number;
    avgCpc: number;
    topKeyword: string;
    competitorGaps: number;
    marketOpportunity: string;
  };
  metadata: {
    country: string;
    seedKeywords: string[];
    competitors: string[];
    timestamp: string;
    duration: number;
  };
}

export interface ScoredKeyword {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  score: number;
  scoreBreakdown: {
    volumeScore: number;
    intentScore: number;
    competitionScore: number;
    cpcAffordabilityScore: number;
  };
  source: string;
  tier: "sweet-spot" | "high-value" | "monitor" | "low-priority";
}

export interface KeywordGap {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  competitorDomain: string;
  competitorRank: number;
  competitorEtv: number;
  gapType: "organic-only" | "low-competition-high-intent" | "untapped";
}

export async function submitPipeline(input: PipelineJobInput): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((data as { error?: string }).error || `Failed to submit pipeline (${res.status})`);
  }
  return res.json() as Promise<{ jobId: string }>;
}

export async function getPipelineJob(jobId: string): Promise<PipelineRun> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((data as { error?: string }).error || `Failed to get pipeline job (${res.status})`);
  }
  return res.json() as Promise<PipelineRun>;
}

export async function listPipelineJobs(options?: { productId?: string; limit?: number }): Promise<{ runs: PipelineRun[] }> {
  const params = new URLSearchParams();
  if (options?.productId) params.set("productId", options.productId);
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();

  const res = await fetch(`${API_BASE}/jobs${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((data as { error?: string }).error || `Failed to list pipeline jobs (${res.status})`);
  }
  return res.json() as Promise<{ runs: PipelineRun[] }>;
}

// ── Schedules ──

export interface PipelineSchedule {
  key: string;
  cron: string;
  timezone: string;
  config: PipelineJobInput;
}

export async function createSchedule(
  input: PipelineJobInput & { key: string; cron: string; timezone?: string },
): Promise<{ key: string; cron: string; timezone: string }> {
  const res = await fetch(`${API_BASE}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((data as { error?: string }).error || `Failed to create schedule (${res.status})`);
  }
  return res.json() as Promise<{ key: string; cron: string; timezone: string }>;
}

export async function listSchedules(): Promise<{ schedules: PipelineSchedule[] }> {
  const res = await fetch(`${API_BASE}/schedules`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((data as { error?: string }).error || `Failed to list schedules (${res.status})`);
  }
  return res.json() as Promise<{ schedules: PipelineSchedule[] }>;
}

export async function deleteSchedule(key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((data as { error?: string }).error || `Failed to delete schedule (${res.status})`);
  }
}

// ── Polling ──

export function pollPipelineJob(
  jobId: string,
  onUpdate: (run: PipelineRun) => void,
  intervalMs: number = 3000,
): { stop: () => void } {
  let active = true;

  const poll = async () => {
    while (active) {
      try {
        const run = await getPipelineJob(jobId);
        onUpdate(run);
        if (run.status === "completed" || run.status === "failed") {
          active = false;
          return;
        }
      } catch {
        // Silently retry on network errors
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  };

  poll();

  return {
    stop: () => { active = false; },
  };
}
