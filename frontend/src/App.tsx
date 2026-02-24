import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { UploadPage } from "./pages/UploadPage";
import { AdminPage } from "./pages/AdminPage";
import { BackendTestPage } from "./pages/BackendTestPage";
import { Role, canAccessUpload, canReview } from "./utils/permissions";
import { useMemo, useState } from "react";

const TOKEN_KEY = "vellum_token";
const ROLE_KEY = "vellum_role";

// Lightweight auth state for Sprint 1 demo flow.
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

  return { token, role, setLoggedIn, logout };
}

function AppLayout({
  role,
  onLogout,
  children
}: {
  role: Role;
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
          <button
            type="button"
            onClick={() => navigate("/upload")}
            className={location.pathname === "/upload" ? "active" : ""}
            disabled={!allowUpload}
          >
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
          <button
            type="button"
            onClick={() => navigate("/backend-test")}
            className={location.pathname === "/backend-test" ? "active" : ""}
            disabled={role !== "admin"}
          >
            Backend Test
          </button>
        </nav>
        <div className="header-actions">
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
    <AppLayout role={auth.role} onLogout={auth.logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/upload" element={canAccessUpload(auth.role) ? <UploadPage role={auth.role} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/admin" element={auth.role === "admin" ? <AdminPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/backend-test" element={auth.role === "admin" ? <BackendTestPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}
