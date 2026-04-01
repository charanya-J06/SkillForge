// src/pages/AdminUsers.js
import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      loadUsers();
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  const viewDetails = async (id) => {
    try {
      const res = await API.get(`/admin/users/${id}/details`);
      setUserDetails(res.data);
      setSelectedUser(id);
    } catch (err) {
      alert("Failed to fetch user details.");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
                          (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
                          (u.role && u.role.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = filterRole === "ALL" || (u.role && u.role === filterRole);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>User Management</h2>
        <p>View, search, and manage all users on the platform.</p>
      </div>

      <div className="instructor-card instructor-form-card" style={{ padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: "1 1 300px" }}>
            <input 
              type="text" 
              placeholder="Search by name, email, or role..." 
              className="form-input full-width"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: "8px", padding: "12px 16px", border: "1px solid #e2e8f0" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
            {["ALL", "STUDENT", "INSTRUCTOR", "ADMIN"].map(role => (
              <button
                key={role}
                className={filterRole === role ? "primary-btn" : "chip-btn"}
                style={{ 
                   padding: "8px 16px", 
                   borderRadius: "6px", 
                   border: "none", 
                   fontWeight: filterRole === role ? 600 : 500,
                   background: filterRole === role ? "#0f172a" : "transparent",
                   color: filterRole === role ? "white" : "#64748b",
                   boxShadow: filterRole === role ? "0 4px 12px rgba(15, 23, 42, 0.15)" : "none"
                }}
                onClick={() => setFilterRole(role)}
              >
                {role === "ALL" ? "All Users" : role.charAt(0) + role.slice(1).toLowerCase() + "s"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="muted-text">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="muted-text">No users found.</p>
        ) : (
          <table className="styled-table full-width">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`course-progress-pill ${u.role === 'ADMIN' ? 'pill-red' : u.role === 'INSTRUCTOR' ? 'pill-yellow' : 'pill-green'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn-instructor btn-sm" onClick={() => viewDetails(u.id)} style={{ marginRight: 8 }}>
                      View Details
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button 
                        className="action-btn-instructor action-btn-danger btn-sm"
                        onClick={() => deleteUser(u.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && userDetails && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" }}>
          <div className="card" style={{ width: 700, maxWidth: "95%", maxHeight: "90vh", padding: 0, zIndex: 1001, background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            
            <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", padding: "40px 24px", color: "white", position: "relative", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ width: 90, height: 90, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 44 }}>
                  {userDetails.user.role === 'INSTRUCTOR' ? <i className="fa-solid fa-chalkboard-user"></i> : userDetails.user.role === 'ADMIN' ? <i className="fa-solid fa-shield-halved"></i> : <i className="fa-solid fa-user-graduate"></i>}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{userDetails.user.name}</h2>
                  <p style={{ margin: "4px 0 8px 0", opacity: 0.9, fontSize: 16 }}>{userDetails.user.email}</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>ID: #{userDetails.user.id}</span>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{userDetails.user.role}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              {userDetails.user.role === 'STUDENT' && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, textAlign: "center", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Courses</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>{userDetails.enrolledCourses || 0}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, textAlign: "center", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Topics</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#023293" }}>{userDetails.topicsCompleted || 0}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, textAlign: "center", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Quizzes</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{userDetails.quizAttempts || 0}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, textAlign: "center", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Avg Score</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>{userDetails.averageQuizScore || 0}%</div>
                    </div>
                  </div>

                  <h4 style={{ color: "#1e293b", marginBottom: 16, fontSize: 18 }}>Course Progress</h4>
                  {userDetails.courseProgress && userDetails.courseProgress.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                      {userDetails.courseProgress.map((cp, i) => (
                        <div key={i} style={{ border: "1px solid #f1f5f9", padding: 16, borderRadius: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>{cp.courseTitle}</span>
                            <span style={{ fontSize: 13, color: "#64748b" }}>{cp.topicsCompleted}/{cp.topicsTotal} Topics</span>
                          </div>
                          <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: "#023293", width: `${cp.topicPercent}%`, transition: "width 0.5s ease" }} />
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                            {cp.quizzesAttempted}/{cp.quizzesTotal} Quizzes Attempted ({cp.quizPercent}%)
                          </div>
                          {cp.completedTopicNames && cp.completedTopicNames.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>Completed Topics:</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {cp.completedTopicNames.map((name, idx) => (
                                  <span key={idx} style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontSize: 11, color: "#475569" }}>{name}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <p className="muted-text">No course activity found.</p>}

                  <h4 style={{ color: "#1e293b", marginBottom: 16, fontSize: 18 }}>Recent Quiz Attempts</h4>
                  {userDetails.quizDetails && userDetails.quizDetails.length > 0 ? (
                    <table className="styled-table full-width" style={{ marginTop: 0 }}>
                      <thead>
                        <tr>
                          <th>Quiz</th>
                          <th>Score</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.quizDetails.map((q, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{q.quizTitle}</td>
                            <td>
                              <span style={{ color: q.score >= 70 ? "#10b981" : q.score >= 40 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
                                {q.score}%
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: "#64748b" }}>{new Date(q.completedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="muted-text">No quiz attempts recorded.</p>}
                </>
              )}

              {userDetails.user.role === 'INSTRUCTOR' && (
                <>
                  <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, marginBottom: 24, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Total Courses Managed</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "#023293" }}>{userDetails.coursesCreated || 0}</div>
                  </div>

                  <h4 style={{ color: "#1e293b", marginBottom: 16, fontSize: 18 }}>Managed Courses</h4>
                  {userDetails.courseSummaries && userDetails.courseSummaries.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {userDetails.courseSummaries.map((c, i) => (
                        <div key={i} style={{ padding: 16, border: "1px solid #f1f5f9", borderRadius: 12 }}>
                          <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>{c.title}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span className="course-progress-pill pill-green" style={{ fontSize: 10 }}>{c.difficulty}</span>
                            <span style={{ fontSize: 12, color: "#64748b" }}>{c.subjectsCount} Subjects</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="muted-text">No courses created yet.</p>}
                </>
              )}

              {userDetails.user.role === 'ADMIN' && (
                <div style={{ padding: "10px 0" }}>
                  <h4 style={{ color: "#1e293b", marginBottom: 20, fontSize: 18, textAlign: "center" }}>Administrative Account Details</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ background: "#f0f9ff", padding: 20, borderRadius: 12, border: "1px solid #bae6fd", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
                      <div style={{ fontWeight: 600, color: "#0369a1" }}>User Management</div>
                      <div style={{ fontSize: 12, color: "#0ea5e9" }}>Enabled</div>
                    </div>
                    <div style={{ background: "#f0fdf4", padding: 20, borderRadius: 12, border: "1px solid #bbf7d0", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}><i className="fa-solid fa-file-signature" style={{ color: "#10b981" }}></i></div>
                      <div style={{ fontWeight: 600, color: "#15803d" }}>Resolve Feedback</div>
                      <div style={{ fontSize: 12, color: "#22c55e" }}>Enabled</div>
                    </div>
                    <div style={{ background: "#fdf4ff", padding: 20, borderRadius: 12, border: "1px solid #f5d0fe", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}><i className="fa-solid fa-book" style={{ color: "#3b82f6" }}></i></div>
                      <div style={{ fontWeight: 600, color: "#a21caf" }}>Manage Courses</div>
                      <div style={{ fontSize: 12, color: "#d946ef" }}>Enabled</div>
                    </div>
                    <div style={{ background: "#fff7ed", padding: 20, borderRadius: 12, border: "1px solid #ffedd5", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>
                      <div style={{ fontWeight: 600, color: "#c2410c" }}>System Settings</div>
                      <div style={{ fontSize: 12, color: "#f97316" }}>Full Access</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 24, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1", textAlign: "center" }}>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                      Administrator accounts have complete control over all platform modules including users, instructors, and educational content.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "12px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", background: "#f8fafc" }}>
              <button 
                className="primary-btn" 
                onClick={() => { setSelectedUser(null); setUserDetails(null); }} 
                style={{ padding: "6px 16px", fontSize: 13, borderRadius: 6 }}
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
