import mongoose from "mongoose";

/**
 * UserLike Model
 * Tracks individual user likes on reels to prevent cross-user like manipulation.
 * Each record represents one user's like on one reel.
 */
const userLikeSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    reelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reel",
        required: true,
        index: true,
    },
}, { timestamps: true });

// Compound unique index: a user can only like a reel once
userLikeSchema.index({ userId: 1, reelId: 1 }, { unique: true });

export default mongoose.model("UserLike", userLikeSchema);
