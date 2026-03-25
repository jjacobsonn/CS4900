/**
 * Admin-only routes. Require Bearer JWT and admin or super_admin role.
 */

import express from "express";
import { attachAuth, requireAuth, requireRole } from "../middleware/roleAuth.js";
import { getActivity, getOverview } from "../services/adminService.js";

const router = express.Router();

router.use(attachAuth);
router.use(requireAuth);
router.use(requireRole(["admin", "super_admin"]));

/**
 * GET /api/admin/overview
 * Returns asset counts by status for the admin dashboard.
 */
router.get("/overview", async (_req, res, next) => {
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
router.get("/activity", async (_req, res, next) => {
  try {
    const activity = await getActivity();
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

export default router;
