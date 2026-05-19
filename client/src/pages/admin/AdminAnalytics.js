import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import api from "../../utils/api";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-box"><div className="spinner" /></div>;
  if (!data)   return <div className="alert alert-error">Failed to load analytics</div>;

  const { overview, perExam, topStudents, recentRegistrations, scoreDistribution } = data;

  const overviewCards = [
    { label: "Total Students",    value: overview.totalStudents,      color: "blue" },
    { label: "Total Teachers",    value: overview.totalTeachers,      color: "green" },
    { label: "Total Exams",       value: overview.totalExams,         color: "yellow" },
    { label: "Total Questions",   value: overview.totalQuestions,     color: "cyan" },
    { label: "Submissions",       value: overview.totalSubmissions,   color: "red" },
    { label: "Published Results", value: overview.publishedSubmissions, color: "green" },
  ];

  // Role distribution for pie chart
  const rolePie = [
    { name: "Students", value: overview.totalStudents },
    { name: "Teachers", value: overview.totalTeachers },
    { name: "Admins",   value: 1 },
  ];

  // Score distribution for bar chart
  const scoreData = (scoreDistribution || []).map(b => ({
    range: `${b._id}–${b._id + 9}`,
    count: b.count,
  }));

  return (
    <>
      <div className="page-header">
        <h1>Platform Analytics</h1>
        <p>Comprehensive insights into exam performance and platform usage</p>
      </div>

      {/* Overview cards */}
      <div className="stats-grid">
        {overviewCards.map(c => (
          <div key={c.label} className={`stat-card ${c.color}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Per-exam avg marks */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Average Score by Exam</div>
          {perExam.length === 0 ? (
            <p style={{ color: "var(--text3)", textAlign: "center", padding: 24 }}>No published results yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perExam} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="examTitle" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} marks`, "Avg Score"]} />
                <Bar dataKey="avgMarks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User role distribution */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>User Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={rolePie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {rolePie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score distribution + Registrations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Score Distribution</div>
          {scoreData.length === 0 ? (
            <p style={{ color: "var(--text3)", textAlign: "center", padding: 24 }}>No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>New Registrations (Last 7 Days)</div>
          {recentRegistrations.length === 0 ? (
            <p style={{ color: "var(--text3)", textAlign: "center", padding: 24 }}>No registrations</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={recentRegistrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top students */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>🏆 Top Students by Average Score</div>
        {topStudents.length === 0 ? (
          <p style={{ color: "var(--text3)", textAlign: "center", padding: 24 }}>No data</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roll No</th>
                  <th>Exams Taken</th>
                  <th>Avg Score</th>
                  <th>Total Marks</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((s, i) => (
                  <tr key={s._id}>
                    <td><strong style={{ color: i < 3 ? "#f59e0b" : "inherit" }}>{i + 1}</strong></td>
                    <td>{s.name}</td>
                    <td style={{ color: "var(--text2)" }}>{s.email}</td>
                    <td style={{ color: "var(--text3)" }}>{s.rollNo || "—"}</td>
                    <td>{s.examCount}</td>
                    <td><span className="badge badge-blue">{s.avgMarks}</span></td>
                    <td><strong>{s.totalMarks}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-exam detail table */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Exam-wise Performance Summary</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Exam</th><th>Subject</th><th>Submissions</th><th>Avg Score</th><th>Highest</th><th>Lowest</th></tr>
            </thead>
            <tbody>
              {perExam.map((e) => (
                <tr key={e._id}>
                  <td><strong>{e.examTitle}</strong></td>
                  <td>{e.subject}</td>
                  <td>{e.count}</td>
                  <td><span className="badge badge-blue">{e.avgMarks}</span></td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>{e.maxMarks}</td>
                  <td style={{ color: "var(--danger)",  fontWeight: 600 }}>{e.minMarks}</td>
                </tr>
              ))}
              {perExam.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text3)", padding: 24 }}>No published exam data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
