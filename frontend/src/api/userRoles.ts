/**
 * User Roles API Client
 * 
 * This module demonstrates frontend → backend → database connection.
 * It calls the backend API which queries the PostgreSQL database.
 */

import { apiClient } from "./client";

export interface UserRole {
  id: number;
  role_code: string;
  description: string;
  created_at: string;
}

export interface UserRolesResponse {
  success: boolean;
  data: UserRole[];
  count: number;
}

/**
 * Fetch all user roles from the backend API
 * 
 * This function demonstrates:
 * 1. Frontend making HTTP request to backend
 * 2. Backend querying PostgreSQL database
 * 3. Data flowing back through the stack
 * 
 * @returns Promise<UserRole[]> Array of user roles from database
 */
export async function getUserRoles(): Promise<UserRole[]> {
  const response = await apiClient.get<UserRolesResponse>("/user-roles");
  return response.data;
}
