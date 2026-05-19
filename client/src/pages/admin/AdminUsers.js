import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";

const EMPTY_FORM = { name: "", email: "", password: "", role: "student", rollNo: "", studentCode: "", department: "", batch: "", isActive: true };

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(user ? { ...user, password: "" } : { ...EMPTY_FORM });
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (user) await api.put(`/admin/users/${user._id}`, payload);
      else      await api.post("/admin/users", payload);
      onSaved();
    } catch (ex) { setErr(ex.response?.data?.message || "Error"); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{user ? "Edit User" : "Create User"}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" required value={form.name} onChange={set("name")} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={set("role")}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" required value={form.email} onChange={set("email")} />
          </div>
          <div className="form-group">
            <label className="form-label">{user ? "New Password (leave blank to keep)" : "Password *"}</label>
            <input className="form-input" type="password" required={!user} value={form.password} onChange={set("password")} placeholder="••••••••" />
          </div>
          {form.role === "student" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Roll No</label>
                  <input className="form-input" value={form.rollNo || ""} onChange={set("rollNo")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Student Code</label>
                  <input className="form-input" value={form.studentCode || ""} onChange={set("studentCode")} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department || ""} onChange={set("department")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Batch</label>
                  <input className="form-input" value={form.batch || ""} onChange={set("batch")} />
                </div>
              </div>
            </>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [data,    setData]    = useState({ users: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);   // null | "create" | user object
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("");
  const [page,    setPage]    = useState(1);
  const [toast,   setToast]   = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (search) params.set("search", search);
    if (role)   params.set("role",   role);
    api.get(`/admin/users?${params}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (u) => {
    await api.patch(`/admin/users/${u._id}/toggle`);
    showToast(`User ${u.isActive ? "deactivated" : "activated"}`);
    load();
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    await api.delete(`/admin/users/${u._id}`);
    showToast("User deleted");
    load();
  };

  const roleBadge = (r) => {
    const map = { admin: "badge-purple", teacher: "badge-blue", student: "badge-green" };
    return <span className={`badge ${map[r] || "badge-gray"}`}>{r}</span>;
  };

  return (
    <>
      {toast && <div className="alert alert-success" style={{ position: "fixed", top: 16, right: 16, zIndex: 999, minWidth: 220 }}>{toast}</div>}

      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage students, teachers and admins</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
            <div className="search-bar" style={{ position: "relative" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text3)" }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input className="form-input" style={{ paddingLeft: 32, width: 200 }} placeholder="Search name / email…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-select" style={{ width: 130 }} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setModal("create")}>+ Add User</button>
        </div>

        {loading ? (
          <div className="loading-box"><div className="spinner" /></div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Roll No</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td style={{ color: "var(--text2)" }}>{u.email}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td style={{ color: "var(--text3)" }}>{u.rollNo || "—"}</td>
                      <td style={{ color: "var(--text3)" }}>{u.department || "—"}</td>
                      <td>
                        <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text3)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-outline btn-sm" onClick={() => setModal(u)}>Edit</button>
                          <button className={`btn btn-sm ${u.isActive ? "btn-warning" : "btn-success"}`} onClick={() => handleToggle(u)}>
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          {u.role !== "admin" && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.users.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

      {modal && (
        <UserModal
          user={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); showToast("User saved!"); }}
        />
      )}
    </>
  );
}
