import axios, { AxiosInstance } from "axios";
import { API_BASE_URL } from "../constants";

// Create axios instance - standalone file to avoid circular dependencies
export const axiosClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Note: Interceptors are added in apiClient.ts to avoid circular imports
export default axiosClient;
