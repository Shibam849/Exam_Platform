import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";

function FeedbackModal({ sub, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">AI Feedback — {sub.student?.name}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{sub.exam?.title} · {sub.exam?.subject}</span>
          <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 600 }}>Score: {sub.totalMarks}</span>
          {sub.aiFeedbackGeneratedAt && (
            <span style={{ marginLeft: 12, fontSize: 11, color: "var(--text3)" }}>
              Generated: {new Date(sub.aiFeedbackGeneratedAt).toLocaleString()}
            </span>
          )}
        </div>

        <div className="ai-card">
          <div className="ai-card-header">
            <h3>🤖 AI Performance Analysis</h3>
          </div>
          <div className="ai-card-body">
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{sub.aiFeedback}</p>

            {sub.aiStrengths?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>✅ Strengths</div>
                <div className="ai-pill-list">
                  {sub.aiStrengths.map((s, i) => <span key={i} className="ai-pill strength">{s}</span>)}
                </div>
              </div>
            )}

            {sub.aiWeaknesses?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>⚠️ Areas to Improve</div>
                <div className="ai-pill-list">
                  {sub.aiWeaknesses.map((w, i) => <span key={i} className="ai-pill weakness">{w}</span>)}
                </div>
              </div>
            )}

            {sub.aiSuggestions?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>💡 Suggestions</div>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: "var(--text2)", lineHeight: 1.8 }}>
                  {sub.aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAiFeedbacks() {
  const [subs,    setSubs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/ai-feedbacks").then(r => setSubs(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <h1>AI Feedback Records</h1>
        <p>All AI-generated performance feedback stored in the platform</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-box"><div className="spinner" /></div>
        ) : subs.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            <h3>No AI Feedbacks Yet</h3>
            <p>Teachers can generate AI feedback from the Submissions page after publishing marks.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Strengths</th>
                  <th>Feedback Preview</th>
                  <th>Generated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s._id}>
                    <td><strong>{s.student?.name || "—"}</strong></td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{s.student?.rollNo || "—"}</td>
                    <td>{s.exam?.title || "—"}</td>
                    <td>{s.exam?.subject || "—"}</td>
                    <td><strong>{s.totalMarks}</strong></td>
                    <td>
                      <div className="ai-pill-list" style={{ maxWidth: 180 }}>
                        {(s.aiStrengths || []).slice(0, 2).map((st, i) => (
                          <span key={i} className="ai-pill strength" style={{ fontSize: 10 }}>{st}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <span className="truncate" style={{ display: "block", color: "var(--text2)", fontSize: 12 }}>
                        {s.aiFeedback?.slice(0, 80)}…
                      </span>
                    </td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>
                      {s.aiFeedbackGeneratedAt ? new Date(s.aiFeedbackGeneratedAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setModal(s)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <FeedbackModal sub={modal} onClose={() => setModal(null)} />}
    </>
  );
}
