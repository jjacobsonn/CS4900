import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getOrganizationMembers, getOrganizations } from "../api/organizations";
import {
  addProjectMember,
  createProject,
  deleteProject,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  updateProject,
  type Project,
  type ProjectMember
} from "../api/projects";
import type { OrganizationMemberRow } from "../types/models";
import { canAccessAdmin, type Role } from "../utils/permissions";

export function ProjectsPage({ role }: { role: Role }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState(searchParams.get("organizationId") ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const [createOrgId, setCreateOrgId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStatus, setCreateStatus] = useState("Active");
  const [createPriority, setCreatePriority] = useState("");
  const [createDue, setCreateDue] = useState("");
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editPriority, setEditPriority] = useState("");
  const [editDue, setEditDue] = useState("");
  const [manageTeamProjectId, setManageTeamProjectId] = useState<number | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [eligibleMembers, setEligibleMembers] = useState<OrganizationMemberRow[]>([]);
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);

  const canManage = role === "manager" || canAccessAdmin(role);
  const isManager = role === "manager";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRows, orgRows] = await Promise.all([
        getProjects(),
        getOrganizations().catch(() => [])
      ]);
      setProjects(projectRows);
      setOrganizations(orgRows.map((o) => ({ id: o.id, name: o.name })));
      if (!createOrgId && orgRows.length > 0) {
        setCreateOrgId(String(orgRows[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesOrg = organizationFilter === "" || String(p.organizationId ?? "") === organizationFilter;
      return matchesSearch && matchesOrg;
    });
  }, [projects, query, organizationFilter]);

  const onOrgFilterChange = (value: string) => {
    setOrganizationFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("organizationId", value);
    else next.delete("organizationId");
    setSearchParams(next, { replace: true });
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    if (!createName.trim() || !createOrgId) return;
    try {
      await createProject({
        organizationId: Number(createOrgId),
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        status: createStatus,
        priority: createPriority.trim() || undefined,
        dueDate: createDue.trim() || undefined
      });
      setCreateName("");
      setCreateDescription("");
      setCreateStatus("Active");
      setCreatePriority("");
      setCreateDue("");
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
    }
  };

  const startEdit = (project: Project) => {
    setEditProjectId(project.id);
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditStatus(project.status ?? "Active");
    setEditPriority(project.priority ?? "");
    setEditDue(project.dueDate ? project.dueDate.slice(0, 10) : "");
  };

  const handleSaveEdit = async () => {
    if (!canManage || editProjectId == null) return;
    try {
      await updateProject(editProjectId, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        status: editStatus,
        priority: editPriority.trim() || null,
        dueDate: editDue.trim() || null
      });
      setEditProjectId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update project.");
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!canManage) return;
    const ok = window.confirm("Delete this project?");
    if (!ok) return;
    try {
      await deleteProject(projectId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete project.");
    }
  };

  const openTeamManager = async (project: Project) => {
    if (!canManage) return;
    const orgId = Number(project.organizationId);
    if (!Number.isFinite(orgId)) {
      setError("Project is missing organization mapping.");
      return;
    }
    setManageTeamProjectId(project.id);
    setTeamLoading(true);
    setError(null);
    try {
      const [members, orgUsers] = await Promise.all([getProjectMembers(project.id), getOrganizationMembers(orgId)]);
      const visibleMembers = isManager
        ? members.filter((m) => String(m.role || "").toLowerCase() !== "admin")
        : members;
      setProjectMembers(visibleMembers);
      const memberSet = new Set(members.map((m) => m.userId));
      const eligible = orgUsers.filter((u) => !memberSet.has(u.userId));
      setEligibleMembers(
        isManager
          ? eligible.filter((u) => String(u.role || "").toUpperCase() !== "OWNER")
          : eligible
      );
      setAddMemberUserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load project team.");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleAddProjectMember = async () => {
    if (!canManage || manageTeamProjectId == null) return;
    const userId = Number(addMemberUserId);
    if (!Number.isFinite(userId)) return;
    setTeamLoading(true);
    setError(null);
    try {
      await addProjectMember(manageTeamProjectId, userId);
      const refreshed = await getProjectMembers(manageTeamProjectId);
      const visibleMembers = isManager
        ? refreshed.filter((m) => String(m.role || "").toLowerCase() !== "admin")
        : refreshed;
      setProjectMembers(visibleMembers);
      const memberSet = new Set(refreshed.map((m) => m.userId));
      setEligibleMembers((prev) => prev.filter((u) => !memberSet.has(u.userId)));
      setAddMemberUserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add project member.");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleRemoveProjectMember = async (userId: number) => {
    if (!canManage || manageTeamProjectId == null) return;
    setTeamLoading(true);
    setError(null);
    try {
      await removeProjectMember(manageTeamProjectId, userId);
      const refreshed = await getProjectMembers(manageTeamProjectId);
      const visibleMembers = isManager
        ? refreshed.filter((m) => String(m.role || "").toLowerCase() !== "admin")
        : refreshed;
      setProjectMembers(visibleMembers);
      const currentProject = projects.find((p) => p.id === manageTeamProjectId);
      const orgId = Number(currentProject?.organizationId);
      if (Number.isFinite(orgId)) {
        const orgUsers = await getOrganizationMembers(orgId);
        const memberSet = new Set(refreshed.map((m) => m.userId));
        const eligible = orgUsers.filter((u) => !memberSet.has(u.userId));
        setEligibleMembers(
          isManager
            ? eligible.filter((u) => String(u.role || "").toUpperCase() !== "OWNER")
            : eligible
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove project member.");
    } finally {
      setTeamLoading(false);
    }
  };

  return (
    <section className="page-grid projects-page">
      <div className="card panel projects-filter-panel">
        <h1>Projects</h1>
        <div className="toolbar">
          <label>
            Search
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" />
          </label>
          <label>
            Organization
            <select value={organizationFilter} onChange={(e) => onOrgFilterChange(e.target.value)}>
              <option value="">All organizations</option>
              {organizations.map((o) => (
                <option key={o.id} value={String(o.id)}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {canManage && (
          <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions projects-action-row">
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? "Cancel" : "Create project"}
            </button>
          </div>
        )}
        {showCreate && canManage && (
          <form onSubmit={(e) => void handleCreate(e)} className="vstack gap-3 admin-form projects-create-form">
            <label>
              Organization
              <select value={createOrgId} onChange={(e) => setCreateOrgId(e.target.value)} required>
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
              <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} required />
            </label>
            <label>
              Description
              <textarea rows={2} value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} />
            </label>
            <label>
              Status
              <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="On hold">On hold</option>
                <option value="Archived">Archived</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
            <label>
              Priority
              <select value={createPriority} onChange={(e) => setCreatePriority(e.target.value)}>
                <option value="">None</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={createDue} onChange={(e) => setCreateDue(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">
              Create project
            </button>
          </form>
        )}
        {error && <p role="alert" className="admin-error">{error}</p>}
      </div>

      <div className="card panel projects-list-panel">
        <h1>Current Projects</h1>
        {loading ? <p>Loading projects…</p> : null}
        <div className="admin-scroll-table">
          <table className="table table-hover align-middle admin-table compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Assets</th>
                {canManage ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4}>No projects found.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Name">{p.name}</td>
                    <td data-label="Organization">{p.organizationName ?? "—"}</td>
                    <td data-label="Status">{p.status}</td>
                    <td data-label="Assets">{p.assetCount ?? 0}</td>
                    {canManage ? (
                      <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 admin-user-actions">
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void openTeamManager(p)}>
                          Team
                        </button>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => void handleDelete(p.id)}>
                          Remove
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {editProjectId != null && canManage && (
          <div className="admin-project-detail" style={{ marginTop: "0.85rem" }}>
            <h2 className="admin-section-title">Edit project</h2>
            <div className="vstack gap-3 admin-form">
              <label>
                Name
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </label>
              <label>
                Description
                <textarea rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </label>
              <label>
                Status
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="On hold">On hold</option>
                  <option value="Archived">Archived</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
              <label>
                Priority
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                  <option value="">None</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </label>
              <label>
                Due date
                <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} />
              </label>
              <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
                <button type="button" className="btn btn-primary" onClick={() => void handleSaveEdit()}>
                  Save changes
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditProjectId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {manageTeamProjectId != null && canManage && (
          <div className="admin-project-detail" style={{ marginTop: "0.85rem" }}>
            <h2 className="admin-section-title">Manage project team</h2>
            {teamLoading ? <p>Loading team...</p> : null}
            <div className="vstack gap-3 admin-form" style={{ marginTop: "0.5rem" }}>
              <label>
                Add organization user
                <select value={addMemberUserId} onChange={(e) => setAddMemberUserId(e.target.value)}>
                  <option value="">Select user…</option>
                  {eligibleMembers.map((u) => (
                    <option key={u.userId} value={String(u.userId)}>
                      {u.displayName} ({u.role.toLowerCase()})
                    </option>
                  ))}
                </select>
              </label>
              <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
                <button type="button" className="btn btn-primary" onClick={() => void handleAddProjectMember()} disabled={!addMemberUserId}>
                  Add to project
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setManageTeamProjectId(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="admin-scroll-table">
              <table className="table table-hover align-middle admin-table compact">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No assigned members yet.</td>
                    </tr>
                  ) : (
                    projectMembers.map((member) => (
                      <tr key={member.userId}>
                        <td data-label="Name">{member.displayName}</td>
                        <td data-label="Email">{member.email}</td>
                        <td data-label="Role">{member.role}</td>
                        <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 admin-user-actions">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => void handleRemoveProjectMember(member.userId)}
                          >
                            Remove
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
      </div>
    </section>
  );
}



