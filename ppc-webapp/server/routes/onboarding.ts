import { Router, type Request, type Response, type NextFunction } from "express";
import { crawlWebsite } from "../services/crawl.ts";
import { extractProductInfo, generateOnboardingAdCopy } from "../services/ai.ts";

const router = Router();

// POST /api/onboarding/crawl — Crawl a website and return raw content
router.post("/crawl", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url (string) is required" });
    }
    const result = await crawlWebsite(url);
    if (!result.success) {
      return res.status(422).json({ error: result.error || "Failed to crawl website" });
    }
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/onboarding/extract-product — Extract product info from crawled content using AI
router.post("/extract-product", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, metaDescription, headings, bodyText, url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url (string) is required" });
    }
    const result = await extractProductInfo({
      title: title || "",
      metaDescription: metaDescription || "",
      headings: headings || [],
      bodyText: bodyText || "",
      url,
    });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/onboarding/generate-copy — Generate ad copy from product info + keywords
router.post("/generate-copy", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product, keywords, count } = req.body;
    if (!product) {
      return res.status(400).json({ error: "product object is required" });
    }
    if (!keywords?.length) {
      return res.status(400).json({ error: "keywords array is required" });
    }
    const result = await generateOnboardingAdCopy({ product, keywords, count });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// POST /api/onboarding/full — Full pipeline: crawl → extract → return product info
router.post("/full", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url (string) is required" });
    }

    // Step 1: Crawl the site
    const crawlResult = await crawlWebsite(url);
    if (!crawlResult.success) {
      return res.status(422).json({ error: crawlResult.error || "Failed to crawl website" });
    }

    // Step 2: Extract product info with AI
    const productInfo = await extractProductInfo({
      title: crawlResult.title,
      metaDescription: crawlResult.metaDescription,
      headings: crawlResult.headings,
      bodyText: crawlResult.bodyText,
      url: crawlResult.url,
    });

    res.json({
      result: {
        crawl: crawlResult,
        product: productInfo,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
