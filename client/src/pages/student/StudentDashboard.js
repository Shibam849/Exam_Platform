import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function StudentDashboard() {
  const { user }  = useAuth();
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/exams/available").then(r => setExams(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusStyle = (status) => {
    if (status === "live")     return { badge: "badge-green",  label: "🟢 Live" };
    if (status === "upcoming") return { badge: "badge-yellow", label: "⏳ Upcoming" };
    return                            { badge: "badge-gray",   label: "🔒 Closed" };
  };

  return (
    <>
      <div className="page-header">
        <h1>Welcome, {user?.name} 👋</h1>
        {user?.rollNo && <p>Roll No: {user.rollNo} · {user?.department} · {user?.batch}</p>}
      </div>

      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Available Exams</h2>
      </div>

      {loading ? (
        <div className="loading-box"><div className="spinner" /></div>
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h3>No Exams Available</h3>
          <p>Check back later for upcoming exams.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 16 }}>
          {exams.map(e => {
            const { badge, label } = statusStyle(e.status);
            const canTake = e.status === "live" && !e.submitted;
            return (
              <div key={e._id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="flex justify-between items-center">
                  <span className={`badge ${badge}`}>{label}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{e.durationMinutes} min</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{e.title}</div>
                  <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 2 }}>{e.subject}</div>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text3)" }}>
                  <span>📝 {e.totalQuestions} questions</span>
                  <span>🏆 {e.totalMarks} marks</span>
                  {e.teacherName && <span>👤 {e.teacherName}</span>}
                </div>
                {e.startAt && (
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>
                    🕐 {new Date(e.startAt).toLocaleString()}
                    {e.endAt && <> → {new Date(e.endAt).toLocaleString()}</>}
                  </div>
                )}
                {e.instructions && (
                  <p style={{ fontSize: 12, color: "var(--text2)", background: "var(--bg)", borderRadius: 6, padding: "8px 10px" }}>
                    {e.instructions.slice(0, 100)}{e.instructions.length > 100 ? "…" : ""}
                  </p>
                )}
                <div style={{ marginTop: "auto" }}>
                  {e.submitted ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <span className="badge badge-blue" style={{ padding: "6px 12px" }}>✅ Submitted</span>
                      <Link to="/student/results" className="btn btn-outline btn-sm">View Results</Link>
                    </div>
                  ) : canTake ? (
                    <Link to={`/exam/${e._id}`} className="btn btn-primary w-full" style={{ justifyContent: "center" }}>
                      Start Exam →
                    </Link>
                  ) : e.status === "upcoming" ? (
                    <button className="btn btn-outline w-full" disabled style={{ justifyContent: "center" }}>
                      Not Started Yet
                    </button>
                  ) : (
                    <button className="btn btn-outline w-full" disabled style={{ justifyContent: "center" }}>
                      Exam Closed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
