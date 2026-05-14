import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { authService } from "../../../lib/apiService";
import "./LoginPage.css";
import "../components/LoginForm.css";

export function ResetPasswordPage(): React.JSX.Element {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status,          setStatus]          = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error,           setError]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid reset link");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      await authService.resetPassword(token, password);
      setStatus("success");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Invalid or expired reset link. Please request a new one.");
      setStatus("error");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-text">
            Air<span className="auth-logo-b">b</span>nb
          </span>
        </div>
        <hr className="auth-divider" />

        {status === "success" ? (
          <>
            <h1 className="auth-title">Password reset!</h1>
            <p className="auth-subtitle">
              Your password has been updated. Redirecting you to login…
            </p>
            <Link
              to="/login"
              className="auth-button"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            >
              Go to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">New password</h1>
            <p className="auth-subtitle">
              Choose a strong password of at least 8 characters.
            </p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setStatus("idle"); }}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setStatus("idle"); }}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" disabled={status === "loading"} className="auth-button">
                {status === "loading" ? "Saving…" : "Reset password"}
              </button>
              <div className="create-account-row">
                <span>Remembered it?</span>
                <Link to="/login" className="create-account-link">
                  Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
