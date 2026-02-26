// ════════════════════════════════════════════════════════════════
// Recursive Site Crawler — BFS crawl with embedding generation
// Wraps the single-page crawlWebsite() with queue + persistence
// ════════════════════════════════════════════════════════════════

import { crawlWebsite } from "./crawl.ts";
import { getDb } from "./db.ts";
import {
  generateEmbeddings,
  storeChunkEmbeddings,
  chunkText,
  estimateTokens,
} from "./embeddings.ts";
import robotsParser from "robots-parser";

// ── Types ──

export interface CrawlJobOptions {
  maxDepth?: number;
  maxPages?: number;
  delayMs?: number;
  excludePatterns?: string[];
}

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

interface QueueItem {
  url: string;
  depth: number;
}

// ── Active jobs tracking ──

const activeJobs = new Map<number, { abort: boolean }>();

// ── Public API ──

export async function startSiteCrawl(
  seedUrl: string,
  options: CrawlJobOptions = {}
): Promise<{ jobId: number; siteId: string }> {
  const { maxDepth = 2, maxPages = 50 } = options;

  let normalised = seedUrl.trim();
  if (!normalised.startsWith("http://") && !normalised.startsWith("https://")) {
    normalised = "https://" + normalised;
  }

  const siteId = extractDomain(normalised);
  const db = getDb();

  const [row] = await db("crawl_jobs")
    .insert({
      site_id: siteId,
      seed_url: normalised,
      max_depth: maxDepth,
      max_pages: maxPages,
      status: "queued",
    })
    .returning("id");

  const jobId = row.id;

  const handle = { abort: false };
  activeJobs.set(jobId, handle);
  runCrawlLoop(jobId, normalised, siteId, {
    ...options,
    maxDepth,
    maxPages,
  }).catch(async (err) => {
    console.error(`[SiteCrawler] Job ${jobId} failed:`, err);
    await db("crawl_jobs")
      .where("id", jobId)
      .update({ status: "failed", error: err.message, completed_at: db.fn.now() });
  }).finally(() => {
    activeJobs.delete(jobId);
  });

  return { jobId, siteId };
}

export async function getCrawlStatus(jobId: number): Promise<CrawlJob | null> {
  const db = getDb();
  const row = await db("crawl_jobs").where("id", jobId).first();
  if (!row) return null;
  return mapCrawlJob(row);
}

export async function getCrawlJobs(siteId?: string): Promise<CrawlJob[]> {
  const db = getDb();
  let query = db("crawl_jobs").orderBy("created_at", "desc");
  if (siteId) {
    query = query.where("site_id", siteId);
  }
  const rows = await query;
  return rows.map(mapCrawlJob);
}

export function stopCrawlJob(jobId: number): boolean {
  const handle = activeJobs.get(jobId);
  if (handle) {
    handle.abort = true;
    return true;
  }
  return false;
}

export async function deleteSiteData(siteId: string): Promise<number> {
  const db = getDb();
  // Chunks are cascade-deleted when pages are deleted
  const deleted = await db("crawled_pages").where("site_id", siteId).del();
  await db("crawl_jobs").where("site_id", siteId).del();
  return deleted;
}

export async function getSiteStats(): Promise<{
  siteId: string;
  pageCount: number;
  chunkCount: number;
  lastCrawled: string;
}[]> {
  const db = getDb();
  const rows = await db("crawled_pages as cp")
    .leftJoin("content_chunks as cc", "cc.page_id", "cp.id")
    .where("cp.status", "crawled")
    .groupBy("cp.site_id")
    .orderByRaw("MAX(cp.crawled_at) DESC")
    .select(
      "cp.site_id",
      db.raw("COUNT(DISTINCT cp.id) as page_count"),
      db.raw("COUNT(cc.id) as chunk_count"),
      db.raw("MAX(cp.crawled_at) as last_crawled")
    );

  return rows.map((r: any) => ({
    siteId: r.site_id,
    pageCount: parseInt(r.page_count, 10),
    chunkCount: parseInt(r.chunk_count, 10),
    lastCrawled: r.last_crawled,
  }));
}

// ── Internal: Crawl loop ──

