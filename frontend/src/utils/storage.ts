// Local storage helpers for auth token/session data.
// aviods having to repeat the key string everywhere.

const TOKEN_KEY = "sis_auth_token";

// Read the auth token from local storage.
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// set the auth token to local storage.
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Clear the auth token from local storage.
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Clear any other auth artifacts in storage.
export function clearAuth() {
  localStorage.removeItem("token");
  sessionStorage.clear();
}
