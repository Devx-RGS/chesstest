// ========= IMPORTANT ==========
// Usage: node scripts/seedTestData.js
//
// Seeds the database with test data for development:
//   - 1 admin + 3 regular users
//   - 6 reels (mix of interactive and non-interactive)
//   - Streaks for each user
//   - Coin balances + sample transactions
//   - 2 grandmaster entries
//
// Safe to run multiple times — skips if data already exists.
// ============================

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import UserModel from "../models/user.model.js";
import Reel from "../models/Reel.js";
import Grandmaster from "../models/Grandmaster.js";
import UserStreak from "../models/UserStreak.js";
import CoinTransaction from "../models/CoinTransaction.js";

dotenv.config();

// ============================================================
// Test data definitions
// ============================================================

const TEST_USERS = [
    { name: "Admin",      email: "admin@decaychess.com",  password: "admin123",  isAdmin: true },
    { name: "Alice",      email: "alice@test.com",        password: "test1234",  isAdmin: false },
    { name: "Bob",        email: "bob@test.com",          password: "test1234",  isAdmin: false },
    { name: "xyz",        email: "xyz@test.com",          password: "test1234",  isAdmin: false },
    { name: "Charlie",    email: "charlie@test.com",      password: "test1234",  isAdmin: false },
];

const GRANDMASTERS = [
    { name: "Magnus Carlsen",       description: "World Chess Champion 2013–2023" },
    { name: "Garry Kasparov",       description: "World Chess Champion 1985–2000" },
    { name: "Bobby Fischer",        description: "World Chess Champion 1972–1975" },
];

// Sample FEN positions for interactive challenges
const FENS = {
    scholarsMate:   "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    middleGame:     "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 7",
    endGame:        "8/5pk1/6p1/8/4K3/8/5PPP/8 w - - 0 40",
};

// Placeholder video URL for reels (works in dev without real upload)
const PLACEHOLDER_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
const PLACEHOLDER_THUMB = "";

function buildReels(userIds) {
    return [
        {
            video: { url: PLACEHOLDER_VIDEO, thumbnail: PLACEHOLDER_THUMB, durationSec: 30 },
            content: {
                title: "Scholar's Mate Trap",
                description: "Can you find the 4-move checkmate? White to play.",
                tags: ["opening", "tactics", "checkmate"],
                difficulty: "beginner",
                whitePlayer: "White",
                blackPlayer: "Black",
            },
            grandmasters: ["Bobby Fischer"],
            interactive: { chessFen: FENS.scholarsMate, playerColor: null, triggerTimestamp: 5, timeLimit: 60 },
            engagement: { likes: 12, comments: 3, views: 50, saves: 5 },
            status: "published",
            folder: "grandmaster",
        },
        {
            video: { url: PLACEHOLDER_VIDEO, thumbnail: PLACEHOLDER_THUMB, durationSec: 45 },
            content: {
                title: "Italian Game — Best Continuation",
                description: "Find the strongest move for White in this classic Italian Game position.",
                tags: ["opening", "italian", "strategy"],
                difficulty: "intermediate",
                whitePlayer: "Magnus Carlsen",
                blackPlayer: "Viswanathan Anand",
            },
            grandmasters: ["Magnus Carlsen"],
            interactive: { chessFen: FENS.middleGame, playerColor: null, triggerTimestamp: 10, timeLimit: 120 },
            engagement: { likes: 34, comments: 8, views: 120, saves: 15 },
            status: "published",
            folder: "grandmaster",
        },
        {
            video: { url: PLACEHOLDER_VIDEO, thumbnail: PLACEHOLDER_THUMB, durationSec: 20 },
            content: {
                title: "King and Pawn Endgame",
                description: "Convert this endgame advantage. Can you promote a pawn?",
                tags: ["endgame", "pawn", "technique"],
                difficulty: "advanced",
                whitePlayer: "Garry Kasparov",
                blackPlayer: "Anatoly Karpov",
            },
            grandmasters: ["Garry Kasparov"],
            interactive: { chessFen: FENS.endGame, playerColor: null, triggerTimestamp: 8, timeLimit: 90 },
            engagement: { likes: 25, comments: 5, views: 80, saves: 10 },
            status: "published",
            folder: "grandmaster",
        },
        {
            video: { url: PLACEHOLDER_VIDEO, thumbnail: PLACEHOLDER_THUMB, durationSec: 35 },
            content: {
                title: "Top 5 Opening Blunders",
                description: "Avoid these common opening mistakes that beginners make.",
                tags: ["opening", "blunders", "tips"],
                difficulty: "beginner",
            },
            grandmasters: [],
            engagement: { likes: 45, comments: 12, views: 200, saves: 20 },
            status: "published",
            folder: "random",
        },
        {
            video: { url: PLACEHOLDER_VIDEO, thumbnail: PLACEHOLDER_THUMB, durationSec: 60 },
            content: {
                title: "Kasparov's Immortal — Move by Move",
                description: "An analysis of Kasparov's legendary victory.",
                tags: ["analysis", "classic", "kasparov"],
                difficulty: "advanced",
                whitePlayer: "Garry Kasparov",
                blackPlayer: "Veselin Topalov",
            },
            grandmasters: ["Garry Kasparov"],
            engagement: { likes: 78, comments: 22, views: 350, saves: 42 },
            status: "published",
            folder: "grandmaster",
        },
        {
            video: { url: PLACEHOLDER_VIDEO, thumbnail: PLACEHOLDER_THUMB, durationSec: 25 },
            content: {
                title: "Draft Reel — Work In Progress",
                description: "This reel is still being edited.",
                tags: ["draft"],
                difficulty: "beginner",
            },
            engagement: { likes: 0, comments: 0, views: 0, saves: 0 },
            status: "draft",
            folder: "random",
        },
    ];
}

