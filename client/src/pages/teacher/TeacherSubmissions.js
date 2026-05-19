import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

export default function TeacherSubmissions() {
  const [subs,    setSubs]    = useState([]);
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState("");
  const [toast,   setToast]   = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3500); };

  const load = useCallback(() => {
    setLoading(true);
    const p = examFilter ? `?examId=${examFilter}` : "";
    Promise.all([
      api.get(`/teacher/submissions${p}`),
      api.get("/exams/my"),
    ]).then(([s, e]) => {
      setSubs(s.data);
      setExams(e.data);
    }).finally(() => setLoading(false));
  }, [examFilter]);

  useEffect(() => { load(); }, [load]);

  const handleBulkFeedback = async () => {
    if (!examFilter) { showToast("Select an exam first"); return; }
    setBulkLoading(true);
    try {
      const r = await api.post(`/ai/feedback/bulk/${examFilter}`);
      showToast(r.data.message);
    } catch (ex) {
      showToast(ex.response?.data?.message || "AI feedback failed");
    } finally { setBulkLoading(false); }
  };

  return (
    <>
      {toast && <div className="alert alert-info" style={{ position: "fixed", top: 16, right: 16, zIndex: 999, minWidth: 260 }}>{toast}</div>}

      <div className="page-header"><h1>Student Submissions</h1><p>Review, grade and publish results</p></div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 8 }}>
          <select className="form-select" style={{ width: 220 }} value={examFilter}
            onChange={e => setExamFilter(e.target.value)}>
            <option value="">All Exams</option>
            {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
          {examFilter && (
            <button className="btn btn-outline btn-sm" onClick={handleBulkFeedback} disabled={bulkLoading}>
              {bulkLoading ? "Generating…" : "🤖 Bulk AI Feedback"}
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text3)" }}>{subs.length} submission{subs.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? <div className="loading-box"><div className="spinner" /></div> :
         subs.length === 0 ? (
           <div className="empty-state"><h3>No Submissions</h3><p>No submissions found for the selected filter.</p></div>
         ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>AI</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s._id}>
                    <td><strong>{s.student?.name || "—"}</strong><br /><span style={{ fontSize: 11, color: "var(--text3)" }}>{s.student?.email}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text3)" }}>{s.student?.rollNo || "—"}</td>
                    <td>{s.exam?.title || "—"}</td>
                    <td><strong>{s.totalMarks}</strong>{s.exam?.totalMarks ? <span style={{ color: "var(--text3)", fontSize: 11 }}> / {s.exam.totalMarks}</span> : ""}</td>
                    <td style={{ fontSize: 12, color: "var(--text3)" }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—"}</td>
                    <td>
                      {s.published
                        ? <span className="badge badge-green">Published</span>
                        : s.graded
                          ? <span className="badge badge-yellow">Graded</span>
                          : <span className="badge badge-gray">Pending</span>
                      }
                    </td>
                    <td>
                      {s.aiFeedback
                        ? <span className="badge badge-blue">✓ AI</span>
                        : <span style={{ fontSize: 11, color: "var(--text3)" }}>—</span>
                      }
                    </td>
                    <td>
                      <Link to={`/teacher/grade/${s._id}`} className="btn btn-outline btn-sm">
                        {s.published ? "View" : "Grade"}
                      </Link>
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
