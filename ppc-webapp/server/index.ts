import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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
import pipelineRouter from "./routes/pipeline.ts";
import { initDb, closeDb } from "./services/db.ts";
import { startJobQueue, stopJobQueue } from "./services/jobQueue.ts";

interface ApiError extends Error {
  status?: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// In production the Vite build output lives in ../dist (relative to server/)
const CLIENT_BUILD_PATH = path.join(__dirname, "..", "dist");

app.use(cors({ origin: true, credentials: true }));

// Raw body capture for Stripe webhook verification (must come before express.json)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), (req: Request, _res: Response, next: NextFunction) => {
  req.rawBody = req.body as Buffer;
  next();
});

app.use(express.json({ limit: "2mb" }));

// ── API routes ──
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
app.use("/api/pipeline", pipelineRouter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Serve React client (production) ──
// Serve static assets from the Vite build output folder
if (fs.existsSync(CLIENT_BUILD_PATH)) {
  app.use(express.static(CLIENT_BUILD_PATH));

  // Any request that doesn't match a static file or /api/* serves index.html
  // so that client-side routing works (SPA fallback)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api/")) {
      next();
    } else {
      res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
      res.header("Expires", "-1");
      res.header("Pragma", "no-cache");
      res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
    }
  });
}

// ── Error handler ──
app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  console.error(`[API Error] ${err.message}`);
  res.status(status).json({ error: err.message });
});

// Initialize database, job queue, and start server
initDb().then(async () => {
  await startJobQueue();
  app.listen(PORT, () => {
    console.log(`Orion server running on http://localhost:${PORT}`);
    if (fs.existsSync(CLIENT_BUILD_PATH)) {
      console.log(`Serving React client from ${CLIENT_BUILD_PATH}`);
    } else {
      console.log("No client build found — API-only mode (run 'npm run build' to serve the UI)");
    }
    if (process.env.DATAFORSEO_LOGIN) {
      console.log("DataForSEO credentials loaded from environment");
    } else {
      console.log("No DataForSEO env credentials — pass via x-dfs-login / x-dfs-password headers");
    }
  });
}).catch((err) => {
  console.error("[DB] Failed to initialize:", err);
  process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
  await stopJobQueue();
  await closeDb();
  process.exit(0);
};
process.on("SIGINT", () => { shutdown(); });
process.on("SIGTERM", () => { shutdown(); });
