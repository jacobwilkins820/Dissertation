import { API_BASE_URL } from "../config/env";
import { getToken, clearToken } from "../utils/storage";

// Fetch wrapper with optional auth + error normalization.
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

type HttpOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

// Internal request helper to share auth and error handling.
async function request<TResponse>(
  path: string,
  options: HttpOptions,
  includeAuth: boolean
): Promise<TResponse> {
  const { method = "GET", body, headers = {}, signal } = options;

  const token = includeAuth ? getToken() : null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 204) return undefined as unknown as TResponse;

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const payloadObj =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : null;
    const message =
      payloadObj && typeof payloadObj.message === "string"
        ? payloadObj.message
        : typeof payload === "string" && payload.trim().length > 0
          ? payload
          : `Request failed (${res.status})`;

    if (res.status === 401) clearToken();

    throw { status: res.status, message, details: payload } satisfies ApiError;
  }

  return (isJson ? payload : (payload as unknown)) as TResponse;
}

// For protected endpoints (default).
export function http<TResponse>(
  path: string,
  options: HttpOptions = {}
): Promise<TResponse> {
  return request<TResponse>(path, options, true);
}

// For public endpoints like login/register without a token.
export function publicHttp<TResponse>(
  path: string,
  options: HttpOptions = {}
): Promise<TResponse> {
  return request<TResponse>(path, options, false);
}
