import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { approveAsset, getAsset, requestChangesAsset } from "../api/assets";
import { addComment, getComments } from "../api/comments";
import { getVersions, uploadAssetVersion } from "../api/versions";
import { Asset, Comment, Version } from "../types/models";
import { CommentList } from "../components/CommentList";
import { VersionList } from "../components/VersionList";
import { StatusBadge } from "../components/StatusBadge";
import { Role, canAccessUpload, canReview } from "../utils/permissions";

type Tab = "comments" | "versions";

export function AssetDetailPage({ role }: { role: Role }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [versionFileName, setVersionFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reviewEnabled = canReview(role);
  const canUploadRevision = canAccessUpload(role);

  useEffect(() => {
    if (!id) return;
    Promise.all([getAsset(id), getComments(id), getVersions(id)])
      .then(([assetData, commentsData, versionsData]) => {
        setAsset(assetData);
        setComments(commentsData);
        setVersions(versionsData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (nextStatus: "approved" | "changes_requested") => {
    if (!asset || !reviewEnabled) return;
    const response =
      nextStatus === "approved" ? await approveAsset(asset.id) : await requestChangesAsset(asset.id);
    setAsset(response);
  };

  const handleCommentSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !commentInput.trim()) return;
    const newComment = await addComment(id, { author: "Frontend User", message: commentInput.trim() });
    setComments((previous) => [...previous, newComment]);
    setCommentInput("");
  };

  const handleVersionUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !versionFileName || !canUploadRevision) return;
    const nextVersion = await uploadAssetVersion(id, { fileName: versionFileName });
    setVersions((previous) => [nextVersion, ...previous]);
    setAsset((previous) =>
      previous
        ? {
            ...previous,
            currentVersion: nextVersion.versionNumber,
            status: "pending"
          }
        : previous
    );
    setVersionFileName("");
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
          <button type="button" className="primary-btn" disabled={!reviewEnabled} onClick={() => handleStatusChange("approved")}>
            Approve
          </button>
          <button type="button" className="secondary-btn" disabled={!reviewEnabled} onClick={() => handleStatusChange("changes_requested")}>
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
            <form onSubmit={handleCommentSubmit}>
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
            <form onSubmit={handleVersionUpload}>
              <label>
                Upload Revised Version
                <input
                  type="file"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    setVersionFileName(selected?.name || "");
                  }}
                />
              </label>
              <button className="primary-btn" type="submit" disabled={!canUploadRevision}>
                Upload Revision
              </button>
            </form>
            <VersionList versions={versions} />
          </>
        )}
      </div>
    </section>
  );
}
