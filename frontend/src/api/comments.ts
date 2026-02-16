import { apiClient } from "./client";
import { Comment } from "../types/models";

interface AddCommentPayload {
  author: string;
  message: string;
}

export function getComments(assetId: string): Promise<Comment[]> {
  return apiClient.get<Comment[]>(`/assets/${assetId}/comments`);
}

export function addComment(assetId: string, payload: AddCommentPayload): Promise<Comment> {
  return apiClient.post<Comment>(`/assets/${assetId}/comments`, payload);
}
