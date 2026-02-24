import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { getMe, getAll } from "../controllers/dataController.js";

const router = Router();

// GET /data/me - View current token/session information
router.get("/me", getMe);

// GET /data/all - Get all data from DB (ADMIN ONLY)
router.get("/all", verifyAdmin, getAll);

export default router;
