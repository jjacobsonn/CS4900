import { FormEvent, useEffect, useState } from "react";
import { getAdminOverview } from "../api/admin";
import { createUser, getUsers, updateUserRole } from "../api/users";
import { AdminOverview, UserAccount } from "../types/models";
import { Role } from "../utils/permissions";

const defaultOverview: AdminOverview = {
  pendingReview: 0,
  changesRequested: 0,
  approved: 0
};

export function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview>(defaultOverview);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("designer");

  const load = async () => {
    setLoading(true);
    setUsersError(null);
    try {
      const [overviewData, usersData] = await Promise.all([
        getAdminOverview().catch(() => defaultOverview),
        getUsers().catch((err: Error) => {
          setUsersError(err.message || "Could not load users");
          return [];
        })
      ]);
      setOverview(overviewData);
      setUsers(usersData);
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
    await createUser({ email: email.trim(), role });
    setEmail("");
    setRole("designer");
    await load();
  };

  const handleRoleChange = async (id: string, nextRole: Role) => {
    await updateUserRole(id, nextRole);
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
        <h1>User Management</h1>
        <form onSubmit={handleCreateUser} className="admin-form">
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
                <th style={{ padding: "8px 12px" }}>Email</th>
                <th style={{ padding: "8px 12px" }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: 12 }}>
                    No users yet. Create one above.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 12px" }}>{user.email}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <select value={user.role} onChange={(event) => void handleRoleChange(user.id, event.target.value as Role)}>
                        <option value="designer">designer</option>
                        <option value="reviewer">reviewer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
