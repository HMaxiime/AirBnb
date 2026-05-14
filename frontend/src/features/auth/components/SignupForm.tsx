import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./LoginForm.css";

type Role = "guest" | "host";

const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: "guest",
    label: "Guest",
    description: "Browse and book places to stay",
  },
  {
    value: "host",
    label: "Host",
    description: "List your property and earn",
  },
];

export function SignupForm(): React.JSX.Element {
  const { signup } = useAuth();
  const [role, setRole] = useState<Role>("guest");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setIsLoading(true);
    try {
      await signup(firstName, lastName, email, password, role);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">

      {/* Role picker */}
      <div className="form-group">
        <label>I want to</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 10px",
                border: `2px solid ${role === r.value ? "#ff5a5f" : "var(--border-2)"}`,
                borderRadius: 10,
                background: role === r.value ? "rgba(255,90,95,0.06)" : "var(--surface)",
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: role === r.value ? "#ff5a5f" : "var(--text)" }}>
                {r.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-light)", textAlign: "center", lineHeight: 1.3 }}>
                {r.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First name</label>
          <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required autoComplete="given-name" />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required autoComplete="family-name" />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email">Email address</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required autoComplete="new-password" />
      </div>

      <div className="form-group">
        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required autoComplete="new-password" />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isLoading} className="auth-button">
        {isLoading ? "Creating account…" : `Create account as ${role === "host" ? "Host" : "Guest"}`}
      </button>
    </form>
  );
}
