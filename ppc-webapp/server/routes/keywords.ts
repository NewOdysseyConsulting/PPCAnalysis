import { Router, type Request, type Response, type NextFunction } from "express";
import * as dfs from "../services/dataforseo.ts";
import type { Credentials } from "../services/dataforseo.ts";

interface ApiError extends Error {
  status?: number;
}

const router = Router();

function getCredentials(req: Request): Credentials {
  const login = process.env.DATAFORSEO_LOGIN || (req.headers["x-dfs-login"] as string);
  const password = process.env.DATAFORSEO_PASSWORD || (req.headers["x-dfs-password"] as string);
  if (!login || !password) {
    const err: ApiError = new Error(
      "DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables, or pass x-dfs-login / x-dfs-password headers.",
    );
    err.status = 401;
    throw err;
  }
  return { login, password };
}

// POST /api/keywords/search-volume
router.post("/search-volume", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keywords, countryCode, options } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getSearchVolume(keywords, countryCode, credentials, options || {});
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/suggestions
router.post("/suggestions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keywords, countryCode, options } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getKeywordsForKeywords(keywords, countryCode, credentials, options || {});
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/for-site
router.post("/for-site", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { target, countryCode, options } = req.body;
    if (!target) return res.status(400).json({ error: "target (domain or URL) is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getKeywordsForSite(target, countryCode, credentials, options || {});
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/ad-traffic
router.post("/ad-traffic", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keywords, countryCode, options } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });
    if (!options?.bid) return res.status(400).json({ error: "options.bid is required" });

    const results = await dfs.getAdTrafficByKeywords(keywords, countryCode, credentials, options);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/bing/search-volume
router.post("/bing/search-volume", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keywords, countryCode } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getBingSearchVolume(keywords, countryCode, credentials);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/bing/performance
router.post("/bing/performance", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keywords, countryCode } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getBingKeywordPerformance(keywords, countryCode, credentials);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/task/submit
router.post("/task/submit", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keywords, countryCode, options } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const taskId = await dfs.submitSearchVolumeTask(keywords, countryCode, credentials, options || {});
    res.json({ taskId });
  } catch (err) {
    next(err);
  }
});

// GET /api/keywords/task/:taskId
router.get("/task/:taskId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const result = await dfs.getTaskResult(req.params.taskId as string, credentials);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/compare-markets
router.post("/compare-markets", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keywords, countryCodes } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    if (!countryCodes?.length) return res.status(400).json({ error: "countryCodes array is required" });

    const results = await dfs.compareMarkets(keywords, countryCodes, credentials);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// GET /api/keywords/locations
router.get("/locations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const country = (req.query.country as string) || null;
    const results = await dfs.getLocations(credentials, country);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// GET /api/keywords/languages
router.get("/languages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const results = await dfs.getLanguages(credentials);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/score-relevance
router.post("/score-relevance", (req: Request, res: Response) => {
  const { keyword, product } = req.body;
  if (!keyword) return res.status(400).json({ error: "keyword object is required" });
  const score = dfs.scoreRelevance(keyword, product || null);
  res.json({ score });
});

// GET /api/keywords/status
router.get("/status", (_req: Request, res: Response) => {
  const hasEnvCreds = !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
  res.json({
    ok: true,
    credentialsConfigured: hasEnvCreds,
    supportedMarkets: Object.keys(dfs.LOCATION_CODES),
  });
});

// ════════════════════════════════════════════════════════════════
// DATAFORSEO LABS ROUTES
// ════════════════════════════════════════════════════════════════

// POST /api/keywords/labs/suggestions
router.post("/labs/suggestions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keyword, countryCode, options } = req.body;
    if (!keyword) return res.status(400).json({ error: "keyword is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getLabsKeywordSuggestions(keyword, countryCode, credentials, options || {});
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/labs/related
router.post("/labs/related", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { keyword, countryCode, options } = req.body;
    if (!keyword) return res.status(400).json({ error: "keyword is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getLabsRelatedKeywords(keyword, countryCode, credentials, options || {});
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/labs/ranked
router.post("/labs/ranked", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { target, countryCode, options } = req.body;
    if (!target) return res.status(400).json({ error: "target (domain) is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getLabsRankedKeywords(target, countryCode, credentials, options || {});
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/keywords/labs/intersection
router.post("/labs/intersection", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req);
    const { target1, target2, countryCode, options } = req.body;
    if (!target1) return res.status(400).json({ error: "target1 (domain) is required" });
    if (!target2) return res.status(400).json({ error: "target2 (domain) is required" });
    if (!countryCode) return res.status(400).json({ error: "countryCode is required" });

    const results = await dfs.getLabsDomainIntersection(target1, target2, countryCode, credentials, options || {});
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
