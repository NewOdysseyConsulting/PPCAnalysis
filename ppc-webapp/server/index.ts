import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import keywordsRouter from "./routes/keywords.ts";
import stripeRouter from "./routes/stripe.ts";
import seoRouter from "./routes/seo.ts";
import aiRouter from "./routes/ai.ts";
import budgetRouter from "./routes/budget.ts";

interface ApiError extends Error {
  status?: number;
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));

// Raw body capture for Stripe webhook verification (must come before express.json)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), (req: Request, _res: Response, next: NextFunction) => {
  (req as any).rawBody = req.body;
  next();
});

app.use(express.json({ limit: "2mb" }));

app.use("/api/keywords", keywordsRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/seo", seoRouter);
app.use("/api/ai", aiRouter);
app.use("/api/budget", budgetRouter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  console.error(`[API Error] ${err.message}`);
  res.status(status).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Orion API server running on http://localhost:${PORT}`);
  if (process.env.DATAFORSEO_LOGIN) {
    console.log("DataForSEO credentials loaded from environment");
  } else {
    console.log("No DataForSEO env credentials — pass via x-dfs-login / x-dfs-password headers");
  }
});
