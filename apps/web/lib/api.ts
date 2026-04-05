const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Request failed",
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  credits: number;
  tier: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export const api = {
  auth: {
    login: (input: LoginInput) =>
      fetchApi<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    register: (input: RegisterInput) =>
      fetchApi<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    logout: () =>
      fetchApi<{ message: string }>("/auth/logout", {
        method: "POST",
      }),
    getProfile: (token: string) =>
      fetchApi<AuthUser>("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};
