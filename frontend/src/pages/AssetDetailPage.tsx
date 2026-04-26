import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createAssetVersionApi,
  deleteAssetVersion,
  getAsset,
  getAssetActivity,
  getAssetVersions,
  patchAssetStatus,
  patchAssetVersion
} from "../api/assets";
import type { AssetActivityEntry } from "../api/assets";
import { addComment, deleteComment, getComments } from "../api/comments";
import { Asset, Comment, Version } from "../types/models";
import { CommentList } from "../components/CommentList";
import { StatusBadge } from "../components/StatusBadge";
import { sanitizeFileName } from "../utils/format";
import { getWorkflowStatusButtons, isApproveRequestPair } from "../utils/workflowReview";
import { VersionList } from "../components/VersionList";
import type { AuthUser } from "../App";

type Tab = "comments" | "versions";

function timelineStatusClass(status: string | undefined) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isCsvOrSpreadsheet(asset: Pick<Asset, "fileName" | "mimeType">) {
  const mimeType = (asset.mimeType || "").toLowerCase();
  const fileName = (asset.fileName || "").toLowerCase();
  return (
    fileName.endsWith(".csv") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx") ||
    mimeType === "text/csv" ||
    mimeType === "application/csv" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

function supportsInlinePreview(asset: Pick<Asset, "fileName" | "mimeType">) {
  const mimeType = asset.mimeType || "";
  if (!mimeType || isCsvOrSpreadsheet(asset)) return false;
  if (mimeType.startsWith("image/")) return true;
  if (mimeType === "application/pdf") return true;
  if (mimeType.startsWith("text/")) return true;
  if (mimeType.startsWith("audio/")) return true;
  if (mimeType.startsWith("video/")) return true;
  return ["application/json", "application/xml", "application/javascript"].includes(mimeType);
}

function renderAssetPreview(asset: Asset) {
  if (!asset.fileUrl) {
    return <div className="asset-preview empty">No file uploaded yet</div>;
  }

  if (isCsvOrSpreadsheet(asset)) {
    return (
      <div className="asset-preview empty">
        Asset preview unavailable. Use Download file to view it locally.
      </div>
    );
  }

  if (asset.mimeType?.startsWith("image/")) {
    return (
      <div className="asset-preview media-frame">
        <img src={asset.fileUrl} alt={asset.name} className="asset-preview-image" />
      </div>
    );
  }

  if (asset.mimeType === "application/pdf") {
    return (
      <div className="asset-preview media-frame">
        <iframe src={asset.fileUrl} title={`${asset.name} preview`} className="asset-preview-pdf" />
      </div>
    );
  }

  if (asset.mimeType?.startsWith("audio/")) {
    return (
      <div className="asset-preview media-frame">
        <audio controls src={asset.fileUrl} style={{ width: "100%" }} />
      </div>
    );
  }

  if (asset.mimeType?.startsWith("video/")) {
    return (
      <div className="asset-preview media-frame">
        <video controls src={asset.fileUrl} style={{ width: "100%", maxHeight: "28rem" }} />
      </div>
    );
  }

  if (asset.mimeType?.startsWith("text/") || ["application/json", "application/xml", "application/javascript"].includes(asset.mimeType || "")) {
    return (
      <div className="asset-preview media-frame">
        <iframe src={asset.fileUrl} title={`${asset.name} preview`} className="asset-preview-pdf" />
      </div>
    );
  }

  return <div className="asset-preview empty">Asset preview unavailable. Use Download file to view it locally.</div>;
}

export function AssetDetailPage({ currentUser }: { currentUser: AuthUser | null }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [commentInput, setCommentInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [activityEvents, setActivityEvents] = useState<AssetActivityEntry[]>([]);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionLabel, setNewVersionLabel] = useState("");
  const [newVersionNotes, setNewVersionNotes] = useState("");
  const [versionUploading, setVersionUploading] = useState(false);
  const [versionFormKey, setVersionFormKey] = useState(0);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentPosting, setCommentPosting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const assetData = await getAsset(id);

    const [commentRows, versionRows, activityRows] = await Promise.all([
      getComments(id),
      getAssetVersions(id),
      getAssetActivity(id)
    ]);
    setAsset(assetData);
    setComments(
      commentRows.map((row: { id: number; asset_id: number; author?: string; message: string; created_at: string }) => ({
        id: String(row.id),
        assetId: String(row.asset_id),
        author: row.author ?? "Unknown",
        message: row.message,
        createdAt: row.created_at
      }))
    );
    setVersions(
      versionRows.map((v: Version) => ({
        ...v,
        status: assetData.status
      }))
    );
    setActivityEvents(activityRows);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadData()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, currentUser?.role, currentUser?.id]);

  const applyWorkflowStatus = async (statusKey: string) => {
    if (!asset) return;
    setWorkflowError(null);
    setWorkflowBusy(true);
    try {
      const updated = await patchAssetStatus(String(asset.id), statusKey);
      setAsset(updated);
      await loadData();
    } catch (err) {
      setWorkflowError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setWorkflowBusy(false);
    }
  };

  useEffect(() => {
    setWorkflowError(null);
  }, [asset?.id, asset?.backendStatus]);

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !commentInput.trim()) return;
    setCommentError(null);
    setCommentPosting(true);
    try {
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
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Could not post comment.");
    } finally {
      setCommentPosting(false);
    }
  };

  const createNewVersion = async () => {
    if (!asset || !id || !newVersionFile) return;
    setVersionUploading(true);
    try {
      await createAssetVersionApi(id, {
        label: newVersionLabel || undefined,
        notes: newVersionNotes || undefined,
        createdByUserId: currentUser?.id,
        file: newVersionFile
      });
      await loadData();
      setNewVersionFile(null);
      setNewVersionLabel("");
      setNewVersionNotes("");
      setVersionFormKey((k) => k + 1);
    } finally {
      setVersionUploading(false);
    }
  };

  const handleEditVersion = async (
    versionId: string,
    payload: { label?: string; notes?: string; file?: File | null; removeFile?: boolean }
  ) => {
    if (!id || !currentUser?.id) return;
    await patchAssetVersion(id, versionId, { ...payload, performedByUserId: currentUser.id });
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!id || !currentUser?.id) return;
    await deleteAssetVersion(id, versionId, currentUser.id);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    setDeletingCommentId(commentId);
    try {
      await deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } finally {
      setDeletingCommentId(null);
    }
  };

  const isAssetAdmin = useMemo(() => {
    if (!asset || !currentUser) return false;
    return currentUser.role === "admin";
  }, [asset, currentUser]);
  const canDeleteComments = currentUser?.role === "admin" || currentUser?.role === "manager";

  const canEnlargePreview = Boolean(asset?.fileUrl && asset?.mimeType?.startsWith("image/"));
  const canInlinePreview = Boolean(asset?.fileUrl && supportsInlinePreview(asset));

  const workflowButtons = useMemo(
    () => (asset ? getWorkflowStatusButtons(asset.backendStatus, currentUser?.role) : []),
    [asset, currentUser?.role]
  );
  const useWorkflowDropdown = ["reviewer", "manager", "admin"].includes(currentUser?.role ?? "");
  const activityTimeline = useMemo(() => {
    if (!asset) return [];

    const activityVersionIds = new Set(
      activityEvents
        .filter((event) => event.event_type === "version_uploaded" && event.asset_version_id != null)
        .map((event) => String(event.asset_version_id))
    );

    const persistedEntries = activityEvents.map((event) => {
      if (event.event_type === "status_changed") {
        return {
          id: `activity-${event.id}`,
          markerClass: `status ${timelineStatusClass(event.to_status || "")}`,
          at: event.created_at,
          title: "Status changed",
          detail: event.from_status ? `${event.from_status} to ${event.to_status}` : `${event.to_status || "Unknown"}`,
          actor: event.actor ?? "System"
        };
      }

      return {
        id: `activity-${event.id}`,
        markerClass: "version",
        at: event.created_at,
        title: "Version uploaded",
        detail: event.detail || "New version",
        actor: event.actor ?? "Unknown"
      };
    });

    const versionEntries = versions
      .filter((version) => !activityVersionIds.has(String(version.id)))
      .map((version) => ({
      id: `version-${version.id}`,
      markerClass: "version",
      at: version.createdAt,
      title: "Version uploaded",
      detail: `${version.versionNumber}${version.label ? ` (${version.label})` : ""}`,
      actor: version.createdBy ?? "Unknown"
    }));

    const commentEntries = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      markerClass: "comment",
      at: comment.createdAt,
      title: "Comment added",
      detail: comment.message,
      actor: comment.author
    }));

    const hasStatusHistory = activityEvents.some((event) => event.event_type === "status_changed");
    const statusEntry = {
      id: `status-current-${asset.id}`,
      markerClass: `status ${timelineStatusClass(asset.backendStatus || asset.status)}`,
      at: asset.updatedAt,
      title: "Status snapshot",
      detail: `${asset.backendStatus || asset.status}`,
      actor: "System"
    };

    return [
      ...persistedEntries,
      ...versionEntries,
      ...commentEntries,
      ...(hasStatusHistory ? [] : [statusEntry])
    ].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }, [asset, versions, comments, activityEvents]);

  useEffect(() => {
    if (workflowButtons.length === 0) {
      setSelectedWorkflowStatus("");
      return;
    }
    setSelectedWorkflowStatus((prev) =>
      workflowButtons.some((btn) => btn.statusKey === prev) ? prev : workflowButtons[0].statusKey
    );
  }, [workflowButtons]);

  if (loading) return <section className="card panel"><p>Loading asset...</p></section>;
  if (error || !asset) return <section className="card panel"><p role="alert">{error || "Asset not found."}</p></section>;

  return (
    <>
      <section className="page-grid">
        <div className="card panel">
          <button type="button" className="btn btn-outline-secondary asset-back-btn" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            &larr;
          </button>
          <h1>{asset.name}</h1>
          <div
            className={`asset-viewer ${canEnlargePreview ? "clickable" : ""}`}
            role={canEnlargePreview ? "button" : undefined}
            tabIndex={canEnlargePreview ? 0 : -1}
            onClick={() => {
              if (canEnlargePreview) setIsPreviewOpen(true);
            }}
            onKeyDown={(event) => {
              if (canEnlargePreview && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                setIsPreviewOpen(true);
              }
            }}
          >
            {renderAssetPreview(asset)}
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 asset-viewer-actions">
            {canEnlargePreview ? (
              <button type="button" className="btn btn-outline-secondary" onClick={() => setIsPreviewOpen(true)}>
                Enlarge preview
              </button>
            ) : null}
            {canInlinePreview && asset.fileUrl ? (
              <a className="btn btn-outline-secondary file-link-btn asset-open-preview-link" href={asset.fileUrl} target="_blank" rel="noreferrer">
                Open preview in new tab
              </a>
            ) : null}
            {asset.fileUrl ? (
              <a className="btn btn-outline-secondary file-link-btn" href={asset.fileUrl} download={sanitizeFileName(asset.fileName)}>
                Download file
              </a>
            ) : null}
          </div>
          <p>Owner: {asset.owner}</p>
          {asset.projectName != null && asset.projectName !== "" && asset.projectId != null ? (
            <p>
              Project:{" "}
              <Link to={`/dashboard?projectId=${asset.projectId}`}>{asset.projectName}</Link>
            </p>
          ) : null}
          {asset.fileUrl && asset.fileName ? (
            <p>
              Current file:{" "}
              <a href={asset.fileUrl} download={sanitizeFileName(asset.fileName)}>
                {sanitizeFileName(asset.fileName)}
              </a>
            </p>
          ) : null}
          <p>Current version: {asset.currentVersion}</p>
          {asset.notes ? <p>Notes: {asset.notes}</p> : null}
          <p>
            Status: <StatusBadge status={asset.status} />
          </p>
          {workflowButtons.length > 0 ? (
            <div className="d-flex flex-wrap align-items-center gap-2 row-actions asset-workflow-actions">
              {workflowError ? (
                <p role="alert" className="asset-workflow-error">
                  {workflowError}
                </p>
              ) : null}
              {useWorkflowDropdown ? (
                <>
                  <label>
                    Review action
                    <select
                      value={selectedWorkflowStatus}
                      onChange={(event) => setSelectedWorkflowStatus(event.target.value)}
                      disabled={workflowBusy}
                    >
                      {workflowButtons.map((btn) => (
                        <option key={btn.statusKey} value={btn.statusKey}>
                          {btn.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={workflowBusy || !selectedWorkflowStatus}
                    onClick={() => void applyWorkflowStatus(selectedWorkflowStatus)}
                  >
                    Apply action
                  </button>
                </>
              ) : isApproveRequestPair(workflowButtons) ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={workflowBusy}
                    onClick={() => {
                      const approve = workflowButtons.find((b) => b.statusKey.startsWith("approved_"));
                      if (approve) void applyWorkflowStatus(approve.statusKey);
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={workflowBusy}
                    onClick={() => {
                      const req = workflowButtons.find((b) => b.statusKey.includes("changes_requested"));
                      if (req) void applyWorkflowStatus(req.statusKey);
                    }}
                  >
                    Request changes
                  </button>
                </>
              ) : (
                workflowButtons.map((btn) => (
                  <button
                    key={btn.statusKey}
                    type="button"
                    className={btn.variant === "primary" ? "btn btn-primary" : "btn btn-outline-secondary"}
                    disabled={workflowBusy}
                    onClick={() => void applyWorkflowStatus(btn.statusKey)}
                  >
                    {btn.label}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
        <div className="card panel">
          <div className="toolbar tabs nav nav-pills">
            <button type="button" className={`nav-link ${activeTab === "comments" ? "active" : ""}`} onClick={() => setActiveTab("comments")}>
              Comments
            </button>
            <button type="button" className={`nav-link ${activeTab === "versions" ? "active" : ""}`} onClick={() => setActiveTab("versions")}>
              Versions
            </button>
          </div>
          {activeTab === "comments" && (
            <>
              <form className="asset-comment-form" onSubmit={(e) => void submitComment(e)}>
                <label>
                  Add Comment
                  <textarea value={commentInput} onChange={(event) => setCommentInput(event.target.value)} />
                </label>
                {commentError ? (
                  <p role="alert" className="asset-workflow-error">
                    {commentError}
                  </p>
                ) : null}
                <button type="submit" className="btn btn-primary" disabled={commentPosting}>
                  {commentPosting ? "Posting…" : "Post Comment"}
                </button>
              </form>
              <CommentList
                comments={comments}
                isAdmin={canDeleteComments}
                onDeleteComment={canDeleteComments ? handleDeleteComment : undefined}
                deletingCommentId={deletingCommentId}
              />
            </>
          )}
          {activeTab === "versions" && (
            <>
              {(currentUser?.role === "designer" || isAssetAdmin) && (
                <form
                  key={versionFormKey}
                  style={{ marginBottom: "0.6rem", display: "grid", gap: "0.4rem" }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void createNewVersion();
                  }}
                >
                  <label>
                    New version file
                    <input
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setNewVersionFile(file);
                      }}
                      required
                      disabled={versionUploading}
                    />
                  </label>
                  <label>
                    Label (optional milestone tag, e.g. "Client Round 2")
                    <input
                      type="text"
                      value={newVersionLabel}
                      onChange={(event) => setNewVersionLabel(event.target.value)}
                      disabled={versionUploading}
                    />
                  </label>
                  <label>
                    Notes (optional summary of what changed)
                    <textarea
                      value={newVersionNotes}
                      onChange={(event) => setNewVersionNotes(event.target.value)}
                      disabled={versionUploading}
                    />
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={!newVersionFile || versionUploading}>
                    {versionUploading ? "Uploading…" : "Upload new version"}
                  </button>
                </form>
              )}
              <VersionList
                versions={versions}
                currentVersionId={asset.currentVersionId}
                isAdmin={isAssetAdmin}
                onEditVersion={isAssetAdmin ? handleEditVersion : undefined}
                onDeleteVersion={isAssetAdmin ? handleDeleteVersion : undefined}
                onRefresh={loadData}
              />
            </>
          )}
        </div>
      </section>
      <section className="card panel activity-panel">
        <div className="activity-panel-header">
          <h2>Activity Timeline</h2>
          <span className="status-badge">{activityTimeline.length} event{activityTimeline.length === 1 ? "" : "s"}</span>
        </div>
        <p className="dashboard-filter-note activity-summary">
          {versions.length} version{versions.length === 1 ? "" : "s"} · {comments.length} comment
          {comments.length === 1 ? "" : "s"} · {activityTimeline.length} total event
          {activityTimeline.length === 1 ? "" : "s"}
        </p>
        {activityTimeline.length === 0 ? (
          <p>No timeline events yet.</p>
        ) : (
          <ul className="activity-timeline">
            {activityTimeline.map((event) => (
              <li key={event.id} className={`activity-event-${event.markerClass}`}>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
                <div className="version-meta">
                  {new Date(event.at).toLocaleString()} {event.actor ? ` • ${event.actor}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {isPreviewOpen && canEnlargePreview ? (
        <div className="preview-lightbox" onClick={() => setIsPreviewOpen(false)} role="presentation">
          <button type="button" className="preview-lightbox-close" onClick={() => setIsPreviewOpen(false)}>
            Close
          </button>
          <img
            src={asset.fileUrl || ""}
            alt={asset.name}
            className="preview-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
