import { apiClient } from "./client";
import { UserAccount } from "../types/models";
import { Role } from "../utils/permissions";

export function getUsers(): Promise<UserAccount[]> {
  return apiClient.get<UserAccount[]>("/users");
}

export function createUser(payload: {
  email: string;
  role: Role;
  displayName?: string;
}): Promise<UserAccount> {
  return apiClient.post<UserAccount>("/users", payload);
}

export function updateUserRole(id: string, role: Role): Promise<UserAccount> {
  return apiClient.put<UserAccount>(`/users/${id}`, { role });
}

export function updateUserActive(id: string, isActive: boolean): Promise<UserAccount> {
  return apiClient.patch<UserAccount>(`/users/${id}`, { is_active: isActive });
}
