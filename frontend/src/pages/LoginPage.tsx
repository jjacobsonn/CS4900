import { FormEvent, useState } from "react";
import { Role } from "../utils/permissions";

const seedAccounts: Record<Role, { email: string; password: string }> = {
  admin: { email: "admin@vellum.test", password: "TestPass123!" },
  designer: { email: "designer@vellum.test", password: "TestPass123!" },
  reviewer: { email: "reviewer@vellum.test", password: "TestPass123!" }
};

function resolveSeedRole(loginEmail: string): Role | null {
  const normalized = loginEmail.trim().toLowerCase();
  for (const [role, account] of Object.entries(seedAccounts) as Array<[Role, { email: string; password: string }]>) {
    if (account.email.toLowerCase() === normalized) {
      return role;
    }
  }
  return null;
}

export function LoginPage({ onLogin }: { onLogin: (token: string, role: Role) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    const role = resolveSeedRole(email);
    if (!role) {
      setError("Unknown account. Use one of the seeded emails.");
      return;
    }

    if (password !== seedAccounts[role].password) {
      setError("Invalid password for seeded account.");
      return;
    }

    // auth is intentionally simulated via seeded accounts for sprint 1
    onLogin("mock-token", role);
  };

  return (
    <div className="centered-page">
      <form className="panel login-form" onSubmit={handleSubmit}>
        <div className="logo-tile">Vellum</div>
        <p className="login-hint">
          Seed accounts: admin@vellum.test, designer@vellum.test, reviewer@vellum.test
        </p>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@vellum.test (or designer/reviewer)"
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
        <button type="submit">Login</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </div>
  );
}