async function runCrawlLoop(
  jobId: number,
  seedUrl: string,
  siteId: string,
  options: Required<Pick<CrawlJobOptions, "maxDepth" | "maxPages">> & CrawlJobOptions
): Promise<void> {
  const db = getDb();
  const { maxDepth, maxPages, delayMs = 1000, excludePatterns = [] } = options;

  await db("crawl_jobs")
    .where("id", jobId)
    .update({ status: "running", started_at: db.fn.now() });

  // Fetch and parse robots.txt
  let robots: ReturnType<typeof robotsParser> | null = null;
  try {
    const robotsUrl = new URL("/robots.txt", seedUrl).href;
    const resp = await fetch(robotsUrl, {
      headers: { "User-Agent": "OrionBot/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const robotsTxt = await resp.text();
      robots = robotsParser(robotsUrl, robotsTxt);
    }
  } catch {
    // No robots.txt — proceed without
  }

  const visited = new Set<string>();
  const queue: QueueItem[] = [{ url: seedUrl, depth: 0 }];
  let crawledCount = 0;

  const excludeRegexes = excludePatterns.map((p) => new RegExp(p, "i"));

  while (queue.length > 0 && crawledCount < maxPages) {
    const handle = activeJobs.get(jobId);
    if (handle?.abort) {
      await db("crawl_jobs")
        .where("id", jobId)
        .update({ status: "stopped", completed_at: db.fn.now() });
      return;
    }

    const item = queue.shift()!;
    const normalUrl = normalizeUrl(item.url, seedUrl);
    if (!normalUrl) continue;
    if (visited.has(normalUrl)) continue;
    if (item.depth > maxDepth) continue;
    if (!isSameDomain(normalUrl, siteId)) continue;
    if (robots && !robots.isAllowed(normalUrl, "OrionBot")) continue;
    if (excludeRegexes.some((r) => r.test(normalUrl))) continue;

    visited.add(normalUrl);

    // Check if already crawled in DB
    const existing = await db("crawled_pages")
      .where({ url: normalUrl, status: "crawled" })
      .select("id")
      .first();

    if (existing) {
      crawledCount++;
      continue;
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, delayMs));

    try {
      const result = await crawlWebsite(normalUrl);

      if (!result.success) {
        await db("crawled_pages")
          .insert({
            site_id: siteId,
            url: normalUrl,
            status: "failed",
            error: result.error || "Unknown error",
            depth: item.depth,
            crawled_at: db.fn.now(),
          })
          .onConflict("url")
          .merge(["status", "error", "crawled_at"]);
        continue;
      }

      // Store crawled page
      const [pageRow] = await db("crawled_pages")
        .insert({
          site_id: siteId,
          url: normalUrl,
          title: result.title,
          meta_description: result.metaDescription,
          headings: JSON.stringify(result.headings),
          body_text: result.bodyText,
          links: JSON.stringify(result.links),
          depth: item.depth,
          status: "crawled",
          crawled_at: db.fn.now(),
        })
        .onConflict("url")
        .merge(["title", "meta_description", "headings", "body_text", "links", "depth", "status", "crawled_at"])
        .returning("id");

      const pageId = pageRow.id;
      crawledCount++;

      // Update progress
      await db("crawl_jobs")
        .where("id", jobId)
        .update({ pages_crawled: crawledCount, pages_total: visited.size });

      // Chunk and embed the page content
      await chunkAndEmbed(pageId, siteId, result.bodyText, {
        url: normalUrl,
        title: result.title,
      });

      // Enqueue discovered links
      if (item.depth < maxDepth && result.linkUrls) {
        for (const linkUrl of result.linkUrls) {
          const normLink = normalizeUrl(linkUrl, normalUrl);
          if (normLink && !visited.has(normLink) && isSameDomain(normLink, siteId)) {
            if (!/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|pdf|zip|mp4|mp3|woff|ttf|eot)$/i.test(normLink)) {
              queue.push({ url: normLink, depth: item.depth + 1 });
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`[SiteCrawler] Error crawling ${normalUrl}:`, err.message);
      await db("crawled_pages")
        .insert({
          site_id: siteId,
          url: normalUrl,
          status: "failed",
          error: err.message,
          depth: item.depth,
          crawled_at: db.fn.now(),
        })
        .onConflict("url")
        .merge(["status", "error", "crawled_at"]);
    }

    // Yield to event loop
    await new Promise((r) => setTimeout(r, 0));
  }

  await db("crawl_jobs")
    .where("id", jobId)
    .update({ status: "completed", pages_crawled: crawledCount, completed_at: db.fn.now() });

  console.log(`[SiteCrawler] Job ${jobId} completed: ${crawledCount} pages crawled for ${siteId}`);
}

// ── Chunking + Embedding pipeline ──

async function chunkAndEmbed(
  pageId: number,
  siteId: string,
  bodyText: string,
  context: { url: string; title: string }
): Promise<void> {
  if (!bodyText || bodyText.trim().length < 50) return;

  const chunks = chunkText(bodyText, { maxTokens: 400, overlap: 50 });
  if (chunks.length === 0) return;

  const db = getDb();

  // Store chunks
  const chunkIds: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const [row] = await db("content_chunks")
      .insert({
        page_id: pageId,
        site_id: siteId,
        chunk_index: i,
        content: chunks[i],
        token_count: estimateTokens(chunks[i]),
        metadata: JSON.stringify({ url: context.url, title: context.title, chunkIndex: i }),
      })
      .returning("id");
    chunkIds.push(row.id);
  }

  // Generate and store embeddings
  try {
    const embeddings = await generateEmbeddings(chunks);
    await storeChunkEmbeddings(
      chunkIds.map((id, i) => ({ chunkId: id, embedding: embeddings[i] }))
    );
  } catch (err) {
    console.error(`[SiteCrawler] Embedding generation failed for page ${pageId}:`, err);
  }
}

// ── URL utilities ──

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(url, baseUrl);
    parsed.hash = "";
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`;
  } catch {
    return null;
  }
}

function isSameDomain(url: string, domain: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    return host === domain || host.endsWith("." + domain);
  } catch {
    return false;
  }
}

function mapCrawlJob(row: any): CrawlJob {
  return {
    id: row.id,
    siteId: row.site_id,
    seedUrl: row.seed_url,
    maxDepth: row.max_depth,
    maxPages: row.max_pages,
    status: row.status,
    pagesCrawled: row.pages_crawled,
    pagesTotal: row.pages_total,
    error: row.error,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
