import { useNavigate } from "react-router-dom";
import heroImg from "../assets/image1.jpg";

function Home() {

  const navigate = useNavigate();

  return (

    <div>
      {/* Navbar */}

      <nav className="navbar">
        <div className="logo">SKILLFORGE</div>
        <div className="nav-buttons">
          <button className="login-btn"
            onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="register-btn"
            onClick={() => navigate("/register")}>
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}

      <div className="hero">
        <div className="hero-text">
          <h1>
            SkillForge - AI Driven <br />
            Adaptive Learning & Exam Generator
          </h1>

          <p>
            Empowering your skill development with
            AI-powered personalized learning paths.
          </p>

          <button
            className="start-btn"
            onClick={() => navigate("/register")}
          >
          Start Your Journey
          </button>

        </div>

        <div className="hero-img">

          <img src={heroImg} alt="students learning" />

        </div>

      </div>

      {/* About / Features */}
      <section className="home-features">
        <div className="home-features-inner">
          <div className="home-features-header">
            <h2>Built for real learning outcomes</h2>
            <p>
              SkillForge combines adaptive learning, powerful analytics, and instructor tooling to help students learn
              smarter and help educators teach with clarity.
            </p>
          </div>

          <div className="home-feature-grid">
            <div className="home-feature-card">
              <div className="home-feature-icon">🧠</div>
              <h3>Adaptive learning paths</h3>
              <p>Recommendations adjust using your progress and quiz performance—focus on what you need next.</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">📈</div>
              <h3>Actionable analytics</h3>
              <p>Track score trends, topic completion, strengths, and gaps with clear, visual dashboards.</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon"><i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#eab308" }}></i></div>
              <h3>AI quiz generation</h3>
              <p>Create practice quizzes faster and keep learners engaged with targeted assessment.</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon"><i className="fa-solid fa-book-open" style={{ color: "#3b82f6" }}></i></div>
              <h3>Course management</h3>
              <p>Instructors can organize courses, subjects, and topics with resources (PDFs, videos, links).</p>
            </div>
          </div>

          <div className="home-cta-row">
            <div className="home-cta-card">
              <div className="home-cta-text">
                <h3>Ready to try SkillForge?</h3>
                <p>Create an account and start learning with adaptive recommendations in minutes.</p>
              </div>
              <button className="start-btn home-cta-btn" onClick={() => navigate("/register")}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* <footer className="footer">
© 2024 SkillForge. All rights reserved.
</footer> */}

    </div>

  );

}

export default Home;