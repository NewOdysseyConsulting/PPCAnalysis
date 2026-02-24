// ════════════════════════════════════════════════════════════════
// Agent tools — call our Express API for DataForSEO data
// ════════════════════════════════════════════════════════════════

import { tool } from "@openai/agents";
import { z } from "zod";
import type { PipelineConfig } from "./types.ts";

// ── HTTP client for our Express backend ──

interface ApiCallOpts {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function callApi(
  baseUrl: string,
  endpoint: string,
  opts: ApiCallOpts = {},
  credentials?: { login: string; password: string },
): Promise<unknown> {
  const { method = "POST", body } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (credentials?.login && credentials?.password) {
    headers["x-dfs-login"] = credentials.login;
    headers["x-dfs-password"] = credentials.password;
  }

  const fetchOpts: RequestInit = { method, headers };
  if (body && method !== "GET") {
    fetchOpts.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, fetchOpts);
  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `API error (${response.status})`);
  }

  return data;
}

// ── Tool: Expand seed keywords via Google Ads suggestions ──

export const expandKeywords = tool({
  name: "expand_keywords",
  description:
    "Expand seed keywords using Google Ads Keywords-for-Keywords endpoint. " +
    "Returns keyword suggestions with volume, CPC, and competition data. " +
    "Use this for Google Ads-sourced keyword expansion.",
  parameters: z.object({
    keywords: z.array(z.string()).describe("Seed keywords to expand (max 20)"),
    countryCode: z.string().describe("Target country code (GB, US, DE, AU, CA, FR)"),
  }),
  execute: async (input, context) => {
    const config = context?.context as PipelineConfig;
    const data = await callApi(config.apiBaseUrl, "/api/keywords/suggestions", {
      body: {
        keywords: input.keywords.slice(0, 20),
        countryCode: input.countryCode,
        options: { sortBy: "search_volume" },
      },
    }) as { results: unknown[] };
    return JSON.stringify({
      count: data.results.length,
      keywords: data.results.slice(0, 50), // limit context size
    });
  },
});

// ── Tool: SERP-based keyword suggestions (Labs) ──

