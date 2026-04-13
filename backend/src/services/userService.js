import { query } from "../config/database.js";
import bcrypt from "bcrypt";

const BCRYPT_SALT_ROUNDS = 10;
const PLACEHOLDER_HASH = "$2b$10$example_hash_replace_in_production";

/**
 * Map a lowercase role string used by the frontend to the canonical
 * role_code stored in the user_roles lookup table.
 */
/**
 * Ensures extended role codes exist (older DBs may only have designer/reviewer/admin from seed).
 */
async function ensureExtendedUserRoles() {
  await query(
    `INSERT INTO user_roles (role_code, description)
     VALUES ('OWNER', 'Organization owner')
     ON CONFLICT (role_code) DO NOTHING`
  );
  await query(
    `INSERT INTO user_roles (role_code, description)
     VALUES ('MANAGER', 'Manager')
     ON CONFLICT (role_code) DO NOTHING`
  );
}

function toRoleCode(role) {
  if (!role) return null;
  switch (role.toLowerCase()) {
    case "admin":
      return "ADMIN";
    case "designer":
      return "DESIGNER";
    case "reviewer":
      return "REVIEWER";
    case "manager":
      return "MANAGER";
    case "owner":
      return "OWNER";
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
 * If a password is provided, it is hashed with bcrypt before persistence.
 * If omitted, a legacy placeholder hash is stored for invite-style provisioning.
 */
export async function createUserAccount({ email, role, displayName, password }) {
  const roleCode = toRoleCode(role);
  if (!roleCode) {
    const error = new Error("Invalid role");
    error.status = 400;
    throw error;
  }

  await ensureExtendedUserRoles();

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

  const name = displayName && String(displayName).trim() ? String(displayName).trim() : null;
  const normalizedPassword = typeof password === "string" ? password.trim() : "";
  let passwordHash = PLACEHOLDER_HASH;

  if (normalizedPassword) {
    if (normalizedPassword.length < 10) {
      const error = new Error("Password must be at least 10 characters.");
      error.status = 400;
      throw error;
    }
    passwordHash = await bcrypt.hash(normalizedPassword, BCRYPT_SALT_ROUNDS);
  }

  const insert = await query(
    `INSERT INTO users (email, password_hash, role_id, is_active, display_name)
     VALUES ($1, $2, $3, TRUE, $4)
     ON CONFLICT (email) DO UPDATE
       SET role_id = EXCLUDED.role_id,
           is_active = TRUE,
           display_name = COALESCE(EXCLUDED.display_name, users.display_name)
     RETURNING id, email, display_name, is_active`,
    [email, passwordHash, roleRow.id, name]
  );

  const row = insert.rows[0];
  const normalizedRole = String(role).trim().toLowerCase();
  return {
    id: String(row.id),
    email: row.email,
    displayName: row.display_name ?? null,
    role: normalizedRole,
    isActive: Boolean(row.is_active)
  };
}

/**
 * Update a user's role.
 */
export async function updateUserRoleById(id, role) {
  await ensureExtendedUserRoles();

  // Hard guard: never allow demoting the seeded admin account via API.
  const current = await query("SELECT email FROM users WHERE id = $1 LIMIT 1", [id]);
  const currentEmail = current.rows[0]?.email?.toLowerCase?.() ?? null;
  if (currentEmail === "admin@vellum.test".toLowerCase() && role !== "admin") {
    const error = new Error("Cannot change role for primary admin account.");
    error.status = 400;
    throw error;
  }

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
  const normalizedRole = String(role).trim().toLowerCase();
  return {
    id: String(row.id),
    email: row.email,
    role: normalizedRole,
    isActive: Boolean(row.is_active)
  };
}

/**
 * Set user active flag (deactivate/reactivate). Admin only at route layer.
 */
export async function setUserActiveById(id, isActive) {
  const current = await query("SELECT email FROM users WHERE id = $1 LIMIT 1", [id]);
  const currentEmail = current.rows[0]?.email?.toLowerCase?.() ?? null;
  if (currentEmail === "admin@vellum.test".toLowerCase() && isActive === false) {
    const error = new Error("Cannot deactivate primary admin account.");
    error.status = 400;
    throw error;
  }

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

/**
 * Return one user in the same shape as listUsers().
 *
 * @param {number|string} id
 */
export async function getUserById(id) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) return null;
  const result = await query(
    `SELECT u.id,
            u.email,
            u.display_name,
            u.is_active,
            LOWER(r.role_code) AS role
     FROM users u
     JOIN user_roles r ON r.id = u.role_id
     WHERE u.id = $1
     LIMIT 1`,
    [uid]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    email: row.email,
    displayName: row.display_name ?? null,
    role: row.role,
    isActive: Boolean(row.is_active)
  };
}

/**
 * Partial update: any subset of email, displayName, role, isActive, password (non-empty string sets new password).
 *
 * @param {number|string} id
 * @param {{ email?: string, displayName?: string|null, role?: string, isActive?: boolean, password?: string }} patch
 */
export async function patchUserById(id, patch) {
  await ensureExtendedUserRoles();
  const uid = Number(id);
  if (!Number.isFinite(uid)) {
    const error = new Error("Invalid user id");
    error.status = 400;
    throw error;
  }

  const existing = await getUserById(uid);
  if (!existing) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const isPrimaryAdmin = existing.email.toLowerCase() === "admin@vellum.test".toLowerCase();

  if (patch.isActive === false && isPrimaryAdmin) {
    const error = new Error("Cannot deactivate primary admin account.");
    error.status = 400;
    throw error;
  }

  if (patch.email !== undefined) {
    const em = String(patch.email || "").trim().toLowerCase();
    if (!em) {
      const error = new Error("Email cannot be empty.");
      error.status = 400;
      throw error;
    }
    if (isPrimaryAdmin && em !== existing.email.toLowerCase()) {
      const error = new Error("Cannot change email for primary admin account.");
      error.status = 400;
      throw error;
    }
    const clash = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1`,
      [em, uid]
    );
    if (clash.rows.length > 0) {
      const error = new Error("That email is already in use.");
      error.status = 400;
      throw error;
    }
    await query(`UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [em, uid]);
  }

  if (patch.displayName !== undefined) {
    const raw = patch.displayName;
    const dn = raw == null || String(raw).trim() === "" ? null : String(raw).trim();
    await query(`UPDATE users SET display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [dn, uid]);
  }

  if (patch.password !== undefined && String(patch.password).trim() !== "") {
    const normalizedPassword = String(patch.password).trim();
    if (normalizedPassword.length < 10) {
      const error = new Error("Password must be at least 10 characters.");
      error.status = 400;
      throw error;
    }
    const passwordHash = await bcrypt.hash(normalizedPassword, BCRYPT_SALT_ROUNDS);
    await query(`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
      passwordHash,
      uid
    ]);
  }

  if (patch.role !== undefined && patch.role !== null) {
    await updateUserRoleById(uid, patch.role);
  }

  if (patch.isActive !== undefined) {
    await setUserActiveById(uid, Boolean(patch.isActive));
  }

  const refreshed = await getUserById(uid);
  if (!refreshed) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  return refreshed;
}
