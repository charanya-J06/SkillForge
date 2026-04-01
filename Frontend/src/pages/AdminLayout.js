import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });
  const profileRef = useRef(null);

  const [adminName, setAdminName] = useState(localStorage.getItem("name") || "Admin");
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem("email") || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("adminId");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  const isActive = (path) =>
    location.pathname === path || (path !== "/admin" && location.pathname.startsWith(path))
      ? "side-link active"
      : "side-link";

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      alert("Admin ID not found. Please log in again.");
      return;
    }
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
            await API.put(`/auth/${adminId}/password`, {
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
            return; // Stop if password update failed
          }
       }

      // Optimization: Only update basic profile if name or email changed
      const currentName = localStorage.getItem("name") || "";
      const currentEmail = localStorage.getItem("email") || "";
      
      let profileChanged = false;
      if (adminName !== currentName || adminEmail !== currentEmail) {
        profileChanged = true;
        const res = await API.put(`/auth/profile/${adminId}`, {
          name: adminName,
          email: adminEmail
        });
        localStorage.setItem("name", res.data.name);
        localStorage.setItem("email", res.data.email);
        setAdminName(res.data.name);
        setAdminEmail(res.data.email);
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
    <div className="instructor-layout">
      {/* Top bar – reusing instructor style */}
      <header className="instructor-topbar" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="instructor-topbar-left">
          <div className="logo" style={{ fontWeight: 800, color: "#023293" }}>SKILLFORGE</div>
        </div>
        <div className="instructor-topbar-right">
          <div className="instructor-profile-wrap" ref={profileRef}>
            <button className="instructor-profile-btn" onClick={() => setProfileOpen(!profileOpen)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
              <i className="fa-solid fa-circle-user" style={{ fontSize: "28px", color: "#023293" }}></i>
            </button>
            {profileOpen && (
              <div className="instructor-profile-card">
                <div className="instructor-profile-text" style={{ padding: "8px 0 16px 0", textAlign: "center", borderBottom: "1px solid #f1f5f9", marginBottom: "16px" }}>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{adminName}</div>
                  <div className="profile-role-pill pill-admin">Administrator</div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>{adminEmail}</div>
                </div>
                <div className="profile-btn-container">
                  <button
                    className="profile-action-btn"
                    onClick={() => {
                      setEditProfileOpen(true);
                      setProfileOpen(false);
                      setPwdMsg({ type: "", text: "" });
                    }}
                  >
                    <i className="fa-solid fa-user-pen" style={{ color: "#3b82f6" }}></i> Edit Profile
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
        <aside className="sidebar instructor-sidebar" style={{ borderRight: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div className="sidebar-inner" style={{ paddingTop: "20px" }}>
            <button
              className={isActive("/admin")}
              onClick={() => navigate("/admin")}
            >
              <span className="side-icon"><i className="fa-solid fa-gauge-high"></i></span>
              Dashboard
            </button>
            <button
              className={isActive("/admin/users")}
              onClick={() => navigate("/admin/users")}
            >
              <span className="side-icon"><i className="fa-solid fa-users-gear"></i></span>
              User Management
            </button>
            <button
              className={isActive("/admin/courses")}
              onClick={() => navigate("/admin/courses")}
            >
              <span className="side-icon"><i className="fa-solid fa-building-columns"></i></span>
              Courses
            </button>
            <button
              className={isActive("/admin/feedback")}
              onClick={() => navigate("/admin/feedback")}
            >
              <span className="side-icon"><i className="fa-solid fa-comments"></i></span>
              System Feedback
            </button>
            <button
              className={isActive("/admin/announcements")}
              onClick={() => navigate("/admin/announcements")}
            >
              <span className="side-icon"><i className="fa-solid fa-bullhorn"></i></span>
              Announcements
            </button>
          </div>
        </aside>

        <main className="instructor-main" style={{ background: "#f1f5f9", padding: "24px" }}>
          <Outlet />
        </main>
        {editProfileOpen && (
          <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="card" style={{ width: 700, maxWidth: "95%", padding: "40px", zIndex: 1001, background: "white", borderRadius: 20 }}>
              <div style={{ marginBottom: 32, textAlign: "center" }}>
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: 26, fontWeight: 800 }}>Account Security & Profile</h3>
                <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: 14 }}>Update your administrative details and security credentials.</p>
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
                    <input
                      type="text"
                      className="form-input full-width"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#475569", fontSize: "14px" }}>Email Address</label>
                    <input
                      type="email"
                      className="form-input full-width"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
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
    </div>
  );
}

export default AdminLayout;
