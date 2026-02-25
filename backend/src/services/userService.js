import { query } from "../config/database.js";

/**
 * Map a lowercase role string used by the frontend to the canonical
 * role_code stored in the user_roles lookup table.
 */
function toRoleCode(role) {
  if (!role) return null;
  switch (role.toLowerCase()) {
    case "admin":
      return "ADMIN";
    case "designer":
      return "DESIGNER";
    case "reviewer":
      return "REVIEWER";
    default:
      return null;
  }
}

/**
 * List all users in the system with their resolved role strings.
 *
 * Returns rows shaped for the frontend UserAccount type:
 * { id: string, email: string, role: "designer" | "reviewer" | "admin", isActive: boolean }
 */
export async function listUsers() {
  const result = await query(
    `SELECT u.id,
            u.email,
            u.display_name,
            u.is_active,
            LOWER(r.role_code) AS role
     FROM users u
     JOIN user_roles r ON r.id = u.role_id
     ORDER BY u.id ASC`
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    email: row.email,
    displayName: row.display_name ?? null,
    role: row.role,
    isActive: Boolean(row.is_active)
  }));
}

/**
 * Create a new user account with the given email and role.
 *
 * Note: Password handling is intentionally simplified for this capstone sprint;
 * a placeholder hash is stored. In a production system, you would hash the
 * password using bcrypt or argon2 and never return it from the API.
 */
export async function createUserAccount({ email, role, displayName }) {
  const roleCode = toRoleCode(role);
  if (!roleCode) {
    const error = new Error("Invalid role");
    error.status = 400;
    throw error;
  }

  const roleResult = await query(
    "SELECT id FROM user_roles WHERE role_code = $1 LIMIT 1",
    [roleCode]
  );
  const roleRow = roleResult.rows[0];
  if (!roleRow) {
    const error = new Error("Role not found");
    error.status = 400;
    throw error;
  }

  const placeholderHash = "$2b$10$example_hash_replace_in_production";
  const name = displayName && String(displayName).trim() ? String(displayName).trim() : null;

  const insert = await query(
    `INSERT INTO users (email, password_hash, role_id, is_active, display_name)
     VALUES ($1, $2, $3, TRUE, $4)
     ON CONFLICT (email) DO UPDATE
       SET role_id = EXCLUDED.role_id,
           is_active = TRUE,
           display_name = COALESCE(EXCLUDED.display_name, users.display_name)
     RETURNING id, email, display_name, is_active`,
    [email, placeholderHash, roleRow.id, name]
  );

  const row = insert.rows[0];
  return {
    id: String(row.id),
    email: row.email,
    displayName: row.display_name ?? null,
    role,
    isActive: Boolean(row.is_active)
  };
}

/**
 * Update a user's role.
 */
export async function updateUserRoleById(id, role) {
  const roleCode = toRoleCode(role);
  if (!roleCode) {
    const error = new Error("Invalid role");
    error.status = 400;
    throw error;
  }

  const roleResult = await query(
    "SELECT id FROM user_roles WHERE role_code = $1 LIMIT 1",
    [roleCode]
  );
  const roleRow = roleResult.rows[0];
  if (!roleRow) {
    const error = new Error("Role not found");
    error.status = 400;
    throw error;
  }

  const updated = await query(
    `UPDATE users
     SET role_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, email, is_active`,
    [roleRow.id, id]
  );

  if (updated.rows.length === 0) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const row = updated.rows[0];
  return {
    id: String(row.id),
    email: row.email,
    role,
    isActive: Boolean(row.is_active)
  };
}

/**
 * Set user active flag (deactivate/reactivate). Admin only at route layer.
 */
export async function setUserActiveById(id, isActive) {
  const updated = await query(
    `UPDATE users
     SET is_active = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, email, is_active`,
    [Boolean(isActive), id]
  );

  if (updated.rows.length === 0) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const row = updated.rows[0];
  const roleResult = await query(
    "SELECT LOWER(role_code) AS role FROM user_roles WHERE id = (SELECT role_id FROM users WHERE id = $1)",
    [id]
  );
  const role = roleResult.rows[0]?.role ?? "designer";
  return {
    id: String(row.id),
    email: row.email,
    role,
    isActive: Boolean(row.is_active)
  };
}

/**
 * Soft-delete user (set is_active = false). Preserves referential integrity.
 */
export async function deleteUserById(id) {
  return setUserActiveById(id, false);
}
