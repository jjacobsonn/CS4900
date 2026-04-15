import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { deleteAsset, getAssets, patchAsset } from "../api/assets";
import { getProjects, type Project } from "../api/projects";
import { type Asset } from "../types/models";
import { canAccessAdmin, type Role } from "../utils/permissions";
import { statusLabel } from "../utils/format";

export function AssetsPage({ role }: { role: Role }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState(searchParams.get("projectId") ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [editAssetId, setEditAssetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const canManage = role === "manager" || canAccessAdmin(role);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAssets(), getProjects().catch(() => [] as Project[])])
      .then(([assetRows, projectRows]) => {
        setAssets(assetRows);
        setProjects(projectRows);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        a.name.toLowerCase().includes(q) ||
        String(a.owner || "").toLowerCase().includes(q) ||
        String(a.projectName || "").toLowerCase().includes(q);
      const matchesProject = projectFilter === "" || String(a.projectId ?? "") === projectFilter;
      const matchesStatus = statusFilter === "" || a.status === statusFilter;
      return matchesQuery && matchesProject && matchesStatus;
    });
  }, [assets, query, projectFilter, statusFilter]);

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(assets.map((a) => a.status))).sort();
  }, [assets]);

  const onProjectFilterChange = (value: string) => {
    setProjectFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("projectId", value);
    else next.delete("projectId");
    setSearchParams(next, { replace: true });
  };

  const handleDelete = async (assetId: string) => {
    if (!canManage) return;
    const ok = window.confirm("Delete this asset?");
    if (!ok) return;
    try {
      await deleteAsset(assetId);
      setAssets((prev) => prev.filter((a) => String(a.id) !== String(assetId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete asset.");
    }
  };

  const openEditModal = (asset: Asset) => {
    setEditAssetId(String(asset.id));
    setEditTitle(asset.name);
    setEditNotes(asset.notes ?? "");
  };

  const closeEditModal = () => {
    setEditAssetId(null);
    setEditTitle("");
    setEditNotes("");
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!canManage || !editAssetId || !editTitle.trim()) return;
    setSavingEdit(true);
    setError(null);
    try {
      const updated = await patchAsset(editAssetId, {
        title: editTitle.trim(),
        description: editNotes.trim() || ""
      });
      setAssets((prev) =>
        prev.map((a) => {
          if (String(a.id) !== editAssetId) return a;
          return {
            ...a,
            name: updated.name,
            notes: updated.notes
          };
        })
      );
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update asset.");
      setSavingEdit(false);
    }
  };

  return (
    <section className="page-grid assets-page">
      <div className="card panel assets-filter-panel">
        <h1>Assets</h1>
        <div className="toolbar">
          <label>
            Search
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, owner, project" />
          </label>
          <label>
            Project
            <select value={projectFilter} onChange={(e) => onProjectFilterChange(e.target.value)}>
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  #{p.id} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="admin-project-detail-actions assets-action-row">
          <Link className="btn btn-primary file-link-btn" to={projectFilter ? `/upload?projectId=${projectFilter}` : "/upload"}>
            Add asset
          </Link>
        </div>
        {error && <p role="alert" className="admin-error">{error}</p>}
      </div>

      <div className="card panel assets-list-panel">
        <h1>Current Assets</h1>
        {loading ? <p>Loading assets…</p> : null}
        <div className="admin-scroll-table">
          <table className="table table-hover align-middle admin-table compact">
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>No assets found.</td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={String(a.id)}>
                    <td data-label="Title">{a.name}</td>
                    <td data-label="Project">{a.projectName ?? "—"}</td>
                    <td data-label="Status">{statusLabel(a.status)}</td>
                    <td data-label="Owner">{a.owner}</td>
                    <td data-label="Actions" className="d-flex flex-wrap align-items-center gap-2 admin-user-actions">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/assets/${a.id}`)}>
                        Open
                      </button>
                      {canManage ? (
                        <>
                          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => openEditModal(a)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => void handleDelete(String(a.id))}>
                            Remove
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {canManage && editAssetId ? (
        <div className="admin-modal-overlay" role="presentation" onClick={(e) => {
          if (e.target === e.currentTarget) closeEditModal();
        }}>
          <div className="admin-modal" role="dialog" aria-labelledby="assets-edit-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="assets-edit-title" className="admin-section-title" style={{ marginBottom: "0.8rem" }}>
              Edit Asset
            </h2>
            <form
              className="vstack gap-3 admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveEdit();
              }}
            >
              <label>
                Title
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </label>
              <label>
                Notes
                <textarea rows={4} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </label>
              <div className="d-flex flex-wrap align-items-center gap-2 admin-project-detail-actions">
                <button type="submit" className="btn btn-primary" disabled={savingEdit || editTitle.trim() === ""}>
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}



