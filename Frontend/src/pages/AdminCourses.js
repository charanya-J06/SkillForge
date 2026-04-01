// src/pages/AdminCourses.js
import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/courses");
      setCourses(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const deleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await API.delete(`/admin/courses/${id}`);
      loadCourses();
    } catch (err) {
      alert("Failed to delete course.");
    }
  };

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>Course Overview</h2>
        <p>Monitor quality, engagement, and manage all courses on the platform.</p>
      </div>

      <div className="instructor-card instructor-form-card">
        {loading ? (
          <p className="muted-text">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="muted-text">No courses available.</p>
        ) : (
          <table className="styled-table full-width">
            <thead>
              <tr>
                <th>Course ID</th>
                <th>Title</th>
                <th>Instructor ID</th>
                <th>Difficulty</th>
                <th>Content Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><strong>{c.title}</strong></td>
                  <td>{c.instructorId}</td>
                  <td>
                    <span className={`course-progress-pill ${c.difficultyLevel === 'ADVANCED' ? 'pill-red' : c.difficultyLevel === 'INTERMEDIATE' ? 'pill-yellow' : 'pill-green'}`}>
                      {c.difficultyLevel}
                    </span>
                  </td>
                  <td>
                    {c.subjectsCount || 0} Subjects, {c.quizzesCount || 0} Quizzes
                  </td>
                  <td>
                    <button 
                      className="action-btn-instructor action-btn-danger"
                      onClick={() => deleteCourse(c.id)}
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
    </div>
  );
}
