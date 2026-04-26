/**
 * Admin-only service: overview counts and (future) activity/audit.
 * All callers must be restricted to admin role at the route layer.
 */

import { query } from "../config/database.js";

/**
 * Get asset counts by status for the admin dashboard.
 * Returns { pendingReview, changesRequested, approved } from the assets table.
 */
export async function getOverview() {
  const result = await query(
    `SELECT s.status_name, COUNT(a.id)::int AS count
     FROM asset_status_lookup s
     LEFT JOIN assets a ON a.status_id = s.id
     GROUP BY s.id, s.status_name`
  );

  const counts = { pendingReview: 0, changesRequested: 0, approved: 0 };
  for (const row of result.rows) {
    const name = (row.status_name || "").trim();
    if (name === "In Review") counts.pendingReview = row.count;
    else if (name === "Changes Requested") counts.changesRequested = row.count;
    else if (name === "Approved") counts.approved = row.count;
  }
  return counts;
}

const ACTIVITY_LIMIT = 20;

/**
 * Get recent activity for admin: last updated assets and last comments.
 * Gives admin visibility into "all important data" without scanning everything.
 */
export async function getActivity(organizationId = null) {
  const scoped = organizationId != null && Number.isFinite(Number(organizationId));
  const assetWhere = scoped ? "WHERE p.organization_id = $2" : "";
  const commentWhere = scoped ? "WHERE p.organization_id = $2" : "";
  const params = scoped ? [ACTIVITY_LIMIT, Number(organizationId)] : [ACTIVITY_LIMIT];
  const [assetsResult, commentsResult] = await Promise.all([
    query(
      `SELECT a.id, a.title, a.updated_at, s.status_name AS status,
              COALESCE(u.display_name, u.email, 'Unassigned') AS owner
       FROM assets a
       JOIN asset_status_lookup s ON s.id = a.status_id
       LEFT JOIN users u ON u.id = a.created_by_user_id
       LEFT JOIN projects p ON p.id = a.project_id
       ${assetWhere}
       ORDER BY a.updated_at DESC
       LIMIT $1`,
      params
    ),
    query(
      `SELECT c.id, c.asset_id, c.message, c.created_at,
              COALESCE(u.display_name, u.email, 'Unknown') AS author,
              a.title AS asset_title
       FROM asset_comments c
       LEFT JOIN users u ON u.id = c.author_user_id
       JOIN assets a ON a.id = c.asset_id
       LEFT JOIN projects p ON p.id = a.project_id
       ${commentWhere}
       ORDER BY c.created_at DESC
       LIMIT $1`,
      params
    )
  ]);

  return {
    recentAssets: assetsResult.rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      owner: r.owner,
      updatedAt: r.updated_at
    })),
    recentComments: commentsResult.rows.map((r) => ({
      id: r.id,
      assetId: r.asset_id,
      assetTitle: r.asset_title,
      message: r.message,
      author: r.author,
      createdAt: r.created_at
    }))
  };
}
