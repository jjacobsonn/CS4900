import { apiClient } from "./client";
import type { Role } from "../utils/permissions";

export interface LoginUser {
  id: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: LoginUser;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/auth/login", { email, password });
}

