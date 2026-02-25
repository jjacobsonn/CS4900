import { apiClient } from "./client";

export function getComments(
  assetId: string
): Promise<Array<{ id: number; asset_id: number; message: string; created_at: string; author?: string }>> {
  return apiClient.get(`/assets/${assetId}/comments`);
}

export function addComment(
  assetId: string,
  payload: { message: string; commentType: string; authorUserId?: string }
): Promise<{ id: number; asset_id: number; message: string; created_at: string; author?: string }> {
  return apiClient.post(`/assets/${assetId}/comments`, payload);
}

export function deleteComment(assetId: string, commentId: string): Promise<void> {
  return apiClient.delete(`/assets/${assetId}/comments/${commentId}`);
}
