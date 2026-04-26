import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminActivity, type AdminActivity } from "../api/admin";
import { getAssets } from "../api/assets";
import { deleteComment } from "../api/comments";
import { getOrganizationMembers, getOrganizations } from "../api/organizations";
import { getProjects } from "../api/projects";
import type { Asset, Organization, OrganizationMemberRow } from "../types/models";
import type { Project } from "../api/projects";
import { canAccessAdmin, type Role } from "../utils/permissions";
import { statusLabel } from "../utils/format";

type ManagerTab = "overview" | "projects" | "assets" | "team" | "activity";
const defaultActivity: AdminActivity = { recentAssets: [], recentComments: [] };
const activityVisibleLimit = 5;

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

export function ManagerPage({ role }: { role: Role }) {
  const navigate = useNavigate();
  const isMobileInitial = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [members, setMembers] = useState<OrganizationMemberRow[]>([]);
  const [activity, setActivity] = useState<AdminActivity>(defaultActivity);
  const [showAssets, setShowAssets] = useState(!isMobileInitial);
  const [showComments, setShowComments] = useState(!isMobileInitial);
  const [tab, setTab] = useState<ManagerTab>("activity");
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
      .catch((err: Error) => setError(err.message || "Could not load teams."))
      .finally(() => setLoading(false));
  }, [canView]);

  useEffect(() => {
    if (!canView || !hasSelectedOrg) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getProjects({ organizationId: orgIdNum }),
      getAssets(),
      getOrganizationMembers(orgIdNum),
      getAdminActivity({ organizationId: orgIdNum }).catch(() => defaultActivity)
    ])
      .then(([projectRows, assetRows, memberRows, activityRows]) => {
        setProjects(projectRows);
        setAssets(assetRows.filter((a) => Number(a.organizationId) === orgIdNum));
        setMembers(memberRows);
        setActivity(activityRows);
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

  const recentAssets = useMemo<AdminActivity["recentAssets"]>(() => {
    if (activity.recentAssets.length > 0) {
      return activity.recentAssets.slice(0, activityVisibleLimit);
    }

    return [...assets]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, activityVisibleLimit)
      .map((asset) => ({
        id: Number(asset.id),
        title: asset.name,
        status: asset.backendStatus ?? asset.status,
        owner: asset.owner,
        updatedAt: asset.updatedAt
      }));
  }, [activity.recentAssets, assets]);

  const recentComments = useMemo(
    () => activity.recentComments.slice(0, activityVisibleLimit),
    [activity.recentComments]
  );

  const handleDeleteComment = async (assetId: string, commentId: string) => {
    const ok = window.confirm("Delete this comment?");
    if (!ok) return;
    await deleteComment(assetId, commentId);
    if (hasSelectedOrg) {
      setActivity(await getAdminActivity({ organizationId: orgIdNum }).catch(() => defaultActivity));
    }
  };

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
            Team
            <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}>
              <option value="" disabled>
                Select team...
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

        <div className="tabs nav nav-pills manager-subnav">
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
            Team Members
          </button>
          <button type="button" className={`nav-link ${tab === "activity" ? "active" : ""}`} onClick={() => setTab("activity")}>
            Recent Activity
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
                Manage Projects
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
                Manage Assets
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
                Manage Team
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
          <div className="manager-tab-content">
            <div className="admin-split-header">
              <h2 className="admin-section-title">Recent comments</h2>
              {recentComments.length > 0 && (
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowComments((prev) => !prev)}>
                  {showComments ? "Hide" : "Show"}
                </button>
              )}
            </div>

            {showComments && (
              <div className="admin-scroll-table">
                {recentComments.length === 0 ? (
                  <p>No comments yet.</p>
                ) : (
                  <table className="table table-hover align-middle admin-table compact manager-activity-table">
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
                      {recentComments.map((comment) => (
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
                          <td data-label="Comment" className="manager-activity-comment-cell">
                            <span className="manager-activity-comment">"{comment.message}"</span>
                          </td>
                          <td data-label="Author">{comment.author}</td>
                          <td data-label="When">{formatDate(comment.createdAt)}</td>
                          <td data-label="Actions" className="manager-activity-actions-cell">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm manager-activity-delete"
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

            <div className="admin-split-header admin-section-gap">
              <h2 className="admin-section-title">Recent assets</h2>
              {recentAssets.length > 0 && (
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAssets((prev) => !prev)}>
                  {showAssets ? "Hide" : "Show"}
                </button>
              )}
            </div>

            {showAssets && (
              <div className="admin-scroll-table">
                {recentAssets.length === 0 ? (
                  <p>No assets yet.</p>
                ) : (
                  <table className="table table-hover align-middle admin-table compact">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAssets.map((asset) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
