import UserModel from "../models/user.model.js";
import CoinTransaction from "../models/CoinTransaction.js";
import {
    awardCoins,
    deductCoins,
    checkAndIncrementPlays,
    FREE_INTERACTIVE_PLAYS,
    INTERACTIVE_PLAY_COST,
} from "../services/coinService.js";

/**
 * GET /coins/balance
 * Returns user's current coin balance and stats from the User document.
 */
export const getBalance = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const user = await UserModel.findById(userId).select(
            "coinBalance coinTotalEarned coinTotalSpent interactivePlaysUsed"
        );

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            balance: user.coinBalance ?? 0,
            totalEarned: user.coinTotalEarned ?? 0,
            totalSpent: user.coinTotalSpent ?? 0,
            interactivePlaysUsed: user.interactivePlaysUsed ?? 0,
            freeInteractivePlays: FREE_INTERACTIVE_PLAYS,
        });
    } catch (err) {
        console.error("GET /coins/balance - Error:", err);
        res.status(500).json({ error: "Failed to fetch balance", message: err.message });
    }
};

/**
 * GET /coins/history?page=1&limit=20
 * Returns paginated transaction history.
 */
export const getHistory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            CoinTransaction.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            CoinTransaction.countDocuments({ userId }),
        ]);

        res.json({
            transactions,
            page,
            totalPages: Math.ceil(total / limit),
            total,
        });
    } catch (err) {
        console.error("GET /coins/history - Error:", err);
        res.status(500).json({ error: "Failed to fetch history", message: err.message });
    }
};

/**
 * POST /coins/spend
 * Body: { amount, reason, metadata? }
 * Deducts coins from user balance.
 */
export const spendCoins = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { amount, reason, metadata } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }
        if (!reason) {
            return res.status(400).json({ error: "Reason is required" });
        }

        const result = await deductCoins(userId, amount, reason, metadata || {});

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: "insufficient_coins",
                balance: result.newBalance,
            });
        }

        res.json({
            success: true,
            newBalance: result.newBalance,
        });
    } catch (err) {
        console.error("POST /coins/spend - Error:", err);
        res.status(500).json({ error: "Failed to spend coins", message: err.message });
    }
};

/**
 * POST /coins/interactive-access
 * Checks if user has free interactive plays remaining.
 * If yes, increments counter and returns { free: true }.
 * If no, returns { free: false, cost: 3 } — client must call /spend to unlock.
 */
export const checkInteractiveAccess = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const result = await checkAndIncrementPlays(userId);
        res.json(result);
    } catch (err) {
        console.error("POST /coins/interactive-access - Error:", err);
        res.status(500).json({ error: "Failed to check interactive access", message: err.message });
    }
};
