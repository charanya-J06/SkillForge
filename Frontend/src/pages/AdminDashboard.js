// src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalQuizzes: 0,
    totalQuizAttempts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Assuming backend endpoint /admin/stats exists.
    API.get("/admin/stats")
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error("Failed to load admin stats", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const pieData = {
    labels: ['Students', 'Instructors'],
    datasets: [
      {
        data: [stats.totalStudents, stats.totalInstructors],
        backgroundColor: ['#4c51bf', '#3182ce'],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['Courses', 'Quizzes', 'Attempts'],
    datasets: [
      {
        label: 'Count',
        data: [stats.totalCourses, stats.totalQuizzes, stats.totalQuizAttempts],
        backgroundColor: ['#dd6b20', '#38a169', '#805ad5'],
      },
    ],
  };

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>Admin Dashboard</h2>
        <p>Platform-wide overview and system status.</p>
      </div>

      {loading ? (
        <p className="muted-text" style={{ textAlign: "center" }}>Loading platform stats...</p>
      ) : (
        <>
          <div className="dashboard-stats-row">
            <div className="stat-card stat-indigo">
              <div className="stat-icon"><i className="fa-solid fa-user-graduate" style={{ color: "#3b82f6" }}></i></div>
              <span className="stat-value">{stats.totalStudents}</span>
              <span className="stat-label">Total Students</span>
            </div>
            <div className="stat-card stat-blue">
              <div className="stat-icon"><i className="fa-solid fa-chalkboard-user" style={{ color: "#3b82f6" }}></i></div>
              <span className="stat-value">{stats.totalInstructors}</span>
              <span className="stat-label">Total Instructors</span>
            </div>
            <div className="stat-card stat-orange">
              <div className="stat-icon"><i className="fa-solid fa-book" style={{ color: "#10b981" }}></i></div>
              <span className="stat-value">{stats.totalCourses}</span>
              <span className="stat-label">Total Courses</span>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-icon"><i className="fa-solid fa-file-signature" style={{ color: "#eab308" }}></i></div>
              <span className="stat-value">{stats.totalQuizAttempts}</span>
              <span className="stat-label">Total Quiz Attempts</span>
            </div>
          </div>

          <div className="dashboard-charts" style={{ display: 'flex', gap: '24px', marginTop: '48px', flexWrap: 'wrap' }}>
            <div className="chart-container card" style={{ flex: '1 1 400px', padding: '32px', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '24px', color: '#1e293b', fontSize: '18px', fontWeight: 600 }}>User Distribution</h3>
              <div style={{ height: '320px', display: 'flex', justifyContent: 'center' }}>
                <Pie data={pieData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="chart-container card" style={{ flex: '1 1 400px', padding: '32px', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '24px', color: '#1e293b', fontSize: '18px', fontWeight: 600 }}>Platform Content Insights</h3>
              <div style={{ height: '320px' }}>
                <Bar data={barData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="dashboard-quick-actions" style={{ marginTop: "40px" }}>
        <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "20px" }}>Platform Health & Quick Actions</h3>
        <div className="quick-actions-btns" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate("/admin/users")}
            style={{ borderRadius: "8px", padding: "12px 24px" }}
          >
            <i className="fa-solid fa-users-gear"></i> Manage Users
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{ background: "#475569", borderRadius: "8px", padding: "12px 24px" }}
            onClick={() => navigate("/admin/courses")}
          >
            <i className="fa-solid fa-list-check"></i> Review Courses
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{ background: "#ea580c", borderRadius: "8px", padding: "12px 24px" }}
            onClick={() => navigate("/admin/feedback")}
          >
            <i className="fa-regular fa-comment-dots"></i> Review Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
