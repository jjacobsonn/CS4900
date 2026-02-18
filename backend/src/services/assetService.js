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
 * This function inserts a new asset and defaults it to Draft status.
 * 
 * @param {{ title: string, description?: string }} payload - Asset create payload
 * @returns {Promise<Object>} Created asset response object
 */
export async function createAsset(payload) {
  const status = await query(
    "SELECT id FROM asset_status_lookup WHERE status_name = 'Draft' LIMIT 1"
  );
  const statusId = status.rows[0]?.id;
  const result = await query(
    `INSERT INTO assets (title, description, status_id, current_version)
     VALUES ($1, $2, $3, 'v1.0')
     RETURNING id, title, description, status_id, current_version, created_at, updated_at`,
    [payload.title, payload.description ?? null, statusId]
  );
  const created = result.rows[0];
  return {
    id: created.id,
    title: created.title,
    description: created.description,
    owner: "Unassigned",
    current_version: created.current_version,
    status: "Draft",
    createdAt: created.created_at,
    updatedAt: created.updated_at
  };
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
  const inserted = await query(
    `INSERT INTO asset_comments (asset_id, author_user_id, comment_type_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, asset_id, message, created_at`,
    [assetId, payload.authorUserId ?? null, typeId, payload.message]
  );
  return inserted.rows[0];
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
            COALESCE(u.display_name, 'Frontend User') AS author
     FROM asset_comments c
     LEFT JOIN users u ON u.id = c.author_user_id
     WHERE c.asset_id = $1
     ORDER BY c.created_at ASC`,
    [assetId]
  );
  return result.rows;
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
