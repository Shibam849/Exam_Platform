import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";

export default function AdminExams() {
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    api.get("/exams/admin/all").then(r => setExams(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePublish = async (exam) => {
    await api.patch(`/exams/admin/${exam._id}/publish`);
    showToast(`Exam ${exam.isPublished ? "unpublished" : "published"}`);
    load();
  };

  const deleteExam = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}"? All submissions will be removed.`)) return;
    await api.delete(`/exams/admin/${exam._id}`);
    showToast("Exam deleted");
    load();
  };

  const statusBadge = (e) => {
    const now = new Date();
    if (!e.isPublished) return <span className="badge badge-gray">Draft</span>;
    if (e.endAt && new Date(e.endAt) < now) return <span className="badge badge-red">Closed</span>;
    if (e.startAt && new Date(e.startAt) > now) return <span className="badge badge-yellow">Upcoming</span>;
    return <span className="badge badge-green">Live</span>;
  };

  return (
    <>
      {toast && <div className="alert alert-success" style={{ position: "fixed", top: 16, right: 16, zIndex: 999, minWidth: 220 }}>{toast}</div>}

      <div className="page-header">
        <h1>Exam Management</h1>
        <p>View and manage all exams on the platform</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-box"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e._id}>
                    <td><strong>{e.title}</strong></td>
                    <td>{e.subject}</td>
                    <td style={{ color: "var(--text2)" }}>{e.createdBy?.name || "—"}</td>
                    <td>{(e.questions || []).length}</td>
                    <td>{e.durationMinutes} min</td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{e.startAt ? new Date(e.startAt).toLocaleString() : "—"}</td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{e.endAt   ? new Date(e.endAt).toLocaleString()   : "—"}</td>
                    <td>{statusBadge(e)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className={`btn btn-sm ${e.isPublished ? "btn-warning" : "btn-success"}`} onClick={() => togglePublish(e)}>
                          {e.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteExam(e)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>No exams found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
