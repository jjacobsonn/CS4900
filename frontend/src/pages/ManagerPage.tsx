import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAssets } from "../api/assets";
import { getOrganizationMembers, getOrganizations } from "../api/organizations";
import { getProjects } from "../api/projects";
import type { Asset, Organization, OrganizationMemberRow } from "../types/models";
import type { Project } from "../api/projects";
import { canAccessAdmin, type Role } from "../utils/permissions";
import { statusLabel } from "../utils/format";

type ManagerTab = "overview" | "projects" | "assets" | "team" | "activity";

export function ManagerPage({ role }: { role: Role }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [members, setMembers] = useState<OrganizationMemberRow[]>([]);
  const [tab, setTab] = useState<ManagerTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = role === "manager" || canAccessAdmin(role);
  const orgIdNum = Number(selectedOrgId);
  const hasSelectedOrg = selectedOrgId.trim() !== "" && Number.isFinite(orgIdNum) && orgIdNum > 0;

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    getOrganizations()
      .then((rows) => {
        setOrganizations(rows);
        if (rows.length > 0) setSelectedOrgId(String(rows[0].id));
      })
      .catch((err: Error) => setError(err.message || "Could not load organizations."))
      .finally(() => setLoading(false));
  }, [canView]);

  useEffect(() => {
    if (!canView || !hasSelectedOrg) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getProjects({ organizationId: orgIdNum }),
      getAssets(),
      getOrganizationMembers(orgIdNum)
    ])
      .then(([projectRows, assetRows, memberRows]) => {
        setProjects(projectRows);
        setAssets(assetRows.filter((a) => Number(a.organizationId) === orgIdNum));
        setMembers(memberRows);
      })
      .catch((err: Error) => setError(err.message || "Could not load manager workspace data."))
      .finally(() => setLoading(false));
  }, [canView, hasSelectedOrg, orgIdNum]);

  const metrics = useMemo(() => {
    const inReview = assets.filter((a) => a.status === "In Review").length;
    const blocked = assets.filter((a) => a.status === "Changes Requested").length;
    const done = assets.filter((a) => a.status === "Approved").length;
    return {
      projects: projects.length,
      assets: assets.length,
      inReview,
      blocked,
      done
    };
  }, [projects, assets]);

  if (!canView) {
    return (
      <section className="page-grid">
        <div className="card panel">
          <h1>Manager Workspace</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid manager-page">
      <div className="card panel manager-panel">
        <div className="manager-workspace-header">
          <h1>Manager Workspace</h1>
          <label>
            Organization
            <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}>
              <option value="" disabled>
                Select organization...
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={String(org.id)}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p role="alert" className="admin-error">{error}</p>}

        <div className="tabs nav nav-pills">
          <button type="button" className={`nav-link ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>
            Overview
          </button>
          <button type="button" className={`nav-link ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}>
            Projects
          </button>
          <button type="button" className={`nav-link ${tab === "assets" ? "active" : ""}`} onClick={() => setTab("assets")}>
            Assets
          </button>
          <button type="button" className={`nav-link ${tab === "team" ? "active" : ""}`} onClick={() => setTab("team")}>
            Team
          </button>
          <button type="button" className={`nav-link ${tab === "activity" ? "active" : ""}`} onClick={() => setTab("activity")}>
            Activity
          </button>
        </div>

        {loading ? <p>Loading workspace…</p> : null}

        {!loading && tab === "overview" && (
          <div className="dashboard-summary-grid manager-tab-content">
            <div className="dashboard-metric">
              <span className="dashboard-metric-label">Projects</span>
              <strong>{metrics.projects}</strong>
            </div>
            <div className="dashboard-metric">
              <span className="dashboard-metric-label">Assets</span>
              <strong>{metrics.assets}</strong>
            </div>
            <div className="dashboard-metric">
              <span className="dashboard-metric-label">Needs Review</span>
              <strong>{metrics.inReview}</strong>
            </div>
            <div className="dashboard-metric">
              <span className="dashboard-metric-label">Blocked</span>
              <strong>{metrics.blocked}</strong>
            </div>
          </div>
        )}

        {!loading && tab === "projects" && (
          <div className="manager-tab-content">
            <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
              <Link className="btn btn-primary file-link-btn" to={`/projects?organizationId=${selectedOrgId}`}>
                Manage projects
              </Link>
            </div>
            <div className="admin-scroll-table">
              <table className="table table-hover align-middle admin-table compact">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No projects yet.</td>
                    </tr>
                  ) : (
                    projects.map((p) => (
                      <tr key={p.id}>
                        <td data-label="Name">{p.name}</td>
                        <td data-label="Status">{p.status}</td>
                        <td data-label="Assets">{p.assetCount ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && tab === "assets" && (
          <div className="manager-tab-content">
            <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
              <Link className="btn btn-primary file-link-btn" to="/assets">
                Manage assets
              </Link>
            </div>
            <div className="admin-scroll-table">
              <table className="table table-hover align-middle admin-table compact">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No assets yet.</td>
                    </tr>
                  ) : (
                    assets.map((a) => (
                      <tr key={String(a.id)}>
                        <td data-label="Title">{a.name}</td>
                        <td data-label="Status">{statusLabel(a.status)}</td>
                        <td data-label="Owner">{a.owner}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && tab === "team" && (
          <div className="manager-tab-content">
            <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
              <Link className="btn btn-primary file-link-btn" to={`/admin/organizations/${selectedOrgId}`}>
                Manager
              </Link>
            </div>
            <div className="admin-scroll-table">
              <table className="table table-hover align-middle admin-table compact">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No members yet.</td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.userId}>
                        <td data-label="Name">{m.displayName}</td>
                        <td data-label="Email">{m.email}</td>
                        <td data-label="Role">{m.role}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && tab === "activity" && (
          <div className="admin-callout">
            <strong>Progress snapshot</strong>
            <p>{metrics.inReview} assets currently in review.</p>
            <p>{metrics.blocked} assets blocked by change requests.</p>
            <p>{metrics.done} assets approved.</p>
          </div>
        )}
      </div>
    </section>
  );
}



