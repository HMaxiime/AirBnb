import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../../lib/apiService";
import "./LoginPage.css";
import "../components/LoginForm.css";

export function ForgotPasswordPage(): React.JSX.Element {
  const [email, setEmail]       = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError]       = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await authService.forgotPassword(email);
      setResetToken(res.resetToken ?? null);
      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again.");
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

        {status === "sent" ? (
          <>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              If <strong>{email}</strong> is registered, a reset link has been sent.
            </p>
            {resetToken && (
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                  (Dev mode — use this link to reset your password)
                </p>
                <Link
                  to={`/reset-password/${resetToken}`}
                  className="forgot-password-link"
                  style={{ fontSize: 14 }}
                >
                  Open reset link →
                </Link>
              </div>
            )}
            <Link
              to="/login"
              className="auth-button"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            >
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">Forgot password</h1>
            <p className="auth-subtitle">
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" disabled={status === "loading"} className="auth-button">
                {status === "loading" ? "Sending…" : "Send reset link"}
              </button>
              <div className="create-account-row">
                <span>Remember your password?</span>
                <Link to="/login" className="create-account-link">
                  Log in
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
