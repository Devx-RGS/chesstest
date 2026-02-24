import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import { Reel } from "../types/reel";

interface ReelsResponse {
    success: boolean;
    reels: Reel[];
}

export interface Comment {
    _id: string;
    reelId: string;
    userId: {
        _id: string;
        username: string;
        profile?: {
            avatarUrl?: string;
        };
    } | null;
    text: string;
    createdAt: string;
}

interface CommentResponse {
    success: boolean;
    comments: Comment[];
}

// Fetch all reels
async function fetchReels(): Promise<Reel[]> {
    try {
        const response = await apiClient.get<ReelsResponse>("/reels");
        return response.data.reels || [];
    } catch (error) {
        console.error("Error fetching reels:", error);
        return [];
    }
}

// Hook: fetch all published reels
export function useReels() {
    return useQuery({
        queryKey: ["reels"],
        queryFn: fetchReels,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
}

// Hook: single reel by ID
export function useReel(reelId: string) {
    return useQuery({
        queryKey: ["reel", reelId],
        queryFn: async () => {
            const allReels = await fetchReels();
            return allReels.find((r) => r._id === reelId) || null;
        },
        enabled: !!reelId,
    });
}

// Hook: like/unlike
export function useLikeReel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ reelId, action }: { reelId: string; action: "like" | "unlike" }) => {
            const response = await apiClient.patch(`/reels/${reelId}/like`, { action });
            return response.data;
        },
        onError: (err) => console.error("Like mutation failed:", err),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// Hook: fetch user's liked reel IDs
export function useUserLikedReels() {
    return useQuery({
        queryKey: ["user-liked-reels"],
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; likedReelIds: string[] }>("/reels/liked");
            return response.data.likedReelIds || [];
        },
        staleTime: 60 * 1000,
        retry: 1,
    });
}

// Hook: save/unsave
export function useSaveReel() {
    return useMutation({
        mutationFn: async ({ reelId, action }: { reelId: string; action: "save" | "unsave" }) => {
            const response = await apiClient.patch(`/reels/${reelId}/save`, { action });
            return response.data;
        },
        onError: (err) => console.error("Save mutation failed:", err),
    });
}

// Hook: fetch user's saved reel IDs
export function useUserSavedReels() {
    return useQuery({
        queryKey: ["user-saved-reels"],
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; savedReelIds: string[] }>("/reels/saved");
            return response.data.savedReelIds || [];
        },
        staleTime: 60 * 1000,
        retry: 1,
    });
}

// Hook: record view
export function useRecordView() {
    return useMutation({
        mutationFn: async ({ reelId, viewerId }: { reelId: string; viewerId: string }) => {
            const response = await apiClient.post(`/reels/${reelId}/view`, { viewerId });
            return response.data;
        },
    });
}

// Hook: get comments
export function useReelComments(reelId: string) {
    return useQuery({
        queryKey: ["reel-comments", reelId],
        queryFn: async () => {
            const response = await apiClient.get<CommentResponse>(`/reels/${reelId}/comments`);
            return response.data.comments || [];
        },
        enabled: !!reelId,
        staleTime: 60 * 1000,
    });
}

// Hook: post comment (optimistic)
export function usePostComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ reelId, text, userId }: { reelId: string; text: string; userId?: string }) => {
            const response = await apiClient.post(`/reels/${reelId}/comments`, { text, userId });
            return response.data;
        },
        onMutate: async ({ reelId, text }) => {
            await queryClient.cancelQueries({ queryKey: ["reel-comments", reelId] });
            const prev = queryClient.getQueryData<Comment[]>(["reel-comments", reelId]);
            const optimistic: Comment = {
                _id: `temp-${Date.now()}`,
                reelId,
                userId: null,
                text,
                createdAt: new Date().toISOString(),
            };
            queryClient.setQueryData<Comment[]>(["reel-comments", reelId], (old) => [optimistic, ...(old || [])]);
            return { prev };
        },
        onError: (_err, variables, context) => {
            if (context?.prev) queryClient.setQueryData(["reel-comments", variables.reelId], context.prev);
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reel-comments", variables.reelId] });
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// Hook: delete comment (optimistic)
export function useDeleteComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ reelId, commentId }: { reelId: string; commentId: string }) => {
            const response = await apiClient.delete(`/reels/${reelId}/comments/${commentId}`);
            return response.data;
        },
        onMutate: async ({ reelId, commentId }) => {
            await queryClient.cancelQueries({ queryKey: ["reel-comments", reelId] });
            const prev = queryClient.getQueryData<Comment[]>(["reel-comments", reelId]);
            queryClient.setQueryData<Comment[]>(["reel-comments", reelId], (old) =>
                old?.filter((c) => c._id !== commentId) || []
            );
            return { prev };
        },
        onError: (_err, variables, context) => {
            if (context?.prev) queryClient.setQueryData(["reel-comments", variables.reelId], context.prev);
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reel-comments", variables.reelId] });
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// Utility: format count
export function formatCount(count: number): string {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
}

// Utility: difficulty color
export function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
        case "beginner": return "#10B981";
        case "intermediate": return "#F59E0B";
        case "advanced": return "#EF4444";
        default: return "#6B7280";
    }
}

// ============== RANDOM REELS ==============

interface RandomReelsResponse {
    success: boolean;
    data: Reel[];
    count: number;
}

async function fetchRandomReels(limit: number = 20): Promise<Reel[]> {
    try {
        const response = await apiClient.get<RandomReelsResponse>(`/reels/random?limit=${limit}`);
        return response.data.data || [];
    } catch (error) {
        console.error("Error fetching random reels:", error);
        return fetchReels();
    }
}

export function useRandomReels() {
    return useQuery({
        queryKey: ["reels-random"],
        queryFn: () => fetchRandomReels(20),
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
}

// ============== GRANDMASTERS ==============

export interface GrandmasterItem {
    name: string;
    reelCount: number;
    thumbnail: string | null;
}

interface GrandmastersResponse {
    success: boolean;
    data: GrandmasterItem[];
    count: number;
}

interface ReelsByGrandmasterResponse {
    success: boolean;
    data: Reel[];
    grandmaster: { name: string };
    pagination: {
        currentPage: number;
        totalPages: number;
        totalReels: number;
        hasMore: boolean;
    };
}

export function useAvailableGrandmasters() {
    return useQuery({
        queryKey: ["available-grandmasters"],
        queryFn: async () => {
            const response = await apiClient.get<GrandmastersResponse>("/reels/grandmasters");
            return response.data.data || [];
        },
        staleTime: 60 * 1000,
    });
}

export function useReelsByGrandmaster(name: string | null) {
    return useQuery({
        queryKey: ["reels-by-grandmaster", name],
        queryFn: async () => {
            const response = await apiClient.get<ReelsByGrandmasterResponse>(`/reels/grandmaster/${encodeURIComponent(name!)}`);
            return {
                reels: response.data.data || [],
                grandmaster: response.data.grandmaster,
            };
        },
        staleTime: 60 * 1000,
        enabled: !!name,
    });
}
