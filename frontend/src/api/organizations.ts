import { apiClient } from "./client";
import type { Organization, OrganizationMemberRow } from "../types/models";

interface RawOrganization {
  id: number;
  name: string;
  description?: string | null;
  details?: string | null;
  created_by_user_id?: number | null;
  membership_role?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawMember {
  organization_id: number;
  user_id: number;
  role: string;
  email: string;
  display_name: string;
  created_at?: string;
}

function toOrganization(raw: RawOrganization): Organization {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    details: raw.details ?? undefined,
    createdByUserId: raw.created_by_user_id ?? undefined,
    membershipRole: raw.membership_role ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at
  };
}

function toMember(raw: RawMember): OrganizationMemberRow {
  return {
    organizationId: raw.organization_id,
    userId: raw.user_id,
    role: raw.role,
    email: raw.email,
    displayName: raw.display_name,
    createdAt: raw.created_at
  };
}

export async function getOrganizations(): Promise<Organization[]> {
  const data = await apiClient.get<RawOrganization[]>("/organizations");
  return data.map(toOrganization);
}

export async function createOrganization(payload: {
  name: string;
  description?: string;
  details?: string;
  initialOwnerUserId?: number;
}): Promise<Organization> {
  const body: Record<string, unknown> = { name: payload.name.trim() };
  if (payload.description != null && String(payload.description).trim() !== "") {
    body.description = String(payload.description).trim();
  }
  if (payload.details != null && String(payload.details).trim() !== "") {
    body.details = String(payload.details).trim();
  }
  if (payload.initialOwnerUserId != null && Number.isFinite(Number(payload.initialOwnerUserId))) {
    body.initialOwnerUserId = Number(payload.initialOwnerUserId);
  }
  const raw = await apiClient.post<RawOrganization>("/organizations", body);
  return toOrganization(raw);
}

export async function updateOrganization(
  id: number,
  payload: { name?: string; description?: string | null; details?: string | null }
): Promise<Organization> {
  const raw = await apiClient.patch<RawOrganization>(`/organizations/${id}`, payload);
  return toOrganization(raw);
}

export async function getOrganizationMembers(organizationId: number): Promise<OrganizationMemberRow[]> {
  const data = await apiClient.get<RawMember[]>(`/organizations/${organizationId}/members`);
  return data.map(toMember);
}

export async function addOrganizationMember(
  organizationId: number,
  payload: { userId: number; role: string }
): Promise<{ organizationId: number; userId: number; role: string }> {
  return apiClient.post(`/organizations/${organizationId}/members`, {
    userId: payload.userId,
    role: payload.role
  });
}

export async function removeOrganizationMember(organizationId: number, userId: number): Promise<void> {
  await apiClient.delete(`/organizations/${organizationId}/members/${userId}`);
}
