import { http, publicHttp } from "./http";
import { clearAuth } from "../utils/storage";
import type {
  AuthSession,
  LoginRequest,
  LoginResponse,
  MeResponse,
} from "../auth/auth.types";

// Auth API calls.
/**
 * Login:
 * - Uses publicHttp since no token yet. only for login.
 */
export async function login(req: LoginRequest): Promise<LoginResponse> {
  return publicHttp<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: req,
  });
}

// Fetch current user profile.
export async function me(): Promise<MeResponse> {
  return http<MeResponse>("/api/auth/me", { method: "GET" });
}

// End session and clear client auth state.
export async function logout() {
  try {
    await publicHttp<AuthSession>("/api/auth/logout", { method: "GET" }); //backend doenst actually do anything here but added a response just for consistency
  } finally {
    clearAuth(); // always clear client state even if server errors
  }
}
