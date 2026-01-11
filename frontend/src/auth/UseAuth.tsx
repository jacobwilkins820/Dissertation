import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./auth.context";

// Auth hook wrapper around AuthContext.
// Read auth state and enforce provider usage.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
