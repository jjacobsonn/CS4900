import { query } from "../config/database.js";

const ORG_RANK = { REVIEWER: 1, DESIGNER: 2, MANAGER: 3, OWNER: 4 };

/**
 * @param {string} role
 * @returns {number}
 */
export function orgRoleToRank(role) {
  const k = String(role || "").toUpperCase();
  return ORG_RANK[k] ?? 0;
}

/**
 * @param {string} role
 * @returns {boolean}
 */
export function isValidOrgRole(role) {
  return ["OWNER", "MANAGER", "DESIGNER", "REVIEWER"].includes(String(role || "").toUpperCase());
}

/**
 * @param {string} role
 * @returns {string}
 */
export function normalizeOrgRole(role) {
  return String(role || "").toUpperCase();
}

/**
 * @param {string} roleLower
 * @returns {number}
 */
export function jwtGlobalRank(roleLower) {
  const r = String(roleLower || "").toLowerCase();
  if (r === "admin") return 100;
  if (r === "owner") return 4;
  if (r === "manager") return 3;
  if (r === "designer") return 2;
  if (r === "reviewer") return 1;
  return 0;
}

/**
 * @param {number} rank
 * @returns {string}
 */
export function maxRankToJwtRole(rank) {
  if (rank >= 100) return "admin";
  if (rank >= 4) return "owner";
  if (rank >= 3) return "manager";
  if (rank >= 2) return "designer";
  if (rank >= 1) return "reviewer";
  return "reviewer";
}

/**
 * @param {number|string} userId
 * @returns {Promise<number>}
 */
export async function getMaxOrgRoleRankForUser(userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return 0;
  const r = await query(
    `SELECT MAX(
       CASE m.role
         WHEN 'OWNER' THEN 4
         WHEN 'MANAGER' THEN 3
         WHEN 'DESIGNER' THEN 2
         WHEN 'REVIEWER' THEN 1
         ELSE 0
       END)::int AS mx
     FROM organization_members m
     WHERE m.user_id = $1`,
    [uid]
  );
  return Number(r.rows[0]?.mx) || 0;
}

/**
 * JWT role is the higher of global user_roles row and best org membership (admin unchanged).
 *
 * @param {string} globalRoleLower
 * @param {number|string} userId
 * @returns {Promise<string>}
 */
export async function resolveEffectiveJwtRole(globalRoleLower, userId) {
  if (String(globalRoleLower || "").toLowerCase() === "admin") return "admin";
  const g = jwtGlobalRank(globalRoleLower);
  const o = await getMaxOrgRoleRankForUser(userId);
  return maxRankToJwtRole(Math.max(g, o));
}

/**
 * @param {string|null|undefined} roleLower
 * @returns {boolean}
 */
export function isPlatformAdmin(roleLower) {
  return String(roleLower || "").toLowerCase() === "admin";
}

/**
 * @param {number|string} projectId
 * @returns {Promise<number|null>}
 */
export async function getProjectOrganizationId(projectId) {
  const pid = Number(projectId);
  if (!Number.isFinite(pid)) return null;
  const r = await query("SELECT organization_id FROM projects WHERE id = $1 LIMIT 1", [pid]);
  const oid = r.rows[0]?.organization_id;
  return oid != null ? Number(oid) : null;
}

/**
 * @param {number|string} userId
 * @param {number|string} organizationId
 * @returns {Promise<string|null>} UPPERCASE role or null
 */
export async function getOrgMembershipRole(userId, organizationId) {
  const uid = Number(userId);
  const oid = Number(organizationId);
  if (!Number.isFinite(uid) || !Number.isFinite(oid)) return null;
  const r = await query(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
    [oid, uid]
  );
  const role = r.rows[0]?.role;
  return role ? String(role).toUpperCase() : null;
}

/**
 * @param {number|string} userId
 * @param {number|string} projectId
 * @param {string} globalRoleLower
 * @returns {Promise<{ organizationId: number|null, orgRole: string|null }>}
 */
