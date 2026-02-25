/**
 * Asset Service
 * 
 * This service demonstrates how to connect to the database and retrieve asset
 * workflow data for Sprint 1 frontend flows.
 * 
 * It provides the service -> database connection pattern for:
 * - asset listing and lookup
 * - status updates
 * - asset comments
 */

import { query } from "../config/database.js";

/**
 * Example API -> DB flow snippet requested in sprint outline:
 * const pool = require('./db/connection');
 * const assets = await pool.query('SELECT * FROM assets;');
 */

/**
 * Get all assets from the database
 * 
 * This function queries the assets table and joins lookup/user data to return
 * display-ready rows for the frontend dashboard.
 * 
 * @returns {Promise<Array>} Array of asset rows with status and owner details
 */
export async function listAssets() {
  const result = await query(
    `SELECT a.id,
            a.title,
            a.description,
            s.status_name AS status,
            a.current_version,
            COALESCE(u.display_name, u.email, 'Unassigned') AS owner,
            a.created_at,
            a.updated_at
     FROM assets a
     JOIN asset_status_lookup s ON s.id = a.status_id
     LEFT JOIN users u ON u.id = a.created_by_user_id
     ORDER BY a.id DESC`
  );
  return result.rows;
}

/**
 * Create a new asset record
 *
 * This function inserts a new asset and defaults it to Draft status. When a
 * createdByUserId is provided, that user is recorded as the asset owner.
 *
 * @param {{ title: string, description?: string, createdByUserId?: number|null }} payload - Asset create payload
 * @returns {Promise<Object>} Created asset response object (raw DB row)
 */
export async function createAsset(payload) {
  const status = await query(
    "SELECT id FROM asset_status_lookup WHERE status_name = 'Draft' LIMIT 1"
  );
  const statusId = status.rows[0]?.id;
  const created = await query(
    `INSERT INTO assets (title, description, status_id, current_version, created_by_user_id)
     VALUES ($1, $2, $3, 'v1.0', $4)
     RETURNING id`,
    [payload.title, payload.description ?? null, statusId, payload.createdByUserId ?? null]
  );
  const row = created.rows[0];
  if (!row) return null;
  // Seed an initial version row for this asset (v1)
  await query(
    `INSERT INTO asset_versions (asset_id, version_number, created_by_user_id)
     VALUES ($1, 1, NULL)`,
    [row.id]
  );
  // Re-load via getAssetById so owner/status fields match list/get endpoints.
  const refreshed = await getAssetById(row.id);
  return refreshed;
}

/**
 * Get a single asset by ID
 * 
 * @param {number} assetId - Asset ID
 * @returns {Promise<Object|null>} Asset row or null if not found
 */
export async function getAssetById(assetId) {
  const result = await query(
    `SELECT a.id,
            a.title,
            a.description,
            s.status_name AS status,
            a.current_version,
            COALESCE(u.display_name, u.email, 'Unassigned') AS owner,
            a.created_at,
            a.updated_at
     FROM assets a
     JOIN asset_status_lookup s ON s.id = a.status_id
     LEFT JOIN users u ON u.id = a.created_by_user_id
     WHERE a.id = $1`,
    [assetId]
  );
  return result.rows[0] ?? null;
}

/**
 * List all versions for a given asset.
 *
 * @param {number} assetId - Asset ID
 * @returns {Promise<Array>} Ordered list of versions (oldest first)
 */
export async function listAssetVersions(assetId) {
  const result = await query(
    `SELECT v.id,
            v.asset_id,
            v.version_number,
            v.created_at,
            COALESCE(u.display_name, u.email, 'Unknown') AS created_by
     FROM asset_versions v
     LEFT JOIN users u ON u.id = v.created_by_user_id
     WHERE v.asset_id = $1
     ORDER BY v.version_number ASC`,
    [assetId]
  );
  return result.rows;
}

/**
 * Delete an asset by id (cascades to comments/versions via FK constraints).
 *
 * @param {number} assetId - Asset ID
 * @returns {Promise<Object|null>} Deleted row id or null if not found
 */
export async function deleteAssetById(assetId) {
  const result = await query("DELETE FROM assets WHERE id = $1 RETURNING id", [assetId]);
  return result.rows[0] ?? null;
}

/**
 * Add a comment to an asset
 * 
 * @param {number} assetId - Asset ID
 * @param {{ message: string, commentType?: string, authorUserId?: number|null }} payload - Comment payload
 * @returns {Promise<Object>} Inserted comment row
 */
