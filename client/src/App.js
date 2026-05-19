import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth
import Login    from "./pages/Login";
import Register from "./pages/Register";

// Admin
import AdminLayout     from "./pages/admin/AdminLayout";
import AdminDashboard  from "./pages/admin/AdminDashboard";
import AdminUsers      from "./pages/admin/AdminUsers";
import AdminExams      from "./pages/admin/AdminExams";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminAiFeedbacks from "./pages/admin/AdminAiFeedbacks";
import AdminAnalytics   from "./pages/admin/AdminAnalytics";

// Teacher
import TeacherLayout     from "./pages/teacher/TeacherLayout";
import TeacherDashboard  from "./pages/teacher/TeacherDashboard";
import TeacherQuestions  from "./pages/teacher/TeacherQuestions";
import TeacherExams      from "./pages/teacher/TeacherExams";
import TeacherSubmissions from "./pages/teacher/TeacherSubmissions";
import TeacherGrade      from "./pages/teacher/TeacherGrade";

// Student
import StudentLayout  from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import TakeExam       from "./pages/student/TakeExam";
import StudentResults from "./pages/student/StudentResults";
import StudentResultDetail from "./pages/student/StudentResultDetail";

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-box"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-box"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin")   return <Navigate to="/admin"   replace />;
  if (user.role === "teacher") return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<RoleRedirect />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth roles={["admin"]}><AdminLayout /></RequireAuth>}>
            <Route index                element={<AdminDashboard />} />
            <Route path="users"         element={<AdminUsers />} />
            <Route path="exams"         element={<AdminExams />} />
            <Route path="submissions"   element={<AdminSubmissions />} />
            <Route path="ai-feedbacks"  element={<AdminAiFeedbacks />} />
            <Route path="analytics"     element={<AdminAnalytics />} />
          </Route>

          {/* Teacher */}
          <Route path="/teacher" element={<RequireAuth roles={["teacher"]}><TeacherLayout /></RequireAuth>}>
            <Route index               element={<TeacherDashboard />} />
            <Route path="questions"    element={<TeacherQuestions />} />
            <Route path="exams"        element={<TeacherExams />} />
            <Route path="submissions"  element={<TeacherSubmissions />} />
            <Route path="grade/:id"    element={<TeacherGrade />} />
          </Route>

          {/* Student */}
          <Route path="/student" element={<RequireAuth roles={["student"]}><StudentLayout /></RequireAuth>}>
            <Route index            element={<StudentDashboard />} />
            <Route path="results"   element={<StudentResults />} />
            <Route path="results/:id" element={<StudentResultDetail />} />
          </Route>
          <Route path="/exam/:id" element={<RequireAuth roles={["student"]}><TakeExam /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
