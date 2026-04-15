import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createAssetVersionApi, getAsset, getAssetVersions, patchAssetStatus, updateAssetOwner } from "../api/assets";
import { addComment, getComments } from "../api/comments";
import { Asset, Comment, UserAccount, Version } from "../types/models";
import { getUsers } from "../api/users";
import { CommentList } from "../components/CommentList";
import { StatusBadge } from "../components/StatusBadge";
import { VersionList } from "../components/VersionList";
import type { AuthUser } from "../App";

type Tab = "comments" | "versions";

export function AssetDetailPage({ currentUser }: { currentUser: AuthUser | null }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [commentInput, setCommentInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [ownerCandidates, setOwnerCandidates] = useState<UserAccount[]>([]);
  const [ownerSelectId, setOwnerSelectId] = useState<string | "">("");

  useEffect(() => {
    if (!id) return;
    const promises: Promise<unknown>[] = [getAsset(id), getComments(id), getAssetVersions(id)];
    if (currentUser?.role === "admin") {
      promises.push(getUsers());
    }
    Promise.all(promises)
      .then(([assetData, commentRows, versionRows, usersData]) => {
        setAsset(assetData);
        setComments(
          commentRows.map((row) => ({
            id: String(row.id),
            assetId: String(row.asset_id),
            author: row.author ?? "Unknown",
            message: row.message,
            createdAt: row.created_at
          }))
        );
        setVersions(
          versionRows.map((v) => ({
            ...v,
            // For now, mirror the asset's current status; can be version-specific later.
            status: assetData.status
          }))
        );
        if (currentUser?.role === "admin" && Array.isArray(usersData)) {
          setOwnerCandidates(usersData as UserAccount[]);
          const currentOwner = (usersData as UserAccount[]).find(
            (u) => u.email === assetData.owner || u.displayName === assetData.owner
          );
          setOwnerSelectId(currentOwner?.id ?? "");
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const changeStatus = async (status: "Approved" | "Changes Requested") => {
    if (!asset) return;
    const updated = await patchAssetStatus(String(asset.id), status);
    setAsset(updated);
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !commentInput.trim()) return;
    const authorUserId = currentUser?.id ?? undefined;
    const row = await addComment(id, {
      message: commentInput.trim(),
      commentType: "General",
      authorUserId
    });
    setComments((prev) => [
      ...prev,
      {
        id: String(row.id),
        assetId: String(row.asset_id),
        author: (row as { author?: string }).author ?? currentUser?.email ?? "Unknown",
        message: row.message,
        createdAt: row.created_at
      }
    ]);
    setCommentInput("");
  };

  const createNewVersion = async () => {
    if (!asset || !id) return;
    const label = window.prompt("Optional version label (e.g. 'Round 2')") || undefined;
    await createAssetVersionApi(id, {
      label,
      createdByUserId: currentUser?.id
    });
    // Reload asset + versions so status and list stay in sync
    const [assetData, versionRows] = await Promise.all([getAsset(id), getAssetVersions(id)]);
    setAsset(assetData);
    setVersions(
      versionRows.map((v) => ({
        ...v,
        status: assetData.status
      }))
    );
  };

  const saveOwner = async () => {
    if (!asset || !id) return;
    const nextOwnerId = ownerSelectId || null;
    const updated = await updateAssetOwner(id, nextOwnerId);
    setAsset(updated);
  };

  if (loading) return <section className="panel"><p>Loading asset...</p></section>;
  if (error || !asset) return <section className="panel"><p role="alert">{error || "Asset not found."}</p></section>;

  return (
    <section className="page-grid">
      <div className="panel">
        <button type="button" className="secondary-btn" onClick={() => navigate("/dashboard")}>
          Back
        </button>
        <h1>{asset.name}</h1>
        <div className="asset-preview">Preview Placeholder</div>
        <p>Owner: {asset.owner}</p>
        {currentUser?.role === "admin" && (
          <div style={{ margin: "0.5rem 0 0.75rem" }}>
            <label>
              Assign owner
              <select
                value={ownerSelectId}
                onChange={(event) => setOwnerSelectId(event.target.value)}
              >
                <option value="">Unassigned</option>
                {ownerCandidates.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.email}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="secondary-btn"
              style={{ marginTop: "0.4rem" }}
              onClick={() => void saveOwner()}
            >
              Save owner
            </button>
          </div>
        )}
        <p>Current version: {asset.currentVersion}</p>
        <p>
          Status: <StatusBadge status={asset.status} />
        </p>
        <div className="row-actions">
          <button type="button" className="primary-btn" onClick={() => changeStatus("Approved")}>
            Approve
          </button>
          <button type="button" className="secondary-btn" onClick={() => changeStatus("Changes Requested")}>
            Request Changes
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="toolbar tabs">
          <button type="button" className={activeTab === "comments" ? "active" : ""} onClick={() => setActiveTab("comments")}>
            Comments
          </button>
          <button type="button" className={activeTab === "versions" ? "active" : ""} onClick={() => setActiveTab("versions")}>
            Versions
          </button>
        </div>
        {activeTab === "comments" && (
          <>
            <form onSubmit={submitComment}>
              <label>
                Add Comment
                <textarea value={commentInput} onChange={(event) => setCommentInput(event.target.value)} />
              </label>
              <button type="submit" className="primary-btn">Post Comment</button>
            </form>
            <CommentList comments={comments} />
          </>
        )}
        {activeTab === "versions" && (
          <>
            {(currentUser?.role === "designer" || currentUser?.role === "admin") && (
              <div style={{ marginBottom: "0.6rem" }}>
                <button type="button" className="primary-btn" onClick={() => void createNewVersion()}>
                  Create new version
                </button>
              </div>
            )}
            <VersionList versions={versions} />
          </>
        )}
      </div>
    </section>
  );
}
