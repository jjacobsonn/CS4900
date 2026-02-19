import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAsset, patchAssetStatus } from "../api/assets";
import { addComment, getComments } from "../api/comments";
import { Asset, Comment, Version } from "../types/models";
import { CommentList } from "../components/CommentList";
import { StatusBadge } from "../components/StatusBadge";
import { VersionList } from "../components/VersionList";

type Tab = "comments" | "versions";

export function AssetDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [commentInput, setCommentInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Versions are currently derived from the loaded asset until a dedicated versions API is wired.
  const versions = useMemo<Version[]>(() => {
    if (!asset) return [];
    return [
      {
        id: `${asset.id}-v1`,
        assetId: String(asset.id),
        versionNumber: asset.currentVersion || "v1",
        createdAt: asset.updatedAt,
        status: asset.status
      }
    ];
  }, [asset]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getAsset(id), getComments(id)])
      .then(([assetData, commentRows]) => {
        setAsset(assetData);
        setComments(
          commentRows.map((row) => ({
            id: String(row.id),
            assetId: String(row.asset_id),
            author: row.author || "Frontend User",
            message: row.message,
            createdAt: row.created_at
          }))
        );
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
    const row = await addComment(id, { message: commentInput.trim(), commentType: "General" });
    setComments((prev) => [
      ...prev,
      {
        id: String(row.id),
        assetId: String(row.asset_id),
        author: "Frontend User",
        message: row.message,
        createdAt: row.created_at
      }
    ]);
    setCommentInput("");
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
        {activeTab === "versions" && <VersionList versions={versions} />}
      </div>
    </section>
  );
}
