import { Router, type Request, type Response, type NextFunction } from "express";
import { getGA4Data, testGA4Connection, isGA4Configured } from "../services/google-analytics.ts";

const router = Router();

// GET /api/ga4/data — fetch GA4 analytics data
router.get("/data", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const propertyId = req.query.propertyId as string | undefined;
    const currency = req.query.currency as string | undefined;
    const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string) : undefined;
    const result = await getGA4Data({ propertyId, currency, daysBack });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// GET /api/ga4/test — test GA4 connection
router.get("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const propertyId = req.query.propertyId as string | undefined;
    const result = await testGA4Connection(propertyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/ga4/configured — check if GA4 is configured
router.get("/configured", (_req: Request, res: Response) => {
  res.json({ configured: isGA4Configured() });
});

export default router;
