import type { Role } from "./permissions";

/**
 * Maps current DB workflow status + role to PATCH /assets/:id/status body keys.
 * Aligns with `INTERNAL_STATUS_MAP` / transitions in `backend/src/services/assetService.js`.
 */
export function getWorkflowReviewActions(
  backendStatus: string | undefined,
  role: Role | null | undefined
): { approveKey: string; requestChangesKey: string } | null {
  if (!backendStatus?.trim() || !role) return null;
  const n = backendStatus.trim();

  if (n === "In Internal Review" || n === "In Review") {
    if (!["designer", "reviewer", "manager", "admin"].includes(role)) return null;
    return { approveKey: "approved_internal", requestChangesKey: "changes_requested_internal" };
  }

  if (n === "In Client Review") {
    if (!["client_reviewer", "manager", "admin"].includes(role)) return null;
    return { approveKey: "approved_client", requestChangesKey: "client_changes_requested" };
  }

  return null;
}
