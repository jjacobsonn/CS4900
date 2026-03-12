import { Asset } from "../types/models";
import { formatDate } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

export function AssetCard({ asset, onOpen }: { asset: Asset; onOpen: (id: string) => void }) {
  const displayName = asset.name || "Untitled Asset";
  const queueLabel =
    asset.status === "Changes Requested"
      ? "Needs revision review"
      : asset.status === "In Review"
        ? "Ready for reviewer approval"
        : asset.status === "Draft"
          ? "Still in draft"
          : "Completed";

  return (
    <article className="asset-card">
      <div className="thumb-placeholder" aria-hidden>
        {asset.thumbnailUrl ? <img src={asset.thumbnailUrl} alt="" /> : "Preview"}
      </div>
      <div className="asset-card-body">
        <h3>{displayName}</h3>
        <p className="asset-card-queue-label">{queueLabel}</p>
        <p>Owner: {asset.owner}</p>
        <p>Updated: {formatDate(asset.updatedAt)}</p>
        <StatusBadge status={asset.status} />
      </div>
      <button type="button" className="primary-btn" onClick={() => onOpen(String(asset.id))}>
        View Asset
      </button>
    </article>
  );
}
