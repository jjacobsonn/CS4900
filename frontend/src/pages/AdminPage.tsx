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
    // Simple confirm; enough for admin cleanup.
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this asset and all its comments/versions?");
    if (!ok) return;
    await deleteAsset(id);
    await load();
  };

  const handleDeleteComment = async (assetId: string, commentId: string) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this comment?");
    if (!ok) return;
    await deleteComment(assetId, commentId);
    await load();
  };

  return (
    <section className="page-grid">
      <div className="panel">
        <h1>System Overview</h1>
        <ul className="overview-list">
          <li>Pending Review: {overview.pendingReview}</li>
          <li>Changes Requested: {overview.changesRequested}</li>
          <li>Approved: {overview.approved}</li>
        </ul>
      </div>
      <div className="panel">
        <h1>Recent Activity</h1>
        <p style={{ fontSize: "0.9rem", color: "#666" }}>Last updated assets and comments</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <h2 style={{ fontSize: "1rem", margin: 0 }}>Recent assets</h2>
          {activity.recentAssets.length > 0 && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowAssets((prev) => !prev)}
            >
              {showAssets ? "Hide" : "Show"}
            </button>
          )}
        </div>
        {showAssets && (
          <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 8 }}>
            {activity.recentAssets.length === 0 ? (
              <p>No assets yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                    <th style={{ padding: "4px 6px" }}>Title</th>
                    <th style={{ padding: "4px 6px" }}>Status</th>
                    <th style={{ padding: "4px 6px" }}>Owner</th>
                    <th style={{ padding: "4px 6px" }}>Updated</th>
                    <th style={{ padding: "4px 6px" }} />
                  </tr>
                </thead>
                <tbody>
                  {activity.recentAssets.slice(0, 20).map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "4px 6px" }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/assets/${a.id}`)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            textAlign: "left"
                          }}
                        >
                          {a.title}
                        </button>
                      </td>
                      <td style={{ padding: "4px 6px" }}>{a.status}</td>
                      <td style={{ padding: "4px 6px" }}>{a.owner}</td>
                      <td style={{ padding: "4px 6px" }}>{formatDate(a.updatedAt)}</td>
                      <td style={{ padding: "4px 6px", textAlign: "right" }}>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => void handleDeleteAsset(String(a.id))}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <h2 style={{ fontSize: "1rem", margin: 0 }}>Recent comments</h2>
          {activity.recentComments.length > 0 && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowComments((prev) => !prev)}
            >
              {showComments ? "Hide" : "Show"}
            </button>
          )}
        </div>
        {showComments && (
          <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 8 }}>
            {activity.recentComments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                    <th style={{ padding: "4px 6px" }}>Asset</th>
                    <th style={{ padding: "4px 6px" }}>Comment</th>
                    <th style={{ padding: "4px 6px" }}>Author</th>
                    <th style={{ padding: "4px 6px" }}>When</th>
                    <th style={{ padding: "4px 6px" }} />
                  </tr>
                </thead>
                <tbody>
                  {activity.recentComments.slice(0, 30).map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "4px 6px" }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/assets/${c.assetId}`)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            textAlign: "left"
                          }}
                        >
                          {c.assetTitle}
                        </button>
                      </td>
                      <td style={{ padding: "4px 6px" }}>“{c.message}”</td>
                      <td style={{ padding: "4px 6px" }}>{c.author}</td>
                      <td style={{ padding: "4px 6px" }}>{formatDate(c.createdAt)}</td>
                      <td style={{ padding: "4px 6px", textAlign: "right" }}>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => void handleDeleteComment(String(c.assetId), String(c.id))}
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
      <div className="panel" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 800, margin: "0 auto" }}>
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
          {usersError && <p role="alert" style={{ color: "#900" }}>{usersError}</p>}
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <table className="user-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                  <th style={{ padding: "8px 12px" }}>Name</th>
                  <th style={{ padding: "8px 12px" }}>Email</th>
                  <th style={{ padding: "8px 12px" }}>Role</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                  <th style={{ padding: "8px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 12 }}>
                      No users yet. Create one above.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px 12px" }}>{user.displayName || "—"}</td>
                      <td style={{ padding: "8px 12px" }}>{user.email}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <select value={user.role} onChange={(event) => void handleRoleChange(user.id, event.target.value as Role)}>
                          <option value="designer">designer</option>
                          <option value="reviewer">reviewer</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 12px" }}>{user.isActive ? "Active" : "Inactive"}</td>
                      <td style={{ padding: "8px 12px" }}>
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
          )}
        </div>
      </div>
    </section>
  );
}
