import Reel from "../models/Reel.js";
import Grandmaster from "../models/Grandmaster.js";

// POST /admin/video - Upload a new Video (Reel)
export const uploadVideo = async (req, res) => {
    try {
        const { adminId, videoData } = req.body;

        const newVideo = new Reel({
            video: {
                url: videoData?.video?.url,
                thumbnail: videoData?.video?.thumbnail || "",
                durationSec: videoData?.video?.durationSec || 0,
            },
            content: {
                title: videoData?.content?.title || "",
                description: videoData?.content?.description || "",
                tags: videoData?.content?.tags || [],
                difficulty: videoData?.content?.difficulty || "beginner",
            },
            gameId: videoData?.gameId || null,
            status: videoData?.status || "draft",
            folder: videoData?.folder || "random",
            grandmaster: videoData?.grandmaster || null,
        });

        const savedVideo = await newVideo.save();
        res.status(201).json({
            success: true,
            data: savedVideo,
            uploadedBy: adminId,
        });
        console.log(`POST /admin/video - Video uploaded: ${savedVideo._id} (by admin: ${adminId})`);
    } catch (err) {
        console.error("POST /admin/video - Error:", err);
        res.status(500).json({ error: "Failed to upload video", message: err.message });
    }
};

// PUT /admin/video/:videoId - Update an existing Video
export const updateVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const { updatedData } = req.body;

        const updatedVideo = await Reel.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    "video.url": updatedData?.video?.url,
                    "video.thumbnail": updatedData?.video?.thumbnail,
                    "video.durationSec": updatedData?.video?.durationSec,
                    "content.title": updatedData?.content?.title,
                    "content.description": updatedData?.content?.description,
                    "content.tags": updatedData?.content?.tags,
                    "content.difficulty": updatedData?.content?.difficulty,
                    gameId: updatedData?.gameId,
                    status: updatedData?.status,
                    folder: updatedData?.folder,
                    grandmaster: updatedData?.grandmaster,
                },
            },
            { new: true, runValidators: true }
        );

        if (!updatedVideo) {
            return res.status(404).json({ error: "Video not found" });
        }

        res.json({ success: true, data: updatedVideo });
        console.log(`PUT /admin/video/${videoId} - Video updated successfully`);
    } catch (err) {
        console.error("PUT /admin/video/:videoId - Error:", err);
        res.status(500).json({ error: "Failed to update video", message: err.message });
    }
};

// DELETE /admin/video/:videoId - Delete a Video
export const deleteVideo = async (req, res) => {
    try {
        const { videoId } = req.params;

        const deletedVideo = await Reel.findByIdAndDelete(videoId);

        if (!deletedVideo) {
            return res.status(404).json({ error: "Video not found" });
        }

        res.json({ success: true, message: "Video deleted successfully", data: deletedVideo });
        console.log(`DELETE /admin/video/${videoId} - Video deleted successfully`);
    } catch (err) {
        console.error("DELETE /admin/video/:videoId - Error:", err);
        res.status(500).json({ error: "Failed to delete video", message: err.message });
    }
};

// GET /admin/videos - Get all Videos
export const getAllVideos = async (req, res) => {
    try {
        const videos = await Reel.find().populate("gameId").sort({ createdAt: -1 });

        res.json({ success: true, count: videos.length, data: videos });
        console.log(`GET /admin/videos - ${videos.length} videos fetched`);
    } catch (err) {
        console.error("GET /admin/videos - Error:", err);
        res.status(500).json({ error: "Failed to fetch videos", message: err.message });
    }
};

// GET /admin/video/:videoId - Get Video by ID
export const getVideoById = async (req, res) => {
    try {
        const { videoId } = req.params;

        const video = await Reel.findById(videoId).populate("gameId");

        if (!video) {
            return res.status(404).json({ error: "Video not found" });
        }

        res.json({ success: true, data: video });
        console.log(`GET /admin/video/${videoId} - Video fetched: ${video.content?.title}`);
    } catch (err) {
        console.error("GET /admin/video/:videoId - Error:", err);
        res.status(500).json({ error: "Failed to fetch video", message: err.message });
    }
};

