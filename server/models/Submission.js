const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema(
  {
    exam:         { type: mongoose.Types.ObjectId, ref: "Exam",    required: true },
    student:      { type: mongoose.Types.ObjectId, ref: "User",    required: true },
    studentName:  { type: String },
    answers: [
      {
        question:          { type: mongoose.Types.ObjectId, ref: "Question" },
        chosenIndex:       Number,
        chosenOptionValue: String,
        textAnswer:        String,
        autoMarks:         { type: Number, default: 0 },
        manualMarks:       { type: Number, default: 0 },
      },
    ],
    examStartAt:  Date,
    submittedAt:  Date,
    graded:       { type: Boolean, default: false },
    published:    { type: Boolean, default: false },
    totalMarks:   { type: Number, default: 0 },
    // AI feedback fields
    aiFeedback:   { type: String, default: "" },
    aiStrengths:  [{ type: String }],
    aiWeaknesses: [{ type: String }],
    aiSuggestions:[{ type: String }],
    aiFeedbackGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

SubmissionSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", SubmissionSchema);
