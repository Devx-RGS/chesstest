import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// API base URL - use environment variable or fallback
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

// Create axios instance - this is a standalone file to avoid circular dependencies
export const axiosClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Note: Interceptors are added in api.ts to avoid circular imports
// This file only exports the raw axios instance

export default axiosClient;
