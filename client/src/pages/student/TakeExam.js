import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";

function useTimer(durationMinutes, onExpire) {
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  // eslint-disable-next-line
  }, []);

  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  return { display: `${mins}:${secs}`, isLow: remaining < 120, remaining };
}

export default function TakeExam() {
  const { id }  = useParams();
  const nav     = useNavigate();

  const [examData,  setExamData]  = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers,   setAnswers]   = useState({});  // questionId -> { chosenIndex, chosenOptionValue, textAnswer }
  const [current,   setCurrent]   = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  const handleExpire = useCallback(() => { if (!submitted) submitExam(); }, [submitted]); // eslint-disable-line

  const { display: timerDisplay, isLow } = useTimer(examData?.durationMinutes || 60, handleExpire);

  useEffect(() => {
    api.get(`/exams/${id}/start`)
      .then(r => {
        setExamData(r.data.exam);
        setQuestions(r.data.questions);
        const init = {};
        r.data.questions.forEach(q => { init[q._id] = { chosenIndex: null, chosenOptionValue: null, textAnswer: "" }; });
        setAnswers(init);
      })
      .catch(err => setError(err.response?.data?.message || "Failed to load exam"))
      .finally(() => setLoading(false));
  }, [id]);

  const setMCQ = (qId, idx, value) => {
    setAnswers(p => ({ ...p, [qId]: { chosenIndex: idx, chosenOptionValue: value, textAnswer: "" } }));
  };

  const setSAQ = (qId, text) => {
    setAnswers(p => ({ ...p, [qId]: { chosenIndex: null, chosenOptionValue: null, textAnswer: text } }));
  };

  const submitExam = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const payload = questions.map(q => ({
        question:          q._id,
        chosenIndex:       answers[q._id]?.chosenIndex,
        chosenOptionValue: answers[q._id]?.chosenOptionValue,
        textAnswer:        answers[q._id]?.textAnswer || "",
      }));
      await api.post("/student/submit", { examId: id, answers: payload });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
      setSubmitting(false);
    }
  };

  const answered = Object.values(answers).filter(a => a.chosenOptionValue || a.textAnswer).length;

  if (loading) return <div className="loading-box"><div className="spinner" /></div>;
  if (error)   return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-outline" onClick={() => nav("/student")}>← Back to Dashboard</button>
    </div>
  );

  if (submitted) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Exam Submitted!</h2>
      <p style={{ color: "var(--text2)", marginBottom: 24 }}>
        Your answers have been recorded. Results will be published by your teacher.
      </p>
      <button className="btn btn-primary" onClick={() => nav("/student/results")}>View My Results</button>
    </div>
  );

  const q = questions[current];
  const ans = answers[q._id] || {};

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div className="exam-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{examData?.title}</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>{examData?.subject} · Q{current + 1}/{questions.length} · {answered}/{questions.length} answered</div>
        </div>
        <div className={`timer ${isLow ? "danger" : ""}`}>⏱ {timerDisplay}</div>
        <button className="btn btn-primary" onClick={() => {
          if (window.confirm(`Submit exam? You have answered ${answered}/${questions.length} questions.`)) submitExam();
        }} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Exam"}
        </button>
      </div>

      <div className="exam-body">
        {/* Progress bar */}
        <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ width: `${((current + 1) / questions.length) * 100}%`, height: "100%", background: "var(--primary)", transition: "width .3s" }} />
        </div>

        {/* Question navigator */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          {questions.map((qx, i) => {
            const a = answers[qx._id];
            const done = a?.chosenOptionValue || a?.textAnswer;
            return (
              <button key={i} onClick={() => setCurrent(i)}
                style={{
                  width: 32, height: 32, border: "2px solid", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: i === current ? "var(--primary)" : done ? "#dcfce7" : "white",
                  color:      i === current ? "white" : done ? "#15803d" : "var(--text2)",
                  borderColor:i === current ? "var(--primary)" : done ? "#86efac" : "var(--border)",
                }}>
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <div className="question-card">
          <div className="question-num">Question {current + 1} of {questions.length} · {q.type?.toUpperCase()} · {q.marks} mark{q.marks > 1 ? "s" : ""}</div>
          <div className="question-text">{q.text}</div>

          {q.type === "mcq" && (
            <div className="option-list">
              {q.options.map((opt, i) => (
                <div key={i} className={`option-item ${ans.chosenOptionValue === opt ? "selected" : ""}`}
                  onClick={() => setMCQ(q._id, i, opt)}>
                  <div className="option-radio" />
                  <span style={{ fontSize: 14 }}>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {q.type === "saq" && (
            <textarea className="form-textarea" style={{ minHeight: 120 }}
              placeholder="Type your answer here…"
              value={ans.textAnswer || ""}
              onChange={e => setSAQ(q._id, e.target.value)}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button className="btn btn-outline" disabled={current === 0} onClick={() => setCurrent(p => p - 1)}>← Previous</button>
          {current < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrent(p => p + 1)}>Next →</button>
          ) : (
            <button className="btn btn-success" onClick={() => {
              if (window.confirm(`Submit exam? You have answered ${answered}/${questions.length} questions.`)) submitExam();
            }} disabled={submitting}>
              {submitting ? "Submitting…" : "Finish & Submit ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
