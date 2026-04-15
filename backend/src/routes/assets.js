/**
 * Assets API Routes
 *
 * This module defines RESTful API endpoints for asset review workflows.
 * Role enforcement: upload (POST /) requires designer or admin;
 * status change (PATCH /:id/status) requires reviewer or admin.
 * Client must send X-Vellum-Role header.
 */

import express from "express";
import { attachRole, requireRole } from "../middleware/roleAuth.js";
import {
  addAssetComment,
  createAsset,
  createAssetVersion,
  deleteAssetById,
  deleteAssetCommentById,
  getAssetById,
  listAssetComments,
  listAssets,
  listAssetVersions,
  setAssetOwner,
  updateAssetStatus
} from "../services/assetService.js";

const router = express.Router();

// Attach req.role from X-Vellum-Role for all asset routes
router.use(attachRole);

/**
 * GET /api/assets
 * 
 * Retrieve all assets from the database.
 */
router.get("/", async (_req, res, next) => {
  const start = Date.now();
  try {
    const items = await listAssets();
    const serverTime = Date.now() - start;
    // expose server processing time as a header for client-side measurement
    res.setHeader('X-Server-Time-Ms', String(serverTime));
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// GET /api/assets/summary - return asset counts grouped by status
router.get('/summary', async (_req, res, next) => {
  const start = Date.now();
  try {
    const items = await listAssets();
    const summary = items.reduce((acc, it) => {
      const s = it.status || 'Unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const serverTime = Date.now() - start;
    res.json({ success: true, summary, total: items.length, server_time_ms: serverTime });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assets
 *
 * Create a new asset record. Requires role designer or admin.
 */
router.post("/", requireRole(["designer", "admin"]), async (req, res, next) => {
  try {
    const { title, description, createdByUserId } = req.body ?? {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "title is required" });
    }
    const creatorId = createdByUserId != null ? Number(createdByUserId) : null;
    const created = await createAsset({
      title,
      description,
      createdByUserId: Number.isFinite(creatorId) ? creatorId : null
    });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/assets/:assetId
 * 
 * Retrieve a single asset by asset ID.
 */
router.get("/:assetId", async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    const asset = await getAssetById(assetId);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.json(asset);
  } catch (error) {
    return next(error);
  }
});

/**
 * PATCH /api/assets/:assetId/owner
 *
 * Update the primary owner (created_by_user_id) for an asset. Admin only.
 */
router.patch("/:assetId/owner", requireRole(["admin"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    const { ownerUserId } = req.body ?? {};
    const ownerId = ownerUserId != null ? Number(ownerUserId) : null;
    const updated = await setAssetOwner(assetId, Number.isFinite(ownerId) ? ownerId : null);
    if (!updated) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/assets/:assetId/comments
 * 
 * Create a new comment for the specified asset.
 */
router.post("/:assetId/comments", async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    const { message, commentType, authorUserId } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }
    const authorId = authorUserId != null ? Number(authorUserId) : null;
    const created = await addAssetComment(assetId, {
      message,
      commentType,
      authorUserId: Number.isFinite(authorId) ? authorId : null
    });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/assets/:assetId/comments
 * 
 * Retrieve all comments for the specified asset.
 */
router.get("/:assetId/comments", async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    const comments = await listAssetComments(assetId);
    return res.json(comments);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/assets/:assetId/comments/:commentId
 *
 * Delete a single comment on an asset. Admin only.
 */
router.delete("/:assetId/comments/:commentId", requireRole(["admin"]), async (req, res, next) => {
  try {
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId)) {
      return res.status(400).json({ error: "Invalid comment id" });
    }
    const deleted = await deleteAssetCommentById(commentId);
    if (!deleted) {
      return res.status(404).json({ error: "Comment not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/assets/:assetId/versions
 *
 * Retrieve all versions for the specified asset.
 */
router.get("/:assetId/versions", async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    const versions = await listAssetVersions(assetId);
    return res.json(versions);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/assets/:assetId/versions
 *
 * Create a new version for an asset. Requires role designer or admin.
 */
router.post("/:assetId/versions", requireRole(["designer", "admin"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    const { label, notes, createdByUserId } = req.body ?? {};
    const creatorId = createdByUserId != null ? Number(createdByUserId) : null;
    const version = await createAssetVersion(assetId, {
      label: typeof label === "string" ? label : undefined,
      notes: typeof notes === "string" ? notes : undefined,
      createdByUserId: Number.isFinite(creatorId) ? creatorId : null
    });
    if (!version) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.status(201).json(version);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/assets/:assetId
 *
 * Delete an asset and its related records. Admin only.
 */
router.delete("/:assetId", requireRole(["admin"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    const deleted = await deleteAssetById(assetId);
    if (!deleted) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

/**
 * PATCH /api/assets/:assetId/status
 *
 * Update asset status (approve / request changes). Requires role reviewer or admin.
 */
router.patch("/:assetId/status", requireRole(["reviewer", "admin"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    const { status } = req.body ?? {};
    if (!status || typeof status !== "string") {
      return res.status(400).json({ error: "status is required" });
    }
    const updated = await updateAssetStatus(assetId, status);
    if (updated?.invalidStatus) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (!updated) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

export default router;
