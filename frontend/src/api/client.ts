const DEFAULT_BASE_URL = "/api";

// Get API base URL - handles both Vite runtime and Jest test environment
function getApiBaseUrl(): string {
  // In Jest test environment, use global mock
  if (typeof process !== "undefined" && process.env.JEST_WORKER_ID !== undefined) {
    return ((globalThis as any).import?.meta?.env?.VITE_API_BASE_URL as string) || DEFAULT_BASE_URL;
  }
  
  // In Vite runtime, use import.meta.env
  // Use eval to avoid Jest parsing import.meta at parse time
  try {
    // @ts-ignore - import.meta is available at runtime in Vite
    const viteEnv = eval('import.meta.env');
    return viteEnv.VITE_API_BASE_URL || DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    ...init
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) })
};
