import { apiClient, postApi, putApi, deleteApi, fetchApi } from "./api";
import { User, useAuthStore } from "@/stores/authStore";
import { clearAllStorage } from "./storageService";

// Auth API response types
interface LoginResponse {
    message: string;
    isAdmin: boolean;
    token: string;
    user: {
        id?: string;
        username?: string;
        email: string;
        role?: string;
    };
}

interface RegisterResponse {
    message: string;
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}

interface ProfileResponse {
    message: string;
    user: {
        id: string;
        username: string;
        email: string;
        profile: User["profile"];
    };
}

interface TokenInfoResponse {
    success: boolean;
    tokenInfo: {
        userId: string | null;
        email: string;
        isAdmin: boolean;
        role: string;
        issuedAt: string;
        expiresAt: string;
        expiresInSeconds: number;
        expiresInMinutes: number;
    };
}

// Auth service functions
export const authService = {
    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await postApi<LoginResponse>("/auth/login", {
            email,
            password,
        });

        // Update auth store with isAdmin flag
        if (response.token) {
            const user: User = {
                id: response.user.id || "",
                username: response.user.username || response.user.email,
                email: response.user.email,
            };
            useAuthStore.getState().login(user, response.token, response.isAdmin);
        }

        return response;
    },

    /**
     * Register a new user
     */
    async register(
        username: string,
        email: string,
        password: string
    ): Promise<RegisterResponse> {
        const response = await postApi<RegisterResponse>("/auth/register", {
            username,
            email,
            password,
        });

        // Auto-login after registration
        if (response.token) {
            const user: User = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email,
            };
            useAuthStore.getState().login(user, response.token);
        }

        return response;
    },

    /**
     * Logout - clears all local storage and auth state
     */
    async logout(): Promise<void> {
        try {
            await postApi("/auth/logout", {});
        } catch (error) {
            // Ignore errors - we're logging out anyway
            console.log("Logout API call failed, proceeding with local logout");
        }

        // Clear all local file storage (game history, preferences, cached reels)
        await clearAllStorage();

        // Clear auth state (expo-secure-store)
        useAuthStore.getState().logout();
    },

    /**
     * Update user profile
     */
    async updateProfile(profileData: {
        name?: string;
        avatarUrl?: string;
        bio?: string;
        chessRating?: number;
    }): Promise<ProfileResponse> {
        const response = await putApi<ProfileResponse>(
            "/auth/setup-profile",
            profileData
        );

        // Update local state
        if (response.user?.profile) {
            useAuthStore.getState().updateProfile(response.user.profile);
        }

        return response;
    },

    /**
     * Get current session/token info
     */
    async getTokenInfo(): Promise<TokenInfoResponse> {
        return await fetchApi<TokenInfoResponse>("/data/me");
    },

    /**
     * Delete user account
     */
    async deleteAccount(): Promise<{ message: string }> {
        const response = await deleteApi<{ message: string }>(
            "/auth/delete-account"
        );

        // Logout after account deletion
        useAuthStore.getState().logout();

        return response;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return useAuthStore.getState().isAuthenticated;
    },

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return useAuthStore.getState().user;
    },

    /**
     * Get current token
     */
    getToken(): string | null {
        return useAuthStore.getState().token;
    },

    /**
     * Check if current user is admin
     */
    isAdmin(): boolean {
        return useAuthStore.getState().isAdmin;
    },
};
