import { apiClient } from "./client";
import { AdminOverview } from "../types/models";

export function getAdminOverview(): Promise<AdminOverview> {
  return apiClient.get<AdminOverview>("/admin/overview");
}
