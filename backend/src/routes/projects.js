import express from "express";
import { attachAuth, requireAuth, requireRole, parseAuthUserId } from "../middleware/roleAuth.js";
import { query } from "../config/database.js";
import { listProjectActivity } from "../services/projectActivityService.js";
import { getProjectDetail, updateProjectById } from "../services/projectService.js";

const router = express.Router();

router.use(attachAuth);
router.use(requireAuth);

/**
 * GET /api/projects
 *
 * List projects, optionally filtered by clientId.
 */
router.get("/", async (req, res, next) => {
  try {
    const clientId = req.query.clientId ? Number(req.query.clientId) : null;
    const params = [];
    let where = "";
    if (Number.isFinite(clientId)) {
      where = "WHERE p.client_id = $1";
      params.push(clientId);
    }
    const result = await query(
      `SELECT p.id,
              p.name,
              p.description,
              p.status,
              p.priority,
              p.due_date,
              p.client_id,
              c.name AS client_name,
              p.created_at,
              (SELECT COUNT(*)::int FROM assets a WHERE a.project_id = p.id) AS asset_count
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
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
 * POST /api/projects
 *
 * Create a new project. Requires manager or admin.
 */
router.post("/", requireRole(["admin", "manager", "super_admin"]), async (req, res, next) => {
  try {
    const { clientId, name, description, priority, dueDate, status } = req.body ?? {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
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
    const statusVal =
      status != null && typeof status === "string" && status.trim() ? status.trim() : "Active";
    const result = await query(
      `INSERT INTO projects (client_id, name, description, priority, due_date, created_by_user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, client_id, name, description, status, priority, due_date, created_at`,
      [
        client_id,
        name.trim(),
        description ?? null,
        priority ?? null,
        dueDate ?? null,
        parseAuthUserId(req),
        statusVal
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/activity
 *
 * Append-only project timeline (status changes, etc.). Manager, admin, or super_admin.
 */
router.get(
  "/:projectId/activity",
  requireRole(["super_admin", "admin", "manager"]),
  async (req, res, next) => {
    try {
      const projectId = Number(req.params.projectId);
      if (!Number.isFinite(projectId)) {
        return res.status(400).json({ error: "Invalid project id" });
      }
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const rows = await listProjectActivity(projectId, { limit });
      return res.json(rows);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * PATCH /api/projects/:projectId
 *
 * Update project metadata. Admin or manager.
 */
router.patch("/:projectId", requireRole(["admin", "manager", "super_admin"]), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const { name, description, status, priority, dueDate, clientId } = req.body ?? {};
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (status !== undefined) patch.status = status;
    if (priority !== undefined) patch.priority = priority;
    if (dueDate !== undefined) patch.dueDate = dueDate;
    if (clientId !== undefined) patch.clientId = clientId;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await updateProjectById(projectId, patch);
    if (!updated) {
      return res.status(404).json({ error: "Project not found" });
    }

    const clientJoin = await query(
      `SELECT c.name AS client_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.id = $1`,
      [projectId]
    );
    res.json({
      ...updated,
      client_name: clientJoin.rows[0]?.client_name ?? null
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
 *
 * Admin or super_admin. Assets keep project_id NULL (ON DELETE SET NULL).
 */
router.delete("/:projectId", requireRole(["admin", "super_admin"]), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
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
 *
 * Project row, linked assets, and distinct contributors (project creator + asset owners).
 */
router.get("/:projectId", async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
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
