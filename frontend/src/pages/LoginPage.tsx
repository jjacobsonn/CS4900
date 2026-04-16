import { FormEvent, useState } from "react";
import { login } from "../api/auth";
import type { AuthUser } from "../App";

export function LoginPage({ onLogin }: { onLogin: (token: string, user: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const result = await login(email, password);
      onLogin(result.token, { id: String(result.user.id), email: result.user.email, role: result.user.role });
    } catch (err) {
      const message =
        err instanceof Error ? err.message || "Login failed." : "Login failed.";
      setError(message);
    }
  };

  return (
    <div className="centered-page">
      <form className="card panel login-form" onSubmit={handleSubmit}>
        <div className="logo-tile">
          <img src="/vellum-logo.png" alt="" />
          <span>Vellum</span>
        </div>
        <p className="login-hint">
          Seed password: TestPass123!. Try Acme users at @vellum.test or Raccoon City users at @raccooncity.example.
        </p>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@vellum.test or chris.redfield@raccooncity.example"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="TestPass123!"
          />
        </label>
        <button className="btn btn-primary mt-3" type="submit">Login</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </div>
  );
}



