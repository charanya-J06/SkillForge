import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

function InstructorQuizzes() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateTopic = location.state?.topicTitle || "";
  const stateCourseId = location.state?.courseId ? String(location.state.courseId) : "";

  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(stateCourseId || "");
  const [generateForm, setGenerateForm] = useState({
    topic: stateTopic || "",
    title: stateTopic ? `Quiz: ${stateTopic}` : "",
    numQuestions: 5,
    difficultyLevel: "BEGINNER",
 });
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualQuiz, setManualQuiz] = useState({
    title: "",
    questions: [
      {
        questionText: "",
        options: ["A) ", "B) ", "C) ", "D) "],
        correctAnswer: "A",
        questionType: "MCQ",
      },
    ],
  });

  const instructorId = localStorage.getItem("instructorId") || 1;

  const loadCourses = async () => {
    try {
      const res = await API.get(`/instructor/courses?instructorId=${instructorId}`);
      setCourses(res.data);
      if (res.data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(String(res.data[0].id));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load courses");
    }
  };

  const loadQuizzes = async () => {
    if (!selectedCourseId) return;
    try {
      const res = await API.get(`/instructor/quizzes?courseId=${selectedCourseId}`);
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
      setQuizzes([]);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (stateCourseId && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(stateCourseId);
    }
  }, [courses, stateCourseId]);

  useEffect(() => {
    if (selectedCourseId) loadQuizzes();
    else setQuizzes([]);
  }, [selectedCourseId]);

  const handleGenerateChange = (e) => {
    setGenerateForm({ ...generateForm, [e.target.name]: e.target.value });
  };

  const updateGeneratedQuestion = (idx, patch) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  };

  const generateQuiz = async () => {
    if (!generateForm.topic.trim()) {
      alert("Enter a topic for the quiz");
      return;
    }
    if (!selectedCourseId) {
      alert("Select a course first");
      return;
    }
    setGenerateError("");
    setGenerating(true);
    try {
      const res = await API.post("/instructor/quizzes/generate", {
        topic: generateForm.topic,
        courseId: Number(selectedCourseId),
        title: generateForm.title || `Quiz: ${generateForm.topic}`,
        numQuestions: Number(generateForm.numQuestions) || 5,
        difficultyLevel: generateForm.difficultyLevel || "BEGINNER",
      });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setGeneratedQuestions(res.data);
      } else {
        setGenerateError("AI did not return valid questions. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setGenerateError("Quiz generation failed. Check your API key and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const saveQuiz = async () => {
    if (!generatedQuestions || generatedQuestions.length === 0) {
      alert("Generate questions first");
      return;
    }
    if (!selectedCourseId) return;
    setSaving(true);
    try {
      await API.post("/instructor/quizzes", {
        title: generateForm.title || `Quiz: ${generateForm.topic}`,
        courseId: Number(selectedCourseId),
        generatedByAi: true,
        questions: generatedQuestions,
      });
      setGeneratedQuestions(null);
      setGenerateForm({ topic: "", title: "", numQuestions: 5, difficultyLevel: "BEGINNER" });
      loadQuizzes();
    } catch (err) {
      console.error(err);
      alert("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  const openQuiz = async (id) => {
    try {
      const res = await API.get(`/instructor/quizzes/${id}`);
      setSelectedQuiz(res.data);
    } catch (e) {
      alert("Failed to load quiz");
    }
  };

  const closeQuiz = () => setSelectedQuiz(null);

  const startManual = () => {
    setManualMode(true);
    setGeneratedQuestions(null);
    setGenerateError("");
    setManualQuiz({
      title: generateForm.title || `Manual Quiz: ${generateForm.topic || "Untitled"}`,
      questions: [
        {
          questionText: "",
          options: ["A) ", "B) ", "C) ", "D) "],
          correctAnswer: "A",
          questionType: "MCQ",
        },
      ],
    });
  };

  const addManualQuestion = () => {
    setManualQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: "",
          options: ["A) ", "B) ", "C) ", "D) "],
          correctAnswer: "A",
          questionType: "MCQ",
        },
      ],
    }));
  };

  const updateManualQuestion = (idx, patch) => {
    setManualQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    }));
  };

  const saveManualQuiz = async () => {
    if (!selectedCourseId) return;
    if (!manualQuiz.title.trim()) {
      alert("Enter quiz title");
      return;
    }
    const invalid = manualQuiz.questions.some(
      (q) =>
        !q.questionText.trim() ||
        !q.options ||
        q.options.length !== 4 ||
        q.options.some((o) => !o.trim())
    );
    if (invalid) {
      alert("Fill all manual questions and 4 options each.");
      return;
    }
    setSaving(true);
    try {
      await API.post("/instructor/quizzes", {
        title: manualQuiz.title,
        courseId: Number(selectedCourseId),
        generatedByAi: false,
        questions: manualQuiz.questions,
      });
      setManualMode(false);
      setManualQuiz({ title: "", questions: [] });
      loadQuizzes();
    } catch (e) {
      alert("Failed to save manual quiz");
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await API.delete(`/instructor/quizzes/${id}`);
      loadQuizzes();
    } catch (err) {
      console.error(err);
      alert("Failed to delete quiz");
    }
  };

  const clearGenerated = () => {
    setGeneratedQuestions(null);
  };

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>AI-Generated Quizzes</h2>
        <p>Enter a topic and generate MCQ questions using AI. Review and save to assign to students.</p>
      </div>

      <div className="instructor-card instructor-form-card">
        <h3 className="instructor-card-title">Select Course</h3>
        <div className="form-grid">
          <div>
            <label>Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="form-input"
            >
              <option value="">Choose a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="instructor-card instructor-form-card">
        <h3 className="instructor-card-title">Generate Quiz</h3>
        <div className="form-grid two-cols form-grid-gap">
          <div>
            <label>Topic</label>
            <input
              name="topic"
              placeholder="e.g., Java OOP, React Hooks"
              value={generateForm.topic}
              onChange={handleGenerateChange}
              className="form-input"
            />
          </div>
          <div>
            <label>Quiz Title (optional)</label>
            <input
              name="title"
              placeholder="e.g., OOP Basics Quiz"
              value={generateForm.title}
              onChange={handleGenerateChange}
              className="form-input"
            />
          </div>
          <div>
            <label>Number of Questions</label>
            <select
              name="numQuestions"
              value={generateForm.numQuestions}
              onChange={handleGenerateChange}
              className="form-input"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
          <div>
            <label>Difficulty Level</label>
            <select
              name="difficultyLevel"
              value={generateForm.difficultyLevel}
              onChange={handleGenerateChange}
              className="form-input"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div className="form-actions">
            <div className="quiz-actions-row">
              <button
                className="primary-btn btn-medium"
                onClick={generateQuiz}
                disabled={generating}
              >
                {generating ? "Generating…" : "Generate with AI"}
              </button>
              <button
                className="action-btn-instructor action-btn-secondary"
                onClick={startManual}
                type="button"
              >
                Create Manually
              </button>
            </div>
          </div>
        </div>
        {generateError && <p className="login-error" style={{ marginTop: 12 }}>{generateError}</p>}
      </div>

      {manualMode && (
        <div className="instructor-card instructor-form-card">
          <h3 className="instructor-card-title">Manual Quiz Builder</h3>
          <div className="form-grid form-grid-gap">
            <div>
              <label>Quiz Title</label>
              <input
                className="form-input"
                value={manualQuiz.title}
                onChange={(e) => setManualQuiz({ ...manualQuiz, title: e.target.value })}
              />
            </div>
          </div>
          <div className="quiz-preview-list" style={{ marginTop: 16 }}>
            {manualQuiz.questions.map((q, idx) => (
              <div key={idx} className="quiz-preview-item">
                <strong>Q{idx + 1}.</strong>
                <input
                  className="form-input"
                  style={{ marginTop: 10 }}
                  placeholder="Enter question"
                  value={q.questionText}
                  onChange={(e) => updateManualQuestion(idx, { questionText: e.target.value })}
                />
                <div className="manual-options-grid">
                  {q.options.map((opt, i) => (
                    <input
                      key={i}
                      className="form-input"
                      placeholder={["A)", "B)", "C)", "D)"][i] + " option"}
                      value={opt}
                      onChange={(e) => {
                        const next = [...q.options];
                        next[i] = e.target.value;
                        updateManualQuestion(idx, { options: next });
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <label>Correct Answer</label>
                  <select
                    className="form-input"
                    value={q.correctAnswer}
                    onChange={(e) => updateManualQuestion(idx, { correctAnswer: e.target.value })}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="instructor-card-actions" style={{ marginTop: 14 }}>
            <button className="action-btn-instructor" type="button" onClick={addManualQuestion}>
              + Add Question
            </button>
            <button className="action-btn-instructor" type="button" onClick={saveManualQuiz} disabled={saving}>
              {saving ? "Saving…" : "Save Manual Quiz"}
            </button>
            <button className="action-btn-instructor action-btn-secondary" type="button" onClick={() => setManualMode(false)} style={{ padding: "10px 24px", fontSize: "14px", borderRadius: "8px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {generatedQuestions && generatedQuestions.length > 0 && (
        <div className="instructor-card instructor-form-card">
          <h3 className="instructor-card-title">Review & Save</h3>
          <p className="muted-text">
            Review the generated questions below, then save to add this quiz to the course.
          </p>
          <div className="quiz-preview-list">
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="quiz-preview-item">
                <strong>Q{idx + 1}.</strong>
                <input
                  className="form-input"
                  style={{ marginTop: 10 }}
                  value={q.questionText}
                  onChange={(e) => updateGeneratedQuestion(idx, { questionText: e.target.value })}
                />
                <div className="manual-options-grid" style={{ marginTop: 10 }}>
                  {(q.options || []).map((opt, i) => (
                    <input
                      key={i}
                      className="form-input"
                      value={opt}
                      onChange={(e) => {
                        const next = [...q.options];
                        next[i] = e.target.value;
                        updateGeneratedQuestion(idx, { options: next });
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <label>Correct Answer</label>
                  <select
                    className="form-input"
                    value={q.correctAnswer}
                    onChange={(e) => updateGeneratedQuestion(idx, { correctAnswer: e.target.value })}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button className="primary-btn" onClick={saveQuiz} disabled={saving}>
              {saving ? "Saving…" : "Save Quiz"}
            </button>
            <button className="chip-btn" onClick={clearGenerated} style={{ padding: "8px 20px", fontSize: "14px", borderRadius: "8px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="instructor-card instructor-form-card">
        <h3 className="instructor-card-title">Quizzes in Selected Course</h3>
        {!selectedCourseId ? (
          <p className="muted-text">Select a course to see quizzes.</p>
        ) : quizzes.length === 0 ? (
          <p className="muted-text">No quizzes yet. Generate one above.</p>
        ) : (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>AI Generated</th>
                <th>Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <button type="button" className="table-link-btn" onClick={() => openQuiz(q.id)}>
                      {q.title}
                    </button>
                  </td>
                  <td>
                    <span className={`course-progress-pill ${q.difficultyLevel === 'ADVANCED' ? "pill-red" : q.difficultyLevel === 'INTERMEDIATE' ? "pill-yellow" : "pill-green"}`} style={{ fontSize: "11px", padding: "2px 8px" }}>
                      {q.difficultyLevel || "BEGINNER"}
                    </span>
                  </td>
                  <td>{q.generatedByAi ? "Yes" : "No"}</td>
                  <td>{q.questions ? q.questions.length : 0}</td>
                  <td>
                    <button
                      className="action-btn-instructor action-btn-danger"
                      onClick={() => deleteQuiz(q.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedQuiz && (
        <div className="instructor-card instructor-form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h3 className="instructor-card-title" style={{ marginBottom: 0 }}>
              Quiz Preview: {selectedQuiz.title}
            </h3>
            <button type="button" className="action-btn-instructor action-btn-secondary" onClick={closeQuiz}>
              Close
            </button>
          </div>
          <div className="quiz-preview-list" style={{ marginTop: 16 }}>
            {(selectedQuiz.questions || []).map((q, idx) => (
              <div key={q.id || idx} className="quiz-preview-item">
                <strong>Q{idx + 1}.</strong> {q.questionText}
                <ul>
                  {(q.options || []).map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
                <span className="correct-badge">Correct: {q.correctAnswer}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorQuizzes;
