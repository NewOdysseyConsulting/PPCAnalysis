import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    rawBody?: Buffer;
  }
}
import cors from "cors";
import keywordsRouter from "./routes/keywords.ts";
import stripeRouter from "./routes/stripe.ts";
import seoRouter from "./routes/seo.ts";
import aiRouter from "./routes/ai.ts";
import budgetRouter from "./routes/budget.ts";
import onboardingRouter from "./routes/onboarding.ts";
import knowledgeRouter from "./routes/knowledge.ts";
import googleAuthRouter from "./routes/google-auth.ts";
import ga4Router from "./routes/google-analytics.ts";
import gscRouter from "./routes/search-console.ts";
import googleAdsRouter from "./routes/google-ads.ts";
import { initDb, closeDb } from "./services/db.ts";

interface ApiError extends Error {
  status?: number;
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));

// Raw body capture for Stripe webhook verification (must come before express.json)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), (req: Request, _res: Response, next: NextFunction) => {
  req.rawBody = req.body as Buffer;
  next();
});

app.use(express.json({ limit: "2mb" }));

app.use("/api/keywords", keywordsRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/seo", seoRouter);
app.use("/api/ai", aiRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/google", googleAuthRouter);
app.use("/api/ga4", ga4Router);
app.use("/api/gsc", gscRouter);
app.use("/api/google-ads", googleAdsRouter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  console.error(`[API Error] ${err.message}`);
  res.status(status).json({ error: err.message });
});

// Initialize database and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Orion API server running on http://localhost:${PORT}`);
    if (process.env.DATAFORSEO_LOGIN) {
      console.log("DataForSEO credentials loaded from environment");
    } else {
      console.log("No DataForSEO env credentials — pass via x-dfs-login / x-dfs-password headers");
    }
  });
}).catch((err) => {
  console.error("[DB] Failed to initialize database:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => { closeDb().then(() => process.exit(0)); });
process.on("SIGTERM", () => { closeDb().then(() => process.exit(0)); });
