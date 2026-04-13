import { query } from "../config/database.js";
import bcrypt from "bcrypt";

const LEGACY_TEST_PASSWORD = "TestPass123!";
const PLACEHOLDER_HASH = "$2b$10$example_hash_replace_in_production";

/**
 * Email/password login with bcrypt verification.
 * Legacy placeholder hashes still allow the known test password for compatibility.
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
            u.password_hash,
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

  let passwordValid = false;
  if (row.password_hash && row.password_hash !== PLACEHOLDER_HASH) {
    passwordValid = await bcrypt.compare(password, row.password_hash);
  } else {
    passwordValid = password === LEGACY_TEST_PASSWORD;
  }

  if (!passwordValid) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  // Return the exact normalized role from DB for Model B support.
  // Supported roles currently include: admin, designer, reviewer, manager, client_reviewer.
  const supportedRoles = new Set(["admin", "designer", "reviewer", "manager", "client_reviewer"]);
  const role = supportedRoles.has(row.role) ? row.role : "reviewer";

  return {
    id: String(row.id),
    email: row.email,
    role
  };
}

