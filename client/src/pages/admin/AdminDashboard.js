import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/admin/summary"), api.get("/admin/analytics")])
      .then(([s, a]) => {
        setSummary(s.data);
        setRecent(a.data.recentSubmissions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-box"><div className="spinner" /></div>;

  const cards = [
    { label: "Students",    value: summary?.students,    color: "blue",   link: "/admin/users?role=student" },
    { label: "Teachers",    value: summary?.teachers,    color: "green",  link: "/admin/users?role=teacher" },
    { label: "Exams",       value: summary?.exams,       color: "yellow", link: "/admin/exams" },
    { label: "Questions",   value: summary?.questions,   color: "cyan",   link: "#" },
    { label: "Submissions", value: summary?.submissions, color: "red",    link: "/admin/submissions" },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and quick actions</p>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <Link to={c.link} key={c.label} style={{ textDecoration: "none" }}>
            <div className={`stat-card ${c.color}`}>
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">{c.value ?? "—"}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Submissions</span>
          <Link to="/admin/submissions" className="btn btn-outline btn-sm">View All</Link>
        </div>
        {recent.length === 0 ? (
          <p style={{ color: "var(--text3)", textAlign: "center", padding: "24px 0" }}>No submissions yet</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s._id}>
                    <td>{s.student?.name || "—"}</td>
                    <td>{s.exam?.title || "—"}</td>
                    <td><strong>{s.totalMarks}</strong></td>
                    <td style={{ color: "var(--text3)" }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <span className={`badge ${s.published ? "badge-green" : "badge-yellow"}`}>
                        {s.published ? "Published" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
