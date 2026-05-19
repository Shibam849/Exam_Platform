import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/teacher/stats").then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-box"><div className="spinner" /></div>;

  const cards = [
    { label: "Exam Created",       value: stats.totalExams,       color: "blue" },
    { label: "Total Submissions", value: stats.totalSubmissions, color: "yellow" },
    { label: "Published",      value: stats.published,        color: "green" },
    { label: "Pending Review", value: stats.pending,          color: "red" },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Welcome, {user?.name} 👋</h1>
        <p>Here's your teaching overview</p>
      </div>

      <div className="stats-grid">
        {cards.map(c => (
          <div key={c.label} className={`stat-card ${c.color}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      {stats.perExamStats.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Average Score per Exam</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.perExamStats} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="examTitle" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="avgMarks" fill="#4f46e5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Quick Actions</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/teacher/questions" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
              ➕ Add Question to Bank
            </Link>
            <Link to="/teacher/exams" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
              📝 Create New Exam
            </Link>
            <Link to="/teacher/submissions" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
              📊 Grade Submissions
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Exam Summary</div>
          {stats.perExamStats.length === 0 ? (
            <p style={{ color: "var(--text3)" }}>No published results yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Exam</th><th>Count</th><th>Avg</th><th>High</th></tr></thead>
                <tbody>
                  {stats.perExamStats.slice(0, 5).map(e => (
                    <tr key={e._id}>
                      <td style={{ maxWidth: 120 }} className="truncate">{e.examTitle}</td>
                      <td>{e.count}</td>
                      <td><span className="badge badge-blue">{e.avgMarks}</span></td>
                      <td><strong>{e.maxMarks}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
