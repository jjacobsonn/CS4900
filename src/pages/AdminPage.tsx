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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("designer");

  const load = async () => {
    const [overviewData, usersData] = await Promise.all([getAdminOverview(), getUsers()]);
    setOverview(overviewData);
    setUsers(usersData);
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
        <ul className="user-list">
          {users.map((user) => (
            <li key={user.id}>
              <span>{user.email}</span>
              <select value={user.role} onChange={(event) => void handleRoleChange(user.id, event.target.value as Role)}>
                <option value="designer">designer</option>
                <option value="reviewer">reviewer</option>
                <option value="admin">admin</option>
              </select>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
