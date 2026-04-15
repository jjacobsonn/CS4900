import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssets } from "../api/assets";
import { Asset, AssetStatus } from "../types/models";
import { AssetCard } from "../components/AssetCard";

type Filter = "all" | AssetStatus;

export function DashboardPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
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
      const matchesStatus = statusFilter === "all" ? true : asset.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  return (
    <section className="page-grid">
      <div className="panel">
        <h1>Assets Requiring Review</h1>
        <div className="toolbar">
          <label>
            Filter
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets"
            />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Filter)}>
              <option value="all">All</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Changes Requested">Changes Requested</option>
            </select>
          </label>
        </div>
      </div>
      <div className="panel">
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
