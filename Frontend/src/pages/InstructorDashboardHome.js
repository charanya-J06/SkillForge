// src/pages/InstructorDashboardHome.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const instructorId = () => localStorage.getItem("instructorId") || "1";

export default function InstructorDashboardHome() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [courseProgress, setCourseProgress] = useState({}); // courseId -> { subjectCount, topicCount } or similar
  const [courseQuizStats, setCourseQuizStats] = useState({}); // courseId -> { totalQuizzes, attemptedQuizzes, percent }

  const name = localStorage.getItem("name") || "Instructor";

  useEffect(() => {
    const id = instructorId();
    API.get(`/instructor/courses?instructorId=${id}`)
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
    API.get(`/instructor/analytics?instructorId=${id}`)
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics({ totalAttempts: 0, averageScore: 0, attemptsTable: [] }));
  }, []);

  useEffect(() => {
    if (courses.length === 0) {
      setQuizzesCount(0);
      setCourseProgress({});
      setCourseQuizStats({});
      return;
    }
    let total = 0;
    const attemptsTable = analytics?.attemptsTable || [];
    Promise.all(
      courses.map((c) =>
        API.get(`/instructor/quizzes?courseId=${c.id}`)
          .then((res) => ({ courseId: c.id, quizzes: res.data || [] }))
          .catch(() => ({ courseId: c.id, quizzes: [] }))
      )
    ).then((rows) => {
      const stats = {};
      rows.forEach(({ courseId, quizzes }) => {
        total += quizzes.length;
        const quizIds = new Set((quizzes || []).map((q) => q.id));
        const courseAttempts = attemptsTable.filter((a) => quizIds.has(a.quizId));
        const attemptedQuizIds = new Set(courseAttempts.map((a) => a.quizId));
        const totalQuizzes = quizzes.length;
        const attemptedQuizzes = attemptedQuizIds.size;
        const percent = totalQuizzes > 0 ? Math.round((attemptedQuizzes / totalQuizzes) * 100) : 0;
        const avgScore = courseAttempts.length > 0 ? courseAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / courseAttempts.length : 0;
        stats[courseId] = { totalQuizzes, attemptedQuizzes, percent, avgScore };
      });
      setQuizzesCount(total);
      setCourseQuizStats(stats);
    });

    courses.forEach((c) => {
      API.get(`/instructor/topic-progress?courseId=${c.id}`)
        .then((res) => {
          const topicsDone = res.data?.topicsDone ?? 0;
          const topicsTotal = res.data?.topicsTotal ?? 0;
          setCourseProgress((prev) => ({ ...prev, [c.id]: { topicsDone, topicsTotal } }));
        })
        .catch(() => setCourseProgress((prev) => ({ ...prev, [c.id]: { topicsDone: 0, topicsTotal: 0 } })));
    });
  }, [courses, analytics]);

  const attemptsTable = analytics?.attemptsTable || [];
  const totalStudents = new Set(attemptsTable.map((a) => a.studentId)).size;
  const averageScore = analytics?.averageScore ?? 0;
  const totalAttempts = analytics?.totalAttempts ?? 0;

  const isEmpty = courses.length === 0;

  return (
    <div className="instructor-dashboard-home">
      <section className="dashboard-welcome-section">
        <h1 className="dashboard-welcome-title">Welcome, {name}</h1>
        {isEmpty ? (
          <p className="dashboard-welcome-sub">Get started by creating your first course.</p>
        ) : (
          <p className="dashboard-welcome-sub">Here’s an overview of your courses and activity.</p>
        )}
      </section>

      {isEmpty ? (
        <>
          <div className="quick-start-cards">
            <button
              type="button"
              className="quick-start-card"
              onClick={() => navigate("/instructor/courses")}
            >
              <span className="quick-start-icon"><i className="fa-solid fa-book-open-reader" style={{ color: "#3b82f6" }}></i></span>
              <h3>Create New Course</h3>
              <p>Start building your first course.</p>
            </button>
            <button
              type="button"
              className="quick-start-card"
              onClick={() => navigate("/instructor/topics")}
            >
              <span className="quick-start-icon"><i className="fa-solid fa-cloud-arrow-up" style={{ color: "#3b82f6" }}></i></span>
              <h3>Import Course Materials</h3>
              <p>Upload PDFs, notes, and resources.</p>
            </button>
            <button
              type="button"
              className="quick-start-card"
              onClick={() => navigate("/instructor/quizzes")}
            >
              <span className="quick-start-icon"><i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#eab308" }}></i></span>
              <h3>Generate AI Quiz</h3>
              <p>Auto-generate quizzes using AI.</p>
            </button>
          </div>

          <div className="dashboard-empty-state">
            <div className="empty-state-illus"><i className="fa-solid fa-laptop-code" style={{ color: "#cbd5e1" }}></i></div>
            <h3 className="empty-state-title">No Courses Available</h3>
            <p className="empty-state-desc">
              You haven’t created any courses yet. Start by creating your first course.
            </p>
          </div>

          <div className="dashboard-tips">
            <h4>Tips</h4>
            <ul>
              <li>Set up your course curriculum and topics</li>
              <li>Upload resources and quizzes</li>
              <li>Use the AI quiz generator to create assessments quickly</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="dashboard-stats-row">
            <div className="stat-card stat-card-instructor stat-indigo">
              <div className="stat-icon"><i className="fa-solid fa-user-graduate" style={{ color: "#3b82f6" }}></i></div>
              <span className="stat-value">{totalStudents}</span>
              <span className="stat-label">Total Students</span>
            </div>
            <div className="stat-card stat-card-instructor stat-blue">
              <div className="stat-icon"><i className="fa-solid fa-book" style={{ color: "#10b981" }}></i></div>
              <span className="stat-value">{courses.length}</span>
              <span className="stat-label">Active Courses</span>
            </div>
            <div className="stat-card stat-card-instructor stat-orange">
              <div className="stat-icon"><i className="fa-solid fa-brain" style={{ color: "#f59e0b" }}></i></div>
              <span className="stat-value">{quizzesCount}</span>
              <span className="stat-label">Quizzes Created</span>
            </div>
            <div className="stat-card stat-card-instructor stat-green">
              <div className="stat-icon"><i className="fa-solid fa-bullseye" style={{ color: "#f59e0b" }}></i></div>
              <span className="stat-value">{Number(averageScore)}%</span>
              <span className="stat-label">Average Score</span>
            </div>
          </div>

          <section className="dashboard-course-overview">
            <h2 className="section-heading">Course Overview</h2>
            <div className="dashboard-course-cards">
              {courses.map((c) => {
                const prog = courseProgress[c.id] || { topicsDone: 0, topicsTotal: 0 };
                const totalTopics = prog.topicsTotal || 0;
                const displayProgress = totalTopics ? `${prog.topicsDone} / ${totalTopics}` : "—";
                const quizStat = courseQuizStats[c.id] || { totalQuizzes: 0, attemptedQuizzes: 0, percent: 0 };
                const percent = quizStat.totalQuizzes > 0 ? quizStat.percent : 0;
                const colorClass = percent < 40 ? "progress-low" : percent < 75 ? "progress-mid" : "progress-high";
                return (
                  <div key={c.id} className="dashboard-course-card">
                    <h3 className="dashboard-course-card-title">{c.title}</h3>
                    <p className="dashboard-course-meta">Topics: {displayProgress}</p>
                    <p className="dashboard-course-meta">Average score: {Number(quizStat.avgScore || 0).toFixed(1)}%</p>
                    <p className="dashboard-course-meta">
                      Quiz participation:{" "}
                      {quizStat.totalQuizzes
                        ? `${quizStat.attemptedQuizzes}/${quizStat.totalQuizzes} quizzes attempted (${percent}%)`
                        : "—"}
                    </p>
                    <div className="progress-bar-wrap" style={{ margin: "8px 0" }}>
                      <div
                        className={`progress-bar ${colorClass}`}
                        style={{
                          width: quizStat.totalQuizzes ? `${percent}%` : "0%",
                          background:
                            percent < 40
                              ? "linear-gradient(90deg, #c53030, #ff7a18)"
                              : percent < 75
                              ? "linear-gradient(90deg, #f6ad55, #ff7a18)"
                              : "linear-gradient(90deg, #0d8b2e, #23c55e)",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="primary-btn dashboard-view-course-btn instructor-view-course-btn"
                      onClick={() => navigate("/instructor/subjects?courseId=" + c.id)}
                    >
                      View Course
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="dashboard-quick-actions">
            <h3 className="section-heading-small">Quick Actions</h3>
            <div className="quick-actions-btns">
              <button
                type="button"
                className="primary-btn"
                onClick={() => navigate("/instructor/quizzes")}
              >
                Create Quiz
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => navigate("/instructor/courses")}
              >
                Add New Course
              </button>
            </div>
          </div>

          <div className="dashboard-announcements">
            <h3 className="section-heading-small">Announcements</h3>
            <ul className="announcements-list">
              <li>Welcome to SkillForge. Build courses and engage students with AI-powered quizzes.</li>
              <li>New: AI Quiz Generator is available under Quizzes — generate questions from any topic.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
