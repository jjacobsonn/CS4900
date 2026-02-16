import { AssetStatus } from "../types/models";
import { statusLabel } from "../utils/format";

export function StatusBadge({ status }: { status: AssetStatus }) {
  return <span className={`status-badge ${status}`}>{statusLabel(status)}</span>;
}
