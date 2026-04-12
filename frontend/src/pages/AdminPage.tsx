import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminActivity, getAdminOverview } from "../api/admin";
import { deleteAsset } from "../api/assets";
import { deleteComment } from "../api/comments";
import type { AdminActivity } from "../api/admin";
import { getClients, type Client } from "../api/clients";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
  type Project,
  type ProjectDetail
} from "../api/projects";
import { createUser, getUsers, updateUserActive, updateUserRole } from "../api/users";
import { AdminOverview, UserAccount } from "../types/models";
import { Role } from "../utils/permissions";

const defaultOverview: AdminOverview = {
  pendingReview: 0,
  changesRequested: 0,
  approved: 0
};

const defaultActivity: AdminActivity = { recentAssets: [], recentComments: [] };

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

export function AdminPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview>(defaultOverview);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activity, setActivity] = useState<AdminActivity>(defaultActivity);
  const [loading, setLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role>("designer");
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
  const [projectError, setProjectError] = useState<string | null>(null);
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

  const load = async () => {
    setLoading(true);
    setUsersError(null);
    try {
      const [overviewData, usersData, activityData, projectsData, clientsData] = await Promise.all([
        getAdminOverview().catch(() => defaultOverview),
        getUsers().catch((err: Error) => {
          setUsersError(err.message || "Could not load users");
          return [];
        }),
        getAdminActivity().catch(() => defaultActivity),
        getProjects().catch(() => [] as Project[]),
        getClients().catch(() => [] as Client[])
      ]);
      setOverview(overviewData);
      setUsers(usersData);
      setActivity(activityData);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    await createUser({
      email: email.trim(),
      role,
      displayName: displayName.trim() || undefined
    });
    setEmail("");
    setDisplayName("");
    setRole("designer");
    await load();
  };

  const handleRoleChange = async (id: string, nextRole: Role) => {
    await updateUserRole(id, nextRole);
    await load();
  };

  const handleDeactivate = async (id: string, currentActive: boolean) => {
    await updateUserActive(id, !currentActive);
    await load();
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

  const handleCreateProject = async (event: FormEvent) => {
    event.preventDefault();
    setProjectError(null);
    if (!projectName.trim()) return;
    try {
      await createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        clientId: newProjectClientId ? Number(newProjectClientId) : undefined,
        status: newProjectStatus,
        priority: newProjectPriority.trim() || undefined,
        dueDate: newProjectDue.trim() || undefined
      });
      setProjectName("");
      setProjectDescription("");
      setNewProjectClientId("");
      setNewProjectStatus("Active");
      setNewProjectPriority("");
      setNewProjectDue("");
      await load();
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : "Could not create project.");
    }
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
        clientId: editClientId === "" ? null : Number(editClientId)
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
      <div className="panel admin-overview-panel">
        <h1>System Overview</h1>
        <ul className="overview-list">
          <li>Pending Review: {overview.pendingReview}</li>
          <li>Changes Requested: {overview.changesRequested}</li>
          <li>Approved: {overview.approved}</li>
        </ul>
      </div>

      <div className="panel admin-desktop-only admin-aside-panel">
        <h1>Admin Notes</h1>
        <ul className="overview-list">
          <li>Total Users: {users.length}</li>
          <li>Active Users: {users.filter((user) => user.isActive).length}</li>
          <li>Recent Assets Shown: {Math.min(activity.recentAssets.length, 20)}</li>
        </ul>
        <div className="admin-callout">
          <strong>Quick reminders</strong>
          <p>Use Recent Activity for cleanup, then manage permissions below.</p>
          <p>Delete only assets or comments that should no longer appear in review history.</p>
        </div>
      </div>

      <div className="panel admin-activity-panel">
        <h1>Recent Activity</h1>
        <p className="admin-subtitle">Last updated assets and comments</p>

        <div className="admin-split-header">
          <h2 className="admin-section-title">Recent assets</h2>
          {activity.recentAssets.length > 0 && (
            <button type="button" className="secondary-btn" onClick={() => setShowAssets((prev) => !prev)}>
              {showAssets ? "Hide" : "Show"}
            </button>
          )}
        </div>

        {showAssets && (
          <div className="admin-scroll-table">
            {activity.recentAssets.length === 0 ? (
              <p>No assets yet.</p>
            ) : (
              <table className="admin-table compact">
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
                  {activity.recentAssets.slice(0, 20).map((asset) => (
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
                      <td data-label="Status">{asset.status}</td>
                      <td data-label="Owner">{asset.owner}</td>
                      <td data-label="Updated">{formatDate(asset.updatedAt)}</td>
                      <td data-label="Actions" className="actions-cell">
                        <button
                          type="button"
                          className="secondary-btn"
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
            <button type="button" className="secondary-btn" onClick={() => setShowComments((prev) => !prev)}>
              {showComments ? "Hide" : "Show"}
            </button>
          )}
        </div>

        {showComments && (
          <div className="admin-scroll-table">
            {activity.recentComments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              <table className="admin-table compact">
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
                  {activity.recentComments.slice(0, 30).map((comment) => (
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
                      <td data-label="Actions" className="actions-cell">
                        <button
                          type="button"
                          className="secondary-btn"
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

      <div className="panel admin-wide-panel admin-section-panel admin-projects-section">
        <div className="admin-content">
          <h1>Projects</h1>
          <p className="admin-subtitle">Create and manage projects. Uploads and assets can be linked to a project.</p>
          <form onSubmit={(e) => void handleCreateProject(e)} className="admin-form admin-project-create-form">
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
            <button className="primary-btn" type="submit">
              Create project
            </button>
          </form>
          {projectError && <p role="alert" className="admin-error">{projectError}</p>}

          <div className="admin-scroll-table" style={{ marginTop: "1rem" }}>
            <table className="admin-table compact">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Client</th>
                  <th>Assets</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No projects yet.</td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className={selectedProjectId === p.id ? "admin-row-selected" : undefined}>
                      <td data-label="ID">{p.id}</td>
                      <td data-label="Name">{p.name}</td>
                      <td data-label="Status">{p.status}</td>
                      <td data-label="Client">{p.clientName ?? "—"}</td>
                      <td data-label="Assets">{p.assetCount ?? 0}</td>
                      <td data-label="Actions" className="actions-cell">
                        <button type="button" className="secondary-btn small" onClick={() => void openProjectDetail(p.id)}>
                          Open
                        </button>
                        <Link className="secondary-btn file-link-btn small" to={`/upload?projectId=${p.id}`}>
                          Upload
                        </Link>
                        <Link className="secondary-btn file-link-btn small" to={`/dashboard?projectId=${p.id}`}>
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
                <button type="button" className="secondary-btn" onClick={closeProjectDetail}>
                  Close
                </button>
              </div>
              {detailLoading && <p>Loading…</p>}
              {detailError && <p role="alert" className="admin-error">{detailError}</p>}
              {!detailLoading && projectDetail && (
                <>
                  <div className="admin-form admin-project-edit-form">
                    <label>
                      Name
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
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
                    <div className="admin-project-detail-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={savingProject}
                        onClick={() => void handleSaveProject()}
                      >
                        {savingProject ? "Saving…" : "Save changes"}
                      </button>
                      <button type="button" className="secondary-btn danger-outline" onClick={() => void handleDeleteProject()}>
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
                      <table className="admin-table compact">
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
                              <td data-label="Actions" className="actions-cell">
                                <button type="button" className="secondary-btn small" onClick={() => navigate(`/assets/${a.id}`)}>
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

      <div className="panel admin-wide-panel admin-section-panel admin-users-section">
        <div className="admin-content">
          <h1>User Management</h1>
          <form onSubmit={handleCreateUser} className="admin-form">
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
                <option value="client_reviewer">client_reviewer</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <button className="primary-btn" type="submit">
              Create User
            </button>
          </form>

          <h2>All users in database</h2>
          {usersError && <p role="alert" className="admin-error">{usersError}</p>}
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="admin-scroll-table">
              <table className="admin-table user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No users yet. Create one above.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td data-label="Name">{user.displayName || "-"}</td>
                        <td data-label="Email">{user.email}</td>
                        <td data-label="Role">
                          <select
                            value={user.role}
                            onChange={(event) => void handleRoleChange(user.id, event.target.value as Role)}
                            disabled={user.email.toLowerCase() === "admin@vellum.test"}
                          >
                            <option value="designer">designer</option>
                            <option value="reviewer">reviewer</option>
                            <option value="manager">manager</option>
                            <option value="client_reviewer">client_reviewer</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td data-label="Status">{user.isActive ? "Active" : "Inactive"}</td>
                        <td data-label="Actions" className="actions-cell">
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(user.id, user.isActive)}
                            className={user.isActive ? "secondary-btn" : "primary-btn"}
                          >
                            {user.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
