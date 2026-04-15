import { Asset } from "../types/models";
import { formatDate, statusLabel } from "../utils/format";

export function AssetCard({ asset, onOpen }: { asset: Asset; onOpen: (id: string) => void }) {
  const displayName = asset.name || "Untitled Asset";
  const queueLabel =
    asset.status === "Changes Requested"
      ? "Needs revision review"
      : asset.status === "In Review"
        ? "Ready for reviewer approval"
        : asset.status === "In Progress"
          ? "Work in progress"
          : "Completed";
  const statusClassName = asset.status.toString().toLowerCase().replace(/\s+/g, "_");

  return (
    <article className="asset-card">
      <div className={`thumb-placeholder status-tile ${statusClassName}`} aria-label={`Status: ${statusLabel(asset.status)}`}>
        {statusLabel(asset.status)}
      </div>
      <div className="asset-card-body">
        <h3>{displayName}</h3>
        <p className="asset-card-queue-label">{queueLabel}</p>
        <p>Owner: {asset.owner}</p>
        {asset.projectName ? <p>Project: {asset.projectName}</p> : null}
        <p>Updated: {formatDate(asset.updatedAt)}</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => onOpen(String(asset.id))}>
        View Asset
      </button>
    </article>
  );
}



