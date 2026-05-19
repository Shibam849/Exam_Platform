const Submission = require("../models/Submission");
const Question   = require("../models/Question");

// Call Groq API directly (no SDK dependency) — uses Node 18+ built-in fetch
const callGroq = async (prompt) => {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       "llama-3.3-70b-versatile",
      max_tokens:  1024,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an academic performance advisor for a university examination system.
Given a student's exam results, generate structured, encouraging, and actionable feedback.
Always respond with ONLY valid JSON in this exact structure (no markdown, no extra text):
{
  "overallFeedback": "2-3 sentence overall performance summary",
  "strengths":       ["strength 1", "strength 2", "strength 3"],
  "weaknesses":      ["weakness 1", "weakness 2"],
  "suggestions":     ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "grade":           "A/B/C/D/F based on percentage",
  "encouragement":   "one motivating sentence"
}`,
        },
        {
          role:    "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  // Strip any accidental markdown fences
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// ─── Generate AI feedback for a single submission (teacher / admin triggers) ─────

exports.generateFeedback = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.submissionId)
      .populate("exam",    "title subject totalMarks")
      .populate("student", "name rollNo")
      .populate({ path: "answers.question", model: "Question" });

    if (!sub)          return res.status(404).json({ message: "Submission not found" });
    if (!sub.published) return res.status(400).json({ message: "Publish marks before generating feedback" });

    const examTotalMarks = sub.exam?.totalMarks || 100;
    const percentage     = Math.round((sub.totalMarks / examTotalMarks) * 100);

    // Build question-answer summary
    const qaSummary = sub.answers
      .map((a, i) => {
        const q = a.question;
        if (!q) return "";
        const earned   = (a.autoMarks || 0) + (a.manualMarks || 0);
        const possible = q.marks || 1;
        if (q.type === "mcq") {
          return `Q${i + 1} [MCQ, ${q.difficulty}]: "${q.text.slice(0, 80)}" — ${earned}/${possible} marks`;
        }
        return `Q${i + 1} [SAQ]: "${q.text.slice(0, 80)}" — ${earned}/${possible} marks`;
      })
      .filter(Boolean)
      .join("\n");

    const prompt = `
Student: ${sub.student?.name || "Unknown"} (Roll: ${sub.student?.rollNo || "N/A"})
Exam: "${sub.exam?.title}" | Subject: ${sub.exam?.subject}
Score: ${sub.totalMarks}/${examTotalMarks} (${percentage}%)

Question-wise performance:
${qaSummary}

Generate personalised academic feedback for this student.`.trim();

    const feedback = await callGroq(prompt);

    // Persist feedback on the submission document
    sub.aiFeedback            = feedback.overallFeedback || "";
    sub.aiStrengths           = feedback.strengths        || [];
    sub.aiWeaknesses          = feedback.weaknesses       || [];
    sub.aiSuggestions         = feedback.suggestions      || [];
    sub.aiFeedbackGeneratedAt = new Date();
    await sub.save();

    res.json({
      message: "Feedback generated",
      feedback: {
        overallFeedback: sub.aiFeedback,
        strengths:       sub.aiStrengths,
        weaknesses:      sub.aiWeaknesses,
        suggestions:     sub.aiSuggestions,
        grade:           feedback.grade,
        encouragement:   feedback.encouragement,
        generatedAt:     sub.aiFeedbackGeneratedAt,
      },
    });
  } catch (err) {
    console.error("generateFeedback error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── Bulk-generate feedback for all pending published submissions of an exam ──

exports.bulkGenerateFeedback = async (req, res) => {
  try {
    const { examId } = req.params;

    const subs = await Submission.find({
      exam:       examId,
      published:  true,
      aiFeedback: "",          // only those without feedback yet
    })
      .populate("exam",    "title subject totalMarks")
      .populate("student", "name rollNo")
      .populate({ path: "answers.question", model: "Question" });

    if (!subs.length)
      return res.json({ message: "No pending submissions for AI feedback", count: 0 });

    let count = 0;

    for (const sub of subs) {
      try {
        const examTotalMarks = sub.exam?.totalMarks || 100;
        const percentage     = Math.round((sub.totalMarks / examTotalMarks) * 100);

        const qaSummary = sub.answers
          .map((a, i) => {
            const q = a.question;
            if (!q) return "";
            const earned = (a.autoMarks || 0) + (a.manualMarks || 0);
            return `Q${i + 1}: ${earned}/${q.marks || 1} marks`;
          })
          .filter(Boolean)
          .join(", ");

        const prompt =
          `Student: ${sub.student?.name || "Unknown"}, ` +
          `Exam: "${sub.exam?.title}", Subject: ${sub.exam?.subject}, ` +
          `Score: ${sub.totalMarks}/${examTotalMarks} (${percentage}%), ` +
          `Details: ${qaSummary}. Generate personalised academic feedback.`;

        const feedback = await callGroq(prompt);

        sub.aiFeedback            = feedback.overallFeedback || "";
        sub.aiStrengths           = feedback.strengths        || [];
        sub.aiWeaknesses          = feedback.weaknesses       || [];
        sub.aiSuggestions         = feedback.suggestions      || [];
        sub.aiFeedbackGeneratedAt = new Date();
        await sub.save();
        count++;

        // Throttle to stay within Groq rate limits
        await new Promise((r) => setTimeout(r, 500));
      } catch (innerErr) {
        console.error(`Feedback failed for submission ${sub._id}:`, innerErr.message);
      }
    }

    res.json({ message: `Feedback generated for ${count} submission(s)`, count });
  } catch (err) {
    console.error("bulkGenerateFeedback error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── Get AI feedback for a submission (student view after result publication) ─

exports.getFeedback = async (req, res) => {
  try {
    const query = { _id: req.params.submissionId };
    if (req.user.role === "student") query.student = req.user._id;

    const sub = await Submission.findOne(query).populate("exam", "title subject totalMarks");
    if (!sub)           return res.status(404).json({ message: "Not found" });
    if (!sub.published) return res.status(403).json({ message: "Results not published yet" });

    res.json({
      examTitle:       sub.exam?.title,
      subject:         sub.exam?.subject,
      totalMarks:      sub.totalMarks,
      examTotalMarks:  sub.exam?.totalMarks,
      overallFeedback: sub.aiFeedback,
      strengths:       sub.aiStrengths,
      weaknesses:      sub.aiWeaknesses,
      suggestions:     sub.aiSuggestions,
      generatedAt:     sub.aiFeedbackGeneratedAt,
    });
  } catch (err) {
    console.error("getFeedback error:", err);
    res.status(500).json({ message: err.message });
  }
};