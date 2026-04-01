import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import StudentLayout from "./StudentLayout";

const API_BASE = "http://localhost:8080";

function StudentLearning() {
  const [courses, setCourses] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [completedTopicIds, setCompletedTopicIds] = useState(new Set());
  const [courseOverall, setCourseOverall] = useState(null); // { overallPercent, topic, quiz }
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const studentId = localStorage.getItem("studentId") || localStorage.getItem("instructorId") || "1";
  const studentName = localStorage.getItem("name") || "Student";
  const studentEmail = localStorage.getItem("email") || "";
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pre-select course when coming from Dashboard "Continue Learning"
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const fromCourse = params.get("courseId");
    const fromSubject = params.get("subjectId");
    if (fromCourse) {
      setSelectedCourseId(fromCourse);
    }
    if (fromSubject) {
      setSelectedSubjectId(fromSubject);
    }
  }, [location.search]);

  const loadCourses = () => {
    API.get("/student/courses").then((res) => setCourses(res.data)).catch(() => setCourses([]));
  };
  const loadSuggestions = () => {
    API.get(`/student/suggestions?studentId=${studentId}`).then((res) => setSuggestions(res.data || [])).catch(() => setSuggestions([]));
  };
  const loadAttempts = () => {
    API.get(`/student/attempts?studentId=${studentId}`).then((res) => setAttempts(res.data || [])).catch(() => setAttempts([]));
  };
  const loadCompletedTopics = () => {
    API.get(`/student/topic-progress?studentId=${studentId}`)
      .then((res) => setCompletedTopicIds(new Set(res.data || [])))
      .catch(() => setCompletedTopicIds(new Set()));
  };

  useEffect(() => {
    loadCourses();
    loadSuggestions();
    loadAttempts();
    loadCompletedTopics();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setSubjects([]);
      setSelectedSubjectId("");
      setTopics([]);
      setCourseOverall(null);
      return;
    }
    API.get(`/student/subjects?courseId=${selectedCourseId}`).then((res) => setSubjects(res.data || [])).catch(() => setSubjects([]));
    // If a subjectId is provided in URL, keep it; otherwise reset.
    const params = new URLSearchParams(location.search || "");
    const fromSubject = params.get("subjectId");
    setSelectedSubjectId(fromSubject || "");
    setTopics([]);
  }, [selectedCourseId]);

  // Compute overall course progress (topics + quiz attempts) as soon as a course is selected
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseOverall(null);
      return;
    }
    Promise.all([
      API.get(`/student/subjects?courseId=${selectedCourseId}`).then((r) => r.data || []).catch(() => []),
      API.get(`/student/quizzes?courseId=${selectedCourseId}`).then((r) => r.data || []).catch(() => []),
    ])
      .then(([subs, quizzes]) => {
        const topicPromises = (subs || []).map((s) =>
          API.get(`/student/topics?subjectId=${s.id}`).then((tRes) => tRes.data || []).catch(() => [])
        );
        return Promise.all(topicPromises).then((topicsArrays) => {
          const topics = topicsArrays.flat();
          const topicIds = topics.map((t) => t.id);
          const completedTopics = topicIds.filter((id) => completedTopicIds.has(id)).length;
          const totalTopicsCourse = topicIds.length;
          const topicPercent = totalTopicsCourse > 0 ? Math.round((completedTopics / totalTopicsCourse) * 100) : 0;

          const quizIds = (quizzes || []).map((q) => q.id);
          const attemptedQuizIds = new Set((attempts || []).map((a) => a.quizId));
          const attemptedQuizzes = quizIds.filter((id) => attemptedQuizIds.has(id)).length;
          const totalQuizzesCourse = quizIds.length;
          const quizPercent = totalQuizzesCourse > 0 ? Math.round((attemptedQuizzes / totalQuizzesCourse) * 100) : 0;

          const parts = [];
          if (totalTopicsCourse > 0) parts.push(topicPercent);
          if (totalQuizzesCourse > 0) parts.push(quizPercent);
          const overallPercent = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;

          setCourseOverall({
            overallPercent,
            topic: { completed: completedTopics, total: totalTopicsCourse, percent: topicPercent },
            quiz: { attempted: attemptedQuizzes, total: totalQuizzesCourse, percent: quizPercent },
          });
        });
      })
      .catch(() => setCourseOverall(null));
  }, [selectedCourseId, completedTopicIds, attempts]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setTopics([]);
      return;
    }
    API.get(`/student/topics?subjectId=${selectedSubjectId}`).then((res) => setTopics(res.data || [])).catch(() => setTopics([]));
  }, [selectedSubjectId]);

  useEffect(() => {
    if (topics.length > 0) {
      const params = new URLSearchParams(location.search);
      const tId = params.get("topicId");
      if (tId) {
        setTimeout(() => {
          const el = document.getElementById(`topic-${tId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.style.backgroundColor = "rgba(0, 0, 0, 0.06)";
            setTimeout(() => { el.style.backgroundColor = "transparent"; }, 2000);
          }
        }, 100);
      }
    }
  }, [topics, location.search]);

  useEffect(() => {
    const t = setInterval(() => loadAttempts(), 8000);
    return () => clearInterval(t);
  }, []);

  const markTopicComplete = (topicId) => {
    API.post(`/student/topic-complete?studentId=${studentId}&topicId=${topicId}`)
      .then(() => {
        setCompletedTopicIds((prev) => new Set([...prev, topicId]));
        loadSuggestions();
      })
      .catch(() => {});
  };

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0 ? attempts.reduce((s, a) => s + (a.score || 0), 0) / totalAttempts : 0;
  const totalTopics = topics.length;
  const completedInView = topics.filter((t) => completedTopicIds.has(t.id)).length;
  const progressPercent = totalTopics > 0 ? Math.round((completedInView / totalTopics) * 100) : 0;

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <StudentLayout activeKey="/student/learn">
      <div className="content-wrapper" style={{ padding: "24px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="content-header">
          <h2>Adaptive Learning</h2>
          <p>Browse courses, complete topics, and take quizzes. Your progress guides suggestions.</p>
        </div>

        <div className={`progress-section card wide ${(courseOverall?.overallPercent ?? progressPercent) < 40 ? "progress-low" : (courseOverall?.overallPercent ?? progressPercent) < 75 ? "progress-mid" : "progress-high"}`}>
          <h3>Your Progress</h3>
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${courseOverall?.overallPercent ?? progressPercent}%` }} />
          </div>
          <p className="muted-text">
            {selectedCourseId && courseOverall ? (
              <>
                Course progress:{" "}
                <strong>{courseOverall.overallPercent}%</strong>{" "}
                (Topics {courseOverall.topic.total ? `${courseOverall.topic.completed}/${courseOverall.topic.total}` : "—"} ·
                {" "}Quizzes {courseOverall.quiz.total ? `${courseOverall.quiz.attempted}/${courseOverall.quiz.total}` : "—"})
                {selectedSubjectId && (
                  <>
                    {" "}· Selected subject: <strong>{progressPercent}%</strong> ({completedInView}/{totalTopics} topics)
                  </>
                )}
              </>
            ) : (
              <>
                Topic completion (selected subject): <strong>{completedInView}</strong> / <strong>{totalTopics}</strong> ({progressPercent}%)
              </>
            )}
            {" "}· Quiz attempts: <strong>{totalAttempts}</strong> · Avg score: <strong>{totalAttempts > 0 ? avgScore.toFixed(1) : "—"}%</strong>
          </p>
        </div>

        {(() => {
          const filteredSuggestions = selectedCourseId
            ? suggestions.filter(s => s.courseId === Number(selectedCourseId))
            : suggestions;
            
          if (filteredSuggestions.length === 0) return null;

          return (
            <div className="card wide">
              <h3>{selectedCourseId ? "Suggested for this Course" : "Suggested for You"}</h3>
              <div className="suggestions-grid">
                {filteredSuggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="suggestion-card">
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <span className="course-badge">{s.type}</span>
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
                    {s.courseName && !selectedCourseId && <p className="muted-text" style={{ fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>{s.courseName}</p>}
                    <p className="muted-text" style={{ fontSize: "14px", marginBottom: "16px" }}>{s.reason}</p>
                    
                    {s.type === "QUIZ" ? (
                      <button className="primary-btn btn-medium" onClick={() => navigate(`/student/quiz/${s.id}`)}>Take Quiz</button>
                    ) : (
                      <button
                        className="primary-btn btn-medium"
                        onClick={() => {
                          if (s.type === "TOPIC" && s.courseId && s.subjectId) {
                            navigate(`/student/learn?courseId=${s.courseId}&subjectId=${s.subjectId}&topicId=${s.id}`);
                            return;
                          }
                          if (s.type === "COURSE" && (s.courseId || s.id)) {
                            navigate(`/student/learn?courseId=${s.courseId || s.id}`);
                            return;
                          }
                          navigate("/student/learn");
                        }}
                      >
                        {s.type === "TOPIC" ? "Go to Topic" : "Browse Content"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="card wide">
          <h3>Browse Content</h3>
          <div className="form-grid two-cols">
            <div>
              <label>Course</label>
              <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                <option value="">Choose course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Subject</label>
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={!selectedCourseId}>
                <option value="">Choose subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          {topics.length > 0 && (
            <table className="styled-table" style={{ marginTop: 16 }}>
              <thead>
                <tr><th>Topic</th><th>Resources</th><th></th></tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.id} id={`topic-${t.id}`} style={{ transition: "background-color 0.5s ease" }}>
                    <td>{t.title}</td>
                    <td>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        {(t.videoUrl || t.youtubeUrl) && (
                          <a
                            href={t.videoUrl ? `${API_BASE}${t.videoUrl}` : t.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="chip-btn"
                            style={{ textDecoration: "none", fontSize: "13px", padding: "6px 12px", borderRadius: "16px", background: "#f0f4fc", color: "#023293" }}
                          >
                            🎬 Video
                          </a>
                        )}
                        {t.pdfUrl && (
                          <a 
                            href={`${API_BASE}${t.pdfUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="chip-btn"
                            style={{ textDecoration: "none", fontSize: "13px", padding: "6px 12px", borderRadius: "16px", background: "#fff5f5", color: "#c53030" }}
                          >
                            📄 PDF
                          </a>
                        )}
                        {t.externalLink && (
                          <a 
                            href={t.externalLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="chip-btn"
                            style={{ textDecoration: "none", fontSize: "13px", padding: "6px 12px", borderRadius: "16px", background: "#f4f4f4", color: "#333" }}
                          >
                            🔗 Link
                          </a>
                        )}
                        {!t.videoUrl && !t.youtubeUrl && !t.pdfUrl && !t.externalLink && <span className="muted-text">—</span>}
                      </div>
                    </td>
                    <td>
                      {completedTopicIds.has(t.id) ? (
                        <span className="topic-complete-badge">Done</span>
                      ) : (
                        <button className="action-btn-instructor btn-sm" onClick={() => markTopicComplete(t.id)}>Mark complete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card wide">
          <h3>Quizzes</h3>
          <p className="muted-text">Select a course to see available quizzes, or use Suggested for You above.</p>
          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={{ maxWidth: 300, marginTop: 8 }}>
            <option value="">Choose course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {selectedCourseId && <QuizList courseId={selectedCourseId} navigate={navigate} attempts={attempts} />}
        </div>
      </div>
    </StudentLayout>
  );
}

function QuizList({ courseId, navigate, attempts }) {
  const [quizzes, setQuizzes] = useState([]);
  useEffect(() => {
    API.get(`/student/quizzes?courseId=${courseId}`).then((res) => setQuizzes(res.data || [])).catch(() => setQuizzes([]));
  }, [courseId]);
  if (quizzes.length === 0) return <p className="muted-text" style={{ marginTop: 12 }}>No quizzes in this course.</p>;
  const attempted = new Set((attempts || []).map((a) => a.quizId));
  return (
    <ul className="quiz-list-simple" style={{ marginTop: 12 }}>
      {quizzes.map((q) => {
        const quizAttempts = (attempts || []).filter(a => a.quizId === q.id).sort((a, b) => (b.attemptId || b.id) - (a.attemptId || a.id));
        const latestAttempt = quizAttempts.length > 0 ? quizAttempts[0] : null;
        
        return (
          <li key={q.id}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, marginRight: "12px", overflow: "hidden" }}>
              <span style={{ whiteSpace: "normal" }}>{q.title}</span>
              {q.difficultyLevel && (
                <span className={`course-progress-pill ${q.difficultyLevel === 'ADVANCED' ? "pill-red" : q.difficultyLevel === 'INTERMEDIATE' ? "pill-yellow" : "pill-green"}`} style={{ alignSelf: "flex-start", fontSize: "11px", padding: "2px 8px" }}>
                  {q.difficultyLevel}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "nowrap", flexShrink: 0, alignItems: "center" }}>
              <button
                className="primary-btn btn-medium"
                style={{ 
                  whiteSpace: "nowrap", 
                  padding: "10px 20px", 
                  minWidth: "125px", 
                  fontSize: "14px",
                  fontWeight: "600" 
                }}
                onClick={() => navigate(`/student/quiz/${q.id}`)}
              >
                {latestAttempt ? "Retake Quiz" : "Take Quiz"}
              </button>
              {latestAttempt && (latestAttempt.attemptId || latestAttempt.id) && (
                <button
                  className="primary-btn btn-medium"
                  style={{ 
                    background: "#4bc0c0", 
                    borderColor: "#4bc0c0", 
                    whiteSpace: "nowrap", 
                    padding: "10px 20px", 
                    minWidth: "100px",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}
                  onClick={() => navigate(`/student/quiz/${q.id}?review=${latestAttempt.attemptId || latestAttempt.id}`)}
                >
                  Review
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default StudentLearning;
