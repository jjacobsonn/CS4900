import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { UploadPage } from "./pages/UploadPage";
import { AdminPage } from "./pages/AdminPage";
import { OrganizationDetailPage } from "./pages/OrganizationDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { AssetsPage } from "./pages/AssetsPage";
import { ManagerPage } from "./pages/ManagerPage";
import { Role, canAccessAdmin, canAccessUpload } from "./utils/permissions";
import { useEffect, useMemo, useState } from "react";

const TOKEN_KEY = "vellum_token";
const ROLE_KEY = "vellum_role";
const USER_KEY = "vellum_user";

export type AuthUser = { id: string; email: string; role: Role };

function parseUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    if (o && typeof o === "object" && "id" in o && "email" in o && "role" in o)
      return { id: String((o as AuthUser).id), email: String((o as AuthUser).email), role: (o as AuthUser).role };
  } catch {
    return null;
  }
  return null;
}

// Lightweight auth state: token, role, and user (id, email, role) for comment author etc.
export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem(ROLE_KEY) as Role) || "reviewer");
  const [user, setUser] = useState<AuthUser | null>(() => parseUser(localStorage.getItem(USER_KEY)));

  const setLoggedIn = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(ROLE_KEY, nextUser.role);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setRoleState(nextUser.role);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return { token, role, user, setLoggedIn, logout };
}

function AppLayout({
  role,
  user,
  onLogout,
  children
}: {
  role: Role;
  user: AuthUser | null;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const allowUpload = canAccessUpload(role);
  const isAdmin = canAccessAdmin(role);
  const canAccessManagerWorkspace = role === "manager" || role === "admin";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const goTo = (path: string) => {
    navigate(path);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-box">
          <img src="/vellum-logo.png" alt="" />
          <span>Vellum</span>
        </div>
        <button
          type="button"
          className={`menu-toggle ${isMobileMenuOpen ? "open" : ""}`}
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-navigation"
          aria-label="Toggle navigation menu"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav id="main-navigation" className={`nav-links ${isMobileMenuOpen ? "open" : ""}`}>
          <button type="button" onClick={() => goTo("/dashboard")} className={location.pathname === "/dashboard" ? "active" : ""}>
            Dashboard
          </button>
          {allowUpload && (
            <button
              type="button"
              onClick={() => goTo("/upload")}
              className={location.pathname === "/upload" ? "active" : ""}
            >
              Upload
            </button>
          )}
          <button
            type="button"
            onClick={() => goTo("/projects")}
            className={location.pathname === "/projects" ? "active" : ""}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => goTo("/assets")}
            className={location.pathname === "/assets" ? "active" : ""}
          >
            Assets
          </button>
          {canAccessManagerWorkspace && (
            <button
              type="button"
              onClick={() => goTo("/manager")}
              className={location.pathname === "/manager" ? "active" : ""}
            >
              Manager
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => goTo("/admin")}
              className={location.pathname === "/admin" ? "active" : ""}
            >
              Admin
            </button>
          )}
          <button type="button" className="mobile-logout" onClick={onLogout}>
            Logout
          </button>
        </nav>
        <div className="header-actions">
          {user && (
            <div className="user-pill" aria-label="Current user">
              <span className="user-email">{user.email}</span>
            </div>
          )}
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const isLoggedIn = useMemo(() => Boolean(auth.token), [auth.token]);
  const canAccessManagerWorkspace = auth.role === "manager" || auth.role === "admin";

  if (!isLoggedIn) {
    return <LoginPage onLogin={auth.setLoggedIn} />;
  }

  return (
    <AppLayout role={auth.role} user={auth.user} onLogout={auth.logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage role={auth.role} />} />
        <Route path="/manager" element={canAccessManagerWorkspace ? <ManagerPage role={auth.role} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/projects" element={<ProjectsPage role={auth.role} />} />
        <Route path="/assets" element={<AssetsPage role={auth.role} />} />
        <Route path="/assets/:id" element={<AssetDetailPage currentUser={auth.user} />} />
        <Route
          path="/upload"
          element={
            canAccessUpload(auth.role) ? (
              <UploadPage role={auth.role} currentUser={auth.user} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={canAccessAdmin(auth.role) ? <AdminPage currentUser={auth.user} /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/admin/organizations/:id"
          element={canAccessAdmin(auth.role) ? <OrganizationDetailPage role={auth.role} /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}



