import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    getBalance,
    getHistory,
    spendCoins,
    checkInteractiveAccess,
} from "../controllers/coinController.js";

const router = Router();

// GET /coins/balance - Get current balance + totals
router.get("/balance", verifyToken, getBalance);

// GET /coins/history - Paginated transaction history
router.get("/history", verifyToken, getHistory);

// POST /coins/spend - Spend coins (hint purchase, etc.)
router.post("/spend", verifyToken, spendCoins);

// POST /coins/interactive-access - Check/use free play or require coins
router.post("/interactive-access", verifyToken, checkInteractiveAccess);

export default router;
