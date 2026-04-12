import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAssets } from "../api/assets";
import { getProjects, type Project } from "../api/projects";
import { Asset, AssetStatus } from "../types/models";
import { AssetCard } from "../components/AssetCard";
import type { Role } from "../utils/permissions";

type Filter = "queue" | "all" | AssetStatus;

function isQueueStatus(status: AssetStatus): boolean {
  if (status === "Changes Requested") return false;
  return status === "Draft" || status === "In Review" || status === "In Progress";
}

export function DashboardPage({ role }: { role: Role }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Filter>(() => (role === "admin" ? "all" : "queue"));
  const [projectFilter, setProjectFilter] = useState(() => (searchParams.get("projectId") ?? "").trim());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = (searchParams.get("projectId") ?? "").trim();
    setProjectFilter(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAssets(), getProjects().catch(() => [] as Project[])])
      .then(([assetRows, projectRows]) => {
        setAssets(assetRows);
        setProjects(Array.isArray(projectRows) ? projectRows : []);
      })
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
            ? isQueueStatus(asset.status)
            : asset.status === statusFilter;
      const matchesProject =
        projectFilter === "" ||
        (asset.projectId != null && String(asset.projectId) === projectFilter);
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [assets, search, statusFilter, projectFilter]);

  const summary = useMemo(
    () => ({
      inReview: assets.filter((asset) => asset.status === "In Review").length,
      changesRequested: assets.filter((asset) => asset.status === "Changes Requested").length,
      draft: assets.filter((asset) => asset.status === "Draft").length,
      approved: assets.filter((asset) => asset.status === "Approved").length
    }),
    [assets]
  );

  const onProjectFilterChange = (value: string) => {
    setProjectFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("projectId", value);
    else next.delete("projectId");
    setSearchParams(next, { replace: true });
  };

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
              <option value="queue">Needs review</option>
              <option value="In Review">In Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Changes Requested">Changes Requested</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="all">All Assets</option>
            </select>
          </label>
          <label>
            Project
            <select value={projectFilter} onChange={(event) => onProjectFilterChange(event.target.value)}>
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  #{p.id} — {p.name}
                </option>
              ))}
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
              <AssetCard key={String(asset.id)} asset={asset} onOpen={(aid) => navigate(`/assets/${aid}`)} />
            ))}
            {filteredAssets.length === 0 && <p>No assets found.</p>}
          </div>
        )}
      </div>
    </section>
  );
}
