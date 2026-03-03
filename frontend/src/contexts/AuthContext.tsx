"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRiotAccount: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setHasRiotAccount: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // true while we're trying to restore the session on first load
  const [isLoading, setIsLoading] = useState(true);
  const [hasRiotAccount, setHasRiotAccount] = useState(false);
  const [user, setUser] = useState(null);

  // On mount: always attempt to restore the session from the httpOnly
  // lol_refresh cookie set by the backend. The access token lives only
  // in memory and is lost on every page reload, so this refresh call is
  // the only way to tell whether the user is still logged in.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await apiClient.post("/auth/refresh");
        apiClient.setAccessToken(res.data.accessToken);
        const userRes = await apiClient.get("/users/me");
        setUser(userRes.data);
        setHasRiotAccount(userRes.data.hasRiotAccount);
        setIsAuthenticated(true);
      } catch {
        // Clear in-memory token and the stale cookie so the middleware
        // doesn't keep redirecting to /app/dashboard on the next navigation.
        apiClient.clearAccessToken();
        try { await apiClient.post("/auth/logout"); } catch { /* already invalid */ }
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login", { email, password });
    apiClient.setAccessToken(res.data.accessToken);
    setIsAuthenticated(true);
    setUser(res.data.user);
    setHasRiotAccount(res.data.user.hasRiotAccount);
  }, []);

  const register = useCallback(async (data: any) => {
    const res = await apiClient.post("/auth/register", data);
    apiClient.setAccessToken(res.data.accessToken);
    setIsAuthenticated(true);
    setUser(res.data.user);
    setHasRiotAccount(res.data.user.hasRiotAccount);
  }, []);

  const logout = useCallback(() => {
    apiClient.post("/auth/logout").catch(() => {});
    apiClient.clearAccessToken();
    setIsAuthenticated(false);
    setHasRiotAccount(false);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    hasRiotAccount,
    user,
    login,
    register,
    logout,
    setHasRiotAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