export async function assertProjectMembership(userId, projectId, globalRoleLower) {
  if (isPlatformAdmin(globalRoleLower)) {
    const organizationId = await getProjectOrganizationId(projectId);
    return { organizationId, orgRole: null };
  }
  const organizationId = await getProjectOrganizationId(projectId);
  if (!organizationId) {
    const e = new Error("Project is not linked to an organization");
    e.status = 403;
    throw e;
  }
  const orgRole = await getOrgMembershipRole(userId, organizationId);
  const orgRank = orgRoleToRank(orgRole);
  if (orgRank >= ORG_RANK.MANAGER) {
    return { organizationId, orgRole };
  }
  const projectAssignment = await query(
    `SELECT 1
     FROM project_members pm
     WHERE pm.project_id = $1 AND pm.user_id = $2
     LIMIT 1`,
    [Number(projectId), Number(userId)]
  );
  if (projectAssignment.rows.length === 0) {
    const e = new Error("Forbidden");
    e.status = 403;
    throw e;
  }
  return { organizationId, orgRole };
}

/**
 * @param {number|string} userId
 * @param {number|string} projectId
 * @param {string} globalRoleLower
 * @param {number} minOrgRank
 */
export async function assertProjectMinOrgRank(userId, projectId, globalRoleLower, minOrgRank) {
  const ctx = await assertProjectMembership(userId, projectId, globalRoleLower);
  if (isPlatformAdmin(globalRoleLower)) return ctx;
  if (orgRoleToRank(ctx.orgRole) < minOrgRank) {
    const e = new Error("Forbidden");
    e.status = 403;
    throw e;
  }
  return ctx;
}

/**
 * @param {number|string} userId
 * @param {number|string} organizationId
 * @param {string} globalRoleLower
 * @param {number} minOrgRank
 */
export async function assertOrgMinRank(userId, organizationId, globalRoleLower, minOrgRank) {
  if (isPlatformAdmin(globalRoleLower)) return;
  const role = await getOrgMembershipRole(userId, organizationId);
  if (!role || orgRoleToRank(role) < minOrgRank) {
    const e = new Error("Forbidden");
    e.status = 403;
    throw e;
  }
}

/**
 * @param {number|string} userId
 * @param {number|string} organizationId
 * @param {string} globalRoleLower
 */
export async function assertOrgMember(userId, organizationId, globalRoleLower) {
  await assertOrgMinRank(userId, organizationId, globalRoleLower, 1);
}

/**
 * @param {number|string} userId
 * @param {number|string} assetId
 * @param {string} globalRoleLower
 * @returns {Promise<{ projectId: number|null, organizationId: number|null }>}
 */
export async function assertCanAccessAsset(userId, assetId, globalRoleLower) {
  if (isPlatformAdmin(globalRoleLower)) {
    const r = await query(
      `SELECT a.project_id, p.organization_id
       FROM assets a
       LEFT JOIN projects p ON p.id = a.project_id
       WHERE a.id = $1 LIMIT 1`,
      [Number(assetId)]
    );
    const row = r.rows[0];
    return {
      projectId: row?.project_id != null ? Number(row.project_id) : null,
      organizationId: row?.organization_id != null ? Number(row.organization_id) : null
    };
  }

  const r = await query(
    `SELECT a.project_id, a.created_by_user_id, p.organization_id
     FROM assets a
     LEFT JOIN projects p ON p.id = a.project_id
     WHERE a.id = $1 LIMIT 1`,
    [Number(assetId)]
  );
  const row = r.rows[0];
  if (!row) {
    const e = new Error("Asset not found");
    e.status = 404;
    throw e;
  }
  const projectId = row.project_id != null ? Number(row.project_id) : null;
  const organizationId = row.organization_id != null ? Number(row.organization_id) : null;
  const uid = Number(userId);

  if (!projectId) {
    if (Number(row.created_by_user_id) === uid) {
      return { projectId: null, organizationId: null };
    }
    const e = new Error("Forbidden");
    e.status = 403;
    throw e;
  }

  await assertProjectMembership(uid, projectId, globalRoleLower);
  return { projectId, organizationId };
}

/**
 * @param {{ name: string, description?: string|null, details?: string|null, createdByUserId: number|null, initialOwnerUserId?: number|null }}
 */
