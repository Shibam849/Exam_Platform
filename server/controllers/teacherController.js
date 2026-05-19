const Submission = require("../models/Submission");
const Exam       = require("../models/Exam");

// Get all submissions for teacher's exams
exports.getSubmissions = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id }).select("_id");
    const ids   = exams.map((e) => e._id);

    const query = { exam: { $in: ids } };
    if (req.query.examId) query.exam = req.query.examId;

    const subs = await Submission.find(query)
      .populate("exam", "title subject totalMarks")
      .populate("student", "name email rollNo studentCode")
      .populate({ path: "answers.question", model: "Question" })
      .sort({ submittedAt: -1 });

    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Publish / grade a submission
exports.publishMarks = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.submissionId).populate("exam");
    if (!sub) return res.status(404).json({ message: "Not found" });

    const exam = await Exam.findById(sub.exam);
    if (!exam || String(exam.createdBy) !== String(req.user._id))
      return res.status(403).json({ message: "Forbidden" });

    // Apply manual marks from body
    if (Array.isArray(req.body.answers)) {
      sub.answers.forEach((a, i) => {
        const provided = req.body.answers[i];
        if (provided && provided.manualMarks !== undefined) {
          a.manualMarks = Number(provided.manualMarks) || 0;
        }
      });
    }

    const totalAuto   = sub.answers.reduce((s, a) => s + (a.autoMarks   || 0), 0);
    const totalManual = sub.answers.reduce((s, a) => s + (a.manualMarks || 0), 0);
    sub.totalMarks = totalAuto + totalManual;
    sub.graded     = true;
    sub.published  = true;
    await sub.save();

    // notify student
    try {
      const io = req.app.get("io");
      if (io) io.to(`student_${sub.student}`).emit("published", { submissionId: sub._id, totalMarks: sub.totalMarks });
    } catch (_) {}

    res.json({ message: "Published", submission: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Stats for teacher dashboard
exports.stats = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id });
    const examIds = exams.map((e) => e._id);

    const totalSubmissions = await Submission.countDocuments({ exam: { $in: examIds } });
    const published        = await Submission.countDocuments({ exam: { $in: examIds }, published: true });
    const pending          = totalSubmissions - published;

    const perExamStats = await Submission.aggregate([
      { $match: { exam: { $in: examIds }, published: true } },
      {
        $group: {
          _id: "$exam",
          avgMarks: { $avg: "$totalMarks" },
          maxMarks: { $max: "$totalMarks" },
          minMarks: { $min: "$totalMarks" },
          count:    { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "exams", localField: "_id", foreignField: "_id", as: "exam"
        },
      },
      { $unwind: "$exam" },
      {
        $project: {
          examTitle: "$exam.title", subject: "$exam.subject",
          avgMarks: 1, maxMarks: 1, minMarks: 1, count: 1,
        },
      },
    ]);

    res.json({
      totalExams: exams.length, totalSubmissions, published, pending, perExamStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
