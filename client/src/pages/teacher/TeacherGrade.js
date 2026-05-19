import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";

export default function TeacherGrade() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [sub,     setSub]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualMarks, setManualMarks] = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [toast,   setToast]   = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "" }), 4000); };

  useEffect(() => {
    // Load all submissions and find the one matching our ID
    api.get("/teacher/submissions").then(r => {
      const found = r.data.find(s => s._id === id);
      if (!found) { setLoading(false); return; }
      setSub(found);
      setManualMarks(found.answers.map(a => a.manualMarks || 0));
      if (found.aiFeedback) {
        setFeedback({
          overallFeedback: found.aiFeedback,
          strengths:       found.aiStrengths   || [],
          weaknesses:      found.aiWeaknesses  || [],
          suggestions:     found.aiSuggestions || [],
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handlePublish = async () => {
    setSaving(true);
    try {
      await api.post(`/teacher/submissions/${id}/publish`, {
        answers: manualMarks.map(m => ({ manualMarks: m })),
      });
      showToast("Marks published successfully!");
      // Reload submission
      const r   = await api.get("/teacher/submissions");
      const found = r.data.find(s => s._id === id);
      if (found) {
        setSub(found);
        setManualMarks(found.answers.map(a => a.manualMarks || 0));
      }
    } catch (ex) {
      showToast(ex.response?.data?.message || "Error publishing marks", "error");
    } finally { setSaving(false); }
  };

  const handleAiFeedback = async () => {
    setAiLoading(true);
    try {
      const r = await api.post(`/ai/feedback/${id}`);
      setFeedback(r.data.feedback);
      showToast("AI feedback generated!");
    } catch (ex) { showToast(ex.response?.data?.message || "AI feedback failed", "error"); }
    finally { setAiLoading(false); }
  };

  if (loading) return <div className="loading-box"><div className="spinner" /></div>;
  if (!sub)    return <div className="alert alert-error">Submission not found</div>;

  const totalAuto   = sub.answers.reduce((s, a) => s + (a.autoMarks || 0), 0);
  const totalManual = manualMarks.reduce((s, m) => s + Number(m), 0);
  const grandTotal  = totalAuto + totalManual;

  return (
    <>
      {toast.msg && (
        <div className={`alert alert-${toast.type === "error" ? "error" : "success"}`}
          style={{ position: "fixed", top: 16, right: 16, zIndex: 999, minWidth: 260 }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => nav("/teacher/submissions")}>← Back</button>
          <div>
            <h1>Grade Submission</h1>
            <p>{sub.student?.name} — {sub.exam?.title}</p>
          </div>
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Student",   value: sub.student?.name },
          { label: "Roll No",   value: sub.student?.rollNo || "—" },
          { label: "Exam",      value: sub.exam?.title },
          { label: "Submitted", value: sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Score summary */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div className="flex gap-4 items-center">
          <div>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>Auto Marks</span>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{totalAuto}</div>
          </div>
          <div style={{ fontSize: 20, color: "var(--text3)" }}>+</div>
          <div>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>Manual Marks</span>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{totalManual}</div>
          </div>
          <div style={{ fontSize: 20, color: "var(--text3)" }}>=</div>
          <div>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>Grand Total</span>
            <div style={{ fontWeight: 700, fontSize: 28, color: "var(--primary)" }}>{grandTotal}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {!sub.published && (
              <button className="btn btn-primary" onClick={handlePublish} disabled={saving}>
                {saving ? "Publishing…" : "✅ Publish Marks"}
              </button>
            )}
            {sub.published && !feedback && (
              <button className="btn btn-outline" onClick={handleAiFeedback} disabled={aiLoading}>
                {aiLoading ? "Generating…" : "🤖 Generate AI Feedback"}
              </button>
            )}
            {sub.published && <span className="badge badge-green" style={{ alignSelf: "center" }}>Published</span>}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Answers</div>
        {sub.answers.map((ans, i) => {
          const q = ans.question;
          return (
            <div key={i} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>
                    Q{i + 1} · {q?.type?.toUpperCase()} · {q?.difficulty} · {q?.marks} mark{q?.marks > 1 ? "s" : ""}
                  </div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>{q?.text}</div>

                  {q?.type === "mcq" && (
                    <div style={{ fontSize: 13 }}>
                      <div style={{ color: "var(--text3)" }}>Student answered: <strong style={{ color: ans.chosenOptionValue ? "var(--text1)" : "var(--danger)" }}>{ans.chosenOptionValue || "Not answered"}</strong></div>
                      <div style={{ color: "var(--success)", marginTop: 2 }}>Correct: <strong>{q.options?.[q.correctOption]}</strong></div>
                      <div style={{ marginTop: 4 }}>
                        <span className={`badge ${ans.autoMarks > 0 ? "badge-green" : "badge-red"}`}>
                          {ans.autoMarks > 0 ? "✓ Correct" : "✗ Incorrect"} — {ans.autoMarks}/{q.marks} marks
                        </span>
                      </div>
                    </div>
                  )}

                  {q?.type === "saq" && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>Student answer:</div>
                      <div style={{ background: "var(--bg)", padding: "10px 12px", borderRadius: 7, fontSize: 13, border: "1px solid var(--border)", minHeight: 50 }}>
                        {ans.textAnswer || <em style={{ color: "var(--text3)" }}>No answer provided</em>}
                      </div>
                    </div>
                  )}
                </div>

                {q?.type === "saq" && (
                  <div style={{ marginLeft: 16, minWidth: 120 }}>
                    <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 4 }}>Manual marks (/{q.marks})</label>
                    <input
                      className="form-input"
                      type="number" min={0} max={q.marks} step={0.5}
                      value={manualMarks[i]}
                      disabled={sub.published}
                      onChange={e => {
                        const arr = [...manualMarks];
                        arr[i] = Number(e.target.value);
                        setManualMarks(arr);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Feedback */}
      {feedback && (
        <div className="ai-card" style={{ marginBottom: 20 }}>
          <div className="ai-card-header">
            <h3>🤖 AI Performance Feedback for {sub.student?.name}</h3>
          </div>
          <div className="ai-card-body">
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{feedback.overallFeedback}</p>
            {feedback.strengths?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>✅ Strengths</div>
                <div className="ai-pill-list">{feedback.strengths.map((s, i) => <span key={i} className="ai-pill strength">{s}</span>)}</div>
              </div>
            )}
            {feedback.weaknesses?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>⚠️ Areas to Improve</div>
                <div className="ai-pill-list">{feedback.weaknesses.map((w, i) => <span key={i} className="ai-pill weakness">{w}</span>)}</div>
              </div>
            )}
            {feedback.suggestions?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>💡 Suggestions</div>
                <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: "var(--text2)" }}>
                  {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
