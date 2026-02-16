import Reel from "../models/Reel.js";
import Comment from "../models/Comment.js";

// GET /reels - Get all published reels (paginated feed)
export const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reels = await Reel.find({ status: "published" })
            .populate("gameId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Reel.countDocuments({ status: "published" });

        res.json({
            success: true,
            reels: reels,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalReels: total,
                hasMore: page * limit < total,
            },
        });
        console.log(`GET /reels - Feed fetched: ${reels.length} reels (page ${page})`);
    } catch (err) {
        console.error("GET /reels - Error:", err);
        res.status(500).json({ error: "Failed to fetch reels", message: err.message });
    }
};

// GET /reels/random - Get random reels
export const getRandomReels = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Use MongoDB aggregation with $sample for random selection
        const reels = await Reel.aggregate([
            { $match: { status: "published" } },
            { $sample: { size: limit } },
            {
                $lookup: {
                    from: "chessgames",
                    localField: "gameId",
                    foreignField: "_id",
                    as: "gameId"
                }
            },
            { $unwind: { path: "$gameId", preserveNullAndEmptyArrays: true } }
        ]);

        res.json({
            success: true,
            data: reels,
            count: reels.length,
        });
        console.log(`GET /reels/random - Fetched ${reels.length} random reels`);
    } catch (err) {
        console.error("GET /reels/random - Error:", err);
        res.status(500).json({ error: "Failed to fetch random reels", message: err.message });
    }
};

// GET /reels/grandmasters - Get list of all available grandmasters (for grandmaster selection UI)
export const getAvailableGrandmasters = async (req, res) => {
    try {
        // Get distinct grandmaster names from published reels
        const grandmasterNames = await Reel.distinct("grandmasters", { status: "published" });

        // Filter out any null/empty values
        const validNames = grandmasterNames.filter(name => name && name.trim());

        // Get reel count for each grandmaster
        const grandmastersWithCounts = await Promise.all(
            validNames.map(async (name) => {
                const count = await Reel.countDocuments({
                    status: "published",
                    grandmasters: name,
                });
                return { name, reelCount: count };
            })
        );

        // Sort by name alphabetically
        grandmastersWithCounts.sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            success: true,
            data: grandmastersWithCounts,
            count: grandmastersWithCounts.length,
        });
        console.log(`GET /reels/grandmasters - Fetched ${grandmastersWithCounts.length} available grandmasters`);
    } catch (err) {
        console.error("GET /reels/grandmasters - Error:", err);
        res.status(500).json({ error: "Failed to fetch grandmasters", message: err.message });
    }
};

// GET /reels/grandmaster/:name - Get reels for a specific grandmaster
export const getReelsByGrandmaster = async (req, res) => {
    try {
        const { name } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reels = await Reel.find({
            status: "published",
            grandmasters: name,
        })
            .populate("gameId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Reel.countDocuments({
            status: "published",
            grandmasters: name,
        });

        res.json({
            success: true,
            data: reels,
            grandmaster: { name },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalReels: total,
                hasMore: page * limit < total,
            },
        });
        console.log(`GET /reels/grandmaster/${name} - Found ${reels.length} reels for ${name}`);
    } catch (err) {
        console.error("GET /reels/grandmaster/:name - Error:", err);
        res.status(500).json({ error: "Failed to fetch reels", message: err.message });
    }
};

// POST /reels/:reelId/view - Increment view count
export const viewReel = async (req, res) => {
    try {
        const { reelId } = req.params;

        const reel = await Reel.findByIdAndUpdate(
            reelId,
            { $inc: { "engagement.views": 1 } },
            { new: true }
        );

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        res.json({
            success: true,
            message: "View recorded",
            views: reel.engagement.views,
        });
        console.log(`POST /reels/${reelId}/view - View recorded, total views: ${reel.engagement.views}`);
    } catch (err) {
        console.error("POST /reels/:reelId/view - Error:", err);
        res.status(500).json({ error: "Failed to record view", message: err.message });
    }
};

// GET /reels/:reelId/stats - Get reel engagement stats
export const getReelStats = async (req, res) => {
    try {
        const { reelId } = req.params;

        const reel = await Reel.findById(reelId).select("engagement");

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        const commentsCount = await Comment.countDocuments({ reelId, isDeleted: false });

        res.json({
            success: true,
            stats: {
                likes: reel.engagement.likes,
                views: reel.engagement.views,
                saves: reel.engagement.saves,
                comments: commentsCount,
            },
        });
        console.log(`GET /reels/${reelId}/stats - Stats fetched (views: ${reel.engagement.views}, likes: ${reel.engagement.likes})`);
    } catch (err) {
        console.error("GET /reels/:reelId/stats - Error:", err);
        res.status(500).json({ error: "Failed to fetch reel stats", message: err.message });
    }
};
