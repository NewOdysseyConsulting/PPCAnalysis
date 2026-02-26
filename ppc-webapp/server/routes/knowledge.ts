import { Router, type Request, type Response, type NextFunction } from "express";
import {
  startSiteCrawl,
  getCrawlStatus,
  getCrawlJobs,
  stopCrawlJob,
  deleteSiteData,
  getSiteStats,
} from "../services/siteCrawler.ts";
import { generateEmbedding, querySimilarChunks } from "../services/embeddings.ts";
import { clusterKeywords, getStoredClusters } from "../services/clustering.ts";

const router = Router();

// ── Crawl management ──

// POST /api/knowledge/crawl/start — Start a recursive site crawl
router.post("/crawl/start", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, maxDepth, maxPages } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url (string) is required" });
    }
    const result = await startSiteCrawl(url, { maxDepth, maxPages });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// GET /api/knowledge/crawl/status/:jobId — Get crawl job progress
router.get("/crawl/status/:jobId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = parseInt(req.params.jobId as string, 10);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }
    const job = await getCrawlStatus(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ result: job });
  } catch (err) {
    next(err);
  }
});

// GET /api/knowledge/crawl/jobs — List all crawl jobs
router.get("/crawl/jobs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = req.query.siteId as string | undefined;
    const jobs = await getCrawlJobs(siteId);
    res.json({ result: jobs });
  } catch (err) {
    next(err);
  }
});

// POST /api/knowledge/crawl/stop/:jobId — Stop a running crawl
router.post("/crawl/stop/:jobId", (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = parseInt(req.params.jobId as string, 10);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }
    const stopped = stopCrawlJob(jobId);
    res.json({ result: { stopped } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/knowledge/crawl/site/:siteId — Delete all data for a site
router.delete("/crawl/site/:siteId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await deleteSiteData(req.params.siteId as string);
    res.json({ result: { deleted } });
  } catch (err) {
    next(err);
  }
});

// ── Sites ──

// GET /api/knowledge/sites — List all crawled sites with stats
router.get("/sites", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sites = await getSiteStats();
    res.json({ result: sites });
  } catch (err) {
    next(err);
  }
});

// ── Semantic search ──

// POST /api/knowledge/search — Search the knowledge base
router.post("/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, siteId, limit } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query (string) is required" });
    }
    const embedding = await generateEmbedding(query);
    const results = await querySimilarChunks(embedding, { siteId, limit });
    res.json({
      result: results.map((r) => ({
        content: r.content,
        url: r.url,
        score: r.score,
        metadata: r.metadata,
        siteId: r.siteId,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── Keyword clustering ──

// POST /api/knowledge/clusters/generate — Generate semantic clusters
router.post("/clusters/generate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, keywords, distanceThreshold } = req.body;
    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ error: "productId (string) is required" });
    }
    if (!keywords?.length) {
      return res.status(400).json({ error: "keywords array is required" });
    }
    const clusters = await clusterKeywords({ productId, keywords, distanceThreshold });
    res.json({ result: clusters });
  } catch (err) {
    next(err);
  }
});

// GET /api/knowledge/clusters/:productId — Get stored clusters
router.get("/clusters/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clusters = await getStoredClusters(req.params.productId as string);
    res.json({ result: clusters });
  } catch (err) {
    next(err);
  }
});

export default router;
