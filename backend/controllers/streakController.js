import UserStreak from "../models/UserStreak.js";

// Helper to check if two dates are on the same day
const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

// Helper to check if date1 is exactly one day before date2
const isConsecutiveDay = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const dayBefore = new Date(date2.getTime() - oneDay);
    return isSameDay(date1, dayBefore);
};

// GET /streak - Get user's current streak
export const getStreak = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Use findOneAndUpdate with upsert to atomically create if not exists
        const streak = await UserStreak.findOneAndUpdate(
            { userId },
            { $setOnInsert: { userId, currentStreak: 0, longestStreak: 0, lastActiveDate: null } },
            { upsert: true, new: true }
        );

        res.json({
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastActiveDate: streak.lastActiveDate,
        });
        console.log(`GET /streak - User ${userId}: current=${streak.currentStreak}, longest=${streak.longestStreak}`);
    } catch (err) {
        console.error("GET /streak - Error:", err);
        res.status(500).json({ error: "Failed to fetch streak", message: err.message });
    }
};

// POST /streak/record - Record user activity and update streak
export const recordActivity = async (req, res) => {
    try {
        const userId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        // First, get or create the streak document atomically
        let streak = await UserStreak.findOne({ userId });

        if (!streak) {
            // First time user - create streak with 1 day using findOneAndUpdate to avoid race condition
            streak = await UserStreak.findOneAndUpdate(
                { userId },
                {
                    $setOnInsert: {
                        userId,
                        currentStreak: 1,
                        longestStreak: 1,
                        lastActiveDate: today,
                    }
                },
                { upsert: true, new: true }
            );

            return res.json({
                message: "Activity recorded",
                currentStreak: streak.currentStreak,
                longestStreak: streak.longestStreak,
                lastActiveDate: streak.lastActiveDate,
            });
        }

        const lastActive = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;

        if (lastActive && isSameDay(lastActive, today)) {
            // Already recorded today, no change
            return res.json({
                message: "Activity already recorded today",
                currentStreak: streak.currentStreak,
                longestStreak: streak.longestStreak,
                lastActiveDate: streak.lastActiveDate,
            });
        }

        // Calculate new streak values
        let newCurrentStreak;
        if (lastActive && isConsecutiveDay(lastActive, today)) {
            // Consecutive day - increment streak
            newCurrentStreak = streak.currentStreak + 1;
        } else {
            // Streak broken - reset to 1
            newCurrentStreak = 1;
        }

        const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

        // Update atomically
        const updatedStreak = await UserStreak.findOneAndUpdate(
            { userId },
            {
                $set: {
                    currentStreak: newCurrentStreak,
                    longestStreak: newLongestStreak,
                    lastActiveDate: today,
                }
            },
            { new: true }
        );

        res.json({
            message: "Activity recorded",
            currentStreak: updatedStreak.currentStreak,
            longestStreak: updatedStreak.longestStreak,
            lastActiveDate: updatedStreak.lastActiveDate,
        });
        console.log(`POST /streak/record - User ${userId}: current=${updatedStreak.currentStreak}, longest=${updatedStreak.longestStreak}`);
    } catch (err) {
        console.error("POST /streak/record - Error:", err);
        res.status(500).json({ error: "Failed to record activity", message: err.message });
    }
};
