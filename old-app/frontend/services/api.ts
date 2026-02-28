import { InternalAxiosRequestConfig } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";

// Re-export the axios client for backwards compatibility
export const apiClient = axiosClient;

// Lazy import to avoid circular dependency
// We use a function to get the store instead of importing at module level
const getAuthStore = () => {
    // Dynamic require to break the circular dependency
    const { useAuthStore } = require("@/stores/authStore");
    return useAuthStore;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        try {
            const token = getAuthStore().getState().token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log("[API] Token attached to:", config.url);
            } else {
                console.log("[API] No token available for:", config.url);
            }
        } catch (e) {
            // Store not initialized yet, skip token
            console.log("[API] Store not initialized yet");
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only auto-logout for auth-related endpoints, not for engagement APIs
            const url = error.config?.url || "";
            const isAuthEndpoint = url.includes("/auth/") || url.includes("/admin/login");
            const isEngagementEndpoint = url.includes("/like") || url.includes("/save") || url.includes("/comment");

            if (isAuthEndpoint && !isEngagementEndpoint) {
                try {
                    // Token expired or invalid - logout user
                    getAuthStore().getState().logout();
                } catch (e) {
                    // Store not initialized yet, skip logout
                }
            } else {
                // For engagement endpoints, just log the error but don't logout
                console.warn("401 on non-auth endpoint:", url);
            }
        }
        return Promise.reject(error);
    }
);

// Create React Query client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Common API functions
export async function fetchApi<T>(endpoint: string): Promise<T> {
    const response = await apiClient.get<T>(endpoint);
    return response.data;
}

export async function postApi<T, D = unknown>(
    endpoint: string,
    data: D
): Promise<T> {
    const response = await apiClient.post<T>(endpoint, data);
    return response.data;
}

export async function putApi<T, D = unknown>(
    endpoint: string,
    data: D
): Promise<T> {
    const response = await apiClient.put<T>(endpoint, data);
    return response.data;
}

export async function deleteApi<T>(endpoint: string): Promise<T> {
    const response = await apiClient.delete<T>(endpoint);
    return response.data;
}
