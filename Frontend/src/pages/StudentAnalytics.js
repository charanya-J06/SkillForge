import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import API from "../services/api";
import StudentLayout from "./StudentLayout";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

function StudentAnalytics() {
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseProgress, setCourseProgress] = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);
  const [quizAttemptStats, setQuizAttemptStats] = useState(null); // { attempted, total, percent }
  const [overallCourseProgress, setOverallCourseProgress] = useState(null); // { percent }
  const studentId = localStorage.getItem("studentId") || localStorage.getItem("instructorId") || "1";
  const studentName = localStorage.getItem("name") || "Student";
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/student/courses")
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [studentId]);

  useEffect(() => {
    const url = selectedCourseId
      ? `/student/analytics/course?studentId=${studentId}&courseId=${selectedCourseId}`
      : `/student/analytics?studentId=${studentId}`;
    API.get(url)
      .then((res) => setData(res.data))
      .catch(() => setData({ byQuiz: [], scoreTrend: [], totalAttempts: 0, overallAverageScore: 0 }));
  }, [studentId, selectedCourseId]);

  // Load topic/subject progress for selected course
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseProgress(null);
      setSubjectStats([]);
      setQuizAttemptStats(null);
      setOverallCourseProgress(null);
      return;
    }
    Promise.all([
      API.get(`/student/subjects?courseId=${selectedCourseId}`).then((r) => r.data || []).catch(() => []),
      API.get(`/student/quizzes?courseId=${selectedCourseId}`).then((r) => r.data || []).catch(() => []),
      API.get(`/student/attempts?studentId=${studentId}`).then((r) => r.data || []).catch(() => []),
    ])
      .then(([subs, quizzes, attempts]) => {
        const attemptedQuizIds = new Set((attempts || []).map((a) => a.quizId));
        const quizIds = (quizzes || []).map((q) => q.id);
        const attempted = quizIds.filter((id) => attemptedQuizIds.has(id)).length;
        const totalQ = quizIds.length;
        const quizPercent = totalQ > 0 ? Math.round((attempted / totalQ) * 100) : 0;
        setQuizAttemptStats({ attempted, total: totalQ, percent: quizPercent });

        if (!subs.length) {
          setCourseProgress(null);
          setSubjectStats([]);
          setOverallCourseProgress({ percent: totalQ > 0 ? quizPercent : 0 });
          return;
        }
        return Promise.all(
          subs.map((s) =>
            API.get(`/student/topics?subjectId=${s.id}`).then((tRes) => ({
              subject: s,
              topics: tRes.data || [],
            }))
          )
        ).then((rows) => {
          return API.get(`/student/topic-progress?studentId=${studentId}`)
            .then((progRes) => new Set(progRes.data || []))
            .then((completedSet) => {
              let totalTopics = 0;
              let completedTopics = 0;
              const subjects = rows.map(({ subject, topics }) => {
                const ids = topics.map((t) => t.id);
                const completed = ids.filter((id) => completedSet.has(id)).length;
                const total = ids.length;
                totalTopics += total;
                completedTopics += completed;
                return {
                  subjectId: subject.id,
                  subjectName: subject.name,
                  completed,
                  total,
                  percent: total > 0 ? Math.round((completed / total) * 100) : 0,
                };
              });
              setSubjectStats(subjects);
              const topicPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
              setCourseProgress({
                completed: completedTopics,
                total: totalTopics,
                percent: topicPercent,
              });
              const parts = [];
              if (totalTopics > 0) parts.push(topicPercent);
              if (totalQ > 0) parts.push(quizPercent);
              const overall = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
              setOverallCourseProgress({ percent: overall });
            });
        });
      })
      .catch(() => {
        setCourseProgress(null);
        setSubjectStats([]);
        setQuizAttemptStats(null);
        setOverallCourseProgress(null);
      });
  }, [selectedCourseId, studentId]);

  if (!data) return <div className="content-wrapper"><p>Loading analytics…</p></div>;

  const byQuiz = data.byQuiz || [];
  const trend = data.scoreTrend || [];
  const barData = {
    labels: byQuiz.map((b) => b.quizTitle || `Quiz ${b.quizId}`),
    datasets: [{
      label: "Average score %",
      data: byQuiz.map((b) => b.averageScore),
      backgroundColor: "rgba(2, 50, 147, 0.6)",
      borderColor: "rgba(2, 50, 147, 1)",
      borderWidth: 1,
    }],
  };
  const lineData = {
    labels: trend.map((t, i) => `Attempt ${i + 1}`),
    datasets: [{
      label: "Score %",
      data: trend.map((t) => t.score),
      borderColor: "#ff7a18",
      backgroundColor: "rgba(255, 122, 24, 0.1)",
      tension: 0.2,
    }],
  };

  return (
    <StudentLayout activeKey="/student/analytics">
      <div className="content-wrapper student-analytics-content">
        <div className="content-header content-header-centered">
          <h2>My Analytics</h2>
          <p>Filter by course to see separate performance charts.</p>
        </div>

        <div className="instructor-card instructor-form-card" style={{ marginBottom: 18 }}>
          <h3 className="instructor-card-title">Filter</h3>
          <div className="form-grid two-cols form-grid-gap">
            <div>
              <label>Course</label>
              <select
                className="form-input"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="card wide card-medium">
          <h3>Summary</h3>
          <p>Total attempts: <strong>{data.totalAttempts}</strong> · Overall average: <strong>{data.overallAverageScore}%</strong></p>
        </div>

        {selectedCourseId && overallCourseProgress && (
          <div className="card wide card-medium">
            <h3>Course Progress</h3>
            <p>
              Overall completion: <strong>{overallCourseProgress.percent}%</strong>
              {courseProgress && (
                <>
                  {" "}· Topics: <strong>{courseProgress.completed}</strong> / <strong>{courseProgress.total}</strong> ({courseProgress.percent}%)
                </>
              )}
              {quizAttemptStats && (
                <>
                  {" "}· Quizzes attempted: <strong>{quizAttemptStats.attempted}</strong> / <strong>{quizAttemptStats.total}</strong> ({quizAttemptStats.percent}%)
                </>
              )}
            </p>
            <div className="progress-bar-wrap" style={{ marginTop: 8 }}>
              <div
                className="progress-bar"
                style={{ width: `${overallCourseProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {subjectStats.length > 0 && (
          <div className="card wide card-medium">
            <h3>Subjects & Topic Status</h3>
            <table className="styled-table styled-table-medium">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Completed</th>
                  <th>Total</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map((s) => (
                  <tr key={s.subjectId}>
                    <td>{s.subjectName}</td>
                    <td>{s.completed}</td>
                    <td>{s.total}</td>
                    <td>{s.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {byQuiz.length > 0 && (
          <div className="card wide card-medium">
            <h3>Score by Quiz (Topic)</h3>
            <div style={{ height: 260 }}>
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
            </div>
          </div>
        )}
        {trend.length > 0 && (
          <div className="card wide card-medium">
            <h3>Score trend over time</h3>
            <div style={{ height: 260 }}>
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
            </div>
          </div>
        )}
        {trend.length > 0 && (
          <div className="card wide card-medium">
            <h3>Recent attempts (Quiz / Topic)</h3>
            <table className="styled-table styled-table-medium">
              <thead><tr><th>Quiz (Topic)</th><th>Score</th><th>Time</th><th></th></tr></thead>
              <tbody>
                {trend.slice(0, 10).map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{a.quizTitle || "Quiz " + a.quizId}</span>
                        {a.difficultyLevel && (
                          <span className={`course-progress-pill ${a.difficultyLevel === 'ADVANCED' ? "pill-red" : a.difficultyLevel === 'INTERMEDIATE' ? "pill-yellow" : "pill-green"}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                            {a.difficultyLevel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{a.score}%</td>
                    <td>{String(a.attemptTime || "").slice(0, 19)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {Number(a.score) < 100 ? (
                          <button className="primary-btn btn-medium" style={{ minWidth: "100px" }} onClick={() => navigate(`/student/quiz/${a.quizId}`)}>
                            Retake
                          </button>
                        ) : (
                          <span className="topic-complete-badge" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "100px", padding: "8px 16px" }}>Perfect</span>
                        )}
                        {a.attemptId && (
                          <button className="primary-btn btn-medium" style={{ minWidth: "100px", background: "#4bc0c0", borderColor: "#4bc0c0" }} onClick={() => navigate(`/student/quiz/${a.quizId}?review=${a.attemptId}`)}>
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default StudentAnalytics;
