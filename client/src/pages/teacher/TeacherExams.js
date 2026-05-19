import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";

function CreateExamModal({ onClose, onSaved }) {
  const [step,  setStep]  = useState(1); // 1=details 2=questions
  const [form,  setForm]  = useState({
    title: "", subject: "", durationMinutes: 60,
    startAt: "", endAt: "", instructions: "",
    randomizeQuestions: true, randomizeOptions: true,
    isPublished: false, mode: "manual",
    autoCounts: { easy: 0, medium: 0, hard: 0 },
  });
  const [questions, setQuestions] = useState([]);  // available
  const [selected,  setSelected]  = useState([]);  // chosen IDs
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState("");
  const [busy,      setBusy]      = useState(false);

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [k]: val }));
  };
  const setCount = (k) => (e) => setForm(p => ({ ...p, autoCounts: { ...p.autoCounts, [k]: Number(e.target.value) } }));

  const loadQuestions = useCallback(() => {
    if (!form.subject) return;
    setLoading(true);
    api.get(`/questions?subject=${form.subject}`).then(r => setQuestions(r.data)).finally(() => setLoading(false));
  }, [form.subject]);

  useEffect(() => { if (step === 2) loadQuestions(); }, [step, loadQuestions]);

  const toggleQuestion = (id) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        questionIds: form.mode === "manual" ? selected : undefined,
      };
      await api.post("/exams", payload);
      onSaved();
    } catch (ex) { setErr(ex.response?.data?.message || "Error"); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Create New Exam — Step {step}/2</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}

        {step === 1 && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Exam Title *</label>
                <input className="form-input" required value={form.title} onChange={set("title")} placeholder="Mid-term Exam" />
              </div>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input className="form-input" required value={form.subject} onChange={set("subject")} placeholder="Data Structures" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input className="form-input" type="number" min={5} value={form.durationMinutes} onChange={set("durationMinutes")} />
              </div>
              <div className="form-group">
                <label className="form-label">Mode</label>
                <select className="form-select" value={form.mode} onChange={set("mode")}>
                  <option value="manual">Manual (pick questions)</option>
                  <option value="auto">Auto (random by difficulty)</option>
                </select>
              </div>
            </div>
            {form.mode === "auto" && (
              <div className="form-row-3">
                {["easy","medium","hard"].map(d => (
                  <div className="form-group" key={d}>
                    <label className="form-label"># {d.charAt(0).toUpperCase()+d.slice(1)}</label>
                    <input className="form-input" type="number" min={0} value={form.autoCounts[d]} onChange={setCount(d)} />
                  </div>
                ))}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date & Time</label>
                <input className="form-input" type="datetime-local" value={form.startAt} onChange={set("startAt")} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time</label>
                <input className="form-input" type="datetime-local" value={form.endAt} onChange={set("endAt")} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Instructions</label>
              <textarea className="form-textarea" value={form.instructions} onChange={set("instructions")} placeholder="Enter exam instructions for students…" />
            </div>
            <div className="flex gap-4" style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.randomizeQuestions} onChange={set("randomizeQuestions")} /> Randomize question order
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.randomizeOptions} onChange={set("randomizeOptions")} /> Randomize MCQ options
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.isPublished} onChange={set("isPublished")} /> Publish immediately
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
              {form.mode === "auto" ? (
                <button className="btn btn-primary" onClick={submit} disabled={busy || !form.title || !form.subject}>
                  {busy ? "Creating…" : "Create Exam"}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!form.title || !form.subject}>
                  Next: Select Questions →
                </button>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>Subject: <strong>{form.subject}</strong> — Select questions for this exam</span>
              <span style={{ marginLeft: 16, fontSize: 13, color: "var(--primary)" }}>{selected.length} selected</span>
            </div>
            {loading ? (
              <div className="loading-box"><div className="spinner" /></div>
            ) : questions.length === 0 ? (
              <div className="alert alert-warning">No questions found for subject "<strong>{form.subject}</strong>". Please add questions first.</div>
            ) : (
              <div style={{ maxHeight: 380, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
                {questions.map(q => (
                  <div key={q._id} onClick={() => toggleQuestion(q._id)}
                    style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer",
                      background: selected.includes(q._id) ? "#eef2ff" : "white",
                      display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <input type="checkbox" readOnly checked={selected.includes(q._id)} style={{ marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{q.text}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                        {q.type.toUpperCase()} · {q.difficulty} · {q.marks} mark{q.marks > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={submit} disabled={busy || selected.length === 0}>
                {busy ? "Creating…" : `Create Exam (${selected.length} questions)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeacherExams() {
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [toast,   setToast]   = useState("");

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    api.get("/exams/my").then(r => setExams(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (e) => {
    if (!window.confirm(`Delete "${e.title}"?`)) return;
    await api.delete(`/exams/${e._id}`);
    showToast("Exam deleted"); load();
  };

  const togglePublish = async (e) => {
    await api.put(`/exams/${e._id}`, { isPublished: !e.isPublished });
    showToast(`Exam ${e.isPublished ? "unpublished" : "published"}`); load();
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
      <div className="page-header"><h1>My Exams</h1><p>Create and manage your exams</p></div>

      <div className="card">
        <div className="card-header">
          <span style={{ color: "var(--text3)", fontSize: 13 }}>{exams.length} exam{exams.length !== 1 ? "s" : ""}</span>
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Create Exam</button>
        </div>

        {loading ? <div className="loading-box"><div className="spinner" /></div> : (
          exams.length === 0 ? (
            <div className="empty-state"><h3>No Exams Yet</h3><p>Click "Create Exam" to get started.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Title</th><th>Subject</th><th>Questions</th><th>Duration</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {exams.map(e => (
                    <tr key={e._id}>
                      <td><strong>{e.title}</strong></td>
                      <td>{e.subject}</td>
                      <td>{(e.questions || []).length}</td>
                      <td>{e.durationMinutes} min</td>
                      <td style={{ fontSize: 12, color: "var(--text3)" }}>{e.startAt ? new Date(e.startAt).toLocaleString() : "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text3)" }}>{e.endAt   ? new Date(e.endAt).toLocaleString()   : "—"}</td>
                      <td>{statusBadge(e)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className={`btn btn-sm ${e.isPublished ? "btn-warning" : "btn-success"}`} onClick={() => togglePublish(e)}>
                            {e.isPublished ? "Unpublish" : "Publish"}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {modal && <CreateExamModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); showToast("Exam created!"); }} />}
    </>
  );
}
