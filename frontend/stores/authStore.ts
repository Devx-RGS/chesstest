import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { axiosClient } from "@/services/axiosClient";

export interface User {
    id: string;
    username: string;
    email: string;
    profile?: {
        name?: string;
        avatarUrl?: string;
        bio?: string;
        chessRating?: number;
    };
    stats?: {
        reelsWatched?: number;
        puzzlesSolved?: number;
        followers?: number;
        following?: number;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    login: (user: User, token: string, isAdmin?: boolean) => void;
    loginUser: (email: string, password: string) => Promise<boolean>;
    register: (username: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (profile: Partial<User["profile"]>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

// Custom storage adapter for Expo SecureStore
const secureStoreAdapter = {
    getItem: async (name: string): Promise<string | null> => {
        return await SecureStore.getItemAsync(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await SecureStore.deleteItemAsync(name);
    },
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
            error: null,

            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: !!user,
                }),

            setToken: (token) => set({ token }),

            login: (user, token, isAdmin = false) =>
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isAdmin,
                    isLoading: false,
                    error: null,
                }),

            loginUser: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axiosClient.post<{
                        message: string;
                        isAdmin: boolean;
                        token: string;
                        user: { id?: string; username?: string; email: string };
                    }>("/auth/login", { email, password });

                    const { token, user: userData, isAdmin } = response.data;
                    const user: User = {
                        id: userData.id || "",
                        username: userData.username || userData.email,
                        email: userData.email,
                    };

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isAdmin: isAdmin || false,
                        isLoading: false,
                        error: null,
                    });
                    return true;
                } catch (error: any) {
                    const message = error?.response?.data?.error || error?.message || "Login failed";
                    set({ isLoading: false, error: message });
                    return false;
                }
            },

            register: async (username: string, email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axiosClient.post<{
                        message: string;
                        token: string;
                        user: { id: string; username: string; email: string };
                    }>("/auth/register", { username, email, password });

                    const { token, user: userData } = response.data;
                    const user: User = {
                        id: userData.id,
                        username: userData.username,
                        email: userData.email,
                    };

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isAdmin: false,
                        isLoading: false,
                        error: null,
                    });
                    return true;
                } catch (error: any) {
                    const message = error?.response?.data?.error || error?.message || "Registration failed";
                    set({ isLoading: false, error: message });
                    return false;
                }
            },

            logout: () =>
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isAdmin: false,
                    error: null,
                }),

            updateProfile: (profile) => {
                set((state) => {
                    if (state.user) {
                        return {
                            user: {
                                ...state.user,
                                profile: {
                                    ...state.user.profile,
                                    ...profile,
                                },
                            },
                        };
                    }
                    return {};
                });
            },

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => secureStoreAdapter),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                isAdmin: state.isAdmin,
            }),
        }
    )
);

