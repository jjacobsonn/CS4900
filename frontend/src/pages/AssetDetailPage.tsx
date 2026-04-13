import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createAssetVersionApi,
  deleteAssetVersion,
  getAsset,
  getAssetVersions,
  getVersionAudit,
  patchAsset,
  patchAssetStatus,
  patchAssetVersion,
  updateAssetOwner
} from "../api/assets";
import { addComment, deleteComment, getComments } from "../api/comments";
import { Asset, Comment, UserAccount, Version } from "../types/models";
import { getUsers } from "../api/users";
import { CommentList } from "../components/CommentList";
import { StatusBadge } from "../components/StatusBadge";
import { sanitizeFileName } from "../utils/format";
import { getWorkflowStatusButtons, isApproveRequestPair } from "../utils/workflowReview";
import { VersionList } from "../components/VersionList";
import type { AuthUser } from "../App";

type Tab = "comments" | "versions";

function supportsInlinePreview(mimeType?: string | null) {
  if (!mimeType) return false;
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

  return <div className="asset-preview empty">Preview unavailable for this file</div>;
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
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionLabel, setNewVersionLabel] = useState("");
  const [newVersionNotes, setNewVersionNotes] = useState("");
  const [versionUploading, setVersionUploading] = useState(false);
  const [versionFormKey, setVersionFormKey] = useState(0);
  const [auditEntries, setAuditEntries] = useState<Array<{ id: number; asset_id: number; asset_version_id: number | null; action: string; performed_at: string; details: string | null; performed_by: string }>>([]);
  const [ownerCandidates, setOwnerCandidates] = useState<UserAccount[]>([]);
  const [ownerSelectId, setOwnerSelectId] = useState<string | "">("");
  const [editAssetOpen, setEditAssetOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [replaceMainFile, setReplaceMainFile] = useState<File | null>(null);
  const [savingAsset, setSavingAsset] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentPosting, setCommentPosting] = useState(false);

  const isStaffAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const loadData = async () => {
    if (!id) return;
    const [assetData, commentRows, versionRows, usersData, auditData] = await Promise.all([
      getAsset(id),
      getComments(id),
      getAssetVersions(id),
      isStaffAdmin ? getUsers() : Promise.resolve(null),
      isStaffAdmin ? getVersionAudit(id) : Promise.resolve([])
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
    if (isStaffAdmin && Array.isArray(usersData)) {
      setOwnerCandidates(usersData as UserAccount[]);
      const currentOwner = (usersData as UserAccount[]).find(
        (u) => u.email === assetData.owner || u.displayName === assetData.owner
      );
      setOwnerSelectId(currentOwner?.id ?? "");
    }
    if (isStaffAdmin && Array.isArray(auditData)) {
      setAuditEntries(auditData);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadData()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, currentUser?.role]);

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

  const saveOwner = async () => {
    if (!asset || !id) return;
    const nextOwnerId = ownerSelectId || null;
    const updated = await updateAssetOwner(id, nextOwnerId);
    setAsset(updated);
  };

  const openEditAsset = () => {
    if (asset) {
      setEditTitle(asset.name);
      setEditNotes(asset.notes ?? "");
      setReplaceMainFile(null);
      setEditAssetOpen(true);
    }
  };

  const saveEditAsset = async () => {
    if (!asset || !id) return;
    setSavingAsset(true);
    try {
      await patchAsset(id, { title: editTitle.trim(), description: editNotes || undefined });
      const nextOwnerId = ownerSelectId || null;
      await updateAssetOwner(id, nextOwnerId);
      if (replaceMainFile && asset.currentVersionId) {
        await patchAssetVersion(id, String(asset.currentVersionId), {
          file: replaceMainFile,
          performedByUserId: currentUser?.id
        });
      }
      await loadData();
      setEditAssetOpen(false);
    } finally {
      setSavingAsset(false);
    }
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

  const canEnlargePreview = Boolean(asset?.fileUrl && asset?.mimeType?.startsWith("image/"));
  const canInlinePreview = Boolean(asset?.fileUrl && supportsInlinePreview(asset?.mimeType));

  const workflowButtons = useMemo(
    () => (asset ? getWorkflowStatusButtons(asset.backendStatus, currentUser?.role) : []),
    [asset, currentUser?.role]
  );

  if (loading) return <section className="panel"><p>Loading asset...</p></section>;
  if (error || !asset) return <section className="panel"><p role="alert">{error || "Asset not found."}</p></section>;

  return (
    <>
      <section className="page-grid">
        <div className="panel">
          <button type="button" className="secondary-btn" onClick={() => navigate("/dashboard")}>
            Back
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
          <div className="asset-viewer-actions">
            {canEnlargePreview ? (
              <button type="button" className="secondary-btn" onClick={() => setIsPreviewOpen(true)}>
                Enlarge preview
              </button>
            ) : null}
            {canInlinePreview && asset.fileUrl ? (
              <a className="secondary-btn file-link-btn" href={asset.fileUrl} target="_blank" rel="noreferrer">
                Open preview in new tab
              </a>
            ) : null}
            {asset.fileUrl ? (
              <a className="secondary-btn file-link-btn" href={asset.fileUrl} target="_blank" rel="noreferrer">
                Open full file
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
              <a href={asset.fileUrl} target="_blank" rel="noreferrer">
                {sanitizeFileName(asset.fileName)}
              </a>
            </p>
          ) : null}
          {isStaffAdmin && (
            <>
              {!editAssetOpen ? (
                <button type="button" className="secondary-btn" style={{ marginTop: "0.5rem" }} onClick={openEditAsset}>
                  Edit asset
                </button>
              ) : (
                <div className="panel edit-asset-panel" style={{ marginTop: "0.75rem", padding: "0.75rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Edit asset</h3>
                  <label>
                    Title
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </label>
                  <label>
                    Description / notes
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                  </label>
                  <label>
                    Owner
                    <select
                      value={ownerSelectId}
                      onChange={(e) => setOwnerSelectId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {ownerCandidates.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName || u.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  {asset.currentVersionId && (
                    <label>
                      Replace preview file (optional)
                      <input
                        type="file"
                        onChange={(e) => setReplaceMainFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button type="button" className="primary-btn" onClick={() => void saveEditAsset()} disabled={savingAsset}>
                      {savingAsset ? "Saving…" : "Save"}
                    </button>
                    <button type="button" className="secondary-btn" onClick={() => { setEditAssetOpen(false); setReplaceMainFile(null); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          <p>Current version: {asset.currentVersion}</p>
          {asset.notes ? <p>Notes: {asset.notes}</p> : null}
          <p>
            Status: <StatusBadge status={asset.status} />
          </p>
          {workflowButtons.length > 0 ? (
            <div className="row-actions asset-workflow-actions">
              {workflowError ? (
                <p role="alert" className="asset-workflow-error">
                  {workflowError}
                </p>
              ) : null}
              {isApproveRequestPair(workflowButtons) ? (
                <>
                  <button
                    type="button"
                    className="primary-btn"
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
                    className="secondary-btn"
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
                    className={btn.variant === "primary" ? "primary-btn" : "secondary-btn"}
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
              <form onSubmit={(e) => void submitComment(e)}>
                <label>
                  Add Comment
                  <textarea value={commentInput} onChange={(event) => setCommentInput(event.target.value)} />
                </label>
                {commentError ? (
                  <p role="alert" className="asset-workflow-error">
                    {commentError}
                  </p>
                ) : null}
                <button type="submit" className="primary-btn" disabled={commentPosting}>
                  {commentPosting ? "Posting…" : "Post Comment"}
                </button>
              </form>
              <CommentList
                comments={comments}
                isAdmin={isStaffAdmin}
                onDeleteComment={isStaffAdmin ? handleDeleteComment : undefined}
                deletingCommentId={deletingCommentId}
              />
            </>
          )}
          {activeTab === "versions" && (
            <>
              {(currentUser?.role === "designer" || isStaffAdmin) && (
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
                    Label (optional)
                    <input
                      type="text"
                      value={newVersionLabel}
                      onChange={(event) => setNewVersionLabel(event.target.value)}
                      disabled={versionUploading}
                    />
                  </label>
                  <label>
                    Notes (optional)
                    <textarea
                      value={newVersionNotes}
                      onChange={(event) => setNewVersionNotes(event.target.value)}
                      disabled={versionUploading}
                    />
                  </label>
                  <button type="submit" className="primary-btn" disabled={!newVersionFile || versionUploading}>
                    {versionUploading ? "Uploading…" : "Upload new version"}
                  </button>
                </form>
              )}
              <VersionList
                versions={versions}
                currentVersionId={asset.currentVersionId}
                isAdmin={isStaffAdmin}
                auditEntries={auditEntries}
                onEditVersion={isStaffAdmin ? handleEditVersion : undefined}
                onDeleteVersion={isStaffAdmin ? handleDeleteVersion : undefined}
                onRefresh={loadData}
              />
            </>
          )}
        </div>
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
