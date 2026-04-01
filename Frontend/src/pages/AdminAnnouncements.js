// src/pages/AdminAnnouncements.js
import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("ROLE"); // ROLE or INDIVIDUAL
  const [targetRole, setTargetRole] = useState("ALL");
  const [targetUserId, setTargetUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/announcements/admin");
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/api/announcements/admin", {
        title,
        message,
        targetRole: targetType === "ROLE" ? targetRole : "INDIVIDUAL",
        targetUserId: targetType === "INDIVIDUAL" ? Number(targetUserId) : null,
      });
      setTitle("");
      setMessage("");
      setTargetType("ROLE");
      setTargetRole("ALL");
      setTargetUserId("");
      loadAnnouncements();
    } catch (err) {
      alert("Failed to create announcement.");
    }
    setSubmitting(false);
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await API.delete(`/api/announcements/admin/${id}`);
      loadAnnouncements();
    } catch (err) {
      alert("Failed to delete announcement.");
    }
  };

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>Announcements</h2>
        <p>Broadcast messages to students or instructors platform-wide.</p>
      </div>

      <div className="instructor-card instructor-form-card" style={{ marginBottom: 32 }}>
        <h3 className="section-heading-small">Create New Announcement</h3>
        <form onSubmit={handleCreate}>
          <div className="form-grid two-cols">
            <div>
              <label>Title</label>
              <input 
                type="text" 
                className="form-input full-width" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label>Target Type</label>
              <select 
                className="form-input full-width" 
                value={targetType} 
                onChange={e => {
                   setTargetType(e.target.value);
                   setTargetRole(e.target.value === "ROLE" ? "ALL" : "STUDENT");
                   setTargetUserId("");
                }}
              >
                <option value="ROLE">Role Based</option>
                <option value="INDIVIDUAL">Specific Individual</option>
              </select>
            </div>
            {targetType === "ROLE" && (
              <div>
                <label>Target Audience</label>
                <select 
                  className="form-input full-width" 
                  value={targetRole} 
                  onChange={e => setTargetRole(e.target.value)}
                >
                  <option value="ALL">All Users</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="INSTRUCTOR">Instructors Only</option>
                </select>
              </div>
            )}
            {targetType === "INDIVIDUAL" && (
              <>
                <div>
                  <label>Filter by Role</label>
                  <select 
                    className="form-input full-width" 
                    value={targetRole} 
                    onChange={e => {
                      setTargetRole(e.target.value);
                      setTargetUserId("");
                    }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                  </select>
                </div>
                <div>
                  <label>Select User</label>
                  <select 
                    className="form-input full-width" 
                    value={targetUserId} 
                    onChange={e => setTargetUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {users.filter(u => u.role === targetRole).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <label>Message</label>
            <textarea 
               className="form-input full-width" 
               rows="4" 
               value={message} 
               onChange={e => setMessage(e.target.value)} 
               required 
            />
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? "Sending..." : "Send Announcement"}
            </button>
          </div>
        </form>
      </div>

      <div className="instructor-card instructor-form-card">
        <h3 className="section-heading-small">Recent Announcements</h3>
        {loading ? (
          <p className="muted-text">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="muted-text">No announcements found.</p>
        ) : (
          <div className="insights-grid" style={{ gridTemplateColumns: "1fr" }}>
            {announcements.map((a) => (
              <div key={a.id} className="insight-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong style={{ fontSize: "16px", color: "#2d3748" }}>{a.title}</strong>
                    <span className={`course-progress-pill ${a.targetRole === 'ALL' ? 'pill-blue' : a.targetRole === 'STUDENT' ? 'pill-green' : a.targetRole === 'INDIVIDUAL' ? 'pill-red' : 'pill-yellow'}`} style={{ marginLeft: 12 }}>
                      {a.targetRole === 'INDIVIDUAL' ? `INDIVIDUAL (ID: ${a.targetUserId})` : a.targetRole}
                    </span>
                    <span style={{ marginLeft: 12, fontSize: 13, color: "#718096" }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "#4a5568", fontSize: "15px" }}>{a.message}</p>
                </div>
                <div>
                  <button className="action-btn-instructor action-btn-danger btn-sm" onClick={() => deleteAnnouncement(a.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
