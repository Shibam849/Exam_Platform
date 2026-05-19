import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`} style={{ textDecoration: "none" }}>
      <Icon d={icon} />{label}
    </NavLink>
  );
}

export default function Sidebar({ items }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => { logout(); nav("/login"); };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>🎓 ExamPortal</h2>
        <p>{user?.name}</p>
      </div>
      <div className="sidebar-nav">
        {items.map((section, i) => (
          <div className="nav-section" key={i}>
            {section.label && <div className="nav-label">{section.label}</div>}
            {section.links.map((l) => (
              <NavItem key={l.to} to={l.to} icon={l.icon} label={l.label} end={l.end} />
            ))}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
          <span className={`badge badge-${user?.role === "admin" ? "purple" : user?.role === "teacher" ? "blue" : "green"}`}>
            {user?.role}
          </span>
          <span style={{ marginLeft: 6 }}>{user?.email}</span>
        </div>
        <button className="btn btn-outline btn-sm w-full" style={{ justifyContent: "center" }} onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
