// ════════════════════════════════════════════════════════════════
// Keyword Research Agent Pipeline
// Orchestrates: seed expansion → competitor analysis → gap finding → scoring
// Powered by OpenAI Agents SDK + DataForSEO
// ════════════════════════════════════════════════════════════════

import { Agent, run } from "@openai/agents";
import { z } from "zod";
import {
  expandKeywords,
  labsKeywordSuggestions,
  labsRelatedKeywords,
  getSearchVolume,
  getCompetitorKeywords,
  getDomainIntersection,
  getCompetitorPaidKeywords,
  getAdTrafficProjection,
} from "./tools.ts";
import { rankKeywords } from "./scoring.ts";
import type { PipelineConfig, PipelineResult, ScoredKeyword, KeywordGap } from "./types.ts";

// ── Structured output schema ──

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

// ── Agent: Keyword Expander ──

const keywordExpander = new Agent<PipelineConfig, typeof KeywordExpansionOutput>({
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
  tools: [expandKeywords, labsKeywordSuggestions, labsRelatedKeywords, getSearchVolume],
  outputType: KeywordExpansionOutput,
});

// ── Agent: Competitor Analyzer ──

const competitorAnalyzer = new Agent<PipelineConfig, typeof CompetitorAnalysisOutput>({
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
  tools: [getCompetitorKeywords, getCompetitorPaidKeywords, getDomainIntersection],
  outputType: CompetitorAnalysisOutput,
});

// ── Agent: Final Reporter ──

