import type { Asset } from "../types/models";

/** Maps `asset_status_lookup.status_name` from the API to dashboard / badge buckets. */
export function normalizeWorkflowDisplayStatus(status: string | undefined): Asset["status"] {
  const raw = (status || "").trim();
  const value = raw.toLowerCase();

  if (!value) return "Draft";

  if (value === "in progress") return "In Progress";
  if (value === "ready for internal review" || value === "in internal review") return "In Review";
  if (value === "ready for client review" || value === "in client review") return "In Review";
  if (value === "changes requested (internal)" || value === "client changes requested") {
    return "Changes Requested";
  }
  if (value.includes("changes requested")) return "Changes Requested";
  if (value === "approved (internal)" || value === "approved (client)") return "Approved";

  if (value === "draft") return "Draft";
  if (value === "in review" || value === "pending_review" || value === "pending") return "In Review";
  if (value === "approved") return "Approved";
  if (value === "changes requested" || value === "changes_requested") return "Changes Requested";

  return "Draft";
}
