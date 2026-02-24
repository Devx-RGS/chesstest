import Comment from "../models/Comment.js";
import Reel from "../models/Reel.js";
import UserLike from "../models/UserLike.js";
import UserSave from "../models/UserSave.js";

// ============ LIKE FUNCTIONS ============

// GET /reels/:reelId/like-status - Check if current user has liked the reel
export const getLikeStatus = async (req, res) => {
    try {
        const { reelId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.json({ success: true, isLiked: false });
        }

        const existingLike = await UserLike.findOne({ userId, reelId });
        res.json({
            success: true,
            isLiked: !!existingLike,
        });
    } catch (err) {
        console.error("GET /reels/:reelId/like-status - Error:", err);
        res.status(500).json({ error: "Failed to get like status", message: err.message });
    }
};

// GET /reels/liked - Get all reels liked by current user
export const getUserLikedReels = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.json({ success: true, likedReelIds: [] });
        }

        const likes = await UserLike.find({ userId }).select("reelId");
        const likedReelIds = likes.map(like => like.reelId.toString());

        res.json({
            success: true,
            likedReelIds,
        });
    } catch (err) {
        console.error("GET /reels/liked - Error:", err);
        res.status(500).json({ error: "Failed to get liked reels", message: err.message });
    }
};

// POST/PATCH /reels/:reelId/like - Like or unlike a reel (user-specific)
export const likeReel = async (req, res) => {
    try {
        const { reelId } = req.params;
        const { action } = req.body; // "like" or "unlike"
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required to like reels" });
        }

        // Check if reel exists
        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        // Check current like status for THIS user
        const existingLike = await UserLike.findOne({ userId, reelId });

        if (action === "unlike") {
            // Can only unlike if user has previously liked
            if (!existingLike) {
                return res.json({
                    success: true,
                    message: "Reel was not liked by this user",
                    likes: reel.engagement.likes,
                    isLiked: false,
                });
            }

            // Remove the like and decrement counter
            await UserLike.deleteOne({ userId, reelId });
            reel.engagement.likes = Math.max(0, reel.engagement.likes - 1);
            await reel.save();

            res.json({
                success: true,
                message: "Reel unliked",
                likes: reel.engagement.likes,
                isLiked: false,
            });
            console.log(`POST /reels/${reelId}/like - User ${userId} unliked, total: ${reel.engagement.likes}`);
        } else {
            // Like action
            if (existingLike) {
                return res.json({
                    success: true,
                    message: "Reel already liked by this user",
                    likes: reel.engagement.likes,
                    isLiked: true,
                });
            }

            // Create new like and increment counter
            await UserLike.create({ userId, reelId });
            reel.engagement.likes += 1;
            await reel.save();

            res.json({
                success: true,
                message: "Reel liked",
                likes: reel.engagement.likes,
                isLiked: true,
            });
            console.log(`POST /reels/${reelId}/like - User ${userId} liked, total: ${reel.engagement.likes}`);
        }
    } catch (err) {
        console.error("POST /reels/:reelId/like - Error:", err);
        res.status(500).json({ error: "Failed to like reel", message: err.message });
    }
};

// POST /reels/:reelId/unlike - Unlike a reel (requires auth, user-specific)
export const unlikeReel = async (req, res) => {
    try {
        const { reelId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required to unlike reels" });
        }

        // Check if user has liked this reel
        const existingLike = await UserLike.findOne({ userId, reelId });
        if (!existingLike) {
            return res.status(400).json({ error: "You have not liked this reel" });
        }

        // Remove the like
        await UserLike.deleteOne({ userId, reelId });

        // Decrement counter
        const reel = await Reel.findByIdAndUpdate(
            reelId,
            { $inc: { "engagement.likes": -1 } },
            { new: true }
        );

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        // Ensure likes don't go negative
        if (reel.engagement.likes < 0) {
            reel.engagement.likes = 0;
            await reel.save();
        }

        res.json({
            success: true,
            message: "Reel unliked",
            likes: reel.engagement.likes,
            isLiked: false,
        });
        console.log(`POST /reels/${reelId}/unlike - User ${userId} unliked, total: ${reel.engagement.likes}`);
    } catch (err) {
        console.error("POST /reels/:reelId/unlike - Error:", err);
        res.status(500).json({ error: "Failed to unlike reel", message: err.message });
    }
};

