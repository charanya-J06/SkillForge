// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorDashboardHome from "./pages/InstructorDashboardHome";
import InstructorCourses from "./pages/InstructorCourses";
import InstructorSubjects from "./pages/InstructorSubjects";
import InstructorTopics from "./pages/InstructorTopics";
import InstructorQuizzes from "./pages/InstructorQuizzes";
import InstructorAnalytics from "./pages/InstructorAnalytics";
import StudentLearning from "./pages/StudentLearning";
import StudentQuizAttempt from "./pages/StudentQuizAttempt";
import StudentAnalytics from "./pages/StudentAnalytics";

// Admin Imports
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminFeedback from "./pages/AdminFeedback";
import AdminAnnouncements from "./pages/AdminAnnouncements";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/learn" element={<StudentLearning />} />
        <Route path="/student/quiz/:quizId" element={<StudentQuizAttempt />} />
        <Route path="/student/analytics" element={<StudentAnalytics />} />

        {/* Instructor layout; after login you navigate('/instructor') */}
        <Route path="/instructor" element={<InstructorDashboard />}>
          <Route index element={<InstructorDashboardHome />} />
          <Route path="courses" element={<InstructorCourses />} />
          <Route path="subjects" element={<InstructorSubjects />} />
          <Route path="topics" element={<InstructorTopics />} />
          <Route path="quizzes" element={<InstructorQuizzes />} />
          <Route path="analytics" element={<InstructorAnalytics />} />
        </Route>

        {/* Admin layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
