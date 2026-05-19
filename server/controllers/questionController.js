const Question = require("../models/Question");

exports.create = async (req, res) => {
  try {
    const { subject, type, text, options, correctOption, marks, difficulty } = req.body;
    if (!subject || !type || !text)
      return res.status(400).json({ message: "subject, type and text are required" });

    const q = await Question.create({
      teacher: req.user._id,
      subject, type, text,
      options: type === "mcq" ? options || [] : [],
      correctOption: type === "mcq" ? correctOption : undefined,
      marks: marks || 1,
      difficulty: difficulty || "medium",
    });
    res.json(q);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const query = { teacher: req.user._id };
    if (req.query.subject) query.subject = req.query.subject;
    if (req.query.type) query.type = req.query.type;
    if (req.query.difficulty) query.difficulty = req.query.difficulty;
    const list = await Question.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const q = await Question.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      req.body,
      { new: true }
    );
    if (!q) return res.status(404).json({ message: "Not found" });
    res.json(q);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const q = await Question.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!q) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Admin - all questions
exports.adminList = async (req, res) => {
  try {
    const list = await Question.find().populate("teacher", "name email").sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
