import { Router, type Request, type Response, type NextFunction } from "express";
import {
  chatWithAssistant,
  generateAdCopy,
  generateContentBrief,
  suggestCampaignStructure,
  generateIcpProfile,
  generateBuyerPersona,
} from "../services/ai.ts";

const router = Router();

// POST /api/ai/chat
router.post("/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history, context } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (string) is required" });
    }
    const result = await chatWithAssistant(message, history || [], context || {});
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/generate-copy
router.post("/generate-copy", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keywords, product, tone, count } = req.body;
    if (!keywords?.length) {
      return res.status(400).json({ error: "keywords array is required" });
    }
    if (!product) {
      return res.status(400).json({ error: "product object is required" });
    }
    const result = await generateAdCopy({ keywords, product, tone, count });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/content-brief
router.post("/content-brief", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword, product, competitors } = req.body;
    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ error: "keyword (string) is required" });
    }
    if (!product) {
      return res.status(400).json({ error: "product object is required" });
    }
    const result = await generateContentBrief({ keyword, product, competitors });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/campaign-suggest
router.post("/campaign-suggest", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keywords, product, budget, market } = req.body;
    if (!keywords?.length) {
      return res.status(400).json({ error: "keywords array is required" });
    }
    if (!product) {
      return res.status(400).json({ error: "product object is required" });
    }
    if (budget == null || typeof budget !== "number") {
      return res.status(400).json({ error: "budget (number) is required" });
    }
    if (!market || typeof market !== "string") {
      return res.status(400).json({ error: "market (string) is required" });
    }
    const result = await suggestCampaignStructure({ keywords, product, budget, market });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/generate-icp
router.post("/generate-icp", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product, market, existingIcps } = req.body;
    if (!product) {
      return res.status(400).json({ error: "product object is required" });
    }
    if (!market || typeof market !== "string") {
      return res.status(400).json({ error: "market (string) is required" });
    }
    const result = await generateIcpProfile({ product, market, existingIcps });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/generate-persona
router.post("/generate-persona", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product, icpName, market, existingPersonas } = req.body;
    if (!product) {
      return res.status(400).json({ error: "product object is required" });
    }
    if (!market || typeof market !== "string") {
      return res.status(400).json({ error: "market (string) is required" });
    }
    const result = await generateBuyerPersona({ product, icpName, market, existingPersonas });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

export default router;
