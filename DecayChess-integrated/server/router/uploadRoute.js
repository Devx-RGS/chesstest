import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Ensure directories exist
const uploadsDir = "uploads";
const thumbnailsDir = "public/thumbnails";

[uploadsDir, thumbnailsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === "thumbnail") {
            cb(null, thumbnailsDir);
        } else {
            cb(null, uploadsDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload Endpoint - Handle both video and thumbnail fields
const uploadFields = upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
]);

router.post("/", uploadFields, (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const result = { success: true };

    // Handle video upload
    if (req.files.video) {
        const file = req.files.video[0];
        result.url = `${baseUrl}/uploads/${file.filename}`;
        result.videoUrl = `${baseUrl}/uploads/${file.filename}`;
        result.filename = file.filename;
        result.mimetype = file.mimetype;
    }

    // Handle thumbnail upload
    if (req.files.thumbnail) {
        const file = req.files.thumbnail[0];
        result.thumbnailUrl = `${baseUrl}/public/thumbnails/${file.filename}`;
    }

    res.json(result);
});

export default router;
