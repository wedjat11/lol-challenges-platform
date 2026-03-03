import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// Store tokens in memory only (NOT localStorage)
let accessToken: string | null = null;

/**
 * HTTP client for communicating with backend API
 * Handles authentication, automatic token refresh on 401
 */
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

    this.client = axios.create({
      baseURL,
      withCredentials: true, // Include cookies for refresh token
    });

    // Request interceptor: add Bearer token to Authorization header
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor: handle 401 and attempt token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying, and not the refresh endpoint itself
        const isRefreshEndpoint = (originalRequest.url ?? '').includes('/auth/refresh');
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
          // Prevent multiple simultaneous refresh attempts
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
            // Request new access token via refresh endpoint
            const response = await this.client.post("/auth/refresh");
            const newToken = response.data.accessToken;

            // Update in-memory token
            this.setAccessToken(newToken);

            // Retry failed requests with new token
            this.failedQueue.forEach(({ resolve }) => resolve(newToken));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - likely need to login again
            this.clearAccessToken();
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];

            // Redirect to login (handled by calling component)
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Set access token in memory
   */
  public setAccessToken(token: string): void {
    accessToken = token;
  }

  /**
   * Get current access token
   */
  public getAccessToken(): string | null {
    return accessToken;
  }

  /**
   * Clear access token (on logout)
   */
  public clearAccessToken(): void {
    accessToken = null;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return accessToken !== null;
  }

  // Proxy methods for common HTTP verbs
  public get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  public post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  public patch(url: string, data?: any, config?: any) {
    return this.client.patch(url, data, config);
  }

  public put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  public delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
