import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// Store tokens in memory only (NOT localStorage)
let accessToken: string | null = null;

// Clerk getToken injected by AuthContext on mount — avoids React hooks in this module
let clerkGetToken: (() => Promise<string | null>) | null = null;

export function setClerkGetToken(fn: () => Promise<string | null>): void {
  clerkGetToken = fn;
}

/**
 * HTTP client for communicating with backend API.
 * Auth tokens come from the backend JWT (in memory).
 * On 401, re-exchanges a fresh Clerk session token for a new backend JWT.
 */
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor() {
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

    this.client = axios.create({
      baseURL,
      withCredentials: true,
      timeout: 10000,
    });

    // Attach backend JWT to every request
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // On 401: exchange a fresh Clerk token for a new backend JWT and retry
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isClerkSyncEndpoint = (originalRequest.url ?? "").includes(
          "/auth/clerk-sync",
        );

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isClerkSyncEndpoint
        ) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            if (!clerkGetToken) {
              throw new Error("Clerk not initialized");
            }

            const clerkToken = await clerkGetToken();
            if (!clerkToken) {
              throw new Error("No Clerk session token available");
            }

            const response = await this.client.post("/auth/clerk-sync", {
              clerkToken,
            });
            const newToken = response.data.accessToken as string;

            this.setAccessToken(newToken);
            this.failedQueue.forEach(({ resolve }) => resolve(newToken));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearAccessToken();
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  public setAccessToken(token: string): void {
    accessToken = token;
  }

  public getAccessToken(): string | null {
    return accessToken;
  }

  public clearAccessToken(): void {
    accessToken = null;
  }

  public isAuthenticated(): boolean {
    return accessToken !== null;
  }

  public get(url: string, config?: object) {
    return this.client.get(url, config);
  }

  public post(url: string, data?: unknown, config?: object) {
    return this.client.post(url, data, config);
  }

  public patch(url: string, data?: unknown, config?: object) {
    return this.client.patch(url, data, config);
  }

  public put(url: string, data?: unknown, config?: object) {
    return this.client.put(url, data, config);
  }

  public delete(url: string, config?: object) {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();
