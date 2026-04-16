const DEFAULT_BASE_URL = "/api";
const TOKEN_KEY = "vellum_token";
const ROLE_KEY = "vellum_role";
const USER_KEY = "vellum_user";

declare const __VELLUM_API_BASE_URL__: string | undefined;

// Resolve API base URL for both Vite runtime and Jest tests.
function resolveApiBaseUrl(): string {
  return typeof __VELLUM_API_BASE_URL__ !== "undefined" && __VELLUM_API_BASE_URL__
    ? __VELLUM_API_BASE_URL__
    : DEFAULT_BASE_URL;
}

function buildUrl(path: string): string {
  const base = resolveApiBaseUrl();
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function getBearerToken(): string | undefined {
  try {
    if (typeof localStorage !== "undefined") {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t?.trim()) return t.trim();
    }
  } catch {
    // ignore
  }
  return undefined;
}

function clearSessionAndGoLogin(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    window.location.assign("/");
  }
}

function isLoginPost(path: string, init?: RequestInit): boolean {
  const method = (init?.method ?? "GET").toUpperCase();
  return method === "POST" && (path === "/auth/login" || path.endsWith("/auth/login"));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined)
  };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = getBearerToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers
  });

  if (response.status === 401 && !isLoginPost(path, init)) {
    clearSessionAndGoLogin();
    throw new Error("Session expired or not authenticated.");
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    const raw = await response.text();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { error?: string; message?: string };
        message = parsed.error || parsed.message || raw;
      } catch {
        message = raw;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: typeof FormData !== "undefined" && body instanceof FormData ? body : JSON.stringify(body)
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  patchForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "PATCH", body: form }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
};
