import { Router } from "express";
import { verifyAdmin } from "../middleware/auth.js";
import {
    uploadVideo,
    updateVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    getAdminStats,
    getFolderStats,
    getGrandmasters,
    getGrandmasterFolders,
    getGrandmasterById,
    createGrandmaster,
    updateGrandmaster,
    deleteGrandmaster,
    getReelsByFolderAdmin,
} from "../controllers/adminController.js";

const router = Router();

// Apply verifyAdmin middleware to all admin routes
router.use(verifyAdmin);

// ============ STATS ENDPOINTS ============

// GET /admin/stats - Get admin dashboard stats
router.get("/stats", getAdminStats);

// GET /admin/folder-stats - Get folder distribution stats
router.get("/folder-stats", getFolderStats);

// ============ VIDEO/REEL ENDPOINTS ============

// POST /admin/video - Upload a new Video
router.post("/video", uploadVideo);

// PUT /admin/video/:videoId - Update an existing Video
router.put("/video/:videoId", updateVideo);

// DELETE /admin/video/:videoId - Delete a Video
router.delete("/video/:videoId", deleteVideo);

// GET /admin/videos - Get all Videos
router.get("/videos", getAllVideos);

// GET /admin/videos/by-folder - Get videos by folder
router.get("/videos/by-folder", getReelsByFolderAdmin);

// GET /admin/video/:videoId - Get Video by ID
router.get("/video/:videoId", getVideoById);

// ============ GRANDMASTER FOLDER ENDPOINTS ============

// GET /admin/grandmasters - Get list of grandmasters with counts
router.get("/grandmasters", getGrandmasters);

// GET /admin/grandmaster-folders - Get all grandmaster folders with details
router.get("/grandmaster-folders", getGrandmasterFolders);

// GET /admin/grandmaster/:id - Get single grandmaster folder
router.get("/grandmaster/:id", getGrandmasterById);

// POST /admin/grandmaster - Create new grandmaster folder
router.post("/grandmaster", createGrandmaster);

// PUT /admin/grandmaster/:id - Update grandmaster folder
router.put("/grandmaster/:id", updateGrandmaster);

// DELETE /admin/grandmaster/:id - Delete grandmaster folder
router.delete("/grandmaster/:id", deleteGrandmaster);

export default router;