// ============ SAVE FUNCTIONS ============

// GET /reels/:reelId/save-status - Check if current user has saved the reel
export const getSaveStatus = async (req, res) => {
    try {
        const { reelId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.json({ success: true, isSaved: false });
        }

        const existingSave = await UserSave.findOne({ userId, reelId });
        res.json({
            success: true,
            isSaved: !!existingSave,
        });
    } catch (err) {
        console.error("GET /reels/:reelId/save-status - Error:", err);
        res.status(500).json({ error: "Failed to get save status", message: err.message });
    }
};

// GET /reels/saved - Get all reels saved by current user
export const getUserSavedReels = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.json({ success: true, savedReelIds: [] });
        }

        const saves = await UserSave.find({ userId }).select("reelId");
        const savedReelIds = saves.map(save => save.reelId.toString());

        res.json({
            success: true,
            savedReelIds,
        });
    } catch (err) {
        console.error("GET /reels/saved - Error:", err);
        res.status(500).json({ error: "Failed to get saved reels", message: err.message });
    }
};

// POST /reels/:reelId/save - Save or unsave a reel (user-specific)
export const saveReel = async (req, res) => {
    try {
        const { reelId } = req.params;
        const { action } = req.body; // "save" or "unsave"
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required to save reels" });
        }

        // Check if reel exists
        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        // Check current save status for THIS user
        const existingSave = await UserSave.findOne({ userId, reelId });

        if (action === "unsave") {
            if (!existingSave) {
                return res.json({
                    success: true,
                    message: "Reel was not saved by this user",
                    saves: reel.engagement.saves,
                    isSaved: false,
                });
            }

            await UserSave.deleteOne({ userId, reelId });
            reel.engagement.saves = Math.max(0, reel.engagement.saves - 1);
            await reel.save();

            res.json({
                success: true,
                message: "Reel unsaved",
                saves: reel.engagement.saves,
                isSaved: false,
            });
            console.log(`POST /reels/${reelId}/save - User ${userId} unsaved, total: ${reel.engagement.saves}`);
        } else {
            if (existingSave) {
                return res.json({
                    success: true,
                    message: "Reel already saved by this user",
                    saves: reel.engagement.saves,
                    isSaved: true,
                });
            }

            await UserSave.create({ userId, reelId });
            reel.engagement.saves += 1;
            await reel.save();

            res.json({
                success: true,
                message: "Reel saved",
                saves: reel.engagement.saves,
                isSaved: true,
            });
            console.log(`POST /reels/${reelId}/save - User ${userId} saved, total: ${reel.engagement.saves}`);
        }
    } catch (err) {
        console.error("POST /reels/:reelId/save - Error:", err);
        res.status(500).json({ error: "Failed to save reel", message: err.message });
    }
};

// ============ COMMENT FUNCTIONS ============

// POST /reels/:reelId/comments - Create a new comment
export const createComment = async (req, res) => {
    try {
        const { reelId } = req.params;
        const { text, parentCommentId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required to post comments" });
        }

        // Validate required fields
        if (!text) {
            return res.status(400).json({ error: "text is required" });
        }

        // Check if reel exists
        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        // If it's a reply, check if parent comment exists
        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({ error: "Parent comment not found" });
            }
            // Increment reply count on parent
            await Comment.findByIdAndUpdate(parentCommentId, {
                $inc: { repliesCount: 1 },
            });
        }

        // Create comment
        const comment = new Comment({
            reelId,
            userId,
            text,
            parentCommentId: parentCommentId || null,
        });

        await comment.save();

        // Increment comment count on reel
        await Reel.findByIdAndUpdate(reelId, {
            $inc: { "engagement.comments": 1 },
        });

        // Populate user info before sending response
        if (userId === "admin") {
            const commentObj = comment.toObject();
            commentObj.userId = {
                _id: "admin",
                username: "Admin",
                profile: { avatarUrl: null }
            };

            res.status(201).json({
                success: true,
                message: "Comment created successfully",
                data: commentObj,
            });
        } else {
            await comment.populate("userId", "username profile.avatarUrl");

            res.status(201).json({
                success: true,
                message: "Comment created successfully",
                data: comment,
            });
        }
        console.log(`POST /reels/${reelId}/comments - Comment created: ${comment._id}`);
    } catch (error) {
        console.error("POST /reels/:reelId/comments - Error:", error);
        res.status(500).json({ error: "Failed to create comment" });
    }
};

