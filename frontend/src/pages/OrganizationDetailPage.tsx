import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  addOrganizationMember,
  deleteOrganization,
  getOrganizationById,
  getOrganizationMembers,
  setOrganizationActive,
  updateOrganization
} from "../api/organizations";
import { createUser, getUsers, removeUser } from "../api/users";
import type { Organization, OrganizationMemberRow, UserAccount } from "../types/models";
import { canAccessAdmin, type Role } from "../utils/permissions";

type OrgTab = "users" | "settings";
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
  const [tab, setTab] = useState<OrgTab>("users");
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMemberRow[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
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
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!Number.isFinite(orgId)) return;
    setLoading(true);
    setError(null);
    try {
      const [org, orgMembers, allUsers] = await Promise.all([
        getOrganizationById(orgId),
        getOrganizationMembers(orgId),
        getUsers()
      ]);
      setOrganization(org);
      setMembers(orgMembers);
      setUsers(allUsers);
      setEditName(org.name ?? "");
      setEditDescription(org.description ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team.");
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

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!organization) return;
    setSaving(true);
    setError(null);
    try {
      await updateOrganization(organization.id, {
        name: editName.trim(),
        description: editDescription.trim() || null
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save team.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (nextActive: boolean) => {
    if (!organization) return;
    const ok = window.confirm(nextActive ? "Reactivate this team?" : "Deactivate this team?");
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
      "Delete this team permanently? Projects will be unlinked from the team."
    );
    if (!ok) return;
    try {
      await deleteOrganization(organization.id);
      navigate("/manager");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete team.");
    }
  };

  return (
    <section className="page-grid">
      <div className="card panel admin-wide-panel admin-section-panel">
        <div className="admin-content">
          <div className="admin-split-header">
            <h1>{organization?.name ?? "Team"}</h1>
            <Link className="btn btn-primary file-link-btn org-back-btn" to="/manager">
              Back
            </Link>
          </div>
          {organization ? (
            <p className="admin-muted">
              Status: {organization.isActive === false ? "Inactive" : "Active"} · Members: {members.length}
            </p>
          ) : null}
          {error && <p className="admin-error">{error}</p>}
          {loading ? <p>Loading team…</p> : null}
        </div>
      </div>

      <div className="card panel admin-wide-panel admin-section-panel">
        <div className="admin-content">
          <div className="org-tabs nav nav-pills">
            <button type="button" className={`nav-link ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
              Users
            </button>
            <button type="button" className={`nav-link ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
              Settings
            </button>
          </div>

          {tab === "users" && (
            <div className="org-tab-panel org-users-tab">
              <h2 className="admin-section-title">Team Access</h2>
              <form
                onSubmit={(event) =>
                  memberEntryMode === "existing"
                    ? void handleAddMember(event)
                    : void handleCreateUserAndAdd(event)
                }
                className="vstack gap-3 admin-form org-member-form"
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
                      Team role
                      <select value={newMemberRole} onChange={(event) => setNewMemberRole(event.target.value)}>
                        <option value="owner">owner</option>
                        <option value="manager">manager</option>
                        <option value="designer">designer</option>
                        <option value="reviewer">reviewer</option>
                      </select>
                    </label>
                    <button className="btn btn-primary" type="submit" disabled={!newMemberUserId}>
                      Add to team
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
                      Team role
                      <select value={newUserOrgRole} onChange={(event) => setNewUserOrgRole(event.target.value)}>
                        <option value="owner">owner</option>
                        <option value="manager">manager</option>
                        <option value="designer">designer</option>
                        <option value="reviewer">reviewer</option>
                      </select>
                    </label>
                    <button className="btn btn-primary" type="submit">
                      Create and add
                    </button>
                  </>
                )}
              </form>

              <h2 className="admin-section-title">Team Members</h2>
              <div className="admin-scroll-table">
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
                          <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 admin-user-actions">
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => void handleRemoveMemberAccount(m)}>
                              Remove Access
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="org-tab-panel org-settings-tab">
              <form onSubmit={(event) => void handleSaveSettings(event)} className="vstack gap-3 admin-form org-settings-form">
                <label>
                  Team name
                  <input type="text" value={editName} onChange={(event) => setEditName(event.target.value)} required />
                </label>
                <label>
                  Description
                  <textarea rows={2} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
                </label>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </form>
              <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions org-settings-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void handleToggleActive(organization?.isActive === false)}
                >
                  {organization?.isActive === false ? "Reactivate" : "Deactivate"}
                </button>
                <button type="button" className="btn btn-outline-danger" onClick={() => void handleDeleteOrganization()}>
                  Delete team
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
