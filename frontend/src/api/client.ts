const DEFAULT_BASE_URL = "/api";

// Resolve API base URL for both Vite runtime and Jest tests.
function resolveApiBaseUrl(): string {
  const testEnvBase = (globalThis as any).import?.meta?.env?.VITE_API_BASE_URL as string | undefined;
  if (testEnvBase) {
    return testEnvBase;
  }

  // Keep eval-based access so Jest does not fail parsing import.meta at load time.
  try {
    // @ts-ignore - import.meta is available at runtime in Vite builds.
    const viteEnv = eval("import.meta.env");
    return viteEnv.VITE_API_BASE_URL || DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

function buildUrl(path: string): string {
  const base = resolveApiBaseUrl();
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

const ROLE_HEADER = "X-Vellum-Role";

function getRoleHeader(): string | undefined {
  try {
    if (typeof localStorage !== "undefined") {
      const role = localStorage.getItem("vellum_role");
      if (role && ["designer", "reviewer", "admin"].includes(role)) return role;
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined)
  };
  const role = getRoleHeader();
  if (role) headers[ROLE_HEADER] = role;

  const response = await fetch(buildUrl(path), {
    ...init,
    headers
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
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) })
};
