import UserModel from "../models/user.model.js";
import CoinTransaction from "../models/CoinTransaction.js";

const FREE_INTERACTIVE_PLAYS = 10;
const INTERACTIVE_PLAY_COST = 3;

/**
 * Award coins to a user. Atomic increment on the User document.
 * @returns {Promise<{ balance: number, awarded: number }>}
 */
export async function awardCoins(userId, amount, reason, metadata = {}) {
    if (amount <= 0) throw new Error("Award amount must be positive");

    const user = await UserModel.findByIdAndUpdate(
        userId,
        {
            $inc: { coinBalance: amount, coinTotalEarned: amount },
        },
        { new: true }
    );

    if (!user) throw new Error("User not found");

    await CoinTransaction.create({
        userId,
        type: "earn",
        amount,
        reason,
        metadata,
    });

    console.log(`[CoinService] Awarded ${amount} coins to ${userId} (${reason}). Balance: ${user.coinBalance}`);
    return { balance: user.coinBalance, awarded: amount };
}

/**
 * Deduct coins from a user. Atomic with coinBalance >= amount guard.
 * @returns {Promise<{ success: boolean, newBalance: number }>}
 */
export async function deductCoins(userId, amount, reason, metadata = {}) {
    if (amount <= 0) throw new Error("Deduct amount must be positive");

    // Admin bypass — never charge admins
    const user = await UserModel.findById(userId);
    if (user?.isAdmin) {
        return { success: true, newBalance: user.coinBalance ?? 0 };
    }

    const result = await UserModel.findOneAndUpdate(
        { _id: userId, coinBalance: { $gte: amount } },
        {
            $inc: { coinBalance: -amount, coinTotalSpent: amount },
        },
        { new: true }
    );

    if (!result) {
        // Either user doesn't exist or insufficient balance
        const existingUser = await UserModel.findById(userId);
        const currentBalance = existingUser?.coinBalance ?? 0;
        return { success: false, newBalance: currentBalance, error: "insufficient_coins" };
    }

    await CoinTransaction.create({
        userId,
        type: "spend",
        amount,
        reason,
        metadata,
    });

    console.log(`[CoinService] Deducted ${amount} coins from ${userId} (${reason}). Balance: ${result.coinBalance}`);
    return { success: true, newBalance: result.coinBalance };
}

/**
 * Check if user has free interactive plays remaining, or needs to pay.
 * If free plays available, increments the counter atomically.
 * @returns {Promise<{ free: boolean, playsUsed: number, cost?: number }>}
 */
export async function checkAndIncrementPlays(userId) {
    // Admin bypass — always free
    const user = await UserModel.findById(userId);
    if (user?.isAdmin) {
        return { free: true, playsUsed: 0, totalFree: FREE_INTERACTIVE_PLAYS };
    }

    // Try to atomically increment if under the free limit
    const result = await UserModel.findOneAndUpdate(
        { _id: userId, interactivePlaysUsed: { $lt: FREE_INTERACTIVE_PLAYS } },
        {
            $inc: { interactivePlaysUsed: 1 },
        },
        { new: true }
    );

    if (result && result.interactivePlaysUsed <= FREE_INTERACTIVE_PLAYS) {
        return {
            free: true,
            playsUsed: result.interactivePlaysUsed,
            totalFree: FREE_INTERACTIVE_PLAYS,
        };
    }

    // User has exhausted free plays
    const fallbackUser = await UserModel.findById(userId);
    return {
        free: false,
        playsUsed: fallbackUser?.interactivePlaysUsed ?? FREE_INTERACTIVE_PLAYS,
        totalFree: FREE_INTERACTIVE_PLAYS,
        cost: INTERACTIVE_PLAY_COST,
        balance: fallbackUser?.coinBalance ?? 0,
    };
}

/**
 * Check if a daily_login coin has already been awarded today.
 */
export async function hasDailyLoginToday(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await CoinTransaction.findOne({
        userId,
        reason: "daily_login",
        createdAt: { $gte: startOfDay },
    });

    return !!existing;
}

/**
 * Count how many reel_watched coins were awarded today.
 */
export async function reelWatchedCountToday(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return CoinTransaction.countDocuments({
        userId,
        reason: "reel_watched",
        createdAt: { $gte: startOfDay },
    });
}

export { FREE_INTERACTIVE_PLAYS, INTERACTIVE_PLAY_COST };
