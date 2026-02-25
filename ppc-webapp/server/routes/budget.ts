import { Router, type Request, type Response, type NextFunction } from "express";
import { optimizeChannelMix } from "../services/budget.ts";

const router = Router();

// POST /api/budget/optimize
router.post("/optimize", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { totalBudget, channels, acv } = req.body;

    if (typeof totalBudget !== "number" || totalBudget <= 0) {
      return res.status(400).json({ error: "totalBudget must be a positive number" });
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ error: "channels must be a non-empty array" });
    }

    if (typeof acv !== "number" || acv <= 0) {
      return res.status(400).json({ error: "acv must be a positive number" });
    }

    const result = optimizeChannelMix({ totalBudget, channels, acv });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
