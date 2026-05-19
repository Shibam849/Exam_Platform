const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    teacher:       { type: mongoose.Types.ObjectId, ref: "User", required: true },
    subject:       { type: String, required: true },
    type:          { type: String, enum: ["mcq", "saq"], required: true },
    text:          { type: String, required: true },
    options:       [{ type: String }],
    correctOption: { type: Number }, // index for MCQ
    marks:         { type: Number, default: 1 },
    difficulty:    { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);
