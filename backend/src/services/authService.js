import { query } from "../config/database.js";

/**
 * Simple email/password login for seeded test users.
 *
 * NOTE: Passwords in the database are placeholder hashes. For this capstone
 * pass we validate against the known test password only ("TestPass123!").
 * In a production system you MUST hash and verify with bcrypt/argon2.
 */
export async function loginWithEmailPassword(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) {
    const error = new Error("Email and password are required.");
    error.status = 400;
    throw error;
  }

  const result = await query(
    `SELECT u.id,
            LOWER(u.email) AS email,
            u.is_active,
            LOWER(r.role_code) AS role
     FROM users u
     JOIN user_roles r ON r.id = u.role_id
     WHERE LOWER(u.email) = $1
     LIMIT 1`,
    [normalizedEmail]
  );

  const row = result.rows[0];
  if (!row || row.is_active === false) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  // For this sprint, all seeded users share the same known test password.
  // Replace this with real password hash verification when ready.
  if (password !== "TestPass123!") {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  const role = row.role === "admin" ? "admin" : row.role === "designer" ? "designer" : "reviewer";

  return {
    id: String(row.id),
    email: row.email,
    role
  };
}

