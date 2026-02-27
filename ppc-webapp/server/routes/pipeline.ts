// ════════════════════════════════════════════════════════════════
// Pipeline Routes — trigger and monitor keyword research pipelines
// ════════════════════════════════════════════════════════════════

import { Router, type Request, type Response, type NextFunction } from "express";
import {
  submitPipelineJob, getPipelineRun, listPipelineRuns,
  createPipelineSchedule, deletePipelineSchedule, listPipelineSchedules,
} from "../services/pipeline.ts";

const router = Router();

// POST /api/pipeline/run — submit a new pipeline job
router.post("/run", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seedKeywords, targetCountry, competitors, cpcRange, productId, product } = req.body;

    if (!seedKeywords?.length) return res.status(400).json({ error: "seedKeywords array is required" });
    if (!targetCountry) return res.status(400).json({ error: "targetCountry is required" });
    if (!competitors?.length) return res.status(400).json({ error: "competitors array is required" });
    if (!cpcRange?.min || !cpcRange?.max) return res.status(400).json({ error: "cpcRange { min, max } is required" });

    const jobId = await submitPipelineJob({
      seedKeywords,
      targetCountry,
      competitors,
      cpcRange,
      productId,
      product,
    });

    res.status(201).json({ jobId, status: "queued" });
  } catch (err) {
    next(err);
  }
});

// GET /api/pipeline/jobs/:id — get pipeline job status and result
router.get("/jobs/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const run = await getPipelineRun(req.params.id as string);
    if (!run) return res.status(404).json({ error: "Pipeline job not found" });
    res.json(run);
  } catch (err) {
    next(err);
  }
});

// GET /api/pipeline/jobs — list recent pipeline jobs
router.get("/jobs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.query.productId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const runs = await listPipelineRuns({ productId, limit });
    res.json({ runs });
  } catch (err) {
    next(err);
  }
});

// ── Schedules ──

// POST /api/pipeline/schedules — create or update a schedule
router.post("/schedules", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, cron, timezone, seedKeywords, targetCountry, competitors, cpcRange, productId, product } = req.body;

    if (!key) return res.status(400).json({ error: "key is required (e.g. productId)" });
    if (!cron) return res.status(400).json({ error: "cron expression is required" });
    if (!seedKeywords?.length) return res.status(400).json({ error: "seedKeywords array is required" });
    if (!targetCountry) return res.status(400).json({ error: "targetCountry is required" });
    if (!competitors?.length) return res.status(400).json({ error: "competitors array is required" });
    if (!cpcRange?.min || !cpcRange?.max) return res.status(400).json({ error: "cpcRange { min, max } is required" });

    await createPipelineSchedule(key, cron, {
      seedKeywords, targetCountry, competitors, cpcRange, productId, product,
    }, timezone);

    res.status(201).json({ key, cron, timezone: timezone || "UTC" });
  } catch (err) {
    next(err);
  }
});

// GET /api/pipeline/schedules — list all schedules
router.get("/schedules", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await listPipelineSchedules();
    res.json({ schedules });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/pipeline/schedules/:key — remove a schedule
router.delete("/schedules/:key", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deletePipelineSchedule(req.params.key as string);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
