import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import { connectDB } from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reelRoutes from "./routes/reelRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import uploadRoutes from "./routes/uploadRoute.js";

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());

// Serve static files (videos, images) from /public folder
app.use('/public', express.static('public'));

// Serve uploaded files from /uploads folder
app.use('/uploads', express.static('uploads'));

// Connect to database
await connectDB();

// Routes
app.use("/auth", authRoutes);
app.use("/data", dataRoutes);
app.use("/admin", adminRoutes);
app.use("/reels", reelRoutes);
app.use("/streak", streakRoutes);
app.use("/upload", uploadRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
