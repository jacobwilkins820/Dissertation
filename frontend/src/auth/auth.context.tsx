import { createContext } from "react";
import type { AuthUser, LoginRequest } from "./auth.types";

export type AuthContextValue = {
  isAuthenticated: boolean;
  isHydrating: boolean;
  token: string | null;
  user: AuthUser | null;

  login: (req: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);
