import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { getStreak, recordActivity } from "../controllers/streakController.js";

const router = Router();

// GET /streak - Get user's current streak
router.get("/", verifyToken, getStreak);

// POST /streak/record - Record activity and update streak
router.post("/record", verifyToken, recordActivity);

export default router;
