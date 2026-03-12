import { FormEvent, useState } from "react";
import { createAsset } from "../api/assets";
import { Role, canAccessUpload } from "../utils/permissions";
import type { AuthUser } from "../App";

export function UploadPage({ role, currentUser }: { role: Role; currentUser: AuthUser | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUpload = canAccessUpload(role);
  const allowedTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf"
  ]);

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
    if (!allowedTypes.has(file.type)) {
      setError("Unsupported file type. Use PNG, JPG, WEBP, GIF, or PDF.");
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
        createdByUserId: currentUser?.id,
        file
      });
      setSuccess(`Uploaded ${file.name}`);
      setFile(null);
      setTitle("");
      setNotes("");
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
            accept=".png,.jpg,.jpeg,.webp,.gif,.pdf"
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
