/**
 * Assets API Routes
 *
 * This module defines RESTful API endpoints for asset review workflows.
 * Client must send Authorization: Bearer <jwt> from POST /api/auth/login.
 */

import express from "express";
import multer from "multer";
import { toStoredAssetFile, uploadAssetFile } from "../config/upload.js";
import { attachAuth, requireAuth, requireRole, parseAuthUserId } from "../middleware/roleAuth.js";
import {
  assertCanAccessAsset,
  assertProjectMinOrgRank,
  isPlatformAdmin
} from "../services/organizationService.js";
import {
  addAssetComment,
  createAsset,
  createAssetVersion,
  deleteAssetById,
  deleteAssetCommentById,
  deleteAssetVersionById,
  getAssetById,
  listAssetComments,
  listAssetsForUser,
  listAssetVersions,
  listVersionAudit,
  setAssetOwner,
  updateAsset,
  updateAssetStatus,
  updateAssetVersion
} from "../services/assetService.js";

const router = express.Router();
const singleAssetUpload = uploadAssetFile.single("file");

const DESIGNER_ORG_RANK = 2;
const MANAGER_ORG_RANK = 3;

router.use(attachAuth);
router.use(requireAuth);

/**
 * @param {import("express").Request} req
 * @param {number} assetId
 */
async function ensureAssetView(req, assetId) {
  const uid = parseAuthUserId(req);
  if (uid == null) {
    const e = new Error("Authentication required");
    e.status = 401;
    throw e;
  }
  return assertCanAccessAsset(uid, assetId, req.role);
}

/**
 * @param {import("express").Request} req
 * @param {number} assetId
 */
async function ensureAssetDesignerWrite(req, assetId) {
  const meta = await ensureAssetView(req, assetId);
  if (!isPlatformAdmin(req.role) && meta.projectId != null) {
    await assertProjectMinOrgRank(parseAuthUserId(req), meta.projectId, req.role, DESIGNER_ORG_RANK);
  }
  return meta;
}

/**
 * @param {import("express").Request} req
 * @param {number} assetId
 */
async function ensureAssetManagerWrite(req, assetId) {
  const meta = await ensureAssetView(req, assetId);
  if (!isPlatformAdmin(req.role) && meta.projectId != null) {
    await assertProjectMinOrgRank(parseAuthUserId(req), meta.projectId, req.role, MANAGER_ORG_RANK);
  }
  return meta;
}

/**
 * GET /api/assets
 */
router.get("/", async (req, res, next) => {
  const start = Date.now();
  try {
    const uid = parseAuthUserId(req);
    const items = await listAssetsForUser(uid, req.role);
    const serverTime = Date.now() - start;
    res.setHeader("X-Server-Time-Ms", String(serverTime));
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/summary", async (req, res, next) => {
  const start = Date.now();
  try {
    const uid = parseAuthUserId(req);
    const items = await listAssetsForUser(uid, req.role);
    const summary = items.reduce((acc, it) => {
      const s = it.status || "Unknown";
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
 */
router.post("/", requireRole(["designer", "manager", "admin", "owner"]), async (req, res, next) => {
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
      const uid = parseAuthUserId(req);
      if (!Number.isFinite(project_id)) {
        if (!isPlatformAdmin(req.role)) {
          return res.status(400).json({ error: "projectId is required" });
        }
      } else if (uid != null) {
        try {
          await assertProjectMinOrgRank(uid, project_id, req.role, DESIGNER_ORG_RANK);
        } catch (err) {
          if (err.status) return res.status(err.status).json({ error: err.message });
          throw err;
        }
      }
      const created = await createAsset({
        title,
        description,
        assetType: typeof assetType === "string" ? assetType : null,
        externalUrl: typeof externalUrl === "string" ? externalUrl : null,
        createdByUserId: uid,
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

router.get("/:assetId", async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetView(req, assetId);
    const asset = await getAssetById(assetId);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.json(asset);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.patch("/:assetId", requireRole(["designer", "manager", "admin", "owner"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetDesignerWrite(req, assetId);
    const { title, description, assetType, externalUrl } = req.body ?? {};
    const updated = await updateAsset(assetId, { title, description, assetType, externalUrl });
    if (!updated) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.json(updated);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.patch("/:assetId/owner", requireRole(["manager", "admin", "owner"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetManagerWrite(req, assetId);
    const { ownerUserId } = req.body ?? {};
    const ownerId = ownerUserId != null ? Number(ownerUserId) : null;
    const updated = await setAssetOwner(assetId, Number.isFinite(ownerId) ? ownerId : null);
    if (!updated) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.json(updated);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.post("/:assetId/comments", async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetView(req, assetId);
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
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.get("/:assetId/comments", async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetView(req, assetId);
    const comments = await listAssetComments(assetId);
    return res.json(comments);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.delete("/:assetId/comments/:commentId", requireRole(["designer", "manager", "admin", "owner"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetDesignerWrite(req, assetId);
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
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.get("/:assetId/version-audit", requireRole(["designer", "manager", "admin", "owner"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetDesignerWrite(req, assetId);
    const entries = await listVersionAudit(assetId);
    return res.json(entries);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.get("/:assetId/versions", async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetView(req, assetId);
    const versions = await listAssetVersions(assetId);
    return res.json(versions);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.post("/:assetId/versions", requireRole(["designer", "manager", "admin", "owner"]), async (req, res, next) => {
  const handleVersionCreate = async () => {
    try {
      const assetId = Number(req.params.assetId);
      if (!Number.isFinite(assetId)) {
        return res.status(400).json({ error: "Invalid asset id" });
      }
      await ensureAssetDesignerWrite(req, assetId);
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
      if (error.status) return res.status(error.status).json({ error: error.message });
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

router.patch("/:assetId/versions/:versionId", requireRole(["designer", "manager", "admin", "owner"]), (req, res, next) => {
  const handleUpdate = async () => {
    try {
      const assetId = Number(req.params.assetId);
      const versionId = Number(req.params.versionId);
      if (!Number.isFinite(assetId) || !Number.isFinite(versionId)) {
        return res.status(400).json({ error: "Invalid asset or version id" });
      }
      await ensureAssetDesignerWrite(req, assetId);
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
      if (error.status) return res.status(error.status).json({ error: error.message });
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

router.delete("/:assetId/versions/:versionId", requireRole(["designer", "manager", "admin", "owner"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    const versionId = Number(req.params.versionId);
    if (!Number.isFinite(assetId) || !Number.isFinite(versionId)) {
      return res.status(400).json({ error: "Invalid asset or version id" });
    }
    await ensureAssetDesignerWrite(req, assetId);
    const result = await deleteAssetVersionById(assetId, versionId);
    if (!result.deleted) {
      return res.status(404).json({ error: "Version not found" });
    }
    return res.status(204).send();
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.delete("/:assetId", requireRole(["designer", "manager", "admin", "owner"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetDesignerWrite(req, assetId);
    const deleted = await deleteAssetById(assetId);
    if (!deleted) {
      return res.status(404).json({ error: "Asset not found" });
    }
    return res.status(204).send();
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.patch("/:assetId/status", requireRole(["designer", "reviewer", "manager", "admin", "owner"]), async (req, res, next) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId)) {
      return res.status(400).json({ error: "Invalid asset id" });
    }
    await ensureAssetView(req, assetId);
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
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

export default router;
