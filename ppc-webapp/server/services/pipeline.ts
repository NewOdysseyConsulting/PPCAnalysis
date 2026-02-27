// ════════════════════════════════════════════════════════════════
// Pipeline Service — Keyword research agent pipeline as a pg-boss job
// Replaces agents/ CLI runner with server-side execution
// ════════════════════════════════════════════════════════════════

import { Agent, run } from "@openai/agents";
import { tool } from "@openai/agents";
import { z } from "zod";
import type { PgBoss } from "pg-boss";
import * as dfs from "./dataforseo.ts";
import type { Credentials } from "./dataforseo.ts";
import { getDb } from "./db.ts";

// ── Types ──────────────────────────────────────────────────────

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

interface PipelineContext {
  seedKeywords: string[];
  targetCountry: string;
  competitors: string[];
  cpcRange: { min: number; max: number };
  product?: { name: string; description: string; target?: string; integrations?: string };
  credentials: Credentials;
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

// ── Scoring ────────────────────────────────────────────────────

interface RawKeyword {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: string;
  source: string;
}

const INTENT_WEIGHTS: Record<string, number> = {
  transactional: 1.0,
  commercial: 0.75,
  informational: 0.3,
  navigational: 0.15,
};

function scoreKeyword(kw: RawKeyword, cpcRange: { min: number; max: number }): ScoredKeyword {
  const volumeScore = Math.min(100, Math.max(0, Math.log10(Math.max(kw.volume, 1)) * 25));
  const intentScore = (INTENT_WEIGHTS[kw.intent] || 0.3) * 100;
  const comp = Math.max(0.01, Math.min(1, kw.competition));
  const competitionScore = Math.min(100, (1 / comp) * 10);

  let cpcAffordabilityScore: number;
  if (kw.cpc >= cpcRange.min && kw.cpc <= cpcRange.max) {
    cpcAffordabilityScore = 100;
  } else if (kw.cpc < cpcRange.min) {
    cpcAffordabilityScore = Math.max(20, (kw.cpc / cpcRange.min) * 80);
  } else {
    cpcAffordabilityScore = Math.max(10, 100 - ((kw.cpc - cpcRange.max) / cpcRange.max) * 60);
  }

  const score = volumeScore * 0.25 + intentScore * 0.30 + competitionScore * 0.25 + cpcAffordabilityScore * 0.20;

  let tier: ScoredKeyword["tier"];
  if (
    kw.competition < 0.25 &&
    (kw.intent === "transactional" || kw.intent === "commercial") &&
    kw.cpc >= cpcRange.min && kw.cpc <= cpcRange.max
  ) {
    tier = "sweet-spot";
  } else if (intentScore >= 70 && competitionScore >= 40) {
    tier = "high-value";
  } else if (volumeScore >= 50 || intentScore >= 50) {
    tier = "monitor";
  } else {
    tier = "low-priority";
  }

  return {
    keyword: kw.keyword,
    volume: kw.volume,
    cpc: kw.cpc,
    competition: kw.competition,
    difficulty: kw.difficulty,
    intent: kw.intent,
    score: Math.round(score * 100) / 100,
    scoreBreakdown: {
      volumeScore: Math.round(volumeScore * 100) / 100,
      intentScore: Math.round(intentScore * 100) / 100,
      competitionScore: Math.round(competitionScore * 100) / 100,
      cpcAffordabilityScore: Math.round(cpcAffordabilityScore * 100) / 100,
    },
    source: kw.source,
    tier,
  };
}

function rankKeywords(keywords: RawKeyword[], cpcRange: { min: number; max: number }): ScoredKeyword[] {
  return keywords.map(kw => scoreKeyword(kw, cpcRange)).sort((a, b) => b.score - a.score);
}

// ── Tools (call DataForSEO service directly) ───────────────────

const expandKeywordsTool = tool({
  name: "expand_keywords",
  description:
    "Expand seed keywords using Google Ads Keywords-for-Keywords endpoint. " +
    "Returns keyword suggestions with volume, CPC, and competition data.",
  parameters: z.object({
    keywords: z.array(z.string()).describe("Seed keywords to expand (max 20)"),
    countryCode: z.string().describe("Target country code (GB, US, DE, AU, CA, FR)"),
  }),
  execute: async (input, context) => {
    const ctx = context?.context as PipelineContext;
    const results = await dfs.getKeywordsForKeywords(
      input.keywords.slice(0, 20), input.countryCode, ctx.credentials, { sortBy: "search_volume" },
    );
    return JSON.stringify({ count: results.length, keywords: results.slice(0, 50) });
  },
});

const labsKeywordSuggestionsTool = tool({
  name: "labs_keyword_suggestions",
  description:
    "Get SERP-derived keyword suggestions from DataForSEO Labs. " +
    "Finds keywords containing the seed phrase with volume and difficulty data.",
  parameters: z.object({
    keyword: z.string().describe("Single seed keyword to expand"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const ctx = context?.context as PipelineContext;
    const results = await dfs.getLabsKeywordSuggestions(
      input.keyword, input.countryCode, ctx.credentials, { limit: 500 },
    );
    return JSON.stringify({ count: results.length, keywords: results.slice(0, 50) });
  },
});

const labsRelatedKeywordsTool = tool({
  name: "labs_related_keywords",
  description:
    "Get SERP-related keywords from Google's 'searches related to' data. " +
    "Discovers adjacent queries people also search for.",
  parameters: z.object({
    keyword: z.string().describe("Seed keyword"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const ctx = context?.context as PipelineContext;
    const results = await dfs.getLabsRelatedKeywords(
      input.keyword, input.countryCode, ctx.credentials, { depth: 2, limit: 200 },
    );
    return JSON.stringify({ count: results.length, keywords: results.slice(0, 40) });
  },
});

const getSearchVolumeTool = tool({
  name: "get_search_volume",
  description:
    "Get Google Ads search volume, CPC, and competition data for a batch of keywords. " +
    "Use this to enrich keywords that don't have volume data yet.",
  parameters: z.object({
    keywords: z.array(z.string()).describe("Keywords to get volume for (max 1000)"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const ctx = context?.context as PipelineContext;
    const results = await dfs.getSearchVolume(
      input.keywords.slice(0, 1000), input.countryCode, ctx.credentials, { sortBy: "search_volume" },
    );
    return JSON.stringify({ count: results.length, keywords: results.slice(0, 100) });
  },
});

const getCompetitorKeywordsTool = tool({
  name: "get_competitor_keywords",
  description:
    "Get all keywords a competitor domain ranks for organically in Google. " +
    "Returns keyword, rank position, estimated traffic, and metrics.",
  parameters: z.object({
    domain: z.string().describe("Competitor domain (e.g. bill.com)"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const ctx = context?.context as PipelineContext;
    const results = await dfs.getLabsRankedKeywords(
      input.domain, input.countryCode, ctx.credentials, { itemTypes: ["organic"], limit: 1000 },
    );
    return JSON.stringify({ domain: input.domain, count: results.length, keywords: results.slice(0, 50) });
  },
});

const getDomainIntersectionTool = tool({
  name: "get_domain_intersection",
  description:
    "Compare two domains to find shared or unique keywords. " +
    "Set findUnique=true for keywords unique to domain1 (gap analysis).",
  parameters: z.object({
    domain1: z.string().describe("First domain"),
    domain2: z.string().describe("Second domain"),
    countryCode: z.string().describe("Target country code"),
    findUnique: z.boolean().describe("If true, find keywords unique to domain1"),
  }),
  execute: async (input, context) => {
    const ctx = context?.context as PipelineContext;
    const results = await dfs.getLabsDomainIntersection(
      input.domain1, input.domain2, input.countryCode, ctx.credentials,
      { intersections: !input.findUnique, itemTypes: ["organic"], limit: 1000 },
    );
    return JSON.stringify({
      domain1: input.domain1, domain2: input.domain2,
      type: input.findUnique ? "unique-to-domain1" : "shared",
      count: results.length, keywords: results.slice(0, 50),
    });
  },
});

const getCompetitorPaidKeywordsTool = tool({
  name: "get_competitor_paid_keywords",
  description:
    "Get keywords a competitor is actively bidding on in Google Ads. " +
    "Use this alongside organic keywords to find gaps.",
  parameters: z.object({
    domain: z.string().describe("Competitor domain"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const ctx = context?.context as PipelineContext;
    const results = await dfs.getKeywordsForSite(
      input.domain, input.countryCode, ctx.credentials, { sortBy: "search_volume" },
    );
    return JSON.stringify({ domain: input.domain, type: "paid", count: results.length, keywords: results.slice(0, 50) });
  },
});

const getAdTrafficProjectionTool = tool({
  name: "get_ad_traffic_projection",
  description:
    "Get projected ad traffic (impressions, clicks, cost) for keywords at a given bid. " +
    "Use this to estimate budget and traffic for the final keyword list.",
  parameters: z.object({
    keywords: z.array(z.string()).describe("Keywords to project (max 1000)"),
    countryCode: z.string().describe("Target country code"),
    bidCents: z.number().describe("Max CPC bid in USD cents (e.g. 500 = $5.00)"),
  }),
  execute: async (input, context) => {
    const ctx = context?.context as PipelineContext;
    const results = await dfs.getAdTrafficByKeywords(
      input.keywords.slice(0, 1000), input.countryCode, ctx.credentials, { bid: input.bidCents, match: "exact" },
    );
    return JSON.stringify({ count: results.length, projections: results.slice(0, 50) });
  },
});

// ── Structured output schemas ──────────────────────────────────

const KeywordExpansionOutput = z.object({
  allKeywords: z.array(z.object({
    keyword: z.string(),
    volume: z.number(),
    cpc: z.number(),
    competition: z.number(),
    difficulty: z.number(),
    intent: z.string(),
    source: z.string(),
  })),
  summary: z.string(),
});

const CompetitorAnalysisOutput = z.object({
  gaps: z.array(z.object({
    keyword: z.string(),
    volume: z.number(),
    cpc: z.number(),
    competition: z.number(),
    difficulty: z.number(),
    intent: z.string(),
    competitorDomain: z.string(),
    competitorRank: z.number(),
    competitorEtv: z.number(),
    gapType: z.string(),
  })),
  summary: z.string(),
});

const FinalReportOutput = z.object({
  topKeywords: z.array(z.object({
    keyword: z.string(),
    volume: z.number(),
    cpc: z.number(),
    competition: z.number(),
    intent: z.string(),
    tier: z.string(),
    reason: z.string(),
  })),
  marketOpportunity: z.string(),
  recommendedBudget: z.string(),
  nextSteps: z.array(z.string()),
});

// ── Agent definitions ──────────────────────────────────────────

const keywordExpander = new Agent<PipelineContext, typeof KeywordExpansionOutput>({
  name: "Keyword Expander",
  model: "gpt-4.1",
  instructions: `You are a keyword research specialist. Your job is to expand seed keywords into a comprehensive list.

For EACH seed keyword, you must call ALL THREE expansion tools:
1. expand_keywords — Google Ads keyword suggestions (use all seeds together)
2. labs_keyword_suggestions — SERP-derived suggestions (call per seed)
3. labs_related_keywords — Related SERP queries (call per seed)

After expansion, deduplicate the results and return ALL unique keywords with their metrics.
Focus on finding long-tail keywords with clear buyer intent.

Return your results as a structured JSON with allKeywords array and a brief summary.`,
  tools: [expandKeywordsTool, labsKeywordSuggestionsTool, labsRelatedKeywordsTool, getSearchVolumeTool],
  outputType: KeywordExpansionOutput,
});

const competitorAnalyzer = new Agent<PipelineContext, typeof CompetitorAnalysisOutput>({
  name: "Competitor Analyzer",
  model: "gpt-4.1",
  instructions: `You are a competitive intelligence specialist. Your job is to find keyword gaps.

For EACH competitor domain:
1. Call get_competitor_keywords to get their ORGANIC rankings
2. Call get_competitor_paid_keywords to get their PAID keywords
3. Compare organic vs paid to find gaps:
   - Keywords they rank for organically but DON'T bid on (organic-only gaps)
   - Keywords where they rank poorly (position >10) but have high search intent
   - Keywords with low competition that they're not targeting

Also use get_domain_intersection to compare competitors against each other and find keywords where multiple competitors rank but competition is still relatively low.

Classify each gap as: "organic-only", "low-competition-high-intent", or "untapped".
Return gaps sorted by opportunity (high volume + low competition + buyer intent).`,
  tools: [getCompetitorKeywordsTool, getCompetitorPaidKeywordsTool, getDomainIntersectionTool],
  outputType: CompetitorAnalysisOutput,
});

const finalReporter = new Agent<PipelineContext, typeof FinalReportOutput>({
  name: "PPC Strategist",
  model: "gpt-4.1",
  instructions: `You are a senior PPC strategist specializing in B2B SaaS.

You receive a scored keyword list and competitor gaps. Your job is to:
1. Identify the top 20 keywords that are the best opportunities
2. For EACH keyword, explain WHY it's a good target (e.g., "Low competition 0.12, transactional intent, £4.20 CPC — Financial Controllers searching for a solution")
3. Estimate a recommended monthly Google Ads budget based on the keyword CPCs and volumes
4. Assess the overall market opportunity
5. Provide 3-5 concrete next steps

Focus on the "sweet spot" — long-tail keywords with:
- Low competition (<0.25)
- Buyer intent (transactional or commercial)
- CPC in the affordable range
- Volume >100/mo`,
  tools: [getAdTrafficProjectionTool],
  outputType: FinalReportOutput,
});

// ── DB helpers ─────────────────────────────────────────────────

async function updateRun(id: string, updates: Record<string, unknown>): Promise<void> {
  await getDb()("pipeline_runs").where({ id }).update(updates);
}

function getCredentials(): Credentials {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for pipeline execution");
  }
  return { login, password };
}

// ── Pipeline runner ────────────────────────────────────────────

async function executePipeline(jobId: string, input: PipelineJobInput): Promise<PipelineResult> {
  const credentials = getCredentials();
  const startTime = Date.now();

  const ctx: PipelineContext = {
    seedKeywords: input.seedKeywords,
    targetCountry: input.targetCountry,
    competitors: input.competitors,
    cpcRange: input.cpcRange,
    product: input.product,
    credentials,
  };

  // ── Stage 1: Keyword Expansion ──
  await updateRun(jobId, { status: "expanding", stage_detail: "Expanding seed keywords...", started_at: new Date() });
  console.log(`[Pipeline:${jobId.slice(0, 8)}] Stage 1: Expanding keywords...`);

  const expanderPrompt = `Expand these seed keywords for the ${ctx.targetCountry} market: ${ctx.seedKeywords.join(", ")}

Use the country code "${ctx.targetCountry}" for all API calls.
Find long-tail variations, related terms, and buyer-intent keywords.`;

  const expandResult = await run(keywordExpander, expanderPrompt, { context: ctx, maxTurns: 15 });
  const expandedKeywords = KeywordExpansionOutput.parse(expandResult.finalOutput);

  await updateRun(jobId, { stage_detail: `Found ${expandedKeywords.allKeywords.length} keywords. Analyzing competitors...` });
  console.log(`[Pipeline:${jobId.slice(0, 8)}]   Found ${expandedKeywords.allKeywords.length} keywords`);

  // ── Stage 2: Competitor Analysis ──
  await updateRun(jobId, { status: "analyzing", stage_detail: `Analyzing ${ctx.competitors.length} competitor domains...` });
  console.log(`[Pipeline:${jobId.slice(0, 8)}] Stage 2: Analyzing competitors...`);

  const competitorPrompt = `Analyze these competitor domains in the ${ctx.targetCountry} market: ${ctx.competitors.join(", ")}

Use the country code "${ctx.targetCountry}" for all API calls.
Find keyword gaps — especially keywords they rank for organically but aren't bidding on in paid search.
Focus on keywords with buyer intent (transactional, commercial) and low competition.`;

  const competitorResult = await run(competitorAnalyzer, competitorPrompt, { context: ctx, maxTurns: 20 });
  const competitorAnalysis = CompetitorAnalysisOutput.parse(competitorResult.finalOutput);

  console.log(`[Pipeline:${jobId.slice(0, 8)}]   Found ${competitorAnalysis.gaps.length} competitor gaps`);

  // ── Stage 3: Score and Rank ──
  await updateRun(jobId, { status: "scoring", stage_detail: "Scoring and ranking keywords..." });
  console.log(`[Pipeline:${jobId.slice(0, 8)}] Stage 3: Scoring keywords...`);

  const allRawKeywords: RawKeyword[] = [
    ...expandedKeywords.allKeywords.map(kw => ({
      keyword: kw.keyword, volume: kw.volume, cpc: kw.cpc,
      competition: kw.competition, difficulty: kw.difficulty,
      intent: kw.intent, source: kw.source,
    })),
    ...competitorAnalysis.gaps.map(gap => ({
      keyword: gap.keyword, volume: gap.volume, cpc: gap.cpc,
      competition: gap.competition, difficulty: gap.difficulty,
      intent: gap.intent, source: `gap:${gap.competitorDomain}`,
    })),
  ];

  // Deduplicate by keyword (keep highest volume version)
  const deduped = new Map<string, RawKeyword>();
  for (const kw of allRawKeywords) {
    const existing = deduped.get(kw.keyword.toLowerCase());
    if (!existing || kw.volume > existing.volume) {
      deduped.set(kw.keyword.toLowerCase(), kw);
    }
  }

  const scoredKeywords = rankKeywords([...deduped.values()], ctx.cpcRange);
  const sweetSpot = scoredKeywords.filter(k => k.tier === "sweet-spot");
  const highValue = scoredKeywords.filter(k => k.tier === "high-value");

  console.log(`[Pipeline:${jobId.slice(0, 8)}]   ${scoredKeywords.length} scored, ${sweetSpot.length} sweet-spot, ${highValue.length} high-value`);

  // ── Stage 4: Generate Final Report ──
  await updateRun(jobId, { status: "reporting", stage_detail: "Generating strategic report..." });
  console.log(`[Pipeline:${jobId.slice(0, 8)}] Stage 4: Generating report...`);

  const reportPrompt = `Here are the scored keyword results for the ${ctx.targetCountry} market.

TOP 30 KEYWORDS BY SCORE:
${scoredKeywords.slice(0, 30).map((k, i) =>
    `${i + 1}. "${k.keyword}" — vol:${k.volume}, cpc:£${k.cpc}, comp:${k.competition}, intent:${k.intent}, tier:${k.tier}, score:${k.score}`
  ).join("\n")}

COMPETITOR GAPS:
${competitorAnalysis.gaps.slice(0, 20).map((g, i) =>
    `${i + 1}. "${g.keyword}" — vol:${g.volume}, gap:${g.gapType}, competitor:${g.competitorDomain}, rank:${g.competitorRank}`
  ).join("\n")}

${ctx.product ? `PRODUCT: ${ctx.product.name} — ${ctx.product.description}` : ""}

Use country code "${ctx.targetCountry}" for any traffic projections.
Produce a strategic PPC report with top keyword picks and budget recommendations.`;

  const reportResult = await run(finalReporter, reportPrompt, { context: ctx, maxTurns: 8 });
  const report = FinalReportOutput.parse(reportResult.finalOutput);

  // ── Build result ──
  const gaps: KeywordGap[] = competitorAnalysis.gaps.map(g => ({
    keyword: g.keyword, volume: g.volume, cpc: g.cpc,
    competition: g.competition, difficulty: g.difficulty, intent: g.intent,
    competitorDomain: g.competitorDomain, competitorRank: g.competitorRank,
    competitorEtv: g.competitorEtv, gapType: g.gapType as KeywordGap["gapType"],
  }));

  const avgCpc = scoredKeywords.length > 0
    ? scoredKeywords.reduce((a, k) => a + k.cpc, 0) / scoredKeywords.length
    : 0;

  const result: PipelineResult = {
    keywords: scoredKeywords,
    gaps,
    summary: {
      totalKeywordsFound: scoredKeywords.length,
      sweetSpotCount: sweetSpot.length,
      highValueCount: highValue.length,
      avgCpc: Math.round(avgCpc * 100) / 100,
      topKeyword: scoredKeywords[0]?.keyword || "—",
      competitorGaps: gaps.length,
      marketOpportunity: report.marketOpportunity,
    },
    metadata: {
      country: ctx.targetCountry,
      seedKeywords: ctx.seedKeywords,
      competitors: ctx.competitors,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    },
  };

  console.log(`[Pipeline:${jobId.slice(0, 8)}] Complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s — ${scoredKeywords.length} keywords`);
  return result;
}

// ── pg-boss worker registration ────────────────────────────────

export const PIPELINE_QUEUE = "keyword-research-pipeline";

export async function registerPipelineWorker(boss: PgBoss): Promise<void> {
  await boss.work<PipelineJobInput>(
    PIPELINE_QUEUE,
    { localConcurrency: 1 },
    async (jobs) => {
      const job = jobs[0];

      // Ensure pipeline_runs row exists (scheduled jobs won't have one)
      await getDb()("pipeline_runs")
        .insert({
          id: job.id,
          product_id: job.data.productId || null,
          status: "queued",
          config: job.data,
          created_at: new Date(),
        })
        .onConflict("id")
        .ignore();

      try {
        const result = await executePipeline(job.id, job.data);
        await updateRun(job.id, {
          status: "completed",
          stage_detail: null,
          result,
          completed_at: new Date(),
        });
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Pipeline:${job.id.slice(0, 8)}] Failed:`, message);
        await updateRun(job.id, {
          status: "failed",
          stage_detail: null,
          error: message,
          completed_at: new Date(),
        });
        throw err;
      }
    },
  );
  console.log("[Pipeline] Worker registered");
}

// ── Public API ─────────────────────────────────────────────────

export async function submitPipelineJob(input: PipelineJobInput): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for pipeline execution");
  }
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for pipeline execution");
  }

  const { getJobQueue } = await import("./jobQueue.ts");
  const boss = getJobQueue();

  const jobId = await boss.send(PIPELINE_QUEUE, input, {
    expireInSeconds: 1800,
    retryLimit: 0,
  });

  if (!jobId) throw new Error("Failed to create pipeline job");

  await getDb()("pipeline_runs").insert({
    id: jobId,
    product_id: input.productId || null,
    status: "queued",
    config: input,
    created_at: new Date(),
  });

  return jobId;
}

interface PipelineRunRow {
  id: string;
  product_id: string | null;
  status: string;
  stage_detail: string | null;
  config: PipelineJobInput;
  result: PipelineResult | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

function rowToRun(row: PipelineRunRow): PipelineRun {
  return {
    id: row.id,
    productId: row.product_id,
    status: row.status as PipelineStatus,
    stageDetail: row.stage_detail,
    config: row.config,
    result: row.result,
    error: row.error,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export async function getPipelineRun(id: string): Promise<PipelineRun | null> {
  const row = await getDb()("pipeline_runs").where({ id }).first() as PipelineRunRow | undefined;
  if (!row) return null;
  return rowToRun(row);
}

export async function listPipelineRuns(options?: { productId?: string; limit?: number }): Promise<PipelineRun[]> {
  let query = getDb()("pipeline_runs").orderBy("created_at", "desc").limit(options?.limit || 20);
  if (options?.productId) {
    query = query.where({ product_id: options.productId });
  }
  const rows = await query as PipelineRunRow[];
  return rows.map(rowToRun);
}

// ── Schedules ──────────────────────────────────────────────────

export interface PipelineSchedule {
  key: string;
  cron: string;
  timezone: string;
  config: PipelineJobInput;
}

export async function createPipelineSchedule(
  key: string,
  cron: string,
  input: PipelineJobInput,
  timezone: string = "UTC",
): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for pipeline execution");
  }
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for pipeline execution");
  }

  const { getJobQueue } = await import("./jobQueue.ts");
  const boss = getJobQueue();

  await boss.schedule(PIPELINE_QUEUE, cron, input, {
    key,
    tz: timezone,
    expireInSeconds: 1800,
    retryLimit: 0,
  });

  console.log(`[Pipeline] Schedule created: key=${key}, cron="${cron}", tz=${timezone}`);
}

export async function deletePipelineSchedule(key: string): Promise<void> {
  const { getJobQueue } = await import("./jobQueue.ts");
  const boss = getJobQueue();
  await boss.unschedule(PIPELINE_QUEUE, key);
  console.log(`[Pipeline] Schedule deleted: key=${key}`);
}

export async function listPipelineSchedules(): Promise<PipelineSchedule[]> {
  const { getJobQueue } = await import("./jobQueue.ts");
  const boss = getJobQueue();
  const schedules = await boss.getSchedules(PIPELINE_QUEUE);
  return schedules.map(s => ({
    key: s.key,
    cron: s.cron,
    timezone: s.timezone,
    config: (s.data || {}) as PipelineJobInput,
  }));
}
