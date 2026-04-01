import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

function StudentLayout({ activeKey, children }) {
  // Bind API to window for easy access in modals if needed, though direct import is better
  window.API = API;
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });
  const profileRef = useRef(null);
  
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const announcementsRef = useRef(null);

  const [studentName, setStudentName] = useState(localStorage.getItem("name") || "Student");
  const [studentEmail, setStudentEmail] = useState(localStorage.getItem("email") || "");
  const studentId = localStorage.getItem("studentId") || localStorage.getItem("instructorId");
  
  const [feedbackType, setFeedbackType] = useState("PLATFORM"); // PLATFORM, COURSE, INSTRUCTOR
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [instructors, setInstructors] = useState([]);

  const [editName, setEditName] = useState(studentName);
  const [editEmail, setEditEmail] = useState(studentEmail);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    API.get("/api/announcements?role=STUDENT")
      .then(res => {
        const data = res.data || [];
        setAnnouncements(data);
        const lastSeen = localStorage.getItem("lastSeenAnnouncements_studentId_" + studentId) || "0";
        const unread = data.filter(a => new Date(a.createdAt).getTime() > Number(lastSeen)).length;
        setUnreadCount(unread);
      })
      .catch(() => {});

    API.get("/student/courses")
      .then(res => setCourses(res.data || []))
      .catch(() => {});

    API.get("/admin/users")
      .then(res => {
        const users = res.data || [];
        setInstructors(users.filter(u => u.role === "INSTRUCTOR"));
      })
      .catch(() => {});

    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (announcementsRef.current && !announcementsRef.current.contains(e.target)) {
        setAnnouncementsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("studentId");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  const current = activeKey || location.pathname;

  const sideClass = (key) =>
    current === key
      ? "side-link active"
      : "side-link";

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/feedback", {
        userId: Number(studentId),
        content: feedbackContent,
        rating: Number(feedbackRating),
        type: feedbackType,
        courseId: selectedCourseId ? Number(selectedCourseId) : null,
        subjectId: selectedSubjectId ? Number(selectedSubjectId) : null,
        topicId: selectedTopicId ? Number(selectedTopicId) : null,
        instructorId: selectedInstructorId ? Number(selectedInstructorId) : null,
      });
      alert("Feedback submitted successfully!");
      setFeedbackOpen(false);
      setFeedbackContent("");
      setFeedbackRating(5);
      setSelectedCourseId("");
      setSelectedSubjectId("");
      setSelectedTopicId("");
      setSelectedInstructorId("");
    } catch (err) {
      alert("Failed to submit feedback.");
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedSubjectId("");
    setSelectedTopicId("");
    if (courseId) {
      try {
        const res = await API.get(`/student/subjects?courseId=${courseId}`);
        setSubjects(res.data || []);
      } catch (err) {
        setSubjects([]);
      }
    } else {
      setSubjects([]);
    }
  };

  const handleSubjectChange = async (subjectId) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId("");
    if (subjectId) {
      try {
        const res = await API.get(`/student/topics?subjectId=${subjectId}`);
        setTopics(res.data || []);
      } catch (err) {
        setTopics([]);
      }
    } else {
      setTopics([]);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      if (oldPassword || newPassword || confirmPassword) {
         if (!oldPassword) {
            setPwdMsg({ type: "error", text: "Please enter your old password to make security changes." });
            return;
         }
         const passwordOk = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(newPassword);
         if (!newPassword || !passwordOk) {
            setPwdMsg({ type: "error", text: "New password must be at least 6 chars with a letter, number, and special char." });
            return;
         }
         if (newPassword !== confirmPassword) {
            setPwdMsg({ type: "error", text: "New passwords do not match." });
            return;
         }
         try {
           await API.put(`/auth/${studentId}/password`, {
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

      // Optimization: Only update basic profile if name or email changed
      const currentName = localStorage.getItem("name") || "";
      const currentEmail = localStorage.getItem("email") || "";
      
      if (editName !== currentName || editEmail !== currentEmail) {
        const res = await API.put(`/auth/profile/${studentId}`, {
          name: editName,
          email: editEmail
        });
        localStorage.setItem("name", res.data.name);
        localStorage.setItem("email", res.data.email);
        setStudentName(res.data.name);
        setStudentEmail(res.data.email);
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

  return (
    <div className="instructor-layout student-layout">
      <header className="instructor-topbar student-topbar" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
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
                  localStorage.setItem("lastSeenAnnouncements_studentId_" + studentId, Date.now().toString());
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
          <div className="instructor-profile-wrap student-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="instructor-profile-btn student-profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              <i className="fa-solid fa-circle-user" style={{ fontSize: "28px", color: "#023293" }}></i>
            </button>
            {profileOpen && (
              <div className="instructor-profile-card student-profile-card">
                <div className="instructor-profile-text" style={{ padding: "8px 0 16px 0", textAlign: "center", borderBottom: "1px solid #f1f5f9", marginBottom: "16px" }}>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{studentName}</div>
                  <div className="profile-role-pill pill-student">Student</div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>{studentEmail}</div>
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
        <aside className="sidebar instructor-sidebar student-sidebar">
          <div className="sidebar-inner" style={{ paddingTop: "20px" }}>
            <button
              type="button"
              className={sideClass("/student")}
              onClick={() => navigate("/student")}
            >
              <span className="side-icon"><i className="fa-solid fa-house-chimney"></i></span>
              Dashboard
            </button>
            <button
              type="button"
              className={sideClass("/student/learn")}
              onClick={() => navigate("/student/learn")}
            >
              <span className="side-icon"><i className="fa-solid fa-book-open-reader"></i></span>
              Learning
            </button>
            <button
              type="button"
              className={sideClass("/student/analytics")}
              onClick={() => navigate("/student/analytics")}
            >
              <span className="side-icon"><i className="fa-solid fa-chart-line"></i></span>
              Analytics
            </button>
          </div>
        </aside>

        <main className="instructor-main student-main">
          {children}
        </main>
      </div>

      {feedbackOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="card" style={{ width: 450, maxWidth: "95%", padding: 24, zIndex: 1001, background: "white", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: "#1e293b" }}>Share Your Experience</h3>
            <form onSubmit={handleFeedbackSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Feedback Category</label>
                <select className="form-input full-width" value={feedbackType} onChange={e => {
                  setFeedbackType(e.target.value);
                  setSelectedCourseId("");
                  setSelectedSubjectId("");
                  setSelectedTopicId("");
                  setSelectedInstructorId("");
                }}>
                  <option value="PLATFORM">Platform Interface</option>
                  <option value="COURSE">Course & Subjects</option>
                  <option value="INSTRUCTOR">Instructor Feedback</option>
                </select>
              </div>

              {feedbackType === "COURSE" && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Select Course</label>
                    <select className="form-input full-width" value={selectedCourseId} onChange={e => handleCourseChange(e.target.value)} required>
                      <option value="">-- Select Course --</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  {selectedCourseId && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Select Subject (Optional)</label>
                      <select className="form-input full-width" value={selectedSubjectId} onChange={e => handleSubjectChange(e.target.value)}>
                        <option value="">-- All Subjects --</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  {selectedSubjectId && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Select Topic (Optional)</label>
                      <select className="form-input full-width" value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}>
                        <option value="">-- All Topics --</option>
                        {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {feedbackType === "INSTRUCTOR" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Select Instructor</label>
                  <select className="form-input full-width" value={selectedInstructorId} onChange={e => setSelectedInstructorId(e.target.value)} required>
                    <option value="">-- Select Instructor --</option>
                    {instructors.map(ins => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
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
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Detailed Comments</label>
                <textarea 
                  className="form-input full-width" 
                  rows="4" 
                  placeholder="Tell us what you liked or what can be improved..."
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
                <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: 14 }}>Update your student details and security credentials.</p>
            </div>
            
            {pwdMsg.text && (
              <div style={{ padding: "14px", borderRadius: "12px", marginBottom: "24px", fontSize: "15px", fontWeight: "600", background: pwdMsg.type === 'error' ? "#fef2f2" : "#f0fdf4", color: pwdMsg.type === 'error' ? "#ef4444" : "#16a34a", display: "flex", alignItems: "center", gap: "10px", border: `1px solid ${pwdMsg.type === 'error' ? '#fca5a5' : '#81e6d9'}` }}>
                 <i className={`fa-solid ${pwdMsg.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`} style={{ fontSize: "18px" }}></i> {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileUpdate}>
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

export default StudentLayout;

