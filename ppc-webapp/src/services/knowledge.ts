// ════════════════════════════════════════════════════════════════
// Knowledge Base Client — Crawling, search, and clustering
// ════════════════════════════════════════════════════════════════

const API_BASE = "/api/knowledge";

// ── Types ──

export interface CrawlJob {
  id: number;
  siteId: string;
  seedUrl: string;
  maxDepth: number;
  maxPages: number;
  status: string;
  pagesCrawled: number;
  pagesTotal: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface SiteStats {
  siteId: string;
  pageCount: number;
  chunkCount: number;
  lastCrawled: string;
}

export interface SearchResult {
  content: string;
  url: string;
  score: number;
  metadata: any;
  siteId: string;
}

export interface KeywordCluster {
  name: string;
  keywords: string[];
  centroid: number[];
  metadata: {
    avgVolume: number;
    avgCpc: number;
    dominantIntent: string;
    keywordCount: number;
  };
}

// ── API helper ──

async function apiCall(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<any> {
  const { method = "POST", body } = options;
  const fetchOpts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && method !== "GET" && method !== "DELETE") {
    fetchOpts.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${endpoint}`, fetchOpts);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ||
        `Knowledge API request failed (${response.status})`
    );
  }
  return data;
}

// ── Crawl management ──

export async function startCrawl(
  url: string,
  options?: { maxDepth?: number; maxPages?: number }
): Promise<{ jobId: number; siteId: string }> {
  const data = await apiCall("/crawl/start", {
    body: { url, ...options },
  });
  return data.result;
}

export async function getCrawlStatus(jobId: number): Promise<CrawlJob> {
  const data = await apiCall(`/crawl/status/${jobId}`, { method: "GET" });
  return data.result;
}

export async function getCrawlJobs(siteId?: string): Promise<CrawlJob[]> {
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  const data = await apiCall(`/crawl/jobs${query}`, { method: "GET" });
  return data.result;
}

export async function stopCrawl(jobId: number): Promise<{ stopped: boolean }> {
  const data = await apiCall(`/crawl/stop/${jobId}`);
  return data.result;
}

export async function deleteSite(
  siteId: string
): Promise<{ deleted: number }> {
  const data = await apiCall(`/crawl/site/${encodeURIComponent(siteId)}`, {
    method: "DELETE",
  });
  return data.result;
}

// ── Sites ──

export async function getSites(): Promise<SiteStats[]> {
  const data = await apiCall("/sites", { method: "GET" });
  return data.result;
}

// ── Search ──

export async function searchKnowledge(
  query: string,
  options?: { siteId?: string; limit?: number }
): Promise<SearchResult[]> {
  const data = await apiCall("/search", {
    body: { query, ...options },
  });
  return data.result;
}

// ── Clustering ──

export async function generateClusters(
  productId: string,
  keywords: { keyword: string; volume?: number; cpc?: number; intent?: string }[],
  distanceThreshold?: number
): Promise<KeywordCluster[]> {
  const data = await apiCall("/clusters/generate", {
    body: { productId, keywords, distanceThreshold },
  });
  return data.result;
}

export async function getClusters(
  productId: string
): Promise<KeywordCluster[]> {
  const data = await apiCall(`/clusters/${encodeURIComponent(productId)}`, {
    method: "GET",
  });
  return data.result;
}
