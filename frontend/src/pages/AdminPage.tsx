import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminActivity, getAdminOverview } from "../api/admin";
import { deleteAsset } from "../api/assets";
import { deleteComment } from "../api/comments";
import type { AdminActivity } from "../api/admin";
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

  const load = async () => {
    setLoading(true);
    setUsersError(null);
    try {
      const [overviewData, usersData, activityData] = await Promise.all([
        getAdminOverview().catch(() => defaultOverview),
        getUsers().catch((err: Error) => {
          setUsersError(err.message || "Could not load users");
          return [];
        }),
        getAdminActivity().catch(() => defaultActivity)
      ]);
      setOverview(overviewData);
      setUsers(usersData);
      setActivity(activityData);
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

      <div className="panel admin-wide-panel">
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
                          <select value={user.role} onChange={(event) => void handleRoleChange(user.id, event.target.value as Role)}>
                            <option value="designer">designer</option>
                            <option value="reviewer">reviewer</option>
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
