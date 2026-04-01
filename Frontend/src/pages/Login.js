import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginUser = async () => {
    setError("");
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      
      if (res.data.name) localStorage.setItem("name", res.data.name);
      if (res.data.email) localStorage.setItem("email", res.data.email);
      
      const role = res.data.role;
      if (res.data.id && role) {
        if (role === "STUDENT") localStorage.setItem("studentId", res.data.id);
        else if (role === "INSTRUCTOR") localStorage.setItem("instructorId", res.data.id);
        else if (role === "ADMIN") localStorage.setItem("adminId", res.data.id);
      }
      
      if (role === "STUDENT") navigate("/student");
      else if (role === "INSTRUCTOR") navigate("/instructor");
      else if (role === "ADMIN") navigate("/admin");
    } catch (err) {
      setError("Incorrect email or password.");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="login-title">SkillForge Login</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>Sign in to your account</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="email"
            placeholder="Email Address"
            className="login-input"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            required
          />
          
          <div className="password-toggle-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="login-input full-width"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              style={{ paddingRight: "44px" }}
            />
            <span 
              className="password-toggle-icon-wrap" 
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </span>
          </div>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button 
          type="button" 
          className="login-submit-btn" 
          style={{ width: "100%", marginTop: "16px" }}
          onClick={() => {
            const passwordOk = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(password);
            if (!password || !passwordOk) {
               setError("Password must be at least 6 chars and contain a letter, a number, and a special char.");
               return;
            }
            loginUser();
          }}
        >
          Login
        </button>

        <p className="link" onClick={() => navigate("/register")} style={{ marginTop: "20px" }}>
          Don't have an account? <span style={{ textDecoration: "underline" }}>Register</span>
        </p>
      </div>
    </div>
  );
}

export default Login;
