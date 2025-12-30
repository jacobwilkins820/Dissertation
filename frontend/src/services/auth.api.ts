import { http, publicHttp } from "./http";
import { clearAuth } from "../utils/storage";
import type {
  AuthSession,
  LoginRequest,
  LoginResponse,
  MeResponse,
} from "../auth/auth.types";

/**
 * Login:
 * - Uses publicHttp since no token yet. only for login/register.
 */
export async function login(req: LoginRequest): Promise<LoginResponse> {
  return publicHttp<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: req,
  });
}

export async function me(): Promise<MeResponse> {
  return http<MeResponse>("/api/auth/me", { method: "GET" });
}

export async function logout() {
  try {
    await publicHttp<AuthSession>("/api/auth/logout", { method: "GET" }); //backend doenst actually do anything here but added a response just for consistency
  } finally {
    clearAuth(); // always clear client state even if server errors
  }
}
