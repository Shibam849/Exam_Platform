const User       = require("../models/User");
const Exam       = require("../models/Exam");
const Submission = require("../models/Submission");
const Question   = require("../models/Question");
const bcrypt     = require("bcryptjs");

// ── User Management ──────────────────────────────────────────────────────────

exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role)   query.role = role;
    if (search) query.$or  = [
      { name:  { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { rollNo:{ $regex: search, $options: "i" } },
    ];

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, rollNo, studentCode, department, batch } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "name, email, password required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed, role, rollNo, studentCode, department, batch });
    res.json({ ...user.toObject(), password: undefined });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (password) rest.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot deactivate admin" });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? "activated" : "deactivated"}`, isActive: user.isActive });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot delete admin" });

    await User.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ student: req.params.id });
    res.json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── Analytics ─────────────────────────────────────────────────────────────────

exports.analytics = async (req, res) => {
  try {
    const [
      totalStudents, totalTeachers, totalExams,
      totalQuestions, totalSubmissions, publishedSubmissions,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      Exam.countDocuments(),
      Question.countDocuments(),
      Submission.countDocuments(),
      Submission.countDocuments({ published: true }),
    ]);

    // Per-exam stats
    const perExam = await Submission.aggregate([
      { $match: { published: true } },
      {
        $group: {
          _id: "$exam",
          avgMarks: { $avg: "$totalMarks" },
          count:    { $sum: 1 },
          maxMarks: { $max: "$totalMarks" },
          minMarks: { $min: "$totalMarks" },
        },
      },
      { $lookup: { from: "exams", localField: "_id", foreignField: "_id", as: "exam" } },
      { $unwind: "$exam" },
      {
        $project: {
          examTitle: "$exam.title", subject: "$exam.subject",
          totalMarks: "$exam.totalMarks",
          avgMarks: { $round: ["$avgMarks", 1] },
          count: 1, maxMarks: 1, minMarks: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Score distribution buckets across all published submissions
    const scoreDistribution = await Submission.aggregate([
      { $match: { published: true } },
      {
        $bucket: {
          groupBy: "$totalMarks",
          boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 101],
          default: "100+",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Top students
    const topStudents = await Submission.aggregate([
      { $match: { published: true } },
      {
        $group: {
          _id: "$student",
          totalMarks:  { $sum: "$totalMarks" },
          examCount:   { $sum: 1 },
          avgMarks:    { $avg: "$totalMarks" },
        },
      },
      { $sort: { avgMarks: -1 } },
      { $limit: 10 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      {
        $project: {
          name: "$student.name", email: "$student.email",
          rollNo: "$student.rollNo",
          totalMarks: 1, examCount: 1,
          avgMarks: { $round: ["$avgMarks", 1] },
        },
      },
    ]);

    // Recent activity
    const recentSubmissions = await Submission.find({ published: true })
      .populate("student", "name email")
      .populate("exam", "title subject")
      .sort({ submittedAt: -1 })
      .limit(10)
      .lean();

    // Registrations over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      overview: { totalStudents, totalTeachers, totalExams, totalQuestions, totalSubmissions, publishedSubmissions },
      perExam,
      scoreDistribution,
      topStudents,
      recentSubmissions,
      recentRegistrations,
    });
  } catch (e) {
    console.error("analytics:", e);
    res.status(500).json({ message: e.message });
  }
};

// ── All Submissions (admin view) ──────────────────────────────────────────────

exports.getSubmissions = async (req, res) => {
  try {
    const { examId, studentId, published, page = 1, limit = 20 } = req.query;
    const query = {};
    if (examId)    query.exam    = examId;
    if (studentId) query.student = studentId;
    if (published !== undefined) query.published = published === "true";

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Submission.countDocuments(query);
    const subs  = await Submission.find(query)
      .populate("exam",    "title subject totalMarks")
      .populate("student", "name email rollNo studentCode")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ submissions: subs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── AI Feedback Management ────────────────────────────────────────────────────

exports.getAiFeedbacks = async (req, res) => {
  try {
    const subs = await Submission.find({ aiFeedback: { $ne: "" } })
      .populate("student", "name email rollNo")
      .populate("exam",    "title subject")
      .select("totalMarks aiFeedback aiStrengths aiWeaknesses aiSuggestions aiFeedbackGeneratedAt published student exam")
      .sort({ aiFeedbackGeneratedAt: -1 });
    res.json(subs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── Exam Management (admin) ───────────────────────────────────────────────────

exports.toggleExamPublish = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    exam.isPublished = !exam.isPublished;
    await exam.save();
    res.json({ message: `Exam ${exam.isPublished ? "published" : "unpublished"}`, isPublished: exam.isPublished });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── System Summary ────────────────────────────────────────────────────────────

exports.summary = async (req, res) => {
  try {
    const [students, teachers, admins, exams, questions, submissions] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin" }),
      Exam.countDocuments(),
      Question.countDocuments(),
      Submission.countDocuments(),
    ]);
    res.json({ students, teachers, admins, exams, questions, submissions });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
