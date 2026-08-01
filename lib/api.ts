/* ============================================================
   Cliente HTTP del backend (NestJS, prefijo /api vía proxy de Next).
   - Adjunta el access token (Bearer) en cada llamada.
   - Desempaqueta el envelope { data, timestamp } del backend.
   - Ante un 401, intenta refrescar el token (cookie httpOnly) y reintenta.
   ============================================================ */

const TOKEN_KEY = "edusync-token";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage no disponible
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    try {
      accessToken = localStorage.getItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }
  return accessToken;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

/** Extrae un mensaje legible del cuerpo de error del backend.
 *  NestJS devuelve los errores de validación como `message: string[]`; aquí los unimos. */
function extractErrorMessage(json: any, statusText: string): string {
  const raw = json && (json.message?.message ?? json.message ?? json.error);
  if (Array.isArray(raw)) return raw.filter(Boolean).join(" · ");
  if (typeof raw === "string" && raw.trim()) return raw;
  return statusText || "Error de red";
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      setAccessToken(null);
      return false;
    }
    const json = await res.json();
    setAccessToken(json?.data?.accessToken ?? null);
    return !!accessToken;
  } catch {
    return false;
  }
}

async function request(path: string, opts: Options, retry = true): Promise<Response> {
  const token = getAccessToken();
  const res = await fetch(`/api${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  // 401 → intenta refrescar una vez y reintenta (salvo en los propios endpoints de auth).
  if (res.status === 401 && retry && !path.startsWith("/auth/login") && !path.startsWith("/auth/refresh")) {
    const ok = await tryRefresh();
    if (ok) return request(path, opts, false);
  }
  return res;
}

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const res = await request(path, opts);
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(json, res.statusText), json);
  }
  // El backend envuelve todo en { data, timestamp }.
  return (json?.data ?? json) as T;
}

/** Sube un archivo (multipart). No fija Content-Type: el navegador pone el boundary. */
export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const doFetch = async (retry = true): Promise<Response> => {
    const token = getAccessToken();
    const res = await fetch(`/api${path}`, {
      method: "POST",
      credentials: "include",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (res.status === 401 && retry) {
      const ok = await tryRefresh();
      if (ok) return doFetch(false);
    }
    return res;
  };
  const res = await doFetch();
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (json && (json.message?.message || json.message)) || res.statusText || "Error de red";
    throw new ApiError(res.status, typeof msg === "string" ? msg : "Error", json);
  }
  return (json?.data ?? json) as T;
}

export const apiGet = <T = unknown>(path: string) => api<T>(path);
export const apiPost = <T = unknown>(path: string, body?: unknown) => api<T>(path, { method: "POST", body });
export const apiPut = <T = unknown>(path: string, body?: unknown) => api<T>(path, { method: "PUT", body });
export const apiPatch = <T = unknown>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body });
export const apiDelete = <T = unknown>(path: string) => api<T>(path, { method: "DELETE" });
