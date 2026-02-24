import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ChessGame from "../models/ChessGame.js";
import Reel from "../models/Reel.js";
import Comment from "../models/Comment.js";

// GET /data/me - View current token/session information
export const getMe = (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(200).json({
                authenticated: false,
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        return res.status(200).json({
            authenticated: true,
            token: {
                raw: token,
                decoded,
                issuedAt: new Date(decoded.iat * 1000).toISOString(),
                expiresAt: decoded.exp
                    ? new Date(decoded.exp * 1000).toISOString()
                    : "No expiration",
            },
        });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(200).json({
                authenticated: false,
                message: "Token has expired",
                expiredAt: error.expiredAt,
            });
        }
        return res.status(200).json({
            authenticated: false,
            message: "Invalid token",
            error: error.message,
        });
    }
};

// GET /data/all - Retrieve all data (admin-only)
export const getAll = async (req, res) => {
    try {
        const [users, reels, chessGames, comments] = await Promise.all([
            User.find({}).select("-password"),
            Reel.find({}),
            ChessGame.find({}),
            Comment.find({}),
        ]);

        return res.status(200).json({
            users: { count: users.length, data: users },
            reels: { count: reels.length, data: reels },
            chessGames: { count: chessGames.length, data: chessGames },
            comments: { count: comments.length, data: comments },
        });
    } catch (error) {
        console.error("Error fetching all data:", error);
        return res
            .status(500)
            .json({ error: "Failed to fetch all data", details: error.message });
    }
};