export const labsKeywordSuggestions = tool({
  name: "labs_keyword_suggestions",
  description:
    "Get SERP-derived keyword suggestions from DataForSEO Labs. " +
    "Finds keywords containing the seed phrase with volume and difficulty data. " +
    "Use this for long-tail discovery.",
  parameters: z.object({
    keyword: z.string().describe("Single seed keyword to expand"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const config = context?.context as PipelineConfig;
    const data = await callApi(config.apiBaseUrl, "/api/keywords/labs/suggestions", {
      body: {
        keyword: input.keyword,
        countryCode: input.countryCode,
        options: { limit: 500 },
      },
    }) as { results: unknown[] };
    return JSON.stringify({
      count: data.results.length,
      keywords: data.results.slice(0, 50),
    });
  },
});

// ── Tool: SERP-related keywords (Labs) ──

export const labsRelatedKeywords = tool({
  name: "labs_related_keywords",
  description:
    "Get SERP-related keywords from Google's 'searches related to' data. " +
    "Discovers adjacent queries people also search for. " +
    "Use this for discovering laterally related terms.",
  parameters: z.object({
    keyword: z.string().describe("Seed keyword"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const config = context?.context as PipelineConfig;
    const data = await callApi(config.apiBaseUrl, "/api/keywords/labs/related", {
      body: {
        keyword: input.keyword,
        countryCode: input.countryCode,
        options: { depth: 2, limit: 200 },
      },
    }) as { results: unknown[] };
    return JSON.stringify({
      count: data.results.length,
      keywords: data.results.slice(0, 40),
    });
  },
});

// ── Tool: Get search volume for keywords ──

export const getSearchVolume = tool({
  name: "get_search_volume",
  description:
    "Get Google Ads search volume, CPC, and competition data for a batch of keywords. " +
    "Use this to enrich keywords that don't have volume data yet.",
  parameters: z.object({
    keywords: z.array(z.string()).describe("Keywords to get volume for (max 1000)"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const config = context?.context as PipelineConfig;
    const data = await callApi(config.apiBaseUrl, "/api/keywords/search-volume", {
      body: {
        keywords: input.keywords.slice(0, 1000),
        countryCode: input.countryCode,
        options: { sortBy: "search_volume" },
      },
    }) as { results: unknown[] };
    return JSON.stringify({
      count: data.results.length,
      keywords: data.results.slice(0, 100),
    });
  },
});

// ── Tool: Competitor ranked keywords ──

export const getCompetitorKeywords = tool({
  name: "get_competitor_keywords",
  description:
    "Get all keywords a competitor domain ranks for organically in Google. " +
    "Returns keyword, rank position, estimated traffic, and metrics. " +
    "Use this to find what competitors rank for.",
  parameters: z.object({
    domain: z.string().describe("Competitor domain (e.g. bill.com)"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const config = context?.context as PipelineConfig;
    const data = await callApi(config.apiBaseUrl, "/api/keywords/labs/ranked", {
      body: {
        target: input.domain,
        countryCode: input.countryCode,
        options: { itemTypes: ["organic"], limit: 1000 },
      },
    }) as { results: unknown[] };
    return JSON.stringify({
      domain: input.domain,
      count: data.results.length,
      keywords: data.results.slice(0, 50),
    });
  },
});

// ── Tool: Domain intersection (shared/unique keywords) ──

export const getDomainIntersection = tool({
  name: "get_domain_intersection",
  description:
    "Compare two domains to find shared or unique keywords. " +
    "Set intersections=true for shared keywords, false for keywords unique to domain1. " +
    "Use this for gap analysis between your domain and competitors.",
  parameters: z.object({
    domain1: z.string().describe("First domain"),
    domain2: z.string().describe("Second domain"),
    countryCode: z.string().describe("Target country code"),
    findUnique: z.boolean().describe("If true, find keywords unique to domain1 (gap analysis)"),
  }),
  execute: async (input, context) => {
    const config = context?.context as PipelineConfig;
    const data = await callApi(config.apiBaseUrl, "/api/keywords/labs/intersection", {
      body: {
        target1: input.domain1,
        target2: input.domain2,
        countryCode: input.countryCode,
        options: {
          intersections: !input.findUnique,
          itemTypes: ["organic"],
          limit: 1000,
        },
      },
    }) as { results: unknown[] };
    return JSON.stringify({
      domain1: input.domain1,
      domain2: input.domain2,
      type: input.findUnique ? "unique-to-domain1" : "shared",
      count: data.results.length,
      keywords: data.results.slice(0, 50),
    });
  },
});

// ── Tool: Get competitor's paid keywords ──

export const getCompetitorPaidKeywords = tool({
  name: "get_competitor_paid_keywords",
  description:
    "Get keywords a competitor is actively bidding on in Google Ads. " +
    "Use this alongside organic keywords to find gaps where competitors rank organically but aren't bidding.",
  parameters: z.object({
    domain: z.string().describe("Competitor domain"),
    countryCode: z.string().describe("Target country code"),
  }),
  execute: async (input, context) => {
    const config = context?.context as PipelineConfig;
    const data = await callApi(config.apiBaseUrl, "/api/keywords/for-site", {
      body: {
        target: input.domain,
        countryCode: input.countryCode,
        options: { sortBy: "search_volume" },
      },
    }) as { results: unknown[] };
    return JSON.stringify({
      domain: input.domain,
      type: "paid",
      count: data.results.length,
      keywords: data.results.slice(0, 50),
    });
  },
});

// ── Tool: Ad traffic projections ──

export const getAdTrafficProjection = tool({
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
    const config = context?.context as PipelineConfig;
    const data = await callApi(config.apiBaseUrl, "/api/keywords/ad-traffic", {
      body: {
        keywords: input.keywords.slice(0, 1000),
        countryCode: input.countryCode,
        options: { bid: input.bidCents, match: "exact" },
      },
    }) as { results: unknown[] };
    return JSON.stringify({
      count: data.results.length,
      projections: data.results.slice(0, 50),
    });
  },
});

export const ALL_TOOLS = [
  expandKeywords,
  labsKeywordSuggestions,
  labsRelatedKeywords,
  getSearchVolume,
  getCompetitorKeywords,
  getDomainIntersection,
  getCompetitorPaidKeywords,
  getAdTrafficProjection,
];
