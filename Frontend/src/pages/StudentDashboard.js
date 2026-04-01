import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import StudentLayout from "./StudentLayout";

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [completedTopicIds, setCompletedTopicIds] = useState(new Set());
  const [totalTopicsCount, setTotalTopicsCount] = useState(0);
  const [courseTopicStats, setCourseTopicStats] = useState({});
  const [courseQuizStats, setCourseQuizStats] = useState({});
  const [courseOverallStats, setCourseOverallStats] = useState({});
  const studentId = localStorage.getItem("studentId") || localStorage.getItem("instructorId") || "1";
  const studentName = localStorage.getItem("name") || "Student";
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/student/courses").then((res) => setCourses(res.data || [])).catch(() => setCourses([]));
    API.get(`/student/analytics?studentId=${studentId}`).then((res) => setAnalytics(res.data)).catch(() => setAnalytics({ totalAttempts: 0, overallAverageScore: 0, byQuiz: [], scoreTrend: [] }));
    API.get(`/student/attempts?studentId=${studentId}`).then((res) => setAttempts(res.data || [])).catch(() => setAttempts([]));
    API.get(`/student/suggestions?studentId=${studentId}`).then((res) => setSuggestions(res.data || [])).catch(() => setSuggestions([]));
  }, [studentId]);

  useEffect(() => {
    API.get(`/student/topic-progress?studentId=${studentId}`)
      .then((res) => setCompletedTopicIds(new Set(res.data || [])))
      .catch(() => setCompletedTopicIds(new Set()));
  }, [studentId]);

  // Compute total topics available across all courses (for accurate progress)
  useEffect(() => {
    if (!courses || courses.length === 0) {
      setTotalTopicsCount(0);
      setCourseTopicStats({});
      return;
    }
    const promises = courses.map((c) =>
      API.get(`/student/subjects?courseId=${c.id}`)
        .then((subRes) => subRes.data || [])
        .then((subs) =>
          Promise.all(
            subs.map((s) =>
              API.get(`/student/topics?subjectId=${s.id}`).then((tRes) => (tRes.data || []).length)
            )
          ).then((counts) => counts.reduce((a, b) => a + b, 0))
        )
        .catch(() => 0)
    );
    Promise.all(
      courses.map((c) =>
        API.get(`/student/subjects?courseId=${c.id}`)
          .then((subRes) => subRes.data || [])
          .then((subs) =>
            Promise.all(
              subs.map((s) =>
                API.get(`/student/topics?subjectId=${s.id}`).then((tRes) => tRes.data || [])
              )
            ).then((topicsArrays) => topicsArrays.flat())
          )
          .catch(() => [])
      )
    ).then((topicsPerCourse) => {
      let total = 0;
      const stats = {};
      courses.forEach((course, idx) => {
        const topics = topicsPerCourse[idx] || [];
        const allIds = topics.map((t) => t.id);
        const completed = allIds.filter((id) => completedTopicIds.has(id)).length;
        const totalCourseTopics = allIds.length;
        total += totalCourseTopics;
        stats[course.id] = {
          completed,
          total: totalCourseTopics,
          percent: totalCourseTopics > 0 ? Math.round((completed / totalCourseTopics) * 100) : 0,
        };
      });
      setTotalTopicsCount(total);
      setCourseTopicStats(stats);
    });
  }, [courses]);

  // Compute per-course quiz progress (attempted quizzes / total quizzes)
  useEffect(() => {
    if (!courses || courses.length === 0) {
      setCourseQuizStats({});
      return;
    }
    const attemptedQuizIds = new Set((attempts || []).map((a) => a.quizId));
    Promise.all(
      courses.map((c) =>
        API.get(`/student/quizzes?courseId=${c.id}`)
          .then((res) => ({ courseId: c.id, quizzes: res.data || [] }))
          .catch(() => ({ courseId: c.id, quizzes: [] }))
      )
    ).then((rows) => {
      const stats = {};
      rows.forEach(({ courseId, quizzes }) => {
        const quizIds = (quizzes || []).map((q) => q.id);
        const attempted = quizIds.filter((id) => attemptedQuizIds.has(id)).length;
        const total = quizIds.length;
        stats[courseId] = {
          attempted,
          total,
          percent: total > 0 ? Math.round((attempted / total) * 100) : 0,
        };
      });
      setCourseQuizStats(stats);
    });
  }, [courses, attempts]);

  // Combine topic progress + quiz-attempt progress into one overall % per course
  useEffect(() => {
    if (!courses || courses.length === 0) {
      setCourseOverallStats({});
      return;
    }
    const stats = {};
    courses.forEach((c) => {
      const t = courseTopicStats[c.id] || { completed: 0, total: 0, percent: 0 };
      const q = courseQuizStats[c.id] || { attempted: 0, total: 0, percent: 0 };
      const parts = [];
      if (t.total > 0) parts.push(t.percent);
      if (q.total > 0) parts.push(q.percent);
      const overall = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
      stats[c.id] = {
        overallPercent: overall,
        topic: t,
        quiz: q,
      };
    });
    setCourseOverallStats(stats);
  }, [courses, courseTopicStats, courseQuizStats]);

  const totalAttempts = analytics?.totalAttempts ?? attempts.length;
  const avgScore = analytics?.overallAverageScore ?? (attempts.length ? (attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length) : 0);
  const enrolledCount = courses.length;
  const hasActivity = totalAttempts > 0 || enrolledCount > 0;
  const streak = analytics?.streakDays ?? 0;
  const completedCount = completedTopicIds.size;
  const topicProgressPercent = totalTopicsCount > 0 ? Math.round((completedCount / totalTopicsCount) * 100) : 0;
  const overallQuizTotals = Object.values(courseQuizStats || {}).reduce(
    (acc, v) => ({
      attempted: acc.attempted + (v.attempted || 0),
      total: acc.total + (v.total || 0),
    }),
    { attempted: 0, total: 0 }
  );
  const quizProgressPercent =
    overallQuizTotals.total > 0 ? Math.round((overallQuizTotals.attempted / overallQuizTotals.total) * 100) : 0;
  const overallParts = [];
  if (totalTopicsCount > 0) overallParts.push(topicProgressPercent);
  if (overallQuizTotals.total > 0) overallParts.push(quizProgressPercent);
  const progressPercent = overallParts.length ? Math.round(overallParts.reduce((a, b) => a + b, 0) / overallParts.length) : 0;

  return (
    <StudentLayout activeKey="/student">
      <div className="student-dashboard-content">
        {!hasActivity ? (
          <>
            <section className="dashboard-welcome-section student-welcome">
              <h1 className="dashboard-welcome-title">Welcome to SkillForge!</h1>
              <p className="dashboard-welcome-sub">Start your learning journey today.</p>
            </section>
            <div className="dashboard-empty-state student-empty">
              <p className="empty-state-desc">You are not enrolled in any courses yet.</p>
            </div>
            <div className="quick-start-cards student-quick-start">
              <button type="button" className="quick-start-card" onClick={() => navigate("/student/learn")}>
                <span className="quick-start-icon"><i className="fa-solid fa-book" style={{ color: "#3b82f6" }}></i></span>
                <h3>Browse Courses</h3>
                <p>Explore courses created by instructors.</p>
              </button>
              <button type="button" className="quick-start-card" onClick={() => navigate("/student/learn")}>
                <span className="quick-start-icon"><i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#eab308" }}></i></span>
                <h3>Try AI Practice Quiz</h3>
                <p>Experience the AI-generated quiz system.</p>
              </button>
              <button type="button" className="quick-start-card" onClick={() => navigate("/student/learn")}>
                <span className="quick-start-icon"><i className="fa-solid fa-chart-line" style={{ color: "#10b981" }}></i></span>
                <h3>View Recommended Learning Path</h3>
                <p>Discover suggested courses and quizzes.</p>
              </button>
            </div>
            <div className="dashboard-tips student-tips">
              <h4>Platform Tips</h4>
              <ul>
                <li>Enroll in courses created by instructors</li>
                <li>Complete quizzes to test your knowledge</li>
                <li>Track your learning progress through the dashboard</li>
                <li>Use AI-generated practice quizzes to improve weak areas</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <section className="dashboard-welcome-section student-welcome">
              <h1 className="dashboard-welcome-title">Welcome, {studentName}</h1>
              <p className="dashboard-welcome-sub">Here’s your learning overview.</p>
            </section>

            <div className={`instructor-card instructor-form-card ${progressPercent < 40 ? "progress-low" : progressPercent < 75 ? "progress-mid" : "progress-high"}`} style={{ marginBottom: 24 }}>
              <h3 className="instructor-card-title">Overall Progress</h3>
              <div className="progress-bar-wrap" style={{ marginTop: 10 }}>
                <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="muted-text" style={{ marginTop: 10 }}>
                Overall completion: <strong>{progressPercent}%</strong>
                {" "}· Topics: <strong>{completedCount}</strong> / <strong>{totalTopicsCount}</strong> ({topicProgressPercent}%)
                {" "}· Quizzes attempted: <strong>{overallQuizTotals.attempted}</strong> / <strong>{overallQuizTotals.total}</strong> ({quizProgressPercent}%)
              </p>
            </div>

            <div className="dashboard-stats-row student-stats">
              <div className="stat-card stat-card-student stat-blue">
                <div className="stat-icon"><i className="fa-solid fa-book" style={{ color: "#3b82f6" }}></i></div>
                <span className="stat-value">{enrolledCount}</span>
                <span className="stat-label">Enrolled Courses</span>
              </div>
              <div className="stat-card stat-card-student stat-orange">
                <div className="stat-icon"><i className="fa-solid fa-file-signature" style={{ color: "#10b981" }}></i></div>
                <span className="stat-value">{totalAttempts}</span>
                <span className="stat-label">Quizzes Completed</span>
              </div>
              <div className="stat-card stat-card-student stat-green">
                <div className="stat-icon"><i className="fa-solid fa-bullseye" style={{ color: "#eab308" }}></i></div>
                <span className="stat-value">{Number(avgScore).toFixed(0)}%</span>
                <span className="stat-label">Average Score</span>
              </div>
              <div className="stat-card stat-card-student stat-purple">
                <div className="stat-icon"><i className="fa-solid fa-fire" style={{ color: "#ef4444" }}></i></div>
                <span className="stat-value">{streak}</span>
                <span className="stat-label">Learning Streak (days)</span>
              </div>
            </div>

            <section className="student-my-courses">
              <h2 className="section-heading">My Courses</h2>
              {courses.length === 0 ? (
                <p className="muted-text">No courses available yet. Check back later.</p>
              ) : (
                <div className="dashboard-course-cards student-course-cards">
                  {courses.slice(0, 6).map((c) => (
                    <div key={c.id} className="dashboard-course-card student-course-card student-course-card-v2">
                      <div className="course-card-top">
                        <div className="course-title-row">
                          <h3 className="dashboard-course-card-title">{c.title}</h3>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {c.difficultyLevel && (
                              <span className={`course-progress-pill ${c.difficultyLevel === 'ADVANCED' ? "pill-red" : c.difficultyLevel === 'INTERMEDIATE' ? "pill-yellow" : "pill-green"}`}>
                                {c.difficultyLevel}
                              </span>
                            )}
                            {courseOverallStats[c.id] && (
                              <span className={`course-progress-pill ${courseOverallStats[c.id].overallPercent < 40 ? "pill-red" : courseOverallStats[c.id].overallPercent < 75 ? "pill-yellow" : "pill-green"}`}>
                                {courseOverallStats[c.id].overallPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="course-subtitle muted-text">Your course progress summary</div>
                      </div>

                      <div className="course-card-mid">
                        {courseOverallStats[c.id] ? (
                          <div className={`progress-bar-wrap small ${courseOverallStats[c.id].overallPercent < 40 ? "progress-low" : courseOverallStats[c.id].overallPercent < 75 ? "progress-mid" : "progress-high"}`}>
                            <div className="progress-bar" style={{ width: `${courseOverallStats[c.id].overallPercent}%` }} />
                          </div>
                        ) : (
                          <div className="muted-text">Progress not available yet.</div>
                        )}
                      </div>

                      {courseOverallStats[c.id] && (
                        <div className="course-card-details">
                          <div className="course-detail-row">
                            <span className="detail-label">Topics</span>
                            <span className="detail-value">
                              {courseOverallStats[c.id].topic.total
                                ? `${courseOverallStats[c.id].topic.completed}/${courseOverallStats[c.id].topic.total} (${courseOverallStats[c.id].topic.percent}%)`
                                : "—"}
                            </span>
                          </div>
                          <div className="course-detail-row">
                            <span className="detail-label">Quizzes</span>
                            <span className="detail-value">
                              {courseOverallStats[c.id].quiz.total
                                ? `${courseOverallStats[c.id].quiz.attempted}/${courseOverallStats[c.id].quiz.total} (${courseOverallStats[c.id].quiz.percent}%)`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="course-card-bottom">
                      <button
                        type="button"
                        className="continue-learning-btn dashboard-view-course-btn"
                        onClick={() => navigate(`/student/learn?courseId=${c.id}`)}
                      >
                        Continue Learning
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {suggestions.length > 0 && (
              <section className="student-recommendations">
                <h2 className="section-heading">Recommended for You</h2>
                <div className="suggestions-grid">
                  {suggestions.slice(0, 3).map((s, i) => (
                    <div key={i} className="suggestion-card">
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                        <span className="course-badge">{s.type || "QUIZ"}</span>
                        {s.difficultyLevel && (
                          <span className={`course-badge ${s.difficultyLevel === 'ADVANCED' ? "badge-red" : s.difficultyLevel === 'INTERMEDIATE' ? "badge-yellow" : "badge-green"}`} style={{ 
                            background: s.difficultyLevel === 'ADVANCED' ? '#ffe6e6' : s.difficultyLevel === 'INTERMEDIATE' ? '#fff3cd' : '#e6ffe6',
                            color: s.difficultyLevel === 'ADVANCED' ? '#c53030' : s.difficultyLevel === 'INTERMEDIATE' ? '#856404' : '#155724'
                          }}>
                            {s.difficultyLevel}
                          </span>
                        )}
                      </div>
                      <h4 style={{ marginBottom: "4px" }}>{s.title}</h4>
                      {s.courseName && <p className="muted-text" style={{ fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>{s.courseName}</p>}
                      <p className="muted-text" style={{ fontSize: "14px", marginBottom: "16px" }}>{s.reason}</p>
                      
                      {s.type === "QUIZ" && s.id ? (
                        <button className="primary-btn" onClick={() => navigate(`/student/quiz/${s.id}`)}>Take Quiz</button>
                      ) : (
                        <button 
                          style={{ 
                            padding: "10px 24px", 
                            fontSize: "15px", 
                            fontWeight: "600",
                            background: "linear-gradient(90deg, #ff7a18, #d35400)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "26px",
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(255, 122, 24, 0.3)"
                          }} 
                          onClick={() => {
                            if (s.courseId) {
                              if (s.type === "TOPIC" && s.id) {
                                navigate(`/student/learn?courseId=${s.courseId}&subjectId=${s.subjectId || ""}&topicId=${s.id}`);
                              } else {
                                navigate(`/student/learn?courseId=${s.courseId}`);
                              }
                            } else {
                              navigate("/student/learn");
                            }
                          }}
                        >
                          Browse Content
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="dashboard-tips student-tips">
              <h4>Tips</h4>
              <ul>
                <li>Complete quizzes to track your progress</li>
                <li>Review recommended practice to improve weak areas</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}

export default StudentDashboard;
