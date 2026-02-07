import dotenv from "dotenv";
dotenv.config();

// Server Configuration
export const PORT = process.env.PORT || 5000;
export const APP_NAME = process.env.App_NAME || "ReelsApp";

// Database Configuration
export const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/" + APP_NAME;

// JWT Configuration - REQUIRE secret in production
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("⚠️  WARNING: JWT_SECRET not set in environment variables!");
    // In development, allow fallback; in production, this should fail
    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be set in production");
    }
}
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Auth Constants
export const SALT_ROUNDS = 10;

// Admin Credentials - REQUIRE in production
export const ADMIN_EMAIL = process.env.AdminEmail;
export const ADMIN_PASSWORD = process.env.AdminPassword;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("⚠️  WARNING: Admin credentials not set in environment variables!");
}

export default {
    PORT,
    APP_NAME,
    MONGO_URI,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    SALT_ROUNDS,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
};
