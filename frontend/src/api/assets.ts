import { apiClient } from "./client";
import { Asset } from "../types/models";

// Raw API payload shape returned by backend /api/assets endpoints.
interface RawAsset {
  id: number;
  title: string;
  description?: string;
  status: string;
  owner?: string;
  current_version?: string;
  currentVersion?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

function normalizeStatus(status: string | undefined): Asset["status"] {
  // Normalize legacy or mock status variants into the UI's canonical status labels.
  const value = (status || "").trim().toLowerCase();

  if (value === "draft") return "Draft";
  if (value === "in review" || value === "pending_review" || value === "pending") return "In Review";
  if (value === "approved") return "Approved";
  if (value === "changes requested" || value === "changes_requested") return "Changes Requested";

  return "Draft";
}

// Maps backend fields to frontend view model used by pages/components.
function toAsset(raw: RawAsset): Asset {
  return {
    id: raw.id,
    name: raw.title,
    owner: raw.owner ?? "Unassigned",
    status: normalizeStatus(raw.status),
    updatedAt: raw.updated_at ?? raw.updatedAt ?? raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    currentVersion: raw.current_version ?? raw.currentVersion ?? "v1.0",
    notes: raw.description
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

export async function createAsset(payload: { title: string; description?: string }): Promise<Asset> {
  const data = await apiClient.post<RawAsset>("/assets", payload);
  return toAsset(data);
}

export async function patchAssetStatus(id: string, status: string): Promise<Asset> {
  const data = await apiClient.patch<RawAsset>(`/assets/${id}/status`, { status });
  return toAsset(data);
}
