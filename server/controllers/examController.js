const Exam     = require("../models/Exam");
const Question = require("../models/Question");
const Submission = require("../models/Submission");
const { Types } = require("mongoose");

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Teacher: create exam
exports.create = async (req, res) => {
  try {
    const {
      title, subject, durationMinutes, startAt, endAt,
      randomizeQuestions = true, randomizeOptions = true,
      mode, questionIds, autoCounts = {}, instructions, isPublished
    } = req.body;

    if (!title || !subject || !mode)
      return res.status(400).json({ message: "title, subject, mode required" });

    let questions = [];

    if (mode === "manual") {
      if (!questionIds || !questionIds.length)
        return res.status(400).json({ message: "Select at least 1 question" });
      questions = questionIds.map((id) => new Types.ObjectId(id));
    } else if (mode === "auto") {
      const pick = async (difficulty, count) => {
        if (!count || Number(count) <= 0) return [];
        const list = await Question.aggregate([
          { $match: { teacher: req.user._id, subject, difficulty } },
          { $sample: { size: Number(count) } },
          { $project: { _id: 1 } },
        ]);
        return list.map((x) => new Types.ObjectId(x._id));
      };
      questions = [
        ...(await pick("easy",   autoCounts.easy)),
        ...(await pick("medium", autoCounts.medium)),
        ...(await pick("hard",   autoCounts.hard)),
      ];
    } else {
      return res.status(400).json({ message: "Invalid mode" });
    }

    // Compute totalMarks
    const qDocs = await Question.find({ _id: { $in: questions } });
    const totalMarks = qDocs.reduce((s, q) => s + (q.marks || 1), 0);

    const exam = await Exam.create({
      title, subject, questions, durationMinutes,
      startAt: startAt ? new Date(startAt) : null,
      endAt:   endAt   ? new Date(endAt)   : null,
      randomizeQuestions, randomizeOptions,
      instructions: instructions || "",
      isPublished: isPublished || false,
      totalMarks,
      createdBy: req.user._id,
    });

    res.json(exam);
  } catch (err) {
    console.error("createExam:", err);
    res.status(500).json({ message: err.message });
  }
};

// Teacher: list own exams
exports.teacherExams = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Teacher / Admin: view one exam
exports.view = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions").populate("createdBy", "name email");
    if (!exam) return res.status(404).json({ message: "Not found" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Teacher: update exam
exports.update = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!exam) return res.status(404).json({ message: "Not found or forbidden" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Teacher: delete exam
exports.remove = async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ message: "Not found or forbidden" });
    await Submission.deleteMany({ exam: req.params.id });
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student: list available exams
exports.available = async (req, res) => {
  try {
    const now = new Date();
    const exams = await Exam.find({ isPublished: true }).populate("createdBy", "name").sort({ startAt: -1 });

    const out = await Promise.all(
      exams.map(async (e) => {
        let status = "upcoming";
        if (e.startAt && now >= e.startAt && (!e.endAt || now <= e.endAt)) status = "live";
        if (e.endAt && now > e.endAt) status = "closed";

        const submitted = await Submission.findOne({ exam: e._id, student: req.user._id });
        return {
          _id: e._id, title: e.title, subject: e.subject,
          startAt: e.startAt, endAt: e.endAt,
          durationMinutes: e.durationMinutes,
          teacherName: e.createdBy?.name || "",
          status, submitted: !!submitted,
          totalQuestions: (e.questions || []).length,
          totalMarks: e.totalMarks,
          instructions: e.instructions,
        };
      })
    );
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student: start exam
exports.start = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const already = await Submission.findOne({ exam: req.params.id, student: req.user._id });
    if (already) return res.status(400).json({ message: "Already submitted" });

    const now = new Date();
    if (exam.startAt && now < exam.startAt)
      return res.status(400).json({ message: "Exam has not started yet" });
    if (exam.endAt && now > exam.endAt)
      return res.status(400).json({ message: "Exam has ended" });

    let questions = exam.questions.map((q) => q.toObject());
    if (exam.randomizeQuestions) questions = shuffle(questions);

    if (exam.randomizeOptions) {
      questions = questions.map((q) => {
        if (q.type === "mcq" && Array.isArray(q.options)) {
          const paired = q.options.map((o, i) => ({ o, i }));
          const shuffled = shuffle(paired);
          q.options = shuffled.map((x) => x.o);
          q.correctOption = shuffled.findIndex((x) => x.i === q.correctOption);
        }
        return q;
      });
    }

    const safe = questions.map((q) => {
      const copy = { ...q };
      delete copy.correctOption;
      return copy;
    });

    res.json({
      exam: {
        id: exam._id, title: exam.title, subject: exam.subject,
        durationMinutes: exam.durationMinutes, instructions: exam.instructions,
      },
      questions: safe,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: all exams
exports.adminAll = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: delete any exam
exports.adminDelete = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ exam: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
