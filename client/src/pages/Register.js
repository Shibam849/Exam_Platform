import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm]   = useState({ name: "", email: "", password: "", role: "student", rollNo: "", studentCode: "", department: "", batch: "" });
  const [error, setError] = useState("");
  const [busy,  setBusy]  = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const u = await register(form);
      if (u.role === "admin")   nav("/admin");
      else if (u.role === "teacher") nav("/teacher");
      else nav("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <h1>🎓 ExamPortal</h1>
          <p>Create your account</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" required value={form.name} onChange={set("name")} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={set("role")}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" required value={form.password} onChange={set("password")} placeholder="Min 6 characters" />
          </div>
          {form.role === "student" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Roll No</label>
                  <input className="form-input" value={form.rollNo} onChange={set("rollNo")} placeholder="e.g. 22010333055" />
                </div>
                <div className="form-group">
                  <label className="form-label">Student Code</label>
                  <input className="form-input" value={form.studentCode} onChange={set("studentCode")} placeholder="e.g. BWU/BTD/22/061" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={set("department")} placeholder="CSE-DS" />
                </div>
                <div className="form-group">
                  <label className="form-label">Batch</label>
                  <input className="form-input" value={form.batch} onChange={set("batch")} placeholder="2022-26" />
                </div>
              </div>
            </>
          )}
          <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} disabled={busy}>
            {busy ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
