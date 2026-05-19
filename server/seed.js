/**
 * Run once to create the initial admin account:
 *   node server/seed.js
 */
require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  role:     String,
  isActive: { type: Boolean, default: true },
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log(`ℹ️  Admin already exists: ${existing.email}`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash("Admin@123", 10);
    const admin  = await User.create({
      name:     "Platform Admin",
      email:    "admin@gmail.com",
      password: hashed,
      role:     "admin",
      isActive: true,
    });

    console.log("✅ Admin created!");
    console.log(`   Email:    ${admin.email}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
})();
