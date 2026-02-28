import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { MONGO_URI } from "./config/env.js";

// Models
import User from "./models/User.js";
import ChessGame from "./models/ChessGame.js";
import Reel from "./models/Reel.js";
import Comment from "./models/Comment.js";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      ChessGame.deleteMany(),
      Reel.deleteMany(),
      Comment.deleteMany(),
    ]);

    console.log("Old data cleared");

    // Hash passwords for seed users
    const userPassword = await bcrypt.hash("user123", 10);
    const adminPassword = await bcrypt.hash("admin123", 10);

    // USERS - Regular user and Admin
    const [user1, user2, admin] = await User.insertMany([
      {
        username: "pawncrusher",
        email: "user@chessreels.com",
        password: userPassword,
        profile: {
          name: "Pawn Crusher",
          avatarUrl: "https://cdn.app.com/avatar/user1.png",
          bio: "Learning tactics daily!",
          chessRating: 1200,
        },
        stats: {
          reelsWatched: 25,
          puzzlesSolved: 50,
          followers: 10,
          following: 5,
        },
      },
      {
        username: "chessmaster99",
        email: "master@chessreels.com",
        password: userPassword,
        profile: {
          name: "Chess Master",
          avatarUrl: "https://cdn.app.com/avatar/user2.png",
          bio: "Grandmaster aspirant | FIDE 2100",
          chessRating: 2100,
        },
        stats: {
          reelsWatched: 150,
          puzzlesSolved: 300,
          followers: 500,
          following: 50,
        },
      },
      {
        username: "admin",
        email: "admin@chessreels.com",
        password: adminPassword,
        profile: {
          name: "Admin User",
          avatarUrl: "https://cdn.app.com/avatar/admin.png",
          bio: "ChessReels Administrator",
          chessRating: 1800,
        },
      },
    ]);

    console.log("Users created: 2 regular users + 1 admin");

    // CHESS GAMES
    const [game1, game2, game3] = await ChessGame.insertMany([
      {
        whitePlayer: "Garry Kasparov",
        blackPlayer: "Anatoly Karpov",
        event: "World Championship",
        year: 1985,
        result: "1-0",
        pgn: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3...",
      },
      {
        whitePlayer: "Magnus Carlsen",
        blackPlayer: "Fabiano Caruana",
        event: "World Championship",
        year: 2018,
        result: "1/2-1/2",
        pgn: "1.d4 Nf6 2.c4 e6 3.Nf3 d5 4.Nc3 Be7...",
      },
      {
        whitePlayer: "Bobby Fischer",
        blackPlayer: "Boris Spassky",
        event: "World Championship",
        year: 1972,
        result: "1-0",
        pgn: "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6...",
      },
    ]);

    console.log("3 Chess games created");

    // REELS (Videos) - Various difficulties and statuses
    const reels = await Reel.insertMany([
      // Published - Beginner
      {
        video: {
          url: "https://cdn.app.com/videos/italian-game.mp4",
          thumbnail: "https://cdn.app.com/thumbs/italian.jpg",
          durationSec: 60,
        },
        content: {
          title: "Italian Game for Beginners",
          description: "Learn the classic Italian Game opening - perfect for beginners!",
          tags: ["opening", "italian", "beginner", "e4"],
          difficulty: "beginner",
        },
        gameId: game3._id,
        engagement: { likes: 150, views: 1200, saves: 45, comments: 0 },
        status: "published",
      },
      // Published - Beginner
      {
        video: {
          url: "https://cdn.app.com/videos/endgame-basics.mp4",
          thumbnail: "https://cdn.app.com/thumbs/endgame.jpg",
          durationSec: 120,
        },
        content: {
          title: "Endgame Essentials",
          description: "Master the king and pawn endgame - essential knowledge!",
          tags: ["endgame", "basics", "beginner", "fundamentals"],
          difficulty: "beginner",
        },
        gameId: game1._id,
        engagement: { likes: 89, views: 650, saves: 30, comments: 0 },
        status: "published",
      },
      // Published - Intermediate
      {
        video: {
          url: "https://cdn.app.com/videos/kasparov.mp4",
          thumbnail: "https://cdn.app.com/thumbs/kasparov.jpg",
          durationSec: 45,
        },
        content: {
          title: "Kasparov's Brutal Sicilian Attack",
          description: "Watch how Kasparov crushes with the Sicilian Defense!",
          tags: ["opening", "kasparov", "sicilian", "attack"],
          difficulty: "intermediate",
        },
        gameId: game1._id,
        engagement: { likes: 280, views: 2500, saves: 120, comments: 0 },
        status: "published",
      },
      // Published - Intermediate
      {
        video: {
          url: "https://cdn.app.com/videos/tactics-101.mp4",
          thumbnail: "https://cdn.app.com/thumbs/tactics.jpg",
          durationSec: 90,
        },
        content: {
          title: "5 Tactical Patterns You MUST Know",
          description: "Fork, pin, skewer, discovered attack, and back rank mate",
          tags: ["tactics", "patterns", "intermediate", "tutorial"],
          difficulty: "intermediate",
        },
        gameId: game2._id,
        engagement: { likes: 420, views: 3800, saves: 200, comments: 0 },
        status: "published",
      },
      // Published - Advanced
      {
        video: {
          url: "https://cdn.app.com/videos/queens-gambit.mp4",
          thumbnail: "https://cdn.app.com/thumbs/queens-gambit.jpg",
          durationSec: 180,
        },
        content: {
          title: "Queen's Gambit Deep Dive",
          description: "Advanced strategies and variations in the Queen's Gambit",
          tags: ["opening", "queens-gambit", "advanced", "d4"],
          difficulty: "advanced",
        },
        gameId: game2._id,
        engagement: { likes: 310, views: 2100, saves: 95, comments: 0 },
        status: "published",
      },
      // Published - Advanced
      {
        video: {
          url: "https://cdn.app.com/videos/positional-chess.mp4",
          thumbnail: "https://cdn.app.com/thumbs/positional.jpg",
          durationSec: 240,
        },
        content: {
          title: "Mastering Positional Chess",
          description: "Learn to evaluate positions like a Grandmaster",
          tags: ["strategy", "positional", "advanced", "evaluation"],
          difficulty: "advanced",
        },
        gameId: game1._id,
        engagement: { likes: 180, views: 980, saves: 75, comments: 0 },
        status: "published",
      },
      // Draft - Not visible to users
      {
        video: {
          url: "https://cdn.app.com/videos/upcoming.mp4",
          thumbnail: "https://cdn.app.com/thumbs/upcoming.jpg",
          durationSec: 150,
        },
        content: {
          title: "Coming Soon: Rook Endgames",
          description: "Draft video - not yet published",
          tags: ["endgame", "rook", "draft"],
          difficulty: "intermediate",
        },
        gameId: game3._id,
        engagement: { likes: 0, views: 0, saves: 0, comments: 0 },
        status: "draft",
      },
      // Archived
      {
        video: {
          url: "https://cdn.app.com/videos/old-content.mp4",
          thumbnail: "https://cdn.app.com/thumbs/old.jpg",
          durationSec: 60,
        },
        content: {
          title: "Archived: Basic Checkmate Patterns",
          description: "This content has been archived",
          tags: ["archived", "basics"],
          difficulty: "beginner",
        },
        gameId: game1._id,
        engagement: { likes: 50, views: 300, saves: 10, comments: 0 },
        status: "archived",
      },
    ]);

    console.log(`${reels.length} Reels created (6 published, 1 draft, 1 archived)`);

    // COMMENTS - Create comments on multiple reels
    const publishedReels = reels.filter(r => r.status === "published");
    
    // Comments on first reel (Italian Game)
    const comment1 = await Comment.create({
      reelId: publishedReels[0]._id,
      userId: user1._id,
      text: "This is exactly what I needed! Clear explanation 👏",
    });

    const reply1_1 = await Comment.create({
      reelId: publishedReels[0]._id,
      userId: user2._id,
      text: "Agreed! Finally understand the Italian Game",
      parentCommentId: comment1._id,
    });

    await Comment.create({
      reelId: publishedReels[0]._id,
      userId: user1._id,
      text: "Thanks! Glad it helped 😊",
      parentCommentId: reply1_1._id,
    });

    // Comments on Kasparov reel
    const comment2 = await Comment.create({
      reelId: publishedReels[2]._id,
      userId: user2._id,
      text: "Kasparov is the GOAT! That attack was insane 🔥",
    });

    await Comment.create({
      reelId: publishedReels[2]._id,
      userId: user1._id,
      text: "Can you do more Kasparov games?",
      parentCommentId: comment2._id,
    });

    // Comments on tactics reel
    await Comment.create({
      reelId: publishedReels[3]._id,
      userId: user1._id,
      text: "The back rank mate example was brilliant!",
    });

    await Comment.create({
      reelId: publishedReels[3]._id,
      userId: user2._id,
      text: "I keep missing forks in my games. This helps a lot!",
    });

    // Update reply counts
    await Comment.findByIdAndUpdate(comment1._id, { repliesCount: 1 });
    await Comment.findByIdAndUpdate(reply1_1._id, { repliesCount: 1 });
    await Comment.findByIdAndUpdate(comment2._id, { repliesCount: 1 });

    // Update reel comment counts
    await Reel.findByIdAndUpdate(publishedReels[0]._id, { "engagement.comments": 3 });
    await Reel.findByIdAndUpdate(publishedReels[2]._id, { "engagement.comments": 2 });
    await Reel.findByIdAndUpdate(publishedReels[3]._id, { "engagement.comments": 2 });

    console.log("7 Comments created across 3 reels");

    console.log("\n========== SEEDING COMPLETE ==========");
    console.log("\nTest Credentials:");
    console.log("  Regular User 1: pawncrusher / user123");
    console.log("  Regular User 2: chessmaster99 / user123");
    console.log("  Admin User:     admin / admin123");
    console.log("\n=======================================\n");
    
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
