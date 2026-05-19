const Submission = require("../models/Submission");
const Question   = require("../models/Question");
const Exam       = require("../models/Exam");

// Submit exam
exports.submit = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const existing = await Submission.findOne({ exam: examId, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already submitted" });

    let normalized = [];
    let autoTotal  = 0;

    for (const a of answers) {
      const q = await Question.findById(a.question);
      if (!q) continue;

      let auto = 0;
      if (q.type === "mcq") {
        if (a.chosenOptionValue && q.options[q.correctOption] === a.chosenOptionValue) {
          auto = q.marks || 1;
        }
      }
      autoTotal += auto;

      normalized.push({
        question: q._id,
        chosenIndex: a.chosenIndex !== undefined ? a.chosenIndex : null,
        chosenOptionValue: a.chosenOptionValue || null,
        textAnswer: a.textAnswer || "",
        autoMarks: auto,
        manualMarks: 0,
      });
    }

    const submission = await Submission.create({
      exam: examId,
      student: req.user._id,
      studentName: req.user.name,
      answers: normalized,
      totalMarks: autoTotal,
      submittedAt: new Date(),
      graded: false,
      published: false,
    });

    // notify teacher
    try {
      const io = req.app.get("io");
      if (io && exam.createdBy) {
        io.to(`teacher_${exam.createdBy}`).emit("newSubmission", { submissionId: submission._id });
      }
    } catch (_) {}

    res.json(submission);
  } catch (err) {
    console.error("submit:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get own marks / submissions
exports.myResults = async (req, res) => {
  try {
    const subs = await Submission.find({ student: req.user._id })
      .populate("exam", "title subject totalMarks")
      .sort({ submittedAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single submission detail (published)
exports.resultDetail = async (req, res) => {
  try {
    const sub = await Submission.findOne({ _id: req.params.id, student: req.user._id })
      .populate("exam", "title subject totalMarks")
      .populate({ path: "answers.question", model: "Question" });
    if (!sub) return res.status(404).json({ message: "Not found" });
    if (!sub.published) return res.status(403).json({ message: "Results not published yet" });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
