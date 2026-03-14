"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiClient, setClerkGetToken } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRiotAccount: boolean;
  user: Record<string, unknown> | null;
  logout: () => Promise<void>;
  setHasRiotAccount: (value: boolean) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const [hasRiotAccount, setHasRiotAccount] = useState(false);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  // Expose Clerk's getToken to the API client for silent re-auth on 401
  useEffect(() => {
    if (isLoaded) {
      setClerkGetToken(() => getToken());
    }
  }, [isLoaded, getToken]);

  // When Clerk signs the user in, exchange the Clerk token for a backend JWT
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Clerk signed out — clear backend session
      apiClient.clearAccessToken();
      setUser(null);
      setHasRiotAccount(false);
      setIsSynced(false);
      return;
    }

    // Clerk is signed in — exchange for backend JWT
    const syncWithBackend = async () => {
      // Safety net: if everything hangs (backend unreachable, no axios timeout hit),
      // resolve after 12s so the UI never stays stuck forever.
      const safetyTimer = setTimeout(() => setIsSynced(true), 12000);
      const done = () => { clearTimeout(safetyTimer); setIsSynced(true); };
      try {
        const clerkToken = await getToken();

        // getToken() can return null briefly right after sign-in while
        // the session is being established. Stop the infinite loading state.
        if (!clerkToken) {
          done();
          return;
        }

        const res = await apiClient.post("/auth/clerk-sync", { clerkToken });
        apiClient.setAccessToken(res.data.accessToken as string);
        const backendUser = res.data.user as Record<string, unknown>;
        const isNewUser = Boolean(res.data.isNewUser);
        setUser(backendUser);
        setHasRiotAccount(Boolean(backendUser.hasRiotAccount));
        done();

        // New user → go to onboarding to set username and link LoL account
        if (isNewUser) {
          router.push("/onboarding/link-account");
        }
      } catch {
        // Backend sync failed (e.g. CLERK_SECRET_KEY not configured)
        // Fall back to fetching user with the existing token
        try {
          const userRes = await apiClient.get("/users/me");
          const meUser = userRes.data as Record<string, unknown>;
          setUser(meUser);
          setHasRiotAccount(Boolean(meUser.hasRiotAccount));
          done();
        } catch {
          done();
        }
      }
    };

    void syncWithBackend();
  }, [isLoaded, isSignedIn, getToken, clerkUser?.id]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get("/users/me");
      const meUser = res.data as Record<string, unknown>;
      setUser(meUser);
      setHasRiotAccount(Boolean(meUser.hasRiotAccount));
    } catch {
      // ignore — keep existing state
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    apiClient.clearAccessToken();
    setUser(null);
    setHasRiotAccount(false);
    setIsSynced(false);
  }, [signOut]);

  // isLoading = Clerk still initializing OR Clerk is signed in but not yet synced with backend
  const isLoading = !isLoaded || (isSignedIn === true && !isSynced);
  const isAuthenticated = isLoaded && isSignedIn === true && isSynced;

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    hasRiotAccount,
    user,
    logout,
    setHasRiotAccount,
    refreshUser,
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
