/**
 * Assets API Routes
 * 
 * This module defines RESTful API endpoints for asset review workflows.
 * It demonstrates the complete flow: HTTP Request -> Route -> Service -> Database
 */

import express from "express";
import {
  addAssetComment,
  createAsset,
  getAssetById,
  listAssetComments,
  listAssets,
  updateAssetStatus
} from "../services/assetService.js";

const router = express.Router();

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
 * Create a new asset record.
 */
router.post("/", async (req, res, next) => {
  try {
    const { title, description } = req.body ?? {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "title is required" });
    }
    const created = await createAsset({ title, description });
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
    const created = await addAssetComment(assetId, { message, commentType });
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
 * PATCH /api/assets/:assetId/status
 * 
 * Update asset status using a validated lookup value.
 */
router.patch("/:assetId/status", async (req, res, next) => {
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
