import { Router, type Request, type Response, type NextFunction } from "express";
import {
  getCampaignPerformance,
  getKeywordPerformance,
  getSearchTerms,
  getQualityScores,
  pushCampaignToGoogleAds,
  updateCampaignStatus,
  isGoogleAdsConfigured,
} from "../services/google-ads.ts";
import type { PushCampaignInput } from "../services/google-ads.ts";

const router = Router();

// GET /api/google-ads/campaigns — campaign performance
router.get("/campaigns", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string) : undefined;
    const results = await getCampaignPerformance(customerId, daysBack);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// GET /api/google-ads/keywords — keyword performance
router.get("/keywords", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const campaignId = req.query.campaignId as string | undefined;
    const results = await getKeywordPerformance(customerId, campaignId);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// GET /api/google-ads/search-terms — search terms report
router.get("/search-terms", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const campaignId = req.query.campaignId as string | undefined;
    const results = await getSearchTerms(customerId, campaignId);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// GET /api/google-ads/quality-scores — quality scores
router.get("/quality-scores", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const results = await getQualityScores(customerId);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/google-ads/push — push campaign to Google Ads
router.post("/push", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: PushCampaignInput = req.body.campaign;
    const customerId = req.body.customerId as string | undefined;
    if (!input || !input.name) return res.status(400).json({ error: "campaign object is required" });
    const result = await pushCampaignToGoogleAds(input, customerId);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/google-ads/campaign-status — update campaign status
router.post("/campaign-status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId, status, customerId } = req.body;
    if (!campaignId || !status) return res.status(400).json({ error: "campaignId and status are required" });
    await updateCampaignStatus(campaignId, status, customerId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/google-ads/configured — check if Google Ads is configured
router.get("/configured", (_req: Request, res: Response) => {
  res.json({ configured: isGoogleAdsConfigured() });
});

export default router;
