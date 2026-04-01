import React,{useState} from "react";
import API from "../services/api";
import {useNavigate} from "react-router-dom";

function Register(){

const navigate = useNavigate();

const [user,setUser] = useState({
name:"",
email:"",
password:"",
role:"STUDENT"
});

const [errorMsg, setErrorMsg] = useState("");
const [showPassword, setShowPassword] = useState(false);

const handleChange=(e)=>{
setUser({...user,[e.target.name]:e.target.value});
setErrorMsg("");
};

const registerUser=async()=>{

try{

setErrorMsg("");

const name = user.name.trim();
const email = user.email.trim();
const password = user.password;

if (!name) {
  setErrorMsg("Please enter your name.");
  return;
}

const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
if (!emailOk) {
  setErrorMsg("Please enter a valid email address.");
  return;
}

const passwordOk = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(password);
if (!password || !passwordOk) {
  setErrorMsg("Password must be at least 6 chars and contain a letter, a number, and a special char.");
  return;
}

await API.post("/auth/register",user);

alert("User Registered");

setUser({
name:"",
email:"",
password:"",
role:"STUDENT"
});

navigate("/login");

}catch(err){
const status = err?.response?.status;
const data = err?.response?.data;
const serverMsg =
  (typeof data === "string" ? data : null) ||
  data?.message ||
  data?.detail ||
  data?.error ||
  err?.message;

if (status === 409) {
  setErrorMsg(serverMsg || "Email already registered. Please login.");
  return;
}

setErrorMsg(serverMsg || "Registration failed. Please try again.");
}

};

return(

<div className="container">

<div className="card">

<h2 className="login-title">Create Account</h2>

{errorMsg ? (
  <div style={{ padding: "10px", borderRadius: "8px", marginBottom: "15px", fontSize: "13px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", textAlign: "left" }}>
     {errorMsg}
  </div>
) : null}

<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
  <input
    name="name"
    placeholder="Full Name"
    className="login-input"
    value={user.name}
    onChange={handleChange}
  />

  <input
    name="email"
    placeholder="Email Address"
    className="login-input"
    value={user.email}
    onChange={handleChange}
  />

  <div className="password-toggle-wrapper">
    <input
      name="password"
      placeholder="Password"
      type={showPassword ? "text" : "password"}
      className="login-input full-width"
      value={user.password}
      onChange={handleChange}
      style={{ paddingRight: "44px" }}
    />
    <span 
      className="password-toggle-icon-wrap" 
      onClick={() => setShowPassword(!showPassword)}
    >
      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
    </span>
  </div>

  <select
    name="role"
    className="login-input"
    value={user.role}
    onChange={handleChange}
    style={{ background: "#fff" }}
  >
    <option value="STUDENT">Student</option>
    <option value="INSTRUCTOR">Instructor</option>
    <option value="ADMIN">Admin</option>
  </select>
</div>

<button 
  className="login-submit-btn" 
  style={{ width: "100%", marginTop: "20px" }}
  onClick={registerUser}
>
  Register
</button>

<p
  className="link"
  style={{ marginTop: "20px" }}
  onClick={()=>navigate("/login")}
>
  Already have an account? <span style={{ fontWeight: 700, textDecoration: "underline" }}>Login</span>
</p>

</div>

</div>

);

}

export default Register;