// DELETE /reels/:reelId/comments/:commentId - Delete a comment (and all replies)
export const deleteComment = async (req, res) => {
    try {
        const { reelId, commentId } = req.params;
        const userId = req.user.userId;

        // Find the comment
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if user owns the comment
        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ error: "You can only delete your own comments" });
        }

        // Recursive function to delete comment and all its replies
        const deleteCommentAndReplies = async (parentId) => {
            // Find all direct replies
            const replies = await Comment.find({ parentCommentId: parentId });

            // Recursively delete each reply's children first
            for (const reply of replies) {
                await deleteCommentAndReplies(reply._id);
            }

            // Delete all direct replies
            const deletedReplies = await Comment.deleteMany({ parentCommentId: parentId });

            return deletedReplies.deletedCount;
        };

        // Count total comments to be deleted (for updating reel engagement)
        const countReplies = async (parentId) => {
            const replies = await Comment.find({ parentCommentId: parentId });
            let count = replies.length;
            for (const reply of replies) {
                count += await countReplies(reply._id);
            }
            return count;
        };

        const repliesCount = await countReplies(commentId);
        const totalDeleted = repliesCount + 1; // +1 for the parent comment itself

        // Delete all replies recursively
        await deleteCommentAndReplies(commentId);

        // Delete the parent comment itself
        await Comment.findByIdAndDelete(commentId);

        // Decrement comment count on reel
        await Reel.findByIdAndUpdate(comment.reelId, {
            $inc: { "engagement.comments": -totalDeleted },
        });

        // If this was a reply, decrement parent's reply count
        if (comment.parentCommentId) {
            await Comment.findByIdAndUpdate(comment.parentCommentId, {
                $inc: { repliesCount: -1 },
            });
        }

        res.json({
            success: true,
            message: `Comment and ${repliesCount} replies deleted successfully`,
            deletedCount: totalDeleted,
        });
        console.log(`DELETE /reels/${reelId}/comments/${commentId} - Comment and ${repliesCount} replies deleted`);
    } catch (error) {
        console.error("DELETE /reels/:reelId/comments/:commentId - Error:", error);
        res.status(500).json({ error: "Failed to delete comment" });
    }
};

// GET /reels/:reelId/comments - Get all comments for a reel
export const getCommentsByReel = async (req, res) => {
    try {
        const { reelId } = req.params;

        const comments = await Comment.find({ reelId, isDeleted: false })
            .populate("userId", "username profile.avatarUrl")
            .sort({ createdAt: -1 })
            .lean();

        // Manual injection for admin comments
        const processedComments = comments.map(comment => {
            if (comment.userId === "admin" || !comment.userId) {
                // If it failed to populate or is explicitly "admin"
                // Check if it's supposed to be admin (if we can know) 
                // Since we relaxed schema to String, populate might leave it as "admin" string if no match found
                if (comment.userId === "admin") {
                    return {
                        ...comment,
                        userId: {
                            _id: "admin",
                            username: "Admin",
                            profile: { avatarUrl: null }
                        }
                    };
                }
            }
            return comment;
        });

        res.json({
            success: true,
            count: processedComments.length,
            comments: processedComments,
        });
        console.log(`GET /reels/${reelId}/comments - ${comments.length} comments fetched`);
    } catch (error) {
        console.error("GET /reels/:reelId/comments - Error:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
};
