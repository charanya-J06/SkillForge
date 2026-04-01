// src/pages/InstructorDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

function InstructorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const announcementsRef = useRef(null);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });
  const [instructorName, setInstructorName] = useState(localStorage.getItem("name") || "Instructor");
  const [instructorEmail, setInstructorEmail] = useState(localStorage.getItem("email") || "");
  const instructorId = localStorage.getItem("instructorId") || "1";

  const [feedbackType, setFeedbackType] = useState("PLATFORM");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [specificPurpose, setSpecificPurpose] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [editName, setEditName] = useState(instructorName);
  const [editEmail, setEditEmail] = useState(instructorEmail);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    API.get("/api/announcements?role=INSTRUCTOR")
      .then(res => {
        const data = res.data || [];
        setAnnouncements(data);
        const lastSeen = localStorage.getItem("lastSeenAnnouncements_instructorId_" + instructorId) || "0";
        const unread = data.filter(a => new Date(a.createdAt).getTime() > Number(lastSeen)).length;
        setUnreadCount(unread);
      })
      .catch(() => {});

    API.get(`/instructor/courses?instructorId=${instructorId}`)
      .then(res => setCourses(res.data || []))
      .catch(() => {});

    API.get("/admin/users")
      .then(res => {
        const users = res.data || [];
        setStudents(users.filter(u => u.role === "STUDENT"));
      })
      .catch(() => {});

    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (announcementsRef.current && !announcementsRef.current.contains(e.target)) setAnnouncementsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("instructorId");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/feedback", {
        userId: Number(instructorId),
        content: feedbackContent,
        rating: Number(feedbackRating),
        type: feedbackType,
        specificPurpose: specificPurpose,
        courseId: selectedCourseId ? Number(selectedCourseId) : null,
        targetUserId: feedbackType === "STUDENT" ? Number(selectedStudentId) : null,
      });
      alert("Feedback submitted successfully!");
      setFeedbackOpen(false);
      setFeedbackContent("");
      setFeedbackRating(5);
      setSpecificPurpose("");
      setSelectedCourseId("");
      setSelectedStudentId("");
    } catch (err) {
      alert("Failed to submit feedback.");
    }
  };

  const updateInstructorProfile = async (e) => {
    e.preventDefault();
    try {
      if (oldPassword || newPassword || confirmPassword) {
         if (!oldPassword) {
            setPwdMsg({ type: "error", text: "Please enter your old password to make security changes." });
            return;
         }
         const passwordOk = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(newPassword);
         if (newPassword && !passwordOk) {
            setPwdMsg({ type: "error", text: "New password must be at least 6 chars with a letter, number, and special char." });
            return;
         }
         if (newPassword !== confirmPassword) {
            setPwdMsg({ type: "error", text: "New passwords do not match." });
            return;
         }
         try {
           await API.put(`/auth/${instructorId}/password`, {
             oldPassword,
             newPassword
           });
           setPwdMsg({ type: "success", text: "Password updated successfully!" });
           setOldPassword("");
           setNewPassword("");
           setConfirmPassword("");
         } catch (pwdErr) {
           const errMsg = pwdErr.response?.data?.message || "Incorrect old password.";
           setPwdMsg({ type: "error", text: errMsg });
           return;
         }
      }

      const currentName = localStorage.getItem("name") || "";
      const currentEmail = localStorage.getItem("email") || "";
      
      if (editName !== currentName || editEmail !== currentEmail) {
        const res = await API.put(`/auth/profile/${instructorId}`, {
          name: editName,
          email: editEmail
        });
        localStorage.setItem("name", res.data.name);
        localStorage.setItem("email", res.data.email);
        setInstructorName(res.data.name);
        setInstructorEmail(res.data.email);
      }
      
      setPwdMsg({ type: "success", text: "Profile processed successfully!" });
      setTimeout(() => {
        setEditProfileOpen(false);
        setPwdMsg({ type: "", text: "" });
      }, 1000);

    } catch (err) {
      setPwdMsg({ type: "error", text: "Failed to update profile details." });
    }
  };

  const isActive = (path) =>
    location.pathname === path || (path !== "/instructor" && location.pathname.startsWith(path))
      ? "side-link active"
      : "side-link";

  return (
    <div className="instructor-layout">
      {/* Top bar */}
      <header className="instructor-topbar" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="instructor-topbar-left">
          <div className="logo" style={{ fontWeight: 800, color: "#023293" }}>SKILLFORGE</div>
        </div>
        <div className="instructor-topbar-right">
          <div className="instructor-profile-wrap" ref={announcementsRef} style={{ marginRight: 16 }}>
            <button
              type="button"
              className="instructor-profile-btn"
              onClick={() => {
                setAnnouncementsOpen(!announcementsOpen);
                if (!announcementsOpen) {
                  setUnreadCount(0);
                  localStorage.setItem("lastSeenAnnouncements_instructorId_" + instructorId, Date.now().toString());
                }
              }}
              aria-label="Announcements"
              style={{ background: "#f1f5f9", border: "none", fontSize: "20px", position: "relative" }}
            >
              <i className="fa-solid fa-bell"></i>
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#e53e3e", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", fontWeight: "bold" }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {announcementsOpen && (
              <div className="instructor-profile-card" style={{ width: 320, padding: 16, right: -10 }}>
                <h4 style={{ margin: "0 0 12px 0", borderBottom: "1px solid #eee", paddingBottom: 8 }}>Announcements</h4>
                {announcements.length === 0 ? (
                  <p className="muted-text" style={{ fontSize: 13, margin: 0 }}>No new announcements.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 300, overflowY: "auto" }}>
                    {announcements.map(a => (
                      <li key={a.id} style={{ marginBottom: 16 }}>
                        <strong style={{ display: "block", fontSize: 14 }}>{a.title}</strong>
                        <span style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>{new Date(a.createdAt).toLocaleString()}</span>
                        <p style={{ fontSize: 13, margin: 0, color: "#444" }}>{a.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="instructor-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="instructor-profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              <i className="fa-solid fa-circle-user" style={{ fontSize: "28px", color: "#023293" }}></i>
            </button>
            {profileOpen && (
              <div className="instructor-profile-card">
                <div className="instructor-profile-text" style={{ padding: "8px 0 16px 0", textAlign: "center", borderBottom: "1px solid #f1f5f9", marginBottom: "16px" }}>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{instructorName}</div>
                  <div className="profile-role-pill pill-instructor">Instructor</div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>{instructorEmail}</div>
                </div>
                <div className="profile-btn-container">
                  <button
                    className="profile-action-btn"
                    onClick={() => { setEditProfileOpen(true); setProfileOpen(false); setPwdMsg({ type: "", text: "" }); }}
                  >
                    <i className="fa-solid fa-user-pen" style={{ color: "#3b82f6" }}></i> Edit Profile
                  </button>
                  <button
                    className="profile-action-btn"
                    onClick={() => { setFeedbackOpen(true); setProfileOpen(false); }}
                  >
                    <i className="fa-solid fa-comment-dots" style={{ color: "#3b82f6" }}></i> Provide Feedback
                  </button>
                  <button
                    className="profile-action-btn"
                    onClick={logout}
                    style={{ color: "#c53030" }}
                  >
                    <i className="fa-solid fa-right-from-bracket" style={{ color: "#c53030" }}></i> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      <div className="instructor-body">
        {/* Left Sidebar */}
        <aside className="sidebar instructor-sidebar">
          <div className="sidebar-inner" style={{ paddingTop: "20px" }}>
            <button
              className={isActive("/instructor")}
              onClick={() => navigate("/instructor")}
            >
              <span className="side-icon"><i className="fa-solid fa-chart-pie"></i></span>
              Dashboard
            </button>
            <button
              className={isActive("/instructor/courses")}
              onClick={() => navigate("/instructor/courses")}
            >
              <span className="side-icon"><i className="fa-solid fa-book"></i></span>
              Courses
            </button>
            <button
              className={isActive("/instructor/subjects")}
              onClick={() => navigate("/instructor/subjects")}
            >
              <span className="side-icon"><i className="fa-solid fa-book-open"></i></span>
              Subjects
            </button>
            <button
              className={isActive("/instructor/topics")}
              onClick={() => navigate("/instructor/topics")}
            >
              <span className="side-icon"><i className="fa-solid fa-puzzle-piece"></i></span>
              Topics
            </button>
            <button
              className={isActive("/instructor/quizzes")}
              onClick={() => navigate("/instructor/quizzes")}
            >
              <span className="side-icon"><i className="fa-solid fa-file-signature"></i></span>
              Quizzes
            </button>
            <button
              className={isActive("/instructor/analytics")}
              onClick={() => navigate("/instructor/analytics")}
            >
              <span className="side-icon"><i className="fa-solid fa-chart-line"></i></span>
              Analytics
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="instructor-main">
          <Outlet />
        </main>
      </div>

      {feedbackOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="card" style={{ width: 450, maxWidth: "95%", padding: 24, zIndex: 1001, background: "white", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: "#1e293b" }}>Instructor Feedback</h3>
            <form onSubmit={handleFeedbackSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Feedback Category</label>
                <select className="form-input full-width" value={feedbackType} onChange={e => {
                  setFeedbackType(e.target.value);
                  setSpecificPurpose("");
                  setSelectedCourseId("");
                }}>
                  <option value="PLATFORM">Platform Interface</option>
                  <option value="COURSE">Course Management</option>
                  <option value="STUDENT">Student Performance</option>
                </select>
              </div>

              {feedbackType === "COURSE" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Select Course</label>
                  <select className="form-input full-width" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} required>
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}

              {feedbackType === "STUDENT" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Select Student</label>
                  <select className="form-input full-width" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} required>
                    <option value="">-- Select Student --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Rating</label>
                <div style={{ display: "flex", gap: 8, fontSize: 24 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      onClick={() => setFeedbackRating(star)}
                      style={{ cursor: "pointer", color: star <= feedbackRating ? "#fbce11" : "#e2e8f0", transition: "color 0.2s" }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Comments</label>
                <textarea 
                  className="form-input full-width" 
                  rows="4" 
                  placeholder="Share your detailed thoughts..."
                  value={feedbackContent} 
                  onChange={e => setFeedbackContent(e.target.value)} 
                  required
                  style={{ resize: "none" }}
                ></textarea>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="chip-btn" onClick={() => setFeedbackOpen(false)} style={{ padding: "10px 20px" }}>Cancel</button>
                <button type="submit" className="primary-btn" style={{ padding: "10px 24px", borderRadius: 8 }}>Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editProfileOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="card" style={{ width: 700, maxWidth: "95%", padding: "40px", zIndex: 1001, background: "white", borderRadius: 20 }}>
            <div style={{ marginBottom: 32, textAlign: "center" }}>
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: 26, fontWeight: 800 }}>Account Security & Profile</h3>
                <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: 14 }}>Update your instructor details and security credentials.</p>
            </div>
            
            {pwdMsg.text && (
              <div style={{ padding: "14px", borderRadius: "12px", marginBottom: "24px", fontSize: "15px", fontWeight: "600", background: pwdMsg.type === 'error' ? "#fef2f2" : "#f0fdf4", color: pwdMsg.type === 'error' ? "#ef4444" : "#16a34a", display: "flex", alignItems: "center", gap: "10px", border: `1px solid ${pwdMsg.type === 'error' ? '#fca5a5' : '#81e6d9'}` }}>
                 <i className={`fa-solid ${pwdMsg.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`} style={{ fontSize: "18px" }}></i> {pwdMsg.text}
              </div>
            )}

            <form onSubmit={updateInstructorProfile}>
              <div className="form-grid-side">
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#475569", fontSize: "14px" }}>Full Name</label>
                  <input type="text" className="form-input full-width" value={editName} onChange={e => setEditName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#475569", fontSize: "14px" }}>Email Address</label>
                  <input type="email" className="form-input full-width" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
                </div>
              </div>

              <h4 style={{ color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "24px", marginTop: "16px", display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", fontWeight: 700 }}>
                <i className="fa-solid fa-shield-halved" style={{ color: "#3b82f6" }}></i> Security Credentials
              </h4>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#475569", fontSize: "14px" }}>Current Password (to verify changes)</label>
                <div className="password-toggle-wrapper">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    className="form-input full-width"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{ paddingRight: "44px" }}
                  />
                  <span 
                    className="password-toggle-icon-wrap" 
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    <i className={`fa-solid ${showOldPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </span>
                </div>
              </div>

              <div className="form-grid-side">
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#475569", fontSize: "14px" }}>New Password</label>
                  <div className="password-toggle-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="form-input full-width"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: "44px" }}
                    />
                    <span 
                      className="password-toggle-icon-wrap" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#475569", fontSize: "14px" }}>Confirm New Password</label>
                  <div className="password-toggle-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-input full-width"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: "44px" }}
                    />
                    <span 
                      className="password-toggle-icon-wrap" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", marginTop: "40px" }}>
                <button type="button" className="chip-btn" style={{ padding: "14px 28px", fontSize: "15px", fontWeight: "700", borderRadius: "12px" }} onClick={() => { setEditProfileOpen(false); setPwdMsg({ type: "", text: "" }); }}>Cancel</button>
                <button type="submit" className="primary-btn" style={{ padding: "14px 36px", fontSize: "15px", fontWeight: "700", borderRadius: "12px" }}>Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default InstructorDashboard;
