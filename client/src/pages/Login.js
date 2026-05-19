import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy,  setBusy]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const u = await login(form.email, form.password);
      if (u.role === "admin")   nav("/admin");
      else if (u.role === "teacher") nav("/teacher");
      else nav("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🎓 ExamPortal</h1>
          <p>AI-Powered Digital Examination Platform</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
