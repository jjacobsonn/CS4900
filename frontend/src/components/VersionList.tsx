import { Version } from "../types/models";
import { formatDate } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

export function VersionList({ versions }: { versions: Version[] }) {
  if (versions.length === 0) {
    return <p>No versions available.</p>;
  }

  return (
    <ul className="version-list">
      {versions.map((version) => (
        <li key={version.id}>
          <strong>{version.versionNumber}</strong>
          <span>{formatDate(version.createdAt)}</span>
          {version.fileUrl && version.fileName ? (
            <a href={version.fileUrl} target="_blank" rel="noreferrer">
              {version.fileName}
            </a>
          ) : null}
          <StatusBadge status={version.status} />
        </li>
      ))}
    </ul>
  );
}
