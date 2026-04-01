// src/pages/InstructorSubjects.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

function InstructorSubjects() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const instructorId = localStorage.getItem("instructorId") || 1;
  const navigate = useNavigate();
  const location = useLocation();

  const loadCourses = async () => {
    try {
      const res = await API.get(
        `/instructor/courses?instructorId=${instructorId}`
      );
      setCourses(res.data || []);
      const params = new URLSearchParams(location.search);
      const courseIdFromUrl = params.get("courseId");
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
      alert("Failed to load subjects");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) loadSubjects(selectedCourseId);
    else setSubjects([]);
  }, [selectedCourseId]);

  const createSubject = async () => {
    if (!selectedCourseId) {
      alert("Select a course first");
      return;
    }
    if (!subjectName.trim()) {
      alert("Subject name is required");
      return;
    }
    try {
      await API.post("/instructor/subjects", {
        name: subjectName,
        courseId: selectedCourseId,
      });
      setSubjectName("");
      loadSubjects(selectedCourseId);
    } catch (err) {
      console.error(err);
      alert("Failed to create subject");
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const saveEdit = async (id) => {
    try {
      await API.put(`/instructor/subjects/${id}`, { name: editName });
      setEditingId(null);
      loadSubjects(selectedCourseId);
    } catch (err) {
      console.error(err);
      alert("Failed to update subject");
    }
  };

  const cancelEdit = () => setEditingId(null);

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete this subject? Topics under it may also be removed.")) return;
    try {
      await API.delete(`/instructor/subjects/${id}`);
      loadSubjects(selectedCourseId);
    } catch (err) {
      console.error(err);
      alert("Failed to delete subject");
    }
  };

  const goToTopics = (subjectId) => {
    navigate(`/instructor/topics?subjectId=${subjectId}&courseId=${selectedCourseId}`);
  };

  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>Manage Subjects</h2>
        <p>Select a course and manage the subjects inside it.</p>
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
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCourseId && (
        <>
          <div className="instructor-card instructor-form-card">
            <h3 className="instructor-card-title">Add Subject</h3>
            <div className="form-grid form-grid-gap">
              <div>
                <label>Subject Name</label>
                <input
                  placeholder="Enter subject"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button className="primary-btn btn-medium" onClick={createSubject}>
                  Add Subject
                </button>
              </div>
            </div>
          </div>

          <div className="content-header content-header-centered">
            <h2>Subjects in {selectedCourse?.title || "Course"}</h2>
          </div>

          {subjects.length === 0 ? (
            <div className="instructor-empty-msg">No subjects yet for this course.</div>
          ) : (
            <div className="instructor-subject-grid">
              {subjects.map((s) => (
                <div key={s.id} className="instructor-subject-card">
                  {editingId === s.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="form-input"
                        placeholder="Subject name"
                      />
                      <div className="instructor-card-actions">
                        <button className="action-btn-instructor" onClick={() => saveEdit(s.id)}>Save</button>
                        <button className="action-btn-instructor action-btn-secondary" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="instructor-subject-card-title">{s.name}</h3>
                      <div className="instructor-card-actions">
                        <button className="action-btn-instructor" onClick={() => startEdit(s)}>Edit</button>
                        <button className="action-btn-instructor" onClick={() => goToTopics(s.id)}>Topics</button>
                        <button className="action-btn-instructor action-btn-danger" onClick={() => deleteSubject(s.id)}>Delete</button>
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

export default InstructorSubjects;
