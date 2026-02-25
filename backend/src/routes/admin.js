/**
 * Admin-only routes. All require X-Vellum-Role: admin.
 */

import express from "express";
import { attachRole, requireRole } from "../middleware/roleAuth.js";
import { getActivity, getOverview } from "../services/adminService.js";

const router = express.Router();

router.use(attachRole);
router.use(requireRole(["admin"]));

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
