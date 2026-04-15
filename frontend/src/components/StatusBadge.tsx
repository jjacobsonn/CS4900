import { AssetStatus } from "../types/models";
import { statusLabel } from "../utils/format";

export function StatusBadge({ status }: { status: AssetStatus }) {
  const className = status.toString().toLowerCase().replace(/\s+/g, "_");
  return <span className={`status-badge ${className}`}>{statusLabel(status)}</span>;
}
