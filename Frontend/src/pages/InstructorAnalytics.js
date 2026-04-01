import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function InstructorAnalytics() {
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null); // { subjects, topicsBySubject, quizzes, attempts }
  const [insights, setInsights] = useState(null);
  const [courseParticipation, setCourseParticipation] = useState(null);

  const [topStudents, setTopStudents] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);

  const instructorId = localStorage.getItem("instructorId") || "1";
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/instructor/analytics?instructorId=${instructorId}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ totalAttempts: 0, averageScore: 0, attemptsTable: [] }));
    API.get(`/instructor/insights?instructorId=${instructorId}`)
      .then((res) => {
        setInsights(res.data);
        const students = res.data.students || [];
        setTopStudents(students.filter(s => s.overallAverageScore >= 75));
        setAtRiskStudents(students.filter(s => s.overallAverageScore < 50));
      })
      .catch(() => setInsights({ students: [] }));
    API.get(`/instructor/courses?instructorId=${instructorId}`)
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [instructorId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setCourseDetail(null);
      setCourseParticipation(null);
      return;
    }
    const table = data?.attemptsTable || [];
    Promise.all([
      API.get(`/instructor/subjects?courseId=${selectedCourseId}`),
      API.get(`/instructor/quizzes?courseId=${selectedCourseId}`),
    ])
      .then(([subRes, quizRes]) => {
        const subjects = subRes.data || [];
        const quizzes = quizRes.data || [];
        const quizIds = new Set((quizzes || []).map((q) => q.id));
        const attemptsForCourse = table.filter((row) => quizIds.has(row.quizId));
        const topicPromises = subjects.map((s) =>
          API.get(`/instructor/topics?subjectId=${s.id}`).then((tRes) => ({ subjectId: s.id, topics: tRes.data || [] }))
        );
        return Promise.all(topicPromises).then((topicResults) => {
          const topicsBySubject = {};
          topicResults.forEach(({ subjectId, topics }) => {
            topicsBySubject[subjectId] = topics;
          });
          // Participation aggregates
          const uniqueStudents = new Set(attemptsForCourse.map((a) => a.studentId));
          setCourseParticipation({
            uniqueStudents: uniqueStudents.size,
            totalAttempts: attemptsForCourse.length,
          });
          setCourseDetail({
            subjects,
            topicsBySubject,
            quizzes: quizzes || [],
            attempts: attemptsForCourse,
          });
        });
      })
      .catch(() => setCourseDetail(null));
  }, [selectedCourseId, data]);

  if (!data) {
    return (
      <div className="content-wrapper instructor-page-wrap">
        <p className="instructor-empty-msg">Loading analytics…</p>
      </div>
    );
  }

  const table = data.attemptsTable || [];
  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>Analytics & Reports</h2>
        <p>Overview of your courses and student participation.</p>
      </div>

      <div className="instructor-card instructor-form-card">
        <h3 className="instructor-card-title">Summary & System Overview</h3>
        <p style={{ margin: 0, fontSize: 15, color: "#555" }}>
          Total quiz attempts: <strong>{data.totalAttempts}</strong> · Overall average score: <strong>{data.averageScore}%</strong>
        </p>
      </div>

      <div className="dashboard-stats-row" style={{ marginTop: 24 }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><i className="fa-solid fa-star" style={{ color: "#eab308" }}></i></div>
          <span className="stat-value">{topStudents.length}</span>
          <span className="stat-label">Top Performing Students</span>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon"><i className="fa-solid fa-triangle-exclamation" style={{ color: "#ef4444" }}></i></div>
          <span className="stat-value">{atRiskStudents.length}</span>
          <span className="stat-label">At-Risk Students</span>
        </div>
      </div>

      {insights && (insights.students || []).length > 0 && (
        <div className="instructor-card instructor-form-card">
          <h3 className="instructor-card-title">Student Strengths & Weaknesses</h3>
          <p className="muted-text" style={{ marginTop: 0 }}>
            Based on average quiz scores across your courses.
          </p>
          <div className="insights-grid">
            {insights.students.slice(0, 6).map((s) => (
              <div key={s.studentId} className="insight-card">
                <div className="insight-header">
                  <strong>
                    {s.studentName
                      ? `${s.studentName} (ID: ${s.studentId})`
                      : `Student ${s.studentId}`}
                  </strong>
                  <span className="insight-score">{s.overallAverageScore}% avg</span>
                </div>
                <div className="insight-block">
                  <div className="insight-title">Weak</div>
                  <ul>
                    {(s.weakest || []).map((w, i) => (
                      <li key={i}>{w.quizTitle} · {w.averageScore}%</li>
                    ))}
                    {s.weakest && s.weakest.length > 0 && (
                      <p className="muted-text" style={{ fontSize: "12px", marginTop: "4px", color: "#c53030" }}>
                        Action: Recommend revision on "{s.weakest[0].quizTitle}"
                      </p>
                    )}
                  </ul>
                </div>
                <div className="insight-block">
                  <div className="insight-title">Strong</div>
                  <ul>
                    {(s.strongest || []).map((w, i) => (
                      <li key={i}>{w.quizTitle} · {w.averageScore}%</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="content-header content-header-centered">
        <h2>Your Courses</h2>
        <p>Click View Course to see subjects, topics, quizzes and participation.</p>
      </div>

      {courses.length === 0 ? (
        <div className="instructor-empty-msg">No courses yet. Create courses to see analytics here.</div>
      ) : (
        <div className="dashboard-course-cards" style={{ marginBottom: 32 }}>
          {courses.map((c) => (
            <div key={c.id} className="dashboard-course-card">
              <h3 className="dashboard-course-card-title">{c.title}</h3>
              <button
                type="button"
                className="primary-btn dashboard-view-course-btn"
                onClick={() => setSelectedCourseId(selectedCourseId === c.id ? null : c.id)}
              >
                {selectedCourseId === c.id ? "Hide Details" : "View Course"}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedCourseId && courseDetail && selectedCourse && (
        <div className="analytics-course-detail">
          <h2 className="section-heading">{selectedCourse.title} – Details</h2>

          {courseParticipation && (
            <div className="instructor-card instructor-form-card">
              <h3 className="instructor-card-title">Participation Overview</h3>
              <p className="muted-text" style={{ marginTop: 0 }}>
                How many students are engaging with quizzes in this course.
              </p>
              <div className="dashboard-stats-row">
                <div className="stat-card">
                  <span className="stat-value">{courseParticipation.uniqueStudents}</span>
                  <span className="stat-label">Students</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{courseParticipation.totalAttempts}</span>
                  <span className="stat-label">Total Quiz Attempts</span>
                </div>
              </div>
            </div>
          )}

          <div className="instructor-card instructor-form-card">
            <h3 className="instructor-card-title">Subjects</h3>
            {courseDetail.subjects.length === 0 ? (
              <p className="muted-text">No subjects in this course.</p>
            ) : (
              <ul className="analytics-list">
                {courseDetail.subjects.map((s) => (
                  <li key={s.id}>
                    <strong>{s.name}</strong>
                    {courseDetail.topicsBySubject[s.id]?.length > 0 && (
                      <ul style={{ marginTop: 6, paddingLeft: 20 }}>
                        {courseDetail.topicsBySubject[s.id].map((t) => (
                          <li key={t.id}>{t.title}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="instructor-card instructor-form-card">
            <h3 className="instructor-card-title">Quizzes Performance</h3>
            {courseDetail.quizzes.length === 0 ? (
              <p className="muted-text">No quizzes in this course.</p>
            ) : (
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Students Attempted</th>
                    <th>Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {courseDetail.quizzes.map((q) => {
                    const qAttempts = courseDetail.attempts.filter(a => a.quizId === q.id);
                    const qUnique = new Set(qAttempts.map(a => a.studentId)).size;
                    const qAvg = qAttempts.length > 0 ? (qAttempts.reduce((s, a) => s + (a.score || 0), 0) / qAttempts.length).toFixed(1) : 0;
                    return (
                      <tr key={q.id}>
                        <td>{q.title} (ID: {q.id})</td>
                        <td>{qUnique}</td>
                        <td>{qAvg}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="instructor-card instructor-form-card">
            <h3 className="instructor-card-title">Student Participation & Scores</h3>
            {courseDetail.attempts.length === 0 ? (
              <p className="muted-text">No quiz attempts yet for this course.</p>
            ) : (
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Quiz ID</th>
                    <th>Score %</th>
                    <th>Correct</th>
                    <th>Total</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {courseDetail.attempts.map((row, i) => (
                    <tr key={i}>
                      <td>{row.studentId}</td>
                      <td>{row.quizId}</td>
                      <td>{row.score}</td>
                      <td>{row.correctCount}</td>
                      <td>{row.totalQuestions}</td>
                      <td>{String(row.attemptTime || "").slice(0, 19)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {!selectedCourseId && table.length > 0 && (
        <div className="instructor-card instructor-form-card">
          <h3 className="instructor-card-title">All Attempts</h3>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Quiz ID</th>
                <th>Score %</th>
                <th>Correct</th>
                <th>Total</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => (
                <tr key={i}>
                  <td>{row.studentId}</td>
                  <td>{row.quizId}</td>
                  <td>{row.score}</td>
                  <td>{row.correctCount}</td>
                  <td>{row.totalQuestions}</td>
                  <td>{String(row.attemptTime || "").slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InstructorAnalytics;
