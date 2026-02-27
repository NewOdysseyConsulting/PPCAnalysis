import { Router, type Request, type Response, type NextFunction } from "express";
import { generateAuthUrl, exchangeCode, storeTokens, getConnectionStatus, SCOPES } from "../services/google-auth.ts";

const router = Router();

// GET /api/google/status — connection status for all Google services
router.get("/status", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await getConnectionStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// GET /api/google/oauth/url — generate OAuth consent URL
router.get("/oauth/url", (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = (req.query.service as string) || "ga4";
    let scopes: string[];
    switch (service) {
      case "gsc": scopes = [SCOPES.GSC]; break;
      case "google-ads": scopes = [SCOPES.ADS]; break;
      case "all": scopes = [SCOPES.GA4, SCOPES.GSC, SCOPES.ADS]; break;
      default: scopes = [SCOPES.GA4]; break;
    }
    const url = generateAuthUrl(scopes);
    if (!url) return res.status(500).json({ error: "OAuth2 not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET" });
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// GET /api/google/oauth/callback — handle OAuth code exchange
router.get("/oauth/callback", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string;
    if (!code) return res.status(400).json({ error: "Missing authorization code" });

    const tokens = await exchangeCode(code);
    if (!tokens) return res.status(500).json({ error: "Failed to exchange authorization code" });

    // Store for all services requested
    const service = (req.query.state as string) || "ga4";
    const scopes = service === "all"
      ? [SCOPES.GA4, SCOPES.GSC, SCOPES.ADS]
      : service === "gsc" ? [SCOPES.GSC]
      : service === "google-ads" ? [SCOPES.ADS]
      : [SCOPES.GA4];

    await storeTokens({
      service,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiry: tokens.expiry,
      scopes,
    });

    // Redirect back to app with success
    res.redirect("/?google_auth=success");
  } catch (err) {
    next(err);
  }
});

export default router;