export async function createOrganization({ name, description, details, createdByUserId, initialOwnerUserId }) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    const e = new Error("name is required");
    e.status = 400;
    throw e;
  }

  const ownerId = initialOwnerUserId != null ? Number(initialOwnerUserId) : createdByUserId;
  if (!Number.isFinite(ownerId)) {
    const e = new Error("initialOwnerUserId or authenticated user required");
    e.status = 400;
    throw e;
  }

  const ucheck = await query("SELECT id FROM users WHERE id = $1 AND COALESCE(is_active, TRUE) = TRUE LIMIT 1", [ownerId]);
  if (ucheck.rows.length === 0) {
    const e = new Error("Owner user not found or inactive");
    e.status = 400;
    throw e;
  }

  const ins = await query(
    `INSERT INTO organizations (name, description, details, created_by_user_id, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING id, name, description, details, is_active, created_by_user_id, created_at, updated_at`,
    [trimmed, description ?? null, details ?? null, createdByUserId]
  );
  const org = ins.rows[0];
  await query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1, $2, 'OWNER')
     ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [org.id, ownerId]
  );
  return org;
}

/**
 * @param {number|string} actorUserId
 * @param {string} actorGlobalRole
 */
export async function listOrganizationsForActor(actorUserId, actorGlobalRole) {
  if (isPlatformAdmin(actorGlobalRole)) {
    const r = await query(
      `SELECT o.id, o.name, o.description, o.details, o.is_active, o.created_by_user_id, o.created_at, o.updated_at
       FROM organizations o
       ORDER BY o.created_at DESC`
    );
    return r.rows;
  }
  const uid = Number(actorUserId);
  const r = await query(
    `SELECT o.id, o.name, o.description, o.details, o.is_active, o.created_by_user_id, o.created_at, o.updated_at,
            m.role AS membership_role
     FROM organizations o
     INNER JOIN organization_members m ON m.organization_id = o.id
     WHERE m.user_id = $1
       AND o.is_active = TRUE
     ORDER BY o.created_at DESC`,
    [uid]
  );
  return r.rows;
}

/**
 * @param {number|string} orgId
 * @param {number|string} actorUserId
 * @param {string} actorGlobalRole
 */
export async function getOrganizationByIdForActor(orgId, actorUserId, actorGlobalRole) {
  const oid = Number(orgId);
  if (!Number.isFinite(oid)) return null;
  if (isPlatformAdmin(actorGlobalRole)) {
    const r = await query(
      `SELECT id, name, description, details, is_active, created_by_user_id, created_at, updated_at
       FROM organizations WHERE id = $1 LIMIT 1`,
      [oid]
    );
    return r.rows[0] ?? null;
  }
  const r = await query(
    `SELECT o.id, o.name, o.description, o.details, o.is_active, o.created_by_user_id, o.created_at, o.updated_at,
            m.role AS membership_role
     FROM organizations o
     INNER JOIN organization_members m ON m.organization_id = o.id AND m.user_id = $2
     WHERE o.id = $1 AND o.is_active = TRUE LIMIT 1`,
    [oid, Number(actorUserId)]
  );
  return r.rows[0] ?? null;
}

/**
 * @param {number|string} orgId
 * @param {{ name?: string, description?: string|null, details?: string|null }} patch
 * @param {number|string} actorUserId
 * @param {string} actorGlobalRole
 */
export async function updateOrganizationById(orgId, patch, actorUserId, actorGlobalRole) {
  const oid = Number(orgId);
  if (!Number.isFinite(oid)) return null;

  if (!isPlatformAdmin(actorGlobalRole)) {
    await assertOrgMinRank(actorUserId, oid, actorGlobalRole, ORG_RANK.OWNER);
  }

  const cur = await query("SELECT * FROM organizations WHERE id = $1 LIMIT 1", [oid]);
  if (cur.rows.length === 0) return null;
  const row = cur.rows[0];
  const name = patch.name !== undefined ? String(patch.name).trim() : row.name;
  if (!name) {
    const e = new Error("name cannot be empty");
    e.status = 400;
    throw e;
  }
  const description = patch.description !== undefined ? patch.description : row.description;
  const details = patch.details !== undefined ? patch.details : row.details;

  const r = await query(
    `UPDATE organizations
     SET name = $1, description = $2, details = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING id, name, description, details, is_active, created_by_user_id, created_at, updated_at`,
    [name, description ?? null, details ?? null, oid]
  );
  return r.rows[0] ?? null;
}

/**
 * @param {number|string} orgId
 * @param {boolean} isActive
 */
export async function setOrganizationActiveById(orgId, isActive) {
  const oid = Number(orgId);
  if (!Number.isFinite(oid)) return null;
  const r = await query(
    `UPDATE organizations
     SET is_active = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, name, description, details, is_active, created_by_user_id, created_at, updated_at`,
    [Boolean(isActive), oid]
  );
  return r.rows[0] ?? null;
}

