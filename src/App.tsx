import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { UploadPage } from "./pages/UploadPage";
import { AdminPage } from "./pages/AdminPage";
import { Role, allRoles, canAccessUpload, canReview } from "./utils/permissions";
import { useMemo, useState } from "react";

const TOKEN_KEY = "vellum_token";
const ROLE_KEY = "vellum_role";

function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem(ROLE_KEY) as Role) || "reviewer");

  const setLoggedIn = (nextToken: string, nextRole: Role) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(ROLE_KEY, nextRole);
    setToken(nextToken);
    setRoleState(nextRole);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  const setRole = (nextRole: Role) => {
    localStorage.setItem(ROLE_KEY, nextRole);
    setRoleState(nextRole);
  };

  return { token, role, setLoggedIn, logout, setRole };
}

function AppLayout({
  role,
  setRole,
  onLogout,
  children
}: {
  role: Role;
  setRole: (role: Role) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const allowUpload = canAccessUpload(role);
  const allowReview = canReview(role);
  const activeSection = location.pathname.startsWith("/assets")
    ? "review"
    : location.pathname.startsWith("/admin")
      ? "admin"
    : location.pathname.startsWith("/upload")
      ? "upload"
      : "dashboard";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-box">Vellum</div>
        <nav className="nav-links">
          <button type="button" onClick={() => navigate("/dashboard")} className={location.pathname === "/dashboard" ? "active" : ""}>
            Dashboard
          </button>
          <button type="button" onClick={() => navigate("/upload")} className={location.pathname === "/upload" ? "active" : ""}>
            Upload
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className={location.pathname === "/admin" ? "active" : ""}
            disabled={role !== "admin"}
          >
            Admin
          </button>
        </nav>
        <div className="header-actions">
          <label>
            Role
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {allRoles.map((currentRole) => (
                <option key={currentRole} value={currentRole}>
                  {currentRole}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="permissions-note">
        <span className={`dot ${activeSection === "dashboard" ? "active" : ""}`} aria-hidden />
        <span className={`dot ${activeSection === "review" ? "active" : ""}`} aria-hidden />
        <span className={`dot ${activeSection === "upload" ? "active" : ""}`} aria-hidden />
        <span className={`dot ${activeSection === "admin" ? "active" : ""}`} aria-hidden />
        <span className="footnote">Review: {allowReview ? "on" : "off"} | Upload: {allowUpload ? "on" : "off"}</span>
      </footer>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const isLoggedIn = useMemo(() => Boolean(auth.token), [auth.token]);

  if (!isLoggedIn) {
    return <LoginPage onLogin={auth.setLoggedIn} />;
  }

  return (
    <AppLayout role={auth.role} setRole={auth.setRole} onLogout={auth.logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage role={auth.role} />} />
        <Route path="/upload" element={<UploadPage role={auth.role} />} />
        <Route path="/admin" element={auth.role === "admin" ? <AdminPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}
