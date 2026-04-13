import { apiClient } from "./client";

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  dueDate?: string | null;
  clientId?: number | null;
  clientName?: string | null;
  organizationId?: number | null;
  organizationName?: string | null;
  /** User id of the organizational project owner */
  ownerUserId?: number | null;
  createdAt?: string;
  assetCount?: number;
}

export interface ProjectContributor {
  id: number;
  email: string;
  displayName: string;
}

export interface ProjectAssetSummary {
  id: number;
  title: string;
  status: string;
  currentVersion: string;
  createdAt: string;
  owner: string;
}

export interface ProjectDetail extends Project {
  assets: ProjectAssetSummary[];
  contributors: ProjectContributor[];
}

interface RawProject {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  due_date?: string | null;
  client_id?: number | null;
  client_name?: string | null;
  organization_id?: number | null;
  organization_name?: string | null;
  owner_user_id?: number | null;
  created_at?: string;
  asset_count?: number;
}

interface RawContributor {
  id: number;
  email: string;
  display_name: string;
}

interface RawAssetSummary {
  id: number;
  title: string;
  status: string;
  current_version: string;
  created_at: string;
  owner: string;
}

function toProject(raw: RawProject): Project {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    status: raw.status,
    priority: raw.priority ?? undefined,
    dueDate: raw.due_date ?? undefined,
    clientId: raw.client_id ?? undefined,
    clientName: raw.client_name ?? undefined,
    organizationId: raw.organization_id ?? undefined,
    organizationName: raw.organization_name ?? undefined,
    ownerUserId: raw.owner_user_id ?? undefined,
    createdAt: raw.created_at,
    assetCount: raw.asset_count ?? undefined
  };
}

function mapProjectDetail(raw: RawProject & { assets?: RawAssetSummary[]; contributors?: RawContributor[] }): ProjectDetail {
  const base = toProject(raw);
  const assets = (raw.assets ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    currentVersion: a.current_version,
    createdAt: a.created_at,
    owner: a.owner
  }));
  const contributors = (raw.contributors ?? []).map((c) => ({
    id: c.id,
    email: c.email,
    displayName: c.display_name
  }));
  return { ...base, assets, contributors };
}

export async function getProjects(filter?: { clientId?: number; organizationId?: number }): Promise<Project[]> {
  const params = new URLSearchParams();
  if (filter?.clientId != null && Number.isFinite(filter.clientId)) {
    params.set("clientId", String(filter.clientId));
  }
  if (filter?.organizationId != null && Number.isFinite(filter.organizationId)) {
    params.set("organizationId", String(filter.organizationId));
  }
  const q = params.toString() ? `?${params.toString()}` : "";
  const data = await apiClient.get<RawProject[]>(`/projects${q}`);
  return data.map(toProject);
}

export async function getProject(id: number): Promise<ProjectDetail> {
  const raw = await apiClient.get<RawProject & { assets: RawAssetSummary[]; contributors: RawContributor[] }>(
    `/projects/${id}`
  );
  return mapProjectDetail(raw);
}

export async function createProject(payload: {
  name: string;
  organizationId: number;
  description?: string;
  clientId?: number | null;
  priority?: string | null;
  dueDate?: string | null;
  status?: string;
  /** Set organizational owner (admin / manager only). */
  ownerUserId?: number | null;
}): Promise<Project> {
  const body: Record<string, unknown> = { name: payload.name.trim(), organizationId: payload.organizationId };
  if (payload.description != null && String(payload.description).trim() !== "") {
    body.description = String(payload.description).trim();
  }
  if (payload.clientId != null && Number.isFinite(Number(payload.clientId))) {
    body.clientId = Number(payload.clientId);
  }
  if (payload.priority != null && String(payload.priority).trim() !== "") {
    body.priority = String(payload.priority).trim();
  }
  if (payload.dueDate != null && String(payload.dueDate).trim() !== "") {
    body.dueDate = String(payload.dueDate).trim();
  }
  if (payload.status != null && String(payload.status).trim() !== "") {
    body.status = String(payload.status).trim();
  }
  if (payload.ownerUserId != null && Number.isFinite(Number(payload.ownerUserId))) {
    body.ownerUserId = Number(payload.ownerUserId);
  }
  const data = await apiClient.post<RawProject>("/projects", body);
  return toProject(data);
}

export async function updateProject(
  id: number,
  payload: {
    name?: string;
    description?: string | null;
    status?: string;
    priority?: string | null;
    dueDate?: string | null;
    clientId?: number | null;
    ownerUserId?: number | null;
    organizationId?: number | null;
  }
): Promise<Project> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.priority !== undefined) body.priority = payload.priority;
  if (payload.dueDate !== undefined) body.dueDate = payload.dueDate;
  if (payload.clientId !== undefined) body.clientId = payload.clientId;
  if (payload.ownerUserId !== undefined) body.ownerUserId = payload.ownerUserId;
  if (payload.organizationId !== undefined) body.organizationId = payload.organizationId;
  const raw = await apiClient.patch<RawProject>(`/projects/${id}`, body);
  return toProject({ ...raw, client_name: (raw as RawProject & { client_name?: string }).client_name });
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}
