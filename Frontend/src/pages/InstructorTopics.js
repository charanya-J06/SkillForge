// src/pages/InstructorTopics.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

const API_BASE = "http://localhost:8080";

function InstructorTopics() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [videoMode, setVideoMode] = useState("upload"); // "upload" | "youtube"
  const [topicForm, setTopicForm] = useState({
    title: "",
    externalLink: "",
    youtubeUrl: "",
    video: null,
    pdf: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [editVideoMode, setEditVideoMode] = useState("upload");
  const [editForm, setEditForm] = useState({ title: "", externalLink: "", youtubeUrl: "", video: null, pdf: null });

  const instructorId = localStorage.getItem("instructorId") || 1;
  const location = useLocation();
  const navigate = useNavigate();

  const loadCourses = async () => {
    try {
      const res = await API.get(
        `/instructor/courses?instructorId=${instructorId}`
      );
      setCourses(res.data || []);
      const params = new URLSearchParams(location.search);
      const subjectIdFromUrl = params.get("subjectId");
      const courseIdFromUrl = params.get("courseId");
      if (subjectIdFromUrl) setSelectedSubjectId(subjectIdFromUrl);
      if (courseIdFromUrl) setSelectedCourseId(courseIdFromUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjects = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await API.get(
        `/instructor/subjects?courseId=${courseId}`
      );
      setSubjects(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTopics = async (subjectId) => {
    if (!subjectId) return;
    try {
      const res = await API.get(
        `/instructor/topics?subjectId=${subjectId}`
      );
      setTopics(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load topics");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadSubjects(selectedCourseId);
      setSelectedSubjectId((prev) => (prev ? prev : ""));
      setTopics([]);
    } else {
      setSubjects([]);
      setTopics([]);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedSubjectId) loadTopics(selectedSubjectId);
    else setTopics([]);
  }, [selectedSubjectId]);


  const handleTextChange = (e) => {
    setTopicForm({ ...topicForm, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setTopicForm({ ...topicForm, [e.target.name]: e.target.files[0] });
  };

  const createTopic = async () => {
    if (!selectedSubjectId) {
      alert("Select a subject first");
      return;
    }
    if (!topicForm.title.trim()) {
      alert("Topic title is required");
      return;
    }
    const formData = new FormData();
    formData.append("title", topicForm.title);
    formData.append("subjectId", selectedSubjectId);
    if (videoMode === "upload" && topicForm.video) formData.append("video", topicForm.video);
    if (videoMode === "youtube" && topicForm.youtubeUrl) formData.append("youtubeUrl", topicForm.youtubeUrl);
    if (topicForm.pdf) formData.append("pdf", topicForm.pdf);
    if (topicForm.externalLink) formData.append("externalLink", topicForm.externalLink);
    try {
      await API.post("/instructor/topics", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVideoMode("upload");
      setTopicForm({ title: "", externalLink: "", youtubeUrl: "", video: null, pdf: null });
      loadTopics(selectedSubjectId);
    } catch (err) {
      console.error(err);
      alert("Failed to create topic");
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    const mode = t.youtubeUrl ? "youtube" : "upload";
    setEditVideoMode(mode);
    setEditForm({ title: t.title, externalLink: t.externalLink || "", youtubeUrl: t.youtubeUrl || "", video: null, pdf: null });
  };

  const saveEdit = async (id) => {
    try {
      const fd = new FormData();
      fd.append("title", editForm.title);
      fd.append("externalLink", editForm.externalLink || "");
      fd.append("youtubeUrl", editVideoMode === "youtube" ? (editForm.youtubeUrl || "") : "");
      if (editVideoMode === "upload" && editForm.video) fd.append("video", editForm.video);
      if (editForm.pdf) fd.append("pdf", editForm.pdf);
      await API.put(`/instructor/topics/${id}/materials`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditingId(null);
      loadTopics(selectedSubjectId);
    } catch (err) {
      console.error(err);
      alert("Failed to update topic");
    }
  };

  const cancelEdit = () => setEditingId(null);

  const deleteTopic = async (id) => {
    if (!window.confirm("Delete this topic?")) return;
    try {
      await API.delete(`/instructor/topics/${id}`);
      loadTopics(selectedSubjectId);
    } catch (err) {
      console.error(err);
      alert("Failed to delete topic");
    }
  };

  const goToCreateQuiz = (topicTitle) => {
    navigate("/instructor/quizzes", {
      state: {
        topicTitle,
        courseId: selectedCourseId,
      },
    });
  };

  const selectedSubject = subjects.find((s) => String(s.id) === String(selectedSubjectId));
  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>Manage Topics & Materials</h2>
        <p>Select course and subject, then add topics with videos, PDFs, or links.</p>
      </div>

      <div className="instructor-card instructor-form-card">
        <h3 className="instructor-card-title">Select Course & Subject</h3>
        <div className="form-grid two-cols form-grid-gap">
          <div>
            <label>Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="form-input"
            >
              <option value="">Choose course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="form-input"
              disabled={!selectedCourseId}
            >
              <option value="">Choose subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedSubjectId && (
        <>
          <div className="instructor-card instructor-form-card add-topic-card">
            <h3 className="instructor-card-title">Add Topic</h3>
            <div className="form-grid form-grid-gap">
              <div>
                <label>Topic Title</label>
                <input
                  name="title"
                  placeholder="e.g., Classes & Objects"
                  value={topicForm.title}
                  onChange={handleTextChange}
                  className="form-input"
                />
              </div>
              <div>
                <label>External Link (optional)</label>
                <input
                  name="externalLink"
                  placeholder="https://..."
                  value={topicForm.externalLink}
                  onChange={handleTextChange}
                  className="form-input"
                />
              </div>
              <div>
                <label>Video (optional)</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="radio"
                      name="videoMode"
                      checked={videoMode === "upload"}
                      onChange={() => {
                        setVideoMode("upload");
                        setTopicForm((p) => ({ ...p, youtubeUrl: "" }));
                      }}
                    />
                    Upload
                  </label>
                  <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="radio"
                      name="videoMode"
                      checked={videoMode === "youtube"}
                      onChange={() => {
                        setVideoMode("youtube");
                        setTopicForm((p) => ({ ...p, video: null }));
                      }}
                    />
                    YouTube URL
                  </label>
                </div>

                {videoMode === "upload" ? (
                  <input
                    type="file"
                    name="video"
                    accept="video/*"
                    onChange={handleFileChange}
                  />
                ) : (
                  <input
                    name="youtubeUrl"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={topicForm.youtubeUrl}
                    onChange={handleTextChange}
                    className="form-input"
                  />
                )}
              </div>
              <div>
                <label>PDF (optional)</label>
                <input
                  type="file"
                  name="pdf"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
              </div>
              <div className="form-actions">
                <button className="primary-btn btn-medium" onClick={createTopic}>
                  Add Topic
                </button>
              </div>
            </div>
          </div>

          <div className="content-header content-header-centered">
            <h2>Topics in {selectedSubject?.name || "Subject"}</h2>
            <p>Edit, delete, or create a quiz from a topic.</p>
          </div>

          {topics.length === 0 ? (
            <div className="instructor-empty-msg">No topics yet. Add one above.</div>
          ) : (
            <div className="instructor-topics-list">
              {topics.map((t) => (
                <div key={t.id} className="instructor-topic-card">
                  {editingId === t.id ? (
                    <div className="instructor-topic-edit">
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="form-input"
                        placeholder="Title"
                      />
                      <input
                        value={editForm.externalLink}
                        onChange={(e) => setEditForm({ ...editForm, externalLink: e.target.value })}
                        className="form-input"
                        placeholder="External link"
                      />
                      <div style={{ marginTop: 8 }}>
                        <label style={{ display: "block", marginBottom: 6 }}>Video source</label>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                          <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                            <input
                              type="radio"
                              name={`editVideoMode-${t.id}`}
                              checked={editVideoMode === "upload"}
                              onChange={() => {
                                setEditVideoMode("upload");
                                setEditForm((p) => ({ ...p, youtubeUrl: "" }));
                              }}
                            />
                            Upload
                          </label>
                          <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                            <input
                              type="radio"
                              name={`editVideoMode-${t.id}`}
                              checked={editVideoMode === "youtube"}
                              onChange={() => {
                                setEditVideoMode("youtube");
                                setEditForm((p) => ({ ...p, video: null }));
                              }}
                            />
                            YouTube URL
                          </label>
                        </div>
                        {editVideoMode === "youtube" ? (
                          <input
                            value={editForm.youtubeUrl}
                            onChange={(e) => setEditForm({ ...editForm, youtubeUrl: e.target.value })}
                            className="form-input"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                        ) : null}
                      </div>
                      <div className="topic-edit-files">
                        <div>
                          <label>Replace Video (optional)</label>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setEditForm({ ...editForm, video: e.target.files?.[0] || null })}
                            disabled={editVideoMode === "youtube"}
                          />
                        </div>
                        <div>
                          <label>Replace PDF (optional)</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setEditForm({ ...editForm, pdf: e.target.files?.[0] || null })}
                          />
                        </div>
                      </div>
                      <div className="instructor-card-actions">
                        <button className="action-btn-instructor" onClick={() => saveEdit(t.id)}>Save</button>
                        <button className="action-btn-instructor action-btn-secondary" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="instructor-topic-card-main">
                        <h3 className="instructor-topic-card-title">{t.title}</h3>
                        <div className="instructor-topic-links">
                          {(t.videoUrl || t.youtubeUrl) && (
                            <a
                              href={t.videoUrl ? `${API_BASE}${t.videoUrl}` : t.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Video
                            </a>
                          )}
                          {t.pdfUrl && (
                            <a href={`${API_BASE}${t.pdfUrl}`} target="_blank" rel="noreferrer">PDF</a>
                          )}
                          {t.externalLink && (
                            <a href={t.externalLink} target="_blank" rel="noreferrer">Link</a>
                          )}
                        {!t.videoUrl && !t.youtubeUrl && !t.pdfUrl && !t.externalLink && (
                            <span className="muted-text">No resources</span>
                          )}
                        </div>
                      </div>
                      <div className="instructor-card-actions instructor-topic-actions">
                        <button className="action-btn-instructor" onClick={() => startEdit(t)}>Edit</button>
                        <button className="action-btn-instructor" onClick={() => goToCreateQuiz(t.title)}>
                          Create Quiz
                        </button>
                        <button className="action-btn-instructor action-btn-danger" onClick={() => deleteTopic(t.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InstructorTopics;
