// src/pages/InstructorCourses.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    difficultyLevel: "BEGINNER",
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    difficultyLevel: "BEGINNER",
  });

  const instructorId = localStorage.getItem("instructorId") || 1;
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const res = await API.get(
        `/instructor/courses?instructorId=${instructorId}`
      );
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load courses");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createCourse = async () => {
    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }
    try {
      await API.post("/instructor/courses", {
        title: form.title,
        difficultyLevel: form.difficultyLevel,
        instructorId: instructorId,
      });
      setForm({ title: "", difficultyLevel: "BEGINNER" });
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to create course");
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await API.delete(`/instructor/courses/${id}`);
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  const startEditCourse = (c) => {
    setEditingId(c.id);
    setEditForm({
      title: c.title,
      difficultyLevel: c.difficultyLevel || c.difficulty || "BEGINNER",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveCourseEdit = async (id) => {
    try {
      await API.put(`/instructor/courses/${id}`, {
        title: editForm.title,
        difficultyLevel: editForm.difficultyLevel,
      });
      setEditingId(null);
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to update course");
    }
  };

  const cancelEdit = () => setEditingId(null);

  const goToSubjects = (courseId) => {
    navigate(`/instructor/subjects?courseId=${courseId}`);
  };

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>Manage Courses</h2>
        <p>Create and manage your courses. Then attach subjects and topics.</p>
      </div>

      <div className="instructor-card instructor-form-card">
        <h3 className="instructor-card-title">Create Course</h3>
        <div className="form-grid two-cols form-grid-gap">
          <div>
            <label>Course Title</label>
            <input
              name="title"
              placeholder="Enter course name"
              value={form.title}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div>
            <label>Difficulty Level</label>
            <select
              name="difficultyLevel"
              value={form.difficultyLevel}
              onChange={handleChange}
              className="form-input"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="primary-btn btn-medium" onClick={createCourse}>
              Add Course
            </button>
          </div>
        </div>
      </div>

      <div className="content-header content-header-centered">
        <h2>Your Courses</h2>
        <p>Click Subjects to manage content for each course.</p>
      </div>

      {courses.length === 0 ? (
        <div className="instructor-empty-msg">
          No courses yet. Start by creating one above.
        </div>
      ) : (
        <div className="instructor-course-grid">
          {courses.map((c) => (
            <div key={c.id} className="instructor-course-card">
              <div className="instructor-course-badge">
                {c.difficultyLevel || c.difficulty || "LEVEL"}
              </div>
              <h3 className="instructor-course-card-title">{c.title}</h3>
              {editingId === c.id ? (
                <div className="instructor-course-edit-form">
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="Title"
                  />
                  <select
                    name="difficultyLevel"
                    value={editForm.difficultyLevel}
                    onChange={handleEditChange}
                    className="form-input"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                  <div className="instructor-card-actions">
                    <button className="action-btn-instructor" onClick={() => saveCourseEdit(c.id)}>Save</button>
                    <button className="action-btn-instructor action-btn-secondary" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="instructor-card-actions">
                  <button className="action-btn-instructor" onClick={() => startEditCourse(c)}>Edit</button>
                  <button className="action-btn-instructor" onClick={() => goToSubjects(c.id)}>Subjects</button>
                  <button className="action-btn-instructor action-btn-danger" onClick={() => deleteCourse(c.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstructorCourses;
