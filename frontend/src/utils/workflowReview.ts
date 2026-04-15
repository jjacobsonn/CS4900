import type { Role } from "./permissions";

export type WorkflowStatusButton = {
  statusKey: string;
  label: string;
  variant: "primary" | "secondary";
};

/** Internal or client review decision pair (maps to simple Approve / Request changes UI). */
export function isApproveRequestPair(buttons: WorkflowStatusButton[]): boolean {
  if (buttons.length !== 2) return false;
  const keys = new Set(buttons.map((b) => b.statusKey));
  return (
    (keys.has("approved_internal") && keys.has("changes_requested_internal")) ||
    (keys.has("approved_client") && keys.has("client_changes_requested"))
  );
}

const internalReviewer = (r: Role) => ["reviewer", "manager", "admin", "owner"].includes(r);

const clientActor = (r: Role) => ["reviewer", "manager", "admin", "owner"].includes(r);

const designerLike = (r: Role) => ["designer", "manager", "admin", "owner"].includes(r);

/**
 * Buttons that PATCH `/api/assets/:id/status` with `status: statusKey`.
 * Aligns with `INTERNAL_STATUS_MAP` / `INTERNAL_STATUS_TRANSITIONS` in `backend/src/services/assetService.js`.
 */
export function getWorkflowStatusButtons(
  backendStatus: string | undefined,
  role: Role | null | undefined
): WorkflowStatusButton[] {
  if (!backendStatus?.trim() || !role) return [];
  const n = backendStatus.trim();
  const r = role;

  if ((n === "Ready for Internal Review" || n === "In Internal Review" || n === "In Review") && internalReviewer(r)) {
    return [
      { statusKey: "approved_internal", label: "Approve (internal)", variant: "primary" },
      { statusKey: "changes_requested_internal", label: "Request changes", variant: "secondary" }
    ];
  }

  if (n === "In Client Review" && clientActor(r)) {
    return [
      { statusKey: "approved_client", label: "Approve (client)", variant: "primary" },
      { statusKey: "client_changes_requested", label: "Request client changes", variant: "secondary" }
    ];
  }

  if (n === "In Progress" && designerLike(r)) {
    return [{ statusKey: "ready_for_internal_review", label: "Submit for internal review", variant: "primary" }];
  }

  if ((n === "Changes Requested (Internal)" || n === "Changes Requested") && designerLike(r)) {
    return [
      { statusKey: "ready_for_internal_review", label: "Resubmit for internal review", variant: "primary" },
      { statusKey: "in_progress", label: "Back to in progress", variant: "secondary" }
    ];
  }

  if (n === "Approved (Internal)" && clientActor(r)) {
    return [{ statusKey: "ready_for_client_review", label: "Send to client review", variant: "primary" }];
  }

  if (n === "Ready for Client Review" && clientActor(r)) {
    return [{ statusKey: "in_client_review", label: "Start client review", variant: "primary" }];
  }

  if (n === "Client Changes Requested" && designerLike(r)) {
    return [
      { statusKey: "ready_for_internal_review", label: "Resubmit after client feedback", variant: "primary" }
    ];
  }

  return [];
}

/**
 * @deprecated Use `getWorkflowStatusButtons` for full workflow coverage.
 */
export function getWorkflowReviewActions(
  backendStatus: string | undefined,
  role: Role | null | undefined
): { approveKey: string; requestChangesKey: string } | null {
  const buttons = getWorkflowStatusButtons(backendStatus, role);
  const approve = buttons.find((b) => b.statusKey === "approved_internal" || b.statusKey === "approved_client");
  const request = buttons.find(
    (b) => b.statusKey === "changes_requested_internal" || b.statusKey === "client_changes_requested"
  );
  if (approve && request) {
    return { approveKey: approve.statusKey, requestChangesKey: request.statusKey };
  }
  return null;
}
