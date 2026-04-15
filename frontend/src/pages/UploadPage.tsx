import { FormEvent, useState } from "react";
import { createAsset } from "../api/assets";
import { Role, canAccessUpload } from "../utils/permissions";
import type { AuthUser } from "../App";

export function UploadPage({ role, currentUser }: { role: Role; currentUser: AuthUser | null }) {
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const canUpload = canAccessUpload(role);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canUpload) {
      setError("Your role cannot upload assets.");
      return;
    }
    if (!fileName) {
      setError("Please select a file.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    await createAsset({
      title: title.trim(),
      description: notes,
      createdByUserId: currentUser?.id
    });
    setSuccess(`Uploaded ${fileName}`);
    setFileName("");
    setTitle("");
    setNotes("");
  };

  return (
    <section className="panel upload-panel">
      <h1>Upload Asset</h1>
      <form onSubmit={handleSubmit}>
        <div className="upload-dropzone">
          <p>Upload Area</p>
          <small>Click or drag file here</small>
        </div>
        <label>
          File
          <input
            type="file"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              setFileName(selected?.name || "");
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
        <button type="submit" disabled={!canUpload}>
          Submit
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {success && <p>{success}</p>}
    </section>
  );
}
