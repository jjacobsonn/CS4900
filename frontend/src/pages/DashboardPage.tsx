import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssets } from "../api/assets";
import { Asset, AssetStatus } from "../types/models";
import { AssetCard } from "../components/AssetCard";

type Filter = "queue" | "all" | AssetStatus;

export function DashboardPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Filter>("queue");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAssets()
      .then((data) => setAssets(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const assetName = (asset.name || "").toString().toLowerCase();
      const matchesSearch = assetName.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "queue"
            ? asset.status === "In Review" || asset.status === "Changes Requested"
            : asset.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  const summary = useMemo(
    () => ({
      inReview: assets.filter((asset) => asset.status === "In Review").length,
      changesRequested: assets.filter((asset) => asset.status === "Changes Requested").length,
      draft: assets.filter((asset) => asset.status === "Draft").length,
      approved: assets.filter((asset) => asset.status === "Approved").length
    }),
    [assets]
  );

  return (
    <section className="page-grid dashboard-page">
      <div className="panel dashboard-summary">
        <h1>Review Queue</h1>
        <div className="dashboard-summary-grid">
          <div className="dashboard-metric">
            <span className="dashboard-metric-label">In Review</span>
            <strong>{summary.inReview}</strong>
          </div>
          <div className="dashboard-metric">
            <span className="dashboard-metric-label">Changes Requested</span>
            <strong>{summary.changesRequested}</strong>
          </div>
          <div className="dashboard-metric">
            <span className="dashboard-metric-label">Draft</span>
            <strong>{summary.draft}</strong>
          </div>
          <div className="dashboard-metric muted">
            <span className="dashboard-metric-label">Approved</span>
            <strong>{summary.approved}</strong>
          </div>
        </div>
      </div>
      <div className="panel dashboard-filters">
        <h1>Filters</h1>
        <div className="dashboard-filter-stack">
          <label className="dashboard-primary-filter">
            Queue Scope
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Filter)}>
              <option value="queue">Needs Review</option>
              <option value="In Review">In Review</option>
              <option value="Changes Requested">Changes Requested</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="all">All Assets</option>
            </select>
          </label>
          <label>
            Search by Title
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets"
            />
          </label>
        </div>
        <p className="dashboard-filter-note">
          Default view shows only assets that still need reviewer attention.
        </p>
      </div>
      <div className="panel dashboard-results">
        <div className="dashboard-results-header">
          <div>
            <h1>Queue Items</h1>
            <p className="dashboard-filter-note">
              {filteredAssets.length} matching asset{filteredAssets.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {loading && <p>Loading assets...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && (
          <div className="asset-grid">
            {filteredAssets.map((asset) => (
              <AssetCard key={String(asset.id)} asset={asset} onOpen={(id) => navigate(`/assets/${id}`)} />
            ))}
            {filteredAssets.length === 0 && <p>No assets found.</p>}
          </div>
        )}
      </div>
    </section>
  );
}