// GET /admin/stats - Get admin dashboard stats
export const getAdminStats = async (req, res) => {
    try {
        const totalReels = await Reel.countDocuments();
        const publishedReels = await Reel.countDocuments({ status: "published" });
        const draftReels = await Reel.countDocuments({ status: "draft" });

        // Sum up views from all reels
        const viewsResult = await Reel.aggregate([
            { $group: { _id: null, totalViews: { $sum: "$engagement.views" } } }
        ]);
        const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

        res.json({
            success: true,
            stats: {
                totalReels,
                publishedReels,
                draftReels,
                totalViews,
            },
        });
        console.log(`GET /admin/stats - Stats fetched`);
    } catch (err) {
        console.error("GET /admin/stats - Error:", err);
        res.status(500).json({ error: "Failed to fetch stats", message: err.message });
    }
};

// GET /admin/folder-stats - Get folder distribution stats
export const getFolderStats = async (req, res) => {
    try {
        const randomCount = await Reel.countDocuments({ folder: "random" });
        const grandmasterCount = await Reel.countDocuments({ folder: "grandmaster" });

        res.json({
            success: true,
            data: {
                random: randomCount,
                grandmaster: grandmasterCount,
            },
        });
        console.log(`GET /admin/folder-stats - random: ${randomCount}, grandmaster: ${grandmasterCount}`);
    } catch (err) {
        console.error("GET /admin/folder-stats - Error:", err);
        res.status(500).json({ error: "Failed to fetch folder stats", message: err.message });
    }
};

// GET /admin/grandmasters - Get list of grandmasters with counts
export const getGrandmasters = async (req, res) => {
    try {
        const grandmasters = await Grandmaster.find().sort({ name: 1 });

        const grandmastersWithCounts = await Promise.all(
            grandmasters.map(async (gm) => {
                const count = await Reel.countDocuments({
                    folder: "grandmaster",
                    grandmaster: gm.name,
                });
                return { name: gm.name, count };
            })
        );

        res.json({
            success: true,
            data: grandmastersWithCounts,
        });
        console.log(`GET /admin/grandmasters - Found ${grandmastersWithCounts.length} grandmasters`);
    } catch (err) {
        console.error("GET /admin/grandmasters - Error:", err);
        res.status(500).json({ error: "Failed to fetch grandmasters", message: err.message });
    }
};

// GET /admin/grandmaster-folders - Get all grandmaster folders with details
export const getGrandmasterFolders = async (req, res) => {
    try {
        const grandmasters = await Grandmaster.find().sort({ name: 1 });

        const foldersWithCounts = await Promise.all(
            grandmasters.map(async (gm) => {
                const reelCount = await Reel.countDocuments({
                    folder: "grandmaster",
                    grandmaster: gm.name,
                });
                return {
                    _id: gm._id,
                    name: gm.name,
                    thumbnail: gm.thumbnail,
                    description: gm.description,
                    reelCount,
                    createdAt: gm.createdAt,
                };
            })
        );

        res.json({
            success: true,
            data: foldersWithCounts,
        });
        console.log(`GET /admin/grandmaster-folders - Found ${foldersWithCounts.length} folders`);
    } catch (err) {
        console.error("GET /admin/grandmaster-folders - Error:", err);
        res.status(500).json({ error: "Failed to fetch grandmaster folders", message: err.message });
    }
};

// GET /admin/grandmaster/:id - Get a single grandmaster folder
export const getGrandmasterById = async (req, res) => {
    try {
        const { id } = req.params;
        const grandmaster = await Grandmaster.findById(id);

        if (!grandmaster) {
            return res.status(404).json({ error: "Grandmaster not found" });
        }

        const reelCount = await Reel.countDocuments({
            folder: "grandmaster",
            grandmaster: grandmaster.name,
        });

        res.json({
            success: true,
            data: {
                _id: grandmaster._id,
                name: grandmaster.name,
                thumbnail: grandmaster.thumbnail,
                description: grandmaster.description,
                reelCount,
                createdAt: grandmaster.createdAt,
            },
        });
        console.log(`GET /admin/grandmaster/${id} - Grandmaster fetched: ${grandmaster.name}`);
    } catch (err) {
        console.error("GET /admin/grandmaster/:id - Error:", err);
        res.status(500).json({ error: "Failed to fetch grandmaster", message: err.message });
    }
};