export async function addAssetComment(assetId, payload) {
  const commentType = await query(
    "SELECT id FROM comment_type_lookup WHERE type_name = $1 LIMIT 1",
    [payload.commentType ?? "General"]
  );
  const typeId = commentType.rows[0]?.id;
  const authorUserId = payload.authorUserId ?? null;
  const inserted = await query(
    `INSERT INTO asset_comments (asset_id, author_user_id, comment_type_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, asset_id, message, created_at`,
    [assetId, authorUserId, typeId, payload.message]
  );
  const row = inserted.rows[0];
  if (!row) return null;
  let author = "Unknown";
  if (authorUserId) {
    const u = await query(
      "SELECT COALESCE(display_name, email, 'Unknown') AS author FROM users WHERE id = $1",
      [authorUserId]
    );
    author = u.rows[0]?.author ?? "Unknown";
  }
  return { id: row.id, asset_id: row.asset_id, message: row.message, created_at: row.created_at, author };
}

/**
 * Get all comments for a specific asset
 * 
 * @param {number} assetId - Asset ID
 * @returns {Promise<Array>} Ordered list of comments for the asset
 */
export async function listAssetComments(assetId) {
  const result = await query(
    `SELECT c.id, c.asset_id, c.message, c.created_at,
            COALESCE(u.display_name, u.email, 'Unknown') AS author
     FROM asset_comments c
     LEFT JOIN users u ON u.id = c.author_user_id
     WHERE c.asset_id = $1
     ORDER BY c.created_at ASC`,
    [assetId]
  );
  return result.rows;
}

/**
 * Delete a single asset comment by id.
 *
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object|null>} Deleted row id or null if not found
 */
export async function deleteAssetCommentById(commentId) {
  const result = await query("DELETE FROM asset_comments WHERE id = $1 RETURNING id", [commentId]);
  return result.rows[0] ?? null;
}

/**
 * Update the primary owner (created_by_user_id) for an asset.
 *
 * @param {number} assetId - Asset ID
 * @param {number|null} userId - New owner user id, or null to unassign
 * @returns {Promise<Object|null>} Updated asset row or null if not found
 */
export async function setAssetOwner(assetId, userId) {
  const result = await query(
    "UPDATE assets SET created_by_user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
    [userId, assetId]
  );
  if (result.rows.length === 0) return null;
  return getAssetById(assetId);
}

/**
 * Create a new version for an existing asset.
 *
 * This increments the version_number for the asset, creates an asset_versions row,
 * and moves the asset status back to "In Review" so it appears in review queues.
 *
 * @param {number} assetId - Asset ID
 * @param {{ label?: string, notes?: string, createdByUserId?: number|null }} payload
 * @returns {Promise<Object|null>} Newly created version row
 */
export async function createAssetVersion(assetId, payload) {
  // Determine next version number
  const max = await query(
    "SELECT COALESCE(MAX(version_number), 0) AS max_version FROM asset_versions WHERE asset_id = $1",
    [assetId]
  );
  const nextVersion = Number(max.rows[0]?.max_version ?? 0) + 1;

  const inserted = await query(
    `INSERT INTO asset_versions (asset_id, version_number, created_by_user_id, label, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, asset_id, version_number, created_at`,
    [
      assetId,
      nextVersion,
      payload.createdByUserId ?? null,
      payload.label ?? null,
      payload.notes ?? null
    ]
  );
  const row = inserted.rows[0];
  if (!row) return null;

  // Move asset status back to In Review and bump current_version string
  const status = await query(
    "SELECT id FROM asset_status_lookup WHERE status_name = 'In Review' LIMIT 1"
  );
  const statusId = status.rows[0]?.id ?? null;
  if (statusId) {
    await query(
      `UPDATE assets
       SET status_id = $1,
           current_version = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [statusId, `v${nextVersion}.0`, assetId]
    );
  }

  return row;
}

/**
 * Update asset status
 * 
 * This function validates the provided status value against the lookup table
 * before applying the update.
 * 
 * @param {number} assetId - Asset ID
 * @param {string} statusName - New status label
 * @returns {Promise<Object|null|{invalidStatus: boolean}>} Updated asset, null if not found, or invalidStatus marker
 */
export async function updateAssetStatus(assetId, statusName) {
  const valid = await query(
    "SELECT id, status_name FROM asset_status_lookup WHERE status_name = $1",
    [statusName]
  );
  if (valid.rows.length === 0) {
    return { invalidStatus: true };
  }

  const updated = await query(
    `UPDATE assets
     SET status_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id`,
    [valid.rows[0].id, assetId]
  );

  if (updated.rows.length === 0) {
    return null;
  }

  const refreshed = await getAssetById(assetId);
  if (!refreshed) {
    return null;
  }

  return {
    id: refreshed.id,
    title: refreshed.title,
    description: refreshed.description,
    owner: refreshed.owner,
    current_version: refreshed.current_version,
    status: valid.rows[0].status_name,
    updatedAt: refreshed.updated_at
  };
}
