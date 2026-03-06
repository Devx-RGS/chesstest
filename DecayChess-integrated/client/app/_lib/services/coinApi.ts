/**
 * Coin API — React Query hooks for the coin system.
 * Follows the same pattern as reelApi.ts.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, postApi } from "./apiClient";

// ============ TYPES ============

export interface CoinBalance {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    interactivePlaysUsed: number;
    freeInteractivePlays: number;
}

export interface CoinTransaction {
    _id: string;
    userId: string;
    type: "earn" | "spend";
    amount: number;
    reason: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface CoinHistoryResponse {
    transactions: CoinTransaction[];
    page: number;
    totalPages: number;
    total: number;
}

export interface InteractiveAccessResult {
    free: boolean;
    playsUsed: number;
    totalFree: number;
    cost?: number;
    balance?: number;
}

export interface SpendResult {
    success: boolean;
    newBalance?: number;
    error?: string;
    balance?: number;
}

// ============ QUERY HOOKS ============

/**
 * Fetch current coin balance and stats.
 */
export function useCoinBalance() {
    return useQuery<CoinBalance>({
        queryKey: ["coins", "balance"],
        queryFn: () => fetchApi<CoinBalance>("/coins/balance"),
        staleTime: 30_000, // 30 seconds
    });
}

/**
 * Fetch paginated coin transaction history.
 */
export function useCoinHistory(page: number = 1, limit: number = 20) {
    return useQuery<CoinHistoryResponse>({
        queryKey: ["coins", "history", page, limit],
        queryFn: () => fetchApi<CoinHistoryResponse>(`/coins/history?page=${page}&limit=${limit}`),
    });
}

// ============ MUTATION HOOKS ============

/**
 * Spend coins (hint purchase, interactive unlock, etc.)
 */
export function useSpendCoins() {
    const queryClient = useQueryClient();

    return useMutation<SpendResult, Error, { amount: number; reason: string; metadata?: Record<string, any> }>({
        mutationFn: (data) => postApi<SpendResult>("/coins/spend", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coins"] });
        },
    });
}

/**
 * Check interactive access (free play or requires coins).
 */
export function useCheckInteractiveAccess() {
    const queryClient = useQueryClient();

    return useMutation<InteractiveAccessResult, Error, void>({
        mutationFn: () => postApi<InteractiveAccessResult>("/coins/interactive-access", {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coins", "balance"] });
        },
    });
}
