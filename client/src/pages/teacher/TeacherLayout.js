import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const NAV = [
  {
    label: "Overview",
    links: [
      { to: "/teacher", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard", end: true },
    ],
  },
  {
    label: "Content",
    links: [
      { to: "/teacher/questions", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Question Bank" },
      { to: "/teacher/exams",     icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",                label: "Exams" },
    ],
  },
  {
    label: "Results",
    links: [
      { to: "/teacher/submissions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Submissions" },
    ],
  },
];

export default function TeacherLayout() {
  return (
    <div className="layout">
      <Sidebar items={NAV} />
      <div className="main-content"><Outlet /></div>
    </div>
  );
}
