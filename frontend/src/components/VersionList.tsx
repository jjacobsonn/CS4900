import { useState } from "react";
import { Version } from "../types/models";
import { formatDate, sanitizeFileName } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

type EditPayload = {
  label?: string;
  notes?: string;
  file?: File | null;
  removeFile?: boolean;
};

type Props = {
  versions: Version[];
  currentVersionId?: string | number;
  isAdmin?: boolean;
  onEditVersion?: (versionId: string, payload: EditPayload) => Promise<void>;
  onDeleteVersion?: (versionId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
};

export function VersionList({
  versions,
  currentVersionId,
  isAdmin,
  onEditVersion,
  onDeleteVersion,
  onRefresh
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEdit = (v: Version) => {
    setEditingId(v.id as string);
    setEditLabel(v.label ?? "");
    setEditNotes(v.notes ?? "");
    setEditFile(null);
    setRemoveAttachment(false);
  };

  const saveEdit = async () => {
    if (!editingId || !onEditVersion || !onRefresh) return;
    setSaving(true);
    try {
      await onEditVersion(editingId, {
        label: editLabel || undefined,
        notes: editNotes || undefined,
        file: editFile || undefined,
        removeFile: removeAttachment || undefined
      });
      await onRefresh();
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!onDeleteVersion || !onRefresh) return;
    const ok = window.confirm("Delete this version? This cannot be undone. The current version will switch to the previous one if needed.");
    if (!ok) return;
    setDeletingId(versionId);
    try {
      await onDeleteVersion(versionId);
      await onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (versions.length === 0) {
    return <p>No versions available.</p>;
  }

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ul className="version-list list-group mt-3">
      {sortedVersions.map((version) => {
        const isCurrent = currentVersionId != null && String(version.id) === String(currentVersionId);
        const isEditing = editingId === version.id;
        const isDeleting = deletingId === version.id;
        const displayFileName = sanitizeFileName(version.fileName);
        return (
          <li key={version.id} className="version-item list-group-item">
            <div className="version-zones">
              <div className="version-info">
                <div className="version-header">
                  <strong className="version-number">{version.versionNumber}</strong>
                  {isCurrent && <span className="badge version-badge current">Current</span>}
                  <StatusBadge status={version.status} />
                </div>
                <div className="version-meta">
                  {formatDate(version.createdAt)}
                  {version.createdBy && (
                    <>
                      <span className="version-meta-sep"> - </span>
                      {version.createdBy}
                    </>
                  )}
                </div>
              </div>
              <div className="version-content">
                {version.fileUrl && displayFileName ? (
                  <a href={version.fileUrl} target="_blank" rel="noreferrer" className="version-file-link">
                    {displayFileName}
                  </a>
                ) : (
                  <span className="version-no-file">No file</span>
                )}
                {version.label ? <p><strong>Label:</strong> {version.label}</p> : null}
                {version.notes ? <p><strong>Change notes:</strong> {version.notes}</p> : null}
              </div>
              {isAdmin && !isEditing && (
                <div className="version-actions">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => startEdit(version)}
                    disabled={!!deletingId}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(version.id as string)}
                    disabled={!!deletingId || isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
            {isEditing && (
              <div className="version-edit-inline">
                <label>
                  Label (milestone tag)
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                  />
                </label>
                <label>
                  Notes (what changed in this version)
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                </label>
                <label>
                  Replace attachment
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setEditFile(f ?? null);
                      if (f) setRemoveAttachment(false);
                    }}
                  />
                </label>
                {(version.fileName || version.fileUrl) && (
                  <label className="version-edit-remove">
                    <input
                      type="checkbox"
                      checked={removeAttachment}
                      onChange={(e) => {
                        setRemoveAttachment(e.target.checked);
                        if (e.target.checked) setEditFile(null);
                      }}
                    />
                    Remove attachment
                  </label>
                )}
                <div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit()} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
