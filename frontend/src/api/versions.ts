import { apiClient } from "./client";
import { Version } from "../types/models";

export function getVersions(assetId: string): Promise<Version[]> {
  return apiClient.get<Version[]>(`/assets/${assetId}/versions`);
}

export function uploadAssetVersion(assetId: string, payload: { fileName: string }): Promise<Version> {
  return apiClient.post<Version>(`/assets/${assetId}/versions`, payload);
}
