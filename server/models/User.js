const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    isActive: { type: Boolean, default: true },
    rollNo:   { type: String }, // for students
    studentCode: { type: String }, // e.g. BWU/BTD/22/061
    department:  { type: String },
    batch:       { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