const finalReporter = new Agent<PipelineConfig, typeof FinalReportOutput>({
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
- Volume >100/mo

These are the Financial Controllers and AP Managers actively searching for a solution RIGHT NOW.`,
  tools: [getAdTrafficProjection],
  outputType: FinalReportOutput,
});

// ════════════════════════════════════════════════════════════════
// PIPELINE RUNNER
// ════════════════════════════════════════════════════════════════

export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const startTime = Date.now();
  console.log("\n══════════════════════════════════════════");
  console.log("  ORION KEYWORD RESEARCH PIPELINE");
  console.log("══════════════════════════════════════════");
  console.log(`  Country: ${config.targetCountry}`);
  console.log(`  Seeds: ${config.seedKeywords.join(", ")}`);
  console.log(`  Competitors: ${config.competitors.join(", ")}`);
  console.log(`  CPC Range: £${config.cpcRange.min}-${config.cpcRange.max}`);
  console.log("══════════════════════════════════════════\n");

  // ── Step 1: Keyword Expansion ──
  console.log("▶ Step 1/3: Expanding seed keywords...");
  const expanderPrompt = `Expand these seed keywords for the ${config.targetCountry} market: ${config.seedKeywords.join(", ")}

Use the country code "${config.targetCountry}" for all API calls.
Find long-tail variations, related terms, and buyer-intent keywords.`;

  const expandResult = await run(keywordExpander, expanderPrompt, {
    context: config,
    maxTurns: 15,
  });

  const expandedKeywords = KeywordExpansionOutput.parse(expandResult.finalOutput);
  console.log(`  ✓ Found ${expandedKeywords.allKeywords.length} keywords`);
  console.log(`  ${expandedKeywords.summary}\n`);

  // ── Step 2: Competitor Analysis ──
  console.log("▶ Step 2/3: Analyzing competitor gaps...");
  const competitorPrompt = `Analyze these competitor domains in the ${config.targetCountry} market: ${config.competitors.join(", ")}

Use the country code "${config.targetCountry}" for all API calls.
Find keyword gaps — especially keywords they rank for organically but aren't bidding on in paid search.
Focus on keywords with buyer intent (transactional, commercial) and low competition.`;

  const competitorResult = await run(competitorAnalyzer, competitorPrompt, {
    context: config,
    maxTurns: 20,
  });

  const competitorAnalysis = CompetitorAnalysisOutput.parse(competitorResult.finalOutput);
  console.log(`  ✓ Found ${competitorAnalysis.gaps.length} competitor gaps`);
  console.log(`  ${competitorAnalysis.summary}\n`);

  // ── Step 3: Score and Rank ──
  console.log("▶ Step 3/3: Scoring and ranking keywords...");

  // Merge expansion keywords + competitor gaps
  const allRawKeywords = [
    ...expandedKeywords.allKeywords.map(kw => ({
      keyword: kw.keyword,
      volume: kw.volume,
      cpc: kw.cpc,
      competition: kw.competition,
      difficulty: kw.difficulty,
      intent: kw.intent,
      source: kw.source,
    })),
    ...competitorAnalysis.gaps.map(gap => ({
      keyword: gap.keyword,
      volume: gap.volume,
      cpc: gap.cpc,
      competition: gap.competition,
      difficulty: gap.difficulty,
      intent: gap.intent,
      source: `gap:${gap.competitorDomain}`,
    })),
  ];

  // Deduplicate by keyword (keep highest volume version)
  const deduped = new Map<string, typeof allRawKeywords[0]>();
  for (const kw of allRawKeywords) {
    const existing = deduped.get(kw.keyword.toLowerCase());
    if (!existing || kw.volume > existing.volume) {
      deduped.set(kw.keyword.toLowerCase(), kw);
    }
  }

  const scoredKeywords = rankKeywords([...deduped.values()], config.cpcRange);
  const sweetSpot = scoredKeywords.filter(k => k.tier === "sweet-spot");
  const highValue = scoredKeywords.filter(k => k.tier === "high-value");

  console.log(`  ✓ Scored ${scoredKeywords.length} unique keywords`);
  console.log(`  ✓ ${sweetSpot.length} sweet-spot keywords`);
  console.log(`  ✓ ${highValue.length} high-value keywords\n`);

  // ── Step 4: Generate final report ──
  console.log("▶ Generating strategic report...");
  const reportPrompt = `Here are the scored keyword results for the ${config.targetCountry} market.

TOP 30 KEYWORDS BY SCORE:
${scoredKeywords.slice(0, 30).map((k, i) =>
    `${i + 1}. "${k.keyword}" — vol:${k.volume}, cpc:£${k.cpc}, comp:${k.competition}, intent:${k.intent}, tier:${k.tier}, score:${k.score}`
  ).join("\n")}

COMPETITOR GAPS:
${competitorAnalysis.gaps.slice(0, 20).map((g, i) =>
    `${i + 1}. "${g.keyword}" — vol:${g.volume}, gap:${g.gapType}, competitor:${g.competitorDomain}, rank:${g.competitorRank}`
  ).join("\n")}

${config.product ? `PRODUCT: ${config.product.name} — ${config.product.description}` : ""}

Use country code "${config.targetCountry}" for any traffic projections.
Produce a strategic PPC report with top keyword picks and budget recommendations.`;

  const reportResult = await run(finalReporter, reportPrompt, {
    context: config,
    maxTurns: 8,
  });

  const report = FinalReportOutput.parse(reportResult.finalOutput);

  // ── Build final result ──
  const gaps: KeywordGap[] = competitorAnalysis.gaps.map(g => ({
    keyword: g.keyword,
    volume: g.volume,
    cpc: g.cpc,
    competition: g.competition,
    difficulty: g.difficulty,
    intent: g.intent,
    competitorDomain: g.competitorDomain,
    competitorRank: g.competitorRank,
    competitorEtv: g.competitorEtv,
    gapType: g.gapType as KeywordGap["gapType"],
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
      country: config.targetCountry,
      seedKeywords: config.seedKeywords,
      competitors: config.competitors,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    },
  };

  // ── Print report ──
  console.log("\n══════════════════════════════════════════");
  console.log("  PIPELINE RESULTS");
  console.log("══════════════════════════════════════════");
  console.log(`  Total keywords: ${result.summary.totalKeywordsFound}`);
  console.log(`  Sweet-spot:     ${result.summary.sweetSpotCount}`);
  console.log(`  High-value:     ${result.summary.highValueCount}`);
  console.log(`  Competitor gaps: ${result.summary.competitorGaps}`);
  console.log(`  Average CPC:    £${result.summary.avgCpc}`);
  console.log(`  Duration:       ${(result.metadata.duration / 1000).toFixed(1)}s`);
  console.log("");
  console.log("  TOP 10 KEYWORDS:");
  report.topKeywords.slice(0, 10).forEach((k, i) => {
    console.log(`  ${i + 1}. "${k.keyword}" [${k.tier}] — ${k.reason}`);
  });
  console.log("");
  console.log(`  MARKET: ${report.marketOpportunity}`);
  console.log(`  BUDGET: ${report.recommendedBudget}`);
  console.log("");
  console.log("  NEXT STEPS:");
  report.nextSteps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log("══════════════════════════════════════════\n");

  return result;
}
