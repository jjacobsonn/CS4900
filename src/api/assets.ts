import { apiClient } from "./client";
import { Asset, AssetStatus } from "../types/models";

interface CreateAssetPayload {
  name: string;
  notes?: string;
}

export async function getAssets(): Promise<Asset[]> {
  return apiClient.get<Asset[]>("/assets");
}

export async function getAsset(id: string): Promise<Asset> {
  return apiClient.get<Asset>(`/assets/${id}`);
}

export async function createAsset(payload: CreateAssetPayload): Promise<Asset> {
  return apiClient.post<Asset>("/assets", payload);
}

async function updateAssetStatus(id: string, status: AssetStatus): Promise<Asset> {
  return apiClient.put<Asset>(`/assets/${id}/status`, { status });
}

export function approveAsset(id: string): Promise<Asset> {
  return updateAssetStatus(id, "approved");
}

export function requestChangesAsset(id: string): Promise<Asset> {
  return updateAssetStatus(id, "changes_requested");
}
