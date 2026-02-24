import { Router, type Request, type Response, type NextFunction } from "express";
import * as seo from "../services/seo.ts";

const router = Router();

// POST /api/seo/serp-features
router.post("/serp-features", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keywords, countryCode } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    const results = await seo.getSerpFeatures(keywords, countryCode || "GB");
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/seo/serp-competitors
router.post("/serp-competitors", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { target, countryCode } = req.body;
    if (!target) return res.status(400).json({ error: "target domain is required" });
    const results = await seo.getSerpCompetitors(target, countryCode || "GB");
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/seo/rank-history
router.post("/rank-history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keywords, countryCode } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    const results = await seo.getHistoricalRanks(keywords, countryCode || "GB");
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/seo/backlinks
router.post("/backlinks", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: "domain is required" });
    const result = await seo.getBacklinkProfile(domain);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/seo/backlinks/compare
router.post("/backlinks/compare", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domains } = req.body;
    if (!domains?.length) return res.status(400).json({ error: "domains array is required" });
    const results = await seo.getBacklinkComparison(domains);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// GET /api/seo/gsc
router.get("/gsc", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await seo.getGscData();
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/seo/content-gaps
router.post("/content-gaps", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keywords, competitors } = req.body;
    if (!keywords?.length) return res.status(400).json({ error: "keywords array is required" });
    if (!competitors?.length) return res.status(400).json({ error: "competitors array is required" });
    const results = await seo.getContentGaps(keywords, competitors);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
