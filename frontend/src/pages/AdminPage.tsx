import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminActivity, getAdminOverview } from "../api/admin";
import { deleteAsset } from "../api/assets";
import { deleteComment } from "../api/comments";
import type { AdminActivity } from "../api/admin";
import { getClients, type Client } from "../api/clients";
import {
  createOrganization,
  getOrganizations
} from "../api/organizations";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
  type Project,
  type ProjectDetail
} from "../api/projects";
import { createUser, getUsers, removeUser, updateUser, updateUserActive } from "../api/users";
import { AdminOverview, Organization, UserAccount } from "../types/models";
import { Role } from "../utils/permissions";
import type { AuthUser } from "../App";
import { statusLabel } from "../utils/format";

const defaultOverview: AdminOverview = {
  pendingReview: 0,
  changesRequested: 0,
  approved: 0
};

const defaultActivity: AdminActivity = { recentAssets: [], recentComments: [] };

function isMissingOrganizationsTable(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("organizations") && m.includes("does not exist");
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

export function AdminPage({ currentUser = null }: { currentUser?: AuthUser | null }) {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview>(defaultOverview);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activity, setActivity] = useState<AdminActivity>(defaultActivity);
  const [loading, setLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [userEditOpen, setUserEditOpen] = useState(false);
  const [userEditId, setUserEditId] = useState<string | null>(null);
  const [userEditEmail, setUserEditEmail] = useState("");
  const [userEditDisplayName, setUserEditDisplayName] = useState("");
  const [userEditRole, setUserEditRole] = useState<Role>("designer");
  const [userEditActive, setUserEditActive] = useState(true);
  const [userEditPassword, setUserEditPassword] = useState("");
  const [userEditError, setUserEditError] = useState<string | null>(null);
  const [userEditSaving, setUserEditSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetUserEmail, setResetUserEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role>("designer");
  const [createPassword, setCreatePassword] = useState("");
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState("");
  const [showAssets, setShowAssets] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [newProjectClientId, setNewProjectClientId] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("Active");
  const [newProjectPriority, setNewProjectPriority] = useState("");
  const [newProjectDue, setNewProjectDue] = useState("");
  const [newProjectOwnerUserId, setNewProjectOwnerUserId] = useState("");
  const [projectError, setProjectError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgFormName, setOrgFormName] = useState("");
  const [orgFormDescription, setOrgFormDescription] = useState("");
  const [orgFormOwnerUserId, setOrgFormOwnerUserId] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [orgSort, setOrgSort] = useState<"name_asc" | "name_desc" | "newest" | "oldest" | "active_first">("active_first");
  const [newProjectOrganizationId, setNewProjectOrganizationId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editPriority, setEditPriority] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editOwnerUserId, setEditOwnerUserId] = useState("");

  const load = async () => {
    setLoading(true);
    setUsersError(null);
    setCreateUserError(null);
    setOrgError(null);
    try {
      const [overviewData, usersData, activityData, projectsData, clientsData, orgsData] = await Promise.all([
        getAdminOverview().catch(() => defaultOverview),
        getUsers().catch((err: Error) => {
          setUsersError(err.message || "Could not load users");
          return [];
        }),
        getAdminActivity().catch(() => defaultActivity),
        getProjects().catch(() => [] as Project[]),
        getClients().catch(() => [] as Client[]),
        getOrganizations().catch((err: Error) => {
          const msg = err.message || "";
          if (!isMissingOrganizationsTable(msg)) {
            setOrgError(msg || "Could not load organizations.");
          }
          return [] as Organization[];
        })
      ]);
      setOverview(overviewData);
      setUsers(usersData);
      setActivity(activityData);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setOrganizations(Array.isArray(orgsData) ? orgsData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (organizations.length > 0 && newProjectOrganizationId === "") {
      setNewProjectOrganizationId(String(organizations[0].id));
    }
  }, [organizations, newProjectOrganizationId]);

  const filteredOrganizations = useMemo(() => {
    const q = orgSearch.trim().toLowerCase();
    const visible = organizations.filter((org) => {
      if (!q) return true;
      return (
        org.name.toLowerCase().includes(q) ||
        String(org.description || "")
          .toLowerCase()
          .includes(q)
      );
    });
    const sorted = [...visible];
    sorted.sort((a, b) => {
      if (orgSort === "name_asc") return a.name.localeCompare(b.name);
      if (orgSort === "name_desc") return b.name.localeCompare(a.name);
      if (orgSort === "oldest") return Date.parse(a.createdAt || "") - Date.parse(b.createdAt || "");
      if (orgSort === "newest") return Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "");
      const aScore = a.isActive === false ? 1 : 0;
      const bScore = b.isActive === false ? 1 : 0;
      if (aScore !== bScore) return aScore - bScore;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [organizations, orgSearch, orgSort]);

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setCreateUserError(null);
    if (!email.trim()) return;
    if (createPassword.trim() !== "" || createPasswordConfirm.trim() !== "") {
      if (createPassword !== createPasswordConfirm) {
        setCreateUserError("Password confirmation does not match.");
        return;
      }
      if (createPassword.trim().length < 4) {
        setCreateUserError("Password must be at least 4 characters.");
        return;
      }
    }
    try {
      const payload = {
        email: email.trim(),
        role,
        displayName: displayName.trim() || undefined,
        ...(createPassword.trim() !== "" ? { password: createPassword.trim() } : {})
      };
      await createUser(payload);
      setEmail("");
      setDisplayName("");
      setRole("designer");
      setCreatePassword("");
      setCreatePasswordConfirm("");
      await load();
    } catch (err) {
      setCreateUserError(err instanceof Error ? err.message : "Could not create user.");
    }
  };

  const openUserEdit = (user: UserAccount) => {
    setUserEditId(user.id);
    setUserEditEmail(user.email);
    setUserEditDisplayName(user.displayName ?? "");
    setUserEditRole(user.role as Role);
    setUserEditActive(user.isActive);
    setUserEditPassword("");
    setUserEditError(null);
    setUserEditOpen(true);
  };

  const closeUserEdit = () => {
    setUserEditOpen(false);
    setUserEditId(null);
    setUserEditError(null);
    setUserEditPassword("");
  };

  const openResetPasswordModal = (id: string, email: string) => {
    if (email.toLowerCase() === "admin@vellum.test") return;
    setResetUserId(id);
    setResetUserEmail(email);
    setResetPassword("");
    setResetPasswordConfirm("");
    setResetError(null);
    setResetOpen(true);
  };

  const closeResetPasswordModal = () => {
    setResetOpen(false);
    setResetUserId(null);
    setResetUserEmail("");
    setResetPassword("");
    setResetPasswordConfirm("");
    setResetError(null);
    setResetSaving(false);
  };

  const handleSaveUserEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (userEditId == null) return;
    setUserEditSaving(true);
    setUserEditError(null);
    try {
      const body: Parameters<typeof updateUser>[1] = {
        email: userEditEmail.trim(),
        displayName: userEditDisplayName.trim() || null,
        role: userEditRole,
        is_active: userEditActive
      };
      if (userEditPassword.trim() !== "") {
        body.password = userEditPassword.trim();
      }
      await updateUser(userEditId, body);
      closeUserEdit();
      await load();
    } catch (err) {
      setUserEditError(err instanceof Error ? err.message : "Could not save user.");
    } finally {
      setUserEditSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setUsersError(null);
    try {
      await updateUserActive(id, false);
      await load();
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Could not update user.");
    }
  };

  const handleReactivate = async (id: string) => {
    setUsersError(null);
    try {
      await updateUserActive(id, true);
      await load();
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Could not update user.");
    }
  };

  const handleRemoveUserAccess = async (id: string, email: string) => {
    if (email.toLowerCase() === "admin@vellum.test") return;
    const ok = window.confirm("Remove sign-in access for this user? They can be reactivated later from this table.");
    if (!ok) return;
    setUsersError(null);
    try {
      await removeUser(id);
      await load();
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Could not remove access.");
    }
  };

  const handleResetPasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (resetUserId == null) return;
    if (resetPassword !== resetPasswordConfirm) {
      setResetError("Password confirmation does not match.");
      return;
    }
    const trimmed = resetPassword.trim();
    if (trimmed.length < 4) {
      setResetError("Password must be at least 4 characters.");
      return;
    }
    setResetSaving(true);
    setResetError(null);
    try {
      await updateUser(resetUserId, { password: trimmed });
      await load();
      closeResetPasswordModal();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setResetSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const ok = window.confirm("Delete this asset and all its comments/versions?");
    if (!ok) return;
    await deleteAsset(id);
    await load();
  };

  const handleDeleteComment = async (assetId: string, commentId: string) => {
    const ok = window.confirm("Delete this comment?");
    if (!ok) return;
    await deleteComment(assetId, commentId);
    await load();
  };

  const handleCreateOrganization = async (event: FormEvent) => {
    event.preventDefault();
    setOrgError(null);
    if (!orgFormName.trim()) return;
    try {
      const payload: Parameters<typeof createOrganization>[0] = {
        name: orgFormName.trim(),
        description: orgFormDescription.trim() || undefined
      };
      if (orgFormOwnerUserId.trim() !== "") {
        const ou = Number(orgFormOwnerUserId);
        if (Number.isFinite(ou)) payload.initialOwnerUserId = ou;
      }
      await createOrganization(payload);
      setOrgFormName("");
      setOrgFormDescription("");
      setOrgFormOwnerUserId("");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setOrgError(isMissingOrganizationsTable(msg) ? "Could not create organization." : msg || "Could not create organization.");
    }
  };

  const handleCreateProject = async (event: FormEvent) => {
    event.preventDefault();
    setProjectError(null);
    if (!projectName.trim()) return;
    const orgId = Number(newProjectOrganizationId);
    if (!Number.isFinite(orgId)) {
      setProjectError("Select an organization for this project.");
      return;
    }
    try {
      const createPayload: Parameters<typeof createProject>[0] = {
        organizationId: orgId,
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        clientId: newProjectClientId ? Number(newProjectClientId) : undefined,
        status: newProjectStatus,
        priority: newProjectPriority.trim() || undefined,
        dueDate: newProjectDue.trim() || undefined
      };
      if (newProjectOwnerUserId.trim() !== "") {
        const ou = Number(newProjectOwnerUserId);
        if (Number.isFinite(ou)) createPayload.ownerUserId = ou;
      }
      await createProject(createPayload);

      setProjectName("");
      setProjectDescription("");
      setNewProjectClientId("");
      setNewProjectStatus("Active");
      setNewProjectPriority("");
      setNewProjectDue("");
      setNewProjectOwnerUserId("");
      await load();
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : "Could not create project.");
    }
  };

  const projectOwnerColumnLabel = (p: Project) => {
    const uid = p.ownerUserId;
    if (uid == null) return "—";
    const fromUsers = users.find((u) => String(u.id) === String(uid));
    if (fromUsers) return fromUsers.displayName || fromUsers.email;
    if (currentUser && String(currentUser.id) === String(uid)) return currentUser.email;
    return `#${uid}`;
  };

  const openProjectDetail = async (id: number) => {
    setSelectedProjectId(id);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const d = await getProject(id);
      setProjectDetail(d);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Failed to load project");
      setProjectDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!projectDetail) return;
    setEditName(projectDetail.name);
    setEditDescription(projectDetail.description ?? "");
    setEditStatus(projectDetail.status);
    setEditPriority(projectDetail.priority ?? "");
    setEditDueDate(projectDetail.dueDate ? projectDetail.dueDate.slice(0, 10) : "");
    setEditClientId(projectDetail.clientId != null ? String(projectDetail.clientId) : "");
    setEditOwnerUserId(projectDetail.ownerUserId != null ? String(projectDetail.ownerUserId) : "");
  }, [projectDetail]);

  const closeProjectDetail = () => {
    setSelectedProjectId(null);
    setProjectDetail(null);
    setDetailError(null);
  };

  const handleSaveProject = async () => {
    if (selectedProjectId == null) return;
    setSavingProject(true);
    setDetailError(null);
    try {
      await updateProject(selectedProjectId, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        status: editStatus,
        priority: editPriority.trim() || null,
        dueDate: editDueDate.trim() || null,
        clientId: editClientId === "" ? null : Number(editClientId),
        ownerUserId: editOwnerUserId === "" ? null : Number(editOwnerUserId)
      });
      await load();
      await openProjectDetail(selectedProjectId);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (selectedProjectId == null) return;
    const ok = window.confirm(
      "Delete this project? Linked assets remain in the system but will no longer be assigned to this project."
    );
    if (!ok) return;
    try {
      await deleteProject(selectedProjectId);
      closeProjectDetail();
      await load();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const projectStatusOptions = ["Active", "On hold", "Archived", "Completed"];

  return (
    <section className="page-grid admin-page">
      <div className="card panel admin-overview-panel">
        <div>
          <p className="admin-console-kicker">Operations</p>
          <h1>Admin Console</h1>
          <p className="admin-muted admin-console-intro">
            Manage organizations, projects, users, and review activity from one workspace.
          </p>
        </div>
        <div className="admin-stat-grid">
          <div className="dashboard-metric">
            <span className="dashboard-metric-label">Needs Review</span>
            <strong>{overview.pendingReview}</strong>
          </div>
          <div className="dashboard-metric">
            <span className="dashboard-metric-label">Changes</span>
            <strong>{overview.changesRequested}</strong>
          </div>
          <div className="dashboard-metric muted">
            <span className="dashboard-metric-label">Approved</span>
            <strong>{overview.approved}</strong>
          </div>
          <div className="dashboard-metric">
            <span className="dashboard-metric-label">Users</span>
            <strong>{users.length}</strong>
          </div>
          <div className="dashboard-metric">
            <span className="dashboard-metric-label">Active Users</span>
            <strong>{users.filter((user) => user.isActive).length}</strong>
          </div>
        </div>
      </div>

      <div className="card panel admin-desktop-only admin-aside-panel">
        <h1>Snapshot</h1>
        <ul className="overview-list list-group">
          <li className="list-group-item">Organizations: {organizations.length}</li>
          <li className="list-group-item">Projects: {projects.length}</li>
          <li className="list-group-item">Clients: {clients.length}</li>
          <li className="list-group-item">Recent assets: {Math.min(activity.recentAssets.length, 5)}</li>
        </ul>
      </div>

      <div className="card panel admin-activity-panel">
        <h1>Recent Activity</h1>

        <div className="admin-split-header">
          <h2 className="admin-section-title">Recent assets</h2>
          {activity.recentAssets.length > 0 && (
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAssets((prev) => !prev)}>
              {showAssets ? "Hide" : "Show"}
            </button>
          )}
        </div>

        {showAssets && (
          <div className="admin-scroll-table">
            {activity.recentAssets.length === 0 ? (
              <p>No assets yet.</p>
            ) : (
              <table className="table table-hover align-middle admin-table compact">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {activity.recentAssets.slice(0, 5).map((asset) => (
                    <tr key={asset.id}>
                      <td data-label="Title">
                        <button
                          type="button"
                          onClick={() => navigate(`/assets/${asset.id}`)}
                          className="admin-link-button"
                        >
                          {asset.title}
                        </button>
                      </td>
                      <td data-label="Status">{statusLabel(asset.status)}</td>
                      <td data-label="Owner">{asset.owner}</td>
                      <td data-label="Updated">{formatDate(asset.updatedAt)}</td>
                      <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 actions-cell">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => void handleDeleteAsset(String(asset.id))}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="admin-split-header admin-section-gap">
          <h2 className="admin-section-title">Recent comments</h2>
          {activity.recentComments.length > 0 && (
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowComments((prev) => !prev)}>
              {showComments ? "Hide" : "Show"}
            </button>
          )}
        </div>

        {showComments && (
          <div className="admin-scroll-table">
            {activity.recentComments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              <table className="table table-hover align-middle admin-table compact">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Comment</th>
                    <th>Author</th>
                    <th>When</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {activity.recentComments.slice(0, 3).map((comment) => (
                    <tr key={comment.id}>
                      <td data-label="Asset">
                        <button
                          type="button"
                          onClick={() => navigate(`/assets/${comment.assetId}`)}
                          className="admin-link-button"
                        >
                          {comment.assetTitle}
                        </button>
                      </td>
                      <td data-label="Comment">"{comment.message}"</td>
                      <td data-label="Author">{comment.author}</td>
                      <td data-label="When">{formatDate(comment.createdAt)}</td>
                      <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 actions-cell">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => void handleDeleteComment(String(comment.assetId), String(comment.id))}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="card panel admin-wide-panel admin-section-panel admin-organizations-section">
        <div className="admin-content">
          <h1>Organizations</h1>
          <form onSubmit={(e) => void handleCreateOrganization(e)} className="vstack gap-3 admin-form admin-project-create-form">
            <label>
              Organization name
              <input
                type="text"
                value={orgFormName}
                onChange={(e) => setOrgFormName(e.target.value)}
                placeholder="Acme Creative"
                required
              />
            </label>
            <label>
              Description
              <textarea value={orgFormDescription} onChange={(e) => setOrgFormDescription(e.target.value)} rows={2} />
            </label>
            {users.length > 0 && (
              <label>
                Initial owner (optional)
                <select value={orgFormOwnerUserId} onChange={(e) => setOrgFormOwnerUserId(e.target.value)}>
                  <option value="">You ({currentUser?.email ?? "signed-in admin"})</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || u.email}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="btn btn-primary" type="submit">
              Create organization
            </button>
          </form>
          {orgError && <p role="alert" className="admin-error">{orgError}</p>}

          <div className="admin-org-toolbar">
            <label>
              Search organizations
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search by name or description"
              />
            </label>
            <label>
              Sort
              <select value={orgSort} onChange={(e) => setOrgSort(e.target.value as typeof orgSort)}>
                <option value="active_first">Active first</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </label>
          </div>

          <div className="admin-org-cards admin-org-tile-grid">
            {filteredOrganizations.length === 0 ? (
              <p>No organizations yet.</p>
            ) : (
              filteredOrganizations.map((org) => (
                <article key={org.id} className="admin-org-card admin-org-tile">
                  <div className="admin-org-tile-head">
                    <strong>{org.name}</strong>
                    <span className={`status-badge ${org.isActive === false ? "changes_requested" : "approved"}`}>
                      {org.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </div>
                  <p className="admin-muted admin-org-tile-description">{org.description || "No description yet."}</p>
                  <Link className="btn btn-primary btn-sm file-link-btn admin-org-open-btn" to={`/admin/organizations/${org.id}`}>
                    Open
                  </Link>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {false && (
      <div className="card panel admin-wide-panel admin-section-panel admin-projects-section">
        <div className="admin-content">
          <h1>Projects</h1>
          <form onSubmit={(e) => void handleCreateProject(e)} className="vstack gap-3 admin-form admin-project-create-form">
            <label>
              Organization
              <select
                value={newProjectOrganizationId}
                onChange={(event) => setNewProjectOrganizationId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Select organization
                </option>
                {organizations.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Name
              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Project name"
                required
              />
            </label>
            <label>
              Description
              <textarea value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} rows={2} />
            </label>
            <label>
              Client
              <select value={newProjectClientId} onChange={(event) => setNewProjectClientId(event.target.value)}>
                <option value="">None</option>
                {clients.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select value={newProjectStatus} onChange={(event) => setNewProjectStatus(event.target.value)}>
                {projectStatusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <input
                type="text"
                value={newProjectPriority}
                onChange={(event) => setNewProjectPriority(event.target.value)}
                placeholder="Optional"
              />
            </label>
            <label>
              Due date
              <input type="date" value={newProjectDue} onChange={(event) => setNewProjectDue(event.target.value)} />
            </label>
            {users.length > 0 && (
              <label>
                Project owner (optional)
                <select
                  value={newProjectOwnerUserId}
                  onChange={(event) => setNewProjectOwnerUserId(event.target.value)}
                >
                  <option value="">You ({currentUser?.email ?? "creator"})</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="btn btn-primary" type="submit">
              Create project
            </button>
          </form>
          {projectError && <p role="alert" className="admin-error">{projectError}</p>}

          <div className="admin-scroll-table" style={{ marginTop: "1rem" }}>
            <table className="table table-hover align-middle admin-table compact">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Client</th>
                  <th>Owner</th>
                  <th>Assets</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={8}>No projects yet.</td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className={selectedProjectId === p.id ? "admin-row-selected" : undefined}>
                      <td data-label="ID">{p.id}</td>
                      <td data-label="Name">{p.name}</td>
                      <td data-label="Organization">{p.organizationName ?? "—"}</td>
                      <td data-label="Status">{p.status}</td>
                      <td data-label="Client">{p.clientName ?? "—"}</td>
                      <td data-label="Owner">{projectOwnerColumnLabel(p)}</td>
                      <td data-label="Assets">{p.assetCount ?? 0}</td>
                      <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 actions-cell">
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void openProjectDetail(p.id)}>
                          Open
                        </button>
                        <Link className="btn btn-outline-secondary btn-sm file-link-btn" to={`/upload?projectId=${p.id}`}>
                          Upload
                        </Link>
                        <Link className="btn btn-outline-secondary btn-sm file-link-btn" to={`/dashboard?projectId=${p.id}`}>
                          Queue
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedProjectId != null && (
            <div className="admin-project-detail">
              <div className="admin-split-header">
                <h2>Project #{selectedProjectId}</h2>
                <button type="button" className="btn btn-outline-secondary" onClick={closeProjectDetail}>
                  Close
                </button>
              </div>
              {detailLoading && <p>Loading…</p>}
              {detailError && <p role="alert" className="admin-error">{detailError}</p>}
              {!detailLoading && projectDetail && (
                <>
                  <div className="vstack gap-3 admin-form admin-project-edit-form">
                    <label>
                      Name
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </label>
                    <label>
                      Organization
                      <input type="text" value={projectDetail.organizationName ?? "—"} disabled />
                    </label>
                    <label>
                      Description
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
                    </label>
                    <label>
                      Client
                      <select value={editClientId} onChange={(e) => setEditClientId(e.target.value)}>
                        <option value="">None</option>
                        {clients.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Project owner
                      <select value={editOwnerUserId} onChange={(e) => setEditOwnerUserId(e.target.value)}>
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.displayName || u.email}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Status
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        {projectStatusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        {!projectStatusOptions.includes(editStatus) ? (
                          <option value={editStatus}>{editStatus}</option>
                        ) : null}
                      </select>
                    </label>
                    <label>
                      Priority
                      <input type="text" value={editPriority} onChange={(e) => setEditPriority(e.target.value)} />
                    </label>
                    <label>
                      Due date
                      <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                    </label>
                    <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={savingProject}
                        onClick={() => void handleSaveProject()}
                      >
                        {savingProject ? "Saving…" : "Save changes"}
                      </button>
                      <button type="button" className="btn btn-outline-danger" onClick={() => void handleDeleteProject()}>
                        Delete project
                      </button>
                    </div>
                  </div>

                  <h3 className="admin-section-title">Contributors</h3>
                  {projectDetail.contributors.length === 0 ? (
                    <p>No contributors yet.</p>
                  ) : (
                    <ul className="admin-contributor-list">
                      {projectDetail.contributors.map((c) => (
                        <li key={c.id}>
                          {c.displayName} <span className="admin-muted">({c.email})</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3 className="admin-section-title">Linked assets</h3>
                  {projectDetail.assets.length === 0 ? (
                    <p>No linked assets.</p>
                  ) : (
                    <div className="admin-scroll-table">
                      <table className="table table-hover align-middle admin-table compact">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Owner</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {projectDetail.assets.map((a) => (
                            <tr key={a.id}>
                              <td data-label="Title">{a.title}</td>
                              <td data-label="Status">{a.status}</td>
                              <td data-label="Owner">{a.owner}</td>
                              <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 actions-cell">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/assets/${a.id}`)}>
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      <div className="card panel admin-wide-panel admin-section-panel admin-users-section">
        <div className="admin-content">
          <h1>User Management</h1>
          <form onSubmit={(e) => void handleCreateUser(e)} className="vstack gap-3 admin-form">
            <label>
              Display name (optional)
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="e.g. Jane or jane.doe"
              />
            </label>
            <label>
              User Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
                <option value="designer">designer</option>
                <option value="reviewer">reviewer</option>
                <option value="manager">manager</option>
                <option value="owner">owner</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>
              Set password (optional)
              <input
                type="password"
                value={createPassword}
                onChange={(event) => setCreatePassword(event.target.value)}
                placeholder="At least 4 characters"
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={createPasswordConfirm}
                onChange={(event) => setCreatePasswordConfirm(event.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Create User
            </button>
          </form>
          {createUserError && <p role="alert" className="admin-error">{createUserError}</p>}

          <h2>Users</h2>
          {usersError && <p role="alert" className="admin-error">{usersError}</p>}
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="admin-users-table-wrap">
              <table className="table table-hover align-middle admin-table admin-user-table compact">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No users yet. Create one above.</td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isSeedAdmin = user.email.toLowerCase() === "admin@vellum.test";
                      return (
                        <tr key={user.id}>
                          <td data-label="Name">
                            {user.displayName || "—"}
                            {!user.isActive ? <span className="admin-muted"> · inactive</span> : null}
                          </td>
                          <td data-label="Email">{user.email}</td>
                          <td data-label="Role">{user.role}</td>
                          <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 admin-user-actions">
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => openUserEdit(user)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              disabled={!user.isActive || isSeedAdmin}
                              title={
                                isSeedAdmin
                                  ? "Primary admin cannot be deactivated"
                                  : !user.isActive
                                    ? "Already inactive"
                                    : undefined
                              }
                              onClick={() => void handleDeactivate(user.id)}
                            >
                              Deactivate
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              disabled={isSeedAdmin}
                              title={isSeedAdmin ? "Primary admin password reset is disabled here" : undefined}
                              onClick={() => openResetPasswordModal(user.id, user.email)}
                            >
                              Reset password
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              disabled={user.isActive}
                              title={user.isActive ? "User is active" : undefined}
                              onClick={() => void handleReactivate(user.id)}
                            >
                              Reactivate
                            </button>
                            {!isSeedAdmin ? (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => void handleRemoveUserAccess(user.id, user.email)}
                              >
                                Remove
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {userEditOpen && userEditId != null && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeUserEdit();
          }}
        >
          <div className="admin-modal" role="dialog" aria-labelledby="user-edit-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="user-edit-title" className="admin-section-title" style={{ marginBottom: "0.75rem" }}>
              Edit user
            </h2>
            <form onSubmit={(e) => void handleSaveUserEdit(e)} className="vstack gap-3 admin-form">
              <label>
                Email
                <input
                  type="email"
                  value={userEditEmail}
                  onChange={(e) => setUserEditEmail(e.target.value)}
                  disabled={userEditEmail.toLowerCase() === "admin@vellum.test"}
                  required
                />
              </label>
              <label>
                Display name
                <input type="text" value={userEditDisplayName} onChange={(e) => setUserEditDisplayName(e.target.value)} />
              </label>
              <label>
                Role
                <select
                  value={userEditRole}
                  onChange={(e) => setUserEditRole(e.target.value as Role)}
                  disabled={userEditEmail.toLowerCase() === "admin@vellum.test"}
                >
                  <option value="designer">designer</option>
                  <option value="reviewer">reviewer</option>
                  <option value="manager">manager</option>
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={userEditActive}
                  onChange={(e) => setUserEditActive(e.target.checked)}
                  disabled={userEditEmail.toLowerCase() === "admin@vellum.test"}
                />{" "}
                Account active
              </label>
              <label>
                New password (optional)
                <input
                  type="password"
                  autoComplete="new-password"
                  value={userEditPassword}
                  onChange={(e) => setUserEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </label>
              {userEditError && <p role="alert" className="admin-error">{userEditError}</p>}
              <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
                <button type="submit" className="btn btn-primary" disabled={userEditSaving}>
                  {userEditSaving ? "Saving…" : "Save"}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={closeUserEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetOpen && resetUserId != null && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeResetPasswordModal();
          }}
        >
          <div className="admin-modal" role="dialog" aria-labelledby="reset-password-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="reset-password-title" className="admin-section-title" style={{ marginBottom: "0.75rem" }}>
              Reset password
            </h2>
            <p className="admin-muted" style={{ marginTop: 0 }}>{resetUserEmail}</p>
            <form onSubmit={(e) => void handleResetPasswordSubmit(e)} className="vstack gap-3 admin-form">
              <label>
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  required
                />
              </label>
              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={resetPasswordConfirm}
                  onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </label>
              {resetError && <p role="alert" className="admin-error">{resetError}</p>}
              <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
                <button type="submit" className="btn btn-primary" disabled={resetSaving}>
                  {resetSaving ? "Saving…" : "Reset password"}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={closeResetPasswordModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}



