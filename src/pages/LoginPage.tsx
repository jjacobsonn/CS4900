import { Role } from "../utils/permissions";
import { FormEvent, useState } from "react";

const seedAccounts: Record<Role, { email: string; password: string }> = {
  admin: { email: "admin@vellum.test", password: "TestPass123!" },
  designer: { email: "designer@vellum.test", password: "TestPass123!" },
  reviewer: { email: "reviewer@vellum.test", password: "TestPass123!" }
};

export function LoginPage({ onLogin }: { onLogin: (token: string, role: Role) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("reviewer");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;
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
            placeholder={seedAccounts[role].email}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={seedAccounts[role].password}
          />
        </label>
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="designer">designer</option>
            <option value="reviewer">reviewer</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
