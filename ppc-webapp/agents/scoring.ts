// ════════════════════════════════════════════════════════════════
// Keyword scoring — volume × intent × (1/competition) × CPC affordability
// ════════════════════════════════════════════════════════════════

import type { ScoredKeyword } from "./types.ts";

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

export function scoreKeyword(
  kw: RawKeyword,
  cpcRange: { min: number; max: number } = { min: 3, max: 8 },
): ScoredKeyword {
  // Volume score: log-scaled, 0-100
  const volumeScore = Math.min(100, Math.max(0, Math.log10(Math.max(kw.volume, 1)) * 25));

  // Intent score: 0-100 based on buyer intent
  const intentScore = (INTENT_WEIGHTS[kw.intent] || 0.3) * 100;

  // Competition score: inverse — low competition = high score
  const comp = Math.max(0.01, Math.min(1, kw.competition));
  const competitionScore = Math.min(100, (1 / comp) * 10);

  // CPC affordability: peaks at sweet spot range, tapers outside
  let cpcAffordabilityScore: number;
  if (kw.cpc >= cpcRange.min && kw.cpc <= cpcRange.max) {
    cpcAffordabilityScore = 100;
  } else if (kw.cpc < cpcRange.min) {
    // Below range — may indicate low commercial intent
    cpcAffordabilityScore = Math.max(20, (kw.cpc / cpcRange.min) * 80);
  } else {
    // Above range — too expensive
    cpcAffordabilityScore = Math.max(10, 100 - ((kw.cpc - cpcRange.max) / cpcRange.max) * 60);
  }

  // Composite score: weighted geometric mean
  const score = (
    volumeScore * 0.25 +
    intentScore * 0.30 +
    competitionScore * 0.25 +
    cpcAffordabilityScore * 0.20
  );

  // Tier assignment
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

export function rankKeywords(
  keywords: RawKeyword[],
  cpcRange: { min: number; max: number } = { min: 3, max: 8 },
): ScoredKeyword[] {
  return keywords
    .map(kw => scoreKeyword(kw, cpcRange))
    .sort((a, b) => b.score - a.score);
}
