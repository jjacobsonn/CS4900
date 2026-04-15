/**
 * Simple role-based auth for API routes.
 *
 * Expects the client to send the current user's role in the X-Vellum-Role header
 * (e.g. designer | reviewer | admin). The frontend sets this from localStorage after login.
 *
 * - attachRole: reads X-Vellum-Role, validates it, sets req.role (or null).
 * - requireRole(allowedRoles): returns 403 if req.role is missing or not in allowedRoles.
 */

const VALID_ROLES = ["designer", "reviewer", "admin"];

/**
 * Attach req.role from the X-Vellum-Role header.
 * Call this before requireRole on any route that needs role checks.
 */
export function attachRole(req, _res, next) {
  const raw = req.get("X-Vellum-Role");
  const role = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  req.role = VALID_ROLES.includes(role) ? role : null;
  next();
}

/**
 * Require that req.role is one of the allowed roles; otherwise send 403.
 *
 * @param {string[]} allowedRoles - e.g. ['designer', 'admin']
 * @returns {function(req, res, next)}
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(403).json({ error: "Role required; send X-Vellum-Role header" });
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
