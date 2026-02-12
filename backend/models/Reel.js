import mongoose from "mongoose";

const reelSchema = new mongoose.Schema({
  video: {
    url: { type: String, required: true },
    thumbnail: String,
    durationSec: Number,
  },

  content: {
    title: String,
    description: String,
    tags: [String],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
  },

  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChessGame",
  },

  interactive: {
    chessFen: { type: String, default: null },
    triggerTimestamp: { type: Number, default: null },
    playerColor: { type: String, enum: ["w", "b", null], default: null },
    solutionMoves: { type: [String], default: [] },
    difficultyRating: { type: Number, min: 1, max: 5, default: null },
  },

  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
  },

  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
  },

}, { timestamps: true });

reelSchema.index({ "content.tags": 1 });
reelSchema.index({ createdAt: -1 });

export default mongoose.model("Reel", reelSchema);
