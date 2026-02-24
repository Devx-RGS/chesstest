import { InternalAxiosRequestConfig } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";

// Re-export the axios client
export const apiClient = axiosClient;

// Lazy import to avoid circular dependency with authStore
const getAuthStore = () => {
    const { useAuthStore } = require("../stores/authStore");
    return useAuthStore;
};

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        try {
            const token = getAuthStore().getState().token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (_e) {
            // Store not initialized yet, skip token
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || "";
            const isAuthEndpoint = url.includes("/auth/") || url.includes("/admin/login");
            const isEngagementEndpoint = url.includes("/like") || url.includes("/save") || url.includes("/comment");

            if (isAuthEndpoint && !isEngagementEndpoint) {
                try {
                    getAuthStore().getState().logout();
                } catch (_e) {
                    // Store not initialized
                }
            }
        }
        return Promise.reject(error);
    }
);

// TanStack Query client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

// Generic API helpers
export async function fetchApi<T>(endpoint: string): Promise<T> {
    const response = await apiClient.get<T>(endpoint);
    return response.data;
}

export async function postApi<T, D = unknown>(endpoint: string, data: D): Promise<T> {
    const response = await apiClient.post<T>(endpoint, data);
    return response.data;
}

export async function putApi<T, D = unknown>(endpoint: string, data: D): Promise<T> {
    const response = await apiClient.put<T>(endpoint, data);
    return response.data;
}

export async function deleteApi<T>(endpoint: string): Promise<T> {
    const response = await apiClient.delete<T>(endpoint);
    return response.data;
}
