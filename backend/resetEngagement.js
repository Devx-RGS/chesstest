// Reset engagement counts to real values
require("dotenv").config();
const mongoose = require("mongoose");
const Reel = require("./models/Reel");
const Comment = require("./models/Comment");

async function resetEngagement() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        // Get real comment counts
        const commentCounts = await Comment.aggregate([
            { $group: { _id: "$reelId", count: { $sum: 1 } } }
        ]);

        const commentCountMap = {};
        commentCounts.forEach(item => {
            commentCountMap[item._id.toString()] = item.count;
        });

        // Reset all reels to real engagement (0 likes, real comments, 0 saves)
        const reels = await Reel.find();

        for (const reel of reels) {
            reel.engagement = {
                likes: 0,
                views: 0,
                comments: commentCountMap[reel._id.toString()] || 0,
                saves: 0,
            };
            await reel.save();
        }

        console.log(`Reset engagement for ${reels.length} reels`);
        console.log("Comment counts by reel:");
        Object.entries(commentCountMap).forEach(([id, count]) => {
            console.log(`  ${id}: ${count} comments`);
        });

        await mongoose.connection.close();
        console.log("Done!");
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

resetEngagement();
