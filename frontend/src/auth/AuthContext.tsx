import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  MeResponse,
} from "./auth.types";
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
} from "../services/auth.api";
import { getToken, setToken, clearToken } from "../utils/storage";
import { AuthContext, type AuthContextValue } from "./auth.context";

// Auth provider with login and logout

// Clean up /me response into the AuthUser shape.
function mapMeToAuthUser(me: MeResponse): AuthUser {
  return {
    id: me.userId,
    email: me.email,
    firstName: me.firstName,
    lastName: me.lastName,
    roleName: me.roleName,
    roleId: me.roleId,
    permissionLevel: me.permissionLevel,
    guardianId: me.guardianId,
  };
}

// Context provider for auth state + actions.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokenState, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);

  const isAuthenticated = !!tokenState && !!user;

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore logout API errors
    } finally {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const me = await meApi();
      setUser(mapMeToAuthUser(me));
    } catch {
      await logout();
    }
  }, [logout]);

  const login = useCallback(async (req: LoginRequest) => {
    const res: LoginResponse = await loginApi(req);

    setToken(res.token);
    setTokenState(res.token);

    setUser({
      id: res.userId,
      email: "",
      firstName: res.firstName,
      lastName: "",
      roleName: res.roleName,
      roleId: null,
      permissionLevel: null,
      guardianId: null,
    });

    await refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    (async () => {
      setIsHydrating(true);
      try {
        const token = getToken();
        setTokenState(token);
        if (token) await refreshMe();
        else setUser(null);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [refreshMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isHydrating,
      token: tokenState,
      user,
      login,
      logout,
      refreshMe,
    }),
    [isAuthenticated, isHydrating, tokenState, user, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
