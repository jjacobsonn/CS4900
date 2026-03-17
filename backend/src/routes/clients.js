import express from "express";
import { attachRole, requireRole } from "../middleware/roleAuth.js";
import { query } from "../config/database.js";

const router = express.Router();

// Attach role for all client routes
router.use(attachRole);

/**
 * GET /api/clients
 *
 * List all clients.
 */
router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, description, created_at
       FROM clients
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients
 *
 * Create a new client. Requires manager or admin.
 */
router.post("/", requireRole(["admin", "manager"]), async (req, res, next) => {
  try {
    const { name, description } = req.body ?? {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }
    const result = await query(
      `INSERT INTO clients (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at`,
      [name.trim(), description ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;

