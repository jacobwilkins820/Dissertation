//To avoid copy-pasted localStorage.getItem(...) everywhere

const TOKEN_KEY = "sis_auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function clearAuth() {
  localStorage.removeItem("token");
  sessionStorage.clear();
}
