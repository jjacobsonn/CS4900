import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { createAsset, getAssets } from "../api/assets";
import { getClients, type Client } from "../api/clients";
import {
  addOrganizationMember,
  deleteOrganization,
  getOrganizationById,
  getOrganizationMembers,
  removeOrganizationMember,
  setOrganizationActive,
  updateOrganization
} from "../api/organizations";
import { createProject, getProjects, type Project } from "../api/projects";
import { createUser, getUsers, removeUser, updateUser, updateUserActive } from "../api/users";
import type { Asset, Organization, OrganizationMemberRow, UserAccount } from "../types/models";
import { canAccessAdmin, type Role } from "../utils/permissions";

type OrgTab = "overview" | "projects" | "assets" | "users" | "settings";
const PRIMARY_ADMIN_EMAIL = "admin@vellum.test";

function orgRoleToGlobalRole(orgRole: string): Role {
  const r = String(orgRole || "").toLowerCase();
  if (r === "owner") return "owner";
  if (r === "manager") return "manager";
  if (r === "reviewer") return "reviewer";
  return "designer";
}

export function OrganizationDetailPage({ role }: { role: Role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const orgId = Number(id);
  const [tab, setTab] = useState<OrgTab>("overview");
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMemberRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("designer");
  const [memberEntryMode, setMemberEntryMode] = useState<"existing" | "new">("existing");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserOrgRole, setNewUserOrgRole] = useState("designer");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPasswordConfirm, setNewUserPasswordConfirm] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [showProjectCreate, setShowProjectCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectClientId, setNewProjectClientId] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("Active");
  const [newProjectPriority, setNewProjectPriority] = useState("");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");
  const [newProjectOwnerUserId, setNewProjectOwnerUserId] = useState("");
  const [showAssetCreate, setShowAssetCreate] = useState(false);
  const [newAssetFile, setNewAssetFile] = useState<File | null>(null);
  const [newAssetTitle, setNewAssetTitle] = useState("");
  const [newAssetNotes, setNewAssetNotes] = useState("");
  const [newAssetProjectId, setNewAssetProjectId] = useState("");
  const [newAssetType, setNewAssetType] = useState("");
  const [newAssetExternalUrl, setNewAssetExternalUrl] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetMemberId, setResetMemberId] = useState<number | null>(null);
  const [resetMemberEmail, setResetMemberEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);

  const load = async () => {
    if (!Number.isFinite(orgId)) return;
    setLoading(true);
    setError(null);
    try {
      const [org, orgMembers, allProjects, allAssets, allUsers, allClients] = await Promise.all([
        getOrganizationById(orgId),
        getOrganizationMembers(orgId),
        getProjects({ organizationId: orgId }),
        getAssets(),
        getUsers(),
        getClients().catch(() => [] as Client[])
      ]);
      setOrganization(org);
      setMembers(orgMembers);
      setProjects(allProjects);
      setAssets(allAssets.filter((asset) => Number(asset.organizationId) === orgId));
      setUsers(allUsers);
      setClients(allClients);
      setEditName(org.name ?? "");
      setEditDescription(org.description ?? "");
      setEditDetails(org.details ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load organization.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [orgId]);

  const memberLookup = useMemo(() => new Set(members.map((m) => m.userId)), [members]);
  const visibleMembers = useMemo(
    () => members.filter((m) => String(m.email || "").toLowerCase() !== PRIMARY_ADMIN_EMAIL),
    [members]
  );
  const eligibleUsers = useMemo(
    () =>
      users.filter(
        (u) => !memberLookup.has(Number(u.id)) && String(u.email || "").toLowerCase() !== PRIMARY_ADMIN_EMAIL
      ),
    [users, memberLookup]
  );

  if (!canAccessAdmin(role)) return <Navigate to="/dashboard" replace />;
  if (!Number.isFinite(orgId)) return <Navigate to="/admin" replace />;

  const handleAddMember = async (event: FormEvent) => {
    event.preventDefault();
    const uid = Number(newMemberUserId);
    if (!Number.isFinite(uid)) return;
    try {
      await addOrganizationMember(orgId, { userId: uid, role: newMemberRole });
      setNewMemberUserId("");
      setNewMemberRole("designer");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add member.");
    }
  };

  const handleCreateUserAndAdd = async (event: FormEvent) => {
    event.preventDefault();
    const email = newUserEmail.trim();
    if (!email) return;
    if (newUserPassword !== newUserPasswordConfirm) {
      setError("Password confirmation does not match.");
      return;
    }
    if (newUserPassword.trim() !== "" && newUserPassword.trim().length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    try {
      const payload: Parameters<typeof createUser>[0] = {
        email,
        role: orgRoleToGlobalRole(newUserOrgRole),
        displayName: newUserDisplayName.trim() || undefined
      };
      if (newUserPassword.trim() !== "") {
        payload.password = newUserPassword.trim();
      }
      const created = await createUser(payload);
      const newId = Number(created.id);
      if (Number.isFinite(newId)) {
        await addOrganizationMember(orgId, { userId: newId, role: newUserOrgRole });
      }
      setNewUserEmail("");
      setNewUserDisplayName("");
      setNewUserOrgRole("designer");
      setNewUserPassword("");
      setNewUserPasswordConfirm("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user.");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    const ok = window.confirm("Remove this member from the organization?");
    if (!ok) return;
    try {
      await removeOrganizationMember(orgId, userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove member.");
    }
  };

  const handleEditMember = async (member: OrganizationMemberRow) => {
    const current = users.find((u) => Number(u.id) === member.userId);
    const nextDisplay = window.prompt("Display name", current?.displayName || member.displayName || "");
    if (nextDisplay == null) return;
    const nextEmail = window.prompt("Email", current?.email || member.email || "");
    if (nextEmail == null) return;
    const nextRole = window.prompt("Organization role (owner|manager|designer|reviewer)", String(member.role).toLowerCase());
    if (nextRole == null) return;
    const normalizedRole = nextRole.trim().toLowerCase();
    if (!["owner", "manager", "designer", "reviewer"].includes(normalizedRole)) {
      setError("Invalid organization role.");
      return;
    }
    try {
      await updateUser(String(member.userId), {
        email: nextEmail.trim(),
        displayName: nextDisplay.trim() || null
      });
      await addOrganizationMember(orgId, {
        userId: member.userId,
        role: normalizedRole
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not edit member.");
    }
  };

  const handleDeactivateMember = async (member: OrganizationMemberRow) => {
    try {
      await updateUserActive(String(member.userId), false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate member.");
    }
  };

  const handleReactivateMember = async (member: OrganizationMemberRow) => {
    try {
      await updateUserActive(String(member.userId), true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reactivate member.");
    }
  };

  const handleRemoveMemberAccount = async (member: OrganizationMemberRow) => {
    const ok = window.confirm("Remove sign-in access for this user?");
    if (!ok) return;
    try {
      await removeUser(String(member.userId));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove user.");
    }
  };

  const handleResetMemberPassword = async (member: OrganizationMemberRow) => {
    setResetMemberId(member.userId);
    setResetMemberEmail(member.email);
    setResetPassword("");
    setResetPasswordConfirm("");
    setResetError(null);
    setResetOpen(true);
  };

  const closeResetModal = () => {
    setResetOpen(false);
    setResetMemberId(null);
    setResetMemberEmail("");
    setResetPassword("");
    setResetPasswordConfirm("");
    setResetError(null);
    setResetSaving(false);
  };

  const handleResetMemberPasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (resetMemberId == null) return;
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
      await updateUser(String(resetMemberId), { password: trimmed });
      await load();
      closeResetModal();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setResetSaving(false);
    }
  };

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!organization) return;
    setSaving(true);
    setError(null);
    try {
      await updateOrganization(organization.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        details: editDetails.trim() || null
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save organization.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (nextActive: boolean) => {
    if (!organization) return;
    const ok = window.confirm(nextActive ? "Reactivate this organization?" : "Deactivate this organization?");
    if (!ok) return;
    try {
      await setOrganizationActive(organization.id, nextActive);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update active state.");
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organization) return;
    const ok = window.confirm(
      "Delete this organization permanently? Projects will be unlinked from the organization."
    );
    if (!ok) return;
    try {
      await deleteOrganization(organization.id);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete organization.");
    }
  };

  const handleCreateProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      await createProject({
        organizationId: orgId,
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        clientId: newProjectClientId ? Number(newProjectClientId) : undefined,
        status: newProjectStatus,
        priority: newProjectPriority.trim() || undefined,
        dueDate: newProjectDueDate.trim() || undefined,
        ownerUserId: newProjectOwnerUserId ? Number(newProjectOwnerUserId) : undefined
      });
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectClientId("");
      setNewProjectStatus("Active");
      setNewProjectPriority("");
      setNewProjectDueDate("");
      setNewProjectOwnerUserId("");
      setShowProjectCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
    }
  };

  const handleCreateAsset = async (event: FormEvent) => {
    event.preventDefault();
    if (!newAssetTitle.trim() || !newAssetFile) {
      setError("Asset title and file are required.");
      return;
    }
    try {
      await createAsset({
        title: newAssetTitle.trim(),
        description: newAssetNotes.trim(),
        projectId: newAssetProjectId || undefined,
        assetType: newAssetType || undefined,
        externalUrl: newAssetExternalUrl || undefined,
        file: newAssetFile
      });
      setNewAssetFile(null);
      setNewAssetTitle("");
      setNewAssetNotes("");
      setNewAssetProjectId("");
      setNewAssetType("");
      setNewAssetExternalUrl("");
      setShowAssetCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create asset.");
    }
  };

  return (
    <section className="page-grid">
      <div className="panel admin-wide-panel admin-section-panel">
        <div className="admin-content">
          <div className="admin-split-header">
            <h1>{organization?.name ?? "Organization"}</h1>
            <Link className="primary-btn file-link-btn org-back-btn" to="/admin">
              Back to Admin
            </Link>
          </div>
          {organization ? (
            <p className="admin-muted">
              Status: {organization.isActive === false ? "Inactive" : "Active"} · Members: {members.length} · Projects:{" "}
              {projects.length} · Assets: {assets.length}
            </p>
          ) : null}
          {error && <p className="admin-error">{error}</p>}
          {loading ? <p>Loading organization…</p> : null}
        </div>
      </div>

      <div className="panel admin-wide-panel admin-section-panel">
        <div className="admin-content">
          <div className="org-tabs">
            <button type="button" className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
              Overview
            </button>
            <button type="button" className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>
              Projects
            </button>
            <button type="button" className={tab === "assets" ? "active" : ""} onClick={() => setTab("assets")}>
              Assets
            </button>
            <button type="button" className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
              Users
            </button>
            <button type="button" className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>
              Settings
            </button>
          </div>

          {tab === "overview" && (
            <div className="admin-callout">
              <strong>Company Summary</strong>
              <p>{organization?.description || "No description yet."}</p>
              {organization?.details ? <p>{organization.details}</p> : null}
              <h3 className="admin-section-title" style={{ marginTop: "0.8rem" }}>Current Projects</h3>
              {projects.length === 0 ? (
                <p className="admin-muted">No projects yet.</p>
              ) : (
                <ul className="overview-list">
                  {projects.slice(0, 6).map((project) => (
                    <li key={project.id}>
                      <Link className="admin-link-button" to={`/projects?organizationId=${project.organizationId ?? ""}`}>
                        {project.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <h3 className="admin-section-title" style={{ marginTop: "0.8rem" }}>Current Assets</h3>
              {assets.length === 0 ? (
                <p className="admin-muted">No assets yet.</p>
              ) : (
                <ul className="overview-list">
                  {assets.slice(0, 6).map((asset) => (
                    <li key={String(asset.id)}>
                      <Link className="admin-link-button" to={`/assets?projectId=${asset.projectId ?? ""}`}>
                        {asset.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "projects" && (
            <>
              <div className="admin-split-header">
                <h2 className="admin-section-title">Projects</h2>
                <button type="button" className="primary-btn" onClick={() => setShowProjectCreate((v) => !v)}>
                  {showProjectCreate ? "Cancel" : "Add Project"}
                </button>
              </div>
              {showProjectCreate && (
                <form onSubmit={(event) => void handleCreateProject(event)} className="admin-form admin-project-create-form">
                  <label>
                    Name
                    <input type="text" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} required />
                  </label>
                  <label>
                    Description
                    <textarea value={newProjectDescription} onChange={(event) => setNewProjectDescription(event.target.value)} rows={2} />
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
                      <option value="Active">Active</option>
                      <option value="On hold">On hold</option>
                      <option value="Archived">Archived</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </label>
                  <label>
                    Priority
                    <input type="text" value={newProjectPriority} onChange={(event) => setNewProjectPriority(event.target.value)} />
                  </label>
                  <label>
                    Due date
                    <input type="date" value={newProjectDueDate} onChange={(event) => setNewProjectDueDate(event.target.value)} />
                  </label>
                  <label>
                    Project owner (optional)
                    <select value={newProjectOwnerUserId} onChange={(event) => setNewProjectOwnerUserId(event.target.value)}>
                      <option value="">You (creator)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName || u.email} ({u.role})
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="primary-btn" type="submit">
                    Create project
                  </button>
                </form>
              )}
              <div className="admin-scroll-table">
                <table className="admin-table compact">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Client</th>
                      <th>Assets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No projects in this organization.</td>
                      </tr>
                    ) : (
                      projects.map((p) => (
                        <tr key={p.id}>
                          <td data-label="Name">{p.name}</td>
                          <td data-label="Status">{p.status}</td>
                          <td data-label="Client">{p.clientName ?? "—"}</td>
                          <td data-label="Assets">{p.assetCount ?? 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "assets" && (
            <>
              <div className="admin-split-header">
                <h2 className="admin-section-title">Assets</h2>
                <button type="button" className="primary-btn" onClick={() => setShowAssetCreate((v) => !v)}>
                  {showAssetCreate ? "Cancel" : "Add Asset"}
                </button>
              </div>
              {showAssetCreate && (
                <form onSubmit={(event) => void handleCreateAsset(event)} className="admin-form">
                  <label>
                    File
                    <input type="file" onChange={(event) => setNewAssetFile(event.target.files?.[0] ?? null)} required />
                  </label>
                  <label>
                    Title
                    <input type="text" value={newAssetTitle} onChange={(event) => setNewAssetTitle(event.target.value)} required />
                  </label>
                  <label>
                    Project
                    <select value={newAssetProjectId} onChange={(event) => setNewAssetProjectId(event.target.value)}>
                      <option value="">No project (optional)</option>
                      {projects.map((project) => (
                        <option key={project.id} value={String(project.id)}>
                          #{project.id} - {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Asset Type
                    <select value={newAssetType} onChange={(event) => setNewAssetType(event.target.value)}>
                      <option value="">Select type (optional)</option>
                      <option value="image">Image</option>
                      <option value="mockup">Mockup</option>
                      <option value="figma">Figma</option>
                      <option value="brief">Brief</option>
                      <option value="spec">Spec</option>
                      <option value="document">Document</option>
                      <option value="markdown">Markdown</option>
                      <option value="code">Code</option>
                      <option value="spreadsheet">Spreadsheet</option>
                      <option value="dataset">Dataset</option>
                      <option value="archive">Archive</option>
                      <option value="ticket">Ticket</option>
                      <option value="repo">Repo</option>
                      <option value="chat">Chat</option>
                      <option value="crm">CRM</option>
                      <option value="note">Note</option>
                      <option value="checklist">Checklist</option>
                      <option value="decision">Decision</option>
                    </select>
                  </label>
                  <label>
                    External URL
                    <input
                      type="url"
                      value={newAssetExternalUrl}
                      onChange={(event) => setNewAssetExternalUrl(event.target.value)}
                      placeholder="Optional link (Figma, Jira, GitHub, etc.)"
                    />
                  </label>
                  <label>
                    Notes
                    <textarea value={newAssetNotes} onChange={(event) => setNewAssetNotes(event.target.value)} />
                  </label>
                  <button className="primary-btn" type="submit">
                    Submit
                  </button>
                </form>
              )}
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
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No assets in this organization.</td>
                      </tr>
                    ) : (
                      assets.map((a) => (
                        <tr key={String(a.id)}>
                          <td data-label="Title">{a.name}</td>
                          <td data-label="Status">{a.status}</td>
                          <td data-label="Owner">{a.owner}</td>
                          <td data-label="Actions" className="actions-cell">
                            <Link className="secondary-btn file-link-btn small" to={`/assets/${a.id}`}>
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "users" && (
            <>
              <h2 className="admin-section-title">Team Access</h2>
              <form
                onSubmit={(event) =>
                  memberEntryMode === "existing"
                    ? void handleAddMember(event)
                    : void handleCreateUserAndAdd(event)
                }
                className="admin-form"
                style={{ marginTop: "0.6rem" }}
              >
                <label>
                  Access action
                  <select value={memberEntryMode} onChange={(event) => setMemberEntryMode(event.target.value as "existing" | "new")}>
                    <option value="existing">Add existing user</option>
                    <option value="new">Create new user</option>
                  </select>
                </label>
                {memberEntryMode === "existing" ? (
                  <>
                    <label>
                      User
                      <select value={newMemberUserId} onChange={(event) => setNewMemberUserId(event.target.value)}>
                        <option value="">Select user…</option>
                        {eligibleUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.displayName || u.email}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Organization role
                      <select value={newMemberRole} onChange={(event) => setNewMemberRole(event.target.value)}>
                        <option value="owner">owner</option>
                        <option value="manager">manager</option>
                        <option value="designer">designer</option>
                        <option value="reviewer">reviewer</option>
                      </select>
                    </label>
                    <button className="primary-btn" type="submit" disabled={!newMemberUserId}>
                      Add to organization
                    </button>
                  </>
                ) : (
                  <>
                    <label>
                      Display name (optional)
                      <input
                        type="text"
                        value={newUserDisplayName}
                        onChange={(event) => setNewUserDisplayName(event.target.value)}
                        placeholder="e.g. Jane or jane.doe"
                      />
                    </label>
                    <label>
                      User email
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(event) => setNewUserEmail(event.target.value)}
                        placeholder="name@company.test"
                        required
                      />
                    </label>
                    <label>
                      Set password (optional)
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(event) => setNewUserPassword(event.target.value)}
                        placeholder="At least 4 characters"
                        autoComplete="new-password"
                      />
                    </label>
                    <label>
                      Confirm password
                      <input
                        type="password"
                        value={newUserPasswordConfirm}
                        onChange={(event) => setNewUserPasswordConfirm(event.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                    </label>
                    <label>
                      Organization role
                      <select value={newUserOrgRole} onChange={(event) => setNewUserOrgRole(event.target.value)}>
                        <option value="owner">owner</option>
                        <option value="manager">manager</option>
                        <option value="designer">designer</option>
                        <option value="reviewer">reviewer</option>
                      </select>
                    </label>
                    <button className="primary-btn" type="submit">
                      Create and add
                    </button>
                  </>
                )}
              </form>

              <h2 className="admin-section-title">Organization Members</h2>
              <div className="admin-scroll-table">
                <table className="admin-table admin-user-table compact">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMembers.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No members.</td>
                      </tr>
                    ) : (
                      visibleMembers.map((m) => (
                        <tr key={m.userId}>
                          <td data-label="Name">{m.displayName || "—"}</td>
                          <td data-label="Email">{m.email}</td>
                          <td data-label="Role">{m.role}</td>
                          <td data-label="Actions" className="admin-user-actions">
                            <button type="button" className="secondary-btn small" onClick={() => void handleEditMember(m)}>
                              Edit
                            </button>
                            <button type="button" className="secondary-btn small" onClick={() => void handleDeactivateMember(m)}>
                              Deactivate
                            </button>
                            <button type="button" className="secondary-btn small" onClick={() => void handleReactivateMember(m)}>
                              Reactivate
                            </button>
                            <button type="button" className="secondary-btn small" onClick={() => void handleResetMemberPassword(m)}>
                              Reset password
                            </button>
                            <button type="button" className="secondary-btn small" onClick={() => void handleRemoveMember(m.userId)}>
                              Remove
                            </button>
                            <button type="button" className="secondary-btn small danger-outline" onClick={() => void handleRemoveMemberAccount(m)}>
                              Remove Access
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "settings" && (
            <>
              <form onSubmit={(event) => void handleSaveSettings(event)} className="admin-form">
                <label>
                  Organization name
                  <input type="text" value={editName} onChange={(event) => setEditName(event.target.value)} required />
                </label>
                <label>
                  Description
                  <textarea rows={2} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
                </label>
                <label>
                  Details / caption
                  <textarea rows={3} value={editDetails} onChange={(event) => setEditDetails(event.target.value)} />
                </label>
                <button className="primary-btn" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save organization"}
                </button>
              </form>
              <div className="admin-project-detail-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => void handleToggleActive(organization?.isActive === false)}
                >
                  {organization?.isActive === false ? "Reactivate" : "Deactivate"}
                </button>
                <button type="button" className="secondary-btn danger-outline" onClick={() => void handleDeleteOrganization()}>
                  Delete organization
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {resetOpen && resetMemberId != null && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeResetModal();
          }}
        >
          <div className="admin-modal" role="dialog" aria-labelledby="org-reset-password-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="org-reset-password-title" className="admin-section-title" style={{ marginBottom: "0.75rem" }}>
              Reset password
            </h2>
            <p className="admin-muted" style={{ marginTop: 0 }}>{resetMemberEmail}</p>
            <form onSubmit={(event) => void handleResetMemberPasswordSubmit(event)} className="admin-form">
              <label>
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
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
                  onChange={(event) => setResetPasswordConfirm(event.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </label>
              {resetError && <p role="alert" className="admin-error">{resetError}</p>}
              <div className="admin-project-detail-actions">
                <button type="submit" className="primary-btn" disabled={resetSaving}>
                  {resetSaving ? "Saving…" : "Reset password"}
                </button>
                <button type="button" className="secondary-btn" onClick={closeResetModal}>
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
