const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// POST /auth/register - Create a new user
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ error: "User with this email or username already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create new user with empty profile
        const user = new User({
            username,
            email,
            password: hashedPassword,
            profile: {
                name: null,
                avatarUrl: null,
                bio: null,
                chessRating: 800  // default rating
            }
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, isAdmin: false },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /auth/login - Authenticate user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Check if admin login
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (email === adminEmail && password === adminPassword) {
            // Generate admin JWT token
            const token = jwt.sign(
                { email: adminEmail, isAdmin: true, role: "admin" },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return res.json({
                message: "Admin login successful",
                isAdmin: true,
                token,
                user: {
                    email: adminEmail,
                    role: "admin"
                }
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, isAdmin: false },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: "Login successful",
            isAdmin: false,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /auth/logout - Client should discard token (no server action needed for JWT)
router.post("/logout", (req, res) => {
    // With JWT, logout is handled client-side by discarding the token
    res.json({ message: "Logout successful. Please discard your token." });
});

// PUT /auth/setup-profile - Setup or update user profile
router.put("/setup-profile", verifyToken, async (req, res) => {
    try {
        const { name, avatarUrl, bio, chessRating } = req.body;

        // Build profile update object (only include provided fields)
        const profileUpdate = {};
        if (name !== undefined) profileUpdate["profile.name"] = name;
        if (avatarUrl !== undefined) profileUpdate["profile.avatarUrl"] = avatarUrl;
        if (bio !== undefined) profileUpdate["profile.bio"] = bio;
        if (chessRating !== undefined) {
            // Validate chess rating is a number
            if (typeof chessRating !== "number" || chessRating < 0) {
                return res.status(400).json({ error: "Chess rating must be a positive number" });
            }
            profileUpdate["profile.chessRating"] = chessRating;
        }

        // Check if at least one field is provided
        if (Object.keys(profileUpdate).length === 0) {
            return res.status(400).json({ error: "At least one profile field is required (name, avatarUrl, bio, or chessRating)" });
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: profileUpdate },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                profile: updatedUser.profile
            }
        });
    } catch (error) {
        console.error("Profile setup error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /auth/delete-account - Delete user account
router.delete("/delete-account", verifyToken, async (req, res) => {
    try {
        // Delete user from database
        const deletedUser = await User.findByIdAndDelete(req.user.userId);
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Export verifyToken middleware for use in other routes
module.exports = router;
module.exports.verifyToken = verifyToken;
