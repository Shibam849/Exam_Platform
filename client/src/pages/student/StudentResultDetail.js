import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";

export default function StudentResultDetail() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [sub,       setSub]       = useState(null);
  const [feedback,  setFeedback]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [fbLoading, setFbLoading] = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    api.get(`/student/results/${id}`)
      .then(r => {
        setSub(r.data);
        return api.get(`/ai/feedback/${id}`).catch(() => null);
      })
      .then(fb => { if (fb?.data?.overallFeedback) setFeedback(fb.data); })
      .catch(err => setError(err.response?.data?.message || "Failed to load result"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-box"><div className="spinner" /></div>;
  if (error)   return (
    <div style={{ maxWidth: 480, margin: "40px auto" }}>
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-outline" onClick={() => nav("/student/results")}>← Back</button>
    </div>
  );

  const totalMarks = sub.exam?.totalMarks || 0;
  const pct = totalMarks > 0 ? Math.round((sub.totalMarks / totalMarks) * 100) : 0;
  const grade = pct >= 80 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "F";
  const gradeColor = pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--primary)" : pct >= 40 ? "var(--warning)" : "var(--danger)";

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => nav("/student/results")}>← Back</button>
          <div>
            <h1>Result: {sub.exam?.title}</h1>
            <p>{sub.exam?.subject}</p>
          </div>
        </div>
      </div>

      {/* Score card */}
      <div className="card" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: gradeColor }}>{grade}</div>
          <div style={{ fontSize: 13, color: "var(--text3)" }}>Grade</div>
        </div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "var(--text1)" }}>{sub.totalMarks}</div>
          <div style={{ fontSize: 14, color: "var(--text3)" }}>out of {totalMarks || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 800, color: gradeColor }}>{totalMarks > 0 ? pct : "—"}%</div>
          <div style={{ fontSize: 14, color: "var(--text3)" }}>Percentage</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text2)" }}>
          <div>📅 Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}</div>
          <div>📝 Questions: {sub.answers.length}</div>
        </div>
      </div>

      {/* AI Feedback */}
      {feedback?.overallFeedback ? (
        <div className="ai-card" style={{ marginBottom: 20 }}>
          <div className="ai-card-header">
            <h3>🤖 AI Performance Feedback</h3>
            {feedback.generatedAt && (
              <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 12 }}>
                {new Date(feedback.generatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="ai-card-body">
            <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>{feedback.overallFeedback}</p>

            {feedback.strengths?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8 }}>✅ Your Strengths</div>
                <div className="ai-pill-list">
                  {feedback.strengths.map((s, i) => <span key={i} className="ai-pill strength">{s}</span>)}
                </div>
              </div>
            )}

            {feedback.weaknesses?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8 }}>⚠️ Areas to Improve</div>
                <div className="ai-pill-list">
                  {feedback.weaknesses.map((w, i) => <span key={i} className="ai-pill weakness">{w}</span>)}
                </div>
              </div>
            )}

            {feedback.suggestions?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8 }}>💡 Study Suggestions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {feedback.suggestions.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "#dbeafe", borderRadius: 8, fontSize: 13, color: "#1e40af" }}>
                      <span>💡</span><span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 20, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>AI feedback not yet generated for this result.</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 4 }}>Your teacher will generate personalised AI feedback soon.</div>
        </div>
      )}

      {/* Answer detail */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Answer Review</div>
        {sub.answers.map((a, i) => {
          const q = a.question;
          const earned = (a.autoMarks || 0) + (a.manualMarks || 0);
          return (
            <div key={i} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>
                    Q{i + 1} · {q?.type?.toUpperCase()} · {q?.difficulty}
                  </div>
                  <div style={{ fontWeight: 500, marginBottom: 10 }}>{q?.text}</div>

                  {q?.type === "mcq" && (
                    <div style={{ fontSize: 13 }}>
                      <div>Your answer: <strong style={{ color: earned > 0 ? "var(--success)" : "var(--danger)" }}>
                        {a.chosenOptionValue || "Not answered"}
                      </strong></div>
                      <div style={{ color: "var(--success)", marginTop: 2 }}>
                        Correct: <strong>{q.options?.[q.correctOption]}</strong>
                      </div>
                    </div>
                  )}

                  {q?.type === "saq" && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>Your answer:</div>
                      <div style={{ background: "var(--bg)", padding: "10px 12px", borderRadius: 7, fontSize: 13, border: "1px solid var(--border)" }}>
                        {a.textAnswer || <em style={{ color: "var(--text3)" }}>No answer</em>}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginLeft: 16, textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: earned > 0 ? "var(--success)" : "var(--danger)" }}>{earned}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>/{q?.marks || 1}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
