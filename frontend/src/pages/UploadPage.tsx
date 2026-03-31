import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createAsset } from "../api/assets";
import { getProjects, Project } from "../api/projects";
import { Role, canAccessUpload } from "../utils/permissions";
import type { AuthUser } from "../App";

export function UploadPage({ role, currentUser }: { role: Role; currentUser: AuthUser | null }) {
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState(() => searchParams.get("projectId") ?? "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectHint, setProjectHint] = useState<string | null>(null);
  const [assetType, setAssetType] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUpload = canAccessUpload(role);

  useEffect(() => {
    const requestedProjectId = (searchParams.get("projectId") ?? "").trim();

    getProjects()
      .then((rows) => {
        setProjects(rows);
        if (!requestedProjectId) return;
        const matches = rows.some((project) => String(project.id) === requestedProjectId);
        if (matches) {
          setProjectId(requestedProjectId);
          setProjectHint(`Uploading into project #${requestedProjectId}.`);
          return;
        }
        setProjectId("");
        setProjectHint(`Project #${requestedProjectId} was not found. Upload will be unlinked unless you choose a project.`);
      })
      .catch(() => {
        setProjects([]);
      })
      .finally(() => setIsLoadingProjects(false));
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canUpload) {
      setError("Your role cannot upload assets.");
      return;
    }
    if (!file) {
      setError("Please select a file.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be 10 MB or smaller.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAsset({
        title: title.trim(),
        description: notes.trim(),
        projectId: projectId || undefined,
        assetType: assetType || undefined,
        externalUrl: externalUrl || undefined,
        createdByUserId: currentUser?.id,
        file
      });
      setSuccess(`Uploaded ${file.name}`);
      setFile(null);
      setTitle("");
      setNotes("");
      setProjectId("");
      setAssetType("");
      setExternalUrl("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel upload-panel">
      <h1>Upload Asset</h1>
      <form onSubmit={handleSubmit}>
        <div className="upload-dropzone">
          <p>Upload Area</p>
          <small>{file ? `${file.name} selected` : "Click to choose a supported file"}</small>
        </div>
        <label>
          File
          <input
            type="file"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              setFile(selected ?? null);
            }}
          />
        </label>
        <label>
          Title
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={isLoadingProjects}>
            <option value="">No project (optional)</option>
            {projects.map((project) => (
              <option key={project.id} value={String(project.id)}>
                #{project.id} - {project.name}
              </option>
            ))}
          </select>
        </label>
        {projectHint && <small>{projectHint}</small>}
        <label>
          Asset Type
          <select value={assetType} onChange={(event) => setAssetType(event.target.value)}>
            <option value="">Select type (optional)</option>
            <option value="image">Image</option>
            <option value="mockup">Mockup</option>
            <option value="figma">Figma</option>
            <option value="brief">Brief</option>
            <option value="spec">Spec</option>
            <option value="document">Document</option>
            <option value="markdown">Markdown</option>
            <option value="code">Code</option>
            <option value="spreadsheet">Spreadsheet</option>
            <option value="dataset">Dataset</option>
            <option value="archive">Archive</option>
            <option value="ticket">Ticket</option>
            <option value="repo">Repo</option>
            <option value="chat">Chat</option>
            <option value="crm">CRM</option>
            <option value="note">Note</option>
            <option value="checklist">Checklist</option>
            <option value="decision">Decision</option>
          </select>
        </label>
        <label>
          External URL
          <input
            type="url"
            value={externalUrl}
            onChange={(event) => setExternalUrl(event.target.value)}
            placeholder="Optional link (Figma, Jira, GitHub, etc.)"
          />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button type="submit" disabled={!canUpload || isSubmitting}>
          {isSubmitting ? "Uploading..." : "Submit"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {success && <p>{success}</p>}
    </section>
  );
}
