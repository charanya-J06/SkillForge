// src/pages/AdminFeedback.js
import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("ALL"); // ALL, STUDENT, INSTRUCTOR

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/feedback");
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const resolveFeedback = async (id) => {
    try {
      await API.put(`/admin/feedback/${id}/resolve`);
      loadFeedback();
    } catch (err) {
      alert("Failed to resolve feedback.");
    }
  };

  return (
    <div className="content-wrapper instructor-page-wrap">
      <div className="content-header content-header-centered">
        <h2>Platform Feedback</h2>
        <p>Review feedback submitted by students and instructors.</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 40, background: "#f8fafc", padding: 12, borderRadius: 16, width: "fit-content", margin: "0 auto 40px auto", border: "1px solid #e2e8f0" }}>
        {["ALL", "STUDENT", "INSTRUCTOR"].map(role => (
          <button 
            key={role}
            onClick={() => setFilterRole(role)}
            className="chip-btn"
            style={{ 
              padding: "12px 32px", 
              minWidth: 160,
              background: filterRole === role ? "#0f172a" : "transparent",
              color: filterRole === role ? "white" : "#475569",
              border: "none",
              fontWeight: 700,
              fontSize: "16px",
              borderRadius: 12,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: filterRole === role ? "0 4px 12px rgba(15, 23, 42, 0.15)" : "none"
            }}
          >
            {role === "ALL" ? "All Feedback" : role.charAt(0) + role.slice(1).toLowerCase() + "s"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted-text" style={{ textAlign: "center" }}>Loading feedback...</p>
      ) : feedbacks.filter(f => filterRole === "ALL" || (f.userRole && f.userRole.toUpperCase() === filterRole)).length === 0 ? (
        <div className="instructor-empty-msg">No {filterRole.toLowerCase()} feedback available.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 24 }}>
          {feedbacks
            .filter(f => filterRole === "ALL" || (f.userRole && f.userRole.toUpperCase() === filterRole))
            .map((f) => (
            <div key={f.id} className="card instructor-card" style={{ display: "flex", flexDirection: "column", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", background: "white", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)", transition: "transform 0.2s", boxSizing: "border-box" }}>
              
              {/* Top: Role and Name */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 20, color: "#475569" }}>
                   {f.userRole?.toUpperCase() === 'INSTRUCTOR' ? <i className="fa-solid fa-chalkboard-user"></i> : f.userRole?.toUpperCase() === 'ADMIN' ? <i className="fa-solid fa-shield-halved"></i> : <i className="fa-solid fa-user-graduate"></i>}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 700 }}>{f.userName || `User #${f.userId}`}</h4>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.userRole || 'STUDENT'}</span>
                </div>
              </div>

              {/* Middle: Details & Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span className={`course-progress-pill ${f.type === 'PLATFORM' ? 'pill-blue' : f.type === 'COURSE' ? 'pill-yellow' : 'pill-red'}`} style={{ textTransform: "uppercase", fontSize: 10, fontWeight: 700, padding: "4px 8px" }}>
                      {f.type} Feedback
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center" }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: "4px" }}></i> {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ color: "#fbce11", fontSize: 16 }}>
                    {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #f1f5f9" }}>
                  <p style={{ margin: 0, color: "#334155", lineHeight: 1.6, fontSize: 15, fontStyle: "italic" }}>
                    "{f.content}"
                  </p>
                </div>

                {(f.courseName || f.instructorName || f.studentName || f.specificPurpose) && (
                  <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "14px", marginBottom: "16px", display: "grid", gap: "10px" }}>
                    {f.courseName && (
                      <div style={{ fontSize: 14, color: "#334155" }}>
                        <strong>Course:</strong> <span style={{color: "#0f172a", fontWeight: 500}}>{f.courseName}</span>
                        {f.subjectName && ` • ${f.subjectName}`}
                        {f.topicName && ` • ${f.topicName}`}
                      </div>
                    )}
                    {f.instructorName && (
                      <div style={{ fontSize: 14, color: "#334155" }}>
                        <strong>Instructor:</strong> <span style={{color: "#0f172a", fontWeight: 500}}>{f.instructorName}</span>
                      </div>
                    )}
                    {(f.studentName || f.targetUserName || f.targetUserId) && (
                      <div style={{ fontSize: 14, color: "#334155" }}>
                        <strong>Student:</strong> <span style={{color: "#0f172a", fontWeight: 500}}>{f.studentName || f.targetUserName || `User #${f.targetUserId}`}</span>
                      </div>
                    )}
                    {f.specificPurpose && (
                      <div style={{ fontSize: 14, color: "#334155" }}>
                        <strong>Purpose:</strong> <span style={{color: "#0f172a", fontWeight: 500}}>{f.specificPurpose}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom: Status & View Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: "12px" }}>
                <span className={`course-progress-pill ${f.status === 'RESOLVED' ? 'pill-green' : 'pill-yellow'}`} style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 700, padding: "6px 12px", border: "none" }}>
                  {f.status === 'RESOLVED' ? 'VIEWED' : f.status}
                </span>
                
                {f.status !== 'RESOLVED' && (
                  <button 
                    onClick={() => resolveFeedback(f.id)} 
                    style={{ background: "#0f172a", color: "white", padding: "8px 24px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={(e) => e.target.style.background = "#1e293b"}
                    onMouseLeave={(e) => e.target.style.background = "#0f172a"}
                  >
                    Mark as Viewed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
