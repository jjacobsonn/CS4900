import { apiClient } from "./client";
import { AdminOverview } from "../types/models";

export function getAdminOverview(): Promise<AdminOverview> {
  return apiClient.get<AdminOverview>("/admin/overview");
}

export interface AdminActivityItem {
  id: number;
  title: string;
  status: string;
  owner: string;
  updatedAt: string;
}

export interface AdminCommentItem {
  id: number;
  assetId: number;
  assetTitle: string;
  message: string;
  author: string;
  createdAt: string;
}

export interface AdminActivity {
  recentAssets: AdminActivityItem[];
  recentComments: AdminCommentItem[];
}

export function getAdminActivity(filter?: { organizationId?: number }): Promise<AdminActivity> {
  const params = new URLSearchParams();
  if (filter?.organizationId != null && Number.isFinite(filter.organizationId)) {
    params.set("organizationId", String(filter.organizationId));
  }
  const query = params.toString();
  return apiClient.get<AdminActivity>(`/admin/activity${query ? `?${query}` : ""}`);
}
