import { Role } from "../utils/permissions";
import { FormEvent, useState, useEffect } from "react";
import { getUserRoles, UserRole } from "../api/userRoles";

const seedAccounts: Record<Role, { email: string; password: string }> = {
  admin: { email: "admin@vellum.test", password: "TestPass123!" },
  designer: { email: "designer@vellum.test", password: "TestPass123!" },
  reviewer: { email: "reviewer@vellum.test", password: "TestPass123!" }
};

export function LoginPage({ onLogin }: { onLogin: (token: string, role: Role) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("reviewer");
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format role code as title case (e.g. DESIGNER -> Designer)
  const toTitleCase = (code: string) =>
    code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();

  // Fetch roles from backend on component mount
  // This demonstrates: Frontend → Backend → Database connection
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        setError(null);
        
        // Call backend API which queries PostgreSQL database
        const roles = await getUserRoles();
        
        setAvailableRoles(roles);
        
        // Set default role to first available
        if (roles.length > 0) {
          const firstRole = roles[0].role_code.toLowerCase() as Role;
          setRole(firstRole);
        }
      } catch (err) {
        console.error("Failed to fetch roles from backend:", err);
        setError(err instanceof Error ? err.message : "Failed to connect to backend");
        setAvailableRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

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
            placeholder={seedAccounts[role]?.email || "Enter email"}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={seedAccounts[role]?.password || "Enter password"}
          />
        </label>
        <label>
          Role
          <select 
            value={role} 
            onChange={(event) => setRole(event.target.value as Role)}
            disabled={loadingRoles}
          >
            {loadingRoles ? (
              <option>Loading roles...</option>
            ) : availableRoles.length > 0 ? (
              availableRoles.map((dbRole) => {
                const roleLower = dbRole.role_code.toLowerCase() as Role;
                return (
                  <option key={dbRole.id} value={roleLower}>
                    {toTitleCase(dbRole.role_code)}
                  </option>
                );
              })
            ) : (
              <>
                <option value="designer">Designer</option>
                <option value="reviewer">Reviewer</option>
                <option value="admin">Admin</option>
              </>
            )}
          </select>
        </label>
        <button type="submit" disabled={loadingRoles}>Login</button>
      </form>
    </div>
  );
}