// ============================================================
// Seed functions
// ============================================================

async function seedUsers() {
    const created = [];
    for (const u of TEST_USERS) {
        let user = await UserModel.findOne({ email: u.email });
        if (!user) {
            const hashed = await bcrypt.hash(u.password, 10);
            user = await UserModel.create({
                name: u.name,
                email: u.email,
                password: hashed,
                isAdmin: u.isAdmin,
                ratings: Math.floor(Math.random() * 1500) + 500,
                win: Math.floor(Math.random() * 30),
                lose: Math.floor(Math.random() * 20),
            });
            console.log(`  ✅ Created user: ${u.email}`);
        } else {
            console.log(`  ℹ️  User exists: ${u.email}`);
        }
        created.push(user);
    }
    return created;
}

async function seedGrandmasters() {
    for (const gm of GRANDMASTERS) {
        const exists = await Grandmaster.findOne({ name: gm.name });
        if (!exists) {
            await Grandmaster.create(gm);
            console.log(`  ✅ Created grandmaster: ${gm.name}`);
        } else {
            console.log(`  ℹ️  Grandmaster exists: ${gm.name}`);
        }
    }
}

async function seedReels(userIds) {
    const existingCount = await Reel.countDocuments();
    if (existingCount >= 5) {
        console.log(`  ℹ️  ${existingCount} reels already exist, skipping`);
        return;
    }

    const reels = buildReels(userIds);
    for (const r of reels) {
        await Reel.create(r);
    }
    console.log(`  ✅ Created ${reels.length} reels`);
}

async function seedStreaks(users) {
    const regularUsers = users.filter(u => !u.isAdmin);
    for (const user of regularUsers) {
        const exists = await UserStreak.findOne({ userId: user._id });
        if (!exists) {
            const streak = Math.floor(Math.random() * 15) + 1;
            await UserStreak.create({
                userId: user._id,
                currentStreak: streak,
                longestStreak: streak + Math.floor(Math.random() * 10),
                lastActiveDate: new Date(),
            });
            console.log(`  ✅ Created streak for ${user.name}: ${streak} days`);
        } else {
            console.log(`  ℹ️  Streak exists for ${user.name}`);
        }
    }
}

async function seedCoins(users) {
    const regularUsers = users.filter(u => !u.isAdmin);
    const reasons = [
        { reason: "daily_login",     amount: 1  },
        { reason: "daily_login",     amount: 1  },
        { reason: "daily_login",     amount: 1  },
        { reason: "reel_watched",    amount: 1  },
        { reason: "reel_watched",    amount: 1  },
        { reason: "streak_bonus_7",  amount: 5  },
    ];

    for (const user of regularUsers) {
        if (user.coinBalance > 0) {
            console.log(`  ℹ️  Coins exist for ${user.name} (balance: ${user.coinBalance})`);
            continue;
        }

        // Give each user some starting coins
        const startingBalance = 10 + Math.floor(Math.random() * 20);
        await UserModel.findByIdAndUpdate(user._id, {
            $set: {
                coinBalance: startingBalance,
                coinTotalEarned: startingBalance,
                coinTotalSpent: 0,
                interactivePlaysUsed: Math.floor(Math.random() * 5),
            }
        });

        // Create sample transaction history
        for (const tx of reasons) {
            await CoinTransaction.create({
                userId: user._id,
                type: "earn",
                amount: tx.amount,
                reason: tx.reason,
                metadata: {},
            });
        }

        console.log(`  ✅ Created coins for ${user.name}: ${startingBalance} balance, ${reasons.length} transactions`);
    }
}

// ============================================================
// Main
// ============================================================

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        console.log("📦 Seeding users...");
        const users = await seedUsers();

        console.log("\n♟️  Seeding grandmasters...");
        await seedGrandmasters();

        console.log("\n🎬 Seeding reels...");
        await seedReels(users.map(u => u._id));

        console.log("\n🔥 Seeding streaks...");
        await seedStreaks(users);

        console.log("\n🪙 Seeding coins...");
        await seedCoins(users);

        console.log("\n" + "=".repeat(50));
        console.log("✅ All test data seeded successfully!");
        console.log("=".repeat(50));
        console.log("\n📋 Test user credentials:");
        for (const u of TEST_USERS) {
            console.log(`   ${u.name.padEnd(10)} ${u.email.padEnd(25)} pw: ${u.password}${u.isAdmin ? "  (ADMIN)" : ""}`);
        }

        await mongoose.disconnect();
        console.log("\n👋 Disconnected from MongoDB");
    } catch (error) {
        console.error("❌ Seed error:", error);
        process.exit(1);
    }
}

main();
