import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    getFeed,
    getRandomReels,
    getAvailableGrandmasters,
    getReelsByGrandmaster,
    viewReel,
    getReelStats,
} from "../controllers/reelController.js";
import {
    likeReel,
    unlikeReel,
    createComment,
    deleteComment,
    getCommentsByReel,
    getLikeStatus,
    getUserLikedReels,
    saveReel,
    getSaveStatus,
    getUserSavedReels,
} from "../controllers/engagementController.js";

const router = Router();

// ============ PUBLIC ROUTES (No Auth) ============

// GET /reels - Get paginated feed of published reels
router.get("/", getFeed);

// GET /reels/random - Get random reels (for "Discover" section)
router.get("/random", getRandomReels);

// GET /reels/grandmasters - Get list of available grandmasters (for grandmaster selection UI)
router.get("/grandmasters", getAvailableGrandmasters);

// GET /reels/grandmaster/:name - Get reels for a specific grandmaster
router.get("/grandmaster/:name", getReelsByGrandmaster);

// GET /reels/:reelId/stats - Get engagement stats for a reel
router.get("/:reelId/stats", getReelStats);

// GET /reels/:reelId/comments - Get all comments for a reel
router.get("/:reelId/comments", getCommentsByReel);

// POST /reels/:reelId/view - Record a view
router.post("/:reelId/view", viewReel);

// GET /reels/liked - Get all reels liked by current user
router.get("/liked", verifyToken, getUserLikedReels);

// GET /reels/:reelId/like-status - Check if current user has liked a reel
router.get("/:reelId/like-status", verifyToken, getLikeStatus);

// GET /reels/saved - Get all reels saved by current user
router.get("/saved", verifyToken, getUserSavedReels);

// GET /reels/:reelId/save-status - Check if current user has saved a reel
router.get("/:reelId/save-status", verifyToken, getSaveStatus);

// ============ AUTHENTICATED ROUTES ============

// POST /reels/:reelId/like - Like a reel
router.post("/:reelId/like", verifyToken, likeReel);

// PATCH /reels/:reelId/like - Like/Unlike a reel (frontend uses PATCH)
router.patch("/:reelId/like", verifyToken, likeReel);

// POST /reels/:reelId/unlike - Unlike a reel
router.post("/:reelId/unlike", verifyToken, unlikeReel);

// POST /reels/:reelId/comments - Create a new comment
router.post("/:reelId/comments", verifyToken, createComment);

// DELETE /reels/:reelId/comments/:commentId - Delete a comment
router.delete("/:reelId/comments/:commentId", verifyToken, deleteComment);

// POST /reels/:reelId/save - Save a reel
router.post("/:reelId/save", verifyToken, saveReel);

// PATCH /reels/:reelId/save - Save/Unsave a reel (frontend uses PATCH)
router.patch("/:reelId/save", verifyToken, saveReel);

export default router;

