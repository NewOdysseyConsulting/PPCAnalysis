import { Router, type Request, type Response, type NextFunction } from "express";
import { getSearchConsoleData, getSiteList, testSearchConsoleConnection, isGSCConfigured } from "../services/search-console.ts";

const router = Router();

// GET /api/gsc/data — fetch Search Console data
router.get("/data", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteUrl = req.query.siteUrl as string | undefined;
    const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string) : undefined;
    const result = await getSearchConsoleData({ siteUrl, daysBack });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// GET /api/gsc/sites — list available GSC properties
router.get("/sites", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sites = await getSiteList();
    res.json({ sites });
  } catch (err) {
    next(err);
  }
});

// GET /api/gsc/test — test GSC connection
router.get("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteUrl = req.query.siteUrl as string | undefined;
    const result = await testSearchConsoleConnection(siteUrl);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/gsc/configured — check if GSC is configured
router.get("/configured", (_req: Request, res: Response) => {
  res.json({ configured: isGSCConfigured() });
});

export default router;
