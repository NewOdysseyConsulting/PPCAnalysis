import { Router, type Request, type Response, type NextFunction } from "express";
import * as stripeService from "../services/stripe.ts";

interface ApiError extends Error {
  status?: number;
}

const router = Router();

// GET /api/stripe/metrics
router.get("/metrics", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await stripeService.getMetrics();
    res.json({ metrics });
  } catch (err) {
    next(err);
  }
});

// GET /api/stripe/attribution
router.get("/attribution", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const attribution = await stripeService.getAttribution();
    res.json({ attribution });
  } catch (err) {
    next(err);
  }
});

// GET /api/stripe/timeline
router.get("/timeline", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const timeline = await stripeService.getTimeline();
    res.json({ timeline });
  } catch (err) {
    next(err);
  }
});

// GET /api/stripe/status
router.get("/status", (_req: Request, res: Response) => {
  const hasKey = !!process.env.STRIPE_SECRET_KEY;
  const hasWebhook = !!process.env.STRIPE_WEBHOOK_SECRET;
  res.json({
    ok: true,
    configured: hasKey,
    webhookConfigured: hasWebhook,
  });
});

// POST /api/stripe/webhook
router.post("/webhook", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    const event = stripeService.constructWebhookEvent(
      (req as any).rawBody || Buffer.from(JSON.stringify(req.body)),
      signature,
    );

    const result = await stripeService.handleWebhookEvent(event);
    res.json({ received: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
