/**
 * coinStore — Zustand store for coin balance and interactive play tracking.
 * Persists balance and interactivePlaysUsed to SecureStore for offline display.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { axiosClient } from "../services/axiosClient";

interface CoinState {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    interactivePlaysUsed: number;
    freeInteractivePlays: number;
    isLoading: boolean;

    fetchBalance: () => Promise<void>;
    updateBalance: (newBalance: number) => void;
    optimisticSpend: (amount: number) => void;
    rollbackSpend: (amount: number) => void;
    setInteractivePlays: (used: number, total: number) => void;
    reset: () => void;
}

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

export const useCoinStore = create<CoinState>()(
    persist(
        (set, get) => ({
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            interactivePlaysUsed: 0,
            freeInteractivePlays: 10,
            isLoading: false,

            fetchBalance: async () => {
                set({ isLoading: true });
                try {
                    const response = await axiosClient.get<{
                        balance: number;
                        totalEarned: number;
                        totalSpent: number;
                        interactivePlaysUsed: number;
                        freeInteractivePlays: number;
                    }>("/coins/balance");

                    set({
                        balance: response.data.balance,
                        totalEarned: response.data.totalEarned,
                        totalSpent: response.data.totalSpent,
                        interactivePlaysUsed: response.data.interactivePlaysUsed,
                        freeInteractivePlays: response.data.freeInteractivePlays,
                        isLoading: false,
                    });
                } catch (error) {
                    console.warn("[CoinStore] Failed to fetch balance:", error);
                    set({ isLoading: false });
                }
            },

            updateBalance: (newBalance: number) => {
                set({ balance: newBalance });
            },

            optimisticSpend: (amount: number) => {
                set((state) => ({
                    balance: Math.max(0, state.balance - amount),
                    totalSpent: state.totalSpent + amount,
                }));
            },

            rollbackSpend: (amount: number) => {
                set((state) => ({
                    balance: state.balance + amount,
                    totalSpent: state.totalSpent - amount,
                }));
            },

            setInteractivePlays: (used: number, total: number) => {
                set({
                    interactivePlaysUsed: used,
                    freeInteractivePlays: total,
                });
            },

            reset: () => {
                set({
                    balance: 0,
                    totalEarned: 0,
                    totalSpent: 0,
                    interactivePlaysUsed: 0,
                    freeInteractivePlays: 10,
                    isLoading: false,
                });
            },
        }),
        {
            name: "coin-storage",
            storage: createJSONStorage(() => secureStoreAdapter),
            partialize: (state) => ({
                balance: state.balance,
                interactivePlaysUsed: state.interactivePlaysUsed,
                freeInteractivePlays: state.freeInteractivePlays,
            }),
        }
    )
);
