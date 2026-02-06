import mongoose from "mongoose";

const userSaveSchema = new mongoose.Schema({
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
}, { timestamps: { createdAt: true, updatedAt: false } });

// Compound index to ensure one save per user per reel
userSaveSchema.index({ userId: 1, reelId: 1 }, { unique: true });

export default mongoose.model("UserSave", userSaveSchema);
