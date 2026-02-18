import { AssetStatus } from "../types/models";

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
}

export function statusLabel(status: AssetStatus): string {
  return status;
}
