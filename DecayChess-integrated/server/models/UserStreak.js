import mongoose from "mongoose";

const userStreakSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    currentStreak: {
        type: Number,
        default: 0,
    },
    longestStreak: {
        type: Number,
        default: 0,
    },
    lastActiveDate: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export default mongoose.model("UserStreak", userStreakSchema);
