import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

function StudentQuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [startTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const studentId = localStorage.getItem("studentId") || localStorage.getItem("instructorId") || "1";

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const reviewAttemptId = searchParams.get('review');

  useEffect(() => {
    if (reviewAttemptId) {
      setLoading(true);
      API.get(`/student/attempts/${reviewAttemptId}/review`)
        .then(res => {
          setReviewData(res.data);
          setShowReview(true);
          setSubmitted(true);
          setResult({ 
            score: res.data.score, 
            correctCount: res.data.correctCount, 
            totalQuestions: res.data.totalQuestions, 
            timeSpentSeconds: 0, 
            attemptId: res.data.attemptId 
          });
          const targetQuizId = res.data.quizId || quizId;
          if (!targetQuizId) throw new Error("Quiz ID missing in review data");
          return API.get(`/student/quizzes/${targetQuizId}`);
        })
        .then(res => {
          setQuiz(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Review Load Error:", err);
          alert(err.message === "Quiz ID missing in review data" ? "Review data is incomplete." : "Failed to load review.");
          setLoading(false);
          navigate("/student/learn");
        });
    } else {
      API.get(`/student/quizzes/${quizId}`)
        .then((res) => {
          setQuiz(res.data);
          const initial = {};
          (res.data.questions || []).forEach((q) => { initial[q.id] = ""; });
          setAnswers(initial);
        })
        .catch(() => alert("Quiz not found"))
        .finally(() => setLoading(false));
    }
  }, [quizId, reviewAttemptId]);

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitQuiz = async () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await API.post("/student/quizzes/attempt", {
        quizId: Number(quizId),
        studentId: Number(studentId),
        answers,
        timeSpentSeconds: timeSpent,
      });
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit quiz");
    }
  };

  const fetchReview = async () => {
    const attemptId = result.id || result.attemptId;
    if (!result || !attemptId) return;
    try {
      const res = await API.get(`/student/attempts/${attemptId}/review`);
      setReviewData(res.data);
      setShowReview(true);
    } catch (err) {
      alert("Failed to load review");
    }
  };

  const getOptionsArray = (opts) => {
    if (!opts) return [];
    if (Array.isArray(opts)) return opts;
    if (typeof opts === 'string') {
      try {
        const parsed = JSON.parse(opts);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
      return opts.split('\n').filter(Boolean);
    }
    return [];
  };

  if (loading) return <div className="content-wrapper"><p>Loading quiz…</p></div>;
  if (!quiz) return <div className="content-wrapper"><p>Quiz not found.</p></div>;

  if (submitted && result) {
    if (showReview && reviewData) {
      return (
        <div className="student-learning-wrapper">
          <nav className="navbar">
            <div className="logo">SKILLFORGE</div>
            <div className="nav-buttons">
              <button className="register-btn" onClick={() => navigate("/student/learn")}>Back to Learning</button>
            </div>
          </nav>
          <div className="content-wrapper" style={{ padding: "24px 40px", maxWidth: 800, margin: "0 auto" }}>
            <div className="card wide">
              <h2>Quiz Review: {quiz.title}</h2>
              <p className="muted-text">Score: {reviewData.score.toFixed(1)}% ({reviewData.correctCount}/{reviewData.totalQuestions})</p>
              
              <div style={{ marginTop: 20 }}>
                {(reviewData.questions || []).map((q, idx) => (
                  <div key={q.questionId} className="quiz-question-block" style={{ padding: 16, border: "1px solid #e8ecf4", borderRadius: 8, marginBottom: 16, background: q.isCorrect ? "#f4fff8" : "#fff5f5" }}>
                    <p style={{ fontWeight: 600 }}>Q{idx + 1}. {q.questionText}</p>
                    <div className="quiz-options" style={{ marginBottom: 12 }}>
                      {getOptionsArray(q.options).map((opt, i) => {
                        const letter = opt.charAt(0);
                        let isSelected = q.userAnswer === letter;
                        let isCorrectOpt = q.correctAnswer === letter;
                        let bg = "transparent";
                        if (isCorrectOpt) bg = "#d4edda";
                        else if (isSelected && !q.isCorrect) bg = "#f8d7da";
                        
                        return (
                          <div key={i} style={{ padding: "8px 12px", background: bg, borderRadius: 4, marginBottom: 4, border: "1px solid #ddd" }}>
                            {opt} {isCorrectOpt && " (Correct)"} {isSelected && !isCorrectOpt && " (Your Answer)"}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div style={{ padding: 12, background: "#e9ecef", borderRadius: 4, fontSize: 14 }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button className="primary-btn" onClick={() => navigate("/student/learn")} style={{ marginTop: 20 }}>Finish Review</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="student-learning-wrapper">
        <nav className="navbar">
          <div className="logo">SKILLFORGE</div>
          <div className="nav-buttons">
            <button className="register-btn" onClick={() => navigate("/student/learn")}>Back to Learning</button>
          </div>
        </nav>
        <div className="content-wrapper" style={{ padding: 40, maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div className="card wide">
            <h2>Quiz Result</h2>
            <div className="result-score">{result.score != null ? result.score.toFixed(1) : "—"}%</div>
            <p>Correct: {result.correctCount} / {result.totalQuestions}</p>
            <p className="muted-text">Time: {result.timeSpentSeconds}s</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: 20 }}>
              <button className="primary-btn" onClick={() => navigate("/student/learn")}>Back to Learning</button>
              <button className="primary-btn" style={{ background: "#4bc0c0", borderColor: "#4bc0c0" }} onClick={fetchReview}>Review Answers</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  return (
    <div className="student-learning-wrapper">
      <nav className="navbar">
        <div className="logo">SKILLFORGE</div>
        <div className="nav-buttons">
          <button className="chip-btn" onClick={() => navigate("/student/learn")} style={{ padding: "8px 20px", fontSize: "14px", borderRadius: "8px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: "6px" }}></i> Exit
          </button>
        </div>
      </nav>
      <div className="content-wrapper" style={{ padding: "24px 40px", maxWidth: 700, margin: "0 auto" }}>
        <div className="card wide">
          <h2>{quiz.title}</h2>
          <p className="muted-text">Answer all questions and submit. Time: {Math.round((Date.now() - startTime) / 1000)}s</p>
          {questions.map((q, idx) => (
            <div key={q.id} className="quiz-question-block">
              <p><strong>Q{idx + 1}.</strong> {q.questionText}</p>
              <div className="quiz-options">
                {(q.options || []).map((opt, i) => {
                  const letter = opt.charAt(0);
                  return (
                    <label key={i} className="quiz-option-row">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === letter}
                        onChange={() => handleAnswer(q.id, letter)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="form-actions" style={{ marginTop: 24 }}>
            <button className="primary-btn" onClick={submitQuiz}>Submit Quiz</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentQuizAttempt;
