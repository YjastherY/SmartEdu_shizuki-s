import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Assistant from "./pages/Assistant.jsx";
import Chat from "./pages/Chat.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import CourseBuilder from "./pages/CourseBuilder.jsx";
import Courses from "./pages/Courses.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Lesson from "./pages/Lesson.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Progress from "./pages/Progress.jsx";
import Register from "./pages/Register.jsx";
import TeacherPanel from "./pages/TeacherPanel.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route
          path="/courses/builder"
          element={
            <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
              <CourseBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/builder/:courseId"
          element={
            <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
              <CourseBuilder />
            </ProtectedRoute>
          }
        />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/lessons/:lessonId" element={<Lesson />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/chat" element={<Chat />} />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
              <TeacherPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
