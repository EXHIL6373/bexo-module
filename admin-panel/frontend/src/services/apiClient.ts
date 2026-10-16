/**
 * Centralized API Client for BEXO Admin Frontend
 * Handles baseURL, authentication tokens, credentials, and error normalization.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const TOKEN_SESSION_KEY = 'bexo_auth_token_session';

class ApiClient {
  private inMemoryToken: string | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  constructor() {
    // Check session storage for active session token
    try {
      this.inMemoryToken = sessionStorage.getItem(TOKEN_SESSION_KEY);
    } catch {
      this.inMemoryToken = null;
    }
  }

  public getBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || '/api/v1';
  }

  public isDemoMode(): boolean {
    // Demo mode is explicitly activated via VITE_DEMO_MODE=true
    return import.meta.env.VITE_DEMO_MODE === 'true';
  }

  public getToken(): string | null {
    return this.inMemoryToken;
  }

  public setToken(token: string | null): void {
    this.inMemoryToken = token;
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_SESSION_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_SESSION_KEY);
      }
    } catch {
      // Session storage unavailable
    }
  }

  public clearToken(): void {
    this.setToken(null);
  }

  public setOnUnauthorized(callback: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = this.getBaseUrl().replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.inMemoryToken) {
      headers.Authorization = `Bearer ${this.inMemoryToken}`;
    }

    const config: RequestInit = {
      credentials: 'include', // Support HttpOnly cookies for secure auth
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.clearToken();
        if (this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }
        throw new ApiError('Session expired or unauthorized. Please sign in again.', 401);
      }

      if (response.status === 403) {
        throw new ApiError('Access forbidden: You lack permission for this administrative action.', 403);
      }

      let json: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        json = await response.json();
      }

      if (!response.ok) {
        const errorMsg =
          json?.message ||
          json?.error ||
          `Request failed with status ${response.status} (${response.statusText})`;
        throw new ApiError(errorMsg, response.status, json?.errors);
      }

      // If backend sends direct data without { success, data } envelope, wrap it
      if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
        return json as ApiResponse<T>;
      }

      return {
        success: true,
        data: (json ?? null) as T,
        message: json?.message,
      };
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        err.message || 'Unable to communicate with the BEXO backend server.',
        0
      );
    }
  }

  public get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
