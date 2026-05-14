import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

export function LoginPage(): React.JSX.Element {
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
        <div className="auth-logo">
          <span className="auth-logo-text">
            Air<span className="auth-logo-b">b</span>nb
          </span>
        </div>

        <hr className="auth-divider" />

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <LoginForm />
      </div>
    </div>
  );
}
