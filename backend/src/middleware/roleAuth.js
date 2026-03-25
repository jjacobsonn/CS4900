/**
 * JWT-based auth and role checks for API routes.
 *
 * - attachAuth: reads `Authorization: Bearer <jwt>`, verifies signature/expiry, sets req.userId and req.role.
 *   Malformed or expired tokens → 401. Missing header → req.userId/req.role stay null.
 * - requireAuth: 401 if not logged in (after attachAuth).
 * - requireRole(allowedRoles): 403 if role not in allowedRoles.
 */

import { verifyAuthToken, getJwtSecret } from "../services/jwtService.js";

export const VALID_ROLES = ["designer", "reviewer", "manager", "client_reviewer", "admin", "super_admin"];

/**
 * @param {import("express").Request} req
 * @returns {number|null}
 */
export function parseAuthUserId(req) {
  const n = Number(req.userId);
  return Number.isFinite(n) ? n : null;
}

/**
 * Attach req.userId and req.role from Bearer JWT.
 */
export function attachAuth(req, res, next) {
  const secret = getJwtSecret();
  if (!secret) {
    return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET is not set" });
  }

  const header = req.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    req.userId = null;
    req.role = null;
    return next();
  }

  const token = header.slice(7).trim();
  if (!token) {
    req.userId = null;
    req.role = null;
    return next();
  }

  try {
    const payload = verifyAuthToken(token);
    const role = typeof payload.role === "string" ? payload.role.trim().toLowerCase() : "";
    if (!VALID_ROLES.includes(role)) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const sub = payload.sub;
    req.userId = sub != null ? String(sub) : null;
    req.role = role;
    return next();
  } catch (err) {
    const status = err.status === 500 ? 500 : 401;
    return res.status(status).json({
      error: status === 500 ? err.message || "Server error" : "Invalid or expired token"
    });
  }
}

/**
 * Require a verified login (run after attachAuth).
 */
export function requireAuth(req, res, next) {
  if (!req.userId || !req.role) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

/**
 * Require that req.role is one of the allowed roles; otherwise send 403.
 *
 * @param {string[]} allowedRoles
 * @returns {function(import("express").Request, import("express").Response, import("express").NextFunction)}
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `This action requires one of: ${allowedRoles.join(", ")}`
      });
    }
    next();
  };
}
