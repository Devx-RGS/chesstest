// Seed script: creates an admin user in the database
// Usage: node scripts/seedAdmin.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import UserModel from "../models/user.model.js";

dotenv.config();

const ADMIN_EMAIL = "admin@decaychess.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin";

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existing = await UserModel.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (!existing.isAdmin) {
        existing.isAdmin = true;
        await existing.save();
        console.log("✅ Existing user promoted to admin:", ADMIN_EMAIL);
      } else {
        console.log("ℹ️  Admin already exists:", ADMIN_EMAIL);
      }
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const admin = new UserModel({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        isAdmin: true,
      });
      await admin.save();
      console.log("✅ Admin user created!");
    }

    console.log("\n📋 Admin credentials:");
    console.log("   Email:    ", ADMIN_EMAIL);
    console.log("   Password: ", ADMIN_PASSWORD);
    console.log("\n⚠️  Change the password after first login!");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedAdmin();
