import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignupForm } from "../components/SignupForm";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

export function SignupPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === "host") navigate("/host", { replace: true });
    else if (user.role === "admin") navigate("/admin", { replace: true });
    else navigate("/", { replace: true });
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-tabs">
          <Link to="/login" className="auth-tab">Log in</Link>
        </div>

        <div className="auth-logo">
          <span className="auth-logo-text">
            Air<span className="auth-logo-b">b</span>nb
          </span>
        </div>

        <hr className="auth-divider" />

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join millions of travellers on Airbnb</p>

        <SignupForm />
      </div>
    </div>
  );
}
