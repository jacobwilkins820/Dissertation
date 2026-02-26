import { getToken } from "./storage";

// Misc helpers for auth headers and error parsing.
export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Safely parse JSON responses and fall back to raw text.
export async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type BackendErrorPayload = {
  timestamp?: unknown;
  status?: unknown;
  error?: unknown;
  message?: unknown;
};

// Extract a human-friendly message from backend error Messages.
export function extractErrorMessage(payload: unknown): string {
  if (payload == null) return "Request failed.";

  if (typeof payload === "string") return payload;

  if (typeof payload === "object") {
    const p = payload as BackendErrorPayload;

    if (typeof p.message === "string" && p.message.trim().length > 0) {
      return p.message;
    }

    const err = typeof p.error === "string" ? p.error.trim() : "";
    const status = typeof p.status === "number" ? p.status : undefined;

    if (err && status != null) return `${err} (${status})`;
    if (err) return err;
    if (status != null) return `Request failed (${status}).`;
  }

  return "Request failed.";
}

// Turns unknown errors into a message.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}
