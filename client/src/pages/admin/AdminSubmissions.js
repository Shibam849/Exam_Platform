import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";

export default function AdminSubmissions() {
  const [data,    setData]    = useState({ submissions: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [filter,  setFilter]  = useState(""); // "" | "true" | "false"

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filter !== "") params.set("published", filter);
    api.get(`/admin/submissions?${params}`).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <h1>All Submissions</h1>
        <p>Monitor every student submission across all exams</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex gap-2">
            {["", "true", "false"].map(v => (
              <button key={v} className={`btn btn-sm ${filter === v ? "btn-primary" : "btn-outline"}`}
                onClick={() => { setFilter(v); setPage(1); }}>
                {v === "" ? "All" : v === "true" ? "Published" : "Pending"}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "var(--text3)" }}>Total: {data.total}</span>
        </div>

        {loading ? (
          <div className="loading-box"><div className="spinner" /></div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Total</th>
                    <th>%</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.submissions.map(s => {
                    const total = s.exam?.totalMarks || 0;
                    const pct   = total > 0 ? Math.round((s.totalMarks / total) * 100) : 0;
                    return (
                      <tr key={s._id}>
                        <td><strong>{s.student?.name || "—"}</strong></td>
                        <td style={{ color: "var(--text3)", fontSize: 12 }}>{s.student?.rollNo || "—"}</td>
                        <td>{s.exam?.title || "—"}</td>
                        <td style={{ color: "var(--text2)" }}>{s.exam?.subject || "—"}</td>
                        <td><strong>{s.totalMarks}</strong></td>
                        <td style={{ color: "var(--text3)" }}>{total || "—"}</td>
                        <td>
                          <span className={`badge ${pct >= 60 ? "badge-green" : pct >= 40 ? "badge-yellow" : "badge-red"}`}>
                            {total > 0 ? `${pct}%` : "—"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text3)", fontSize: 12 }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—"}</td>
                        <td>
                          <span className={`badge ${s.published ? "badge-green" : "badge-yellow"}`}>
                            {s.published ? "Published" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {data.submissions.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>No submissions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {data.pages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: data.pages }, (_, i) => (
                  <button key={i + 1} className={`page-btn ${page === i + 1 ? "active" : ""}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="page-btn" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
