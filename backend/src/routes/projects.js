import express from "express";
import { attachAuth, requireAuth, requireRole, parseAuthUserId } from "../middleware/roleAuth.js";
import { query } from "../config/database.js";
import { listProjectActivity } from "../services/projectActivityService.js";
import { getProjectDetail, updateProjectById } from "../services/projectService.js";
import {
  assertOrgMinRank,
  assertProjectMembership,
  assertProjectMinOrgRank,
  isPlatformAdmin,
  orgRoleToRank
} from "../services/organizationService.js";

const router = express.Router();

const ORG_RANK_OWNER = 4;
const ORG_RANK_MANAGER = 3;

router.use(attachAuth);
router.use(requireAuth);

/**
 * GET /api/projects
 */
router.get("/", async (req, res, next) => {
  try {
    const uid = parseAuthUserId(req);
    if (uid == null) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const clientId = req.query.clientId ? Number(req.query.clientId) : null;
    const organizationId = req.query.organizationId ? Number(req.query.organizationId) : null;

    const params = [];
    const whereParts = [];

    if (Number.isFinite(clientId)) {
      whereParts.push(`p.client_id = $${params.length + 1}`);
      params.push(clientId);
    }
    if (Number.isFinite(organizationId)) {
      whereParts.push(`p.organization_id = $${params.length + 1}`);
      params.push(organizationId);
    }

    if (!isPlatformAdmin(req.role)) {
      whereParts.push(
        `EXISTS (
           SELECT 1 FROM organization_members m
           WHERE m.organization_id = p.organization_id AND m.user_id = $${params.length + 1}
         )`
      );
      params.push(uid);
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const result = await query(
      `SELECT p.id,
              p.name,
              p.description,
              p.status,
              p.priority,
              p.due_date,
              p.client_id,
              p.organization_id,
              o.name AS organization_name,
              c.name AS client_name,
              p.owner_user_id,
              p.created_at,
              (SELECT COUNT(*)::int FROM assets a WHERE a.project_id = p.id) AS asset_count
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN organizations o ON o.id = p.organization_id
       ${where}
       ORDER BY p.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects — admin, org owner, or org manager
 */
router.post("/", requireRole(["admin", "owner", "manager"]), async (req, res, next) => {
  try {
    const {
      organizationId,
      clientId,
      name,
      description,
      priority,
      dueDate,
      status,
      ownerUserId
    } = req.body ?? {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }
    const orgId = organizationId != null ? Number(organizationId) : null;
    if (!Number.isFinite(orgId)) {
      return res.status(400).json({ error: "organizationId is required" });
    }

    const uid = parseAuthUserId(req);
    if (uid == null) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (isPlatformAdmin(req.role)) {
      const ocheck = await query("SELECT id FROM organizations WHERE id = $1 LIMIT 1", [orgId]);
      if (ocheck.rows.length === 0) {
        return res.status(400).json({ error: "Organization not found" });
      }
    } else {
      try {
        await assertOrgMinRank(uid, orgId, req.role, ORG_RANK_MANAGER);
      } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        throw err;
      }
    }

    let client_id = clientId != null ? Number(clientId) : null;
    if (client_id != null && !Number.isFinite(client_id)) {
      client_id = null;
    }
    if (client_id != null) {
      const ck = await query("SELECT id FROM clients WHERE id = $1 LIMIT 1", [client_id]);
      if (ck.rows.length === 0) {
        return res.status(400).json({ error: "Client not found" });
      }
    }

    let owner_id = uid;
    if (ownerUserId !== undefined && ownerUserId !== null && ownerUserId !== "") {
      const ou = Number(ownerUserId);
      if (Number.isFinite(ou)) {
        const ucheck = await query("SELECT id FROM users WHERE id = $1 AND is_active = TRUE LIMIT 1", [ou]);
        if (ucheck.rows.length > 0) {
          owner_id = ou;
        }
      }
    }

    const statusVal =
      status != null && typeof status === "string" && status.trim() ? status.trim() : "Active";
    const result = await query(
      `INSERT INTO projects (client_id, organization_id, name, description, priority, due_date, created_by_user_id, owner_user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, client_id, organization_id, name, description, status, priority, due_date, created_at, owner_user_id`,
      [client_id, orgId, name.trim(), description ?? null, priority ?? null, dueDate ?? null, uid, owner_id, statusVal]
    );
    const row = result.rows[0];
    const orgJoin = await query(`SELECT name AS organization_name FROM organizations WHERE id = $1`, [orgId]);
    res.status(201).json({ ...row, organization_name: orgJoin.rows[0]?.organization_name ?? null });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/activity
 */
router.get("/:projectId/activity", async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const uid = parseAuthUserId(req);
    if (uid == null) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      await assertProjectMinOrgRank(uid, projectId, req.role, ORG_RANK_MANAGER);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      throw err;
    }
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const rows = await listProjectActivity(projectId, { limit });
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

/**
 * PATCH /api/projects/:projectId
 */
router.patch("/:projectId", requireRole(["admin", "owner", "manager"]), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const uid = parseAuthUserId(req);
    if (uid == null) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { orgRole } = await assertProjectMembership(uid, projectId, req.role);
      if (!isPlatformAdmin(req.role)) {
        if (orgRoleToRank(orgRole) < ORG_RANK_MANAGER) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      throw err;
    }

    const { name, description, status, priority, dueDate, clientId, ownerUserId, organizationId } = req.body ?? {};
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (status !== undefined) patch.status = status;
    if (priority !== undefined) patch.priority = priority;
    if (dueDate !== undefined) patch.dueDate = dueDate;
    if (clientId !== undefined) {
      patch.clientId = clientId;
    }
    if (ownerUserId !== undefined) {
      patch.ownerUserId = ownerUserId;
    }
    if (organizationId !== undefined) {
      if (!isPlatformAdmin(req.role)) {
        return res.status(403).json({ error: "Only platform admins can move projects between organizations" });
      }
      patch.organizationId = organizationId;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await updateProjectById(projectId, patch);
    if (!updated) {
      return res.status(404).json({ error: "Project not found" });
    }

    const clientJoin = await query(
      `SELECT c.name AS client_name, o.name AS organization_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN organizations o ON o.id = p.organization_id
       WHERE p.id = $1`,
      [projectId]
    );
    res.json({
      ...updated,
      client_name: clientJoin.rows[0]?.client_name ?? null,
      organization_name: clientJoin.rows[0]?.organization_name ?? null
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return next(error);
  }
});

/**
 * DELETE /api/projects/:projectId
 */
router.delete("/:projectId", requireRole(["admin", "owner"]), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const uid = parseAuthUserId(req);
    if (uid == null) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!isPlatformAdmin(req.role)) {
      try {
        await assertProjectMinOrgRank(uid, projectId, req.role, ORG_RANK_OWNER);
      } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        throw err;
      }
    }

    const del = await query("DELETE FROM projects WHERE id = $1 RETURNING id", [projectId]);
    if (del.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/projects/:projectId
 */
router.get("/:projectId", async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const uid = parseAuthUserId(req);
    if (uid == null) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      await assertProjectMembership(uid, projectId, req.role);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      throw err;
    }

    const detail = await getProjectDetail(projectId);
    if (!detail) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { project, assets, contributors } = detail;
    res.json({
      ...project,
      assets,
      contributors
    });
  } catch (error) {
    next(error);
  }
});

export default router;