/**
 * @param {number|string} orgId
 */
export async function deleteOrganizationById(orgId) {
  const oid = Number(orgId);
  if (!Number.isFinite(oid)) return false;
  const d = await query("DELETE FROM organizations WHERE id = $1 RETURNING id", [oid]);
  return d.rows.length > 0;
}

/**
 * @param {number|string} orgId
 */
export async function listOrganizationMembers(orgId) {
  const oid = Number(orgId);
  const r = await query(
    `SELECT m.organization_id, m.user_id, m.role, m.created_at,
            u.email,
            COALESCE(u.display_name, u.email) AS display_name
     FROM organization_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = $1
     ORDER BY u.email ASC`,
    [oid]
  );
  return r.rows;
}

/**
 * @param {number|string} orgId
 * @param {number|string} targetUserId
 * @param {string} roleUpper
 * @param {number|string} actorUserId
 * @param {string} actorGlobalRole
 */
export async function addOrUpdateOrganizationMember(orgId, targetUserId, roleUpper, actorUserId, actorGlobalRole) {
  const oid = Number(orgId);
  const tid = Number(targetUserId);
  const norm = normalizeOrgRole(roleUpper);
  if (!isValidOrgRole(norm)) {
    const e = new Error("Invalid organization role");
    e.status = 400;
    throw e;
  }

  const targetRank = orgRoleToRank(norm);

  if (isPlatformAdmin(actorGlobalRole)) {
    // no extra checks
  } else {
    const actorRole = await getOrgMembershipRole(actorUserId, oid);
    if (!actorRole) {
      const e = new Error("Forbidden");
      e.status = 403;
      throw e;
    }
    const ar = orgRoleToRank(actorRole);
    if (ar < ORG_RANK.MANAGER) {
      const e = new Error("Forbidden");
      e.status = 403;
      throw e;
    }
    if (ar < ORG_RANK.OWNER && targetRank >= ORG_RANK.MANAGER) {
      const e = new Error("Only an organization owner can assign manager or owner roles");
      e.status = 403;
      throw e;
    }
    if (ar === ORG_RANK.MANAGER && targetRank > ORG_RANK.DESIGNER) {
      const e = new Error("Managers can only add designers or reviewers");
      e.status = 403;
      throw e;
    }
  }

  const ucheck = await query("SELECT id FROM users WHERE id = $1 AND COALESCE(is_active, TRUE) = TRUE LIMIT 1", [tid]);
  if (ucheck.rows.length === 0) {
    const e = new Error("User not found or inactive");
    e.status = 400;
    throw e;
  }

  await query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [oid, tid, norm]
  );

  return { organizationId: oid, userId: tid, role: norm };
}

/**
 * @param {number|string} orgId
 * @param {number|string} targetUserId
 * @param {number|string} actorUserId
 * @param {string} actorGlobalRole
 */
export async function removeOrganizationMember(orgId, targetUserId, actorUserId, actorGlobalRole) {
  const oid = Number(orgId);
  const tid = Number(targetUserId);

  const targetRole = await getOrgMembershipRole(tid, oid);
  if (!targetRole) {
    const e = new Error("Member not found");
    e.status = 404;
    throw e;
  }

  if (!isPlatformAdmin(actorGlobalRole)) {
    const actorRole = await getOrgMembershipRole(actorUserId, oid);
    const ar = orgRoleToRank(actorRole);
    if (ar < ORG_RANK.MANAGER) {
      const e = new Error("Forbidden");
      e.status = 403;
      throw e;
    }
    const tr = orgRoleToRank(targetRole);
    if (ar === ORG_RANK.MANAGER) {
      if (tid !== Number(actorUserId) && tr > ORG_RANK.DESIGNER) {
        const e = new Error("Managers may only remove designers and reviewers");
        e.status = 403;
        throw e;
      }
    }
  }

  if (targetRole === "OWNER") {
    const cnt = await query(
      `SELECT COUNT(*)::int AS c FROM organization_members WHERE organization_id = $1 AND role = 'OWNER'`,
      [oid]
    );
    if (Number(cnt.rows[0]?.c) <= 1) {
      const e = new Error("Cannot remove the last organization owner");
      e.status = 400;
      throw e;
    }
  }

  await query(`DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`, [oid, tid]);
  return true;
}
