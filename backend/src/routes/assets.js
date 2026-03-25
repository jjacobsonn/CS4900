/**
 * Assets API Routes
 *
 * This module defines RESTful API endpoints for asset review workflows.
 * Role enforcement: upload (POST /) requires designer or admin;
 * status change (PATCH /:id/status) requires reviewer or admin.
 * Client must send Authorization: Bearer <jwt> from POST /api/auth/login.
 */

import express from "express";
import multer from "multer";
import { toStoredAssetFile, uploadAssetFile } from "../config/upload.js";
import { attachAuth, requireAuth, requireRole, parseAuthUserId } from "../middleware/roleAuth.js";
import {
  addAssetComment,
  createAsset,
  createAssetVersion,
  deleteAssetById,
  deleteAssetCommentById,
  deleteAssetVersionById,
  getAssetById,
  listAssetComments,
  listAssets,
  listAssetVersions,
  listVersionAudit,
  setAssetOwner,
  updateAsset,
  updateAssetStatus,
  updateAssetVersion
} from "../services/assetService.js";

const router = express.Router();
const singleAssetUpload = uploadAssetFile.single("file");

router.use(attachAuth);
router.use(requireAuth);

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
router.post("/", requireRole(["designer", "manager", "admin", "super_admin"]), async (req, res, next) => {
  const handleCreate = async () => {
    try {
      const { title, description, assetType, externalUrl, projectId } = req.body ?? {};
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "title is required" });
      }
      if (req.is("multipart/form-data") && !req.file) {
        return res.status(400).json({ error: "file is required" });
      }
      const project_id = projectId != null ? Number(projectId) : null;
      const created = await createAsset({
        title,
        description,
        assetType: typeof assetType === "string" ? assetType : null,
        externalUrl: typeof externalUrl === "string" ? externalUrl : null,
        createdByUserId: parseAuthUserId(req),
        projectId: Number.isFinite(project_id) ? project_id : null,
        file: toStoredAssetFile(req.file)
      });
      return res.status(201).json(created);
    } catch (error) {
      return next(error);
    }
  };

  if (req.is("multipart/form-data")) {
    singleAssetUpload(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
      }
      if (error) {
        return res.status(400).json({ error: error.message || "Upload failed" });
      }
      return void handleCreate();
    });
    return;
  }

  return void handleCreate();
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
 * PATCH /api/assets/:assetId
 *
 * Update asset title and/or description. Admin only.
 */
router.patch("/:assetId", requireRole(["designer", "manager", "admin", "super_admin"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    const { title, description, assetType, externalUrl } = req.body ?? {};
    const updated = await updateAsset(assetId, { title, description, assetType, externalUrl });
    if (!updated) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

/**
 * PATCH /api/assets/:assetId/owner
 *
 * Update the primary owner (created_by_user_id) for an asset. Admin only.
 */
router.patch("/:assetId/owner", requireRole(["manager", "admin", "super_admin"]), async (req, res, next) => {
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
    const { message, commentType } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }
    const created = await addAssetComment(assetId, {
      message,
      commentType,
      authorUserId: parseAuthUserId(req)
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
router.delete("/:assetId/comments/:commentId", requireRole(["designer", "manager", "admin", "super_admin"]), async (req, res, next) => {
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
 * GET /api/assets/:assetId/version-audit
 *
 * List audit log for version actions. Admin only.
 */
router.get("/:assetId/version-audit", requireRole(["designer", "manager", "admin", "super_admin"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    const entries = await listVersionAudit(assetId);
    return res.json(entries);
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
router.post("/:assetId/versions", requireRole(["designer", "manager", "admin", "super_admin"]), async (req, res, next) => {
  const handleVersionCreate = async () => {
    try {
      const assetId = Number(req.params.assetId);
      if (!Number.isFinite(assetId)) {
        return res.status(400).json({ error: "Invalid asset id" });
      }
      const { label, notes } = req.body ?? {};
      const version = await createAssetVersion(assetId, {
        label: typeof label === "string" ? label : undefined,
        notes: typeof notes === "string" ? notes : undefined,
        createdByUserId: parseAuthUserId(req),
        file: toStoredAssetFile(req.file)
      });
      if (!version) {
        return res.status(404).json({ error: "Asset not found" });
      }
      return res.status(201).json(version);
    } catch (error) {
      return next(error);
    }
  };

  if (req.is("multipart/form-data")) {
    singleAssetUpload(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
      }
      if (error) {
        return res.status(400).json({ error: error.message || "Upload failed" });
      }
      return void handleVersionCreate();
    });
    return;
  }

  return void handleVersionCreate();
});

/**
 * PATCH /api/assets/:assetId/versions/:versionId
 *
 * Update version metadata and/or replace or remove file. Admin only.
 */
router.patch("/:assetId/versions/:versionId", requireRole(["designer", "manager", "admin", "super_admin"]), (req, res, next) => {
  const handleUpdate = async () => {
    try {
      const assetId = Number(req.params.assetId);
      const versionId = Number(req.params.versionId);
      if (!Number.isFinite(assetId) || !Number.isFinite(versionId)) {
        return res.status(400).json({ error: "Invalid asset or version id" });
      }
      const body = req.body ?? {};
      const label = typeof body.label === "string" ? body.label : undefined;
      const notes = typeof body.notes === "string" ? body.notes : undefined;
      const removeFile = body.removeFile === true || body.removeFile === "true";
      const file = toStoredAssetFile(req.file);
      const updated = await updateAssetVersion(
        assetId,
        versionId,
        { label, notes, file: file || undefined, removeFile: removeFile || undefined },
        parseAuthUserId(req)
      );
      if (!updated) {
        return res.status(404).json({ error: "Version not found" });
      }
      return res.json(updated);
    } catch (error) {
      return next(error);
    }
  };
  if (req.is("multipart/form-data")) {
    singleAssetUpload(req, res, (err) => {
      if (err) return next(err);
      return void handleUpdate();
    });
    return;
  }
  return void handleUpdate();
});

/**
 * DELETE /api/assets/:assetId/versions/:versionId
 *
 * Delete a version. Admin only.
 */
router.delete("/:assetId/versions/:versionId", requireRole(["designer", "manager", "admin", "super_admin"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    const versionId = Number(req.params.versionId);
    if (!Number.isFinite(assetId) || !Number.isFinite(versionId)) {
      return res.status(400).json({ error: "Invalid asset or version id" });
    }
    const result = await deleteAssetVersionById(assetId, versionId);
    if (!result.deleted) {
      return res.status(404).json({ error: "Version not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/assets/:assetId
 *
 * Delete an asset and its related records. Admin only.
 */
router.delete("/:assetId", requireRole(["designer", "manager", "admin", "super_admin"]), async (req, res, next) => {
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
 * Update asset status (internal workflow approve / request changes).
 * Requires role reviewer or admin.
 *
 * Expects a normalized internal status key in the request body, e.g.:
 * { "status": "ready_for_internal_review" }
 */
router.patch("/:assetId/status", requireRole(["designer", "reviewer", "manager", "client_reviewer", "admin", "super_admin"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    const { status } = req.body ?? {};
    if (!status || typeof status !== "string") {
      return res.status(400).json({ error: "status is required" });
    }
    const updated = await updateAssetStatus(assetId, status, req.role, parseAuthUserId(req));
    if (updated?.invalidStatus) {
      return res.status(400).json({
        error: "Invalid status",
        reason: updated.reason ?? "Unknown"
      });
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
