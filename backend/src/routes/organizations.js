import express from "express";
import { attachAuth, requireAuth, requireRole, parseAuthUserId } from "../middleware/roleAuth.js";
import { query } from "../config/database.js";
import {
  addOrUpdateOrganizationMember,
  createOrganization,
  getOrganizationByIdForActor,
  listOrganizationMembers,
  listOrganizationsForActor,
  removeOrganizationMember,
  updateOrganizationById
} from "../services/organizationService.js";

const router = express.Router();

router.use(attachAuth);
router.use(requireAuth);

/**
 * GET /api/organizations
 * Admin: all organizations. Others: organizations they belong to.
 */
router.get("/", async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    if (uid == null) return res.status(401).json({ error: "Authentication required" });
    const rows = await listOrganizationsForActor(uid, req.role);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/organizations — platform admin only
 * Body: { name, description?, details?, initialOwnerUserId? }
 */
router.post("/", requireRole(["admin"]), async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    const { name, description, details, initialOwnerUserId } = req.body ?? {};
    const org = await createOrganization({
      name,
      description: description ?? null,
      details: details ?? null,
      createdByUserId: uid,
      initialOwnerUserId: initialOwnerUserId != null ? Number(initialOwnerUserId) : undefined
    });
    res.status(201).json(org);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
});

/**
 * GET /api/organizations/:organizationId
 */
router.get("/:organizationId", async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    if (uid == null) return res.status(401).json({ error: "Authentication required" });
    const organizationId = Number(req.params.organizationId);
    if (!Number.isFinite(organizationId)) {
      return res.status(400).json({ error: "Invalid organization id" });
    }
    const row = await getOrganizationByIdForActor(organizationId, uid, req.role);
    if (!row) return res.status(404).json({ error: "Organization not found" });
    res.json(row);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/organizations/:organizationId — admin or org owner
 */
router.patch("/:organizationId", async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    if (uid == null) return res.status(401).json({ error: "Authentication required" });
    const organizationId = Number(req.params.organizationId);
    if (!Number.isFinite(organizationId)) {
      return res.status(400).json({ error: "Invalid organization id" });
    }
    const { name, description, details } = req.body ?? {};
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (details !== undefined) patch.details = details;
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    const updated = await updateOrganizationById(organizationId, patch, uid, req.role);
    if (!updated) return res.status(404).json({ error: "Organization not found" });
    res.json(updated);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
});

/**
 * GET /api/organizations/:organizationId/members
 */
router.get("/:organizationId/members", async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    if (uid == null) return res.status(401).json({ error: "Authentication required" });
    const organizationId = Number(req.params.organizationId);
    if (!Number.isFinite(organizationId)) {
      return res.status(400).json({ error: "Invalid organization id" });
    }
    const org = await getOrganizationByIdForActor(organizationId, uid, req.role);
    if (!org) return res.status(404).json({ error: "Organization not found" });
    const members = await listOrganizationMembers(organizationId);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/organizations/:organizationId/members
 * Body: { userId, role } — role is owner|manager|designer|reviewer (case-insensitive)
 */
router.post("/:organizationId/members", async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    if (uid == null) return res.status(401).json({ error: "Authentication required" });
    const organizationId = Number(req.params.organizationId);
    if (!Number.isFinite(organizationId)) {
      return res.status(400).json({ error: "Invalid organization id" });
    }
    const org = await getOrganizationByIdForActor(organizationId, uid, req.role);
    if (!org) return res.status(404).json({ error: "Organization not found" });

    const { userId, role } = req.body ?? {};
    const tid = Number(userId);
    if (!Number.isFinite(tid) || !role || typeof role !== "string") {
      return res.status(400).json({ error: "userId and role are required" });
    }
    const result = await addOrUpdateOrganizationMember(organizationId, tid, role, uid, req.role);
    res.status(201).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/organizations/:organizationId/members/:userId
 */
router.delete("/:organizationId/members/:userId", async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    if (uid == null) return res.status(401).json({ error: "Authentication required" });
    const organizationId = Number(req.params.organizationId);
    const targetUserId = Number(req.params.userId);
    if (!Number.isFinite(organizationId) || !Number.isFinite(targetUserId)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const org = await getOrganizationByIdForActor(organizationId, uid, req.role);
    if (!org) return res.status(404).json({ error: "Organization not found" });
    await removeOrganizationMember(organizationId, targetUserId, uid, req.role);
    res.status(204).send();
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
});

/**
 * GET /api/organizations/:organizationId/projects
 */
router.get("/:organizationId/projects", async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    if (uid == null) return res.status(401).json({ error: "Authentication required" });
    const organizationId = Number(req.params.organizationId);
    if (!Number.isFinite(organizationId)) {
      return res.status(400).json({ error: "Invalid organization id" });
    }
    const org = await getOrganizationByIdForActor(organizationId, uid, req.role);
    if (!org) return res.status(404).json({ error: "Organization not found" });

    const result = await query(
      `SELECT p.id,
              p.name,
              p.description,
              p.status,
              p.priority,
              p.due_date,
              p.client_id,
              p.organization_id,
              c.name AS client_name,
              p.owner_user_id,
              p.created_at,
              (SELECT COUNT(*)::int FROM assets a WHERE a.project_id = p.id) AS asset_count
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.organization_id = $1
       ORDER BY p.created_at DESC`,
      [organizationId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
