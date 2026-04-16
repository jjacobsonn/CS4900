import { apiClient } from "./client";
import { Asset, Version } from "../types/models";
import { normalizeWorkflowDisplayStatus } from "../utils/assetStatus";

// Raw API payload shape returned by backend /api/assets endpoints.
interface RawAsset {
  id: number;
  title: string;
  description?: string;
  status: string;
  project_id?: number | null;
  project_name?: string | null;
  organization_id?: number | null;
  organization_name?: string | null;
  project_owner_user_id?: number | null;
  owner?: string;
  current_version?: string;
  currentVersion?: string;
  current_version_id?: number | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  file_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
}

// Maps backend fields to frontend view model used by pages/components.
function toAsset(raw: RawAsset): Asset {
  const backendName = (raw.status || "").trim();
  return {
    id: raw.id,
    name: raw.title,
    owner: raw.owner ?? "Unassigned",
    projectId: raw.project_id ?? null,
    projectName: raw.project_name ?? null,
    organizationId: raw.organization_id ?? null,
    organizationName: raw.organization_name ?? null,
    projectOwnerUserId: raw.project_owner_user_id ?? null,
    status: normalizeWorkflowDisplayStatus(raw.status),
    backendStatus: backendName || undefined,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    currentVersion: raw.current_version ?? raw.currentVersion ?? "v1.0",
    currentVersionId: raw.current_version_id ?? undefined,
    notes: raw.description,
    fileUrl: raw.file_url ?? null,
    fileName: raw.file_name ?? null,
    mimeType: raw.mime_type ?? null,
    sizeBytes: raw.size_bytes ?? null
  };
}

export async function getAssets(): Promise<Asset[]> {
  const data = await apiClient.get<RawAsset[]>("/assets");
  return data.map(toAsset);
}

export async function getAsset(id: string): Promise<Asset> {
  const data = await apiClient.get<RawAsset>(`/assets/${id}`);
  return toAsset(data);
}

export async function createAsset(payload: {
  title: string;
  description?: string;
  createdByUserId?: string | number;
  projectId?: string | number;
  assetType?: string;
  externalUrl?: string;
  file?: File;
}): Promise<Asset> {
  const body = new FormData();
  body.set("title", payload.title);
  body.set("description", payload.description ?? "");
  if (payload.createdByUserId != null && String(payload.createdByUserId).trim() !== "") {
    body.set("createdByUserId", String(payload.createdByUserId));
  }
  if (payload.projectId != null && String(payload.projectId).trim() !== "") {
    body.set("projectId", String(payload.projectId).trim());
  }
  if (payload.assetType) {
    body.set("assetType", payload.assetType);
  }
  if (payload.externalUrl) {
    body.set("externalUrl", payload.externalUrl);
  }
  if (payload.file) {
    body.set("file", payload.file);
  }
  const data = await apiClient.post<RawAsset>("/assets", body);
  return toAsset(data);
}

/** `status` must be a backend internal key, e.g. `approved_internal`, `changes_requested_internal`. */
export async function patchAssetStatus(id: string, status: string): Promise<Asset> {
  const data = await apiClient.patch<RawAsset>(`/assets/${id}/status`, { status });
  return toAsset(data);
}

export async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`/assets/${id}`);
}

export async function updateAssetOwner(assetId: string, ownerUserId: string | null): Promise<Asset> {
  const data = await apiClient.patch<RawAsset>(`/assets/${assetId}/owner`, { ownerUserId });
  return toAsset(data);
}

export async function patchAsset(
  assetId: string,
  payload: { title?: string; description?: string }
): Promise<Asset> {
  const data = await apiClient.patch<RawAsset>(`/assets/${assetId}`, payload);
  return toAsset(data);
}

type RawAssetVersion = {
  id: number;
  asset_id: number;
  version_number: number;
  created_at: string;
  created_by?: string;
  label?: string | null;
  notes?: string | null;
  file_url?: string | null;
  original_file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
};

export async function getAssetVersions(assetId: string): Promise<Version[]> {
  const rows = await apiClient.get<RawAssetVersion[]>(`/assets/${assetId}/versions`);
  return rows.map((row) => ({
    id: String(row.id),
    assetId: String(row.asset_id),
    versionNumber: `v${row.version_number}`,
    createdAt: row.created_at,
    createdBy: row.created_by,
    label: row.label ?? undefined,
    notes: row.notes ?? undefined,
    status: "In Review",
    fileUrl: row.file_url ?? null,
    fileName: row.original_file_name ?? null,
    mimeType: row.mime_type ?? null,
    sizeBytes: row.size_bytes ?? null
  }));
}

export async function createAssetVersionApi(
  assetId: string,
  payload: { label?: string; notes?: string; createdByUserId?: string; file?: File }
): Promise<Version> {
  const body =
    payload.file instanceof File
      ? (() => {
          const form = new FormData();
          if (payload.label) form.set("label", payload.label);
          if (payload.notes) form.set("notes", payload.notes);
          if (payload.createdByUserId) form.set("createdByUserId", payload.createdByUserId);
          form.set("file", payload.file);
          return form;
        })()
      : payload;
  const row = await apiClient.post<RawAssetVersion>(`/assets/${assetId}/versions`, body);
  return {
    id: String(row.id),
    assetId: String(row.asset_id),
    versionNumber: `v${row.version_number}`,
    createdAt: row.created_at,
    status: "In Review",
    fileUrl: row.file_url ?? null,
    fileName: row.original_file_name ?? null,
    mimeType: row.mime_type ?? null,
    sizeBytes: row.size_bytes ?? null
  };
}

export interface AssetActivityEntry {
  id: number;
  asset_id: number;
  event_type: "status_changed" | "version_uploaded" | string;
  from_status?: string | null;
  to_status?: string | null;
  asset_version_id?: number | null;
  detail?: string | null;
  created_at: string;
  actor?: string | null;
}

export async function getAssetActivity(assetId: string): Promise<AssetActivityEntry[]> {
  try {
    const data = await apiClient.get<AssetActivityEntry[]>(`/assets/${assetId}/activity`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function patchAssetVersion(
  assetId: string,
  versionId: string,
  payload: {
    label?: string;
    notes?: string;
    performedByUserId?: string;
    file?: File | null;
    removeFile?: boolean;
  }
): Promise<void> {
  if (payload.file != null && payload.file instanceof File) {
    const form = new FormData();
    if (payload.label !== undefined) form.set("label", payload.label);
    if (payload.notes !== undefined) form.set("notes", payload.notes);
    if (payload.performedByUserId !== undefined) form.set("performedByUserId", payload.performedByUserId);
    form.set("file", payload.file);
    await apiClient.patchForm(`/assets/${assetId}/versions/${versionId}`, form);
  } else {
    const body: Record<string, string | boolean> = {};
    if (payload.label !== undefined) body.label = payload.label;
    if (payload.notes !== undefined) body.notes = payload.notes;
    if (payload.performedByUserId !== undefined) body.performedByUserId = payload.performedByUserId;
    if (payload.removeFile === true) body.removeFile = true;
    await apiClient.patch(`/assets/${assetId}/versions/${versionId}`, body);
  }
}

export async function deleteAssetVersion(
  assetId: string,
  versionId: string,
  _performedByUserId?: string
): Promise<void> {
  await apiClient.delete(`/assets/${assetId}/versions/${versionId}`);
}
