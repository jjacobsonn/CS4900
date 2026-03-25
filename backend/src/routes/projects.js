import express from "express";
import { attachAuth, requireAuth, requireRole, parseAuthUserId } from "../middleware/roleAuth.js";
import { query } from "../config/database.js";
import { listProjectActivity } from "../services/projectActivityService.js";

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
              p.created_at
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
    const { clientId, name, description, priority, dueDate } = req.body ?? {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }
    const client_id = clientId != null ? Number(clientId) : null;
    const result = await query(
      `INSERT INTO projects (client_id, name, description, priority, due_date, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, client_id, name, description, status, priority, due_date, created_at`,
      [
        Number.isFinite(client_id) ? client_id : null,
        name.trim(),
        description ?? null,
        priority ?? null,
        dueDate ?? null,
        parseAuthUserId(req)
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
 * DELETE /api/projects/:projectId
 *
 * Super-admin only: removes project row; assets keep FK policy (typically SET NULL).
 */
router.delete("/:projectId", requireRole(["super_admin"]), async (req, res, next) => {
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
 * Get a single project and basic asset summary for the internal slice.
 */
router.get("/:projectId", async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const projectResult = await query(
      `SELECT p.id,
              p.name,
              p.description,
              p.status,
              p.priority,
              p.due_date,
              p.client_id,
              c.name AS client_name,
              p.created_at
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.id = $1`,
      [projectId]
    );
    const project = projectResult.rows[0];
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const assetsResult = await query(
      `SELECT a.id,
              a.title,
              a.description,
              s.status_name AS status,
              a.current_version,
              a.created_at
       FROM assets a
       JOIN asset_status_lookup s ON s.id = a.status_id
       WHERE a.project_id = $1
       ORDER BY a.created_at DESC`,
      [projectId]
    );

    res.json({
      ...project,
      assets: assetsResult.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;

