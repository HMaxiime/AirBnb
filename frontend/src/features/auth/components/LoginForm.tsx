import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./LoginForm.css";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401) {
        setError("Incorrect details, try again.");
      } else {
        setError(
          err instanceof Error ? err.message : "Invalid email or password.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
        <Link to="/forgot-password" className="forgot-password-link">
          Forgot password?
        </Link>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isLoading} className="auth-button">
        {isLoading ? "Signing in…" : "Log in"}
      </button>
      <div className="create-account-row">
        <span>Don't have an account?</span>
        <Link to="/signup" className="create-account-link">
          Create account
        </Link>
      </div>
    </form>
  );
}
