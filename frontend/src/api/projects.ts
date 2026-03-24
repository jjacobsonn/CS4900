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
  createdAt?: string;
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
  created_at?: string;
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
    createdAt: raw.created_at
  };
}

export async function getProjects(): Promise<Project[]> {
  const data = await apiClient.get<RawProject[]>("/projects");
  return data.map(toProject);
}
