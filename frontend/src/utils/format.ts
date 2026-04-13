import { AssetStatus } from "../types/models";

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
}

/** Date + time for comments and activity timestamps */
export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function statusLabel(status: AssetStatus): string {
  return status;
}

/** Normalize filename for display: fix Unicode spaces and odd characters. */
export function sanitizeFileName(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "";
  return name
    // Handle known mojibake sequence for narrow no-break space
    .replace(/â¯/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\u2007/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255) || "file";
}
