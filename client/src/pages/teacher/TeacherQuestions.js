import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";

const EMPTY = { subject: "", type: "mcq", text: "", options: ["", "", "", ""], correctOption: 0, marks: 1, difficulty: "medium" };

function QuestionModal({ q, onClose, onSaved }) {
  const [form, setForm] = useState(q ? { ...q, options: q.options?.length ? [...q.options] : ["","","",""] } : { ...EMPTY });
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const setOpt = (i) => (e) => setForm(p => { const opts = [...p.options]; opts[i] = e.target.value; return { ...p, options: opts }; });

  const submit = async (ev) => {
    ev.preventDefault(); setBusy(true); setErr("");
    try {
      const payload = { ...form, marks: Number(form.marks), correctOption: Number(form.correctOption) };
      if (q) await api.put(`/questions/${q._id}`, payload);
      else   await api.post("/questions", payload);
      onSaved();
    } catch (ex) { setErr(ex.response?.data?.message || "Error"); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{q ? "Edit Question" : "Add Question"}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input className="form-input" required value={form.subject} onChange={set("subject")} placeholder="e.g. Data Structures" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={set("type")}>
                <option value="mcq">MCQ</option>
                <option value="saq">Short Answer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea className="form-textarea" required value={form.text} onChange={set("text")} placeholder="Enter your question here…" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={form.difficulty} onChange={set("difficulty")}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Marks</label>
              <input className="form-input" type="number" min={1} value={form.marks} onChange={set("marks")} />
            </div>
          </div>

          {form.type === "mcq" && (
            <div className="form-group">
              <label className="form-label">Options (select correct)</label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center" style={{ marginBottom: 8 }}>
                  <input type="radio" name="correct" checked={Number(form.correctOption) === i}
                    onChange={() => setForm(p => ({ ...p, correctOption: i }))} />
                  <input className="form-input" value={opt} onChange={setOpt(i)} placeholder={`Option ${i + 1}`} required />
                </div>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save Question"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeacherQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [filters,   setFilters]   = useState({ subject: "", type: "", difficulty: "" });
  const [toast,     setToast]     = useState("");

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filters.subject)    p.set("subject",    filters.subject);
    if (filters.type)       p.set("type",       filters.type);
    if (filters.difficulty) p.set("difficulty", filters.difficulty);
    api.get(`/questions?${p}`).then(r => setQuestions(r.data)).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (q) => {
    if (!window.confirm("Delete this question?")) return;
    await api.delete(`/questions/${q._id}`);
    showToast("Question deleted");
    load();
  };

  const diffBadge = (d) => {
    const map = { easy: "badge-green", medium: "badge-yellow", hard: "badge-red" };
    return <span className={`badge ${map[d] || "badge-gray"}`}>{d}</span>;
  };

  return (
    <>
      {toast && <div className="alert alert-success" style={{ position: "fixed", top: 16, right: 16, zIndex: 999, minWidth: 220 }}>{toast}</div>}

      <div className="page-header">
        <h1>Question Bank</h1>
        <p>Create and manage your questions</p>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 8 }}>
          <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
            <input className="form-input" style={{ width: 160 }} placeholder="Filter by subject"
              value={filters.subject} onChange={e => setFilters(p => ({ ...p, subject: e.target.value }))} />
            <select className="form-select" style={{ width: 120 }} value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
              <option value="">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="saq">SAQ</option>
            </select>
            <select className="form-select" style={{ width: 130 }} value={filters.difficulty} onChange={e => setFilters(p => ({ ...p, difficulty: e.target.value }))}>
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setModal("create")}>+ Add Question</button>
        </div>

        <div style={{ marginBottom: 12, color: "var(--text3)", fontSize: 13 }}>{questions.length} questions</div>

        {loading ? (
          <div className="loading-box"><div className="spinner" /></div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <h3>No Questions Yet</h3>
            <p>Add questions to build your question bank.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Question</th><th>Subject</th><th>Type</th><th>Difficulty</th><th>Marks</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q._id}>
                    <td style={{ color: "var(--text3)" }}>{i + 1}</td>
                    <td style={{ maxWidth: 300 }}>
                      <span className="truncate" style={{ display: "block" }} title={q.text}>{q.text}</span>
                    </td>
                    <td>{q.subject}</td>
                    <td><span className={`badge ${q.type === "mcq" ? "badge-blue" : "badge-purple"}`}>{q.type.toUpperCase()}</span></td>
                    <td>{diffBadge(q.difficulty)}</td>
                    <td>{q.marks}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => setModal(q)}>Edit</button>
                        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(q)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <QuestionModal
          q={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); showToast("Question saved!"); }}
        />
      )}
    </>
  );
}
