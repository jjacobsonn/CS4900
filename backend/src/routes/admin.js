/**
 * Admin-only routes. Require Bearer JWT and admin role.
 */

import express from "express";
import { attachAuth, requireAuth, requireRole } from "../middleware/roleAuth.js";
import { getActivity, getOverview } from "../services/adminService.js";

const router = express.Router();

router.use(attachAuth);
router.use(requireAuth);

/**
 * GET /api/admin/overview
 * Returns asset counts by status for the admin dashboard.
 */
router.get("/overview", requireRole(["admin"]), async (_req, res, next) => {
  try {
    const overview = await getOverview();
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/activity
 * Returns recent assets and recent comments for admin visibility.
 */
router.get("/activity", requireRole(["manager", "admin", "owner"]), async (req, res, next) => {
  try {
    const organizationId = req.query.organizationId != null ? Number(req.query.organizationId) : null;
    const activity = await getActivity(Number.isFinite(organizationId) ? organizationId : null);
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

export default router;