// POST /admin/grandmaster - Create a new grandmaster folder
export const createGrandmaster = async (req, res) => {
    try {
        const { name, thumbnail, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Grandmaster name is required" });
        }

        const existing = await Grandmaster.findOne({ name });
        if (existing) {
            return res.status(400).json({ error: "Grandmaster with this name already exists" });
        }

        const grandmaster = new Grandmaster({
            name,
            thumbnail: thumbnail || null,
            description: description || "",
        });

        await grandmaster.save();

        res.status(201).json({
            success: true,
            data: grandmaster,
        });
        console.log(`POST /admin/grandmaster - Created: ${grandmaster.name}`);
    } catch (err) {
        console.error("POST /admin/grandmaster - Error:", err);
        res.status(500).json({ error: "Failed to create grandmaster", message: err.message });
    }
};

// PUT /admin/grandmaster/:id - Update a grandmaster folder
export const updateGrandmaster = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, thumbnail, description } = req.body;

        const grandmaster = await Grandmaster.findById(id);
        if (!grandmaster) {
            return res.status(404).json({ error: "Grandmaster not found" });
        }

        const oldName = grandmaster.name;

        if (name) grandmaster.name = name;
        if (thumbnail !== undefined) grandmaster.thumbnail = thumbnail;
        if (description !== undefined) grandmaster.description = description;

        await grandmaster.save();

        // Update reels if name changed
        if (name && name !== oldName) {
            await Reel.updateMany(
                { folder: "grandmaster", grandmaster: oldName },
                { $set: { grandmaster: name } }
            );
        }

        res.json({
            success: true,
            data: grandmaster,
        });
        console.log(`PUT /admin/grandmaster/${id} - Updated: ${grandmaster.name}`);
    } catch (err) {
        console.error("PUT /admin/grandmaster/:id - Error:", err);
        res.status(500).json({ error: "Failed to update grandmaster", message: err.message });
    }
};

// DELETE /admin/grandmaster/:id - Delete a grandmaster folder
export const deleteGrandmaster = async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteReels } = req.query;

        const grandmaster = await Grandmaster.findById(id);
        if (!grandmaster) {
            return res.status(404).json({ error: "Grandmaster not found" });
        }

        if (deleteReels === "true") {
            // Delete all reels in this grandmaster folder
            await Reel.deleteMany({ folder: "grandmaster", grandmaster: grandmaster.name });
        } else {
            // Move reels to random folder
            await Reel.updateMany(
                { folder: "grandmaster", grandmaster: grandmaster.name },
                { $set: { folder: "random", grandmaster: null } }
            );
        }

        await Grandmaster.findByIdAndDelete(id);

        res.json({
            success: true,
            message: `Grandmaster ${grandmaster.name} deleted successfully`,
        });
        console.log(`DELETE /admin/grandmaster/${id} - Deleted: ${grandmaster.name}`);
    } catch (err) {
        console.error("DELETE /admin/grandmaster/:id - Error:", err);
        res.status(500).json({ error: "Failed to delete grandmaster", message: err.message });
    }
};

// GET /admin/videos/by-folder - Get reels by folder (admin version)
export const getReelsByFolderAdmin = async (req, res) => {
    try {
        const { folder, grandmaster } = req.query;

        const query = {};
        if (folder) query.folder = folder;
        if (grandmaster) query.grandmaster = grandmaster;

        const reels = await Reel.find(query).populate("gameId").sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reels.length,
            data: reels,
        });
        console.log(`GET /admin/videos/by-folder - folder: ${folder}, grandmaster: ${grandmaster}, found: ${reels.length}`);
    } catch (err) {
        console.error("GET /admin/videos/by-folder - Error:", err);
        res.status(500).json({ error: "Failed to fetch reels by folder", message: err.message });
    }
};
