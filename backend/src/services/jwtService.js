import jwt from "jsonwebtoken";

/**
 * @returns {string|null}
 */
export function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (s == null || String(s).trim() === "") {
    return null;
  }
  return String(s);
}

/**
 * @param {{ userId: string, role: string, email?: string }} payload
 * @returns {string}
 */
export function signAuthToken({ userId, role, email }) {
  const secret = getJwtSecret();
  if (!secret) {
    const err = new Error("JWT_SECRET is not configured");
    err.status = 500;
    throw err;
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";
  return jwt.sign(
    { sub: String(userId), role: String(role).toLowerCase(), email: email ?? undefined },
    secret,
    { expiresIn }
  );
}

/**
 * @param {string} token
 * @returns {import("jsonwebtoken").JwtPayload & { sub: string, role: string }}
 */
export function verifyAuthToken(token) {
  const secret = getJwtSecret();
  if (!secret) {
    const err = new Error("JWT_SECRET is not configured");
    err.status = 500;
    throw err;
  }
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string" || decoded == null) {
    const err = new Error("Invalid token");
    err.status = 401;
    throw err;
  }
  return /** @type {any} */ (decoded);
}
