import { apiClient } from "./client";

export interface Client {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
}

interface RawClient {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
}

function toClient(raw: RawClient): Client {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    createdAt: raw.created_at
  };
}

export async function getClients(): Promise<Client[]> {
  const data = await apiClient.get<RawClient[]>("/clients");
  return data.map(toClient);
}

export async function createClient(payload: { name: string; description?: string }): Promise<Client> {
  const raw = await apiClient.post<RawClient>("/clients", {
    name: payload.name.trim(),
    description: payload.description?.trim() || undefined
  });
  return toClient(raw);
}
